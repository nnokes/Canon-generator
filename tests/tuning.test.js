"use strict";
// M1: scale systems in code/lib/cg-tuning.js and the starters in cg-scales.js.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const tuning = require("cg-tuning");
const scales = require("cg-scales");

const FIXTURES = path.join(__dirname, "fixtures");
const fixture = (name) => fs.readFileSync(path.join(FIXTURES, name), "utf8");
const near = (actual, expected, tolerance, label) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual} is not within ${tolerance} of ${expected}`);
const cents = (system) => Array.from({ length: tuning.size(system) }, (_, d) => tuning.degreeCents(system, d));

// ---------------------------------------------------------------- builders: known cents values

test("n-EDO: step k is k * 1200 / n, and periods repeat both ways", () => {
  for (const n of [12, 19, 22, 24, 31, 53, 72]) {
    const edo = tuning.edo(n);
    assert.equal(tuning.size(edo), n);
    for (const k of [0, 1, n - 1]) near(tuning.degreeCents(edo, k), (k * 1200) / n, 1e-9, `${n}-EDO step ${k}`);
    near(tuning.degreeCents(edo, n), 1200, 1e-9, `${n}-EDO: degree n is the octave`);
    near(tuning.degreeCents(edo, -1), 1200 - 1200 / n - 1200, 1e-9, `${n}-EDO: degree -1`);
  }
  // Reference: C4 = 60 unless set; 31-EDO step 5 above D4 is M0's test note.
  const d4 = tuning.edo(31, { ref: { step: 0, midi: 62 } });
  near(tuning.degreeToPitch(d4, 5), 63.935483870967744, 1e-12, "31-EDO step 5 above D4");
  near(tuning.degreeToHz(d4, 5), 328.40145361845435, 1e-9, "its Hz");
});

test("just intonation: ratios in cents, sorted, the last one the period", () => {
  const major = tuning.ji(["9/8", "5/4", "4/3", "3/2", "5/3", "15/8", "2/1"]);
  near(tuning.degreeCents(major, 4), 701.9550008653874, 1e-9, "3/2");
  near(tuning.degreeCents(major, 2), 386.3137138648348, 1e-9, "5/4");
  assert.equal(major.period_cents, 1200);
  assert.deepEqual(major.ratios, ["1/1", "9/8", "5/4", "4/3", "3/2", "5/3", "15/8"]);
  assert.equal(major.period_ratio, "2/1");
  // Unsorted input is sorted; numbers and bare integers work too.
  const seventh = tuning.ji(["7/4", 1.5, "2"]);
  near(tuning.degreeCents(seventh, 2), 968.8259064691249, 1e-9, "7/4");
  near(tuning.degreeCents(seventh, 1), 701.9550008653874, 1e-9, "1.5");
  assert.throws(() => tuning.ji(["3/2", "1/1"]), /period/);
  assert.throws(() => tuning.ji(["5/2", "2/1"]), /between 1\/1 and the period/);
  assert.throws(() => tuning.ji(["three/2", "2/1"]), /not a ratio/);
});

test("Bohlen-Pierce: 13 equal steps to a 3:1 tritave", () => {
  const bp = tuning.bohlenPierce();
  near(bp.period_cents, 1901.9550008653873, 1e-9, "tritave");
  near(tuning.degreeCents(bp, 1), 146.30423083579902, 1e-9, "one step");
  near(tuning.degreeCents(bp, 13), bp.period_cents, 1e-9, "degree 13 is the tritave");
  // Any equal division of any period.
  near(tuning.degreeCents(tuning.ed(9, 1200 * Math.log2(1.5)), 9), 701.9550008653874, 1e-9, "9 steps to 3/2");
});

test("maximally even ME(c, d): Clough and Douthett's sets, as a mode of c-EDO", () => {
  assert.deepEqual(tuning.maximallyEven(12, 7).mode, [0, 1, 3, 5, 6, 8, 10]); // a diatonic collection
  assert.deepEqual(tuning.maximallyEven(12, 5).mode, [0, 2, 4, 7, 9]); // the pentatonic
  // Not 31-EDO's meantone diatonic {0, 5, 10, 13, 18, 23, 28}: a near-equal 7-note scale.
  const me31 = tuning.maximallyEven(31, 7);
  assert.deepEqual(me31.mode, [0, 4, 8, 13, 17, 22, 26]);
  assert.notDeepEqual(me31.mode, [0, 5, 10, 13, 18, 23, 28]);
  assert.equal(tuning.size(me31), 7);
  near(tuning.degreeCents(me31, 7), 1200, 1e-9, "degree 7 is the octave");
  // Every interval comes in at most two sizes (Myhill's property, which ME sets have).
  const steps = me31.mode.map((s, i) => ((me31.mode[(i + 1) % 7] - s) + 31) % 31);
  assert.equal(new Set(steps).size, 2);
  assert.deepEqual(tuning.maximallyEven(12, 7, { offset: 3 }).mode, [0, 2, 3, 5, 7, 9, 10]);
  assert.throws(() => tuning.maximallyEven(7, 12), /d <= c/);
});

test("harmonic and undertone series: non-repeating, exact partials", () => {
  const h = tuning.harmonic(1, 32, 55);
  assert.equal(h.period_cents, null);
  assert.equal(tuning.size(h), 32);
  near(tuning.degreeToHz(h, 0), 55, 1e-9, "partial 1");
  near(tuning.degreeToHz(h, 6), 385, 1e-9, "partial 7");
  near(tuning.degreeToHz(h, 31), 1760, 1e-9, "partial 32");
  assert.equal(h.ratios[6], "7/1");
  assert.throws(() => tuning.degreeToHz(h, 32), /outside its 32 degrees/);
  assert.throws(() => tuning.degreeToHz(h, -1), /outside/);

  const u = tuning.subharmonic(1, 16, 1760);
  near(tuning.degreeToHz(u, 0), 110, 1e-9, "1760 / 16, the lowest");
  near(tuning.degreeToHz(u, 14), 880, 1e-9, "1760 / 2");
  near(tuning.degreeToHz(u, 15), 1760, 1e-9, "1760 / 1, the highest");
  assert.equal(u.ratios[1], "16/15");
});

test("stretched and compressed spectra: partial k at f0 * k^s", () => {
  const s = tuning.stretched(1, 24, 55, 1.05);
  near(tuning.degreeCents(s, 1), 1260, 1e-9, "the 'octave' stretched to 1260 c");
  near(tuning.degreeToHz(s, 2), 55 * Math.pow(3, 1.05), 1e-9, "partial 3");
  const c = tuning.stretched(1, 24, 55, 0.95);
  near(tuning.degreeCents(c, 1), 1140, 1e-9, "compressed to 1140 c");
  // s = 1 is the harmonic series.
  const plain = tuning.stretched(2, 9, 100, 1);
  cents(plain).forEach((value, d) => near(value, tuning.degreeCents(tuning.harmonic(2, 9, 100), d), 1e-9, `partial ${d + 2}`));
});

test("FM spectrum and a raw Hz list: sorted, de-duplicated, from the lowest", () => {
  const spectrum = tuning.fm(440, 311.127, 5);
  const hz = Array.from({ length: tuning.size(spectrum) }, (_, d) => tuning.degreeToHz(spectrum, d));
  for (let i = 1; i < hz.length; i++) assert.ok(hz[i] > hz[i - 1]);
  for (const expected of [440, 751.127, 128.873, 182.254, 1062.254]) {
    assert.ok(hz.some((f) => Math.abs(f - expected) < 1e-6), `${expected} Hz is in the spectrum`);
  }
  // Carrier = modulator: 0 Hz is dropped, 440 appears once.
  const harmonic = tuning.fm(440, 440, 2);
  assert.deepEqual(Array.from({ length: tuning.size(harmonic) }, (_, d) => Math.round(tuning.degreeToHz(harmonic, d))), [440, 880, 1320]);

  const bell = tuning.hzList([880, 110, 264, 220, 220]);
  assert.equal(tuning.size(bell), 4);
  near(tuning.degreeToHz(bell, 0), 110, 1e-9, "lowest first");
  near(tuning.degreeToHz(bell, 3), 880, 1e-9, "highest last");
  assert.throws(() => tuning.hzList([440, 0]), /above 0/);
});

// ---------------------------------------------------------------- modes, reference, quantize

test("modes: degrees walk the mode's steps, across periods", () => {
  // The PLAN.md 3.1 example: 31-EDO D Dorian plays D E F G A B C.
  const dorian = tuning.edo(31, { ref: { step: 0, midi: 62 }, mode: [0, 5, 8, 13, 18, 23, 26] });
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const played = Array.from({ length: 7 }, (_, d) => names[Math.round(tuning.degreeToPitch(dorian, d)) % 12]);
  assert.deepEqual(played, ["D", "E", "F", "G", "A", "B", "C"]);
  near(tuning.degreeToPitch(dorian, 7), 74, 1e-12, "degree 7: D an octave up");
  near(tuning.degreeToPitch(dorian, -1), 62 + ((26 - 31) * 12) / 31, 1e-12, "degree -1: C below");
  // Changing the mode or the reference makes a new system; the old one is untouched.
  const phrygian = tuning.withMode(dorian, [0, 3, 8, 13, 18, 21, 26]);
  assert.deepEqual(dorian.mode, [0, 5, 8, 13, 18, 23, 26]);
  assert.equal(tuning.size(tuning.withMode(dorian, [])), 31, "no mode: every step");
  near(tuning.degreeToPitch(tuning.withRef(phrygian, { step: 0, midi: 64 }), 0), 64, 1e-12, "re-anchored on E");
  assert.throws(() => tuning.withMode(dorian, [0, 5, 40]), /isn't a step/);
  assert.throws(() => tuning.withMode(dorian, [5, 0]), /ascend/);
});

test("reference pitch: by MIDI or by Hz, on any step", () => {
  const a = tuning.edo(12, { ref: { step: 9, hz: 432 } });
  near(tuning.degreeToHz(a, 9), 432, 1e-9, "A at 432 Hz");
  near(tuning.degreeToHz(a, 21), 864, 1e-9, "an octave up");
  near(tuning.degreeToPitch(a, 9), tuning.hzToMidi(432), 1e-12, "as a MIDI pitch");
});

test("quantize: nearest degree, ties to the lower, the error in cents", () => {
  const c12 = tuning.edo(12);
  assert.deepEqual(pick(tuning.quantize(c12, 60.4)), [0, 60, 40]);
  assert.deepEqual(pick(tuning.quantize(c12, 60.5)), [0, 60, 50], "exactly halfway: the lower");
  assert.deepEqual(pick(tuning.quantize(c12, 60.6)), [1, 61, -40]);
  assert.deepEqual(pick(tuning.quantize(c12, 47.2)), [-13, 47, 20], "below the reference");
  // With a mode, only the mode's degrees count; ME(12,7) on C is C Db Eb F Gb Ab Bb.
  const me = tuning.maximallyEven(12, 7);
  assert.deepEqual(pick(tuning.quantize(me, 62)), [1, 61, 100], "D: halfway between Db and Eb");
  assert.deepEqual(pick(tuning.quantize(me, 71.6)), [7, 72, -40], "into the next period");
  assert.deepEqual(pick(tuning.quantize(me, 59)), [-1, 58, 100], "halfway into the period below");
  // Non-repeating: outside the system, the nearest end.
  const h = tuning.harmonic(1, 8, 55);
  assert.equal(tuning.quantize(h, 0).degree, 0);
  assert.equal(tuning.quantize(h, 127).degree, 7);
  assert.equal(tuning.quantize(h, tuning.hzToMidi(55 * 5 * 1.001)).degree, 4, "near partial 5");
});

function pick({ degree, pitch, error }) {
  return [degree, Math.round(pitch * 1e9) / 1e9, Math.round(error * 1e9) / 1e9];
}

// ---------------------------------------------------------------- properties, over every starter

test("every starter builds, with unique names", () => {
  const names = scales.names();
  assert.equal(names.length, scales.count);
  assert.equal(new Set(names).size, names.length);
  for (let i = 0; i < scales.count; i++) assert.equal(scales.starter(i).name, names[i], `starter ${i}`);
  assert.throws(() => scales.starter(scales.count), /no starter/);
});

test("properties: steps ascend; degree -> pitch -> degree; quantizing twice changes nothing", () => {
  for (let i = 0; i < scales.count; i++) {
    const system = scales.starter(i);
    const count = tuning.size(system);
    const degrees = system.period_cents === null
      ? Array.from({ length: count }, (_, d) => d)
      : Array.from({ length: 4 * count + 1 }, (_, d) => d - 2 * count);
    let previous = -Infinity;
    for (const d of degrees) {
      const pitch = tuning.degreeToPitch(system, d);
      assert.ok(pitch > previous, `${system.name}: degree ${d} is above degree ${d - 1}`);
      previous = pitch;
      const q = tuning.quantize(system, pitch);
      assert.equal(q.degree, d, `${system.name}: degree ${d} round trip`);
      near(q.error, 0, 1e-6, `${system.name}: degree ${d} error`);
      near(tuning.midiToHz(pitch), tuning.degreeToHz(system, d), 1e-9 * tuning.degreeToHz(system, d), `${system.name}: Hz`);
    }
    for (const pitch of [36.3, 59.99, 60.01, 71.5, 84.77]) {
      const once = tuning.quantize(system, pitch);
      assert.equal(tuning.quantize(system, once.pitch).degree, once.degree, `${system.name}: quantize ${pitch} twice`);
    }
  }
});

// ---------------------------------------------------------------- Scala .scl

test(".scl: ratios, cents, a non-octave period, and an untidy file", () => {
  const major = tuning.parseScl(fixture("ji-major.scl"));
  assert.deepEqual(major.warnings, []);
  assert.equal(major.system.name, "Just major (5-limit)");
  assert.deepEqual(major.system.ratios, ["1/1", "9/8", "5/4", "4/3", "3/2", "5/3", "15/8"]);
  near(major.system.steps_cents[4], 701.9550008653874, 1e-9, "3/2");

  const meantone = tuning.parseScl(fixture("meantone-quarter-comma.scl")).system;
  assert.equal(tuning.size(meantone), 12);
  near(meantone.steps_cents[7], (1200 * Math.log2(5)) / 4, 1e-3, "the quarter-comma fifth");
  near(meantone.steps_cents[4], 1200 * Math.log2(5 / 4), 1e-3, "a pure major third");
  assert.equal(meantone.ratios[7], null, "cents only");

  const bp = tuning.parseScl(fixture("bohlen-pierce-ji.scl")).system;
  near(bp.period_cents, tuning.TRITAVE, 1e-9, "period 3/1");
  assert.equal(tuning.size(bp), 13);

  const messy = tuning.parseScl(fixture("messy.scl"));
  assert.equal(messy.system.name, "Messy but valid");
  assert.deepEqual(messy.system.ratios, ["1/1", "9/8", null, "3/2"]);
  near(messy.system.steps_cents[2], 386.31371, 1e-9, "cents with text after them");
  assert.equal(messy.system.period_ratio, "2/1", "a bare 2 is 2/1");
});

test(".scl round trip: parse -> write -> parse gives the same system", () => {
  const systems = ["ji-major.scl", "meantone-quarter-comma.scl", "bohlen-pierce-ji.scl", "messy.scl"]
    .map((name) => tuning.parseScl(fixture(name)).system);
  systems.push(tuning.edo(31), tuning.bohlenPierce(), tuning.maximallyEven(22, 7), scales.starter(9));
  for (const system of systems) {
    const again = tuning.parseScl(tuning.writeScl(system)).system;
    assert.equal(again.name, system.name);
    near(again.period_cents, system.period_cents, 1e-6, `${system.name}: period`);
    assert.equal(again.steps_cents.length, system.steps_cents.length, `${system.name}: size`);
    system.steps_cents.forEach((c, i) => near(again.steps_cents[i], c, 1e-6, `${system.name}: step ${i}`));
    if (system.ratios) assert.deepEqual(again.ratios, system.ratios, `${system.name}: ratios kept`);
  }
  assert.throws(() => tuning.writeScl(tuning.harmonic(1, 8, 55)), /non-repeating/);
});

test(".scl: unsorted pitches are sorted with a warning; broken files are refused", () => {
  const unsorted = tuning.parseScl("Unsorted\n 3\n 3/2\n 5/4\n 2/1\n");
  assert.deepEqual(unsorted.system.ratios, ["1/1", "5/4", "3/2"]);
  assert.match(unsorted.warnings[0], /sorted/);
  assert.throws(() => tuning.parseScl("Too few\n 3\n 5/4\n 2/1\n"), /says 3 notes but has 2/);
  assert.throws(() => tuning.parseScl("Bad count\n three\n"), /note count/);
  assert.throws(() => tuning.parseScl("Bad pitch\n 2\n five/4\n 2/1\n"), /neither cents/);
  assert.throws(() => tuning.parseScl("Above the period\n 2\n 3/1\n 2/1\n"), /between 1\/1 and the period/);
  assert.throws(() => tuning.parseScl("! only comments\n"), /not a Scala file/);
});
