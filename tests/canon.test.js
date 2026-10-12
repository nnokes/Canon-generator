"use strict";
// M2: the renderer (code/lib/cg-canon.js) and its presets (cg-presets.js).
const test = require("node:test");
const assert = require("node:assert/strict");

const tuning = require("cg-tuning");
const canon = require("cg-canon");
const presets = require("cg-presets");
const { melody } = presets;

const near = (a, b, tol, label) => assert.ok(Math.abs(a - b) <= tol, `${label}: ${a} is not within ${tol} of ${b}`);
const C_MAJOR = { type: "edo", divisions: 12, mode: [0, 2, 4, 5, 7, 9, 11], ref: { step: 0, midi: 60 } };
const of = (result, voice) => result.events.filter((e) => e.voice === voice);
const named = (result, name) => of(result, result.voices.findIndex((v) => v.name === name));

function twoVoice(follower, extra = {}) {
  return {
    system: C_MAJOR,
    dux: { source: "list", notes: melody("0 1 2:2 r 4 3:0.5 2:0.5 0:2") },
    voices: [{ name: "dux" }, { name: "comes", delay: 2, ...follower }],
    ...extra,
  };
}

// ---------------------------------------------------------------- the basics

test("a canon at the fifth: the follower is the dux 4 steps up, 2 beats later", () => {
  const r = canon.render(twoVoice({ interval: 4 }));
  assert.deepEqual(r.voices.map((v) => [v.name, v.kind, v.out]), [["dux", "canon", "hz"], ["comes", "canon", "hz"]]);
  const dux = of(r, 0);
  const comes = of(r, 1);
  assert.deepEqual(dux.map((e) => e.pitch), [60, 62, 64, 67, 65, 64, 60]);
  assert.deepEqual(comes.map((e) => e.pitch), [67, 69, 71, 74, 72, 71, 67], "a scalar (diatonic) answer");
  comes.forEach((e, i) => near(e.t, dux[i].t + 2, 1e-12, `comes note ${i}`));
  assert.deepEqual(dux.map((e) => e.index), [0, 1, 2, 4, 5, 6, 7], "the rest (note 3) makes no event");
  for (let i = 1; i < r.events.length; i++) assert.ok(r.events[i].t >= r.events[i - 1].t, "events in time order");
  near(r.length, 2 + 9, 1e-12, "the follower ends last: the dux is 9 beats");
});

test("inversion, retrograde, augmentation, tape speed and an interscalar answer", () => {
  const dux = of(canon.render(twoVoice({})), 0);
  // Inversion around the first note (C): degree d -> -d.
  const inv = of(canon.render(twoVoice({ transform: "I" })), 1);
  assert.deepEqual(inv.map((e) => e.pitch), [60, 59, 57, 53, 55, 57, 60]);
  // Retrograde: the notes backwards, the rest included.
  const ret = of(canon.render(twoVoice({ transform: "R" })), 1);
  assert.deepEqual(ret.map((e) => e.pitch), dux.map((e) => e.pitch).reverse());
  near(ret[4].t - ret[3].t, 1 + 1, 1e-12, "the rest comes along, reversed");
  // RI: both.
  const ri = of(canon.render(twoVoice({ transform: "RI" })), 1);
  assert.deepEqual(ri.map((e) => e.pitch), inv.map((e) => e.pitch).reverse());
  // Augmentation: twice as long.
  const aug = of(canon.render(twoVoice({ timeScale: 2 })), 1);
  aug.forEach((e, i) => near(e.dur, 2 * dux[i].dur, 1e-12, `augmented note ${i}`));
  // Tape speed 2: an octave up, twice as fast (Tenney's rhythm = frequency).
  const tape = of(canon.render(twoVoice({ tapeSpeed: 2 })), 1);
  tape.forEach((e, i) => {
    near(e.pitch, dux[i].pitch + 12, 1e-9, `tape note ${i} pitch`);
    near(e.dur, dux[i].dur / 2, 1e-12, `tape note ${i} dur`);
  });
  // Interscalar: the same degrees read in 31-EDO's meantone major.
  const meantone = { type: "edo", divisions: 31, mode: [0, 5, 10, 13, 18, 23, 28], ref: { step: 0, midi: 60 } };
  const inter = of(canon.render(twoVoice({ scale: meantone })), 1);
  near(inter[2].pitch, 60 + (10 * 12) / 31, 1e-12, "E in meantone: 6.45 c below 12-TET");
  assert.throws(() => canon.render(twoVoice({ tapeSpeed: 2, interval: 3 })), /tapeSpeed sets/);
});

test("loop and spiral: each pass moves by the spiral interval", () => {
  const r = canon.render(twoVoice({ loop: 3, spiral: { cents: 100 } }));
  const comes = of(r, 1);
  const pass = (k) => comes.filter((e) => e.pass === k);
  assert.equal(pass(2).length, 7);
  pass(2).forEach((e, i) => {
    near(e.pitch, pass(0)[i].pitch + 2, 1e-9, `pass 2 note ${i}: two semitones up`);
    near(e.t, pass(0)[i].t + 2 * 9, 1e-12, `pass 2 note ${i}: two pass lengths later`);
  });
});

test("a seeded random walk: the same seed gives the same dux", () => {
  const spec = (seed) => ({ system: C_MAJOR, dux: { source: "walk", length: 12, seed }, voices: [{}] });
  const pitches = (seed) => canon.render(spec(seed)).events.map((e) => e.pitch);
  assert.deepEqual(pitches(5), pitches(5));
  assert.notDeepEqual(pitches(5), pitches(6));
  assert.equal(pitches(5).length, 12);
});

// ---------------------------------------------------------------- endings

test("endings: cut at the leader's end, loop, and a free cadence", () => {
  const cutAt = canon.render(twoVoice({ interval: 4 }, { ending: "cut" }));
  near(cutAt.length, 9, 1e-12, "everything stops when the dux does");
  const lastComes = of(cutAt, 1).at(-1);
  near(lastComes.t + lastComes.dur, 9, 1e-12, "the follower's last note is shortened");

  const looped = canon.render(twoVoice({ interval: 4 }, { ending: { kind: "loop", passes: 3 } }));
  near(looped.length, 27, 1e-12, "three passes of the dux, then all stop");
  assert.equal(Math.max(...of(looped, 1).map((e) => e.pass)), 2);

  const cadence = canon.render(twoVoice({ interval: -7 }, { ending: { kind: "free-cadence", final: 0, dur: 1 } }));
  const coda = cadence.events.filter((e) => e.coda);
  const upper = coda.filter((e) => e.voice === 0).map((e) => e.pitch);
  const lower = coda.filter((e) => e.voice === 1).map((e) => e.pitch);
  // Each line lands nearest where its voice is: the dux ends on C4, the follower on E3.
  assert.deepEqual(upper, [60, 59, 60], "upper: 8 7 8 (C4 B3 C4)");
  assert.deepEqual(lower, [50, 50, 48], "lower: 2 2 1 (D3 D3 C3), an octave below");
  assert.deepEqual(coda.filter((e) => e.voice === 0).map((e) => e.t), [9, 10, 11], "after the cut");
  const other = canon.render(twoVoice({ interval: -7 }, { ending: { kind: "free-cadence", formula: "2-3|1", final: 0 } }));
  assert.deepEqual(other.events.filter((e) => e.coda && e.voice === 1).map((e) => e.pitch), [48, 47, 48], "lower: 1 7 1 (C3 B2 C3)");

  assert.throws(() => canon.render(twoVoice({}, { ending: "converge" })), /M6/);
  const spectrum = { ...twoVoice({}), system: { type: "harmonic", low: 1, high: 16, f0: 55 },
    dux: { source: "list", notes: melody("3 4 5 6") }, ending: { kind: "free-cadence", final: 0 } };
  assert.throws(() => canon.render(spectrum), /repeating scale system/);
});

// ---------------------------------------------------------------- render = fold of step()

function streamed(spec) {
  const state = canon.start(spec);
  const events = [];
  const groups = spec.groups || [{ dux: spec.dux }];
  groups.forEach((g, gi) => {
    for (const n of canon.duxMaterial(g.dux, state.plan.groups[gi].system)) {
      events.push(...canon.step(state, n.rest ? { dur: n.dur, rest: true } : { dur: n.dur, degree: n.degree, offset: n.offset }, gi));
    }
  });
  events.push(...canon.finish(state));
  return canon.finalize(state, events);
}

test("render equals the fold of step() (PLAN.md 3.4), for every preset and a mixed spec", () => {
  for (let i = 0; i < presets.count; i++) {
    const spec = presets.preset(i);
    assert.deepEqual(streamed(spec), canon.render(spec), spec.name);
  }
  const mixed = {
    system: C_MAJOR,
    dux: { source: "list", notes: melody("0 2 r:0.5 4:1.5 3 | 1:2 0") },
    voices: [
      { name: "dux", loop: 2, spiral: 1 },
      { name: "inverted talea", delay: 1, transform: "I", axis: { degree: 2 }, talea: [1.5, -0.5, 1] },
      { name: "crab", delay: 3, transform: "R", interval: { cents: 702 } },
      { name: "permuted", delay: 4, transform: "segmentPermute", segment: { length: 3, permutation: [2, 0, 1] } },
      { name: "augmented", delay: 2, timeScale: Math.SQRT2, register: -1, loop: 2 },
    ],
    free: [{ name: "drone", notes: melody("0:8"), register: -2, loop: 2 }],
    ending: { kind: "free-cadence", dur: 0.5 },
  };
  assert.deepEqual(streamed(mixed), canon.render(mixed), "mixed");
  // A follower that needs the future (R) comes out only at finish.
  const state = canon.start(twoVoice({ transform: "R" }));
  const early = canon.step(state, { dur: 1, degree: 0 });
  assert.deepEqual(early.map((e) => e.voice), [0], "step gives the dux note, not the crab's");
});

// ---------------------------------------------------------------- the presets

test("preset: the round, each voice one section (8 beats) after the last, twice through", () => {
  const r = canon.render(presets.preset(0));
  assert.equal(r.voices.length, 4);
  const first = of(r, 0);
  assert.deepEqual(first.slice(0, 8).map((e) => e.pitch), [60, 62, 64, 60, 60, 62, 64, 60], "Frere Jacques");
  for (let k = 1; k < 4; k++) {
    const voice = of(r, k);
    assert.equal(voice.length, first.length);
    voice.forEach((e, i) => {
      assert.equal(e.pitch, first[i].pitch);
      near(e.t, first[i].t + 8 * k, 1e-12, `voice ${k + 1} note ${i}`);
    });
  }
  near(r.length, 24 + 64, 1e-12, "the last voice ends 3 sections after the first");
});

test("preset: the double canon, a 2-voice and a 3-voice canon together, then the cadence", () => {
  const r = canon.render(presets.preset(1));
  assert.deepEqual(r.voices.map((v) => v.group), [
    "upper canon (2 voices)", "upper canon (2 voices)",
    "lower canon (3 voices)", "lower canon (3 voices)", "lower canon (3 voices)",
  ]);
  const cantus = named(r, "cantus").filter((e) => !e.coda);
  const altus = named(r, "altus").filter((e) => !e.coda);
  // The altus answers a fifth lower, 4 beats later, until the cut.
  altus.forEach((e, i) => near(e.t, cantus[i].t + 4, 1e-12, `altus note ${i}`));
  assert.deepEqual(altus.slice(0, 3).map((e) => e.pitch), [67, 65, 64], "D5 C5 B4 a fifth lower: G4 F4 E4");
  // The cadence: the outer voices 8-7-8 over 2-2-1, ending on D, two octaves apart.
  const top = named(r, "cantus").filter((e) => e.coda).map((e) => e.pitch);
  const bottom = named(r, "bassus").filter((e) => e.coda).map((e) => e.pitch);
  assert.deepEqual(top, [74, 72, 74]);
  assert.deepEqual(bottom, [52, 52, 50]);
  const final = r.events.filter((e) => e.coda && e.t === Math.max(...r.events.map((x) => x.t)));
  assert.ok(final.every((e) => [2, 5, 9].includes(e.pitch % 12)), "the final chord: D, F and A only");
});

test("preset: the prolation canon, durations exactly 1:2:4:8, an octave apart", () => {
  const r = canon.render(presets.preset(2));
  const voices = [0, 1, 2, 3].map((k) => of(r, k));
  const firstPass = voices[0].filter((e) => e.pass === 0);
  for (let k = 1; k < 4; k++) {
    const pass = voices[k].filter((e) => e.pass === 0);
    pass.forEach((e, i) => {
      near(e.dur, firstPass[i].dur * 2 ** k, 1e-12, `voice ${k + 1} note ${i}`);
      near(e.pitch, firstPass[i].pitch - 12 * k, 1e-12, `voice ${k + 1} note ${i} pitch`);
    });
  }
  assert.equal(voices[0][0].pitch, 81, "the fastest voice starts on A5");
  // The faster voices repeat, so all four span the same 208 beats.
  voices.forEach((v, k) => near(v.at(-1).t + v.at(-1).dur - k, 208, 1e-9, `voice ${k + 1} span`));
});

test("preset: the Goldberg ladder, a canon at each interval in turn over the ground", () => {
  const r = canon.render(presets.preset(3));
  const g = tuning.edo(12, { mode: [0, 2, 4, 5, 7, 9, 11], ref: { step: 0, midi: 67 } });
  for (let k = 0; k < 9; k++) {
    const dux = of(r, 2 * k);
    const comes = of(r, 2 * k + 1);
    near(dux[0].t, 16 * k, 1e-12, `canon ${k} starts`);
    comes.forEach((e, i) => {
      const degree = tuning.quantize(g, dux[i].pitch).degree + k;
      near(e.pitch, tuning.degreeToPitch(g, degree), 1e-12, `canon at step ${k}, note ${i}`);
    });
  }
  const ground = named(r, "ground");
  assert.deepEqual(ground.slice(0, 8).map((e) => e.pitch), [55, 54, 52, 50, 47, 48, 50, 43], "G F# E D B C D G");
  assert.equal(ground.length, 72, "nine times through");
});

test("preset: the 31-EDO spiral rises a meantone whole tone per pass and misses the octave", () => {
  const r = canon.render(presets.preset(4));
  const dux = of(r, 0);
  const pass = (k) => dux.filter((e) => e.pass === k);
  const tone = (5 * 12) / 31;
  for (let k = 1; k < 7; k++) pass(k).forEach((e, i) => near(e.pitch, pass(0)[i].pitch + k * tone, 1e-9, `pass ${k} note ${i}`));
  // The seventh pass starts 30 steps up: an octave less a diesis (38.71 cents).
  near((pass(0)[0].pitch + 12 - pass(6)[0].pitch) * 100, 1200 / 31, 1e-9, "the diesis");
});
