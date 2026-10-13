// [v8] wrapper for the MPE pitch check (M2 part F; see docs/M2-checklist.md).
// Glue only: cg-mpe builds the bytes, cg-tuning folds and summarizes the
// readings. It plays one held MPE note into a synth inside Max and compares
// what [fzero~] hears with what was sent, so the check needs no tuner.
//
// Messages                 Outlet 0
//   zone                     midi <bytes> ..., status mpe zone set ...   the lower zone, bend +/-48
//   note [pitch]             midi ..., status mpe note ...               a held note on channel 2
//                                                                        (default 64.5)
//   off                      midi ..., status mpe note off
//   measuredhz <hz>          cents <error>; every 10 readings:
//                            status cents n <n> median <c> min <c> max <c> periods <k:n> ...
//                              implied bend range <semitones>
// Every output starts with a selector.

autowatch = 1;
inlets = 1;
outlets = 1;

const mpe = require("cg-mpe");
const tuning = require("cg-tuning");

const CHANNEL = 2;
const BATCH = 10;
let sounding = null; // { pitch, note, bend }
let readings = [];

function zone() {
  for (const bytes of mpe.zoneConfig()) outlet(0, "midi", ...bytes);
  outlet(0, "status", "mpe", "zone", "set:", "15", "channels,", "bend", mpe.DEFAULT_RANGE);
}

function note(pitch) {
  const p = typeof pitch === "number" ? pitch : 64.5;
  if (sounding) off();
  const { note: key, bend } = mpe.bendFor(p);
  sounding = { pitch: p, note: key, bend };
  readings = [];
  for (const bytes of mpe.noteOn(p, 100, CHANNEL)) outlet(0, "midi", ...bytes);
  outlet(0, "status", "mpe", "note", "ch", CHANNEL, "note", key, "bend", bend, "pitch", p,
    "=", "note", Math.round((p - key) * 1e4) / 100, "cents");
}

function off() {
  if (!sounding) return;
  for (const bytes of mpe.noteOff(sounding.pitch, CHANNEL)) outlet(0, "midi", ...bytes);
  sounding = null;
  readings = [];
  outlet(0, "status", "mpe", "note", "off");
}

// [fzero~]'s fundamental (Hz). Readings are folded to the nearest octave, since
// a tracker on a rich synth often jumps one (M0); the median ignores strays.
function measuredhz(hz) {
  if (!(hz > 0) || !sounding) return;
  const error = 1200 * Math.log2(hz / tuning.midiToHz(sounding.pitch));
  outlet(0, "cents", error);
  readings.push(error);
  if (readings.length < BATCH) return;
  const s = tuning.centsSummary(readings);
  const periods = Object.keys(s.periods).sort((a, b) => a - b).map((k) => `${k}:${s.periods[k]}`);
  const range = mpe.impliedRange(sounding.pitch + s.median / 100, sounding.note, sounding.bend);
  outlet(0, "status", "cents", "n", s.n, "median", s.median, "min", s.min, "max", s.max, "periods", ...periods,
    "implied", "bend", "range", range);
  readings = [];
}
