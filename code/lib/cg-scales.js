"use strict";
// The starter scale systems: one or more of every builder in cg-tuning, so
// each kind can be auditioned in Max (M1). They're code, not files: the
// bundler inlines them, so Max never has to find a data folder (PLAN.md 2.2).

const tuning = require("cg-tuning");

const C4 = { step: 0, midi: 60 };
const D4 = { step: 0, midi: 62 };

const STARTERS = [
  { name: "12-EDO", build: () => tuning.edo(12, { ref: C4 }) },
  { name: "19-EDO", build: () => tuning.edo(19, { ref: C4 }) },
  { name: "22-EDO", build: () => tuning.edo(22, { ref: C4 }) },
  { name: "24-EDO (quarter tones)", build: () => tuning.edo(24, { ref: C4 }) },
  { name: "31-EDO", build: () => tuning.edo(31, { ref: C4 }) },
  // The PLAN.md 3.1 example: D Dorian in 31-EDO's meantone diatonic.
  { name: "31-EDO D Dorian", build: () => tuning.edo(31, { ref: D4, mode: [0, 5, 8, 13, 18, 23, 26] }) },
  { name: "53-EDO", build: () => tuning.edo(53, { ref: C4 }) },
  { name: "72-EDO", build: () => tuning.edo(72, { ref: C4 }) },
  {
    name: "Just major (5-limit)",
    build: () => tuning.ji(["9/8", "5/4", "4/3", "3/2", "5/3", "15/8", "2/1"], { ref: C4 }),
  },
  {
    name: "Harmonics 8-16 as a scale",
    build: () => tuning.ji(["9/8", "10/8", "11/8", "12/8", "13/8", "14/8", "15/8", "2/1"],
      { ref: C4 }),
  },
  { name: "Bohlen-Pierce (13-ED3)", build: () => tuning.bohlenPierce({ ref: C4 }) },
  { name: "ME(12,7): the diatonic", build: () => tuning.maximallyEven(12, 7, { ref: C4 }) },
  { name: "ME(22,7)", build: () => tuning.maximallyEven(22, 7, { ref: C4 }) },
  { name: "ME(31,7)", build: () => tuning.maximallyEven(31, 7, { ref: C4 }) },
  { name: "Harmonics 1-32 on A1 (55 Hz)", build: () => tuning.harmonic(1, 32, 55) },
  { name: "Undertones 1-16 under A6 (1760 Hz)", build: () => tuning.subharmonic(1, 16, 1760) },
  { name: "Stretched spectrum (s 1.05) on 55 Hz", build: () => tuning.stretched(1, 24, 55, 1.05) },
  { name: "Compressed spectrum (s 0.95) on 55 Hz", build: () => tuning.stretched(1, 24, 55, 0.95) },
  // Carrier and modulator sqrt(2) apart (an equal-tempered tritone): an inharmonic spectrum.
  { name: "FM 440:311.13 Hz, 5 sidebands", build: () => tuning.fm(440, 311.127, 5) },
  // An idealized minor-third church bell on a 220 Hz prime: hum, prime,
  // tierce (6/5), quint, nominal, deciem, twelfth, upper octave.
  {
    name: "Idealized bell (Hz list)",
    build: () => tuning.hzList([110, 220, 264, 330, 440, 550, 660, 880]),
  },
];

function starter(index) {
  if (!Number.isInteger(index) || index < 0 || index >= STARTERS.length) {
    throw new Error(`no starter system ${index} (0-${STARTERS.length - 1})`);
  }
  const entry = STARTERS[index];
  return { ...entry.build(), name: entry.name };
}

exports.names = () => STARTERS.map((s) => s.name);
exports.starter = starter;
exports.count = STARTERS.length;
