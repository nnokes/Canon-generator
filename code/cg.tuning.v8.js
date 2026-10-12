// [v8] wrapper for the scale systems (M1; see docs/M1-checklist.md). Glue only:
// the logic is in code/lib/cg-tuning.js and cg-scales.js. JS never schedules:
// a note's envelope is one [line~] list, and scale runs are stepped by Max.
//
// Messages                     Outlet 0
//   starters                     menu clear, menu append <name> ...   fills the chooser
//   starter <i>                  menu set <i>, runmax <n>, status ... picks starter i
//   system <kind> <args...>      runmax <n>, status ...               builds a system:
//       edo <n> | ed <n> <period cents> | bp | ji <ratio> ... <period ratio>
//       harmonic <low> <high> <f0> | subharmonic <low> <high> <f0>
//       stretched <low> <high> <f0> <s> | fm <carrier> <modulator> <sidebands>
//       me <c> <d> [offset] | hz <f> <f> ...
//   load <full path>             status file read ..., status ...     a Scala .scl file
//   mode [step ...]              runmax <n>, status ...               no steps: every step
//   ref <midi> | refhz <hz>      status ...                           step 0's pitch
//   play <degree>                freq <hz>, amp <envelope>, readout   a short note
//   key <midi note>              (as play)                            key 60 = degree 0
//   hold <degree>                freq <hz>, amp 0.2 20, readout       a held note, to measure
//   silence                      amp 0 80
//   measuredhz <hz>              cents <error>; every 10 readings:
//                                status cents n <n> median <c> min <c> max <c> periods <k:n> ...
//   info                         status ...
// Errors come out as: error <message>. Every output starts with a selector.

autowatch = 1;
inlets = 1;
outlets = 1;

const tuning = require("cg-tuning");
const scales = require("cg-scales");
const { readLines } = require("cg-file");

const KEY_CENTER = 60; // keyboard key that plays degree 0
const NOTE_ENVELOPE = [0.2, 10, 0.2, 400, 0, 200]; // [line~] target/time pairs: ~600 ms
const BATCH = 10; // pitch readings per summary

let current = scales.starter(0); // the scale system in use
let expectedHz = 0; // what the voice is playing now
let readings = [];

function starters() {
  outlet(0, "menu", "clear");
  for (const name of scales.names()) outlet(0, "menu", "append", name);
}

function starter(index) {
  attempt(() => {
    current = scales.starter(index);
    outlet(0, "menu", "set", index);
    announce();
  });
}

const BUILDERS = {
  edo: (n) => tuning.edo(n),
  ed: (n, period) => tuning.ed(n, period),
  bp: () => tuning.bohlenPierce(),
  ji: (...ratios) => tuning.ji(ratios),
  harmonic: (low, high, f0) => tuning.harmonic(low, high, f0),
  subharmonic: (low, high, f0) => tuning.subharmonic(low, high, f0),
  stretched: (low, high, f0, s) => tuning.stretched(low, high, f0, s),
  fm: (carrier, modulator, sidebands) => tuning.fm(carrier, modulator, sidebands),
  me: (c, d, offset) => tuning.maximallyEven(c, d, offset === undefined ? {} : { offset }),
  hz: (...frequencies) => tuning.hzList(frequencies),
};

function system(kind, ...args) {
  attempt(() => {
    const build = BUILDERS[kind];
    if (!build) throw new Error(`unknown system "${kind}"; try: ${Object.keys(BUILDERS).join(", ")}`);
    current = build(...args);
    announce();
  });
}

function load(path) {
  attempt(() => {
    const lines = readLines(String(path));
    outlet(0, "status", "file", "read:", lines.length, "lines,", "first:", lines[0] === undefined ? "" : lines[0]);
    const name = String(path).split(/[/:\\]/).pop().replace(/\.scl$/i, "");
    const parsed = tuning.parseScl(lines.join("\n"), name);
    current = tuning.withRef(parsed.system, { step: 0, midi: KEY_CENTER });
    for (const warning of parsed.warnings) outlet(0, "status", "warning:", warning);
    announce();
  });
}

function mode(...steps) {
  attempt(() => {
    current = tuning.withMode(current, steps);
    announce();
  });
}

function ref(midi) {
  attempt(() => {
    current = tuning.withRef(current, { step: current.ref.step, midi });
    announce();
  });
}

function refhz(hz) {
  attempt(() => {
    current = tuning.withRef(current, { step: current.ref.step, hz });
    announce();
  });
}

function play(degree) {
  attempt(() => sound(degree, NOTE_ENVELOPE));
}

function key(note) {
  play(note - KEY_CENTER);
}

function hold(degree) {
  attempt(() => sound(degree, [0.2, 20]));
}

function silence() {
  outlet(0, "amp", 0, 80);
}

// [fzero~]'s fundamental (Hz) while a note sounds.
function measuredhz(hz) {
  if (!(hz > 0) || !(expectedHz > 0)) return;
  const error = 1200 * Math.log2(hz / expectedHz);
  outlet(0, "cents", error);
  readings.push(error);
  if (readings.length < BATCH) return;
  const s = tuning.centsSummary(readings);
  const periods = Object.keys(s.periods).sort((a, b) => a - b).map((k) => `${k}:${s.periods[k]}`);
  outlet(0, "status", "cents", "n", s.n, "median", s.median, "min", s.min, "max", s.max, "periods", ...periods);
  readings = [];
}

function info() {
  announce();
}

// ---------------------------------------------------------------- helpers

function sound(degree, envelope) {
  const hz = tuning.degreeToHz(current, degree);
  const midi = tuning.degreeToPitch(current, degree);
  expectedHz = hz;
  readings = [];
  outlet(0, "freq", hz);
  outlet(0, "amp", ...envelope);
  outlet(0, "readout", "degree", degree, "hz", hz, "midi", midi, "cents12", (midi - Math.round(midi)) * 100);
}
sound.local = 1;

// The new system: its size goes to the run's [counter], its summary to the Max window.
function announce() {
  const count = tuning.size(current);
  const repeating = current.period_cents !== null;
  outlet(0, "runmax", repeating ? count : count - 1);
  outlet(0, "status", current.name + ":", count, repeating ? "degrees per period of" : "degrees, non-repeating",
    ...(repeating ? [current.period_cents, "cents"] : []), "ref", current.ref.midi, current.ref.hz, "Hz");
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
