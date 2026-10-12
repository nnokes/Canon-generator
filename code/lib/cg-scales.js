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

// A scale system as a canon spec writes it (PLAN.md 3.1), e.g.
//   { type: "edo", divisions: 31, ref: { step: 0, midi: 62 }, mode: [0, 5, 8, 13, 18, 23, 26] }
// Types: edo, ed, bp, ji, harmonic, subharmonic, stretched, fm, me, hz, scl (the
// file's text), starter (a menu index). ref, mode and name are optional on all.
function fromSpec(spec = { type: "edo", divisions: 12 }) {
  const options = {};
  if (spec.name) options.name = spec.name;
  if (spec.ref) options.ref = spec.ref;
  if (spec.mode) options.mode = spec.mode;
  let system;
  switch (spec.type) {
    case "edo": system = tuning.edo(spec.divisions, options); break;
    case "ed": system = tuning.ed(spec.divisions, spec.period, options); break;
    case "bp": system = tuning.bohlenPierce(options); break;
    case "ji": system = tuning.ji(spec.ratios, options); break;
    case "harmonic": system = tuning.harmonic(spec.low, spec.high, spec.f0, options); break;
    case "subharmonic": system = tuning.subharmonic(spec.low, spec.high, spec.f0, options); break;
    case "stretched": system = tuning.stretched(spec.low, spec.high, spec.f0, spec.s, options); break;
    case "fm": system = tuning.fm(spec.carrier, spec.modulator, spec.sidebands, options); break;
    case "me": system = tuning.maximallyEven(spec.c, spec.d, { ...options, offset: spec.offset }); break;
    case "hz": system = tuning.hzList(spec.hz, options); break;
    case "scl": system = tuning.parseScl(spec.text).system; break;
    case "starter": system = starter(spec.index); break;
    default: throw new Error(`unknown system type "${spec.type}"`);
  }
  // A file or starter keeps its own ref and mode unless the spec gives them.
  if (spec.type === "scl" || spec.type === "starter") {
    if (spec.ref) system = tuning.withRef(system, spec.ref);
    if (spec.mode) system = tuning.withMode(system, spec.mode);
    if (spec.name) system = { ...system, name: spec.name };
  }
  return system;
}

exports.fromSpec = fromSpec;
exports.names = () => STARTERS.map((s) => s.name);
exports.starter = starter;
exports.count = STARTERS.length;
