"use strict";
// M4 part B: the generator's search (cg-generate). It writes a dux for which
// the whole canon passes its rules, backtracking when a rule breaks.
const test = require("node:test");
const assert = require("node:assert/strict");

const generator = require("cg-generate");
const canon = require("cg-canon");
const analyze = require("cg-analyze");
const scales = require("cg-scales");
const tuning = require("cg-tuning");
const fs = require("fs");
const path = require("path");

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

test("the generator's closes: the leading note by step, never with its natural form just before (M4 session 1)", () => {
  const MODES = { dorian: [[0, 2, 3, 5, 7, 9, 10], 62], mixolydian: [[0, 2, 4, 5, 7, 9, 10], 55], aeolian: [[0, 2, 3, 5, 7, 8, 10], 57] };
  for (const [name, [mode, midi]] of Object.entries(MODES)) {
    for (const interval of [4, 7, -3]) {
      for (const seed of [1, 2, 3]) {
        const system = { type: "edo", divisions: 12, mode, ref: { step: 0, midi } };
        const result = generator.generate(generator.strict({ system, length: 10, followers: [{ interval, delay: 1 }], seed }));
        assert.equal(result.found, true, `${name} ${interval} seed ${seed}`);
        const events = canon.render(result.spec).events;
        const voices = [...new Set(events.map((e) => e.voice))].map((v) => events.filter((e) => e.voice === v).sort((a, b) => a.t - b.t));
        const lead = voices.find((l) => {
          const i = l.findIndex((e) => e.coda);
          return Math.abs(l[i + 1].pitch - l[i].pitch - 1) < 0.01;
        });
        const i = lead.findIndex((e) => e.coda);
        const raised = lead[i].pitch;
        assert.equal(Math.abs(lead[i].pitch - lead[i - 1].pitch) <= 2, true, `${name} ${interval} seed ${seed}: by step`);
        const natural = (p) => Math.abs(((p - (raised - 1)) % 12 + 12) % 12) < 0.01;
        assert.ok(!lead.slice(i - 2, i).some((e) => natural(e.pitch)), `${name} ${interval} seed ${seed}: no chromatic clash`);
        assert.equal(result.report.hard, 0);
      }
    }
  }
});

// ---------------------------------------------------------------- part D: more voices

test("three voices: canons at several intervals and delays, each a strict canon, all pass fux-relaxed afresh", () => {
  const SETTINGS = [
    [[-4, 1], [-7, 3]], [[4, 2], [-3, 4]], [[-7, 2], [-14, 4]], [[0, 2], [-7, 4]], [[7, 1], [0, 3]], [[-3, 1], [-7, 3]],
  ];
  for (const pairs of SETTINGS) {
    const followers = pairs.map(([interval, delay]) => ({ interval, delay }));
    const options_ = generator.strict({ length: 12, range: [-5, 12], followers });
    assert.equal(options_.profile, "fux-relaxed", "more than one follower: Fux's rules for more voices");
    const result = generator.generate(options_);
    const label = pairs.map(([i, d]) => `${i} after ${d}`).join(", ");
    assert.equal(result.found, true, `${label}: ${result.diagnostics.blocking}`);
    const rendered = canon.render(result.spec);
    const again = analyze.analyze(rendered, { system: scales.fromSpec(MAJOR), meter: METER, profile: "fux-relaxed", final: 60 });
    assert.equal(again.hard, 0, `${label}: ${again.violations.filter((v) => v.hard).map((v) => `${v.rule} ${v.bar}`)}`);
    // Each follower is the dux, transposed and delayed, until the close.
    const notes = rendered.events.filter((e) => e.index >= 0);
    pairs.forEach(([interval, delay], k) => {
      for (const f of notes.filter((e) => e.voice === k + 1)) {
        const lead = notes.find((d) => d.voice === 0 && d.index === f.index);
        assert.equal(f.t - lead.t, 4 * delay, label);
        const system = scales.fromSpec(MAJOR);
        assert.equal(tuning.quantize(system, f.pitch).degree - tuning.quantize(system, lead.pitch).degree, interval, label);
      }
    });
  }
});

test("four voices, and in dorian; entries a bar apart twice running can't be a canon (dissonance)", () => {
  const four = generator.generate(generator.strict({
    length: 12, range: [-5, 12], followers: [{ interval: -4, delay: 1 }, { interval: -7, delay: 3 }, { interval: -11, delay: 4 }],
  }));
  assert.equal(four.found, true, four.diagnostics.blocking);
  assert.equal(analyze.analyze(canon.render(four.spec), {
    system: scales.fromSpec(MAJOR), meter: METER, profile: "fux-relaxed", final: 60,
  }).hard, 0);
  assert.equal(new Set(canon.render(four.spec).events.map((e) => e.voice)).size, 4);
  const dorian = { type: "edo", divisions: 12, mode: [0, 2, 3, 5, 7, 9, 10], ref: { step: 0, midi: 62 } };
  for (const close of ["6|8", "3|1"]) {
    const result = generator.generate(generator.strict({
      system: dorian, close, length: 12, range: [-5, 12], followers: [{ interval: -4, delay: 1 }, { interval: -7, delay: 3 }],
    }));
    assert.equal(result.found, true, `dorian ${close}: ${result.diagnostics.blocking}`);
    assert.equal(analyze.analyze(canon.render(result.spec), {
      system: scales.fromSpec(dorian), meter: METER, profile: "fux-relaxed", final: 62,
    }).hard, 0, `dorian ${close}`);
  }
  // The fifth below a bar later and the octave below two bars later: a step in
  // the dux is a seventh or ninth against one of them. Searched to the end.
  const none = generator.generate(generator.strict({ length: 12, range: [-5, 12], followers: [{ interval: -4, delay: 1 }, { interval: -7, delay: 2 }] }));
  assert.equal(none.found, false);
  assert.equal(none.complete, true);
  assert.equal(none.diagnostics.blocking, "dissonance");
});

// ---------------------------------------------------------------- part E: rounds by the block method

const MODE = {
  ionian: { type: "edo", divisions: 12, mode: [0, 2, 4, 5, 7, 9, 11], ref: { step: 0, midi: 60 } },
  dorian: { type: "edo", divisions: 12, mode: [0, 2, 3, 5, 7, 9, 10], ref: { step: 0, midi: 62 } },
  aeolian: { type: "edo", divisions: 12, mode: [0, 2, 3, 5, 7, 8, 10], ref: { step: 0, midi: 57 } },
  phrygian: { type: "edo", divisions: 12, mode: [0, 1, 3, 5, 7, 8, 10], ref: { step: 0, midi: 64 } },
};
const RELAXED_INSIDE = { base: "fux-relaxed", rules: { "begin-perfect": false, "end-perfect": false, "mode-final": false, penultimate: false } };

test("rounds: 3 and 4 voices in ionian, dorian, aeolian and phrygian, each a perfect setting as it piles up, and its joins clean", () => {
  for (const [mode, voices, section] of [["ionian", 3, 4], ["ionian", 4, 3], ["dorian", 3, 4], ["aeolian", 4, 4], ["phrygian", 3, 4]]) {
    const label = `${mode}, ${voices} voices, sections of ${section} bars`;
    const system = MODE[mode];
    const options_ = generator.round({ system, voices, section });
    assert.equal(options_.profile, voices > 2 ? "fux-relaxed" : "fux-strict");
    const result = generator.generate(options_);
    assert.equal(result.found, true, `${label}: ${result.diagnostics.blocking}`);
    const rendered = canon.render(result.spec);
    const final = system.ref.midi;
    const scale = scales.fromSpec(system);
    const again = analyze.analyze(rendered, { system: scale, meter: METER, profile: "fux-relaxed", final });
    assert.equal(again.hard, 0, `${label}: ${again.violations.filter((v) => v.hard).map((v) => `${v.rule} ${v.bar}`)}`);
    // No 6/4 anywhere: no fourth over the sounding bass, while the voices pile up or after.
    assert.ok(again.slices.every((s) => !s.above.some((x) => x.fourth)), `${label}: a fourth over the bass`);
    // A round: every voice sings the tune, each a section after the last.
    const bar = 4;
    const tune = rendered.events.filter((e) => e.voice === 0);
    for (const e of rendered.events.filter((x) => x.voice > 0)) {
      const lead = tune.find((d) => Math.abs(d.t - (e.t - e.voice * section * bar)) < 1e-9);
      if (lead) assert.equal(e.pitch, lead.pitch, label);
    }
    // The wrap-around join, the last section back to the first, is in the analysis.
    const wrap = voices * section * bar;
    assert.ok(rendered.events.some((e) => e.voice === 0 && e.pass === 1 && e.index === 0 && Math.abs(e.t - wrap) < 1e-9));
    assert.ok(again.slices.some((s) => Math.abs(s.t - wrap) < 1e-9));
    // It ends on a section end, on the final.
    const last = again.slices[again.slices.length - 1];
    assert.ok(last.notes.length === voices && Math.abs(((last.notes[0].pitch - final) % 12 + 12) % 12) < 0.01, `${label}: the last chord`);
    // "The first two or three voices in themselves should form a perfect two- or
    // three-part setting" (Mann p. 237): sections 1..j as a j-part block, alone.
    for (let j = 2; j <= voices; j++) {
      const block = {
        system, meter: METER,
        dux: { source: "list", notes: result.spec.dux.notes.slice(0, section) },
        voices: Array.from({ length: j }, () => ({})),
      };
      // Voice k of the block sings section k: one dux per section, as voices of one spec.
      const events = [];
      for (let k = 0; k < j; k++) {
        const notes = result.spec.dux.notes.slice(k * section, (k + 1) * section);
        canon.render({ ...block, dux: { source: "list", notes }, voices: [{}] }).events
          .forEach((e) => events.push({ ...e, voice: k }));
      }
      const part = analyze.analyze({ events }, { system: scale, meter: METER, profile: RELAXED_INSIDE, final });
      assert.equal(part.hard, 0, `${label}: sections 1-${j} alone: ${part.violations.filter((v) => v.hard).map((v) => `${v.rule} ${v.bar}`)}`);
    }
  }
});

test("rounds: the leading note raised in the tune where the mode needs it (C sharp in D dorian), and reached by step", () => {
  const result = generator.generate(generator.round({ system: MODE.dorian, voices: 3, section: 4 }));
  assert.equal(result.found, true);
  const raised = result.spec.dux.notes.map((n, i) => [n, i]).filter(([n]) => n.offset);
  assert.ok(raised.length >= 1, "a C sharp in the tune");
  for (const [n, i] of raised) {
    assert.equal(((n.degree % 7) + 7) % 7, 6, "written as C (the degree below D)");
    assert.equal(n.offset, 100, "raised a semitone");
    assert.equal(i % 4, 2, "at a section's next-to-last note");
    assert.equal(result.spec.dux.notes[i + 1].degree, n.degree + 1, "rising to the final");
  }
  const rendered = canon.render(result.spec);
  const sharp = rendered.events.filter((e) => ((Math.round(e.pitch) % 12) + 12) % 12 === 1);
  assert.ok(sharp.length > 0 && sharp.every((e) => e.degree !== undefined), "the renderer marks the written degree");
  // Ionian and phrygian already have a semitone at the final: nothing raised.
  for (const mode of ["ionian", "phrygian"]) {
    const plain = generator.generate(generator.round({ system: MODE[mode], voices: 3, section: 4 }));
    assert.ok(plain.spec.dux.notes.every((n) => !n.offset), mode);
  }
});

test("rounds: the block method is a far smaller search than the chain; the same seed gives the same round", () => {
  const block = generator.generate(generator.round({ voices: 3, section: 4, seed: 1 }));
  assert.equal(block.found, true);
  assert.ok(block.nodes < 5000, `${block.nodes} candidates`);
  // Written left to right (the canon chain), the cadence and the full chords
  // are only checked once the last section is written.
  const chain = generator.generate(generator.round({ voices: 3, section: 4, seed: 1, order: "left", budget: 8000 }));
  assert.equal(chain.found, false, "the chain, at 8,000 candidates");
  assert.equal(chain.complete, false);
  const again = generator.generate(generator.round({ voices: 3, section: 4, seed: 1 }));
  assert.deepEqual(again.dux, block.dux);
  const other = generator.generate(generator.round({ voices: 3, section: 4, seed: 2 }));
  assert.notDeepEqual(other.dux, block.dux);
  // The order: bar c of every section, the cadence's columns first.
  assert.deepEqual(generator.orderOf([0, 1, 2, 3, 4, 5, 6, 7], "block", 4, "left"), [0, 4, 1, 5, 2, 6, 3, 7]);
  assert.deepEqual(generator.orderOf([0, 1, 2, 3, 4, 5, 6, 7], "block", 4, "close"), [3, 7, 2, 6, 0, 4, 1, 5]);
  // Sections of 2 bars in 3 voices: the block is only the cadence. Proven impossible.
  const short = generator.generate(generator.round({ voices: 3, section: 2 }));
  assert.equal(short.found, false);
  assert.equal(short.complete, true);
});

// Mann p. 237: Albrechtsberger's two short rounds, "Turnus descendet ad inferos".
test("Mann Ex. 218-219: Albrechtsberger's rounds pass his canon rules as perpetual rounds, piling up cleanly; the finder finds Ex. 218", () => {
  const finder = require("cg-finder");
  for (const name of ["ex218.json", "ex219.json"]) {
    const fx = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "mann", name), "utf8"));
    const roundSpec = (count) => ({
      system: fx.system, meter: fx.meter, dux: fx.dux,
      voices: Array.from({ length: count }, (_, k) => ({ delay: k * fx.section, loop: 2 })),
      ending: { kind: "loop", passes: 2 },
    });
    const options_ = { system: scales.fromSpec(fx.system), meter: fx.meter, profile: "canon", final: 60 };
    const report = analyze.analyze(canon.render(roundSpec(fx.voices)), options_);
    assert.equal(report.hard, 0, `${name}: ${report.violations.filter((v) => v.hard).map((v) => `${v.rule} ${v.bar}`)}`);
    assert.ok(!report.violations.some((v) => v.rule === "six-four"), `${name}: no 6/4`);
    // Every group heard while the voices pile up, alone (the first j voices, perpetual).
    for (let j = 2; j < fx.voices; j++) {
      const part = analyze.analyze(canon.render(roundSpec(j)), options_);
      assert.equal(part.violations.filter((v) => v.hard && v.bar <= j).length, 0, `${name}: the first ${j} voices`);
    }
  }
  // Given only the tune, the four-voice search finds the round: the unison, a bar apart.
  const fx = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "mann", "ex218.json"), "utf8"));
  const out = finder.find({
    dux: fx.dux, system: fx.system, meter: fx.meter, profile: "canon", perpetual: true, passes: 2,
    voices: 4, ranges: { intervals: finder.range(-7, 7), delays: [4, 8, 12] }, keep: 50,
  });
  const round = out.results.find((r) => r.settings.every((x) => x.interval.steps === 0));
  assert.ok(round && round.hard === 0 && round.cost === 0, "unison, after 4 + unison, after 8 + unison, after 12: clean");
});

// ---------------------------------------------------------------- part F: repairs

const ex201 = () => JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "mann", "ex201.json"), "utf8"));
function brokenCanon(changes, voice = { delay: 4, interval: { steps: 0 } }) {
  const fx = ex201();
  const notes = fx.dux.notes.map((n, i) => (changes[i] !== undefined ? { ...n, degree: n.degree + changes[i] } : n));
  const spec = { system: fx.system, meter: fx.meter, dux: { source: "list", notes }, voices: [{}, voice] };
  return { spec, original: canon.duxMaterial(spec.dux, scales.fromSpec(fx.system)), fx };
}
const repairOf = (setup, extra = {}) => generator.run(generator.repair({ spec: setup.spec, original: setup.original, profile: "canon", ...extra }));

test("repair: fewest notes first (0 if it already passes, then 1, 2, 3), your notes tried first", () => {
  const clean = repairOf(brokenCanon({}));
  assert.equal(clean.found, true);
  assert.deepEqual(clean.edits, []);
  assert.deepEqual(clean.limits.map((l) => l.limit), [0], "it passed as written");
  const one = repairOf(brokenCanon({ 3: 1 }));
  assert.deepEqual(one.edits.map((e) => [e.index, e.from, e.to]), [[3, 10, 9]]);
  assert.deepEqual(one.limits.map((l) => l.limit), [0, 1]);
  // Three notes broken so that no two changes will do: three.
  const three = repairOf(brokenCanon({ 0: 1, 4: 1, 9: 1 }));
  assert.equal(three.found, true);
  assert.equal(three.edits.length, 3);
  assert.deepEqual(three.limits.map((l) => l.limit), [0, 1, 2, 3]);
  const setup = brokenCanon({ 0: 1, 4: 1, 9: 1 });
  const again = analyze.analyze(canon.render(three.spec), { system: scales.fromSpec(setup.fx.system), meter: setup.fx.meter, profile: "canon" });
  assert.equal(again.hard, 0);
});

test("repair: the most notes changed (3, or 8% of the notes), max respected, locked notes kept, a move of a fifth at most", () => {
  assert.deepEqual([13, 37, 38, 64].map(generator.maxEdits), [3, 3, 4, 6]);
  const capped = repairOf(brokenCanon({ 0: 1, 4: 1, 9: 1 }), { max: 2 });
  assert.equal(capped.found, false);
  assert.deepEqual(capped.limits.map((l) => l.limit), [0, 1, 2]);
  // Note 4 locked as broken: the repair must change others around it.
  const locked = repairOf(brokenCanon({ 3: 1 }), { fixed: { 3: 10 } });
  assert.equal(locked.found, true);
  assert.ok(locked.edits.length >= 1 && locked.edits.every((e) => e.index !== 3), JSON.stringify(locked.edits));
  assert.ok(locked.edits.every((e) => Math.abs(e.steps) <= 4));
});

test("repair: an unchanged note keeps its exact pitch, a chromatic one included", () => {
  const setup = brokenCanon({ 3: 1 });
  // Note 8 raised a semitone (a chromatic note the canon takes): kept as written.
  setup.original = setup.original.map((n, i) => (i === 7 ? { ...n, offset: 100 } : n));
  setup.spec.dux.notes = setup.spec.dux.notes.map((n, i) => (i === 7 ? { ...n, offset: 100 } : n));
  const result = repairOf(setup);
  assert.equal(result.found, true);
  assert.ok(result.edits.every((e) => e.index !== 7));
  assert.equal(result.spec.dux.notes[7].offset, 100, "the chromatic note stays");
  const scale = scales.fromSpec(setup.fx.system);
  const leader = canon.render(result.spec).events.find((e) => e.voice === 0 && e.index === 7);
  assert.ok(Math.abs(leader.pitch - (tuning.degreeToPitch(scale, setup.original[7].degree) + 1)) < 1e-9);
});
