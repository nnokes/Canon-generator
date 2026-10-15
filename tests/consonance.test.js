"use strict";
// M3 part A: the consonance models in code/lib/cg-consonance.js.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const consonance = require("cg-consonance");
const tuning = require("cg-tuning");
const scales = require("cg-scales");

const near = (actual, expected, tolerance, label) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual} is not within ${tolerance} of ${expected}`);
const label = (r) => r.cls + (r.fourth ? " (fourth)" : "");

// Fux's table (Study of Counterpoint, pp. 20-21), semitone by semitone.
const FUX = ["perfect", "dissonant", "dissonant", "imperfect", "imperfect", "dissonant (fourth)", "dissonant",
  "perfect", "imperfect", "imperfect", "dissonant", "dissonant"];

test("fux12: Fux's table, compound intervals folded, off-grid intervals dissonant", () => {
  const model = consonance.fux12();
  for (let k = 0; k <= 36; k++) assert.equal(label(model.classify(100 * k)), FUX[k % 12], `${k} semitones`);
  assert.equal(label(model.classify(-700)), "perfect", "direction doesn't matter");
  assert.equal(model.classify(1199.9999999).cls, "perfect", "a hair under the octave is the octave");
  assert.equal(model.classify(386.3).cls, "imperfect", "a just third is still a third (within 15 cents)");
  assert.equal(model.classify(350).cls, "dissonant", "a neutral third is off Fux's grid");
});

test("ratio: agrees with Fux's table on every class of 12-EDO, and names the ratio it heard", () => {
  const model = consonance.ratio();
  for (let k = 0; k <= 24; k++) assert.equal(label(model.classify(100 * k)), FUX[k % 12], `${k} semitones`);
  assert.equal(model.classify(700).ratio, "3/2");
  assert.equal(model.classify(400).ratio, "5/4");
  assert.equal(model.classify(600).ratio, null, "the tritone is no simple 5-limit ratio");
  // The simplest ratio within the tolerance wins, not the nearest one.
  assert.equal(model.classify(709).ratio, "3/2");
});

test("ratio in 31-EDO: its thirds and sixths are imperfect, its neutral third dissonant", () => {
  const system = tuning.edo(31);
  const model = consonance.fromSpec(undefined, system);
  assert.equal(model.name, "ratio", "the default for anything but 12-EDO");
  const step = (k) => (1200 * k) / 31;
  assert.equal(model.classify(step(10)).ratio, "5/4");
  assert.equal(model.classify(step(8)).ratio, "6/5");
  assert.equal(model.classify(step(10)).cls, "imperfect");
  assert.equal(model.classify(step(8)).cls, "imperfect");
  assert.equal(model.classify(step(23)).cls, "imperfect", "major sixth 5/3");
  assert.equal(model.classify(step(21)).cls, "imperfect", "minor sixth 8/5");
  assert.equal(model.classify(step(18)).cls, "perfect", "fifth");
  assert.equal(model.classify(step(9)).cls, "dissonant", "neutral third");
});

test("ratio in Bohlen-Pierce: it folds at the tritave, and hears 7-limit ratios", () => {
  const system = tuning.bohlenPierce();
  const model = consonance.fromSpec(undefined, system);
  assert.equal(model.period, system.period_cents);
  const step = (k) => tuning.degreeCents(system, k);
  assert.equal(model.classify(step(13)).cls, "perfect", "the tritave folds to the unison class");
  assert.equal(model.classify(step(6)).ratio, "5/3");
  assert.equal(model.classify(step(10)).ratio, "7/3", "a tritave system hears prime limit 7 (BP's 3:5:7)");
  assert.equal(model.classify(step(10)).cls, "imperfect");
});

test("fromSpec: 12-EDO starters get Fux's table; a model can be named; unknown ones are refused", () => {
  assert.equal(consonance.fromSpec(undefined, tuning.edo(12)).name, "fux12");
  assert.equal(consonance.fromSpec("ratio", tuning.edo(12)).name, "ratio");
  assert.equal(consonance.fromSpec({ model: "roughness" }, tuning.edo(12)).name, "roughness");
  assert.throws(() => consonance.fromSpec("vibes"), /unknown model vibes/);
  for (let i = 0; i < scales.count; i++) {
    const system = scales.starter(i);
    const model = consonance.fromSpec(undefined, system);
    assert.ok(["fux12", "ratio"].includes(model.name));
    assert.ok(["perfect", "imperfect", "dissonant"].includes(model.classify(702).cls));
  }
});

test("table: your own classes, nearest within the tolerance", () => {
  const model = consonance.table({
    entries: [{ cents: 0, cls: "perfect" }, { cents: 350, cls: "imperfect" }, { cents: 500, cls: "fourth" }],
  });
  assert.equal(model.classify(1550).cls, "imperfect", "folded to the period");
  assert.equal(label(model.classify(498)), "dissonant (fourth)");
  assert.equal(model.classify(200).cls, "dissonant", "not in the table");
  assert.throws(() => consonance.table({ entries: [{ cents: 0, cls: "lovely" }] }), /unknown class lovely/);
});

// Sethares, Tuning, Timbre, Spectrum, Scale (2005), and "Local consonance and the
// relationship between timbre and scale" (JASA 1993): for a harmonic timbre the
// dissonance curve has its minima at the simple ratios.
test("roughness: a 7-partial harmonic timbre has Sethares's minima at 1/1, 6/5, 5/4, 4/3, 3/2, 5/3, 2/1", () => {
  const partials = Array.from({ length: 7 }, (_, k) => Math.pow(0.88, k));
  for (const hz of [220, 261.63, 500]) {
    const points = consonance.curve(hz, { partials, period: 1250, step: 1 });
    const minima = [];
    for (let i = 1; i < points.length - 1; i++) {
      if (points[i].roughness < points[i - 1].roughness && points[i].roughness <= points[i + 1].roughness) {
        minima.push(points[i].cents);
      }
    }
    assert.ok(points[1].roughness > points[0].roughness, "the unison is a minimum");
    for (const r of ["6/5", "5/4", "4/3", "3/2", "5/3", "2/1"]) {
      const target = tuning.ratioCents(r);
      assert.ok(minima.some((m) => Math.abs(m - target) <= 15), `${hz} Hz: a minimum near ${r} (${minima.join(" ")})`);
    }
    // And its shape: the fifth and octave are deeper than the thirds, the seconds roughest.
    const at = (c) => points[Math.round(c)].roughness;
    assert.ok(at(702) < at(386) && at(1200) < at(386), "fifth and octave smoother than the major third");
    assert.ok(at(100) > at(386) && at(200) > at(386), "seconds rougher than the third");
  }
});

test("roughness: it hears register (a low third is rougher) and classifies by thresholds", () => {
  const model = consonance.roughness();
  assert.ok(model.classify(400, { lowHz: 110 }).score > model.classify(400, { lowHz: 880 }).score);
  assert.equal(model.classify(0).cls, "perfect");
  assert.equal(model.classify(1200).cls, "perfect");
  assert.equal(model.classify(100).cls, "dissonant");
  assert.equal(model.classify(400).cls, "imperfect");
});

test("the voice bank plays the partials the roughness model hears", () => {
  const voice = fs.readFileSync(path.join(__dirname, "..", "patchers", "cg.voice~.maxpat"), "utf8");
  assert.ok(voice.includes(consonance.DEFAULT_PARTIALS.join(" ")), "the voice's default 'partials' message");
  for (const w of consonance.DEFAULT_PARTIALS) assert.ok(voice.includes(`*~ ${w}`), `a partial weighted ${w}`);
  near(consonance.DEFAULT_PARTIALS.reduce((a, b) => a + b, 0), 1, 1e-9, "the weights sum to 1");
});
