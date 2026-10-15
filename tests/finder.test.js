"use strict";
// M3 part D: the answer finder (cg-finder), with the golden tests from
// Albrechtsberger's canon chapter in Mann, The Study of Fugue.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const finder = require("cg-finder");
const canon = require("cg-canon");
const analyze = require("cg-analyze");
const scales = require("cg-scales");

const fixture = (name) => JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "mann", name), "utf8"));
const mod7 = (x) => ((x % 7) + 7) % 7;

test("settings: every interval x delay x transform x time scale, labelled the way Albrechtsberger names them", () => {
  const all = finder.settings({ intervals: [-1, 0, 2], delays: [2, 4], transforms: ["P", "I"], timeScales: [1, 2] });
  assert.equal(all.length, 3 * 2 * 2 * 2);
  assert.equal(finder.settings({ intervals: [0], cents: [702], delays: [1] }).length, 2, "absolute intervals too");
  const iv = (steps) => finder.intervalName({ domain: "degree", steps }, 7);
  assert.deepEqual([iv(0), iv(1), iv(-2), iv(7), iv(-8), iv(-9), iv(-11)],
    ["unison", "upper 2nd", "lower 3rd", "upper octave", "lower 9th", "lower 10th", "lower 12th"]);
  assert.equal(finder.label({ interval: { domain: "degree", steps: 4 }, delay: 2, transform: "RI", timeScale: 2 }, 7),
    "upper 5th, after 2, RI, x2");
});

// Mann p. 230: "This canon can also be answered at the upper second, at the lower
// third, at the upper sixth, at the lower seventh, at the upper and lower
// octaves, at the lower ninth, and at the lower tenth" (Exs. 205-211).
test("Mann Ex. 201: the finder finds all eight hidden answers Albrechtsberger lists, and the unison", () => {
  const fx = fixture("ex201.json");
  const out = finder.find({
    dux: fx.dux, system: fx.system, meter: fx.meter, profile: "canon",
    ranges: { intervals: finder.range(-9, 9), delays: finder.range(1, 8) }, keep: 1000,
  });
  assert.equal(out.tried, 19 * 8);
  const passing = out.results.filter((r) => r.hard === 0);
  for (const a of fx.answers) {
    const r = out.results.find((x) => x.setting.interval.steps === a.steps && x.setting.delay === a.delay);
    assert.equal(r.hard, 0, `${a.example}, ${a.name}: ${r.violations.filter((v) => v.hard).map((v) => `${v.rule}@${v.bar}`).join(" ")}`);
  }
  // Everything else that passes is one of them moved by an octave, at the same delay.
  for (const r of passing) {
    assert.ok(fx.answers.some((a) => a.delay === r.setting.delay && mod7(a.steps) === mod7(r.setting.interval.steps)),
      `${r.label} is none of Albrechtsberger's answers`);
  }
  assert.ok(passing.length < 20, `${passing.length} of 152 pass: the rules are selective`);
  // The lower ninth's scale-step answer leaps a tritone, which Ex. 210 avoids with an E natural.
  const ninth = out.results.find((x) => x.setting.interval.steps === -8 && x.setting.delay === 6);
  assert.ok(ninth.violations.some((v) => v.rule === "melodic-augmented" && !v.hard));
  // Answer distortion: a degree answer at the octave is exact; at the second it isn't.
  const octave = out.results.find((x) => x.setting.interval.steps === 7 && x.setting.delay === 4);
  assert.equal(octave.distortion.max, 0);
  const second = out.results.find((x) => x.setting.interval.steps === 1 && x.setting.delay === 2);
  assert.ok(second.distortion.max > 0, "major and minor seconds both occur");
  assert.equal(second.inversion, 6, "a second inverts to a seventh (Mann pp. 231-232)");
});

// Mann p. 261: the perpetual canon Albrechtsberger sent Haydn in 1806 has two
// solutions: entrances at the lower fifth and lower octave (Ex. 239, solution 1
// in Ex. 241), or at the upper fourth and lower octave (Ex. 240).
test("Mann Ex. 239-240: the four-voice search finds both solutions of the canon for Haydn", () => {
  const fx = fixture("ex239.json");
  const options = {
    dux: fx.dux, system: fx.system, meter: fx.meter, profile: "canon", perpetual: true, passes: 2,
    voices: 4, ranges: { intervals: finder.range(-14, 7), delays: fx.delays }, keep: 200,
  };
  const out = finder.find(options);
  const passing = out.results.filter((r) => r.hard === 0);
  for (const s of fx.solutions) {
    const found = passing.find((r) => r.settings.every((x, i) => x.interval.steps === s.steps[i] && x.delay === fx.delays[i]));
    assert.ok(found, `${s.example}: ${s.name}`);
  }
  // Every passing set enters at the fifth below or fourth above, and the octave,
  // in some register: the canon was made for exactly those entries.
  for (const r of passing) {
    for (const x of r.settings) {
      assert.ok([0, 3].includes(mod7(x.interval.steps)), `${r.label}: ${x.interval.steps} steps`);
    }
  }
});

test("search: a generator that reports progress, stops at its budget, and gives specs that render", () => {
  const fx = fixture("ex201.json");
  const options = { dux: fx.dux, system: fx.system, meter: fx.meter, ranges: { intervals: [0, 7], delays: [2, 4, 6, 8] } };
  const it = finder.search(options);
  const progress = [];
  let step = it.next();
  while (!step.done) { progress.push(step.value); step = it.next(); }
  assert.equal(step.value.tried, 8);
  const limited = finder.find({ ...options, budget: 3 });
  assert.equal(limited.tried, 3);
  assert.equal(limited.complete, false);
  const best = step.value.results[0];
  const spec = finder.specFor(options, best);
  const rendered = canon.render(spec);
  assert.equal(rendered.voices.length, 2);
  const report = analyze.analyze(rendered, { system: scales.fromSpec(fx.system), meter: fx.meter, profile: "canon" });
  assert.equal(report.hard, best.hard, "the spec reproduces the result");
});

test("search: progress arrives during a long search, with the best so far", () => {
  const fx = fixture("ex201.json");
  const it = finder.search({ dux: fx.dux, system: fx.system, meter: fx.meter, ranges: { intervals: finder.range(-9, 9), delays: [2, 4] } });
  const first = it.next();
  assert.equal(first.done, false);
  assert.equal(first.value.phase, "pairs with the dux");
  assert.equal(first.value.total, 38);
  assert.ok(first.value.best && Number.isFinite(first.value.best.cost));
});
