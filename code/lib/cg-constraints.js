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
// Checks at each slice (an onset) before the ending, one per kind and per how
// far back their rules read (LOOKBACK; M4 part E):
//   now    the slice and the motion into it, the melodic rules on the notes
//          that start there, and the begin rules: a window of the slices just
//          before it and each voice's notes before, as far back as its rules
//          read (the chord alone, the motion into it, a voice's last notes)
//   next   the rules that need the following slice (a dissonance's resolution;
//          the penultimate, at the slice before the last): the same, plus the
//          next slice and each voice's next note
// The search runs the checks of a slice that become ready at the same step as
// one (merge), and a check that reads the same notes the same way as another
// once (signature: a round's block, repeated, with its voices relabelled).
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
//     checks      [{ slice, t, kind: "now"|"next", back, events, indices, profile }]
//     check(c, dux) -> violations at the check's slice (dux: degree per note,
//                      undefined where unassigned)
//     merge(list) checks of one slice and kind as one
//     signature(c) what a check reads, up to which voice is which
//     spec(dux)   the canon spec with these degrees (and their ficta)
//     full(dux)   the whole canon analyzed (cg-analyze's report)
//   }
//   options:
//     spec        a canon spec (cg-canon) whose dux gives the rhythm: notes
//                 { dur } or { dur, rest: true } (any degrees are ignored)
//     degrees     [low, high]: the dux's range, in scale degrees
//     profile     the rule profile (cg-rules)
//     consonance  a cg-consonance spec (the spec's own by default)
//     final       the mode's final, as a degree of the dux's system
//     ficta       dux notes where the degree below the final is raised to the
//                 leading note (a round's sections' next-to-last notes; M4 part E)
//     original    your melody's notes ({ degree, offset }, M4 part F): a note
//                 left on its original degree keeps its offset, so a chromatic or
//                 bent note sounds exactly as you played it

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
const BACK = 4; // slices (and each voice's notes) a check looks back, for a rule not listed below
// How far back each rule reads, in slices and in each voice's notes (M4 part E):
// a check holds only what its rules read, so a bar's chord is checked as soon as
// its notes are written, even when the notes before it aren't yet (the block
// method writes a round column by column). A rule's result at a slice is the
// same in any window that holds its lookback.
const LOOKBACK = {
  dissonance: 0, "begin-perfect": 0, "end-perfect": 0, "mode-final": 0, "prefer-imperfect": 0, "full-triad": 0, unison: 0,
  penultimate: 0,
  "parallel-perfect": 1, "hidden-perfect": 1, "melodic-leap": 1, "melodic-augmented": 1, "entry-rest": 1,
  "phrase-seventh": 1, "dissonance-treatment": 1,
  repeat: 2, "leap-compensation": 2, "cadence-approach": 2,
};
function lookback(id, params = {}) {
  if (id === "parallel-imperfect-run") return (params.max || 3) + 1; // a run longer than max
  if (id === "hidden-perfect" && params.single === "soft") return 2; // reads the motion before too
  return LOOKBACK[id] !== undefined ? LOOKBACK[id] : BACK;
}

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
  // Musica ficta in the tune (M4 part E, rounds): at these notes (a section's
  // next-to-last), the degree below the final is the leading note, raised to the
  // tuning's own semitone below the final (C sharp in D dorian) where the mode has
  // no semitone next to its final, as the closes do (Fux pp. 28-29): not in
  // ionian or lydian (B-C, E-F already), and not in phrygian, whose F-E is the
  // semitone and which "does not admit of any raising" (p. 81). cadence-approach
  // then has it rise to the final.
  const fictaAt = new Set(options.ficta || []);
  const semitone = canon.semitoneOf(system);
  const size = tuning.size(system);
  function raise(dux, i) {
    const d = dux[i];
    if (!fictaAt.has(i) || semitone === null || options.final === undefined || d === undefined) return 0;
    if ((((d + 1 - options.final) % size) + size) % size !== 0) return 0;
    const below = tuning.degreeCents(system, d + 1) - tuning.degreeCents(system, d);
    const above = tuning.degreeCents(system, d + 2) - tuning.degreeCents(system, d + 1);
    return below > semitone + 10 && above > semitone + 10 ? below - semitone : 0; // cents up
  }
  // A note's cents above its degree: ficta, or your original's offset where the
  // note is unchanged (M4 part F).
  const original = options.original || [];
  function offsetOf(dux, i) {
    const up = raise(dux, i);
    if (up) return up;
    const o = original[i];
    return o && !o.rest && o.offset && dux[i] === o.degree ? o.offset : 0;
  }
  const atEnd = final === undefined ? [...AT_END, "mode-final"] : AT_END; // mode-final's final: voice 0's last note
  const subProfile = (only) => ({ ...profileSpec(options.profile), only: ids.filter(only) });
  const nowRule = (id) => !LOOKAHEAD.includes(id) && !atEnd.includes(id);
  // The next check's rules at a slice: penultimate only before the last slice.
  const nextRuleAt = (s) => (id) => LOOKAHEAD.includes(id) && !atEnd.includes(id)
    && (id !== "penultimate" || (s + 1 < onsets.length && time.eq(onsets[s + 1], edges.last)));
  // The rules of one kind at a slice, grouped by how far back they read.
  const byLookback = (keep) => {
    const groups = new Map();
    for (const id of ids.filter(keep)) {
      const back = lookback(id, profile.rules[id]);
      if (!groups.has(back)) groups.set(back, []);
      groups.get(back).push(id);
    }
    return [...groups].sort((a, b) => a[0] - b[0]);
  };
  const firstVar = variables[0];

  // The spec with these degrees (and the ficta they call for, unless `plain`:
  // the pitch tables are plain, and pitchOf adds the ficta).
  const withDegrees = (dux, plain = false) => ({
    ...spec,
    dux: {
      ...spec.dux,
      source: "list",
      notes: notes.map((n, i) => {
        if (n.rest) return n;
        const up = plain ? 0 : offsetOf(dux, i);
        return up ? { dur: n.dur, degree: dux[i], offset: up } : { dur: n.dur, degree: dux[i] };
      }),
    },
  });

  // The skeleton, and each event's pitch for each candidate degree of its note
  // (and of the first note: an inverting voice turns around it).
  const skeleton = canon.render(withDegrees(notes.map(() => low), true)).events;
  const where = new Map(skeleton.map((e, i) => [key(e), i]));
  check(where.size === skeleton.length, "the skeleton has two events with the same voice, note and time");
  const table = new Map(); // `${first}:${degree}` -> pitch per skeleton event
  const inverts = (spec.voices || []).some((v) => v.transform === "I" || v.transform === "RI");
  check(!(inverts && fictaAt.size), "ficta in the tune: not with an inverting voice (it would lower the note)");
  for (const first of inverts ? degrees : [null]) {
    for (const d of degrees) {
      const dux = notes.map((n, i) => (i === firstVar && first !== null ? first : d));
      const events = canon.render(withDegrees(dux, true)).events;
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
  // An inverting voice mirrors an offset too (cg-transform's invert).
  const mirrored = (spec.voices || []).map((v) => Boolean(v) && (v.transform === "I" || v.transform === "RI"));
  const pitchOf = (i, dux) => {
    const e = skeleton[i];
    const first = inverts ? dux[firstVar] : null;
    const cents = offsetOf(dux, e.index);
    return table.get(`${first}:${dux[e.index]}`)[i] + (mirrored[e.voice] ? -cents : cents) / 100;
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

  // The events a check at slice s reads: `back` slices before it (and each
  // sounding voice's `back` notes before), and the next slice too if `ahead`.
  function window(s, ahead, back) {
    const ids_ = new Set();
    for (let k = Math.max(0, s - back); k <= s + (ahead ? 1 : 0) && k < onsets.length; k++) for (const i of sounding[k]) ids_.add(i);
    for (const i of sounding[s]) {
      const line = lines.get(skeleton[i].voice);
      const at = line.indexOf(i);
      for (let k = Math.max(0, at - back); k <= Math.min(line.length - 1, at + (ahead ? 1 : 0)); k++) ids_.add(line[k]);
    }
    return [...ids_].sort((a, b) => a - b);
  }

  // The dux notes a check needs: those its events play.
  const needed = (events) => [...new Set(events.map((i) => skeleton[i].index))].sort((a, b) => a - b);

  // What a check reads, up to which voice is which: a round's voices sing alike,
  // so its block, repeated, gives the same check again with the voices
  // relabelled. The search runs one of each (the whole canon is still analyzed
  // at the end). Voices count as alike when their specs differ only in delay,
  // name and loop; the edges (where the begin and end rules apply) stay apart.
  const voiceKind = (spec.voices || []).map((v) => {
    const { delay, name, loop, ...rest } = v || {};
    return JSON.stringify(rest);
  });
  function signature(c) {
    // In time order, then by dux note: an order that doesn't depend on which
    // voice sings what; voices are labelled as they first appear in it.
    const events = c.events.map((i) => skeleton[i]).sort((a, b) => a.t - b.t || a.index - b.index || a.voice - b.voice);
    const labels = new Map();
    const reads = events.map((e) => {
      if (!labels.has(e.voice)) labels.set(e.voice, labels.size);
      return [e.index, Math.round((e.t - c.t) * 1e6), Math.round(e.dur * 1e6), labels.get(e.voice), voiceKind[e.voice] || ""].join(",");
    });
    const edge = time.eq(c.t, edges.first) ? "first" : time.eq(c.t, edges.last) ? "last" : "";
    return `${c.kind}|${edge}|${c.profile.only.join(" ")}|${reads.join(";")}`;
  }

  const checks = [];
  onsets.forEach((t, s) => {
    for (const [kind, keep] of [["now", nowRule], ["next", nextRuleAt(s)]]) {
      for (const [back, only] of byLookback(keep)) {
        const events = window(s, kind === "next", back);
        if (events.some(coda)) continue; // judged with the whole canon
        checks.push({ slice: s, t, kind, back, events, indices: needed(events), profile: subProfile((id) => only.includes(id)) });
      }
    }
  });

  // Checks at one slice, of one kind, as one: their rules together, in the
  // widest of their windows (the search runs the checks that become ready at
  // the same step this way, one analysis each).
  function merge(group) {
    if (group.length === 1) return group[0];
    const [first] = group;
    const union = (key) => [...new Set(group.flatMap((c) => c[key]))].sort((a, b) => a - b);
    const only = ids.filter((id) => group.some((c) => c.profile.only.includes(id)));
    return {
      slice: first.slice, t: first.t, kind: first.kind, back: Math.max(...group.map((c) => c.back)),
      events: union("events"), indices: union("indices"), profile: subProfile((id) => only.includes(id)),
    };
  }

  function checkOne(c, dux) {
    const events = c.events.map((i) => {
      const e = skeleton[i];
      const pitch = pitchOf(i, dux);
      const table_ = table.get(`${inverts ? dux[firstVar] : null}:${dux[e.index]}`)[i];
      // A note off its degree keeps the degree it's written on, as the renderer marks it.
      return Math.abs(pitch - table_) > 1e-9 ? { ...e, pitch, degree: tuning.quantize(system, table_).degree } : { ...e, pitch };
    });
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
    merge,
    signature,
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
exports.LOOKBACK = LOOKBACK;
exports.lookback = lookback;
