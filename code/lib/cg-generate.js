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
//   search(options) is a generator: it yields { phase, nodes, depth, best } as it
//   goes and returns the result, so a [v8] wrapper can run it in time slices.
//   generate(options) runs it to the end.
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
//             "left" or "outside-in" to choose
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

// The order to give the dux's notes pitches.
function orderOf(variables, how) {
  if (how === "left") return variables.slice();
  const out = [];
  for (let a = 0, b = variables.length - 1; a <= b; a++, b--) {
    out.push(variables[a]);
    if (a !== b) out.push(variables[b]);
  }
  return out;
}

function* search(input) {
  const options = { ...DEFAULTS, ...input };
  const m = constraints.model(options);
  const backwards = (options.spec.voices || []).some((v) => v.transform === "R" || v.transform === "RI");
  const how = options.order === "auto" ? (backwards ? "outside-in" : "left") : options.order;
  const order = orderOf(m.variables, how);
  const position = new Map(order.map((v, p) => [v, p]));
  // The checks that become ready at each step: all their notes assigned by then.
  const ready = order.map(() => []);
  for (const c of m.checks) ready[Math.max(...c.indices.map((i) => position.get(i)))].push(c);
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
    let sinceYield = 0;
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
      if (++sinceYield >= 64) {
        sinceYield = 0;
        yield progress(p + 1);
      }
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
