// [v8] wrapper for the canon renderer (M2; see docs/M2-checklist.md). Glue only:
// the logic is in code/lib/cg-canon.js, cg-presets.js and cg-scales.js.
// JS never schedules: render fills the player's [coll] (one row per note, the
// delay to the next note first), and Max plays it (PLAN.md 4.2, design 1).
//
// Messages                      Outlet 0
//   presets                       menu clear, menu append <name> ...    the preset chooser
//   tunings                       tmenu clear, tmenu append <name> ...  the tuning chooser
//   preset <i>                    menu set <i>, then as render          load a preset; a loaded .mid
//                                                                        stays its melody
//   presetmelody                  as render, melody preset <name>       forget the .mid: the preset's
//                                                                        own melody again
//   tuning <i>                    as render                             the canon in starter system i
//                                                                        (a loaded .mid is re-mapped)
//   tempo <bpm>                   as render
//   render                        coll clear, coll <i> <ms to next> <hz> <gain L> <gain R>
//                                   <total ms> <envelope...>, bpm <tempo>, editor ..., status ...
//                                 An MPE note's row: coll <i> <ms to next> mpe <ms> <bend + note-on:
//                                   6 bytes> <note-off: 3 bytes>; with any MPE voice, the zone
//                                   setup first as midi <bytes> lines
//   output hz|drift|midi          every voice to the Hz voices, or MPE to Drift inside Max, or MPE
//                                   to MIDI out (or 0/1/2; "mpe" means drift). One destination at
//                                   a time: a change sends panic first (to the old one), then as
//                                   render, which sends mpeto 1 (Drift) or 2 (MIDI out) for the gate.
//                                   Bends are for each destination's range: Drift +/-2, MIDI out
//                                   +/-48 (cg-mpe RANGES)
//   select <voice>                editor <i> <name> <delay> <steps> <transform 0-3>
//                                   <time scale> <register> <passes>
//   delay|interval|transform|timescale|register|passes <value>
//                                 edits the selected voice, then as render
//   loadmidi <full path>          status midi ..., then as render       a .mid melody becomes
//                                                                        the dux of every canon
//   midiline top|bottom|track     re-reads the melody with that line (or 0-2)
//   midimap exact|nearest|degree  ... with that pitch mapping (or 0-2)
//   midiquantize <beats>          ... on that grid (0: off)
//   miditrack <n>                 ... from track n only (-1: all tracks)
//   loadspec <full path>          as render                             a spec (JSON)
//   usespec <dict name>           as render                             a spec from a dict (the
//                                                                        answer finder's pick)
//   savespec <full path>          status saved ...                      the current spec
//                                 (not "save": [v8] calls a save() function when the patch is saved)
//   info                          status ...
//   profile <name>                rules <name>, then as analysis below  the rules the piano roll
//                                                                        marks (canon, florid,
//                                                                        fux-strict, spectral, free)
// Whenever the melody changes: melody <file> | melody preset <name> | melody spec <name>.
// After every render (and every profile), the analysis (M3 part F): the dict cg.report gets
// the verdict (violations, the dissonance curve), then roll rendered (for the piano roll)
// and analysis <profile> rules: <n> faults / cost <x> (its own selector: the panel prints it).
// Errors come out as: error <message>. Every output starts with a selector.

autowatch = 1;
inlets = 1;
outlets = 1;

const engine = require("cg-canon");
const library = require("cg-presets");
const scaleLibrary = require("cg-scales");
const tuningLibrary = require("cg-tuning");
const mpe = require("cg-mpe");
const files = require("cg-file");
const io = require("cg-io");
const analyzer = require("cg-analyze");
const ruleLibrary = require("cg-rules");

const TRANSFORMS = ["P", "I", "R", "RI"];
const LINES = ["top", "bottom", "track"];
const MAPS = ["exact", "nearest", "degree"];
const OUTPUTS = ["hz", "drift", "midi"];
const MPE_TO = { drift: 1, midi: 2 }; // the patch's [gate 2] outlets

// Named dicts live only while something holds them: Max frees one when its last
// reference goes, and V8 collects a temporary Dict whenever it likes (M3 session
// 1: cg.spec vanished between finder runs until the .mid was reloaded). So every
// dict is held for the script's whole life.
const specDict = new Dict("cg.spec"); // the current spec, for the answer finder
const eventsDict = new Dict("cg.events"); // the rendered events
const reportDict = new Dict("cg.report"); // the analysis, for the piano roll
const held = new Map(); // dicts read by name (usespec)
function heldDict(name) {
  if (!held.has(name)) held.set(name, new Dict(name));
  return held.get(name);
}
heldDict.local = 1;
const LEVEL = 0.25; // a note's peak gain at velocity 127, before the partial weights

let spec = library.preset(0);
let selected = 0;
let rendered = null;
let midi = null; // the last .mid file: { name, parsed }
let presetIndex = 0; // the preset last picked (null after loadspec)
const midiOptions = { line: "top", map: "exact", quantize: 0, track: -1 };
let rules = "canon"; // the rule profile the analysis uses

function presets() {
  outlet(0, "menu", "clear");
  for (const name of library.names()) outlet(0, "menu", "append", name);
}

function tunings() {
  outlet(0, "tmenu", "clear");
  for (const name of scaleLibrary.names()) outlet(0, "tmenu", "append", name);
}

function preset(index) {
  attempt(() => {
    const previous = { spec, presetIndex, selected };
    spec = library.preset(index);
    presetIndex = index;
    selected = 0;
    try {
      if (midi) applyMidi(); // your melody stays; the preset gives the canon's shape
      else {
        update();
        announceMelody();
      }
    } catch (e) {
      ({ spec, presetIndex, selected } = previous);
      throw e;
    }
    outlet(0, "menu", "set", index);
    if (midi) outlet(0, "status", "midi", "kept:", midi.name, "as the dux of", library.names()[index]);
  });
}

function presetmelody() {
  attempt(() => {
    midi = null;
    if (presetIndex === null) {
      outlet(0, "status", "midi", "forgotten, but this spec came from a file: its own melody stays");
      announceMelody();
      return;
    }
    // The preset's own dux back, keeping the tuning, tempo and voice edits.
    const original = library.preset(presetIndex);
    const originals = original.groups || [original];
    (spec.groups || [spec]).forEach((g, i) => {
      g.dux = originals[Math.min(i, originals.length - 1)].dux;
    });
    update();
    announceMelody();
  });
}

function tuning(index) {
  attempt(() => {
    scaleLibrary.starter(index); // fails here, not mid-render, if there's no such starter
    const before = spec.system;
    spec.system = { type: "starter", index }; // groups with their own system keep it
    try {
      if (midi) applyMidi(); // nearest and degree re-map to the new system
      else update();
    } catch (e) {
      spec.system = before;
      throw e;
    }
  });
}

function tempo(bpm) {
  attempt(() => {
    if (!(bpm > 0)) throw new Error(`tempo must be above 0, got ${bpm}`);
    spec.tempo = bpm;
    update();
  });
}

function render() {
  attempt(update);
}

// Every voice (canon and free) to the Hz voices, or MPE to one destination.
// The destination is kept in the spec (mpeTo), so a saved spec remembers it.
function output(which) {
  attempt(() => {
    let to = typeof which === "number" ? OUTPUTS[which] : String(which);
    if (to === "mpe") to = "drift";
    if (!OUTPUTS.includes(to)) throw new Error(`output must be one of ${OUTPUTS.join(" ")}, got ${which}`);
    outlet(0, "panic"); // stop what's sounding on the old destination before switching
    for (const v of [...canonVoices(), ...(spec.free || [])]) v.out = to === "hz" ? "hz" : "mpe";
    if (to !== "hz") spec.mpeTo = to;
    update();
  });
}

function select(index) {
  attempt(() => {
    voiceAt(index);
    selected = index;
    showEditor();
  });
}

// The voice editor: each edit changes the selected voice in the spec.
function delay(beats) {
  edit((v) => {
    if (!(beats >= 0)) throw new Error(`delay must be 0 or more, got ${beats}`);
    v.delay = beats;
  });
}

function interval(steps) {
  edit((v) => {
    if (!Number.isInteger(steps)) throw new Error(`the editor's interval is in whole scale steps, got ${steps}`);
    v.interval = steps;
  });
}

function transform(which) {
  edit((v) => {
    const name = typeof which === "number" ? TRANSFORMS[which] : String(which);
    if (!TRANSFORMS.includes(name)) throw new Error(`transform must be one of ${TRANSFORMS.join(" ")}, got ${which}`);
    v.transform = name;
    delete v.segment;
  });
}

function timescale(scale) {
  edit((v) => {
    if (!(scale > 0)) throw new Error(`time scale must be above 0, got ${scale}`);
    v.timeScale = scale;
    delete v.tapeSpeed;
  });
}

function register(octaves) {
  edit((v) => {
    v.register = octaves;
  });
}

function passes(count) {
  edit((v) => {
    v.loop = count;
  });
}

function loadmidi(path) {
  attempt(() => {
    const name = String(path).split(/[/:\\]/).pop();
    midi = { name, parsed: io.parseMidi(files.readBytes(String(path))) };
    applyMidi();
  });
}

function midiline(which) {
  midiOption("line", which, LINES);
}

function midimap(which) {
  midiOption("map", which, MAPS);
}

function midiquantize(beats) {
  midiOption("quantize", beats);
}

function miditrack(track) {
  midiOption("track", track);
}

function loadspec(path) {
  attempt(() => {
    const loaded = JSON.parse(files.readLines(String(path)).join("\n"));
    const previous = spec;
    spec = loaded;
    try {
      update();
    } catch (e) {
      spec = previous;
      throw e;
    }
    selected = 0;
    midi = null; // the spec carries its own melody
    presetIndex = null;
    announceMelody();
  });
}

// A spec from a named dict: the answer finder's pick (cg.audition), played as it
// is. A loaded .mid stays loaded, so a preset or tuning change still re-maps it.
function usespec(name) {
  attempt(() => {
    const text = heldDict(String(name)).stringify();
    const loaded = text ? JSON.parse(text) : null;
    if (!loaded || (!loaded.dux && !loaded.groups)) throw new Error(`usespec: no canon spec in the dict ${name}`);
    const previous = { spec, presetIndex, selected };
    spec = loaded;
    try {
      update();
    } catch (e) {
      ({ spec, presetIndex, selected } = previous);
      throw e;
    }
    selected = 0;
    presetIndex = null;
    announceMelody();
  });
}

function savespec(path) {
  attempt(() => {
    files.writeText(String(path), JSON.stringify(spec, null, 2) + "\n");
    outlet(0, "status", "saved", String(path));
  });
}

function info() {
  attempt(announce);
}

// The rules the piano roll marks. An unknown name is refused, and the menu
// shows the rules still in use.
function profile(name) {
  attempt(() => {
    ruleLibrary.resolve(String(name)); // throws on an unknown profile
    rules = String(name);
    if (rendered) analysis();
  });
  outlet(0, "rules", rules);
}

// ---------------------------------------------------------------- helpers

// Sets a MIDI option (a name, or its index in `names`), then re-reads the
// melody if a file is loaded. A bad value leaves the option as it was.
function midiOption(key, value, names) {
  attempt(() => {
    const before = midiOptions[key];
    midiOptions[key] = names && typeof value === "number" ? names[value] : value;
    if (names && !names.includes(midiOptions[key])) {
      midiOptions[key] = before;
      throw new Error(`${key} must be one of ${names.join(" ")}, got ${value}`);
    }
    if (!midi) return;
    try {
      applyMidi();
    } catch (e) {
      midiOptions[key] = before;
      throw e;
    }
  });
}
midiOption.local = 1;

// The loaded melody into every canon group's dux, read in that group's scale
// system (for nearest and degree). The spec keeps the notes themselves, so a
// saved spec needs no .mid. The file's tempo is used if it has one.
function applyMidi() {
  const next = JSON.parse(JSON.stringify(spec));
  const groups = next.groups || [next];
  let report = null;
  for (const g of groups) {
    const system = scaleLibrary.fromSpec(g.system || next.system);
    const melody = io.melodyFromMidi(midi.parsed, { ...midiOptions, system });
    g.dux = { source: "list", notes: melody.notes, from: midi.name };
    report = melody.report;
  }
  if (report.tempo) next.tempo = report.tempo;
  const previous = spec;
  spec = next;
  try {
    update();
  } catch (e) {
    spec = previous;
    throw e;
  }
  // No ";" atoms: Max reads a semicolon as the end of a message.
  outlet(0, "status", "midi", midi.name + ":", report.notes, "notes,", report.rests, "rests,", report.beats, "beats,",
    "line", report.line + ",", "map", report.map + ",", "quantize", report.quantize + ",",
    "dropped", report.dropped + ",", "cut", report.cut + ",", "glides", report.glides + ",", "trimmed", report.trimmed + ",",
    report.tempo ? "tempo " + report.tempo + " bpm" : "no tempo in the file (kept " + spec.tempo + " bpm)");
  for (const warning of midi.parsed.warnings) outlet(0, "status", "midi", "warning:", warning);
  announceMelody();
}
applyMidi.local = 1;

// Which melody the canons use, for the panel's [print midi_file].
function announceMelody() {
  if (midi) {
    outlet(0, "melody", midi.name);
    return;
  }
  const first = (spec.groups || [spec])[0];
  if (first.dux && first.dux.from) outlet(0, "melody", first.dux.from);
  else if (presetIndex !== null) outlet(0, "melody", "preset", library.names()[presetIndex]);
  else outlet(0, "melody", "spec", spec.name || "untitled");
}
announceMelody.local = 1;

// The canon voices in order (groups flattened), as the renderer numbers them.
function canonVoices() {
  return spec.groups ? spec.groups.flatMap((g) => g.voices) : spec.voices;
}
canonVoices.local = 1;

function voiceAt(index) {
  const voices = canonVoices();
  if (!Number.isInteger(index) || index < 0 || index >= voices.length) {
    throw new Error(`no canon voice ${index} (0-${voices.length - 1}); free voices are edited in the spec file`);
  }
  return voices[index];
}
voiceAt.local = 1;

function edit(change) {
  attempt(() => {
    const voice = voiceAt(selected);
    const before = JSON.stringify(voice);
    change(voice);
    try {
      update();
    } catch (e) {
      Object.keys(voice).forEach((k) => delete voice[k]);
      Object.assign(voice, JSON.parse(before)); // a bad edit leaves the spec as it was
      throw e;
    }
  });
}
edit.local = 1;

// Render, refill the player's queue, write cg.events and cg.spec, update the editor.
function update() {
  rendered = engine.render(spec);
  const ms = 60000 / rendered.tempo;
  const events = rendered.events;
  const count = rendered.voices.length;
  // MPE notes each get a member channel; any beyond 15 at once go to the Hz voices.
  const mpeIndex = events.map((e, i) => (rendered.voices[e.voice].out === "mpe" ? i : -1)).filter((i) => i >= 0);
  const channels = new Map();
  mpe.allocate(mpeIndex.map((i) => events[i])).forEach((ch, k) => channels.set(mpeIndex[k], ch));
  const overflow = [...channels.values()].filter((ch) => ch === null).length;
  const to = spec.mpeTo === "midi" ? "midi" : "drift";
  const range = mpe.RANGES[to]; // Drift keeps its own bend range (cg-mpe)
  if (mpeIndex.length) {
    outlet(0, "mpeto", MPE_TO[to]); // the gate first, so the zone setup reaches the right place
    for (const bytes of mpe.zoneConfig({ range })) outlet(0, "midi", ...bytes);
  }
  outlet(0, "coll", "clear");
  events.forEach((e, i) => {
    const next = events[i + 1];
    const delta = next ? (next.t - e.t) * ms : -1;
    const channel = channels.get(i);
    if (channel) {
      const on = mpe.noteOn(e.pitch, e.vel, channel, range).flat();
      const off = mpe.noteOff(e.pitch, channel, range).flat();
      outlet(0, "coll", i, delta, "mpe", e.dur * ms, ...on, ...off);
      return;
    }
    const pan = count > 1 ? e.voice / (count - 1) : 0.5;
    const total = e.dur * ms;
    const attack = Math.min(10, total / 4);
    const release = Math.min(120, total / 3);
    const amp = (LEVEL * e.vel) / 127;
    outlet(0, "coll", i, delta, tuningLibrary.midiToHz(e.pitch),
      Math.cos((pan * Math.PI) / 2), Math.sin((pan * Math.PI) / 2), total,
      amp, attack, amp, Math.max(0, total - attack - release), 0, release);
  });
  specDict.parse(JSON.stringify(spec));
  eventsDict.parse(JSON.stringify({
    name: rendered.name, tempo: rendered.tempo, voices: rendered.voices,
    events: events.map((e) => [e.t, e.dur, e.pitch, e.vel, e.voice]),
  }));
  outlet(0, "bpm", rendered.tempo);
  if (selected >= canonVoices().length) selected = 0;
  showEditor();
  announce();
  // The canon plays whether or not it can be analyzed.
  try {
    analysis();
  } catch (e) {
    outlet(0, "error", "analysis: " + (e && e.message ? e.message : String(e)));
  }
  if (mpeIndex.length) {
    const used = new Set([...channels.values()].filter((ch) => ch !== null)).size;
    outlet(0, "status", "mpe:", mpeIndex.length - overflow, "notes on", used, `channels (2-16, bend +/-${range})`,
      "to", (to === "midi" ? "MIDI out" : "Drift")
        + (overflow ? ", " + overflow + " beyond 15 at once went to the Hz voices" : ""));
  }
}
update.local = 1;

// Judge the rendered canon (cg-analyze) with the spec's scale system, meter and
// consonance model, and the chosen rules; write the verdict for the piano roll.
function analysis() {
  const group = spec.groups ? spec.groups[0] : spec;
  const system = scaleLibrary.fromSpec(group.system || spec.system);
  const report = analyzer.analyze(rendered, { system, meter: spec.meter, consonance: spec.consonance, profile: rules });
  reportDict.parse(JSON.stringify({
    name: rendered.name, profile: rules, model: report.model, hard: report.hard, cost: report.cost,
    meter: report.meter, period: report.metrics.period,
    violations: report.violations.map((v) => ({
      t: v.t, bar: v.bar, beat: v.beat, rule: v.rule, voices: v.voices || [], hard: Boolean(v.hard), detail: v.detail || "",
    })),
    curve: report.metrics.dissonance.points,
  }));
  outlet(0, "roll", "rendered");
  outlet(0, "analysis", rules, "rules:", report.hard, report.hard === 1 ? "fault" : "faults", "/ cost",
    Math.round(report.cost * 100) / 100);
}
analysis.local = 1;

function showEditor() {
  const v = voiceAt(selected);
  const steps = typeof v.interval === "number" ? v.interval
    : v.interval && v.interval.steps !== undefined ? v.interval.steps : 0;
  outlet(0, "editor", selected, v.name || rendered.voices[selected].name, v.delay || 0, steps,
    Math.max(0, TRANSFORMS.indexOf(v.transform || "P")), v.timeScale || 1, v.register || 0, v.loop || 1);
}
showEditor.local = 1;

function announce() {
  if (!rendered) return;
  const seconds = (rendered.length * 60) / rendered.tempo;
  outlet(0, "status", rendered.name + ":", rendered.voices.length, "voices,", rendered.events.length, "notes,",
    Math.round(rendered.length * 100) / 100, "beats at", rendered.tempo, "bpm (" + Math.round(seconds) + " s)");
}
announce.local = 1;

function attempt(action) {
  try {
    action();
  } catch (e) {
    outlet(0, "error", e && e.message ? e.message : String(e));
  }
}
attempt.local = 1;
