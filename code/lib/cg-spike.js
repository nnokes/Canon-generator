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

// Intended and measured onset times (ms), both measured from their own first
// onset, so a constant start-up latency doesn't count as jitter.
function jitter(intended, actual) {
  const n = Math.min(intended.length, actual.length);
  if (n === 0) return { count: 0, meanAbs: 0, maxAbs: 0, last: 0 };
  let sum = 0;
  let max = 0;
  let last = 0;
  for (let i = 0; i < n; i++) {
    const error = actual[i] - actual[0] - (intended[i] - intended[0]);
    sum += Math.abs(error);
    max = Math.max(max, Math.abs(error));
    last = error;
  }
  return { count: n, meanAbs: sum / n, maxAbs: max, last };
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

exports.tempoCanon = tempoCanon;
exports.queueRows = queueRows;
exports.jitter = jitter;
exports.centsError = centsError;
exports.dictValues = dictValues;
exports.compareValues = compareValues;
