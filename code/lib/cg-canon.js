"use strict";
// Renders a canon spec into events (PLAN.md 3.1, 3.4). No counterpoint rules
// here: M2 renders and plays, M3 judges.
//
// A spec:
//   name, tempo (beats per minute, for the player)
//   meter    { beats, strong }: a bar's length and its strong beats (the analyzer's)
//   system   the scale system (cg-scales fromSpec); 12-EDO on C4 if left out
//   dux      { source: "list", notes: [...] } or { source: "walk", ... }
//   voices   [{ ... }], one per voice; the first is usually the dux itself
//   groups   instead of dux + voices: several canons, each { name, start,
//            system, dux, voices } (double and triple canons, or canons in turn)
//   free     voices outside the canon: { name, start, notes, loop, register, ... }
//   ending   "none" (default), "cut", { kind: "cut", at }, { kind: "loop",
//            passes }, or { kind: "free-cadence", formula, final, dur }
//
// A voice (every field optional):
//   delay      beats after its group starts
//   interval   3 / { steps: 3 } (scale steps) or { cents } / { ratio } (exact)
//   scale      the follower's own system: its degrees are read there (interscalar)
//   transform  P, I, R, RI, segmentRetrograde or segmentPermute
//   segment    { length, permutation } for the segment transforms
//   axis       the inversion axis (cg-transform axis): degree, log, partial, linear
//   timeScale  2 = augmentation, 0.5 = diminution, any number above 0
//   tapeSpeed  a ratio r: transposes by r and plays 1/r as long
//   talea      a duration cycle that replaces the rhythm (negative = rest)
//   loop       passes (default 1); spiral: an interval added on each pass
//   register   octaves up (+) or down (-); out: "hz" or "mpe"; vel: 1-127
//
// render(spec) does it all at once. start/step/finish do the same one dux note
// at a time, as a live host would; finalize turns their events into the same
// result. Voices that need the dux's future (R, RI, segments, later passes)
// come out at finish.

const tuning = require("cg-tuning");
const scales = require("cg-scales");
const time = require("cg-time");
const tf = require("cg-transform");
const rng = require("cg-rng");

const DEFAULT_VEL = 90;
const TRANSFORMS = ["P", "I", "R", "RI", "segmentRetrograde", "segmentPermute"];
const FORMULAS = {
  // Degrees above the final, for the upper and lower voice, chord by chord, and
  // each chord's length in `dur`s. 8 is the final an octave (period) up.
  // Suspension, resolution, final (Mann p. 230):
  "7-6|8": { upper: (m) => [m, m - 1, m], lower: () => [1, 1, 0], lengths: [1, 1, 2], apart: 1 },
  "2-3|1": { upper: () => [1, 1, 0], lower: () => [0, -1, 0], lengths: [1, 1, 2], apart: 0 },
  // First species (Fux pp. 28-29): the penultimate a major sixth opening to the
  // octave, or a minor third closing to the unison, by contrary step (M4).
  "6|8": { upper: (m) => [m - 1, m], lower: () => [1, 0], lengths: [1, 2], apart: 1 },
  "3|1": { upper: () => [1, 0], lower: () => [-1, 0], lengths: [1, 2], apart: 0 },
};

function check(condition, message) {
  if (!condition) throw new Error(message);
}

// ---------------------------------------------------------------- compiling a spec

function endingOf(e) {
  if (e === undefined || e === null) return { kind: "none" };
  const spec = typeof e === "string" ? { kind: e } : e;
  switch (spec.kind) {
    case "none":
      return { kind: "none" };
    case "cut":
      return { kind: "cut", at: spec.at };
    case "loop": {
      const passes = spec.passes === undefined ? 2 : spec.passes;
      check(Number.isInteger(passes) && passes >= 1, `loop passes must be a whole number from 1, got ${passes}`);
      return { kind: "loop", passes, at: spec.at };
    }
    case "free-cadence": {
      const formula = spec.formula || "7-6|8";
      check(FORMULAS[formula], `unknown cadence formula "${formula}" (${Object.keys(FORMULAS).join(", ")})`);
      const dur = spec.dur === undefined ? 1 : spec.dur;
      check(dur > 0, `the cadence's chord length must be above 0, got ${dur}`);
      return { kind: "free-cadence", formula, dur, final: spec.final, at: spec.at };
    }
    case "converge":
      throw new Error('the "converge" ending arrives in M6, with the convergence solver');
    default:
      throw new Error(`unknown ending "${spec.kind}" (none, cut, loop or free-cadence)`);
  }
}

function compileVoice(v, system, ending, start, index, name) {
  const transform = v.transform || "P";
  check(TRANSFORMS.includes(transform), `voice ${name}: unknown transform "${transform}" (${TRANSFORMS.join(", ")})`);
  if (transform.startsWith("segment")) {
    check(v.segment && v.segment.length > 0, `voice ${name}: ${transform} needs segment: { length }`);
    check(transform !== "segmentPermute" || Array.isArray(v.segment.permutation),
      `voice ${name}: segmentPermute needs segment.permutation`);
  }
  let iv = tf.interval(v.interval);
  let scale = v.timeScale === undefined ? 1 : v.timeScale;
  if (v.tapeSpeed !== undefined) {
    check(v.interval === undefined && v.timeScale === undefined,
      `voice ${name}: tapeSpeed sets the interval and the time scale; don't give those as well`);
    const r = tuning.parseRatio(v.tapeSpeed);
    iv = { domain: "absolute", cents: 1200 * Math.log2(r), nearest: false };
    scale = 1 / r;
  }
  const delay = v.delay === undefined ? 0 : v.delay;
  check(Number.isFinite(delay) && delay >= 0, `voice ${name}: delay must be 0 or more, got ${delay}`);
  const passes = v.loop !== undefined ? v.loop : ending.kind === "loop" ? ending.passes : 1;
  check(Number.isInteger(passes) && passes >= 1, `voice ${name}: loop must be a whole number from 1, got ${passes}`);
  const register = v.register === undefined ? 0 : v.register;
  check(Number.isInteger(register), `voice ${name}: register must be whole octaves, got ${register}`);
  return {
    name,
    index,
    start: start + delay,
    system: v.scale ? scales.fromSpec(v.scale) : system,
    transform,
    segment: v.segment,
    axisSpec: v.axis,
    interval: iv,
    timeScale: scale,
    talea: v.talea || null,
    passes,
    spiral: v.spiral !== undefined ? tf.interval(v.spiral) : null,
    register,
    out: v.out || "hz",
    vel: v.vel === undefined ? DEFAULT_VEL : v.vel,
    inverts: transform === "I" || transform === "RI",
    // P and I need only the notes so far: a live host could stream them.
    streamable: transform === "P" || transform === "I",
  };
}

function compile(spec) {
  check(spec && typeof spec === "object", "a canon spec must be an object");
  const system = scales.fromSpec(spec.system);
  const ending = endingOf(spec.ending);
  const canons = spec.groups ? spec.groups : [{ dux: spec.dux, voices: spec.voices }];
  check(canons.length > 0, "the spec needs a dux and voices, or groups");
  const groups = [];
  let index = 0;
  canons.forEach((g, gi) => {
    const label = g.name || (canons.length > 1 ? `canon ${gi + 1}` : "canon");
    check(g.dux, `${label}: no dux`);
    check(Array.isArray(g.voices) && g.voices.length > 0, `${label}: no voices`);
    const gs = g.system ? scales.fromSpec(g.system) : system;
    const start = g.start === undefined ? 0 : g.start;
    groups.push({
      name: label, kind: "canon", system: gs, dux: g.dux,
      voices: g.voices.map((v, vi) =>
        compileVoice(v, gs, ending, start, index++, v.name || (vi === 0 ? "dux" : `comes ${vi}`))),
    });
  });
  (spec.free || []).forEach((f, fi) => {
    const label = f.name || `free ${fi + 1}`;
    check(Array.isArray(f.notes) && f.notes.length > 0, `${label}: no notes`);
    const fs = f.system ? scales.fromSpec(f.system) : system;
    const voice = { delay: f.start, loop: f.loop, register: f.register, out: f.out, vel: f.vel, spiral: f.spiral };
    groups.push({
      name: label, kind: "free", system: fs, dux: { source: "list", notes: f.notes },
      voices: [compileVoice(voice, fs, ending, 0, index++, label)],
    });
  });
  return { name: spec.name || "canon", tempo: spec.tempo || 60, meter: spec.meter, ending, groups };
}

// ---------------------------------------------------------------- the dux

function duxMaterial(dux, system) {
  const source = dux.source || "list";
  if (source === "list") {
    check(Array.isArray(dux.notes) && dux.notes.length > 0, "the dux needs notes");
    return dux.notes.map((n, i) => tf.note(n, system, i));
  }
  if (source === "walk") return walk(dux, system);
  if (source === "generate") throw new Error('the "generate" dux arrives in M4, with the generator');
  throw new Error(`unknown dux source "${source}" (list or walk)`);
}

// A seeded random walk in scale degrees: the same seed gives the same melody.
function walk({ length = 16, seed = 1, start = 0, moves = [-2, -1, 1, 2], durs = [1], low, high }, system) {
  const random = rng.create(seed);
  const count = tuning.size(system);
  const repeating = system.period_cents !== null;
  const lo = low !== undefined ? low : repeating ? -count : 0;
  const hi = high !== undefined ? high : repeating ? count : count - 1;
  const clamp = (d) => Math.max(lo, Math.min(hi, d));
  const notes = [];
  let degree = clamp(start);
  for (let i = 0; i < length; i++) {
    notes.push({ dur: random.pick(durs), degree, offset: 0, rest: false, index: i });
    degree = clamp(degree + random.pick(moves));
  }
  return notes;
}

// ---------------------------------------------------------------- one voice

// Inversion (if any), then transposition into the voice's own system.
function mapNote(cv, ax, n, duxSystem) {
  const m = cv.inverts ? tf.invert(n, ax, duxSystem) : n;
  return tf.transpose(m, cv.interval, duxSystem, cv.system);
}

function axisFor(cv, notes, duxSystem) {
  if (!cv.inverts) return null;
  const first = notes.find((n) => !n.rest);
  check(first, `voice ${cv.name}: an inversion needs a sounding note`);
  return tf.axis(cv.axisSpec, first, duxSystem);
}

// The order of the voice's notes: segments, then retrograde.
function arrange(cv, notes) {
  let out = notes;
  if (cv.transform === "segmentRetrograde") out = tf.segmentRetrograde(out, cv.segment.length);
  if (cv.transform === "segmentPermute") out = tf.segmentPermute(out, cv.segment.length, cv.segment.permutation);
  if (cv.transform === "R" || cv.transform === "RI") out = tf.retrograde(out);
  return out;
}

// One pass: sounding notes at times from 0, and the pass's length.
function layout(cv, notes, ax, duxSystem) {
  const r = tf.rhythm(cv.talea, cv.timeScale);
  const sounding = [];
  let cursor = 0;
  for (const n of notes) {
    const mapped = mapNote(cv, ax, n, duxSystem);
    for (const p of r.next(mapped)) {
      if (!p.rest) sounding.push({ t: cursor, dur: p.dur, n: mapped });
      cursor += p.dur;
    }
  }
  return { sounding, length: cursor };
}

function event(cv, t, dur, n, pass) {
  return {
    t, dur,
    pitch: tf.pitchOf(n, cv.system) + 12 * cv.register,
    vel: cv.vel, voice: cv.index, index: n.index, pass,
  };
}

// Every pass of a voice; a spiral moves pass k by k times its interval.
function expand(cv, sounding, length) {
  const events = [];
  for (let k = 0; k < cv.passes; k++) {
    const iv = cv.spiral && k > 0 ? tf.times(cv.spiral, k) : null;
    for (const s of sounding) {
      const n = iv ? tf.transpose(s.n, iv, cv.system, cv.system) : s.n;
      events.push(event(cv, cv.start + k * length + s.t, s.dur, n, k));
    }
  }
  return events;
}

function voiceEvents(cv, material, duxSystem) {
  const { sounding, length } = layout(cv, arrange(cv, material), axisFor(cv, material, duxSystem), duxSystem);
  return expand(cv, sounding, length);
}

// ---------------------------------------------------------------- endings

function cut(events, at) {
  return events
    .filter((e) => time.lt(e.t, at))
    .map((e) => (time.lt(at, e.t + e.dur) ? { ...e, dur: at - e.t } : e));
}

// The degree `degree` (plus whole periods) whose pitch is nearest `target`.
function nearestShift(system, degree, target) {
  const m = tuning.size(system);
  const around = Math.round((tuning.quantize(system, target).degree - degree) / m);
  let best = degree + around * m;
  for (const k of [around - 1, around + 1]) {
    const d = degree + k * m;
    if (Math.abs(tuning.degreeToPitch(system, d) - target) < Math.abs(tuning.degreeToPitch(system, best) - target)) best = d;
  }
  return best;
}

// A fixed cadence after the cut (M2 has no rules; M4 can write better codas):
// the lowest and highest voices take the formula, the others hold the
// nearest of the final, its third and its fifth (degrees 0, 2, 4).
function coda(plan, events, at) {
  const { formula, dur } = plan.ending;
  const shape = FORMULAS[formula];
  const last = new Map();
  for (const e of events) {
    const prev = last.get(e.voice);
    if (!prev || !time.lt(e.t, prev.t)) last.set(e.voice, e);
  }
  const parts = plan.groups
    .filter((g) => g.kind === "canon")
    .flatMap((g) => g.voices)
    .filter((cv) => last.has(cv.index))
    .map((cv) => ({ cv, pitch: last.get(cv.index).pitch - 12 * cv.register }))
    .sort((a, b) => a.pitch - b.pitch);
  if (parts.length === 0) return [];
  const final = plan.ending.final !== undefined ? plan.ending.final : firstDegree(plan);
  const lengths = shape.lengths.map((k) => k * dur);
  const starts = lengths.map((_, i) => lengths.slice(0, i).reduce((a, b) => a + b, 0));
  const total = lengths.reduce((a, b) => a + b, 0);
  const line = (cv, degrees) => degrees.map((d, i) => ({
    t: at + starts[i], dur: lengths[i],
    pitch: tuning.degreeToPitch(cv.system, d) + 12 * cv.register,
    vel: cv.vel, voice: cv.index, index: -1, pass: 0, coda: true,
  }));
  for (const { cv } of parts) {
    check(cv.system.period_cents !== null, `${cv.system.name}: a free cadence needs a repeating scale system`);
  }

  const out = [];
  const low = parts[0];
  const high = parts[parts.length - 1];
  const m = (cv) => tuning.size(cv.system);
  let lowFinal = null;
  if (parts.length > 1) {
    const rel = shape.lower(m(low.cv));
    const last = rel[rel.length - 1];
    lowFinal = nearestShift(low.cv.system, final + last, low.pitch);
    const base = lowFinal - last;
    out.push(...line(low.cv, rel.map((r) => base + r)));
  }
  const relHigh = shape.upper(m(high.cv));
  const highLast = relHigh[relHigh.length - 1];
  let highFinal = nearestShift(high.cv.system, final + highLast, high.pitch);
  if (lowFinal !== null) {
    // Keep the formula's interval: the upper final at least `apart` periods above.
    const floor = tuning.degreeToPitch(low.cv.system, lowFinal) + 12 * low.cv.register
      + (shape.apart * low.cv.system.period_cents) / 100 - 12 * high.cv.register;
    while (time.lt(tuning.degreeToPitch(high.cv.system, highFinal), floor)) highFinal += m(high.cv);
  }
  out.push(...line(high.cv, relHigh.map((r) => highFinal - highLast + r)));

  for (const { cv, pitch } of parts.slice(1, -1)) {
    let best = null;
    for (const tone of [0, 2, 4]) {
      const d = nearestShift(cv.system, final + tone, pitch);
      if (best === null || Math.abs(tuning.degreeToPitch(cv.system, d) - pitch) < Math.abs(tuning.degreeToPitch(cv.system, best) - pitch)) best = d;
    }
    out.push({
      t: at, dur: total, pitch: tuning.degreeToPitch(cv.system, best) + 12 * cv.register,
      vel: cv.vel, voice: cv.index, index: -1, pass: 0, coda: true,
    });
  }
  return out;
}

function firstDegree(plan) {
  const g = plan.groups[0];
  const first = duxMaterial(g.dux, g.system).find((n) => !n.rest);
  check(first, "the free cadence needs a final: give ending.final");
  return first.degree;
}

function assemble(plan, events) {
  let out = events;
  if (plan.ending.kind !== "none") {
    const leader = plan.groups[0].voices[0].index;
    const leaderEnd = out.filter((e) => e.voice === leader).reduce((m, e) => Math.max(m, e.t + e.dur), 0);
    const at = plan.ending.at !== undefined ? plan.ending.at : leaderEnd;
    out = cut(out, at);
    if (plan.ending.kind === "free-cadence") out = out.concat(coda(plan, out, at));
  }
  out = time.sortEvents(out);
  return {
    name: plan.name,
    tempo: plan.tempo,
    meter: plan.meter,
    voices: plan.groups.flatMap((g) => g.voices.map((cv) => ({
      name: cv.name, group: g.name, kind: g.kind, out: cv.out, system: cv.system.name,
    }))),
    events: out,
    length: out.reduce((m, e) => Math.max(m, e.t + e.dur), 0),
  };
}

// ---------------------------------------------------------------- the API

function render(spec) {
  const plan = compile(spec);
  const events = [];
  for (const g of plan.groups) {
    const material = duxMaterial(g.dux, g.system);
    for (const cv of g.voices) events.push(...voiceEvents(cv, material, g.system));
  }
  return assemble(plan, events);
}

// Incremental rendering: start, then step once per dux note (group 0 unless
// given), then finish, then finalize(state, all the events) = render(spec).
function start(spec) {
  const plan = compile(spec);
  return { plan, received: plan.groups.map(() => []), streams: new Map() };
}

function step(state, raw, group = 0) {
  const g = state.plan.groups[group];
  check(g && g.kind === "canon", `no canon group ${group}`);
  const received = state.received[group];
  const n = tf.note(raw, g.system, received.length);
  received.push(n);
  const out = [];
  for (const cv of g.voices) {
    if (!cv.streamable) continue;
    let s = state.streams.get(cv.index);
    if (!s) {
      s = { rhythm: tf.rhythm(cv.talea, cv.timeScale), cursor: 0, sounding: [], ax: null };
      state.streams.set(cv.index, s);
    }
    if (cv.inverts && !s.ax && !n.rest) s.ax = tf.axis(cv.axisSpec, n, g.system);
    const mapped = mapNote(cv, s.ax, n, g.system);
    for (const p of s.rhythm.next(mapped)) {
      if (!p.rest) {
        const item = { t: s.cursor, dur: p.dur, n: mapped };
        s.sounding.push(item);
        out.push(event(cv, cv.start + item.t, item.dur, mapped, 0));
      }
      s.cursor += p.dur;
    }
  }
  return out;
}

function finish(state) {
  const out = [];
  state.plan.groups.forEach((g, gi) => {
    const streamed = state.received[gi].length > 0;
    const material = streamed ? state.received[gi] : duxMaterial(g.dux, g.system);
    for (const cv of g.voices) {
      const s = state.streams.get(cv.index);
      if (streamed && cv.streamable && s) {
        out.push(...expand(cv, s.sounding, s.cursor).filter((e) => e.pass > 0));
      } else {
        out.push(...voiceEvents(cv, material, g.system));
      }
    }
  });
  return out;
}

function finalize(state, events) {
  return assemble(state.plan, events);
}

exports.render = render;
exports.start = start;
exports.step = step;
exports.finish = finish;
exports.finalize = finalize;
exports.duxMaterial = duxMaterial;
