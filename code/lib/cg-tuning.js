"use strict";
// Pitch is a float MIDI number: 60 is middle C, 60.5 a quarter-tone above it.
// The engine never rounds it; Hz is derived from it. M0 holds only the
// conversions the spikes need. M1 adds the scale-system builders (PLAN.md 3.1).

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

exports.A4 = A4;
exports.midiToHz = midiToHz;
exports.hzToMidi = hzToMidi;
exports.cents = cents;
exports.edoPitch = edoPitch;
