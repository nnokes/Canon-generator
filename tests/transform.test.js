"use strict";
// M2: the canon transforms in code/lib/cg-transform.js (PLAN.md 3.1), and the
// property tests PLAN.md 6 asks for.
const test = require("node:test");
const assert = require("node:assert/strict");

const tuning = require("cg-tuning");
const tf = require("cg-transform");
const { melody } = require("cg-presets");

const near = (a, b, tol, label) => assert.ok(Math.abs(a - b) <= tol, `${label}: ${a} is not within ${tol} of ${b}`);
const major = tuning.edo(12, { mode: [0, 2, 4, 5, 7, 9, 11] });
const edo31 = tuning.edo(31);
const harmonic = tuning.harmonic(1, 16, 55);
const notes = (text, system = major) => melody(text).map((n, i) => tf.note(n, system, i));
const pitches = (list, system = major) => list.map((n) => (n.rest ? null : tf.pitchOf(n, system)));
const durs = (list) => list.map((n) => n.dur);

// A melody with off-scale inflections (offsets) and a rest, to keep the properties honest.
function sample(system = major) {
  const list = notes("0 2:0.5 4:1.5 r:1 3 -1:2 5", system);
  list[1] = { ...list[1], offset: 31.4 };
  list[5] = { ...list[5], offset: -12.5 };
  return list;
}

function samePitches(a, b, system, label) {
  const pa = pitches(a, system);
  const pb = pitches(b, system);
  assert.equal(pa.length, pb.length, `${label}: length`);
  pa.forEach((p, i) => (p === null ? assert.equal(pb[i], null) : near(pb[i], p, 1e-9, `${label}: note ${i}`)));
  durs(a).forEach((d, i) => near(b[i].dur, d, 1e-12, `${label}: dur ${i}`));
}

// ---------------------------------------------------------------- notes and intervals

test("notes: by degree, by float pitch (degree + offset), by Hz, or rests", () => {
  const [byDegree, byPitch, byHz, rest] = [
    tf.note({ dur: 1, degree: 4 }, major, 0),
    tf.note({ dur: 1, pitch: 64.5 }, major, 1),
    tf.note({ dur: 1, hz: 440 }, major, 2),
    tf.note({ dur: 2, rest: true }, major, 3),
  ];
  near(tf.pitchOf(byDegree, major), 67, 1e-12, "degree 4 of C major is G4");
  assert.equal(byPitch.degree, 2, "64.5: nearest E (ties go down)");
  near(byPitch.offset, 50, 1e-9, "a quarter-tone above E");
  near(tf.pitchOf(byPitch, major), 64.5, 1e-12, "exact");
  near(tf.pitchOf(byHz, major), 69, 1e-12, "440 Hz is A4");
  assert.equal(rest.rest, true);
  assert.throws(() => tf.note({ dur: 0, degree: 1 }, major, 4), /dur must be above 0/);
  assert.throws(() => tf.note({ dur: 1 }, major, 5), /give a degree/);
});

test("intervals: a number is scale steps; cents and ratios are exact", () => {
  assert.deepEqual(tf.interval(3), { domain: "degree", steps: 3 });
  assert.deepEqual(tf.interval({ steps: -4 }), { domain: "degree", steps: -4 });
  assert.deepEqual(tf.interval(undefined), { domain: "degree", steps: 0 });
  near(tf.interval({ ratio: "3/2" }).cents, 701.955, 1e-3, "3/2");
  assert.equal(tf.interval({ cents: 50, quantize: "nearest" }).nearest, true);
  assert.throws(() => tf.interval({ steps: 1.5 }), /whole steps/);
  assert.throws(() => tf.interval({ domain: "absolute" }), /cents or a ratio/);
});

test("transpose: scalar in the degree domain, chromatic in the absolute domain", () => {
  const e = tf.note({ dur: 1, degree: 2 }, major, 0); // E4
  // Up a third by steps: E -> G (a minor third); up 400 cents exactly: E -> G#, off the scale.
  near(tf.pitchOf(tf.transpose(e, tf.interval(2), major), major), 67, 1e-12, "E + 2 steps = G");
  const sharp = tf.transpose(e, tf.interval({ cents: 400 }), major);
  near(tf.pitchOf(sharp, major), 68, 1e-12, "E + 400 c = G#");
  assert.equal(sharp.offset, 100, "G# is G plus 100 cents in C major");
  const snapped = tf.transpose(e, tf.interval({ cents: 400, quantize: "nearest" }), major);
  assert.equal(snapped.offset, 0, "nearest: snapped onto the scale");
  // Interscalar: degree 2 read in 31-EDO's meantone major (steps 0 5 10 13 18 23 28).
  const meantone = tuning.edo(31, { mode: [0, 5, 10, 13, 18, 23, 28] });
  near(tf.pitchOf(tf.transpose(e, tf.interval(0), major, meantone), meantone), 60 + (10 * 12) / 31, 1e-12, "E in meantone");
});

// ---------------------------------------------------------------- properties (PLAN.md 6)

test("property: I∘I = id, for every axis kind", () => {
  const cases = [
    [major, { degree: 1.5 }],
    [major, { kind: "log", pitch: 63.3 }],
    [major, { kind: "linear", hz: 400 }],
    [harmonic, { kind: "partial" }],
  ];
  for (const [system, spec] of cases) {
    const list = system === harmonic ? notes("0 3 7 15 r 2", harmonic) : sample(system);
    const ax = tf.axis(spec, list.find((n) => !n.rest), system);
    const twice = list.map((n) => tf.invert(tf.invert(n, ax, system), ax, system));
    samePitches(list, twice, system, `I∘I, ${ax.kind} axis`);
  }
});

test("property: R∘R = id; retrograde reverses rests too", () => {
  const list = sample();
  samePitches(list, tf.retrograde(tf.retrograde(list)), major, "R∘R");
  assert.deepEqual(tf.retrograde(list).map((n) => n.index), [6, 5, 4, 3, 2, 1, 0]);
});

test("property: transposing up then down is the identity, in both domains", () => {
  const list = sample();
  for (const spec of [5, -9, { cents: 386.3 }, { ratio: "7/4" }]) {
    const up = tf.interval(spec);
    const down = tf.times(up, -1);
    const back = list.map((n) => tf.transpose(tf.transpose(n, up, major), down, major));
    samePitches(list, back, major, `T(${JSON.stringify(spec)}) then back`);
  }
});

test("property: augmentation then diminution is the identity, irrational ratios included", () => {
  const list = sample();
  for (const s of [2, 3, Math.SQRT2, Math.PI / 2]) {
    samePitches(list, tf.timeScale(tf.timeScale(list, s), 1 / s), major, `time scale ${s}`);
  }
  near(durs(tf.timeScale(list, 2)).reduce((a, b) => a + b), 2 * durs(list).reduce((a, b) => a + b), 1e-12, "twice as long");
  assert.throws(() => tf.timeScale(list, 0), /above 0/);
});

test("property: transforms compose (T∘I∘R), and pitch maps commute with retrograde", () => {
  const list = sample();
  const ax = tf.axis({ degree: 2 }, list[0], major);
  const T = tf.interval(-3);
  const a = tf.retrograde(list).map((n) => tf.transpose(tf.invert(n, ax, major), T, major));
  const b = tf.retrograde(list.map((n) => tf.transpose(tf.invert(n, ax, major), T, major)));
  samePitches(a, b, major, "R then (T∘I) = (T∘I) then R");
  // Inversion around degree 2 maps degree d to 4 - d, then -3 steps: 1 - d.
  const sounding = tf.retrograde(list).filter((n) => !n.rest).map((n) => n.degree); // 5 -1 3 4 2 0
  assert.deepEqual(a.filter((n) => !n.rest).map((n) => n.degree), sounding.map((d) => 1 - d));
  assert.deepEqual(sounding.map((d) => 1 - d), [-4, 2, -2, -3, -1, 1]);
});

// ---------------------------------------------------------------- inversion axes

test("inversion axes: scale steps, cents, partial numbers, Hz", () => {
  const list = notes("0 2 4"); // C E G
  const deg = tf.axis({ degree: 2 }, list[0], major);
  assert.deepEqual(list.map((n) => tf.invert(n, deg, major).degree), [4, 2, 0], "around E: C<->G");
  const log = tf.axis({ kind: "log", pitch: 64 }, list[0], major);
  assert.deepEqual(pitches(list.map((n) => tf.invert(n, log, major))), [68, 64, 61], "around E4 in cents: C->G#, G->C#");
  // Default axis: the first note.
  assert.equal(tf.axis(undefined, list[1], major).degree, 2);
  // Partials 1-16 over 55 Hz: n -> 17 - n, so partial 2 <-> 15 and 16 <-> 1.
  const h = notes("1 15", harmonic);
  const part = tf.axis({ kind: "partial" }, h[0], harmonic);
  assert.equal(part.N, 16);
  assert.deepEqual(h.map((n) => tf.invert(n, part, harmonic).degree), [14, 0]);
  // Linear: f -> 2c - f. Around 440 Hz, 330 Hz -> 550 Hz (Hz, not cents, are mirrored).
  const lin = tf.axis({ kind: "linear", hz: 440 }, list[0], major);
  const a = tf.note({ dur: 1, hz: 330 }, major, 0);
  near(tuning.midiToHz(tf.pitchOf(tf.invert(a, lin, major), major)), 550, 1e-9, "330 -> 550 Hz");
  assert.throws(() => tf.invert(tf.note({ dur: 1, hz: 1000 }, major, 0), lin, major), /below 0 Hz/);
  assert.throws(() => tf.axis({ kind: "partial" }, list[0], major), /needs a spectrum/);
  assert.throws(() => tf.axis({ degree: 0.3 }, list[0], major), /half degree/);
});

// ---------------------------------------------------------------- segments, talea

test("segmentRetrograde: each bar backwards in place (Mann Ex. 233-234)", () => {
  // Two 4-beat bars: C D E F | G A B C.
  const list = notes("0 1 2 3 | 4 5 6 7");
  const out = tf.segmentRetrograde(list, 4);
  assert.deepEqual(out.map((n) => n.degree), [3, 2, 1, 0, 7, 6, 5, 4]);
  samePitches(list, tf.segmentRetrograde(out, 4), major, "twice is the identity");
  // A note across the bar line is split there.
  const across = tf.segmentRetrograde(notes("0:3 1:2 2:3"), 4);
  assert.deepEqual(across.map((n) => [n.degree, n.dur]), [[1, 1], [0, 3], [2, 3], [1, 1]]);
});

test("segmentPermute: beats reordered in each bar, ties and rests moving with them (Mann Ex. 237-238)", () => {
  // 3/4 bars; the answer plays the third quarter first, then the first, then the second.
  const list = notes("0 1 r | 2:2 3");
  const out = tf.segmentPermute(list, 3, [2, 0, 1]);
  assert.deepEqual(out.map((n) => (n.rest ? "r" : n.degree)), ["r", 0, 1, 3, 2]);
  assert.deepEqual(out.map((n) => n.dur), [1, 1, 1, 1, 2], "the tied half note rejoins: beats 1 and 2 stay in order");
  samePitches(list, tf.segmentPermute(list, 3, [0, 1, 2]), major, "the identity permutation");
  const bars = notes("0 1 2 | 3 4 5");
  const there = tf.segmentPermute(bars, 3, [2, 0, 1]);
  samePitches(bars, tf.segmentPermute(there, 3, [1, 2, 0]), major, "[2, 0, 1], then its inverse [1, 2, 0]");
  assert.throws(() => tf.segmentPermute(list, 3, [0, 0, 1]), /must reorder/);
});

test("talea: the pitch order stays, the durations cycle; negative entries are rests", () => {
  const list = notes("0 1 r 2 3 4");
  const out = tf.applyRhythm(list, [1.5, -0.5, 1]);
  assert.deepEqual(out.map((n) => (n.rest ? `r${n.dur}` : `${n.degree}:${n.dur}`)),
    ["0:1.5", "r0.5", "1:1", "2:1.5", "r0.5", "3:1", "4:1.5"], "the dux's own rest is replaced");
  assert.deepEqual(tf.applyRhythm(list, null, 2).map((n) => n.dur), [2, 2, 2, 2, 2, 2], "no talea: the time scale only");
  assert.throws(() => tf.rhythm([-1, -2]), /at least one of them positive/);
  assert.throws(() => tf.rhythm([1, 0]), /non-zero/);
});
