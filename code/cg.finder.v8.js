// [v8] wrapper for the answer finder (M3 part E; PLAN.md 3.6). Glue only: the
// search is cg-finder's. It reads the melody, scale system and meter from the
// named dict cg.spec (the canon wrapper writes it on every render), runs the
// search in time slices from a Task so Max's interface stays responsive (PLAN
// 2.4), and lists the ranked results. Picking one writes its spec to the dict
// cg.audition and asks the canon panel to play it.
//
// Messages                     Outlet 0
//   run                          progress <phase> <done> <total> ..., then results clear,
//                                results append <label> ..., done <results> <ms> <slices> <ms per slice>
//   stop                         status stopped
//   voices <n>                   2 = one follower; 3+ = sets of followers
//   intervals <from> <to>        scale steps (both ends included)
//   delays <from> <to> <step>    beats
//   transforms <P|I|R|RI ...>
//   timescales <x ...>
//   profile <name>               canon (default), florid, fux-strict, spectral, free
//   perpetual <0|1>              judge a perpetual canon in its steady state
//   slicems <ms>                 the time-slice budget: work per slice before yielding
//   budget <n>                   the most renders + analyses
//   pick <i>                     audition <dict>: the patch sends usespec <dict> to the canon
//   info                         status ...
// Errors come out as: error <message>. Every output starts with a selector.

autowatch = 1;
inlets = 1;
outlets = 1;

const finder = require("cg-finder");
const rules = require("cg-rules");

const TRANSFORMS = ["P", "I", "R", "RI", "segmentRetrograde", "segmentPermute"];
const options = {
  voices: 2,
  profile: "canon",
  perpetual: false,
  budget: 20000,
  keep: 50,
  ranges: { intervals: finder.range(-9, 9), delays: finder.range(1, 8), transforms: ["P"], timeScales: [1] },
};
let slice = 20; // ms of work per Task tick: the time-slice budget (M3 session 1)
let search = null; // { it, options, started, slices, busy }
let results = [];
let lastOptions = null;
const task = new Task(tick);
task.interval = 1;

function attempt(action) {
  try {
    action();
  } catch (e) {
    outlet(0, "error", String(e && e.message ? e.message : e));
  }
}
attempt.local = 1;

function number(value, label, check) {
  if (typeof value !== "number" || !Number.isFinite(value) || !check(value)) throw new Error(`${label}: got ${value}`);
  return value;
}
number.local = 1;

// The melody and its world, from the canon wrapper's dict.
function current() {
  const text = new Dict("cg.spec").stringify();
  const spec = text ? JSON.parse(text) : null;
  if (!spec || (!spec.dux && !spec.groups)) throw new Error("no melody yet: open the canon panel (it writes cg.spec)");
  const group = spec.groups ? spec.groups[0] : spec;
  return {
    dux: group.dux, system: group.system || spec.system, meter: spec.meter, tempo: spec.tempo,
    consonance: spec.consonance,
  };
}
current.local = 1;

function run() {
  attempt(() => {
    if (search) stop();
    const opts = { ...options, ranges: { ...options.ranges }, ...current() };
    search = { it: finder.search(opts), options: opts, started: Date.now(), slices: 0, busy: 0 };
    results = [];
    outlet(0, "results", "clear");
    outlet(0, "progress", "starting", 0, 1);
    task.repeat();
  });
}

// One slice: advance the search for `slice` ms, then yield back to Max.
function tick() {
  if (!search) return task.cancel();
  const begin = Date.now();
  try {
    for (;;) {
      const step = search.it.next();
      if (step.done) {
        search.slices++;
        search.busy += Date.now() - begin;
        finish(step.value);
        return;
      }
      if (step.value) outlet(0, "progress", step.value.phase, step.value.done, step.value.total);
      if (Date.now() - begin >= slice) break;
    }
  } catch (e) {
    task.cancel();
    search = null;
    outlet(0, "error", String(e && e.message ? e.message : e));
    return;
  }
  search.slices++;
  search.busy += Date.now() - begin;
}
tick.local = 1;

function finish(value) {
  task.cancel();
  lastOptions = search.options;
  results = value.results;
  outlet(0, "results", "clear");
  results.forEach((r, i) => {
    const mark = r.hard ? `${r.hard} faults` : "clean";
    outlet(0, "results", "append", `${i + 1}. ${r.label} (${mark}, cost ${round(r.cost)})`);
  });
  const ms = Date.now() - search.started;
  const passing = results.filter((r) => r.hard === 0).length;
  outlet(0, "done", results.length, ms, search.slices, round(search.busy / Math.max(1, search.slices)));
  // No bare "," or ";" atoms: Max would read them as message separators.
  outlet(0, "status", "finder:", passing, "clean of", value.tried, "tried" + (value.complete ? "" : " (stopped at the budget)"),
    "in", ms, "ms,", search.slices, "slices of", slice, "ms");
  search = null;
}
finish.local = 1;

function round(x) {
  return Math.round(x * 100) / 100;
}
round.local = 1;

function stop() {
  task.cancel();
  if (search) outlet(0, "status", "stopped");
  search = null;
}

function voices(n) {
  attempt(() => { options.voices = number(n, "voices must be a whole number from 2 to 6", (v) => Number.isInteger(v) && v >= 2 && v <= 6); });
}

function intervals(from, to) {
  attempt(() => {
    number(from, "intervals: whole numbers of steps", Number.isInteger);
    number(to, "intervals: whole numbers of steps", (v) => Number.isInteger(v) && v >= from);
    options.ranges.intervals = finder.range(from, to);
  });
}

function delays(from, to, step) {
  attempt(() => {
    const by = step === undefined ? 1 : step;
    number(from, "delays: from must be 0 or more", (v) => v >= 0);
    number(to, "delays: to must be at least from", (v) => v >= from);
    number(by, "delays: step must be above 0", (v) => v > 0);
    options.ranges.delays = finder.range(from, to, by);
  });
}

function transforms(...names) {
  attempt(() => {
    for (const t of names) if (!TRANSFORMS.includes(t)) throw new Error(`transforms: one of ${TRANSFORMS.join(" ")}, got ${t}`);
    if (!names.length) throw new Error("transforms: name at least one");
    options.ranges.transforms = names;
  });
}

function timescales(...values) {
  attempt(() => {
    if (!values.length) throw new Error("timescales: give at least one");
    for (const v of values) number(v, "timescales must be above 0", (x) => x > 0);
    options.ranges.timeScales = values;
  });
}

function profile(name) {
  attempt(() => {
    rules.resolve(String(name)); // throws on an unknown profile
    options.profile = String(name);
  });
}

function perpetual(on) {
  options.perpetual = Boolean(on);
}

function slicems(ms) {
  attempt(() => { slice = number(ms, "slicems must be above 0", (v) => v > 0); });
}

function budget(n) {
  attempt(() => { options.budget = number(n, "budget must be a whole number above 0", (v) => Number.isInteger(v) && v > 0); });
}

function pick(index) {
  attempt(() => {
    const r = results[index];
    if (!r || !lastOptions) throw new Error(`no result ${index}: run the finder first`);
    const spec = finder.specFor(lastOptions, r);
    new Dict("cg.audition").parse(JSON.stringify(spec));
    outlet(0, "audition", "cg.audition");
    outlet(0, "status", "audition:", r.label);
  });
}

function info() {
  const r = options.ranges;
  outlet(0, "status", "finder:", options.voices, "voices, intervals", r.intervals[0], "to", r.intervals[r.intervals.length - 1],
    "steps, delays", ...r.delays, "beats, transforms", ...r.transforms, "time scales", ...r.timeScales,
    "profile", options.profile + (options.perpetual ? " (perpetual)" : ""), "slice", slice, "ms");
}
