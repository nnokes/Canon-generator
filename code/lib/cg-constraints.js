"use strict";
// The generator's constraint model (M4 part A; PLAN.md 3.5). The search writes
// a dux one note at a time; this says which rules can be checked once a given
// set of dux notes has pitches, and checks them with the analyzer's own rules,
// so generating and analyzing can't disagree (Anton: one rule set to compose
// and to diagnose).
//
// Rhythm fixed, pitches variable: a canon's rhythm doesn't depend on its
// pitches, so the canon is rendered once (the skeleton): every event, the dux
// note it plays (index) and its time. Each event's pitch, for each pitch its
// dux note could take, comes from a table rendered once per candidate degree.
//
// Checks, one or two per slice (an onset) before the ending:
//   now    the slice and the motion into it, the melodic rules on the notes
//          that start there, and the begin rules: a window of the slices just
//          before it (BACK of them) and each voice's last BACK notes
//   next   the rules that need the following slice (a dissonance's resolution;
//          the penultimate, at the slice before the last): the same window plus
//          the next slice and each voice's next note
// Each counts only the violations the analyzer reports at that slice, so every
// violation of the whole canon is counted once. A check is ready as soon as
// every dux note in its window has a pitch. The analyzer is told the whole
// canon's edges, so the begin and end rules judge the canon, not the window
// (mode-final needs options.final for that; without it, it waits for the whole
// canon). The ending's slices (a cadence built on the last notes) and the
// roughness ceiling's window means are judged once the dux is complete, on the
// whole canon (full()).
//
//   model(options) -> {
//     variables   the dux notes to give pitches (indices of non-rests)
//     degrees     the candidate degrees, low to high
//     checks      [{ slice, t, kind: "now"|"next", indices, profile }]
//     check(c, dux) -> violations at the check's slice (dux: degree per note,
//                      undefined where unassigned)
//     spec(dux)   the canon spec with these degrees
//     full(dux)   the whole canon analyzed (cg-analyze's report)
//   }
//   options:
//     spec        a canon spec (cg-canon) whose dux gives the rhythm: notes
//                 { dur } or { dur, rest: true } (any degrees are ignored)
//     degrees     [low, high]: the dux's range, in scale degrees
//     profile     the rule profile (cg-rules)
//     consonance  a cg-consonance spec (the spec's own by default)
//     final       the mode's final, as a degree of the dux's system

const canon = require("cg-canon");
const analyze = require("cg-analyze");
const rules = require("cg-rules");
const scales = require("cg-scales");
const consonance = require("cg-consonance");
const tuning = require("cg-tuning");
const time = require("cg-time");

// Rules that read the next slice: a dissonance's resolution; the penultimate
// (reported at the slice before the last, judged with the last).
const LOOKAHEAD = ["dissonance-treatment", "penultimate"];
// Rules judged on the whole canon only: the roughness ceiling's window means.
const AT_END = ["roughness-ceiling"];
const BACK = 4; // slices (and each voice's notes) a check looks back

function check(condition, message) {
  if (!condition) throw new Error(message);
}

const key = (e) => `${e.voice}:${e.index}:${e.pass}:${Math.round(e.t * 1e6)}`;

function model(options) {
  const spec = options.spec;
  check(spec && spec.dux && Array.isArray(spec.dux.notes) && !spec.groups, "the generator needs a single canon spec with a dux of notes");
  const notes = spec.dux.notes.map((n) => (n.rest ? { dur: n.dur, rest: true } : { dur: n.dur }));
  const variables = notes.map((n, i) => (n.rest ? -1 : i)).filter((i) => i >= 0);
  check(variables.length > 0, "the dux needs at least one note");
  const [low, high] = options.degrees;
  check(Number.isInteger(low) && Number.isInteger(high) && low <= high, "degrees: [low, high], whole numbers");
  const degrees = [];
  for (let d = low; d <= high; d++) degrees.push(d);
  const system = scales.fromSpec(spec.system);
  const model_ = consonance.fromSpec(options.consonance !== undefined ? options.consonance : spec.consonance, system);
  const meter = analyze.meterOf(spec.meter);
  const profile = rules.resolve(options.profile);
  const ids = Object.keys(profile.rules);
  const final = options.final !== undefined ? tuning.degreeToPitch(system, options.final) : undefined;
  const atEnd = final === undefined ? [...AT_END, "mode-final"] : AT_END; // mode-final's final: voice 0's last note
  const subProfile = (only) => ({ ...profileSpec(options.profile), only: ids.filter(only) });
  const nowProfile = subProfile((id) => !LOOKAHEAD.includes(id) && !atEnd.includes(id));
  // The next check's rules at a slice: penultimate only before the last slice.
  const nextProfileAt = (s) => subProfile((id) => LOOKAHEAD.includes(id) && !atEnd.includes(id)
    && (id !== "penultimate" || (s + 1 < onsets.length && time.eq(onsets[s + 1], edges.last))));
  const firstVar = variables[0];

  const withDegrees = (dux) => ({
    ...spec,
    dux: { ...spec.dux, source: "list", notes: notes.map((n, i) => (n.rest ? n : { dur: n.dur, degree: dux[i] })) },
  });

  // The skeleton, and each event's pitch for each candidate degree of its note
  // (and of the first note: an inverting voice turns around it).
  const skeleton = canon.render(withDegrees(notes.map(() => low))).events;
  const where = new Map(skeleton.map((e, i) => [key(e), i]));
  check(where.size === skeleton.length, "the skeleton has two events with the same voice, note and time");
  const table = new Map(); // `${first}:${degree}` -> pitch per skeleton event
  const inverts = (spec.voices || []).some((v) => v.transform === "I" || v.transform === "RI");
  for (const first of inverts ? degrees : [null]) {
    for (const d of degrees) {
      const dux = notes.map((n, i) => (i === firstVar && first !== null ? first : d));
      const events = canon.render(withDegrees(dux)).events;
      check(events.length === skeleton.length, "a canon's rhythm changed with its pitches: the generator can't model it");
      const pitches = new Array(skeleton.length);
      for (const e of events) {
        const at = where.get(key(e));
        check(at !== undefined, "a canon's rhythm changed with its pitches: the generator can't model it");
        pitches[at] = e.pitch;
      }
      table.set(`${first}:${d}`, pitches);
    }
  }
  const pitchOf = (i, dux) => {
    const e = skeleton[i];
    const first = inverts ? dux[firstVar] : null;
    return table.get(`${first}:${dux[e.index]}`)[i];
  };

  // Slices: each onset, and the events sounding there.
  const onsets = [];
  for (const e of skeleton) if (!onsets.length || !time.eq(onsets[onsets.length - 1], e.t)) onsets.push(e.t);
  const sounding = onsets.map((t) => skeleton.map((e, i) => i).filter((i) => {
    const e = skeleton[i];
    return time.le(e.t, t) && time.lt(t, e.t + e.dur);
  }));
  const multiple = onsets.map((t, s) => sounding[s].length > 1);
  const edges = { first: onsets[multiple.indexOf(true)], last: onsets[multiple.lastIndexOf(true)] };
  const lines = new Map(); // voice -> its event ids in time order
  skeleton.forEach((e, i) => {
    if (!lines.has(e.voice)) lines.set(e.voice, []);
    lines.get(e.voice).push(i);
  });
  const coda = (i) => skeleton[i].index < 0; // an ending's note, built on the last notes

  function window(s, ahead) {
    const ids_ = new Set();
    for (let k = Math.max(0, s - BACK); k <= s + (ahead ? 1 : 0) && k < onsets.length; k++) for (const i of sounding[k]) ids_.add(i);
    for (const i of sounding[s]) {
      const line = lines.get(skeleton[i].voice);
      const at = line.indexOf(i);
      for (let k = Math.max(0, at - BACK); k <= Math.min(line.length - 1, at + (ahead ? 1 : 0)); k++) ids_.add(line[k]);
    }
    return [...ids_].sort((a, b) => a - b);
  }

  const checks = [];
  onsets.forEach((t, s) => {
    for (const [kind, profile] of [["now", nowProfile], ["next", nextProfileAt(s)]]) {
      if (!profile.only.length) continue;
      const events = window(s, kind === "next");
      if (events.some(coda)) continue; // judged with the whole canon
      const indices = [...new Set(events.map((i) => skeleton[i].index))].sort((a, b) => a - b);
      checks.push({ slice: s, t, kind, events, indices, profile });
    }
  });

  function checkOne(c, dux) {
    const events = c.events.map((i) => ({ ...skeleton[i], pitch: pitchOf(i, dux) }));
    const report = analyze.analyze({ events }, {
      system, meter, consonance: model_, final, edges, metrics: false, profile: c.profile,
    });
    return report.violations.filter((v) => time.eq(v.t, c.t));
  }

  function full(dux) {
    return analyze.analyze(canon.render(withDegrees(dux)), { system, meter, consonance: model_, final, profile: options.profile });
  }

  return {
    variables, degrees, checks, skeleton, onsets, edges,
    check: checkOne,
    full,
    spec: (dux) => withDegrees(dux),
    pitchOf,
  };
}

// A profile as a spec cg-rules accepts with an `only` list.
function profileSpec(profile) {
  if (profile === undefined || profile === null) return { base: "free" };
  return typeof profile === "string" ? { base: profile } : { ...profile };
}

exports.model = model;
exports.LOOKAHEAD = LOOKAHEAD;
exports.AT_END = AT_END;
exports.BACK = BACK;
