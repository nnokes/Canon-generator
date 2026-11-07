"use strict";
// The generator (M4 part B; PLAN.md 3.5): a canon is counterpoint against
// itself. It searches for a dux, one note at a time, for which the whole canon
// passes its rules, as the treatises write one: a segment of the dux, its copy
// in the follower, the next segment against that copy, and so on, backtracking
// when a rule breaks (Schottstaedt's shape of search: hard rules prune, soft
// ones order). The checks are cg-constraints': each runs the analyzer's own
// rules as soon as the notes it needs have pitches, and every finished canon
// is analyzed whole.
//
//   search(options) is a generator: it yields { phase, nodes, depth, best } after each
//   note it tries (about a millisecond each) and returns the result, so a [v8]
//   wrapper can run it in time slices.
//   generate(options) runs it to the end.
//   strict(settings) turns musical settings (a final, a length, followers at
//   intervals and delays in bars) into options for a first-species canon (M4
//   part C).
//   round(settings) does the same for a round at the unison, written by the
//   block method (M4 part E).
//
// options: everything cg-constraints.model takes (spec, degrees, profile,
// consonance, final), plus:
//   seed      the jitter that orders equal candidates (default 1): the same seed
//             gives the same canon
//   budget    the most candidate notes tried (default 100000)
//   beam      0 (default): depth-first with backtracking; B: keep the best B
//             partial duxes at each note instead
//   fixed     { index: degree }: notes that keep that degree (a cantus firmus,
//             the dux's first note on the final, notes you lock)
//   order     "auto" (default): left to right, or outside-in when a voice runs
//             backwards (R, RI), so crab and table canons are checked early;
//             "left" or "outside-in" to choose; "block" for a round (M4 part E):
//             column by column, bar c of every section, with `section` (notes per
//             section) and `columns`: "close" (round()'s default: the cadence's two
//             columns, then the first, then the rest), "left", or "ends" (0, S-1,
//             1, S-2, ...)
//   jitter    how much the seed reorders candidates, in cost units (default 0.5)
//   prefer    (dux) -> extra soft cost for a partial dux (the edits toggle's
//             closeness to your melody, M4 part F); default none
//
// Result: { found, dux, spec, report, nodes, complete, diagnostics, seed }
//   found        a canon with no hard fault
//   dux          its degrees (or the best complete one with faults, or null)
//   report       the whole canon's analysis (hard, cost, violations)
//   complete     false if the budget stopped the search first
//   diagnostics  { rejected: { rule: n }, blocking: rule or null, deepest }
//                rejected: how often each rule forced a candidate out;
//                blocking: the rule that stopped the deepest note the search
//                reached (when no canon was found)

const constraints = require("cg-constraints");
const rng = require("cg-rng");

const DEFAULTS = { seed: 1, budget: 100000, beam: 0, order: "auto", jitter: 0.5 };

// The ends first: a, z, b, y, ...
function outsideIn(list) {
  const out = [];
  for (let a = 0, b = list.length - 1; a <= b; a++, b--) {
    out.push(list[a]);
    if (a !== b) out.push(list[b]);
  }
  return out;
}

// The order to give the dux's notes pitches. "block" (Albrechtsberger's first
// draft, Mann p. 232): a round's sections sound together once every voice is
// in, so it is written as one k-part block, column by column: bar c of each
// section, then bar c + 1 (`columns`: "close", "left" or "ends").
function orderOf(variables, how, section, columns = "left") {
  if (how === "left") return variables.slice();
  if (how !== "block") return outsideIn(variables);
  const size = section || variables.length;
  const sections = Math.ceil(variables.length / size);
  const cols = Array.from({ length: size }, (_, c) => c);
  // "close": the cadence first (the last bar, the next-to-last), then the first
  // bar (the join into it), then the rest left to right.
  const close = size > 2 ? [size - 1, size - 2, ...cols.slice(0, size - 2)] : cols.slice().reverse();
  const sequence = columns === "ends" ? outsideIn(cols) : columns === "close" ? close : cols;
  const out = [];
  for (const c of sequence) {
    for (let k = 0; k < sections; k++) if (variables.includes(k * size + c)) out.push(k * size + c);
  }
  return out;
}

function* search(input) {
  const options = { ...DEFAULTS };
  for (const [k, v] of Object.entries(input)) if (v !== undefined) options[k] = v; // unset: the default
  const m = constraints.model(options);
  const backwards = (options.spec.voices || []).some((v) => v.transform === "R" || v.transform === "RI");
  const how = options.order === "auto" ? (backwards ? "outside-in" : "left") : options.order;
  const order = orderOf(m.variables, how, options.section, options.columns);
  const position = new Map(order.map((v, p) => [v, p]));
  // The checks that become ready at each step: all their notes assigned by then.
  // Those of one slice that become ready at the same step run as one analysis.
  const pending = order.map(() => new Map());
  for (const c of m.checks) {
    const step = Math.max(...c.indices.map((i) => position.get(i)));
    const key = `${c.slice}:${c.kind}`;
    if (!pending[step].has(key)) pending[step].set(key, []);
    pending[step].get(key).push(c);
  }
  // A check that reads the same notes the same way as another at the same step
  // (a round's block, repeated) runs once.
  const ready = pending.map((groups) => {
    const seen = new Set();
    return [...groups.values()].map((group) => m.merge(group)).filter((c) => {
      const key = m.signature(c);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  });
  const fixed = options.fixed || {};
  const random = rng.create(options.seed);
  const rejected = {};
  const deepestRules = {};
  let deepest = -1;
  let nodes = 0;
  let best = null; // the best complete dux: fewest hard faults, then cost
  const dux = new Array(options.spec.dux.notes.length);

  const reject = (p, violations) => {
    const rules = [...new Set(violations.filter((v) => v.hard).map((v) => v.rule))];
    for (const rule of rules) rejected[rule] = (rejected[rule] || 0) + 1;
    if (p > deepest) {
      deepest = p;
      for (const k of Object.keys(deepestRules)) delete deepestRules[k];
    }
    if (p === deepest) for (const rule of rules) deepestRules[rule] = (deepestRules[rule] || 0) + 1;
  };

  // Each candidate for step p, with the soft cost of the checks it completes;
  // those that break a hard rule are left out.
  function candidates(p) {
    const v = order[p];
    const degrees = fixed[v] !== undefined ? [fixed[v]] : m.degrees;
    const out = [];
    for (const d of degrees) {
      nodes++;
      dux[v] = d;
      const violations = ready[p].flatMap((c) => m.check(c, dux));
      if (violations.some((x) => x.hard)) {
        reject(p, violations);
        continue;
      }
      const soft = violations.reduce((sum, x) => sum + (x.hard ? 0 : x.cost), 0);
      const extra = options.prefer ? options.prefer(dux) : 0;
      out.push({ degree: d, cost: soft + extra, order: soft + extra + options.jitter * random.next() });
    }
    dux[v] = undefined;
    return out.sort((a, b) => a.order - b.order);
  }

  function finish(degrees) {
    const report = m.full(degrees);
    if (report.hard > 0) reject(order.length, report.violations);
    if (!best || report.hard < best.report.hard || (report.hard === best.report.hard && report.cost < best.report.cost)) {
      best = { dux: degrees.slice(), report };
    }
    return report.hard === 0;
  }

  const progress = (depth) => ({ phase: "searching", nodes, depth, best: best ? best.report.hard : null });
  let found = false;
  let complete = true;

  if (options.beam > 0) {
    // Beam: the best B partial duxes, one note further each round.
    let beam = [{ dux: new Array(dux.length), cost: 0 }];
    for (let p = 0; p < order.length && beam.length; p++) {
      const next = [];
      for (const partial of beam) {
        if (nodes >= options.budget) { complete = false; break; }
        for (let i = 0; i < dux.length; i++) dux[i] = partial.dux[i];
        for (const c of candidates(p)) {
          const d = partial.dux.slice();
          d[order[p]] = c.degree;
          next.push({ dux: d, cost: partial.cost + c.cost, order: partial.cost + c.order });
        }
      }
      beam = next.sort((a, b) => a.order - b.order).slice(0, options.beam);
      yield progress(p + 1);
      if (!complete) break;
    }
    for (const partial of complete ? beam : []) {
      if (finish(partial.dux)) { found = true; break; }
    }
  } else {
    // Depth-first with backtracking: a stack of each step's remaining candidates.
    const stack = [candidates(0)];
    while (stack.length) {
      if (nodes >= options.budget) { complete = false; break; }
      const p = stack.length - 1;
      const choices = stack[p];
      if (!choices.length) {
        stack.pop();
        dux[order[p]] = undefined;
        continue;
      }
      const choice = choices.shift();
      dux[order[p]] = choice.degree;
      if (p + 1 === order.length) {
        if (finish(dux)) { found = true; break; }
        continue;
      }
      stack.push(candidates(p + 1));
      // Each step tries every degree (about a millisecond), so it yields after
      // each one: a [v8] time slice of a few ms is honoured.
      yield progress(p + 1);
    }
  }

  const blocking = found ? null
    : Object.entries(deepestRules).sort((a, b) => b[1] - a[1]).map(([rule]) => rule)[0] || null;
  const result = best;
  return {
    found,
    dux: result ? result.dux : null,
    spec: result ? m.spec(result.dux) : null,
    report: result ? result.report : null,
    nodes,
    complete,
    seed: options.seed,
    diagnostics: { rejected, blocking, deepest },
  };
}

// ---------------------------------------------------------------- strict canons

const MAJOR = { type: "edo", divisions: 12, mode: [0, 2, 4, 5, 7, 9, 11], ref: { step: 0, midi: 60 } };

// Taste (ours, after Schottstaedt's penalties; not one of Fux's rules, and not
// part of the analysis): a soft cost that orders the search's candidates toward
// a singable line. Leaps cost by their size (a third a little, a fourth or fifth
// more, beyond that most), a repeat costs, a return to a note just left costs,
// and rocking between two notes (a b a) costs most.
function melodicTaste(dux) {
  let cost = 0;
  const seen = [];
  for (const d of dux) {
    if (d === undefined) {
      seen.length = 0;
      continue;
    }
    const b = seen[seen.length - 1];
    const a = seen[seen.length - 2];
    if (b !== undefined) {
      const k = Math.abs(d - b);
      if (k === 0) cost += 0.4;
      else if (k === 2) cost += 0.1;
      else if (k === 3 || k === 4) cost += 0.4;
      else if (k > 4) cost += 0.9;
    }
    if (a !== undefined && d === a && d !== b) cost += 1;
    if (seen.slice(-4, -2).includes(d)) cost += 0.3;
    seen.push(d);
  }
  return cost;
}

// A first-species canon (Fux, first species, pp. 27-33): one note per bar, in
// a mode; each follower at its interval (scale steps) and delay (bars), closed
// by a first-species cadence on the final.
//   settings: system (C major), meter (4/4), final (degree 0), length (12 notes),
//     range ([final - 3, final + 9], degrees), followers ([{ interval: 7, delay: 1,
//     transform }]), close ("6|8" or "3|1"), profile (fux-strict; fux-relaxed for
//     more than one follower), taste (true), tempo, and the search's seed, budget,
//     beam and fixed
function strict(settings = {}) {
  const system = settings.system || MAJOR;
  const meter = settings.meter || { beats: 4, strong: [0] };
  const final = settings.final === undefined ? 0 : settings.final;
  const length = settings.length === undefined ? 12 : settings.length;
  const followers = settings.followers || [{ interval: 7, delay: 1 }];
  const bar = meter.beats;
  return {
    spec: {
      name: settings.name || "generated canon",
      system, meter, tempo: settings.tempo,
      dux: { source: "list", notes: Array.from({ length }, () => ({ dur: bar })) },
      voices: [{}, ...followers.map((f) => ({
        delay: f.delay * bar, interval: { steps: f.interval }, transform: f.transform || "P",
      }))],
      ending: { kind: "free-cadence", formula: settings.close || "6|8", final, dur: bar },
    },
    degrees: settings.range || [final - 3, final + 9],
    profile: settings.profile || (followers.length > 1 ? "fux-relaxed" : "fux-strict"),
    final,
    prefer: settings.taste === false ? undefined : melodicTaste,
    seed: settings.seed,
    budget: settings.budget,
    beam: settings.beam,
    fixed: settings.fixed,
  };
}

// A round (M4 part E; Albrechtsberger's first draft, Mann pp. 232-237): `voices`
// equal voices at the unison, each a section (`section` bars) after the last,
// singing one tune of voices x section notes, first species. Once every voice
// is in, the sections sound together, so the tune is written as one k-part
// block, column by column (order "block"). Every voice goes twice through and
// the round is cut at the leader's end, a section end, as the finder judges
// perpetual canons: the rendering holds the voices piling up ("the first two
// or three voices in themselves should form a perfect two- or three-part
// setting", p. 237), every join between sections, the join from the last
// section back to the first, and ends on the block's last chord. A placement
// that would make a 6/4 while the voices pile up (p. 237) is a fourth over the
// sounding bass, a dissonance, so the sections' order is chosen with the notes.
// Ficta: where the mode needs it, the leading note rising to the final at a
// section's end is raised in the tune (C sharp in D dorian).
//   settings: system, meter, final, voices (3), section (2 bars), range, profile
//     (fux-relaxed for 3+ voices), ficta (true), columns, taste, tempo, and the
//     search's seed, budget, beam and fixed
function round(settings = {}) {
  const system = settings.system || MAJOR;
  const meter = settings.meter || { beats: 4, strong: [0] };
  const final = settings.final === undefined ? 0 : settings.final;
  const voices = settings.voices === undefined ? 3 : settings.voices;
  const section = settings.section === undefined ? 2 : settings.section;
  if (!Number.isInteger(voices) || voices < 2) throw new Error(`a round needs 2 or more voices, got ${voices}`);
  if (!Number.isInteger(section) || section < 1) throw new Error(`a round's section is a whole number of bars from 1, got ${section}`);
  const bar = meter.beats;
  const ficta = settings.ficta === false || section < 2 ? []
    : Array.from({ length: voices }, (_, k) => k * section + section - 2);
  return {
    spec: {
      name: settings.name || "generated round",
      system, meter, tempo: settings.tempo,
      dux: { source: "list", notes: Array.from({ length: voices * section }, () => ({ dur: bar })) },
      voices: Array.from({ length: voices }, (_, k) => ({ delay: k * section * bar, interval: { steps: 0 }, loop: 2 })),
      ending: { kind: "loop", passes: 2 },
    },
    degrees: settings.range || [final - 3, final + 9],
    profile: settings.profile || (voices > 2 ? "fux-relaxed" : "fux-strict"),
    final,
    ficta,
    order: settings.order || "block",
    section,
    columns: settings.columns || "close",
    prefer: settings.taste === false ? undefined : melodicTaste,
    seed: settings.seed,
    budget: settings.budget,
    beam: settings.beam,
    fixed: settings.fixed,
  };
}

function generate(options) {
  const it = search(options);
  for (;;) {
    const step = it.next();
    if (step.done) return step.value;
  }
}

exports.search = search;
exports.generate = generate;
exports.orderOf = orderOf;
exports.strict = strict;
exports.round = round;
exports.melodicTaste = melodicTaste;
