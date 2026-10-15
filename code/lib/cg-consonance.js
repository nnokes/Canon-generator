"use strict";
// Consonance models (PLAN.md 3.3). Fux's rules need to tell consonance from
// dissonance and perfect from imperfect (Study of Counterpoint, pp. 20-22). In
// 12-TET that's a table; in other tunings it has to be computed. Every model has
// one interface:
//
//   model.classify(cents, { lowHz }) -> { cls, fourth, score, ratio }
//     cls     "perfect" | "imperfect" | "dissonant"
//     fourth  true for the fourth (4/3): cls says dissonant, because it is against
//             the bass in two voices (Fux p. 21), but between upper voices it's
//             consonant. The rules decide which applies (cg-rules).
//     score   the model's own measure, lower = more consonant. Its scale differs
//             by model (a class rank, a Tenney height, a normalized roughness), so
//             it's for curves and ranking within one model, not across models.
//     ratio   the ratio the interval was heard as ("3/2"), where the model has one
//
// Intervals are folded to the system's period first (a tenth is a third), except
// by `roughness`, which hears the actual interval at the actual register.
//
//   fux12      Fux's table, snapped to the nearest semitone within a tolerance
//   ratio      the simplest ratio within a tolerance, scored by Tenney height
//              log2(n*d); classes are thresholds on it
//   roughness  Sethares's sensory roughness (after Plomp and Levelt), computed
//              from the timbre the voice bank plays (DEFAULT_PARTIALS)
//   table      your own table: cents -> class

// The voice bank's partial weights (cg.voice~, partials 1-4), so the roughness
// model hears the timbre the voices play. tools/patchgen.py writes the same
// numbers into the voice; tests/consonance.test.js checks that they match.
const DEFAULT_PARTIALS = [0.48, 0.24, 0.16, 0.12];
const CLASSES = ["perfect", "imperfect", "dissonant"];
const RANK = { perfect: 0, imperfect: 1, dissonant: 2 };

// Fold an interval (cents, either direction) into [0, period). A value a hair
// under the period counts as 0 (an octave is a unison class).
function fold(cents, period = 1200) {
  const value = Math.abs(cents);
  if (!period) return value;
  const folded = value - period * Math.floor(value / period);
  return period - folded < 1e-6 ? 0 : folded;
}

function result(cls, score, extra = {}) {
  return { cls, fourth: false, score, ratio: null, ...extra };
}

// --- fux12 -------------------------------------------------------------------

// Semitone class -> class. 5 is the fourth (see the header).
const FUX = ["perfect", "dissonant", "dissonant", "imperfect", "imperfect", "fourth", "dissonant",
  "perfect", "imperfect", "imperfect", "dissonant", "dissonant"];
// Scores rank the classes, and the fifth just above the octave, as Fux orders them.
const FUX_SCORE = [0, 1, 1, 0.3, 0.3, 0.5, 1, 0.1, 0.3, 0.3, 1, 1];

function fux12({ tolerance = 15 } = {}) {
  return {
    name: "fux12",
    period: 1200,
    classify(cents) {
      const folded = fold(cents, 1200);
      const semis = Math.round(folded / 100) % 12;
      if (Math.abs(folded - Math.round(folded / 100) * 100) > tolerance) return result("dissonant", 1);
      const cls = FUX[semis];
      if (cls === "fourth") return result("dissonant", FUX_SCORE[semis], { fourth: true });
      return result(cls, FUX_SCORE[semis]);
    },
  };
}

// --- ratio -------------------------------------------------------------------

function gcd(a, b) {
  return b ? gcd(b, a % b) : a;
}

function largestPrime(n) {
  let largest = 1;
  for (let p = 2; p * p <= n; p++) {
    while (n % p === 0) { largest = p; n /= p; }
  }
  return n > 1 ? Math.max(largest, n) : largest;
}

// Every reduced n/d with n, d <= limit, primes <= primeLimit, inside [1, periodRatio).
function candidates(limit, primeLimit, periodRatio) {
  const list = [];
  for (let d = 1; d <= limit; d++) {
    for (let n = d; n <= limit * Math.ceil(periodRatio); n++) {
      if (gcd(n, d) !== 1 || n / d >= periodRatio - 1e-12) continue;
      if (n > limit && d > 1) continue;
      if (largestPrime(n) > primeLimit || largestPrime(d) > primeLimit) continue;
      list.push({ n, d, cents: 1200 * Math.log2(n / d), height: Math.log2(n * d) });
    }
  }
  return list.sort((a, b) => a.height - b.height || a.cents - b.cents);
}

// The simplest ratio within `tolerance` cents wins (not the nearest: with a
// limit of 16 something complex is always near). perfect/imperfect are Tenney
// height thresholds: 1/1, 2/1 and 3/2 are perfect; thirds and sixths (and 7/4
// at prime limit 7) imperfect. The defaults agree with Fux's table on all 12
// classes of 12-EDO.
function ratio({ period = 1200, limit = 16, primeLimit = 5, tolerance = 20, perfect = 2.6, imperfect = 5.4 } = {}) {
  const periodRatio = period ? Math.pow(2, period / 1200) : 2;
  const list = candidates(limit, primeLimit, periodRatio);
  return {
    name: "ratio",
    period: period || 1200,
    classify(cents) {
      const folded = fold(cents, period || 1200);
      const hit = list.find((r) => Math.abs(r.cents - folded) <= tolerance
        || Math.abs(r.cents - folded + (period || 1200)) <= tolerance); // just under the period
      if (!hit) return result("dissonant", Math.log2(limit * limit));
      const text = `${hit.n}/${hit.d}`;
      if (hit.n === 4 && hit.d === 3) return result("dissonant", hit.height, { fourth: true, ratio: text });
      const cls = hit.height <= perfect ? "perfect" : hit.height <= imperfect ? "imperfect" : "dissonant";
      return result(cls, hit.height, { ratio: text });
    },
  };
}

// --- roughness ---------------------------------------------------------------

// Sethares, Tuning, Timbre, Spectrum, Scale (2nd ed. 2005), the dissmeasure
// routine: for two partials f1 < f2 with amplitudes a1, a2,
//   s = D* / (S1 f1 + S2),   d = a1 a2 (C1 e^(A1 s (f2-f1)) + C2 e^(A2 s (f2-f1)))
// summed over every pair of partials of both tones together.
const SETHARES = { dstar: 0.24, s1: 0.0207, s2: 18.96, c1: 5, c2: -5, a1: -3.51, a2: -5.75 };

function dissonance(freqs, amps) {
  const order = freqs.map((f, i) => i).sort((i, j) => freqs[i] - freqs[j]);
  const f = order.map((i) => freqs[i]);
  const a = order.map((i) => amps[i]);
  let total = 0;
  for (let i = 0; i < f.length; i++) {
    for (let j = i + 1; j < f.length; j++) {
      const s = SETHARES.dstar / (SETHARES.s1 * f[i] + SETHARES.s2);
      const x = f[j] - f[i];
      total += a[i] * a[j] * (SETHARES.c1 * Math.exp(SETHARES.a1 * s * x) + SETHARES.c2 * Math.exp(SETHARES.a2 * s * x));
    }
  }
  return total;
}

// Two tones with these partials (weights; partial k at k times f0), the upper
// one `cents` above `lowHz`.
function roughnessOf(cents, lowHz, partials = DEFAULT_PARTIALS) {
  const freqs = [];
  const amps = [];
  for (const f0 of [lowHz, lowHz * Math.pow(2, cents / 1200)]) {
    partials.forEach((w, k) => { freqs.push(f0 * (k + 1)); amps.push(w); });
  }
  return dissonance(freqs, amps);
}

// The roughness curve over one period above lowHz, one point per `step` cents.
function curve(lowHz, { partials = DEFAULT_PARTIALS, period = 1200, step = 1 } = {}) {
  const points = [];
  for (let c = 0; c <= period + 1e-9; c += step) points.push({ cents: c, roughness: roughnessOf(c, lowHz, partials) });
  return points;
}

// Classes are thresholds on roughness normalized to [0, 1] over the period at the
// bass's own frequency (roughness depends on register: the same third is rougher
// low down, which is why low thirds sound muddy).
function roughness({ partials = DEFAULT_PARTIALS, period = 1200, perfect = 0.12, imperfect = 0.45, lowHz = 261.63 } = {}) {
  const ranges = new Map(); // rounded Hz -> { min, max }
  function range(hz) {
    const key = Math.round(hz);
    if (!ranges.has(key)) {
      const values = curve(key, { partials, period: period || 1200, step: 5 }).map((p) => p.roughness);
      ranges.set(key, { min: Math.min(...values), max: Math.max(...values) });
    }
    return ranges.get(key);
  }
  return {
    name: "roughness",
    period: period || 1200,
    classify(cents, context = {}) {
      const hz = context.lowHz || lowHz;
      const { min, max } = range(hz);
      const score = Math.max(0, (roughnessOf(Math.abs(cents), hz, partials) - min) / (max - min || 1));
      const cls = score <= perfect ? "perfect" : score <= imperfect ? "imperfect" : "dissonant";
      return result(cls, score);
    },
  };
}

// --- table -------------------------------------------------------------------

// entries: [{ cents, cls }] within one period; the nearest within tolerance wins.
// A fourth can be marked with cls "fourth".
function table({ entries = [], period = 1200, tolerance = 15 } = {}) {
  for (const e of entries) {
    if (![...CLASSES, "fourth"].includes(e.cls)) throw new Error(`consonance table: unknown class ${e.cls}`);
  }
  return {
    name: "table",
    period: period || 1200,
    classify(cents) {
      const folded = fold(cents, period || 1200);
      let best = null;
      for (const e of entries) {
        const distance = Math.min(Math.abs(fold(e.cents, period || 1200) - folded),
          (period || 1200) - Math.abs(fold(e.cents, period || 1200) - folded));
        if (distance <= tolerance && (!best || distance < best.distance)) best = { e, distance };
      }
      if (!best) return result("dissonant", RANK.dissonant);
      if (best.e.cls === "fourth") return result("dissonant", 1.5, { fourth: true });
      return result(best.e.cls, RANK[best.e.cls]);
    },
  };
}

// --- choosing a model --------------------------------------------------------

function isTwelve(system) {
  return system && system.period_cents === 1200 && system.steps_cents.length === 12
    && system.steps_cents.every((c, i) => Math.abs(c - 100 * i) < 1e-6);
}

// The largest prime in a system's ratios, so a 7-limit system hears 7/4. A
// system that doesn't repeat at the octave starts at 7: Bohlen-Pierce is built on
// odd ratios 3:5:7, even in its equal-tempered form.
function systemPrimeLimit(system) {
  let largest = system && system.period_cents && Math.abs(system.period_cents - 1200) > 1e-6 ? 7 : 5;
  for (const r of [...((system && system.ratios) || []), system && system.period_ratio]) {
    if (typeof r !== "string") continue;
    for (const part of r.split("/")) largest = Math.max(largest, largestPrime(Number(part)));
  }
  return Math.min(largest, 13);
}

const MODELS = { fux12, ratio, roughness, table };

// spec: undefined, a model name, or { model, ...options }. The period comes from
// the system (non-repeating systems fold at 1200 cents, PLAN 3.6).
function fromSpec(spec, system) {
  const options = typeof spec === "string" ? { model: spec } : { ...(spec || {}) };
  const period = (system && system.period_cents) || 1200;
  const name = options.model || (isTwelve(system) || !system ? "fux12" : "ratio");
  if (!MODELS[name]) throw new Error(`consonance: unknown model ${name}; one of ${Object.keys(MODELS).join(" ")}`);
  delete options.model;
  if (name === "ratio" && options.primeLimit === undefined) options.primeLimit = systemPrimeLimit(system);
  if (name !== "fux12" && options.period === undefined) options.period = period;
  return MODELS[name](options);
}

exports.DEFAULT_PARTIALS = DEFAULT_PARTIALS;
exports.CLASSES = CLASSES;
exports.fold = fold;
exports.fux12 = fux12;
exports.ratio = ratio;
exports.roughness = roughness;
exports.table = table;
exports.roughnessOf = roughnessOf;
exports.curve = curve;
exports.dissonance = dissonance;
exports.fromSpec = fromSpec;
exports.names = () => Object.keys(MODELS);
