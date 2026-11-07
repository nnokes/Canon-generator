"use strict";
// The answer finder (PLAN.md 3.6; Albrechtsberger's hidden answers, Mann p. 230,
// and riddle canons, pp. 255-261). Given a dux, it tries every follower setting
// in the ranges, renders each canon and analyzes it, and ranks the settings. It
// needs no generation, only rendering plus analysis.
//
//   one follower   every setting: interval (degree or absolute), delay,
//                  transform, time scale. Ranked by hard violations, then cost.
//   N voices       a set of followers in which every pair works:
//                    1. each follower against the dux (the one-follower pass)
//                    2. each pair of passing followers against each other,
//                       rendered without the dux: they relate through the
//                       transformed melody, not the dux (a degree shift can
//                       change a fifth's size; strong beats move)
//                    3. sets in which no pair breaks a hard rule (a clique
//                       search)
//                    4. each set analyzed whole, against the sounding bass:
//                       6/4s only show with every voice present
//                  Steps 1-2 judge fourths as between upper voices: in the full
//                  texture another voice may sound below them.
//
// search(options) is a generator: it yields { phase, done, total, best } as it
// goes, and returns the results, so a [v8] wrapper can run it in time slices
// (M3 part E). find(options) runs it to the end.
//
// options:
//   dux         { source, notes } (cg-canon) -- the melody
//   system      a cg-scales spec (the dux's scale system)
//   meter       { beats, strong }
//   consonance  a cg-consonance spec
//   profile     a rule profile (default "canon")
//   voices      2 (one follower) or more
//   ranges      { intervals: [steps...], cents: [cents...], delays: [beats...],
//                 transforms: ["P", ...], timeScales: [1, ...] }
//   perpetual   loop every voice `passes` times (default 2) and cut at the
//               leader's end, so a perpetual canon is judged in its steady state
//   distinctDelays  N voices: followers enter one after another (default true)
//   budget      the most renders + analyses (default 20000)
//   keep        how many results to return (default 50)
//   allowEdits  (M4 part F) also repair the near-misses: the fewest changes to
//               your melody that make each pass (cg-generate's repair). Off by
//               default: then your melody is never changed.
//   maxEdits    the most notes a repair may change (default: the larger of 3
//               and 8% of the melody's notes)
//   repairs     how many near-misses to repair (default 10): with 2 voices the
//               followers with the fewest faults; with more, the sets judged
//               whole that have faults, and near sets (below)
//   repairBudget  candidate notes per repair limit (default 20000)
//
// With edits on, repairs that pass come after the clean results, fewest edits
// first: { ...result, repaired: true, edits, dux (your melody, edited) }.
// specFor gives such a result's spec with the edited melody.

const tuning = require("cg-tuning");
const scales = require("cg-scales");
const canon = require("cg-canon");
const analyze = require("cg-analyze");
const generate = require("cg-generate");

const DEFAULTS = {
  profile: "canon", voices: 2, budget: 20000, keep: 50, passes: 2, distinctDelays: true,
  allowEdits: false, repairs: 10, repairBudget: 20000,
};
// Near sets (edits on, 3+ voices): sets built from the followers with the
// fewest faults alone, whether or not they pass, ranked by their own and their
// pairs' faults; the best are judged whole. (M4 part F: on your clip at x1 no
// two of the 3 fitting pairs share a follower, so no set nearly fits from clean
// followers only.)
const NEAR_FOLLOWERS = 20;
const NEAR_SETS = 100;

function range(from, to, step = 1) {
  const out = [];
  for (let x = from; x <= to + 1e-9; x += step) out.push(Math.round(x * 1e6) / 1e6);
  return out;
}

// The settings to try: one follower voice spec each, with a label.
function settings(ranges = {}) {
  const intervals = (ranges.intervals || range(-9, 9)).map((steps) => ({ domain: "degree", steps }));
  const cents = (ranges.cents || []).map((c) => ({ domain: "absolute", cents: c }));
  const delays = ranges.delays || range(1, 8);
  const transforms = ranges.transforms || ["P"];
  const timeScales = ranges.timeScales || [1];
  const out = [];
  for (const transform of transforms) {
    for (const timeScale of timeScales) {
      for (const delay of delays) {
        for (const iv of [...intervals, ...cents]) {
          out.push({ interval: iv, delay, transform, timeScale });
        }
      }
    }
  }
  return out;
}

function voiceSpec(s) {
  return {
    delay: s.delay,
    interval: s.interval.domain === "degree" ? { steps: s.interval.steps } : { cents: s.interval.cents },
    transform: s.transform,
    timeScale: s.timeScale,
  };
}

// "+2nd" style names for degree intervals in a 7-note mode; steps or cents otherwise.
function intervalName(iv, size) {
  if (iv.domain === "absolute") return `${iv.cents >= 0 ? "+" : ""}${iv.cents}c`;
  if (size !== 7) return `${iv.steps >= 0 ? "+" : ""}${iv.steps} steps`;
  if (iv.steps === 0) return "unison";
  const n = Math.abs(iv.steps) + 1;
  const suffix = n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th";
  return `${iv.steps > 0 ? "upper" : "lower"} ${n === 8 ? "octave" : n + suffix}`;
}

function label(s, size) {
  const parts = [intervalName(s.interval, size), `after ${s.delay}`];
  if (s.transform !== "P") parts.push(s.transform);
  if (s.timeScale !== 1) parts.push(`x${s.timeScale}`);
  return parts.join(", ");
}

// Answer distortion (ours): how far a degree answer strays from the exact
// (absolute) answer of the same size, measured at the dux's first note. Mean and
// largest, in cents. 0 for an absolute answer.
function distortion(s, material, system) {
  if (s.interval.domain !== "degree") return { mean: 0, max: 0 };
  const notes = material.filter((n) => !n.rest);
  if (!notes.length) return { mean: 0, max: 0 };
  const first = notes[0];
  const nominal = tuning.degreeCents(system, first.degree + s.interval.steps) - tuning.degreeCents(system, first.degree);
  const gaps = notes.map((n) => Math.abs(
    tuning.degreeCents(system, n.degree + s.interval.steps) - tuning.degreeCents(system, n.degree) - nominal));
  return { mean: gaps.reduce((a, b) => a + b, 0) / gaps.length, max: Math.max(...gaps) };
}

// The interval's inversion at the period (Mann pp. 231-232: a canon at the 2nd
// read as one at the 7th or 9th): degree k inverts to size - k.
function inversion(s, size) {
  if (s.interval.domain !== "degree") return null;
  const k = ((s.interval.steps % size) + size) % size;
  return k === 0 ? 0 : size - k;
}

function compare(a, b) {
  return a.hard - b.hard || a.cost - b.cost || a.order - b.order;
}

function* search(input) {
  const options = { ...DEFAULTS, ...input };
  const system = scales.fromSpec(options.system);
  const size = tuning.size(system);
  const material = canon.duxMaterial(options.dux, system);
  const base = { system: options.system, meter: options.meter, dux: options.dux };
  const analyzeOptions = { system, meter: options.meter, consonance: options.consonance, profile: options.profile };
  const loop = options.perpetual ? { loop: options.passes } : {};
  const ending = options.perpetual ? { kind: "loop", passes: options.passes } : "none";
  let used = 0;
  const budgetLeft = () => used < options.budget;

  // Part of a larger texture (N voices) is screened with fourths free: another
  // voice may sound below it. The whole set is then judged against its real bass.
  const partial = options.voices > 2;
  function judge(voices, whole = !partial) {
    used++;
    const rendered = canon.render({ ...base, voices: voices.map((v) => ({ ...v, ...loop })), ending });
    return analyze.analyze(rendered, { ...analyzeOptions, fourthsFree: !whole });
  }
  const summary = (report) => ({
    hard: report.hard,
    cost: report.cost,
    violations: report.violations.map((v) => ({ rule: v.rule, bar: v.bar, beat: v.beat, voices: v.voices, hard: v.hard })),
  });

  // Edits on (M4 part F): repair each near-miss, fewest changes first; those that
  // pass join the results after the clean ones, fewest edits first, then cost.
  function* repairAll(value, pool) {
    const repaired = [];
    const melody = material.map((n) => (n.rest ? { dur: n.dur, rest: true } : { dur: n.dur, degree: n.degree, offset: n.offset }));
    for (let i = 0; i < pool.length; i++) {
      const r = pool[i];
      const spec = canonSpec(options, r.followers, { source: "list", notes: melody });
      const result = yield* generate.repair({
        spec, original: material, profile: options.profile, consonance: options.consonance,
        max: options.maxEdits, budget: options.repairBudget,
      });
      if (result.found && result.edits.length > 0) {
        const { followers, ...rest } = r;
        repaired.push({
          ...rest, repaired: true, edits: result.edits, editsAllowed: result.max,
          dux: result.spec.dux, ...summary(result.report),
        });
      }
      yield { phase: "repairs", done: i + 1, total: pool.length, best: null };
    }
    repaired.sort((a, b) => a.edits.length - b.edits.length || a.cost - b.cost);
    const clean = value.results.filter((r) => r.hard === 0);
    const rest = value.results.filter((r) => r.hard > 0);
    value.results = [...clean, ...repaired, ...rest].slice(0, options.keep + repaired.length);
    value.repairs = { tried: pool.length, found: repaired.length, max: generate.maxEdits(material.filter((n) => !n.rest).length) };
    if (options.maxEdits !== undefined) value.repairs.max = options.maxEdits;
  }

  // 1. Each follower against the dux.
  const all = settings(options.ranges);
  const singles = [];
  for (let i = 0; i < all.length && budgetLeft(); i++) {
    const s = all[i];
    const report = judge([{}, voiceSpec(s)]);
    singles.push({
      setting: s, label: label(s, size), order: i, ...summary(report),
      distortion: distortion(s, material, system), inversion: inversion(s, size),
    });
    if (i % 16 === 15) yield { phase: "pairs with the dux", done: i + 1, total: all.length, best: singles.slice().sort(compare)[0] };
  }
  singles.sort(compare);
  if (options.voices <= 2) {
    const value = { voices: 2, results: singles.slice(0, options.keep), tried: singles.length, used, complete: singles.length === all.length };
    if (options.allowEdits) {
      const faulty = singles.filter((r) => r.hard > 0).slice(0, options.repairs)
        .map((r) => ({ ...r, followers: [r.setting] }));
      yield* repairAll(value, faulty);
    }
    return value;
  }

  // 2. Pairs of passing followers, against each other.
  const passing = singles.filter((r) => r.hard === 0);
  const ok = new Map();
  const pairsTotal = (passing.length * (passing.length - 1)) / 2;
  let pairsDone = 0;
  for (let i = 0; i < passing.length && budgetLeft(); i++) {
    for (let j = i + 1; j < passing.length && budgetLeft(); j++) {
      const a = passing[i].setting;
      const b = passing[j].setting;
      let fine = !(options.distinctDelays && Math.abs(a.delay - b.delay) < 1e-9);
      if (fine) fine = judge([voiceSpec(a), voiceSpec(b)]).hard === 0;
      ok.set(`${i},${j}`, fine);
      pairsDone++;
      if (pairsDone % 32 === 0) yield { phase: "pairs of followers", done: pairsDone, total: pairsTotal, best: null };
    }
  }

  // 3. Sets of (voices - 1) followers in which every pair is fine.
  const k = options.voices - 1;
  const cliques = [];
  const fineWith = (i, j) => ok.get(i < j ? `${i},${j}` : `${j},${i}`) === true;
  (function extend(chosen, from) {
    if (chosen.length === k) { cliques.push(chosen.slice()); return; }
    for (let x = from; x < passing.length && cliques.length < options.budget; x++) {
      if (chosen.every((c) => fineWith(c, x))) {
        chosen.push(x);
        extend(chosen, x + 1);
        chosen.pop();
      }
    }
  })([], 0);

  // 4. Each set, whole.
  const sets = [];
  for (let c = 0; c < cliques.length && budgetLeft(); c++) {
    const members = cliques[c].map((i) => passing[i]).sort((a, b) => a.setting.delay - b.setting.delay);
    const report = judge([{}, ...members.map((m) => voiceSpec(m.setting))], true);
    sets.push({
      settings: members.map((m) => m.setting),
      labels: members.map((m) => m.label),
      label: members.map((m) => m.label).join(" + "),
      order: c, ...summary(report),
    });
    if (c % 8 === 7) yield { phase: "whole sets", done: c + 1, total: cliques.length, best: sets.slice().sort(compare)[0] };
  }
  sets.sort(compare);
  const value = {
    voices: options.voices, results: sets.slice(0, options.keep), followers: singles.slice(0, options.keep),
    tried: sets.length, used, complete: budgetLeft(),
    followersTried: singles.length, passingFollowers: passing.length,
    pairsOk: [...ok.values()].filter(Boolean).length,
  };
  if (options.allowEdits) {
    const faulty = sets.filter((r) => r.hard > 0);
    const near = yield* nearSets(k, new Set(sets.map((r) => r.label)));
    const pool = [...faulty, ...near].sort(compare).slice(0, options.repairs)
      .map((r) => ({ ...r, followers: r.settings }));
    yield* repairAll(value, pool);
  }
  return value;

  // Sets of k followers from those with the fewest faults alone, ranked by their
  // own and their pairs' faults; the best judged whole (those with faults).
  function* nearSets(size, known) {
    const top = singles.slice(0, NEAR_FOLLOWERS);
    const pairFaults = new Map();
    let done = 0;
    for (let i = 0; i < top.length && budgetLeft(); i++) {
      for (let j = i + 1; j < top.length && budgetLeft(); j++) {
        const a = top[i].setting;
        const b = top[j].setting;
        const clash = options.distinctDelays && Math.abs(a.delay - b.delay) < 1e-9;
        pairFaults.set(`${i},${j}`, clash ? Infinity : judge([voiceSpec(a), voiceSpec(b)]).hard);
        if (++done % 32 === 0) yield { phase: "near sets: pairs", done, total: (top.length * (top.length - 1)) / 2, best: null };
      }
    }
    const ranked = [];
    (function extend(chosen, from) {
      if (chosen.length === size) {
        let faults = chosen.reduce((sum, x) => sum + top[x].hard, 0);
        for (let a = 0; a < chosen.length; a++) for (let b = a + 1; b < chosen.length; b++) faults += pairFaults.get(`${chosen[a]},${chosen[b]}`);
        if (Number.isFinite(faults)) ranked.push({ chosen: chosen.slice(), faults });
        return;
      }
      for (let x = from; x < top.length; x++) {
        chosen.push(x);
        extend(chosen, x + 1);
        chosen.pop();
      }
    })([], 0);
    ranked.sort((a, b) => a.faults - b.faults);
    const out = [];
    for (let c = 0; c < ranked.length && out.length < NEAR_SETS && budgetLeft(); c++) {
      const members = ranked[c].chosen.map((i) => top[i]).sort((a, b) => a.setting.delay - b.setting.delay);
      const labelText = members.map((m) => m.label).join(" + ");
      if (known.has(labelText)) continue;
      const report = judge([{}, ...members.map((m) => voiceSpec(m.setting))], true);
      out.push({
        settings: members.map((m) => m.setting), labels: members.map((m) => m.label), label: labelText,
        order: sets.length + c, near: true, ...summary(report),
      });
      if (out.length % 8 === 0) yield { phase: "near sets: whole", done: out.length, total: NEAR_SETS, best: null };
    }
    return out.filter((r) => r.hard > 0);
  }
}

// The canon for a set of followers (and a melody), as the finder renders it.
function canonSpec(options, followers, dux) {
  const perpetual = options.perpetual;
  const passes = options.passes || DEFAULTS.passes;
  return {
    system: options.system, meter: options.meter, tempo: options.tempo, consonance: options.consonance, dux,
    voices: [{}, ...followers.map(voiceSpec)].map((v) => (perpetual ? { ...v, loop: passes } : v)),
    ending: perpetual ? { kind: "loop", passes } : "none",
  };
}

function find(options) {
  const it = search(options);
  for (;;) {
    const step = it.next();
    if (step.done) return step.value;
  }
}

// The canon spec for a result, ready to render or play: a repaired one with
// your melody, edited.
function specFor(options, result) {
  const followers = result.settings || [result.setting];
  const spec = canonSpec(options, followers, result.repaired ? result.dux : options.dux);
  const { consonance, ...rest } = spec;
  const name = result.repaired ? `found: ${result.label} (${result.edits.length} ${result.edits.length === 1 ? "edit" : "edits"})` : `found: ${result.label}`;
  return { name, ...rest };
}

exports.search = search;
exports.find = find;
exports.settings = settings;
exports.specFor = specFor;
exports.label = label;
exports.intervalName = intervalName;
exports.range = range;
