// [v8] wrapper for the generator (M4 part G; PLAN.md 3.5). Glue only: the
// search is cg-generate's. It writes new first-species canons, one per seed, in
// time slices from a Task so Max's interface stays responsive, and lists them.
// Picking one writes its spec to the dict cg.generated, and the patch has the
// canon panel play it (and its piano roll show it), as the finder's picks do.
//
// Each panel box has its own message, and every setting echoes back as
// show <name> <value>, so the boxes always show what the generator holds; a
// refused value snaps back.
//
// Messages                       Outlet 0
//   settings                       show <name> <value>, for every setting
//   mode <name>                    show mode ...       ionian dorian phrygian lydian mixolydian aeolian
//                                                      (Fux's modes in 12-EDO; the final is degree 0),
//                                                      or panel: the canon panel's tuning (cg.spec)
//   notes <n>                      show notes ...      the dux's length
//   below|above <steps>            show ...            the dux's range, in steps from the final
//   voices <2-4>                   show voices ...     the melody and 1-3 followers (M4 part D); the
//                                                      rules follow: fux-strict for two voices,
//                                                      fux-relaxed for more (unless you chose another)
//   round <0|1>                    show round ...      a round instead (M4 part E): every voice sings
//                                                      the tune at the unison, each a section after the
//                                                      last; notes, the followers and the close are
//                                                      then unused (the tune is voices x section bars)
//   section <bars>                 show section ...    a round's section, in bars (2-16)
//   interval <steps>               show interval ...   the first follower's interval, in scale steps
//   delay <bars>                   show delay ...      the first follower's delay, in bars
//   interval2|delay2 <n>           show ...            the second follower (3 or 4 voices)
//   interval3|delay3 <n>           show ...            the third follower (4 voices)
//   profile <name>                 show profile ...    fux-strict (default), fux-relaxed, canon, florid,
//                                                      spectral, free
//   cadence <6|8|3|1>              show cadence ...    the close: a sixth to the octave, a third to the unison
//   seed <n>, count <n>            show ...            the first seed, and how many canons (one per seed)
//   taste <0|1>                    show taste ...      the melodic taste cost (ours) on or off
//   slicems <ms>                   show slicems ...    the time-slice budget: work per slice
//   budget <n>                                         candidate notes per canon (default 20000)
//   run                            progress ..., results clear, results append <text> ...,
//                                  results set 0, progress done: ..., done <n> <ms> <slices>
//                                  <ms per slice>, status ... (a line per seed that found nothing)
//   stop                           status stopped
//   pick <i>                       audition cg.generated (the patch: stop, usespec, play)
//   info                           status ...
// Errors come out as: error <message>. Every output starts with a selector, and
// no text carries a comma or semicolon: Max reads those as separators.
// No global function here may share a name with a Max built-in (a test checks).

autowatch = 1;
inlets = 1;
outlets = 1;

const generator = require("cg-generate");
const finder = require("cg-finder");
const rules = require("cg-rules");
const scales = require("cg-scales");
const tuning = require("cg-tuning");

// Fux's modes, in 12-EDO, each on its final (Study of Counterpoint, pp. 18-19).
const MODES = {
  ionian: { mode: [0, 2, 4, 5, 7, 9, 11], midi: 60 },
  dorian: { mode: [0, 2, 3, 5, 7, 9, 10], midi: 62 },
  phrygian: { mode: [0, 1, 3, 5, 7, 8, 10], midi: 64 },
  lydian: { mode: [0, 2, 4, 6, 7, 9, 11], midi: 65 },
  mixolydian: { mode: [0, 2, 4, 5, 7, 9, 10], midi: 55 },
  aeolian: { mode: [0, 2, 3, 5, 7, 8, 10], midi: 57 },
};
const CADENCES = ["6|8", "3|1"];
const NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

// What the panel shows, one entry per box.
// The followers' defaults (M4 part D): the fifth above a bar later, the octave
// below four bars later, the fourth below five bars later (C, G, C, G entries,
// as a fugue's exposition): with 12 notes every seed of the first four finds one.
// A round's default section (M4 part E): 4 bars, so 3 voices sing a 12-note tune;
// every seed of the first four finds one, in every mode.
const state = {
  mode: "ionian", notes: 12, below: 3, above: 9, voices: 2, round: 0, section: 4, interval: 4, delay: 1,
  interval2: -7, delay2: 4, interval3: -3, delay3: 5, profile: "fux-strict", cadence: "6|8", seed: 1, count: 4,
  taste: 1, slicems: 20,
};
const whole = (low, high) => (v) => Number.isInteger(v) && v >= low && v <= high;
const CHECKS = {
  notes: [whole(2, 64), "notes: a whole number from 2 to 64"],
  below: [whole(0, 14), "below: whole steps from 0 to 14"],
  above: [whole(0, 21), "above: whole steps from 0 to 21"],
  voices: [whole(2, 4), "voices: 2 3 or 4"],
  section: [whole(2, 16), "section: whole bars from 2 to 16"],
  interval: [whole(-21, 21), "interval: whole scale steps from -21 to 21"],
  delay: [whole(0, 16), "delay: whole bars from 0 to 16"],
  interval2: [whole(-21, 21), "interval2: whole scale steps from -21 to 21"],
  delay2: [whole(0, 16), "delay2: whole bars from 0 to 16"],
  interval3: [whole(-21, 21), "interval3: whole scale steps from -21 to 21"],
  delay3: [whole(0, 16), "delay3: whole bars from 0 to 16"],
  seed: [Number.isInteger, "seed: a whole number"],
  count: [whole(1, 32), "count: a whole number from 1 to 32"],
  slicems: [(v) => v > 0, "time slice: above 0 ms"],
};
const extra = { budget: 20000 }; // candidate notes per canon: a canon that exists is found in far fewer
let job = null; // { world, seeds, index, it, found, failures, started, slices, busy }
let results = [];
const task = new Task(tick);
task.interval = 1;
// Named dicts live only while something holds them (M3 session 1): held for the
// script's whole life.
const specDict = new Dict("cg.spec"); // the canon panel's spec: its tuning (mode panel) and tempo
const generatedDict = new Dict("cg.generated"); // a picked canon, read by the canon wrapper

function attempt(action) {
  try {
    action();
  } catch (e) {
    outlet(0, "error", String(e && e.message ? e.message : e));
  }
}
attempt.local = 1;

function show(name) {
  outlet(0, "show", name, state[name]);
}
show.local = 1;

// Set one number, or report why not; either way the panel shows what's held.
function setNumber(name, value) {
  attempt(() => {
    const [ok, label] = CHECKS[name];
    if (typeof value !== "number" || !Number.isFinite(value) || !ok(value)) throw new Error(`${label}: got ${value}`);
    state[name] = value;
  });
  show(name);
}
setNumber.local = 1;

function settings() {
  for (const name of Object.keys(state)) show(name);
}

function mode(name) {
  attempt(() => {
    const m = String(name);
    if (!MODES[m] && m !== "panel") throw new Error(`mode: one of ${Object.keys(MODES).join(" ")} panel, got ${m}`);
    state.mode = m;
  });
  show("mode");
}

function notes(n) { setNumber("notes", n); }
function below(n) { setNumber("below", n); }
function above(n) { setNumber("above", n); }
function interval(n) { setNumber("interval", n); }
function delay(n) { setNumber("delay", n); }
function interval2(n) { setNumber("interval2", n); }
function delay2(n) { setNumber("delay2", n); }
function interval3(n) { setNumber("interval3", n); }
function delay3(n) { setNumber("delay3", n); }

// The number of voices; Fux's rules for that many follow, unless another profile
// was chosen: fux-strict for two, fux-relaxed for more (p. 139).
function voices(n) {
  const before = state.voices;
  setNumber("voices", n);
  if (state.voices === before) return;
  const wanted = state.voices > 2 ? "fux-relaxed" : "fux-strict";
  if ((state.profile === "fux-strict" || state.profile === "fux-relaxed") && state.profile !== wanted) {
    state.profile = wanted;
    show("profile");
  }
}
// A round instead of a canon with followers (M4 part E).
function round(on) {
  state.round = on ? 1 : 0;
  show("round");
}
function section(n) { setNumber("section", n); }
function seed(n) { setNumber("seed", n); }
function count(n) { setNumber("count", n); }
function slicems(ms) { setNumber("slicems", ms); }

function profile(name) {
  attempt(() => {
    rules.resolve(String(name)); // throws on an unknown profile
    state.profile = String(name);
  });
  show("profile");
}

function cadence(name) {
  attempt(() => {
    if (!CADENCES.includes(String(name))) throw new Error(`cadence: one of ${CADENCES.join(" ")}, got ${name}`);
    state.cadence = String(name);
  });
  show("cadence");
}

function taste(on) {
  state.taste = on ? 1 : 0;
  show("taste");
}

function budget(n) {
  attempt(() => {
    if (!Number.isInteger(n) || n <= 0) throw new Error(`budget: a whole number above 0, got ${n}`);
    extra.budget = n;
  });
}

// The canon panel's spec, if it has written one.
function panelSpec() {
  const text = specDict.stringify();
  const spec = text ? JSON.parse(text) : null;
  return spec && (spec.dux || spec.groups) ? spec : null;
}
panelSpec.local = 1;

// The tuning and tempo the canons are written in.
function world() {
  const panel = panelSpec();
  const tempo = panel && panel.tempo ? panel.tempo : 72;
  if (state.mode === "panel") {
    if (!panel) throw new Error("mode panel: open the canon panel first (it writes cg.spec)");
    const group = panel.groups ? panel.groups[0] : panel;
    return { system: group.system || panel.system, meter: panel.meter, tempo, final: 0 };
  }
  const m = MODES[state.mode];
  return { system: { type: "edo", divisions: 12, mode: m.mode, ref: { step: 0, midi: m.midi } }, meter: undefined, tempo, final: 0 };
}
world.local = 1;

// The followers the voices setting asks for, first to last.
function followers() {
  const all = [[state.interval, state.delay], [state.interval2, state.delay2], [state.interval3, state.delay3]];
  return all.slice(0, state.voices - 1).map(([steps, bars]) => ({ interval: steps, delay: bars }));
}
followers.local = 1;

function label(seedValue) {
  if (state.round) {
    return `generated: seed ${seedValue} / round for ${state.voices} voices / sections of ${state.section} bars`;
  }
  const names = followers().map((f) => `${finder.intervalName({ domain: "degree", steps: f.interval }, 7)} after ${f.delay} ${f.delay === 1 ? "bar" : "bars"}`);
  return `generated: seed ${seedValue} / ${names.join(" + ")}`;
}
label.local = 1;

function optionsFor(w, seedValue) {
  if (state.round) {
    return generator.round({
      name: label(seedValue), system: w.system, meter: w.meter, tempo: w.tempo, final: w.final,
      voices: state.voices, section: state.section, range: [w.final - state.below, w.final + state.above],
      profile: state.profile, taste: Boolean(state.taste), seed: seedValue, budget: extra.budget,
    });
  }
  return generator.strict({
    name: label(seedValue), system: w.system, meter: w.meter, tempo: w.tempo, final: w.final,
    length: state.notes, range: [w.final - state.below, w.final + state.above],
    followers: followers(),
    close: state.cadence, profile: state.profile, taste: Boolean(state.taste),
    seed: seedValue, budget: extra.budget,
  });
}
optionsFor.local = 1;

function run() {
  attempt(() => {
    if (job) stop();
    const w = world();
    const seeds = [];
    for (let k = 0; k < state.count; k++) seeds.push(state.seed + k);
    job = { world: w, seeds, index: 0, it: null, found: [], failures: [], started: Date.now(), slices: 0, busy: 0 };
    results = [];
    outlet(0, "results", "clear");
    outlet(0, "progress", "generating");
    task.repeat();
  });
}

// One slice: advance the searches for `slicems` ms, then yield back to Max.
function tick() {
  if (!job) return task.cancel();
  const begin = Date.now();
  try {
    for (;;) {
      if (!job.it) {
        if (job.index >= job.seeds.length) {
          job.slices++;
          job.busy += Date.now() - begin;
          finish();
          return;
        }
        job.it = generator.search(optionsFor(job.world, job.seeds[job.index]));
      }
      const step = job.it.next();
      if (step.done) {
        record(job.seeds[job.index], step.value);
        job.it = null;
        job.index++;
        outlet(0, "progress", "canon", job.index, "of", job.seeds.length, "/", job.found.length, "found");
      }
      if (Date.now() - begin >= state.slicems) break;
    }
  } catch (e) {
    task.cancel();
    job = null;
    outlet(0, "error", String(e && e.message ? e.message : e));
    return;
  }
  job.slices++;
  job.busy += Date.now() - begin;
}
tick.local = 1;

function record(seedValue, r) {
  if (r.found) {
    const key = r.dux.join(" ");
    if (!job.found.some((x) => x.key === key)) job.found.push({ seed: seedValue, key, result: r });
  } else {
    job.failures.push({ seed: seedValue, why: r.complete ? `blocked by ${r.diagnostics.blocking || "the rules"}` : "stopped at the budget" });
  }
}
record.local = 1;

// A dux as note names (12-EDO) or degrees, the first eight; a raised note (a
// round's leading note) by its sounding name: C# 5.
function notesText(r) {
  const system = scales.fromSpec(r.spec.system);
  const named = system.period_cents === 1200 && (system.steps_cents || []).every((c) => Math.abs(c / 100 - Math.round(c / 100)) < 0.01);
  const shown = r.dux.slice(0, 8).map((d, i) => {
    if (!named) return String(d);
    const offset = (r.spec.dux.notes[i] && r.spec.dux.notes[i].offset) || 0;
    const midi = Math.round(tuning.degreeToPitch(system, d) + offset / 100);
    return NAMES[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1);
  });
  return shown.join(" ") + (r.dux.length > 8 ? " ..." : "");
}
notesText.local = 1;

// A result as a menu item: no commas (Max splits menu items on them).
function menuText(entry, i) {
  const cost = Math.round(entry.result.report.cost * 100) / 100;
  return `${i + 1}. seed ${entry.seed}: ${notesText(entry.result)} / cost ${cost}`.replace(/[,;]/g, " ");
}
menuText.local = 1;

function finish() {
  task.cancel();
  results = job.found;
  const ms = Date.now() - job.started;
  outlet(0, "results", "clear");
  results.forEach((entry, i) => outlet(0, "results", "append", menuText(entry, i)));
  if (!results.length) outlet(0, "results", "append", "(none found: see the status line)");
  outlet(0, "results", "set", 0); // show the top one without playing it
  outlet(0, "progress", "done:", results.length, results.length === 1 ? "canon" : "canons", "from", job.seeds.length,
    job.seeds.length === 1 ? "seed" : "seeds", "in", ms, "ms");
  outlet(0, "done", results.length, ms, job.slices, Math.round((job.busy / Math.max(1, job.slices)) * 100) / 100);
  outlet(0, "status", "generate:", results.length, "of", job.seeds.length, "seeds gave a canon in", ms, "ms /",
    job.slices, "slices of", state.slicems, "ms");
  for (const f of job.failures) outlet(0, "status", "generate: seed", f.seed, "found none:", f.why);
  job = null;
}
finish.local = 1;

function stop() {
  task.cancel();
  if (job) {
    outlet(0, "status", "stopped");
    outlet(0, "progress", "stopped");
  }
  job = null;
}

function pick(index) {
  attempt(() => {
    const entry = results[index];
    if (!entry) throw new Error(`no canon ${index}: ${results.length ? `the last run made ${results.length}` : "generate first"}`);
    generatedDict.parse(JSON.stringify(entry.result.spec));
    outlet(0, "audition", "cg.generated");
    outlet(0, "status", "audition:", entry.result.spec.name);
  });
}

function info() {
  const s = state;
  if (s.round) {
    outlet(0, "status", "generate:", s.mode, "/ round for", s.voices, "voices / sections of", s.section, "bars / range",
      -s.below, "to", s.above, "steps /", s.profile, "/ seeds", s.seed, "to", s.seed + s.count - 1, "/ taste",
      s.taste ? "on" : "off", "/ slice", s.slicems, "ms");
    return;
  }
  const heard = followers().map((f) => `${f.interval} steps after ${f.delay} bars`).join(" + ");
  outlet(0, "status", "generate:", s.mode, "/", s.notes, "notes from", -s.below, "to", s.above, "steps /", s.voices,
    "voices: followers", heard, "/", s.profile, "/ close", s.cadence, "/ seeds", s.seed, "to",
    s.seed + s.count - 1, "/ taste", s.taste ? "on" : "off", "/ slice", s.slicems, "ms");
}
