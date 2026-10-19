"use strict";
// The piano roll's layout (M3 part F; PLAN.md 4.1). Pure: it turns a rendered
// canon and its analysis into a list of drawing primitives, and the [v8ui]
// wrapper (code/cg.roll.v8ui.js) only draws them. So everything a listener
// would check (where a note sits, which colour, where a marker points) is
// tested in Node.
//
//   layout(view, { width, height }) -> { items, markers, frame }
//   view:
//     events     [{ t, dur, pitch, voice }] (pitch: MIDI, float for microtones)
//     voices     [{ name }], one per voice (names label the markers)
//     meter      { beats, strong }
//     period     cents per period (1200; a pitch guide at each, from middle C)
//     report     cg-analyze's verdict: { profile, model, hard, cost,
//                violations: [{ t, bar, beat, rule, voices, hard, detail }],
//                curve: [{ t, score }] }
//     playhead   a time in beats, or null
//     caption    replaces the default caption (e.g. a clicked marker's text)
//   items: { role, op, ... }, drawn in order. op is rect (x, y, w, h), line
//     (x1, y1, x2, y2, width), text (x, y, text, size), path (points, width)
//     or diamond (x, y, r); each has a color [r, g, b, a]. role says what it
//     is: background, guide, bar, barnumber, note, marker, curve, curvelabel,
//     playhead, caption.
//   markers: [{ x, y, text, hard }], for hit().
//   frame: where time maps to x, so a moving playhead can be drawn over a
//     cached layout: playheadLine(frame, t) (the [v8ui] lays out once per
//     render, not once per note).
//
//   hit(markers, x, y) -> the text of the marker(s) nearest (x, y) within
//     a few pixels, or null.

const time = require("cg-time");

// Voice colours: distinct from each other and from the markers' red and amber.
const VOICE_COLORS = [
  [0.16, 0.42, 0.75, 1], [0.18, 0.6, 0.35, 1], [0.52, 0.35, 0.72, 1], [0.1, 0.6, 0.66, 1],
  [0.78, 0.36, 0.62, 1], [0.5, 0.52, 0.12, 1], [0.5, 0.36, 0.27, 1], [0.35, 0.42, 0.5, 1],
];
const FAULT = [0.85, 0.12, 0.12, 1];
const SOFT = [0.96, 0.62, 0.05, 1];
const INK = [0.15, 0.15, 0.15, 1];
const FAINT = [0, 0, 0, 0.12];
const BAR = [0, 0, 0, 0.3];
const CURVE = [0.3, 0.3, 0.3, 1];
const PLAYHEAD = [0.9, 0.2, 0.1, 0.8];
const BACKGROUND = [0.98, 0.98, 0.97, 1];
const STRIP = [0.93, 0.93, 0.92, 1];

const CAPTION_H = 18; // the caption line
const NUMBERS_H = 14; // bar numbers
const CURVE_H = 48; // the dissonance strip
const SIDE = 4; // left and right margins
const MARGIN = 2; // semitones above and below the canon's range
const HIT = 6; // pixels: how near a click has to be to a marker

const voiceColor = (v) => VOICE_COLORS[((v % VOICE_COLORS.length) + VOICE_COLORS.length) % VOICE_COLORS.length];
const round = (x) => Math.round(x * 100) / 100;

// "voice 1" or the voice's name; a list as "a and b" (no commas: Max splits
// messages on them).
function voiceNames(view, list) {
  return list.map((v) => (view.voices && view.voices[v] && view.voices[v].name) || `voice ${v}`).join(" and ");
}

function markerText(view, v) {
  const where = v.bar !== undefined ? `bar ${v.bar} beat ${round(v.beat + 1)}` : `beat ${round(v.t)}`;
  const who = v.voices && v.voices.length ? ` / ${voiceNames(view, v.voices)}` : "";
  const detail = v.detail ? ": " + String(v.detail).replace(/\s*[,;]\s*/g, " / ") : ""; // no separators for Max
  return `${where}: ${v.rule}${who} (${v.hard ? "fault" : "soft"})${detail}`;
}

function defaultCaption(view, report) {
  if (!report) return view.name || "";
  const faults = `${report.hard} ${report.hard === 1 ? "fault" : "faults"}`;
  return `${view.name ? view.name + ": " : ""}${report.profile} rules: ${faults} / cost ${round(report.cost)}`
    + (report.violations && report.violations.length ? " / click a marker to name it" : "");
}

function layout(view, size) {
  const width = size.width;
  const height = size.height;
  const items = [];
  const markers = [];
  const events = (view.events || []).filter((e) => e.dur > 0);
  const report = view.report || null;
  items.push({ role: "background", op: "rect", x: 0, y: 0, w: width, h: height, color: BACKGROUND });
  const caption = (text) => items.push({ role: "caption", op: "text", x: SIDE, y: 13, text, size: 11, color: INK });
  if (!events.length) {
    caption(view.caption || "nothing rendered yet");
    return { items, markers, frame: null };
  }

  const length = events.reduce((m, e) => Math.max(m, e.t + e.dur), 0);
  const beats = view.meter && view.meter.beats > 0 ? view.meter.beats : 4;
  const left = SIDE;
  const right = width - SIDE;
  const top = CAPTION_H + NUMBERS_H;
  const bottom = height - CURVE_H - 4;
  const x = (t) => left + (t / length) * (right - left);
  const pitches = events.map((e) => e.pitch);
  const lo = Math.min(...pitches) - MARGIN;
  const hi = Math.max(...pitches) + MARGIN;
  const row = (bottom - top) / (hi - lo); // pixels per semitone
  const y = (pitch) => bottom - (pitch - lo) * row;

  // Pitch guides at each period from middle C, then bar lines and numbers.
  const period = (view.period || 1200) / 100;
  for (let k = Math.ceil((lo - 60) / period); 60 + k * period <= hi; k++) {
    const gy = y(60 + k * period);
    items.push({ role: "guide", op: "line", x1: left, y1: gy, x2: right, y2: gy, width: 1, color: FAINT });
  }
  const bars = Math.ceil(length / beats - time.EPS);
  const every = Math.max(1, Math.ceil(24 / ((beats / length) * (right - left)))); // numbers 24 px apart at least
  for (let b = 0; b <= bars; b++) {
    const bx = x(Math.min(b * beats, length));
    items.push({ role: "bar", op: "line", x1: bx, y1: top, x2: bx, y2: bottom, width: 1, color: BAR });
    if (b < bars && b % every === 0) {
      items.push({ role: "barnumber", op: "text", x: bx + 2, y: CAPTION_H + 11, text: String(b + 1), size: 9, color: INK });
    }
  }

  // The notes: one rectangle each, in the voice's colour, centred on its pitch.
  const h = Math.max(2, Math.min(10, row));
  for (const e of events) {
    items.push({
      role: "note", op: "rect", x: x(e.t), y: y(e.pitch) - h / 2, w: Math.max(1, x(e.t + e.dur) - x(e.t) - 1), h,
      voice: e.voice, color: voiceColor(e.voice),
    });
  }

  // The violations: a diamond on each named voice's note at that time; a rule
  // that names no voice (or a voice that's resting) gets one on the top edge.
  for (const v of (report && report.violations) || []) {
    const text = markerText(view, v);
    const color = v.hard ? FAULT : SOFT;
    const at = (v.voices && v.voices.length ? v.voices : [null]).map((voice) => {
      const e = voice === null ? null : events.find((n) => n.voice === voice && time.le(n.t, v.t) && time.lt(v.t, n.t + n.dur));
      return e ? y(e.pitch) : top + 4;
    });
    for (const my of [...new Set(at)]) {
      const mx = x(v.t);
      items.push({ role: "marker", op: "diamond", x: mx, y: my, r: 4, hard: Boolean(v.hard), color });
      markers.push({ x: mx, y: my, text, hard: Boolean(v.hard) });
    }
  }

  // The dissonance curve: each slice's score held until the next slice, scaled
  // to its own largest score (each model scores on its own scale).
  const curve = (report && report.curve) || [];
  const stripTop = height - CURVE_H;
  const stripBottom = height - 4;
  items.push({ role: "curvestrip", op: "rect", x: 0, y: stripTop - 2, w: width, h: CURVE_H + 2, color: STRIP });
  if (curve.length) {
    const max = Math.max(...curve.map((p) => p.score));
    const scale = max > 0 ? max : 1;
    const cy = (score) => stripBottom - (score / scale) * (stripBottom - stripTop - 12);
    const points = [];
    curve.forEach((p, i) => {
      const end = i + 1 < curve.length ? curve[i + 1].t : length;
      points.push([x(p.t), cy(p.score)], [x(end), cy(p.score)]);
    });
    items.push({ role: "curve", op: "path", points, width: 1.5, color: CURVE });
    items.push({
      role: "curvelabel", op: "text", x: SIDE, y: stripTop + 9, size: 9, color: INK,
      text: `dissonance (${report.model || "model"} score, top = ${round(max)})`,
    });
  }

  const frame = { left, right, length, top: CAPTION_H, bottom: stripBottom };
  if (view.playhead !== null && view.playhead !== undefined && view.playhead >= 0) items.push(playheadLine(frame, view.playhead));
  caption(view.caption || defaultCaption(view, report));
  return { items, markers, frame };
}

function playheadLine(frame, t) {
  const px = frame.left + (Math.min(Math.max(t, 0), frame.length) / frame.length) * (frame.right - frame.left);
  return { role: "playhead", op: "line", x1: px, y1: frame.top, x2: px, y2: frame.bottom, width: 2, color: PLAYHEAD };
}

function hit(markers, x, y, radius = HIT) {
  let best = null;
  for (const m of markers) {
    const d = Math.hypot(m.x - x, m.y - y);
    if (d > radius) continue;
    if (!best || d < best.d - 0.5) best = { d, texts: [m.text] };
    else if (Math.abs(d - best.d) <= 0.5 && !best.texts.includes(m.text)) best.texts.push(m.text);
  }
  return best ? best.texts.join(" / ") : null;
}

exports.layout = layout;
exports.hit = hit;
exports.playheadLine = playheadLine;
exports.markerText = markerText;
exports.VOICE_COLORS = VOICE_COLORS;
exports.FAULT = FAULT;
exports.SOFT = SOFT;
