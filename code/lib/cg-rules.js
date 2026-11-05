"use strict";
// Rule profiles (PLAN.md 3.3). A rule reads the analyzer's slices and motion and
// returns violations; a profile says which rules apply, which are hard (M4's
// search prunes on them) and what the soft ones cost. docs/controls.md lists
// every rule with its source.
//
//   judge(context, profile) -> { profile, violations: [{ rule, hard, cost,
//                                bar, beat, t, voices, detail }] }
//   profile: a name ("fux-strict", "fux-relaxed", "florid", "canon", "spectral", "free"), or
//            { base, rules: { id: { hard, weight, ...params } or false } }
//
// Pitch rules count scale steps of the active scale for melody (step vs leap)
// and cents for consonance (PLAN 3.6): that's how Fux's melodic rules carry over
// to any tuning.

const tuning = require("cg-tuning");
const time = require("cg-time");

// ---------------------------------------------------------------- helpers

const isPerfect = (x) => x.cls === "perfect";
const isImperfect = (x) => x.cls === "imperfect";
// Against the bass a fourth is a dissonance; between upper voices it isn't.
// Consonance is reckoned from the bass, "regardless of what may occur between
// the inner voices" (Fux p. 112, and his note: "this already holds in three part
// writing"): between upper voices the fourth, and the augmented fourth or
// diminished fifth of a 6/3 chord (Fig. 105: G and C sharp over E), are
// consonant. In octave tunings, a tritone is within 45 cents of 600.
const upperFourth = (p, period) => !p.withBass
  && (p.fourth || (period === 1200 && Math.abs(folded(p.cents, 1200) - 600) <= 45));
const consonantPair = (p, period = 1200) => p.cls !== "dissonant" || upperFourth(p, period);

function violation(rule, slice, voices, detail, extra = {}) {
  return { rule, bar: slice.bar, beat: slice.beat, t: slice.t, voices, detail, ...extra };
}

function pairIn(slice, a, b) {
  return slice.pairs.find((p) => (p.low === a && p.high === b) || (p.low === b && p.high === a));
}

function noteOf(slice, voice) {
  return slice.notes.find((n) => n.voice === voice);
}

const multi = (slices) => slices.filter((s) => s.notes.length > 1);

// The canon's first and last slices with two or more voices, and those between.
// A window of a larger canon (the generator's incremental checks, M4) gives
// the canon's own as options.edges { first, last } (times); a slice outside
// the window is null. Otherwise they're the slices' own.
function edges(c) {
  const all = multi(c.slices);
  const e = c.options.edges;
  if (!e) return { first: all[0] || null, last: all[all.length - 1] || null, inner: all.slice(1, -1), all };
  const at = (t) => all.find((s) => time.eq(s.t, t)) || null;
  return { first: at(e.first), last: at(e.last), inner: all.filter((s) => time.lt(e.first, s.t) && time.lt(s.t, e.last)), all };
}

// The bar (from 1) a time falls in.
const barOf = (c, t) => Math.floor(t / c.meter.beats + time.EPS) + 1;

// Whether time t falls on a strong beat of the meter.
function analyzePosition(c, t) {
  const bar = Math.floor(t / c.meter.beats + time.EPS);
  const beat = t - bar * c.meter.beats;
  return { strong: c.meter.strong.some((x) => time.eq(beat, x)) };
}

// The folded class of an interval (cents within the period), for "same interval" tests.
function folded(cents, period) {
  const value = ((Math.abs(cents) % period) + period) % period;
  return period - value < 1 ? 0 : value;
}

// Each voice's notes in order, and where each note sits in its line.
function neighbours(byVoice, event) {
  const line = byVoice.get(event.voice) || [];
  const i = line.indexOf(event);
  return { prev: i > 0 ? line[i - 1] : null, next: i >= 0 && i + 1 < line.length ? line[i + 1] : null };
}

const steps = (system, a, b) => tuning.quantize(system, b).degree - tuning.quantize(system, a).degree;
// A note's degree: as written, where the renderer says (a close's raised
// leading note is still the degree it raises), else the nearest.
const degreeOf = (system, e) => (e.degree !== undefined ? e.degree : tuning.quantize(system, e.pitch).degree);
const isStep = (system, a, b) => a && b && Math.abs(steps(system, a.pitch, b.pitch)) === 1;
// Two notes touch if one ends where the next starts (no rest between).
const touches = (a, b) => a && b && time.eq(a.t + a.dur, b.t);

// ---------------------------------------------------------------- rules

const RULES = {};

// First species: every slice consonant (Fux p. 27). A fourth over the bass is a dissonance.
RULES.dissonance = (c) => {
  const out = [];
  for (const s of c.slices) {
    for (const p of s.pairs) {
      if (!consonantPair(p, c.period)) out.push(violation("dissonance", s, [p.low, p.high], `${Math.round(p.cents)} cents`));
    }
  }
  return out;
};

// Florid counterpoint (ours, after Fux's second to fourth species and
// Albrechtsberger's canons): a dissonance must be a passing or neighbour note
// (in and out by step, off the strong beats) or a suspension (held from a
// consonance, resolving down by step). A fourth over the bass with 3+ voices
// sounding is reported as a 6/4 (Mann pp. 228, 236-237).
RULES["dissonance-treatment"] = (c) => {
  const out = [];
  const sounding = multi(c.slices);
  const span = c.options.edges;
  const firstBar = span ? barOf(c, span.first) : sounding.length ? sounding[0].bar : 0;
  const lastBar = span ? barOf(c, span.last) : sounding.length ? sounding[sounding.length - 1].bar : 0;
  c.slices.forEach((s, si) => {
    const prev = si > 0 ? c.slices[si - 1] : null;
    for (const p of s.pairs) {
      if (consonantPair(p, c.period)) continue;
      const ok = [p.low, p.high].some((v) => {
        const n = noteOf(s, v);
        const { prev: before, next: after } = neighbours(c.byVoice, n.event);
        // Passing or neighbour: by step in and out, struck off the strong beats. It
        // stays one for as long as it sounds, even if another voice moves meanwhile.
        const struck = analyzePosition(c, n.event.t);
        if (!struck.strong && touches(before, n.event) && touches(n.event, after)
          && isStep(c.system, before, n.event) && isStep(c.system, n.event, after)) return true;
        if (n.onset) return false;
        // Held over: prepared (consonant in the slice before), resolving down by step.
        if (!prev) return false;
        const other = v === p.low ? p.high : p.low;
        const was = pairIn(prev, v, other);
        const prepared = !was || consonantPair(was, c.period);
        return prepared && after && touches(n.event, after) && steps(c.system, n.event.pitch, after.pitch) === -1;
      });
      if (ok) continue;
      const sixFour = p.fourth && p.withBass && s.notes.length > 2;
      if (!sixFour) {
        out.push(violation("dissonance", s, [p.low, p.high], `${Math.round(p.cents)} cents`));
        continue;
      }
      // A 6/4 is "bad particularly in the first or in the last measure or on any
      // strong beat" (Mann p. 228): there it's hard, elsewhere a soft cost.
      const edge = s.bar === firstBar || s.bar === lastBar;
      out.push(violation("six-four", s, [p.low, p.high], `${Math.round(p.cents)} cents`, s.strong || edge ? {} : { soft: true }));
    }
  });
  return out;
};

// Fux p. 22: into a perfect consonance only by contrary or oblique motion.
// Parallel (or similar, by octave displacement) into the same perfect class is
// parallel-perfect; similar motion into a perfect consonance from anything else is
// hidden-perfect (Fux pp. 32-33: what diminution reveals).
function motionRules(c) {
  const out = { parallel: [], hidden: [] };
  for (const m of c.motion) {
    const a = c.slices[m.from];
    const b = c.slices[m.to];
    for (const move of m.moves) {
      if (move.kind !== "parallel" && move.kind !== "similar") continue;
      const [x, y] = move.voices;
      const now = pairIn(b, x, y);
      if (!now || !isPerfect(now)) continue;
      const before = pairIn(a, x, y);
      const same = before && isPerfect(before)
        && Math.abs(folded(before.cents, c.period) - folded(now.cents, c.period)) < 1;
      const detail = `${Math.round(before ? before.cents : 0)} -> ${Math.round(now.cents)} cents, ${move.kind}`;
      (same ? out.parallel : out.hidden).push(violation(same ? "parallel-perfect" : "hidden-perfect", b, [x, y], detail,
        { from: { bar: a.bar, beat: a.beat, t: a.t } }));
    }
  }
  return out;
}
RULES["parallel-perfect"] = (c) => motionRules(c).parallel;
// With params.single "soft" (fux-relaxed): with more voices a hidden fifth or
// octave may be accepted "if there is no other possibility" (Fux p. 78, Fig. 101,
// bars 7-8; p. 77, the bass's fifth to the final octave), "on account of the
// requirements of the melody, or of the imitation" (p. 110): one on its own is a
// cost. Two in a row stay faults (p. 79, Fig. 102: "two progressions of the same
// kind follow immediately").
RULES["hidden-perfect"] = (c, params = {}) => {
  const hidden = motionRules(c).hidden;
  if (params.single !== "soft") return hidden;
  const key = (t) => Math.round(t * 1e6);
  const arrivals = new Set(hidden.map((v) => key(v.t)));
  return hidden.map((v) => (arrivals.has(key(v.from.t)) ? v : { ...v, soft: true }));
};

// Fux p. 28: begin and end on perfect consonances. With three or more voices the
// first chord may be the full triad (Fux pp. 71, 78: "the harmonic triad ... in
// each measure"; his Figs. 101, 104 and 105 open with a third over the final), and
// so may the final chord (Fux p. 112; p. 82: leaving the third out of a
// three-part close "holds true only in cases in which it is possible").
RULES["begin-perfect"] = (c) => {
  const s = edges(c).first;
  if (!s) return [];
  const allowed = (x) => isPerfect(x) || (s.notes.length > 2 && isImperfect(x));
  return s.above.filter((x) => !allowed(x)).map((x) => violation("begin-perfect", s, [s.bass, x.voice], `${Math.round(x.cents)} cents`));
};
RULES["end-perfect"] = (c) => {
  const s = edges(c).last;
  if (!s) return [];
  const allowed = (x) => isPerfect(x) || (s.notes.length > 2 && isImperfect(x));
  return s.above.filter((x) => !allowed(x)).map((x) => violation("end-perfect", s, [s.bass, x.voice], `${Math.round(x.cents)} cents`));
};

// Fux p. 31: stay in the mode of the given melody. The lowest voice sounds the
// final at the beginning and the end. The final: options.final, or voice 0's last note.
RULES["mode-final"] = (c, params) => {
  const { first, last } = edges(c);
  const ends = [...new Set([first, last].filter(Boolean))];
  if (!ends.length) return [];
  let final = c.options.final;
  if (final === undefined) {
    const line = c.byVoice.get(0) || [...c.byVoice.values()][0];
    final = line[line.length - 1].pitch;
  }
  const tolerance = params.tolerance || 15;
  const out = [];
  for (const s of ends) {
    const bass = noteOf(s, s.bass);
    if (folded((bass.pitch - final) * 100, c.period) > tolerance
      && c.period - folded((bass.pitch - final) * 100, c.period) > tolerance) {
      out.push(violation("mode-final", s, [s.bass], `the bass is ${Math.round(folded((bass.pitch - final) * 100, c.period))} cents from the final`));
    }
  }
  return out;
};

// Fux pp. 28-29: the next-to-last bar is a major sixth (cantus below) or a minor
// third (cantus above), the outer voices closing by contrary step. In 12-EDO the
// sizes are checked (fux12 and ratio); in other tunings, the class and the steps.
// With three or more voices (Fux pp. 76-82), two of the voices close that way,
// opening to the octave or closing to the unison, and the others are free: the
// bass leaps from the fifth to the final (Figs. 101, 104: A to D under C sharp
// and E), or itself rises or falls by step (Fig. 105: E to D; Fig. 106, phrygian:
// D to E).
RULES.penultimate = (c) => {
  const { all, last } = edges(c);
  const pen = last ? all[all.indexOf(last) - 1] : null;
  if (!last || !pen) return [];
  // The outer voices of the penultimate slice; at a final unison they may swap.
  const lo = pen.bass;
  const hi = pen.notes[pen.notes.length - 1].voice;
  const twelve = c.model.name === "fux12" || c.model.name === "ratio";
  const sized = (p) => [9, 3].includes(Math.round(folded(p.cents, 1200) / 100));
  const stepOf = (v) => steps(c.system, noteOf(pen, v).pitch, noteOf(last, v).pitch);
  const contrary = (a, b) => {
    const [x, y] = [stepOf(a), stepOf(b)];
    return Math.abs(x) === 1 && Math.abs(y) === 1 && Math.sign(x) !== Math.sign(y);
  };
  if (pen.notes.length > 2) {
    const unison = (p) => folded(p.cents, c.period) < 15 || c.period - folded(p.cents, c.period) < 15;
    const closes = pen.pairs.some((p) => {
      const after = pairIn(last, p.low, p.high);
      return after && isImperfect(p) && contrary(p.low, p.high) && unison(after) && (!twelve || sized(p));
    });
    return closes ? [] : [violation("penultimate", pen, [lo, hi], "no two voices close by contrary step from a sixth or third")];
  }
  const p = pairIn(pen, lo, hi);
  if (!p || !noteOf(last, lo) || !noteOf(last, hi)) return [violation("penultimate", pen, [lo, hi], "an outer voice stops before the end")];
  const out = [];
  if (!isImperfect(p)) out.push(violation("penultimate", pen, [lo, hi], "not an imperfect consonance"));
  if (!contrary(lo, hi)) out.push(violation("penultimate", pen, [lo, hi], "the outer voices don't close by contrary step"));
  if (twelve && !sized(p)) out.push(violation("penultimate", pen, [lo, hi], "not a major sixth or minor third"));
  return out;
};

// Fux p. 28: imperfect consonances are preferred between the beginning and the end.
RULES["prefer-imperfect"] = (c) => {
  const out = [];
  for (const s of edges(c).inner) {
    for (const x of s.above) if (isPerfect(x)) out.push(violation("prefer-imperfect", s, [s.bass, x.voice], "perfect inside"));
  }
  return out;
};

// Fux p. 71 (three parts): "the harmonic triad" in each measure if possible; a
// sixth or an octave may stand in for the fifth, for a better line or to avoid
// two perfect consonances in a row (p. 72). Ours, as a cost: a slice inside the
// canon where three or more voices sound and none is a third or sixth over the
// bass (only unisons, octaves and fifths: an empty chord).
RULES["full-triad"] = (c) => {
  const out = [];
  for (const s of edges(c).inner) {
    if (s.notes.length > 2 && !s.above.some(isImperfect)) {
      out.push(violation("full-triad", s, [s.bass], "no third or sixth over the bass"));
    }
  }
  return out;
};

// Mann's note (Fux p. 21): no more than three or four parallel imperfect
// consonances in a row. A run of more than `max` parallel moves.
RULES["parallel-imperfect-run"] = (c, params) => {
  const max = params.max || 3;
  const runs = new Map();
  const out = [];
  for (const m of c.motion) {
    const b = c.slices[m.to];
    for (const move of m.moves) {
      const now = pairIn(b, ...move.voices);
      const run = move.kind === "parallel" && now && isImperfect(now) ? (runs.get(move.key) || 0) + 1 : 0;
      runs.set(move.key, run);
      if (run > max) out.push(violation("parallel-imperfect-run", b, move.voices, `${run} parallel moves`));
    }
  }
  return out;
};

// Fux p. 29n: a tone repeated at most once (three in a row is too many).
RULES.repeat = (c) => {
  const out = [];
  for (const line of c.byVoice.values()) {
    for (let i = 2; i < line.length; i++) {
      const same = (a, b) => Math.abs(a.pitch - b.pitch) < 0.01 && touches(a, b);
      if (same(line[i - 2], line[i - 1]) && same(line[i - 1], line[i])) {
        const s = c.slices.find((x) => time.eq(x.t, line[i].t));
        out.push(violation("repeat", s, [line[i].voice], "a third time"));
      }
    }
  }
  return out;
};

// The sizes a k-step interval takes in the mode, and how often (over every
// starting degree). A size that occurs once while another occurs more is
// augmented or diminished (ours: in the diatonic scale it flags exactly the
// tritone, as F-B and B-F).
function stepSpectrum(system) {
  const count = tuning.size(system);
  const period = system.period_cents;
  const spectrum = new Map();
  if (!period) return spectrum;
  for (let k = 1; k < count; k++) {
    const sizes = new Map();
    for (let d = 0; d < count; d++) {
      const size = Math.round((tuning.degreeCents(system, d + k) - tuning.degreeCents(system, d)) * 10) / 10;
      sizes.set(size, (sizes.get(size) || 0) + 1);
    }
    const most = Math.max(...sizes.values());
    spectrum.set(k, [...sizes].filter(([, n]) => !(n === 1 && most > 1)).map(([size]) => size));
  }
  return spectrum;
}

// Fux p. 27n: no augmented, diminished or chromatic melodic intervals.
RULES["melodic-augmented"] = (c, params) => {
  const spectrum = stepSpectrum(c.system);
  const tolerance = params.tolerance || 10;
  const period = c.system.period_cents;
  const out = [];
  if (!period) return out;
  const count = tuning.size(c.system);
  for (const line of c.byVoice.values()) {
    for (let i = 1; i < line.length; i++) {
      if (!touches(line[i - 1], line[i])) continue;
      const cents = Math.abs(line[i].pitch - line[i - 1].pitch) * 100;
      if (cents < 1) continue;
      const k = Math.abs(degreeOf(c.system, line[i]) - degreeOf(c.system, line[i - 1])) % count;
      const inPeriod = cents % period;
      const regular = k === 0 ? inPeriod < tolerance || period - inPeriod < tolerance
        : (spectrum.get(k) || []).some((size) => Math.abs(size - inPeriod) <= tolerance);
      if (!regular) {
        const s = c.slices.find((x) => time.eq(x.t, line[i].t));
        out.push(violation("melodic-augmented", s, [line[i].voice], `${Math.round(cents)} cents over ${k} steps`));
      }
    }
  }
  return out;
};

// Fux p. 27n: no leap larger than a fifth, except the octave and the ascending
// minor sixth. In cents, so it holds in any tuning.
RULES["melodic-leap"] = (c, params) => {
  const fifth = params.fifth || 702;
  const tolerance = params.tolerance || 15;
  const period = c.system.period_cents || 1200;
  const out = [];
  for (const line of c.byVoice.values()) {
    for (let i = 1; i < line.length; i++) {
      if (!touches(line[i - 1], line[i])) continue;
      const signed = (line[i].pitch - line[i - 1].pitch) * 100;
      const size = Math.abs(signed);
      if (size <= fifth + tolerance) continue;
      if (Math.abs(size - period) <= tolerance) continue;
      if (signed > 0 && Math.abs(size - 814) <= 35) continue; // the ascending minor sixth (8/5 to 12-TET's 800)
      const s = c.slices.find((x) => time.eq(x.t, line[i].t));
      out.push(violation("melodic-leap", s, [line[i].voice], `${Math.round(signed)} cents`));
    }
  }
  return out;
};

// Fux p. 27n: leaps compensated (the next move turns back), and no two leaps in
// a row in one direction. A leap is more than two scale steps (larger than a third).
RULES["leap-compensation"] = (c) => {
  const out = [];
  for (const line of c.byVoice.values()) {
    for (let i = 2; i < line.length; i++) {
      if (!touches(line[i - 2], line[i - 1]) || !touches(line[i - 1], line[i])) continue;
      const first = steps(c.system, line[i - 2].pitch, line[i - 1].pitch);
      const second = steps(c.system, line[i - 1].pitch, line[i].pitch);
      const s = c.slices.find((x) => time.eq(x.t, line[i].t));
      if (Math.abs(first) > 2 && second !== 0 && Math.sign(second) === Math.sign(first)) {
        out.push(violation("leap-compensation", s, [line[i].voice], "a leap not turned back"));
      } else if (Math.abs(first) > 1 && Math.abs(second) > 1 && Math.sign(first) === Math.sign(second)) {
        out.push(violation("leap-compensation", s, [line[i].voice], "two leaps one way"));
      }
    }
  }
  return out;
};

// Ours, after Fux's first-species closes (pp. 28-29) and musica ficta: the note
// that leads to the final by a semitone (C sharp up to D in dorian, B up to C in
// ionian, F down to E in phrygian) is reached by step, and, where it was raised,
// its natural form (C for C sharp) doesn't sound
// in that voice in the two notes before it, or in any voice in the slice just
// before it (a false relation). At a close the renderer added (its notes are
// marked coda). M4 session 1: generated dorian canons skipped into the C sharp.
RULES["cadence-approach"] = (c) => {
  const out = [];
  // The final: options.final, or the bass of the last slice. A semitone to
  // anything else (an inner voice falling to the final chord's third, M4 part D)
  // isn't a leading note.
  const lastSlice = c.slices[c.slices.length - 1];
  const final = c.options.final !== undefined ? c.options.final : lastSlice && noteOf(lastSlice, lastSlice.bass).pitch;
  const isFinal = (p) => final === undefined || folded((p - final) * 100, c.period) < 15 || c.period - folded((p - final) * 100, c.period) < 15;
  for (const line of c.byVoice.values()) {
    const i = line.findIndex((e) => e.coda);
    if (i < 1 || i + 1 >= line.length) continue;
    const lead = line[i];
    const rise = (line[i + 1].pitch - lead.pitch) * 100;
    if (!(Math.abs(rise) > 50 && Math.abs(rise) < 150) || !isFinal(line[i + 1].pitch)) continue; // not a leading note
    const s = c.slices.find((x) => time.eq(x.t, lead.t));
    const prev = line[i - 1];
    if (touches(prev, lead) && Math.abs(degreeOf(c.system, lead) - degreeOf(c.system, prev)) !== 1) {
      out.push(violation("cadence-approach", s, [lead.voice], "the leading note is reached by a skip"));
    }
    const natural = tuning.degreeToPitch(c.system, degreeOf(c.system, lead));
    const same = (p) => folded((p - natural) * 100, c.period) < 15 || c.period - folded((p - natural) * 100, c.period) < 15;
    if (same(lead.pitch)) continue; // not raised: no natural form to clash with
    if (line.slice(Math.max(0, i - 2), i).some((e) => same(e.pitch))) {
      out.push(violation("cadence-approach", s, [lead.voice], "its natural form just before (a chromatic clash)"));
    }
    const before = c.slices[c.slices.indexOf(s) - 1];
    if (before && before.notes.some((n) => n.voice !== lead.voice && same(n.pitch))) {
      out.push(violation("cadence-approach", s, [lead.voice], "its natural form in another voice just before (a false relation)"));
    }
  }
  return out;
};

// Albrechtsberger (Mann pp. 216-217): let rests set up the entrances. A voice
// coming back after a rest shorter than `beats` re-enters unprepared.
RULES["entry-rest"] = (c, params) => {
  const beats = params.beats || 1;
  const out = [];
  for (const line of c.byVoice.values()) {
    for (let i = 1; i < line.length; i++) {
      const gap = line[i].t - (line[i - 1].t + line[i - 1].dur);
      if (gap > time.EPS && time.lt(gap, beats)) {
        const s = c.slices.find((x) => time.eq(x.t, line[i].t));
        out.push(violation("entry-rest", s, [line[i].voice], `a rest of ${gap} beats`));
      }
    }
  }
  return out;
};

// Albrechtsberger (Mann p. 217): "It is not good to place the beginning of a new
// phrase at the distance of a seventh or ninth from the end of the preceding
// phrase." Phrases are a voice's runs of notes between rests.
RULES["phrase-seventh"] = (c) => {
  const out = [];
  const count = tuning.size(c.system);
  for (const line of c.byVoice.values()) {
    for (let i = 1; i < line.length; i++) {
      if (touches(line[i - 1], line[i])) continue;
      const k = Math.abs(steps(c.system, line[i - 1].pitch, line[i].pitch));
      if (count === 7 && (k === 6 || k === 8)) {
        const s = c.slices.find((x) => time.eq(x.t, line[i].t));
        out.push(violation("phrase-seventh", s, [line[i].voice], `${k + 1}th from the phrase before`));
      }
    }
  }
  return out;
};

// The spectral profile: a ceiling on the model's score per slice and as a mean
// over a window (a density envelope).
RULES["roughness-ceiling"] = (c, params) => {
  const ceiling = params.ceiling === undefined ? 0.6 : params.ceiling;
  const windowCeiling = params.windowCeiling === undefined ? 0.4 : params.windowCeiling;
  const window = params.window || c.meter.beats;
  const out = [];
  const score = (s) => (s.above.length ? s.above.reduce((sum, x) => sum + x.score, 0) / s.above.length : 0);
  for (const s of c.slices) if (score(s) > ceiling) out.push(violation("roughness-ceiling", s, [s.bass], `slice ${score(s).toFixed(2)}`));
  for (let start = 0; c.slices.length && time.lt(start, c.slices[c.slices.length - 1].t + time.EPS); start += window) {
    const inside = c.slices.filter((s) => time.le(start, s.t) && time.lt(s.t, start + window));
    if (!inside.length) continue;
    const mean = inside.reduce((sum, s) => sum + score(s), 0) / inside.length;
    if (mean > windowCeiling) out.push(violation("roughness-ceiling", inside[0], [inside[0].bass], `window mean ${mean.toFixed(2)}`));
  }
  return out;
};

// ---------------------------------------------------------------- profiles

const H = (weight = 1, params = {}) => ({ hard: true, weight, ...params });
const S = (weight = 1, params = {}) => ({ hard: false, weight, ...params });

const PROFILES = {
  free: {},
  // Fux, first species (Study of Counterpoint, pp. 27-33).
  "fux-strict": {
    dissonance: H(), "parallel-perfect": H(), "hidden-perfect": H(),
    "begin-perfect": H(), "end-perfect": H(), "mode-final": H(), penultimate: H(),
    repeat: H(), "melodic-augmented": H(), "melodic-leap": H(),
    "prefer-imperfect": S(0.5), "parallel-imperfect-run": S(1, { max: 3 }), "leap-compensation": S(0.5),
    "cadence-approach": H(),
  },
  // Fux, three and four parts (pp. 71-116): "as the number of voices increases,
  // the rules are to be less rigorously observed" (p. 139). The rules that change
  // with the number of voices sounding (consonance between upper voices, the
  // opening and final chords, the penultimate) already do in every profile; this
  // one relaxes what Fux himself relaxes:
  //   hidden-perfect     one hidden fifth or octave is a cost; two in a row a
  //                      fault (pp. 77-79, 110)
  //   prefer-imperfect   off: a triad holds a fifth over the bass (p. 71)
  //   full-triad         a cost for an empty chord (pp. 71-72)
  // Parallel fifths and octaves stay faults between any two voices (p. 112: "if
  // only mistakes such as successions of two fifths or two octaves are avoided").
  "fux-relaxed": {
    base: "fux-strict",
    "hidden-perfect": H(2, { single: "soft" }), "prefer-imperfect": false, "full-triad": S(0.5),
  },
  // Florid canons, as Albrechtsberger writes them (ours: species 2-4's dissonance
  // treatment, brought forward from M5 for the answer finder). Melodic faults
  // are soft: a follower inherits the dux's melody, and a composer fixes a
  // scale-step answer with an accidental (Mann Ex. 210's E natural).
  florid: {
    "dissonance-treatment": H(), "parallel-perfect": H(), "hidden-perfect": S(1),
    "melodic-augmented": S(1), "melodic-leap": S(0.5), repeat: S(0.25),
  },
  // Albrechtsberger's canon rules on top of florid (Mann pp. 213-261).
  canon: {
    base: "florid",
    "entry-rest": S(0.5), "phrase-seventh": S(1),
  },
  // Motion rules on the model's own classes, and a roughness envelope.
  spectral: {
    "parallel-perfect": S(2), "hidden-perfect": S(0.5), "roughness-ceiling": S(1),
  },
};

// A profile's full rule table: its base's rules, then its own, then overrides.
function resolve(profile) {
  if (profile === undefined || profile === null) return { name: "free", rules: {} };
  const spec = typeof profile === "string" ? { name: profile } : profile;
  let rules = {};
  let name = spec.name || spec.base || "custom";
  const chain = [];
  let cursor = spec.name && PROFILES[spec.name] ? spec.name : spec.base;
  while (cursor) {
    if (!PROFILES[cursor]) throw new Error(`unknown rule profile ${cursor}; one of ${Object.keys(PROFILES).join(" ")}`);
    chain.unshift(cursor);
    cursor = PROFILES[cursor].base;
  }
  if (typeof profile === "string" && !PROFILES[profile]) {
    throw new Error(`unknown rule profile ${profile}; one of ${Object.keys(PROFILES).join(" ")}`);
  }
  for (const p of chain) {
    for (const [id, r] of Object.entries(PROFILES[p])) {
      if (id === "base") continue;
      if (r === false) delete rules[id]; // a profile can switch off a rule of its base
      else rules[id] = r;
    }
  }
  for (const [id, r] of Object.entries(spec.rules || {})) {
    if (r === false) { delete rules[id]; continue; }
    if (!RULES[id]) throw new Error(`unknown rule ${id}`);
    rules[id] = { ...(rules[id] || { hard: false, weight: 1 }), ...r };
  }
  if (spec.only) rules = Object.fromEntries(Object.entries(rules).filter(([id]) => spec.only.includes(id)));
  return { name, rules };
}

function judge(context, profile) {
  const { name, rules } = resolve(profile);
  const c = { ...context, period: context.system.period_cents || 1200, options: context.options || {} };
  const violations = [];
  for (const [id, r] of Object.entries(rules)) {
    const found = RULES[id](c, r);
    for (const v of found) {
      // A rule may report a more specific id (dissonance-treatment -> six-four),
      // and mark a violation soft where its source says it's only a fault in places.
      const { soft, ...rest } = v;
      const hardHere = r.hard && !soft;
      violations.push({ ...rest, hard: hardHere, cost: hardHere ? 0 : r.weight });
    }
  }
  violations.sort((a, b) => a.t - b.t || a.rule.localeCompare(b.rule));
  return { profile: name, violations };
}

exports.judge = judge;
exports.resolve = resolve;
exports.stepSpectrum = stepSpectrum;
exports.profiles = () => Object.keys(PROFILES);
exports.rules = () => Object.keys(RULES);
