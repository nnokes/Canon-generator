"use strict";
// M4 part B: the generator's search (cg-generate). It writes a dux for which
// the whole canon passes its rules, backtracking when a rule breaks.
const test = require("node:test");
const assert = require("node:assert/strict");

const generator = require("cg-generate");
const canon = require("cg-canon");
const analyze = require("cg-analyze");
const scales = require("cg-scales");

const MAJOR = { type: "edo", divisions: 12, mode: [0, 2, 4, 5, 7, 9, 11], ref: { step: 0, midi: 60 } };
const METER = { beats: 4, strong: [0] };

// First species: one note per bar, the follower `voice`, a 6 | 8 close on C.
const firstSpecies = (length, voice) => ({
  system: MAJOR, meter: METER,
  dux: { source: "list", notes: Array.from({ length }, () => ({ dur: 4 })) },
  voices: [{}, voice],
  ending: { kind: "free-cadence", formula: "6|8", final: 0, dur: 4 },
});
const options = (length, voice, extra = {}) => ({
  spec: firstSpecies(length, voice), degrees: [-3, 9], profile: "fux-strict", final: 0, ...extra,
});
const atFifth = { delay: 4, interval: { steps: 4 } };

test("a canon at the fifth: found, and the whole canon passes fux-strict when analyzed afresh", () => {
  const result = generator.generate(options(10, atFifth));
  assert.equal(result.found, true);
  assert.equal(result.complete, true);
  assert.equal(result.dux.length, 10);
  assert.ok(result.dux.every((d) => d >= -3 && d <= 9), "inside the range");
  const again = analyze.analyze(canon.render(result.spec), {
    system: scales.fromSpec(MAJOR), meter: METER, profile: "fux-strict", final: 60,
  });
  assert.equal(again.hard, 0, again.violations.filter((v) => v.hard).map((v) => `${v.rule} bar ${v.bar}`).join(", "));
  assert.equal(result.report.hard, 0);
});

test("the same seed gives the same canon; other seeds give others", () => {
  const a = generator.generate(options(10, atFifth, { seed: 3 }));
  const b = generator.generate(options(10, atFifth, { seed: 3 }));
  assert.deepEqual(a.dux, b.dux);
  const others = [4, 5, 6, 7, 8].map((seed) => generator.generate(options(10, atFifth, { seed })).dux.join(" "));
  assert.ok(new Set([a.dux.join(" "), ...others]).size > 1, "the seed varies the canon");
});

test("fixed notes keep their degree (a cantus firmus, a locked note)", () => {
  const result = generator.generate(options(8, atFifth, { fixed: { 0: 0, 3: 2 } }));
  assert.equal(result.found, true);
  assert.equal(result.dux[0], 0);
  assert.equal(result.dux[3], 2);
  // Started on G, the follower a fifth up enters on D, over a bass that must be
  // the final (C): a second. No canon, and the report says which rule.
  const blocked = generator.generate(options(8, atFifth, { fixed: { 0: 4 } }));
  assert.equal(blocked.found, false);
  assert.equal(blocked.diagnostics.blocking, "mode-final");
});

test("the budget stops the search, which says so", () => {
  const result = generator.generate(options(10, { delay: 16, interval: { steps: -4 } }, { budget: 30 }));
  assert.equal(result.complete, false);
  assert.ok(result.nodes < 30 + 13, `${result.nodes} candidates tried`);
});

test("no canon: the report names the rule that blocks it", () => {
  // One degree only: the dux can only repeat itself, three times at most.
  const result = generator.generate(options(6, atFifth, { degrees: [0, 0] }));
  assert.equal(result.found, false);
  assert.equal(result.complete, true);
  assert.equal(result.diagnostics.blocking, "repeat");
  assert.ok(result.diagnostics.rejected.repeat > 0);
});

test("beam mode finds a canon too", () => {
  const result = generator.generate(options(10, atFifth, { beam: 6 }));
  assert.equal(result.found, true);
  assert.equal(result.report.hard, 0);
});

test("a generator: progress while it searches, then the result", () => {
  const it = generator.search(options(10, { delay: 16, interval: { steps: -4 } }));
  const steps = [];
  for (;;) {
    const step = it.next();
    if (step.done) {
      assert.equal(step.value.found, true);
      break;
    }
    steps.push(step.value);
  }
  assert.ok(steps.length > 0, "it yields while searching");
  assert.ok(steps.every((s) => s.phase === "searching" && s.nodes > 0 && s.depth > 0));
});

test("the order: left to right, or outside-in when a voice runs backwards", () => {
  assert.deepEqual(generator.orderOf([0, 1, 2, 3, 4, 5], "left"), [0, 1, 2, 3, 4, 5]);
  assert.deepEqual(generator.orderOf([0, 1, 2, 3, 4, 5], "outside-in"), [0, 5, 1, 4, 2, 3]);
  assert.deepEqual(generator.orderOf([0, 1, 2, 3, 4], "outside-in"), [0, 4, 1, 3, 2]);
});

// ---------------------------------------------------------------- part C: strict canons

test("strict canons: at the octave, fifth and fourth, above and below, 1 to 4 bars apart, all pass fux-strict", () => {
  for (const interval of [7, -7, 4, -4, 3, -3]) {
    for (const delay of [1, 2, 3, 4]) {
      const settings = { length: 10, followers: [{ interval, delay }] };
      const result = generator.generate(generator.strict(settings));
      assert.equal(result.found, true, `interval ${interval}, delay ${delay}: ${result.diagnostics.blocking}`);
      const again = analyze.analyze(canon.render(result.spec), {
        system: scales.fromSpec(MAJOR), meter: METER, profile: "fux-strict", final: 60,
      });
      assert.equal(again.hard, 0, `interval ${interval}, delay ${delay}`);
      // The follower is the dux, transposed: a canon.
      const events = canon.render(result.spec).events.filter((e) => e.index >= 0);
      const dux = events.filter((e) => e.voice === 0);
      for (const f of events.filter((e) => e.voice === 1)) {
        const lead = dux.find((d) => d.index === f.index);
        assert.equal(f.t - lead.t, 4 * delay);
      }
    }
  }
});

test("a 32-note canon: found in well under a second's worth of candidates", () => {
  const started = Date.now();
  const result = generator.generate(generator.strict({ length: 32, followers: [{ interval: 4, delay: 2 }] }));
  assert.equal(result.found, true);
  assert.equal(result.dux.length, 32);
  assert.ok(result.nodes < 5000, `${result.nodes} candidates`);
  assert.ok(Date.now() - started < 5000);
});

test("taste (ours): rocking between two notes costs more than a line, and can be turned off", () => {
  assert.ok(generator.melodicTaste([0, 2, 0, 2]) > generator.melodicTaste([0, 1, 2, 3]));
  assert.ok(generator.melodicTaste([0, 0, 1]) > generator.melodicTaste([0, 1, 2]), "a repeat");
  assert.ok(generator.melodicTaste([0, 4, 1]) > generator.melodicTaste([0, 1, 2]), "a leap");
  assert.equal(generator.strict({ taste: false }).prefer, undefined);
  assert.equal(generator.strict().prefer, generator.melodicTaste);
});

test("strict settings: the defaults, and a canon in another mode keeps its final", () => {
  const options_ = generator.strict();
  assert.equal(options_.profile, "fux-strict");
  assert.deepEqual(options_.degrees, [-3, 9]);
  assert.equal(options_.spec.dux.notes.length, 12);
  assert.deepEqual(options_.spec.voices[1], { delay: 4, interval: { steps: 7 }, transform: "P" });
  // D dorian: the white notes, final D (degree 1 of C major's degrees, so give the mode its own ref).
  const dorian = { type: "edo", divisions: 12, mode: [0, 2, 3, 5, 7, 9, 10], ref: { step: 0, midi: 62 } };
  const result = generator.generate(generator.strict({ system: dorian, length: 10, followers: [{ interval: 4, delay: 1 }] }));
  assert.equal(result.found, true);
  const again = analyze.analyze(canon.render(result.spec), {
    system: scales.fromSpec(dorian), meter: METER, profile: "fux-strict", final: 62,
  });
  assert.equal(again.hard, 0);
});
