"use strict";
// The analyzer (PLAN.md 3.3, 3.6). It reads rendered events and reports what a
// listener would hear:
//   slices   at every onset: the sounding notes, lowest first. The lowest is the
//            sounding bass, in real registers, whatever the voice order on paper
//            (Mann p. 228: a canon sung in the wrong registers turns a 5/3 into a
//            6/4). Every interval above the bass and between every pair, classed
//            by the consonance model.
//   motion   per voice pair, between consecutive slices: parallel, similar,
//            contrary, oblique (or none: neither moved)
//   metrics  Tymoczko's components of tonality, and voice-leading size, in any
//            tuning (A Geometry of Music, ch. 1-5; formulas marked "ours" are ours)
//   rules    a rule profile (cg-rules) turns slices and motion into violations
//
// analyze(rendered, options) takes cg-canon's render(spec) result, or any
// { events: [{ t, dur, pitch, voice }] }. Options:
//   system       the scale system (melodic steps are counted in its degrees)
//   meter        { beats: 4, strong: [0] }: a bar's length, and its strong beats
//   consonance   a model, or a cg-consonance spec
//   profile      a rule profile name or object (cg-rules); none = metrics only
//   window       beats per macroharmony window (default: one bar)
//   pcTolerance  cents within which two pitch classes count as one (default 15)
//   vlNorm       taxicab (default), euclidean or chebyshev
//   final        the mode's final as a pitch (fux rules); default: voice 0's last note
//   fourthsFree  judge every pair as upper voices (a fourth is consonant): for
//                screening part of a texture whose real bass isn't there yet

const tuning = require("cg-tuning");
const scales = require("cg-scales");
const time = require("cg-time");
const consonance = require("cg-consonance");
const rules = require("cg-rules");

const DEFAULT_METER = { beats: 4, strong: [0] };

function meterOf(m) {
  const beats = m && m.beats > 0 ? m.beats : DEFAULT_METER.beats;
  const strong = m && Array.isArray(m.strong) ? m.strong : DEFAULT_METER.strong;
  return { beats, strong };
}

// Bar (from 1, as scores count), beat within the bar (from 0), strong or not.
function position(t, meter) {
  const bar = Math.floor(t / meter.beats + time.EPS);
  const beat = t - bar * meter.beats;
  return { bar: bar + 1, beat, strong: meter.strong.some((s) => time.eq(beat, s)) };
}

// ---------------------------------------------------------------- slices

function onsets(events) {
  const times = [];
  for (const e of time.sortEvents(events)) {
    if (!times.length || !time.eq(times[times.length - 1], e.t)) times.push(e.t);
  }
  return times;
}

function classifier(model) {
  const cache = new Map();
  return (cents, lowPitch) => {
    const lowHz = tuning.midiToHz(lowPitch);
    const key = model.name === "roughness" ? `${cents.toFixed(3)}@${lowHz.toFixed(1)}` : cents.toFixed(3);
    if (!cache.has(key)) cache.set(key, model.classify(cents, { lowHz }));
    return cache.get(key);
  };
}

// Every onset time, with what sounds there. A sweep: events enter at their
// onset and leave at their end.
function buildSlices(events, model, meter, fourthsFree = false) {
  const sorted = time.sortEvents(events.filter((e) => e.dur > 0));
  const classify = classifier(model);
  const slices = [];
  let next = 0;
  let active = [];
  for (const t of onsets(sorted)) {
    while (next < sorted.length && time.le(sorted[next].t, t)) active.push(sorted[next++]);
    active = active.filter((e) => time.lt(t, e.t + e.dur));
    const notes = active
      .map((e) => ({ voice: e.voice, pitch: e.pitch, onset: time.eq(e.t, t), event: e }))
      .sort((a, b) => a.pitch - b.pitch || a.voice - b.voice);
    const bass = notes[0];
    const above = notes.slice(1).map((n) => {
      const cents = (n.pitch - bass.pitch) * 100;
      return { voice: n.voice, cents, ...classify(cents, bass.pitch) };
    });
    const pairs = [];
    for (let i = 0; i < notes.length; i++) {
      for (let j = i + 1; j < notes.length; j++) {
        const low = notes[i];
        const high = notes[j];
        const cents = (high.pitch - low.pitch) * 100;
        pairs.push({ low: low.voice, high: high.voice, cents, withBass: i === 0 && !fourthsFree, ...classify(cents, low.pitch) });
      }
    }
    slices.push({ t, ...position(t, meter), notes, bass: bass.voice, above, pairs });
  }
  return slices;
}

// ---------------------------------------------------------------- motion

const pairKey = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);

// Between consecutive slices, for every pair sounding in both.
function motionBetween(prev, next) {
  const before = new Map(prev.notes.map((n) => [n.voice, n]));
  const out = [];
  const voices = next.notes.filter((n) => before.has(n.voice));
  for (let i = 0; i < voices.length; i++) {
    for (let j = i + 1; j < voices.length; j++) {
      const a = voices[i];
      const b = voices[j];
      const da = a.pitch - before.get(a.voice).pitch;
      const db = b.pitch - before.get(b.voice).pitch;
      const was = (before.get(a.voice).pitch - before.get(b.voice).pitch) * 100;
      const is = (a.pitch - b.pitch) * 100;
      let kind;
      const still = (d) => Math.abs(d) < 1e-6;
      if (still(da) && still(db)) kind = "none";
      else if (still(da) || still(db)) kind = "oblique";
      else if (Math.sign(da) !== Math.sign(db)) kind = "contrary";
      else kind = Math.abs(Math.abs(is) - Math.abs(was)) < 1 ? "parallel" : "similar";
      out.push({ voices: [a.voice, b.voice].sort((x, y) => x - y), kind, key: pairKey(a.voice, b.voice),
        crossed: Math.sign(is) !== Math.sign(was) && !still(is) && !still(was) });
    }
  }
  return out;
}

// ---------------------------------------------------------------- metrics

const fold = (cents, period) => ((cents % period) + period) % period;

// Melodic lines per voice: each note's pitch in order (held notes count once).
function lines(events) {
  const byVoice = new Map();
  for (const e of time.sortEvents(events)) {
    if (!byVoice.has(e.voice)) byVoice.set(e.voice, []);
    byVoice.get(e.voice).push(e);
  }
  return byVoice;
}

// Steps of the active scale between two pitches (the scale is the ruler, ch. 4).
function scaleSteps(system, a, b) {
  return Math.abs(tuning.quantize(system, b).degree - tuning.quantize(system, a).degree);
}

function conjunct(byVoice, system) {
  const perVoice = {};
  let steps = 0;
  let cents = 0;
  let count = 0;
  for (const [voice, notes] of byVoice) {
    let s = 0;
    let c = 0;
    let n = 0;
    for (let i = 1; i < notes.length; i++) {
      s += scaleSteps(system, notes[i - 1].pitch, notes[i].pitch);
      c += Math.abs(notes[i].pitch - notes[i - 1].pitch) * 100;
      n++;
    }
    perVoice[voice] = n ? { steps: s / n, cents: c / n } : { steps: 0, cents: 0 };
    steps += s;
    cents += c;
    count += n;
  }
  return { steps: count ? steps / count : 0, cents: count ? cents / count : 0, perVoice };
}

// The dissonance curve: the mean model score above the bass, per slice.
function dissonanceCurve(slices) {
  const points = slices.map((s) => ({
    t: s.t,
    score: s.above.length ? s.above.reduce((sum, a) => sum + a.score, 0) / s.above.length : 0,
  }));
  const mean = points.length ? points.reduce((sum, p) => sum + p.score, 0) / points.length : 0;
  return { points, mean, max: points.reduce((m, p) => Math.max(m, p.score), 0) };
}

// Distinct pitch classes (cents, folded), merging any within `tolerance`.
function pitchClasses(pitches, period, tolerance) {
  const pcs = [];
  for (const p of pitches) {
    const pc = fold(p * 100, period);
    const near = pcs.find((q) => Math.min(Math.abs(q - pc), period - Math.abs(q - pc)) <= tolerance);
    if (near === undefined) pcs.push(pc);
  }
  return pcs.sort((a, b) => a - b);
}

// A chord type: its pitch classes, transposed to start at 0 and rotated to the
// most compact form, so octave, order and transposition don't matter (OPT).
function chordType(pcs, period) {
  let best = null;
  for (let r = 0; r < pcs.length; r++) {
    const rotated = pcs.map((_, i) => fold(pcs[(r + i) % pcs.length] - pcs[r], period));
    const span = rotated[rotated.length - 1];
    if (!best || span < best.span - 1e-9) best = { form: rotated, span };
  }
  return best.form;
}

function typeDistance(a, b, period) {
  let best = Infinity;
  for (let r = 0; r < b.length; r++) {
    const rotated = b.map((_, i) => fold(b[(r + i) % b.length] - b[r], period));
    best = Math.min(best, a.reduce((sum, x, i) => sum + Math.abs(x - rotated[i]), 0));
  }
  return best;
}

// Mean distance between successive chord types, only between slices with the
// same number of distinct pitch classes; otherwise undefined (not counted).
function harmonicConsistency(slices, period, tolerance) {
  let total = 0;
  let count = 0;
  let prev = null;
  for (const s of slices) {
    const pcs = pitchClasses(s.notes.map((n) => n.pitch), period, tolerance);
    const type = pcs.length > 1 ? chordType(pcs, period) : null;
    if (type && prev && prev.length === type.length) {
      total += typeDistance(prev, type, period);
      count++;
    }
    prev = type;
  }
  return { mean: count ? total / count : null, compared: count };
}

// Pitch-class content in consecutive windows: its size, the circulation rate
// (new pitch classes per beat) and consistency (overlap with the window before).
function macroharmony(events, length, window, period, tolerance) {
  const windows = [];
  for (let start = 0; time.lt(start, length); start += window) {
    const end = start + window;
    const pitches = events.filter((e) => time.lt(e.t, end) && time.lt(start, e.t + e.dur)).map((e) => e.pitch);
    windows.push({ start, pcs: pitchClasses(pitches, period, tolerance) });
  }
  const same = (a, b) => Math.min(Math.abs(a - b), period - Math.abs(a - b)) <= tolerance;
  let fresh = 0;
  let overlap = 0;
  for (let i = 1; i < windows.length; i++) {
    const a = windows[i - 1].pcs;
    const b = windows[i].pcs;
    fresh += b.filter((x) => !a.some((y) => same(x, y))).length;
    const shared = b.filter((x) => a.some((y) => same(x, y))).length;
    const union = a.length + b.length - shared;
    overlap += union ? shared / union : 1;
  }
  const n = windows.length;
  return {
    window,
    sizes: windows.map((w) => w.pcs.length),
    mean: n ? windows.reduce((s, w) => s + w.pcs.length, 0) / n : 0,
    circulation: n > 1 ? fresh / ((n - 1) * window) : 0,
    consistency: n > 1 ? overlap / (n - 1) : 1,
  };
}

// Centricity (ours): how concentrated the duration-weighted pitch-class
// distribution is. The bass and each voice's last note weigh double.
function centricity(slices, events, period, tolerance) {
  const weights = [];
  const add = (pitch, w) => {
    const pc = fold(pitch * 100, period);
    const near = weights.find((x) => Math.min(Math.abs(x.pc - pc), period - Math.abs(x.pc - pc)) <= tolerance);
    if (near) near.w += w;
    else weights.push({ pc, w });
  };
  for (let i = 0; i < slices.length; i++) {
    const s = slices[i];
    const span = i + 1 < slices.length ? slices[i + 1].t - s.t : Math.max(...s.notes.map((n) => n.event.t + n.event.dur - s.t));
    for (const n of s.notes) add(n.pitch, span * (n.voice === s.bass ? 2 : 1));
  }
  for (const notes of lines(events).values()) add(notes[notes.length - 1].pitch, notes[notes.length - 1].dur);
  const total = weights.reduce((s, x) => s + x.w, 0);
  if (!total) return { center: null, share: 0, entropy: 0 };
  weights.sort((a, b) => b.w - a.w);
  const entropy = weights.length > 1
    ? -weights.reduce((s, x) => s + (x.w / total) * Math.log2(x.w / total), 0) / Math.log2(weights.length)
    : 0;
  return { center: weights[0].pc, share: weights[0].w / total, entropy };
}

// Evenness (ours, after ch. 3): cents from each slice's pitch classes to the
// nearest perfectly even chord of the same size; 0 = an equal division.
function evenness(slices, period, tolerance) {
  const distances = [];
  for (const s of slices) {
    const pcs = pitchClasses(s.notes.map((n) => n.pitch), period, tolerance);
    if (pcs.length < 2) continue;
    const n = pcs.length;
    let best = Infinity;
    for (let r = 0; r < n; r++) {
      const rotated = pcs.map((_, i) => pcs[(r + i) % n] + (r + i >= n ? period : 0));
      const offsets = rotated.map((p, i) => p - (i * period) / n);
      const o = offsets.reduce((a, b) => a + b, 0) / n;
      best = Math.min(best, offsets.reduce((sum, x) => sum + Math.abs(x - o), 0));
    }
    distances.push(best);
  }
  return { mean: distances.length ? distances.reduce((a, b) => a + b, 0) / distances.length : null, slices: distances.length };
}

// Voice-leading size between consecutive slices, over the voices sounding in
// both (entries, exits and holes are counted apart, never folded in).
function voiceLeading(slices, norm) {
  const sizes = [];
  let entries = 0;
  let exits = 0;
  for (let i = 1; i < slices.length; i++) {
    const before = new Map(slices[i - 1].notes.map((n) => [n.voice, n.pitch]));
    const after = new Map(slices[i].notes.map((n) => [n.voice, n.pitch]));
    const moves = [];
    for (const [v, p] of after) {
      if (before.has(v)) moves.push(Math.abs(p - before.get(v)) * 100);
      else entries++;
    }
    for (const v of before.keys()) if (!after.has(v)) exits++;
    if (!moves.length) continue;
    let size;
    if (norm === "euclidean") size = Math.sqrt(moves.reduce((s, m) => s + m * m, 0));
    else if (norm === "chebyshev") size = Math.max(...moves);
    else size = moves.reduce((s, m) => s + m, 0);
    sizes.push(size);
  }
  return {
    norm, sizes,
    mean: sizes.length ? sizes.reduce((a, b) => a + b, 0) / sizes.length : 0,
    entries: entries + (slices.length ? slices[0].notes.length : 0), exits,
  };
}

// Boundary events: unisons inside a slice, and crossings between slices.
function boundary(slices, motion) {
  let unisons = 0;
  for (const s of slices) unisons += s.pairs.filter((p) => Math.abs(p.cents) < 1).length;
  const crossings = motion.reduce((sum, m) => sum + m.moves.filter((x) => x.crossed).length, 0);
  return { unisons, crossings };
}

// ---------------------------------------------------------------- the report

function modelFor(options, system) {
  const c = options.consonance;
  if (c && typeof c.classify === "function") return c;
  return consonance.fromSpec(c, system);
}

function analyze(rendered, options = {}) {
  const events = (rendered.events || []).filter((e) => e.dur > 0);
  const system = options.system || scales.fromSpec(undefined);
  const meter = meterOf(options.meter || rendered.meter);
  const model = modelFor(options, system);
  const period = system.period_cents || 1200;
  const tolerance = options.pcTolerance === undefined ? 15 : options.pcTolerance;
  const slices = buildSlices(events, model, meter, options.fourthsFree);
  const motion = [];
  for (let i = 1; i < slices.length; i++) motion.push({ from: i - 1, to: i, moves: motionBetween(slices[i - 1], slices[i]) });
  const length = events.reduce((m, e) => Math.max(m, e.t + e.dur), 0);
  const byVoice = lines(events);
  const metrics = {
    conjunct: conjunct(byVoice, system),
    dissonance: dissonanceCurve(slices),
    harmonicConsistency: harmonicConsistency(slices, period, tolerance),
    macroharmony: macroharmony(events, length, options.window || meter.beats, period, tolerance),
    centricity: centricity(slices, events, period, tolerance),
    evenness: evenness(slices, period, tolerance),
    voiceLeading: voiceLeading(slices, options.vlNorm || "taxicab"),
    boundary: boundary(slices, motion),
    period,
  };
  const context = { events, byVoice, slices, motion, system, meter, model, options };
  const judged = rules.judge(context, options.profile);
  return {
    model: model.name,
    profile: judged.profile,
    meter,
    slices,
    motion,
    metrics,
    violations: judged.violations,
    hard: judged.violations.filter((v) => v.hard).length,
    cost: judged.violations.reduce((sum, v) => sum + (v.hard ? 0 : v.cost), 0),
  };
}

exports.analyze = analyze;
exports.buildSlices = buildSlices;
exports.motionBetween = motionBetween;
exports.position = position;
exports.meterOf = meterOf;
exports.scaleSteps = scaleSteps;
exports.pitchClasses = pitchClasses;
exports.chordType = chordType;
exports.DEFAULT_METER = DEFAULT_METER;
