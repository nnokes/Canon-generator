// [v8] wrapper for the answer finder (M3 part E; PLAN.md 3.6). Glue only: the
// search is cg-finder's. It reads the melody, scale system and meter from the
// named dict cg.spec (the canon wrapper writes it on every render), runs the
// search in time slices from a Task so Max's interface stays responsive (PLAN
// 2.4), and lists the ranked results. Picking one writes its spec to the dict
// cg.audition, and the patch has the canon panel play it.
//
// Each panel box has its own message, so moving one box never sends another's
// value, and the ranges are checked only at run (not while you drag). Every
// setting echoes back as show <name> <value>, so the boxes always show what the
// finder holds, and a refused value snaps back (M3 session 1).
//
// Messages                     Outlet 0
//   settings                     show <name> <value>, for every setting
//   voices <n>                   show voices <n>     2 = one follower; 3+ = sets of followers
//   intervalfrom|intervalto <n>  show ...            the follower intervals, in scale steps
//   delayfrom|delayto|delaystep <beats>  show ...    the entry delays
//   profile <name>               show profile ...    canon (default), florid, fux-strict, spectral, free
//   perpetual <0|1>              show perpetual ...  judge a perpetual canon in its steady state
//   slicems <ms>                 show slicems ...    the time-slice budget: work per slice
//   transform <P|I|R|RI> <0|1>   show transforms <P> <I> <R> <RI>   one transform on or off;
//                                the panel's toggles, as 0/1 flags
//   timescale <x> <0|1>          show timescales <0.5> <1> <2>      one time scale on or off
//                                (x2 = the follower at half speed); flags for the panel's three
//   intervals <from> <to>, delays <from> <to> [step]   several at once
//   transforms <P|I|R|RI ...>, timescales <x ...>       all at once (echo as above); budget <n>
//   run                          progress ..., results clear, results append <text> ...,
//                                results set 0, progress done: ..., done <n> <ms> <slices>
//                                <ms per slice>, status ... (one line; two for 3+ voices, and
//                                a third saying why when no set was found)
//   stop                         status stopped
//   pick <i>                     audition cg.audition (the patch: stop, usespec, play)
//   info                         status ...
// Errors come out as: error <message>. Every output starts with a selector, and
// no text carries a comma or semicolon: Max reads those as separators.

autowatch = 1;
inlets = 1;
outlets = 1;

const finder = require("cg-finder");
const rules = require("cg-rules");

const TRANSFORMS = ["P", "I", "R", "RI", "segmentRetrograde", "segmentPermute"];
// The panel's toggles: which transforms and time scales it shows.
const PANEL_TRANSFORMS = ["P", "I", "R", "RI"];
const PANEL_SCALES = [0.5, 1, 2];
// What the panel shows, one entry per box.
const state = {
  voices: 2, intervalfrom: -9, intervalto: 9, delayfrom: 1, delayto: 8, delaystep: 1,
  profile: "canon", perpetual: 0, slicems: 20,
};
const CHECKS = {
  voices: [(v) => Number.isInteger(v) && v >= 2 && v <= 6, "voices: a whole number from 2 to 6"],
  intervalfrom: [Number.isInteger, "intervals: whole numbers of scale steps"],
  intervalto: [Number.isInteger, "intervals: whole numbers of scale steps"],
  delayfrom: [(v) => v >= 0, "delays: 0 beats or more"],
  delayto: [(v) => v >= 0, "delays: 0 beats or more"],
  delaystep: [(v) => v > 0, "delays: every must be above 0"],
  slicems: [(v) => v > 0, "time slice: above 0 ms"],
};
const extra = { transforms: ["P"], timeScales: [1], budget: 20000, keep: 50 };
let search = null; // { it, options, started, slices, busy }
let results = [];
let lastOptions = null;
const task = new Task(tick);
task.interval = 1;
// Named dicts live only while something holds them: Max frees one when its last
// reference goes, and V8 collects a temporary Dict whenever it likes (M3 session
// 1: cg.spec vanished between finder runs until the .mid was reloaded). So every
// dict is held for the script's whole life.
const specDict = new Dict("cg.spec"); // written by the canon wrapper
const auditionDict = new Dict("cg.audition"); // a picked result, read by the canon wrapper

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

function show(name) {
  outlet(0, "show", name, state[name]);
}
show.local = 1;

// Set one value, or report why not; either way the panel shows what's held.
function set(name, value) {
  attempt(() => {
    const [check, label] = CHECKS[name];
    state[name] = number(value, label, check);
  });
  show(name);
}
set.local = 1;

// The transforms or time scales held, as one 0/1 flag per panel toggle.
function showFlags(which) {
  if (which === "transforms") outlet(0, "show", which, ...PANEL_TRANSFORMS.map((t) => (extra.transforms.includes(t) ? 1 : 0)));
  else outlet(0, "show", which, ...PANEL_SCALES.map((x) => (extra.timeScales.includes(x) ? 1 : 0)));
}
showFlags.local = 1;

function settings() {
  for (const name of Object.keys(state)) show(name);
  showFlags("transforms");
  showFlags("timescales");
}

function voices(n) { set("voices", n); }
function intervalfrom(n) { set("intervalfrom", n); }
function intervalto(n) { set("intervalto", n); }
function delayfrom(x) { set("delayfrom", x); }
function delayto(x) { set("delayto", x); }
function delaystep(x) { set("delaystep", x); }
function slicems(ms) { set("slicems", ms); }

function intervals(from, to) {
  set("intervalfrom", from);
  set("intervalto", to);
}

function delays(from, to, step) {
  set("delayfrom", from);
  set("delayto", to);
  if (step !== undefined) set("delaystep", step);
}

function profile(name) {
  attempt(() => {
    rules.resolve(String(name)); // throws on an unknown profile
    state.profile = String(name);
  });
  show("profile");
}

function perpetual(on) {
  state.perpetual = on ? 1 : 0;
  show("perpetual");
}

function transforms(...names) {
  attempt(() => {
    for (const t of names) if (!TRANSFORMS.includes(t)) throw new Error(`transforms: one of ${TRANSFORMS.join(" ")}, got ${t}`);
    if (!names.length) throw new Error("transforms: name at least one");
    extra.transforms = names;
  });
  showFlags("transforms");
}

function timescales(...values) {
  attempt(() => {
    if (!values.length) throw new Error("timescales: give at least one");
    for (const v of values) number(v, "timescales must be above 0", (x) => x > 0);
    extra.timeScales = values;
  });
  showFlags("timescales");
}

// One toggle: a transform on or off. None at all is refused at run, not here,
// so you can untick P before ticking I.
function transform(name, on) {
  attempt(() => {
    if (!TRANSFORMS.includes(name)) throw new Error(`transform: one of ${TRANSFORMS.join(" ")}, got ${name}`);
    const rest = extra.transforms.filter((t) => t !== name);
    extra.transforms = on ? TRANSFORMS.filter((t) => t === name || rest.includes(t)) : rest;
  });
  showFlags("transforms");
}

function timescale(x, on) {
  attempt(() => {
    number(x, "timescale must be above 0", (v) => v > 0);
    const rest = extra.timeScales.filter((v) => v !== x);
    extra.timeScales = (on ? [...rest, x] : rest).sort((a, b) => a - b);
  });
  showFlags("timescales");
}

function budget(n) {
  attempt(() => { extra.budget = number(n, "budget must be a whole number above 0", (v) => Number.isInteger(v) && v > 0); });
}

// The search's ranges, checked as a whole now that every box is set.
function ranges() {
  const s = state;
  if (s.intervalto < s.intervalfrom) throw new Error(`intervals: to (${s.intervalto}) is below from (${s.intervalfrom})`);
  if (s.delayto < s.delayfrom) throw new Error(`delays: to (${s.delayto}) is below from (${s.delayfrom})`);
  if (!extra.transforms.length) throw new Error("transforms: tick at least one");
  if (!extra.timeScales.length) throw new Error("time scales: tick at least one");
  return {
    intervals: finder.range(s.intervalfrom, s.intervalto),
    delays: finder.range(s.delayfrom, s.delayto, s.delaystep),
    transforms: extra.transforms,
    timeScales: extra.timeScales,
  };
}
ranges.local = 1;

// The melody and its world, from the canon wrapper's dict.
function current() {
  const text = specDict.stringify();
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
    const opts = {
      voices: state.voices, profile: state.profile, perpetual: Boolean(state.perpetual),
      budget: extra.budget, keep: extra.keep, ranges: ranges(), ...current(),
    };
    search = { it: finder.search(opts), options: opts, started: Date.now(), slices: 0, busy: 0 };
    results = [];
    outlet(0, "results", "clear");
    outlet(0, "progress", "searching");
    task.repeat();
  });
}

// One slice: advance the search for `slicems` ms, then yield back to Max.
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
      if (step.value) outlet(0, "progress", step.value.phase, step.value.done, "of", step.value.total);
      if (Date.now() - begin >= state.slicems) break;
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

// A result as a menu item: no commas (Max splits menu items on them).
function menuText(r, i) {
  const cost = r.cost ? `cost ${round(r.cost)}` : "";
  const mark = r.hard ? `${r.hard} ${r.hard === 1 ? "fault" : "faults"}` : "clean";
  return `${i + 1}. ${r.label.replace(/\s*,\s*/g, " / ")}: ${mark}${cost ? " / " + cost : ""}`.replace(/[,;]/g, " ");
}
menuText.local = 1;

function finish(value) {
  task.cancel();
  lastOptions = search.options;
  results = value.results;
  outlet(0, "results", "clear");
  results.forEach((r, i) => outlet(0, "results", "append", menuText(r, i)));
  if (!results.length) outlet(0, "results", "append", "(none found: see the status line)");
  outlet(0, "results", "set", 0); // show the top one without playing it
  const ms = Date.now() - search.started;
  const passing = results.filter((r) => r.hard === 0).length;
  const sets = value.voices > 2;
  const empty = sets ? noSets(value) : null;
  if (empty) {
    outlet(0, "progress", "done: no sets:", ...empty);
  } else if (sets) {
    outlet(0, "progress", "done:", passing, "clean sets of", value.tried, "/", value.passingFollowers, "of",
      value.followersTried, "followers pass alone /", value.pairsOk, "pairs fit together");
  } else {
    outlet(0, "progress", "done:", passing, "clean of", value.tried, "in", ms, "ms");
  }
  outlet(0, "done", results.length, ms, search.slices, round(search.busy / Math.max(1, search.slices)));
  outlet(0, "status", "finder:", passing, "clean of", value.tried, (sets ? "sets tried" : "tried") + (value.complete ? "" : " (stopped at the budget)"),
    "in", ms, "ms,", search.slices, "slices of", state.slicems, "ms");
  if (sets) {
    // Sets are built only from followers that pass against the dux alone.
    outlet(0, "status", "finder:", value.passingFollowers, "of", value.followersTried,
      "followers pass against the dux alone,", value.pairsOk, "pairs of them work together");
  }
  if (empty) outlet(0, "status", "finder: no sets:", ...empty);
  search = null;
}
finish.local = 1;

// Why a complete 3+ voice search found no set, from the first stage that came up
// empty, and what to try (M3 session 1: 154 pairs fit on a 13-note clip, but no
// three followers all fit each other; at time scale x2 there were 10 clean sets).
// A search stopped at the budget says so on its status line instead.
function noSets(value) {
  if (value.tried > 0 || !value.complete) return null;
  const k = value.voices - 1;
  if (value.passingFollowers < k) {
    return ["only", value.passingFollowers, "of", value.followersTried, "followers pass against the melody and a set needs", k,
      "/ widen the intervals or delays or tick more transforms or time scales"];
  }
  if (value.pairsOk === 0) {
    return ["no two passing followers fit each other / try time scale x2 or other transforms or other delays"];
  }
  return ["no", k, "followers all fit each other: each pair must be a canon too / try time scale x2 or other transforms or wider delays"];
}
noSets.local = 1;

function round(x) {
  return Math.round(x * 100) / 100;
}
round.local = 1;

function stop() {
  task.cancel();
  if (search) {
    outlet(0, "status", "stopped");
    outlet(0, "progress", "stopped");
  }
  search = null;
}

function pick(index) {
  attempt(() => {
    const r = results[index];
    if (!lastOptions) throw new Error(`no result ${index}: run the finder first`);
    if (!r) throw new Error(`no result ${index}: the last run found ${results.length}`);
    const spec = finder.specFor(lastOptions, r);
    auditionDict.parse(JSON.stringify(spec));
    outlet(0, "audition", "cg.audition");
    outlet(0, "status", "audition:", r.label);
  });
}

function info() {
  const s = state;
  outlet(0, "status", "finder:", s.voices, "voices, intervals", s.intervalfrom, "to", s.intervalto,
    "steps, delays", s.delayfrom, "to", s.delayto, "every", s.delaystep, "beats, transforms", ...extra.transforms,
    "time scales", ...extra.timeScales, "profile", s.profile + (s.perpetual ? " (perpetual)" : ""), "slice", s.slicems, "ms");
}
