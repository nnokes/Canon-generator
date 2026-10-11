// [v8] wrapper for the M0 spikes (b), (c) and (d); see docs/M0-checklist.md.
// Glue only: the logic is in code/lib/cg-spike.js, cg-mpe.js and cg-hello.js.
// JS never schedules: it fills the player's [coll] ahead of time and measures
// what Max did.
//
// Messages                 Outlet 0
//   tone                     tone <hz> <midi>              the 31-EDO test note
//   measured <midi>          cents <error>                 pitch tracker vs test note
//   mpeconfig                midi <b1> <b2> <b3> ...       MPE lower zone, bend +/-48
//   mpenote / mpeoff         midi <b1> <b2> <b3> ...       test note on channel 2
//   playerload [notes]       coll clear, coll <i> <ms>     fills the player's queue
//   fired <i> <cpuclock ms>  stats <n> <mean> <max> <last> after the last onset
//   dictwrite [count]        dictready                     writes dict cg.events
//   dictvalues <f> ...       dictcheck <n> <got> <exact> <maxAbs>
// Every output starts with a selector; the patch routes on it.

autowatch = 1;
inlets = 1;
outlets = 1;

const spike = require("cg-spike");
const mpe = require("cg-mpe");
const { testNote } = require("cg-hello");

const NOTE = testNote();
const MPE_CHANNEL = 2;
let intended = [];
let actual = [];
let expectedValues = [];

function tone() {
  outlet(0, "tone", NOTE.hz, NOTE.midi);
}

function measured(midi) {
  outlet(0, "cents", spike.centsError(NOTE.midi, midi));
}

function mpeconfig() {
  for (const bytes of mpe.zoneConfig()) outlet(0, "midi", ...bytes);
  outlet(0, "status", "mpe", "zone", "set:", "15", "channels,", "bend", mpe.DEFAULT_RANGE);
}

function mpenote() {
  for (const bytes of mpe.noteOn(NOTE.midi, 100, MPE_CHANNEL)) outlet(0, "midi", ...bytes);
}

function mpeoff() {
  for (const bytes of mpe.noteOff(NOTE.midi, MPE_CHANNEL)) outlet(0, "midi", ...bytes);
}

function playerload(notes) {
  const events = spike.tempoCanon({ notes: notes > 0 ? notes : 100 });
  intended = events.map((event) => event.t);
  actual = [];
  outlet(0, "coll", "clear");
  for (const row of spike.queueRows(events)) outlet(0, "coll", row.index, row.delta);
  outlet(0, "status", "queue", "loaded:", events.length, "events;", "click", "go");
}

function fired(index, ms) {
  actual[index] = ms;
  if (index === intended.length - 1) {
    const stats = spike.jitter(intended, actual);
    outlet(0, "stats", stats.count, stats.meanAbs, stats.maxAbs, stats.last);
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
