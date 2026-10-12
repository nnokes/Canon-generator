// [v8] wrapper for the canon renderer (M2; see docs/M2-checklist.md). Glue only:
// the logic is in code/lib/cg-canon.js, cg-presets.js and cg-scales.js.
// JS never schedules: render fills the player's [coll] (one row per note, the
// delay to the next note first), and Max plays it (PLAN.md 4.2, design 1).
//
// Messages                      Outlet 0
//   presets                       menu clear, menu append <name> ...    the preset chooser
//   tunings                       tmenu clear, tmenu append <name> ...  the tuning chooser
//   preset <i>                    menu set <i>, then as render          load a preset
//   tuning <i>                    as render                             the canon in starter system i
//   tempo <bpm>                   as render
//   render                        coll clear, coll <i> <ms to next> <hz> <gain L> <gain R>
//                                   <total ms> <envelope...>, bpm <tempo>, editor ..., status ...
//   select <voice>                editor <i> <name> <delay> <steps> <transform 0-3>
//                                   <time scale> <register> <passes>
//   delay|interval|transform|timescale|register|passes <value>
//                                 edits the selected voice, then as render
//   loadspec <full path>          as render                             a spec (JSON)
//   savespec <full path>          status saved ...                      the current spec
//                                 (not "save": [v8] calls a save() function when the patch is saved)
//   info                          status ...
// Errors come out as: error <message>. Every output starts with a selector.

autowatch = 1;
inlets = 1;
outlets = 1;

const engine = require("cg-canon");
const library = require("cg-presets");
const scaleLibrary = require("cg-scales");
const tuningLibrary = require("cg-tuning");
const files = require("cg-file");

const TRANSFORMS = ["P", "I", "R", "RI"];
const LEVEL = 0.25; // a note's peak gain at velocity 127, before the partial weights

let spec = library.preset(0);
let selected = 0;
let rendered = null;

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
    spec = library.preset(index);
    selected = 0;
    outlet(0, "menu", "set", index);
    update();
  });
}

function tuning(index) {
  attempt(() => {
    scaleLibrary.starter(index); // fails here, not mid-render, if there's no such starter
    spec.system = { type: "starter", index }; // groups with their own system keep it
    update();
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

function loadspec(path) {
  attempt(() => {
    spec = JSON.parse(files.readLines(String(path)).join("\n"));
    selected = 0;
    update();
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

// ---------------------------------------------------------------- helpers

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

// Render, refill the player's queue, write cg.events, update the editor.
function update() {
  rendered = engine.render(spec);
  const ms = 60000 / rendered.tempo;
  const events = rendered.events;
  const count = rendered.voices.length;
  outlet(0, "coll", "clear");
  events.forEach((e, i) => {
    const next = events[i + 1];
    const pan = count > 1 ? e.voice / (count - 1) : 0.5;
    const total = e.dur * ms;
    const attack = Math.min(10, total / 4);
    const release = Math.min(120, total / 3);
    const amp = (LEVEL * e.vel) / 127;
    outlet(0, "coll", i, next ? (next.t - e.t) * ms : -1, tuningLibrary.midiToHz(e.pitch),
      Math.cos((pan * Math.PI) / 2), Math.sin((pan * Math.PI) / 2), total,
      amp, attack, amp, Math.max(0, total - attack - release), 0, release);
  });
  const dict = new Dict("cg.events");
  dict.parse(JSON.stringify({
    name: rendered.name, tempo: rendered.tempo, voices: rendered.voices,
    events: events.map((e) => [e.t, e.dur, e.pitch, e.vel, e.voice]),
  }));
  outlet(0, "bpm", rendered.tempo);
  if (selected >= canonVoices().length) selected = 0;
  showEditor();
  announce();
}
update.local = 1;

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
