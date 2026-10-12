"use strict";
// The canon transforms (PLAN.md 3.1), as pure functions on notes.
//
// A note is { dur, degree, offset, rest, index }:
//   dur      beats
//   degree   a degree of some scale system (cg-tuning)
//   offset   cents above that degree, so off-scale pitches stay exact through
//            scale-step transposition
//   rest     true for a rest (degree and offset are then ignored)
//   index    which dux note it came from
// Its pitch is degreeToPitch(system, degree) + offset / 100 (float MIDI).

const tuning = require("cg-tuning");
const time = require("cg-time");

function check(condition, message) {
  if (!condition) throw new Error(message);
}

// ---------------------------------------------------------------- notes and pitch

function pitchOf(note, system) {
  return tuning.degreeToPitch(system, note.degree) + note.offset / 100;
}

// A pitch as degree + offset in `system`; `nearest` drops the offset.
function fromPitch(pitch, system, nearest = false) {
  const q = tuning.quantize(system, pitch);
  return { degree: q.degree, offset: nearest ? 0 : q.error };
}

// A note as written in a spec: { dur, degree } (offset optional),
// { dur, pitch } (float MIDI), { dur, hz } or { dur, rest: true }.
function note(raw, system, index) {
  check(Number.isFinite(raw.dur) && raw.dur > 0, `note ${index}: dur must be above 0, got ${raw.dur}`);
  if (raw.rest) return { dur: raw.dur, degree: 0, offset: 0, rest: true, index };
  if (raw.degree !== undefined) {
    check(Number.isInteger(raw.degree), `note ${index}: degree must be a whole number, got ${raw.degree}`);
    return { dur: raw.dur, degree: raw.degree, offset: raw.offset || 0, rest: false, index };
  }
  let pitch = raw.pitch;
  if (pitch === undefined && raw.hz !== undefined) pitch = tuning.hzToMidi(raw.hz);
  check(Number.isFinite(pitch), `note ${index}: give a degree, pitch, hz or rest`);
  return { dur: raw.dur, ...fromPitch(pitch, system), rest: false, index };
}

// ---------------------------------------------------------------- intervals

// An interval as written in a spec:
//   3 or { steps: 3 }                       degree domain: scale steps (scalar)
//   { cents: 700 } or { ratio: "3/2" }       absolute domain: exact (chromatic)
//   ... , quantize: "nearest"                absolute, snapped to the target system
function interval(spec) {
  if (spec === undefined || spec === null) return { domain: "degree", steps: 0 };
  if (typeof spec === "number") spec = { steps: spec };
  const domain = spec.domain || (spec.steps !== undefined ? "degree" : "absolute");
  if (domain === "degree") {
    check(Number.isInteger(spec.steps), `a degree-domain interval needs whole steps, got ${spec.steps}`);
    return { domain, steps: spec.steps };
  }
  check(domain === "absolute", `unknown interval domain "${domain}" (degree or absolute)`);
  const cents = spec.cents !== undefined ? spec.cents : spec.ratio !== undefined ? tuning.ratioCents(spec.ratio) : NaN;
  check(Number.isFinite(cents), "an absolute interval needs cents or a ratio");
  return { domain, cents, nearest: spec.quantize === "nearest" };
}

// The interval taken k times (spiral passes).
function times(iv, k) {
  return iv.domain === "degree" ? { ...iv, steps: iv.steps * k } : { ...iv, cents: iv.cents * k };
}

// Transposes a note. Degree domain: its degree moves by steps, and is then
// read in `to` (another system makes this an interscalar answer). Absolute:
// the exact pitch moves, re-expressed in `to`.
function transpose(n, iv, from, to = from) {
  if (n.rest) return n;
  if (iv.domain === "degree") return { ...n, degree: n.degree + iv.steps };
  return { ...n, ...fromPitch(pitchOf(n, from) + iv.cents / 100, to, iv.nearest) };
}

// ---------------------------------------------------------------- inversion

// An axis as written in a spec, filled in from the first sounding note:
//   { degree: 2 } or { kind: "degree" }      mirror in scale steps (2 * degree whole)
//   { kind: "log", pitch: 62 }               mirror in cents (float MIDI pitch)
//   { kind: "partial", N: 16 }               partial n -> N + 1 - n (spectra)
//   { kind: "linear", hz: 440 }              f -> 2 * hz - f (Hz)
function axis(spec, first, system) {
  const kind = (spec && spec.kind) || "degree";
  const given = spec || {};
  if (kind === "degree") {
    const degree = given.degree !== undefined ? given.degree : first.degree;
    check(Number.isInteger(2 * degree), `a degree axis must be a whole or half degree, got ${degree}`);
    return { kind, degree };
  }
  if (kind === "log") return { kind, pitch: given.pitch !== undefined ? given.pitch : pitchOf(first, system) };
  if (kind === "linear") return { kind, hz: given.hz !== undefined ? given.hz : tuning.midiToHz(pitchOf(first, system)) };
  if (kind === "partial") {
    check(system.first_partial !== null && system.first_partial !== undefined,
      `${system.name}: partial inversion needs a spectrum (harmonic or stretched)`);
    const low = system.first_partial;
    const high = low + system.steps_cents.length - 1;
    return { kind, N: given.N !== undefined ? given.N : low + high - 1 };
  }
  throw new Error(`unknown axis kind "${kind}" (degree, log, partial or linear)`);
}

function invert(n, ax, system) {
  if (n.rest) return n;
  if (ax.kind === "degree") return { ...n, degree: 2 * ax.degree - n.degree, offset: -n.offset };
  if (ax.kind === "log") return { ...n, ...fromPitch(2 * ax.pitch - pitchOf(n, system), system) };
  if (ax.kind === "linear") {
    const hz = 2 * ax.hz - tuning.midiToHz(pitchOf(n, system));
    check(hz > 0, `a linear inversion around ${ax.hz} Hz sends note ${n.index} below 0 Hz`);
    return { ...n, ...fromPitch(tuning.hzToMidi(hz), system) };
  }
  // partial: partial number n -> N + 1 - n
  const partial = ax.N + 1 - (system.first_partial + n.degree);
  const degree = partial - system.first_partial;
  check(degree >= 0 && degree < system.steps_cents.length,
    `partial inversion with N = ${ax.N} sends note ${n.index} to partial ${partial}, outside ${system.name}`);
  return { ...n, degree, offset: -n.offset };
}

// ---------------------------------------------------------------- time

function retrograde(notes) {
  return notes.slice().reverse();
}

function timeScale(notes, s) {
  check(Number.isFinite(s) && s > 0, `timeScale must be above 0, got ${s}`);
  return notes.map((n) => ({ ...n, dur: n.dur * s }));
}

// Splits notes at every multiple of `unit` beats. Each piece remembers its note
// and its place in it, so pieces that end up next to each other again rejoin.
function pieces(notes, unit) {
  const out = [];
  let t = 0;
  notes.forEach((n, origin) => {
    let start = t;
    const end = t + n.dur;
    let piece = 0;
    while (time.lt(start, end)) {
      let boundary = (Math.floor(start / unit + time.EPS) + 1) * unit;
      if (!time.lt(start, boundary)) boundary += unit;
      const stop = time.lt(boundary, end) ? boundary : end;
      out.push({ n, origin, piece: piece++, start, dur: stop - start });
      start = stop;
    }
    t = end;
  });
  return out;
}

// Pieces back into notes: consecutive pieces of one note, in order, rejoin.
function join(list) {
  const out = [];
  for (const p of list) {
    const last = out[out.length - 1];
    if (last && last.origin === p.origin && p.piece === last.piece + 1) {
      last.dur += p.dur;
      last.piece = p.piece;
    } else {
      out.push({ ...p });
    }
  }
  return out.map((p) => ({ ...p.n, dur: p.dur }));
}

// Each segment of `length` beats is played backwards in place (Albrechtsberger,
// Mann Ex. 233-234). A note across a segment boundary is split there.
function segmentRetrograde(notes, length) {
  check(Number.isFinite(length) && length > 0, `segment length must be above 0, got ${length}`);
  const segments = [];
  for (const p of pieces(notes, length)) {
    const s = Math.floor(p.start / length + time.EPS);
    (segments[s] = segments[s] || []).push(p);
  }
  return join(segments.filter(Boolean).flatMap((seg) => seg.reverse()));
}

// Each segment is cut into equal beats, reordered: the new beat i is the old
// beat permutation[i] (Mann Ex. 237-238: [2, 0, 1], the third quarter first).
// Ties and rests move with their beat.
function segmentPermute(notes, length, permutation) {
  check(Number.isFinite(length) && length > 0, `segment length must be above 0, got ${length}`);
  const k = permutation.length;
  check(k > 0 && permutation.slice().sort((a, b) => a - b).every((v, i) => v === i),
    `the permutation must reorder 0-${k - 1}, got [${permutation}]`);
  const unit = length / k;
  const beats = [];
  for (const p of pieces(notes, unit)) {
    const b = Math.floor(p.start / unit + time.EPS);
    (beats[b] = beats[b] || []).push(p);
  }
  const out = [];
  for (let s = 0; s * k < beats.length; s++) {
    for (const i of permutation) out.push(...(beats[s * k + i] || []));
  }
  return join(out);
}

// The rhythm of a voice, one note at a time: its duration scaled, or, with a
// talea, the next durations of the cycle (negative entries are rests). A talea
// replaces the dux's rhythm and rests, keeping its pitch order (isorhythm).
function rhythm(talea, scale = 1) {
  check(Number.isFinite(scale) && scale > 0, `timeScale must be above 0, got ${scale}`);
  if (!talea) return { next: (n) => [{ dur: n.dur * scale, rest: !!n.rest, n }] };
  check(talea.length > 0 && talea.every((d) => Number.isFinite(d) && d !== 0) && talea.some((d) => d > 0),
    "a talea needs non-zero durations, at least one of them positive");
  let i = 0;
  return {
    next(n) {
      if (n.rest) return [];
      const out = [];
      for (;;) {
        const d = talea[i++ % talea.length];
        out.push({ dur: Math.abs(d) * scale, rest: d < 0, n });
        if (d > 0) return out;
      }
    },
  };
}

// The rhythm applied to a whole list: notes (rests included) with new durations.
function applyRhythm(notes, talea, scale = 1) {
  const r = rhythm(talea, scale);
  return notes.flatMap((n) => r.next(n).map((p) => (p.rest ? { ...n, dur: p.dur, rest: true } : { ...n, dur: p.dur })));
}

exports.pitchOf = pitchOf;
exports.fromPitch = fromPitch;
exports.note = note;
exports.interval = interval;
exports.times = times;
exports.transpose = transpose;
exports.axis = axis;
exports.invert = invert;
exports.retrograde = retrograde;
exports.timeScale = timeScale;
exports.segmentRetrograde = segmentRetrograde;
exports.segmentPermute = segmentPermute;
exports.rhythm = rhythm;
exports.applyRhythm = applyRhythm;
