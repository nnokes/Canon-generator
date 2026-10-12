"use strict";
// Pitch is a float MIDI number: 60 is middle C, 60.5 a quarter-tone above it.
// The engine never rounds it; Hz is derived from it. M1 adds the scale-system
// builders (PLAN.md 3.1).

// The reference pitch: A4 = MIDI 69 = 440 Hz unless a scale system says otherwise.
const A4 = { midi: 69, hz: 440 };

function midiToHz(pitch, ref = A4) {
  return ref.hz * Math.pow(2, (pitch - ref.midi) / 12);
}

function hzToMidi(hz, ref = A4) {
  return ref.midi + 12 * Math.log2(hz / ref.hz);
}

// The interval from a to b in cents (both float MIDI pitches).
function cents(a, b) {
  return (b - a) * 100;
}

// Step `step` of an equal division of the octave into `divisions` parts,
// counted from `baseMidi`.
function edoPitch(divisions, step, baseMidi) {
  if (!(divisions > 0)) throw new Error("edoPitch: divisions must be positive, got " + divisions);
  return baseMidi + (step * 12) / divisions;
}

// A pitch tracker on a harmonically rich sound often locks onto the period
// (octave) below or above (M0 spike c, on Drift). Fold an error in cents to the
// nearest period: the residual in [-period/2, period/2) and how many periods
// were dropped.
function foldCents(value, period = 1200) {
  const periods = Math.round(value / period) || 0; // || 0: no "-0" period
  return { cents: value - period * periods, periods };
}

// n, median, min and max of the folded errors, and how many landed in each
// period ({ "-1": 8, "0": 2 }). The median ignores the odd wild reading,
// which a mean doesn't. For checking pitch output against what was sent.
function centsSummary(errors, period = 1200) {
  if (errors.length === 0) return { n: 0, median: 0, min: 0, max: 0, periods: {} };
  const periods = {};
  const folded = errors.map((value) => {
    const f = foldCents(value, period);
    periods[f.periods] = (periods[f.periods] || 0) + 1;
    return f.cents;
  });
  const sorted = folded.slice().sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return { n: errors.length, median, min: sorted[0], max: sorted[sorted.length - 1], periods };
}

exports.A4 = A4;
exports.midiToHz = midiToHz;
exports.hzToMidi = hzToMidi;
exports.cents = cents;
exports.edoPitch = edoPitch;
exports.foldCents = foldCents;
exports.centsSummary = centsSummary;
