"use strict";
// M3 parts B and C: the analyzer (cg-analyze) and the rule profiles (cg-rules),
// with the golden tests from Fux, The Study of Counterpoint, Figs. 5-8.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const analyze = require("cg-analyze");
const rules = require("cg-rules");
const scales = require("cg-scales");
const tuning = require("cg-tuning");
const canon = require("cg-canon");
const presets = require("cg-presets");

const FUX = path.join(__dirname, "fixtures", "fux");
const fixture = (name) => JSON.parse(fs.readFileSync(path.join(FUX, name), "utf8"));
const near = (actual, expected, tolerance, label) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual} is not within ${tolerance} of ${expected}`);
const C_MAJOR = scales.fromSpec({ type: "edo", divisions: 12, mode: [0, 2, 4, 5, 7, 9, 11] });

// Voices as [[pitch, dur], ...] (pitch null = a rest) -> events.
function events(voices) {
  const out = [];
  voices.forEach((notes, voice) => {
    let t = 0;
    for (const [pitch, dur] of notes) {
      if (pitch !== null) out.push({ t, dur, pitch, voice });
      t += dur;
    }
  });
  return { events: out };
}
const run = (voices, options = {}) => analyze.analyze(events(voices), { system: C_MAJOR, ...options });
const hard = (report) => report.violations.filter((v) => v.hard);

// ---------------------------------------------------------------- part B: slices and motion

test("slices: one per onset, the sounding bass lowest in real registers, intervals above it and between pairs", () => {
  // Voice 0 is written as the bass but sung above: the sounding bass is voice 2 (Mann p. 228).
  const report = run([[[60, 4]], [[64, 4]], [[55, 4]]]);
  assert.equal(report.slices.length, 1);
  const s = report.slices[0];
  assert.equal(s.bass, 2);
  assert.deepEqual(s.above.map((x) => [x.voice, Math.round(x.cents)]), [[0, 500], [1, 900]]);
  assert.ok(s.above[0].fourth, "C over G: a fourth over the bass, a 6/4");
  assert.equal(s.pairs.length, 3);
  assert.deepEqual(s.pairs.find((p) => p.low === 0 && p.high === 1).cls, "imperfect", "C-E between upper voices");
});

test("slices: held notes sound on, and every onset makes a slice; bar, beat and strong come from the meter", () => {
  const report = run([[[60, 4]], [[67, 1], [65, 1], [64, 2]]], { meter: { beats: 2 } });
  assert.deepEqual(report.slices.map((s) => s.t), [0, 1, 2]);
  assert.deepEqual(report.slices.map((s) => s.notes.length), [2, 2, 2], "the held C sounds in every slice");
  assert.deepEqual(report.slices.map((s) => [s.bar, s.beat, s.strong]), [[1, 0, true], [1, 1, false], [2, 0, true]]);
  assert.deepEqual(report.slices.map((s) => s.notes.find((n) => n.voice === 0).onset), [true, false, false]);
});

test("motion: parallel, similar, contrary, oblique and none, per voice pair", () => {
  const kinds = (upper, lower) => run([upper, lower]).motion.map((m) => m.moves[0].kind);
  assert.deepEqual(kinds([[67, 1], [69, 1]], [[60, 1], [62, 1]]), ["parallel"]);
  assert.deepEqual(kinds([[67, 1], [72, 1]], [[60, 1], [62, 1]]), ["similar"]);
  assert.deepEqual(kinds([[67, 1], [65, 1]], [[60, 1], [62, 1]]), ["contrary"]);
  assert.deepEqual(kinds([[67, 1], [67, 1]], [[60, 1], [62, 1]]), ["oblique"]);
  assert.deepEqual(kinds([[67, 2]], [[60, 1], [60, 1]]), ["none"]);
  const crossing = run([[[64, 1], [60, 1]], [[62, 1], [65, 1]]]).motion[0].moves[0];
  assert.ok(crossing.crossed, "the voices cross");
});

// ---------------------------------------------------------------- part B: metrics

test("metrics: conjunct motion in scale steps and cents, and the dissonance curve", () => {
  const report = run([[[60, 1], [62, 1], [64, 1], [67, 1]]]);
  near(report.metrics.conjunct.steps, (1 + 1 + 2) / 3, 1e-9, "steps of C major");
  near(report.metrics.conjunct.cents, (200 + 200 + 300) / 3, 1e-9, "cents");
  const curve = run([[[60, 1], [60, 1]], [[67, 1], [61, 1]]]).metrics.dissonance;
  assert.equal(curve.points.length, 2);
  assert.ok(curve.points[1].score > curve.points[0].score, "a minor second is rougher than a fifth");
});

test("metrics: harmonic consistency compares chord types (OPT) only at the same size", () => {
  const triads = run([[[60, 1], [62, 1]], [[64, 1], [66, 1]], [[67, 1], [69, 1]]]);
  near(triads.metrics.harmonicConsistency.mean, 0, 1e-9, "C major to D major: one type");
  const majorMinor = run([[[60, 1], [60, 1]], [[64, 1], [63, 1]], [[67, 1], [67, 1]]]);
  assert.ok(majorMinor.metrics.harmonicConsistency.mean > 0, "major to minor: two types");
  const sizes = run([[[60, 1], [60, 1]], [[64, 1], [64, 1]], [[67, 1]]]);
  assert.equal(sizes.metrics.harmonicConsistency.compared, 0, "a triad then a dyad: not compared");
});

test("metrics: macroharmony, centricity and evenness", () => {
  const scale = run([[[60, 1], [62, 1], [64, 1], [65, 1], [60, 1], [62, 1], [64, 1], [65, 1]]], { meter: { beats: 4 } });
  assert.deepEqual(scale.metrics.macroharmony.sizes, [4, 4]);
  near(scale.metrics.macroharmony.consistency, 1, 1e-9, "the same four pitch classes");
  near(scale.metrics.macroharmony.circulation, 0, 1e-9, "nothing new");
  const drone = run([[[62, 4]], [[62, 2], [74, 2]]]);
  near(drone.metrics.centricity.share, 1, 1e-9, "one pitch class");
  near(drone.metrics.centricity.entropy, 0, 1e-9);
  const augmented = run([[[60, 1]], [[64, 1]], [[68, 1]]]);
  near(augmented.metrics.evenness.mean, 0, 1e-6, "the augmented triad divides the octave evenly");
  const cluster = run([[[60, 1]], [[61, 1]], [[62, 1]]]);
  near(cluster.metrics.evenness.mean, 600, 1e-6, "C C# D: 300 + 0 + 300 cents from 0 400 800");
});

test("metrics: voice-leading size under each norm, with entries, exits and boundary events counted apart", () => {
  const voices = [[[60, 1], [62, 1]], [[64, 1], [65, 1]]];
  near(run(voices).metrics.voiceLeading.mean, 300, 1e-9, "taxicab: 200 + 100");
  near(run(voices, { vlNorm: "euclidean" }).metrics.voiceLeading.mean, Math.hypot(200, 100), 1e-9, "euclidean");
  near(run(voices, { vlNorm: "chebyshev" }).metrics.voiceLeading.mean, 200, 1e-9, "chebyshev");
  const entering = run([[[60, 2]], [[null, 1], [64, 1]]]).metrics.voiceLeading;
  assert.equal(entering.entries, 2, "both voices enter (the second one a beat late)");
  assert.deepEqual(entering.sizes, [0], "the entry is not a motion");
  assert.equal(run([[[60, 1]], [[60, 1]]]).metrics.boundary.unisons, 1);
});

test("the analyzer reads a rendered canon: the round's four voices, with its meter", () => {
  const spec = { ...presets.preset(0), meter: { beats: 4 } };
  const rendered = canon.render(spec);
  const report = analyze.analyze(rendered, { system: scales.fromSpec(spec.system), profile: "canon" });
  assert.equal(report.meter.beats, 4);
  assert.equal(report.slices.length > 0, true);
  assert.equal(Math.max(...report.slices.map((s) => s.notes.length)), 4, "all four voices sound at once");
  assert.equal(report.model, "fux12");
  assert.ok(Number.isFinite(report.cost));
});

// ---------------------------------------------------------------- part C: profiles and rules

test("profiles: canon is florid plus Albrechtsberger's rules; overrides, subsets and unknowns", () => {
  assert.deepEqual(rules.profiles(), ["free", "fux-strict", "florid", "canon", "spectral"]);
  const canonRules = rules.resolve("canon").rules;
  assert.ok(canonRules["dissonance-treatment"].hard, "from florid");
  assert.ok(canonRules["entry-rest"] && !canonRules["entry-rest"].hard);
  const custom = rules.resolve({ base: "fux-strict", rules: { "hidden-perfect": { hard: false, weight: 2 }, repeat: false } }).rules;
  assert.equal(custom["hidden-perfect"].hard, false);
  assert.equal(custom.repeat, undefined);
  assert.deepEqual(Object.keys(rules.resolve({ base: "fux-strict", only: ["dissonance"] }).rules), ["dissonance"]);
  assert.throws(() => rules.resolve("baroque"), /unknown rule profile baroque/);
  assert.throws(() => rules.resolve({ base: "free", rules: { "no-fun": { hard: true } } }), /unknown rule no-fun/);
  assert.deepEqual(run([[[60, 1]], [[61, 1]]]).violations, [], "no profile: metrics only");
});

test("melodic-augmented: in the diatonic scale only the tritone's size is rare (ours, generalized)", () => {
  const spectrum = rules.stepSpectrum(C_MAJOR);
  assert.deepEqual(spectrum.get(3), [500], "fourths: the augmented one (F-B) is out");
  assert.deepEqual(spectrum.get(4), [700], "fifths: the diminished one (B-F) is out");
  assert.deepEqual(spectrum.get(2).sort(), [300, 400], "both thirds are regular");
  const leaps = (notes) => run([notes], { profile: { base: "fux-strict", only: ["melodic-augmented"] } }).violations.length;
  assert.equal(leaps([[65, 1], [71, 1]]), 1, "F up to B");
  assert.equal(leaps([[65, 1], [72, 1]]), 0, "F up to C");
  assert.equal(leaps([[62, 1], [61, 1], [62, 1]]), 0, "the raised leading tone D-C#-D (Fig. 5) is stepwise");
});

test("melodic-leap: nothing over a fifth except the octave and the ascending minor sixth", () => {
  const leaps = (notes) => run([notes], { profile: { base: "fux-strict", only: ["melodic-leap"] } }).violations.length;
  assert.equal(leaps([[60, 1], [67, 1]]), 0, "a fifth");
  assert.equal(leaps([[60, 1], [72, 1]]), 0, "an octave");
  assert.equal(leaps([[64, 1], [72, 1]]), 0, "an ascending minor sixth");
  assert.equal(leaps([[72, 1], [64, 1]]), 1, "a descending minor sixth");
  assert.equal(leaps([[60, 1], [69, 1]]), 1, "a major sixth");
});

test("florid: passing notes and suspensions pass, an unprepared strong-beat dissonance doesn't", () => {
  const florid = { profile: "florid", meter: { beats: 4, strong: [0, 2] } };
  // A passing note: E-F-G over a held C, F on a weak beat.
  assert.deepEqual(hard(run([[[64, 1], [65, 1], [67, 2]], [[60, 4]]], florid)), []);
  // A 7-6 suspension: C held over D (a seventh), resolving down to B.
  const suspension = run([[[72, 3], [71, 1]], [[64, 2], [62, 2]]], florid);
  assert.deepEqual(hard(suspension), [], "prepared on the third, resolved down by step");
  // A seventh struck on the downbeat with no preparation.
  const struck = run([[[67, 2], [72, 2]], [[60, 2], [62, 2]]], florid);
  assert.deepEqual(hard(struck).map((v) => v.rule), ["dissonance"]);
  // A fourth over the sounding bass with three voices: a 6/4.
  const sixFour = run([[[72, 4]], [[76, 4]], [[67, 4]]], florid);
  assert.deepEqual(hard(sixFour).map((v) => v.rule), ["six-four"]);
});

test("spectral: a roughness ceiling per slice", () => {
  const report = run([[[60, 2]], [[61, 2]]], { consonance: "roughness", profile: "spectral" });
  assert.ok(report.violations.some((v) => v.rule === "roughness-ceiling"));
  assert.ok(report.violations.every((v) => !v.hard), "spectral rules are soft");
});

// ---------------------------------------------------------------- part C: Fux golden tests

function fuxReport(fx, voices, profile) {
  return analyze.analyze(events(voices.map((v) => v.notes)), {
    system: scales.fromSpec(fx.system), meter: fx.meter, profile: profile || fx.expect.profile,
  });
}

test("Fux Fig. 5 (p. 29): Joseph's first counterpoint is clean", () => {
  const fx = fixture("fig5.json");
  const report = fuxReport(fx, fx.voices);
  assert.deepEqual(hard(report), []);
  assert.deepEqual(report.violations.map((v) => [v.rule, v.bar]), [["prefer-imperfect", 4], ["prefer-imperfect", 6]],
    "only the soft preference for imperfect consonances inside");
});

test("Fux Fig. 6 (pp. 31-32): the mode error at bar 1 and the hidden fifth from bar 2 to 3, and nothing else", () => {
  const fx = fixture("fig6.json");
  const report = fuxReport(fx, fx.voices);
  assert.deepEqual(hard(report).map((v) => ({ rule: v.rule, bar: v.bar, ...(v.from ? { fromBar: v.from.bar } : {}) })),
    fx.expect.hard);
  const corrected = fx.voices.map((v, i) => (i === fx.corrected.voice ? { ...v, notes: fx.corrected.notes } : v));
  assert.deepEqual(hard(fuxReport(fx, corrected)), [], "Fux's corrections clear both");
});

test("Fux Figs. 7-8 (pp. 32-33): the hidden fifths that diminution reveals", () => {
  for (const name of ["fig7.json", "fig8.json"]) {
    const fx = fixture(name);
    for (const ex of fx.examples) {
      const report = analyze.analyze(events(ex.voices.map((v) => v.notes)), {
        system: scales.fromSpec(fx.system), meter: fx.meter,
        profile: { base: "fux-strict", only: ["parallel-perfect", "hidden-perfect"] },
      });
      assert.deepEqual(report.violations.map((v) => ({ rule: v.rule, t: v.t })), ex.expect, `${name}: ${ex.name}`);
    }
  }
});
