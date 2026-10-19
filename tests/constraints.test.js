"use strict";
// M4 part A: the generator's constraint model (cg-constraints). Its checks run
// the analyzer's own rules on small windows of the canon, so for any dux they
// must report exactly what the whole canon's analysis reports at each slice.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const constraints = require("cg-constraints");
const canon = require("cg-canon");
const analyze = require("cg-analyze");
const scales = require("cg-scales");
const rng = require("cg-rng");

const MAJOR = { type: "edo", divisions: 12, mode: [0, 2, 4, 5, 7, 9, 11], ref: { step: 0, midi: 60 } };
const METER = { beats: 4, strong: [0] };
const mann = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "mann", "ex201.json"), "utf8"));

// What a violation is, for comparing two lists of them.
const tag = (v) => `${v.rule}@${Math.round(v.t * 1000)}:${(v.voices || []).join("-")}:${v.hard ? "hard" : "soft"}`;
const tags = (list) => list.map(tag).sort();

// For a complete dux: every check against the whole canon's analysis, with the
// same rules, at the check's slice.
function agree(m, spec, dux, final) {
  const rendered = canon.render(m.spec(dux));
  const whole = new Map(); // the check's rules -> the whole canon analyzed with them
  for (const c of m.checks) {
    const key = JSON.stringify(c.profile);
    if (!whole.has(key)) {
      whole.set(key, analyze.analyze(rendered, { system: scales.fromSpec(spec.system), meter: spec.meter, profile: c.profile, final }));
    }
    const expected = whole.get(key).violations.filter((v) => Math.abs(v.t - c.t) < 1e-9);
    assert.deepEqual(tags(m.check(c, dux)), tags(expected), `slice ${c.slice} (beat ${c.t}, ${c.kind}), dux ${dux.join(" ")}`);
  }
}

const firstSpecies = (length, voice) => ({
  system: MAJOR, meter: METER,
  dux: { source: "list", notes: Array.from({ length }, () => ({ dur: 4 })) },
  voices: [{}, voice],
  ending: { kind: "free-cadence", formula: "7-6|8", final: 0, dur: 4 },
});

test("the skeleton: one event per note and voice, the dux's notes as the variables; checks ready from their notes", () => {
  const spec = firstSpecies(8, { delay: 4, interval: { steps: 4 } });
  const m = constraints.model({ spec, degrees: [-3, 9], profile: "fux-strict", final: 0 });
  assert.deepEqual(m.variables, [0, 1, 2, 3, 4, 5, 6, 7]);
  assert.equal(m.degrees.length, 13);
  assert.deepEqual(m.edges, { first: 4, last: m.onsets[m.onsets.length - 1] }, "the follower enters at bar 2; the cadence closes it");
  // First species, one bar apart: the check at bar k+1 needs the dux's notes up to k.
  const now = m.checks.filter((c) => c.kind === "now");
  assert.deepEqual(now.map((c) => Math.max(...c.indices)), [0, 1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(m.checks.filter((c) => c.kind === "next"), [], "fux-strict has no rule that reads ahead");
  // A pitch for each event, from the tables: the follower a fifth above.
  const dux = [0, 1, 2, 3, 4, 5, 6, 7];
  const rendered = canon.render(m.spec(dux)).events.filter((e) => e.index >= 0);
  m.skeleton.forEach((e, i) => {
    if (e.index < 0) return;
    const real = rendered.find((r) => r.voice === e.voice && r.index === e.index && Math.abs(r.t - e.t) < 1e-9);
    assert.equal(m.pitchOf(i, dux), real.pitch);
  });
});

test("first species: every check reports exactly what the whole canon's analysis does there (random duxes)", () => {
  const r = rng.create(7);
  for (const voice of [{ delay: 4, interval: { steps: 4 } }, { delay: 8, interval: { steps: 7 } }, { delay: 4, interval: { steps: -3 } }]) {
    const spec = firstSpecies(10, voice);
    const m = constraints.model({ spec, degrees: [-3, 9], profile: "fux-strict", final: 0 });
    for (let k = 0; k < 15; k++) {
      const dux = m.variables.map(() => -3 + r.int(13));
      agree(m, spec, dux, 60);
    }
  }
});

test("with no cadence, the end rules are checked in windows too: the penultimate a slice ahead", () => {
  const r = rng.create(5);
  const spec = { ...firstSpecies(10, { delay: 4, interval: { steps: 7 } }), ending: "cut" };
  const m = constraints.model({ spec, degrees: [-3, 9], profile: "fux-strict", final: 0 });
  const next = m.checks.filter((c) => c.kind === "next");
  assert.equal(next.length, 1, "one next check: the slice before the last");
  assert.deepEqual(next[0].profile.only, ["penultimate"]);
  assert.equal(m.onsets[next[0].slice + 1], m.edges.last);
  for (let k = 0; k < 20; k++) agree(m, spec, m.variables.map(() => -3 + r.int(13)), 60);
});

test("florid rhythm (Mann Ex. 201's), the canon rules: dissonance treatment checked a note later, still exactly", () => {
  const r = rng.create(11);
  for (const answer of mann.answers.slice(0, 4)) {
    const spec = {
      system: mann.system, meter: mann.meter, dux: mann.dux,
      voices: [{}, { delay: answer.delay, interval: { steps: answer.steps } }],
    };
    const m = constraints.model({ spec, degrees: [4, 14], profile: "canon" });
    assert.ok(m.checks.some((c) => c.kind === "next"), "the canon rules read ahead");
    agree(m, spec, mann.dux.notes.map((n) => n.degree)); // the real dux
    for (let k = 0; k < 6; k++) agree(m, spec, m.variables.map(() => 4 + r.int(11)));
  }
});

test("the real Ex. 201 passes every check at each of Albrechtsberger's answers; the whole canon has no hard fault", () => {
  for (const answer of mann.answers) {
    const spec = {
      system: mann.system, meter: mann.meter, dux: mann.dux,
      voices: [{}, { delay: answer.delay, interval: { steps: answer.steps } }],
    };
    const m = constraints.model({ spec, degrees: [4, 14], profile: "canon" });
    const dux = mann.dux.notes.map((n) => n.degree);
    const hard = m.checks.flatMap((c) => m.check(c, dux)).filter((v) => v.hard);
    assert.deepEqual(hard.map(tag), [], answer.example);
    assert.equal(m.full(dux).hard, 0, answer.example);
  }
});

test("an inverting follower turns around the dux's first note: the tables follow it", () => {
  const spec = firstSpecies(6, { delay: 4, interval: { steps: 0 }, transform: "I" });
  const m = constraints.model({ spec, degrees: [0, 7], profile: "fux-strict", final: 0 });
  for (const dux of [[0, 1, 2, 3, 4, 5], [4, 3, 2, 1, 0, 1], [7, 5, 6, 4, 2, 3]]) {
    const rendered = canon.render(m.spec(dux)).events;
    m.skeleton.forEach((e, i) => {
      if (e.index < 0) return;
      const real = rendered.find((x) => x.voice === e.voice && x.index === e.index && Math.abs(x.t - e.t) < 1e-9);
      assert.equal(m.pitchOf(i, dux), real.pitch, `${dux.join(" ")}: voice ${e.voice} note ${e.index}`);
    });
    agree(m, spec, dux, 60);
  }
});
