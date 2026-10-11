"use strict";
// M0 spikes (docs/M0-checklist.md). Everything a spike needs from the engine,
// kept apart from the real modules so it can be deleted after M0.
//
//   (b) player:  a tempo canon at sqrt(2):1, whose onsets never land on a grid,
//                turned into a queue for a Max-native [coll] + [delay] player,
//                and the jitter between intended and measured onsets.
//   (c) output:  the cents error of a measured pitch against the test note.
//   (d) dict:    values with full double precision, and an exact comparison.

const rng = require("cg-rng");
const tuning = require("cg-tuning");

// Two voices playing the same random-walk melody in 31-EDO. The follower
// enters `delayBeats` later, a 31-EDO fifth (18 steps) higher and `ratio`
// times faster, so its onsets fall at irrational times. Times are in ms.
function tempoCanon({ notes = 100, ratio = Math.SQRT2, delayBeats = 2, beatMs = 500, seed = 1 } = {}) {
  const random = rng.create(seed);
  const durations = [0.5, 0.75, 1, 1.5];
  const dux = [];
  let beat = 0;
  let step = 0;
  for (let i = 0; i < notes; i++) {
    const dur = random.pick(durations);
    dux.push({ beat, dur, step });
    beat += dur;
    step = Math.max(-31, Math.min(31, step + random.pick([-5, -3, -2, 2, 3, 5])));
  }
  const events = [];
  for (const note of dux) {
    events.push({
      t: note.beat * beatMs,
      dur: note.dur * beatMs,
      pitch: tuning.edoPitch(31, note.step, 62),
      voice: 0,
    });
    events.push({
      t: (delayBeats + note.beat / ratio) * beatMs,
      dur: (note.dur / ratio) * beatMs,
      pitch: tuning.edoPitch(31, note.step + 18, 62),
      voice: 1,
    });
  }
  return events.sort((a, b) => a.t - b.t || a.voice - b.voice);
}

// The queue the Max player walks: row i holds the delay (ms) from event i to
// event i+1, and -1 after the last event, which stops the chain. Max keeps
// the timing (a [delay] in the scheduler thread); JS only fills the [coll].
function queueRows(events) {
  return events.map((event, i) => ({
    index: i,
    delta: i + 1 < events.length ? events[i + 1].t - event.t : -1,
  }));
}

// Intended and measured onset times (ms). Each onset's error is measured from
// onset 0, then split into:
//   offset  the mean error: a constant start latency (e.g. onset 0 fired from
//           a mouse click, the rest from the scheduler), harmless
//   jitter  the largest deviation from that offset: the real timing spread
//   sd      the standard deviation of the errors
//   drift   last error minus first: whether the clock walks away over the run
// All four use onsets 1..n-1 (onset 0's error is 0 by definition).
function jitter(intended, actual) {
  const n = Math.min(intended.length, actual.length);
  const none = { count: n, offset: 0, jitter: 0, sd: 0, drift: 0 };
  if (n < 2) return none;
  const errors = [];
  for (let i = 1; i < n; i++) errors.push(actual[i] - actual[0] - (intended[i] - intended[0]));
  const offset = errors.reduce((a, b) => a + b, 0) / errors.length;
  let spread = 0;
  let squares = 0;
  for (const e of errors) {
    spread = Math.max(spread, Math.abs(e - offset));
    squares += (e - offset) * (e - offset);
  }
  return {
    count: n,
    offset,
    jitter: spread,
    sd: Math.sqrt(squares / errors.length),
    drift: errors[errors.length - 1] - errors[0],
  };
}

// The pitch a tracker measured, against the pitch that was sent, in cents.
function centsError(expectedMidi, measuredMidi) {
  return tuning.cents(expectedMidi, measuredMidi);
}

// Values that use all of a double's precision (irrational multiples plus
// seeded noise), so any rounding on the way through Max shows up.
function dictValues(count = 256, seed = 1) {
  const random = rng.create(seed);
  const values = [];
  for (let i = 0; i < count; i++) values.push((i + 1) * Math.SQRT2 * Math.PI + random.next() / 3);
  return values;
}

function compareValues(expected, received) {
  let maxAbs = 0;
  let exact = expected.length === received.length;
  const n = Math.min(expected.length, received.length);
  for (let i = 0; i < n; i++) {
    const diff = Math.abs(expected[i] - received[i]);
    if (diff !== 0) exact = false;
    maxAbs = Math.max(maxAbs, diff);
  }
  return { expected: expected.length, received: received.length, exact, maxAbs };
}

// A pitch tracker on a harmonically rich sound (Drift, spike c) often locks
// onto the octave below or above. Fold an error in cents to its nearest
// octave: the residual in [-600, 600) and how many octaves were dropped.
function foldOctave(cents) {
  const octaves = Math.round(cents / 1200) || 0; // || 0: no "-0" octave
  return { cents: cents - 1200 * octaves, octaves };
}

// n, median, min and max of the octave-folded readings, and how many
// readings landed in each octave ({ "-1": 8, "0": 2 }). The median ignores
// the odd wild reading, which a mean doesn't.
function robustSummary(values) {
  if (values.length === 0) return { n: 0, median: 0, min: 0, max: 0, octaves: {} };
  const octaves = {};
  const folded = values.map((value) => {
    const f = foldOctave(value);
    octaves[f.octaves] = (octaves[f.octaves] || 0) + 1;
    return f.cents;
  });
  const sorted = folded.slice().sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return { n: values.length, median, min: sorted[0], max: sorted[sorted.length - 1], octaves };
}

exports.tempoCanon = tempoCanon;
exports.foldOctave = foldOctave;
exports.robustSummary = robustSummary;
exports.queueRows = queueRows;
exports.jitter = jitter;
exports.centsError = centsError;
exports.dictValues = dictValues;
exports.compareValues = compareValues;
