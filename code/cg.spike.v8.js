// [v8] wrapper for the M0 spikes (b), (c) and (d); see docs/M0-checklist.md.
// Glue only: the logic is in code/lib/cg-spike.js, cg-mpe.js and cg-hello.js.
// JS never schedules: it fills the player's [coll] ahead of time and measures
// what Max did.
//
// Messages                 Outlet 0
//   tone                     amp 0.1 20, tone <hz> <midi>  the 31-EDO test note, faded in
//   silence                  amp 0 50                      fade the sine out
//   measuredhz <hz>          cents <error>                 pitch tracker vs what's playing
//                            status cents n <10> mean <x> min <y> max <z>
//                              [implied bend range <st>]   every 10 readings (range: MPE only)
//   mpeconfig                midi <b1> <b2> <b3> ...       MPE lower zone, bend +/-48
//   mpenote [pitch]          amp 0 50, midi ..., status    note on channel 2 (default: test note)
//   mpeoff                   midi ..., status              its note-off
//   playerload [notes]       coll clear, coll <i> <ms>     fills the player's queue
//                            status queue loaded: ...      with the run's length
//   fired <i> <cpuclock ms>  status playing                at the first onset
//                            status progress <k> of <n>    every 50 onsets
//                            stats <n> offset <ms> jitter <ms> sd <ms> drift <ms>  after the last onset
//   dictwrite [count]        dictready                     writes dict cg.events
//   dictvalues <f> ...       dictcheck <n> <got> <exact> <maxAbs>
// Every output starts with a selector; the patch routes on it.

autowatch = 1;
inlets = 1;
outlets = 1;

const spike = require("cg-spike");
const mpe = require("cg-mpe");
const tuning = require("cg-tuning");
const { testNote } = require("cg-hello");

const NOTE = testNote();
const MPE_CHANNEL = 2;
const CENTS_BATCH = 10; // readings per console summary
const PROGRESS_EVERY = 50; // onsets per progress line
let intended = [];
let actual = [];
let readings = [];
let expectedValues = [];
let expected = NOTE.midi; // the pitch that should be sounding now
let mpeNote = null; // { pitch, note, bend } while an MPE note is the source

// The sine's gain goes through [line~], so it always ramps: no clicks.
function tone() {
  readings = [];
  expected = NOTE.midi;
  mpeNote = null;
  outlet(0, "amp", 0.1, 20);
  outlet(0, "tone", NOTE.hz, NOTE.midi);
}

function silence() {
  outlet(0, "amp", 0, 50);
}

// [fzero~]'s fundamental, in Hz. Each reading goes to the number box; every
// CENTS_BATCH readings a summary goes to the Max window. While an MPE note
// plays, the summary also says which bend range the synth actually applied.
function measuredhz(hz) {
  if (!(hz > 0)) return; // no pitch detected (silence, or audio off)
  const cents = spike.centsError(expected, tuning.hzToMidi(hz));
  outlet(0, "cents", cents);
  readings.push(cents);
  if (readings.length === CENTS_BATCH) {
    const s = spike.summary(readings);
    const line = ["status", "cents", "n", s.n, "mean", s.mean, "min", s.min, "max", s.max];
    if (mpeNote) {
      line.push("implied", "bend", "range", mpe.impliedRange(expected + s.mean / 100, mpeNote.note, mpeNote.bend));
    }
    outlet(0, ...line);
    readings = [];
  }
}

function mpeconfig() {
  for (const bytes of mpe.zoneConfig()) outlet(0, "midi", ...bytes);
  outlet(0, "status", "mpe", "zone", "set:", "15", "channels,", "bend", mpe.DEFAULT_RANGE);
}

// MPE note on channel 2: the test note, or any float MIDI pitch ("mpenote 64.5").
function mpenote(pitch) {
  const p = typeof pitch === "number" ? pitch : NOTE.midi;
  const { note, bend } = mpe.bendFor(p);
  readings = [];
  expected = p;
  mpeNote = { pitch: p, note, bend };
  outlet(0, "amp", 0, 50); // the sine steps aside, so the tracker hears the synth
  for (const bytes of mpe.noteOn(p, 100, MPE_CHANNEL)) outlet(0, "midi", ...bytes);
  outlet(0, "status", "mpe", "note", "ch", MPE_CHANNEL, "note", note, "bend", bend, "pitch", p, "=", "note", (p - note) * 100, "cents");
}

function mpeoff() {
  const p = mpeNote ? mpeNote.pitch : NOTE.midi;
  readings = [];
  for (const bytes of mpe.noteOff(p, MPE_CHANNEL)) outlet(0, "midi", ...bytes);
  outlet(0, "status", "mpe", "note", "off");
}

function playerload(notes) {
  const events = spike.tempoCanon({ notes: notes > 0 ? notes : 100 });
  intended = events.map((event) => event.t);
  actual = [];
  outlet(0, "coll", "clear");
  for (const row of spike.queueRows(events)) outlet(0, "coll", row.index, row.delta);
  const seconds = Math.round((intended[intended.length - 1] - intended[0]) / 1000);
  outlet(0, "status", "queue", "loaded:", events.length, "events,", "stats", "in", "about", seconds, "s", "after", "go");
}

function fired(index, ms) {
  actual[index] = ms;
  if (index === 0) outlet(0, "status", "playing");
  else if (index % PROGRESS_EVERY === 0) outlet(0, "status", "progress", index, "of", intended.length);
  if (index === intended.length - 1) {
    const stats = spike.jitter(intended, actual);
    outlet(0, "stats", stats.count, "offset", stats.offset, "jitter", stats.jitter, "sd", stats.sd, "drift", stats.drift);
  }
}

function dictwrite(count) {
  expectedValues = spike.dictValues(count > 0 ? count : 256);
  const dict = new Dict("cg.events");
  dict.parse(JSON.stringify({ values: expectedValues }));
  outlet(0, "dictready");
}

function dictvalues(...values) {
  const result = spike.compareValues(expectedValues, values);
  outlet(0, "dictcheck", result.expected, result.received, result.exact ? 1 : 0, result.maxAbs);
}
