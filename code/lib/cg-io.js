"use strict";
// Files in and out of the engine (PLAN.md 3.1 "Dux sources"; 3.2 cg.io).
// M2: reading a Standard MIDI File into a dux melody, and a minimal writer
// (for test fixtures now, and the start of M10's export). No Max APIs: the
// [v8] wrapper reads the bytes (code/max/cg-file.js) and hands them over.

const tuning = require("cg-tuning");
const time = require("cg-time");
const mpe = require("cg-mpe");

const CENTER = 8192;
const DEFAULT_BPM = 120; // the MIDI default when a file has no tempo event

function check(condition, message) {
  if (!condition) throw new Error(message);
}

// ---------------------------------------------------------------- reading

// Bytes (an array of 0-255, or a Uint8Array) -> the file's notes and tempo:
//   { format, ppq, tracks: [{ index, name }], notes, tempos, meters, warnings }
// A note is { track, channel, key, vel, pitch, start, end, glide } with times
// in beats (ticks / PPQ) and pitch as float MIDI, pitch bend included.
// Channels are 1-16, as Max and Live show them.
function parseMidi(input) {
  const bytes = Uint8Array.from(input);
  let pos = 0;
  const u8 = () => {
    check(pos < bytes.length, "the MIDI file ends too early");
    return bytes[pos++];
  };
  const u16 = () => (u8() << 8) | u8();
  const u32 = () => u8() * 0x1000000 + (u8() << 16) + (u8() << 8) + u8();
  const tag = () => String.fromCharCode(u8(), u8(), u8(), u8());

  check(bytes.length >= 14 && tag() === "MThd", "not a MIDI file: it doesn't start with MThd");
  const headerLength = u32();
  check(headerLength >= 6, "not a MIDI file: its header is too short");
  const format = u16();
  const trackCount = u16();
  const division = u16();
  pos += headerLength - 6;
  check(format === 0 || format === 1, `MIDI format ${format} isn't supported (only 0 and 1)`);
  check(!(division & 0x8000), "this file counts time in SMPTE frames; export it with beats (PPQ) instead");
  check(division > 0, "the file's ticks per beat is 0");
  const ppq = division;

  const raw = [];
  while (raw.length < trackCount && pos + 8 <= bytes.length) {
    const kind = tag();
    const length = u32();
    check(pos + length <= bytes.length, `track ${raw.length + 1} runs past the end of the file`);
    if (kind === "MTrk") raw.push(readTrack(bytes, pos, pos + length, raw.length));
    pos += length; // other chunk types are skipped, as the standard says
  }
  const warnings = [];
  if (raw.length < trackCount) warnings.push(`the header says ${trackCount} tracks, but the file has ${raw.length}`);

  // Every track's events in time order; channel state (bend, ranges) is shared.
  const all = raw.flatMap((t) => t.events).sort((a, b) => a.tick - b.tick || a.track - b.track || a.order - b.order);
  const channels = Array.from({ length: 16 }, () => ({ bend: CENTER, range: 2, rpn: [127, 127], member: false }));
  const open = new Map(); // "channel:key" -> notes not yet ended, oldest first
  const notes = [];
  const tempos = [];
  const meters = [];
  const names = raw.map((t) => ({ index: t.index, name: "" }));
  let lastTick = 0;

  for (const e of all) {
    lastTick = Math.max(lastTick, e.tick);
    if (e.meta !== undefined) {
      if (e.meta === 0x51 && e.data.length === 3) {
        const micros = (e.data[0] << 16) | (e.data[1] << 8) | e.data[2];
        if (micros > 0) tempos.push({ beat: e.tick / ppq, bpm: 60e6 / micros });
      } else if (e.meta === 0x58 && e.data.length >= 2) {
        meters.push({ beat: e.tick / ppq, numerator: e.data[0], denominator: 2 ** e.data[1] });
      } else if (e.meta === 0x03) {
        names[e.track].name = String.fromCharCode(...e.data);
      }
      continue;
    }
    const ch = channels[e.channel - 1];
    if (e.kind === 0x90 && e.d2 > 0) {
      const key = `${e.channel}:${e.d1}`;
      const note = {
        track: e.track, channel: e.channel, key: e.d1, vel: e.d2,
        pitch: mpe.pitchOf(e.d1, ch.bend, ch.range), bend: ch.bend,
        startTick: e.tick, endTick: null, glide: false,
      };
      if (!open.has(key)) open.set(key, []);
      open.get(key).push(note);
      notes.push(note);
    } else if (e.kind === 0x80 || (e.kind === 0x90 && e.d2 === 0)) {
      const waiting = open.get(`${e.channel}:${e.d1}`);
      if (waiting && waiting.length) waiting.shift().endTick = e.tick;
    } else if (e.kind === 0xe0) {
      ch.bend = (e.d2 << 7) | e.d1;
      // A bend under a sounding note on this channel makes it a glide.
      for (const [key, waiting] of open) {
        if (!key.startsWith(`${e.channel}:`)) continue;
        for (const n of waiting) if (n.bend !== ch.bend && e.tick > n.startTick) n.glide = true;
      }
    } else if (e.kind === 0xb0) {
      controller(channels, e.channel, e.d1, e.d2);
    }
  }

  let unterminated = 0;
  for (const n of notes) {
    if (n.endTick === null) {
      n.endTick = Math.max(lastTick, n.startTick);
      unterminated++;
    }
  }
  if (unterminated) warnings.push(`${unterminated} notes never ended; they run to the end of the file`);

  return {
    format,
    ppq,
    tracks: names,
    notes: notes
      .filter((n) => n.endTick > n.startTick)
      .map((n) => ({
        track: n.track, channel: n.channel, key: n.key, vel: n.vel, pitch: n.pitch,
        start: n.startTick / ppq, end: n.endTick / ppq, glide: n.glide,
      }))
      .sort((a, b) => a.start - b.start || b.pitch - a.pitch),
    tempos,
    meters,
    warnings,
  };
}

// The events of one track chunk, with absolute ticks. Meta events keep their
// type and data; sysex is skipped; running status is followed.
function readTrack(bytes, start, end, track) {
  let pos = start;
  let tick = 0;
  let status = 0;
  let order = 0;
  const events = [];
  const byte = () => {
    check(pos < end, `track ${track + 1} ends in the middle of an event`);
    return bytes[pos++];
  };
  const vlq = () => {
    let value = 0;
    for (let i = 0; i < 4; i++) {
      const b = byte();
      value = value * 128 + (b & 0x7f);
      if (!(b & 0x80)) return value;
    }
    throw new Error(`track ${track + 1} has a malformed time value`);
  };
  while (pos < end) {
    tick += vlq();
    const first = byte();
    if (first === 0xff) {
      const meta = byte();
      const length = vlq();
      check(pos + length <= end, `track ${track + 1}: a meta event runs past the track`);
      events.push({ tick, track, order: order++, meta, data: Array.from(bytes.slice(pos, pos + length)) });
      pos += length;
      status = 0;
      if (meta === 0x2f) break;
      continue;
    }
    if (first === 0xf0 || first === 0xf7) {
      const length = vlq(); // read first: `pos += vlq()` would add to the old pos
      pos += length;
      status = 0;
      continue;
    }
    let d1;
    if (first & 0x80) {
      status = first;
      d1 = byte();
    } else {
      check(status, `track ${track + 1}: data with no status byte before it`);
      d1 = first; // running status
    }
    const kind = status & 0xf0;
    const d2 = kind === 0xc0 || kind === 0xd0 ? 0 : byte();
    events.push({ tick, track, order: order++, kind, channel: (status & 0x0f) + 1, d1, d2 });
  }
  return { index: track, events };
}

// Registered parameters: RPN 0 is the pitch-bend range (semitones + cents),
// RPN 6 is the MPE Configuration Message on a zone's master channel (1 for
// the lower zone, 16 for the upper). A declared zone's member channels default
// to +/-48 (the MPE specification); RPN 0 overrides that afterwards.
function controller(channels, channel, number, value) {
  const ch = channels[channel - 1];
  if (number === 101) ch.rpn = [value, ch.rpn[1]];
  else if (number === 100) ch.rpn = [ch.rpn[0], value];
  else if (number === 6 || number === 38) {
    const [msb, lsb] = ch.rpn;
    if (msb === 0 && lsb === 0) {
      ch.range = number === 6 ? value : Math.floor(ch.range) + value / 100;
    } else if (msb === 0 && lsb === 6 && number === 6 && (channel === 1 || channel === 16)) {
      const members = Math.min(value, 15);
      for (let k = 1; k <= members; k++) {
        const member = channels[channel === 1 ? k : 15 - k];
        member.member = true;
        member.range = 48;
      }
      ch.range = 2;
    }
  }
}

// ---------------------------------------------------------------- a melody from the notes

// Turns a parsed file into a dux melody for the canon:
//   track, channel   which notes (default: all; tracks count from 0, channels 1-16)
//   line             "top" (default): the highest sounding note at every moment
//                    (the skyline); "bottom": the lowest; "track": every note in
//                    order, each cutting the one before (a chord keeps its highest)
//   quantize         a grid in beats (0: off)
//   map              "exact" (default): the float pitches; "nearest": snapped to
//                    `system`; "degree": degrees of `source` (default 12-EDO from
//                    C4) read as degrees of `system`
//   system, source   cg-tuning scale systems (system is needed for nearest and degree)
// Returns { notes: [{ dur, pitch } | { dur, degree } | { dur, rest }], report }.
function melodyFromMidi(parsed, options = {}) {
  const line = options.line || "top";
  check(["top", "bottom", "track"].includes(line), `line must be top, bottom or track, got ${line}`);
  const map = options.map || "exact";
  check(["exact", "nearest", "degree"].includes(map), `map must be exact, nearest or degree, got ${map}`);
  const grid = options.quantize || 0;
  check(grid >= 0, `quantize must be 0 (off) or a grid in beats, got ${grid}`);

  const report = { line, map, quantize: grid, dropped: 0, cut: 0, fragments: 0, quantizeDropped: 0, glides: 0, trimmed: 0 };
  let notes = parsed.notes.filter((n) => (options.track === undefined || options.track < 0 || n.track === options.track)
    && (options.channel === undefined || options.channel < 1 || n.channel === options.channel));
  report.found = notes.length;
  check(notes.length > 0, "no notes found (check the track and channel)");

  if (grid > 0) {
    const snap = (beats) => Math.round(beats / grid) * grid;
    const snapped = notes.map((n) => ({ ...n, start: snap(n.start), end: snap(n.end) }));
    notes = snapped.filter((n) => time.lt(n.start, n.end));
    report.quantizeDropped = snapped.length - notes.length;
  }

  const chosen = pickLine(notes, line, report);
  report.glides = chosen.filter((n) => n.glide).length;

  const out = [];
  report.trimmed = chosen[0].start;
  let cursor = chosen[0].start;
  for (const n of chosen) {
    if (time.lt(cursor, n.start)) out.push({ dur: n.start - cursor, rest: true });
    out.push({ dur: n.end - n.start, ...pitchFor(n.pitch, map, options) });
    cursor = n.end;
  }
  report.notes = chosen.length;
  report.rests = out.length - chosen.length;
  report.beats = cursor - chosen[0].start;
  // The file's first tempo, to 0.001 bpm (a tempo is stored in whole microseconds).
  report.tempo = parsed.tempos.length ? Math.round(parsed.tempos[0].bpm * 1000) / 1000 : null;
  report.tempoChanges = Math.max(0, parsed.tempos.length - 1);
  report.tracks = parsed.tracks.map((t) => t.name);
  return { notes: out, report };
}

// top / bottom: the skyline. At every moment the highest (lowest) sounding note
// is the line, so a note covered for a while comes back when it's uncovered,
// as a fragment of itself. track: every note in order, each cutting the one
// before. The report counts notes dropped (never heard) and cut (heard in part).
function pickLine(notes, line, report) {
  const sorted = notes.slice().sort((a, b) => a.start - b.start || b.pitch - a.pitch);
  if (line === "track") return trackLine(sorted, report);
  const better = (a, b) => (line === "bottom" ? a.pitch < b.pitch : a.pitch > b.pitch);
  const bounds = [...new Set(sorted.flatMap((n) => [n.start, n.end]))].sort((a, b) => a - b);
  const heard = new Map(); // note -> beats on the line
  const out = [];
  for (let i = 0; i + 1 < bounds.length; i++) {
    const [from, to] = [bounds[i], bounds[i + 1]];
    let best = null;
    for (const n of sorted) {
      if (time.le(n.end, from) || !time.lt(n.start, to)) continue; // not sounding in [from, to)
      if (!best || better(n, best)) best = n;
    }
    if (!best) continue;
    heard.set(best, (heard.get(best) || 0) + (to - from));
    const last = out[out.length - 1];
    if (last && last.source === best && time.eq(last.end, from)) last.end = to;
    else out.push({ ...best, start: from, end: to, source: best });
  }
  report.dropped = sorted.filter((n) => !heard.has(n)).length;
  report.cut = [...heard].filter(([n, beats]) => time.lt(beats, n.end - n.start)).length;
  report.fragments = out.length - heard.size;
  return out.map(({ source, ...n }) => n);
}

function trackLine(sorted, report) {
  const chosen = [];
  for (const n of sorted) {
    const current = chosen[chosen.length - 1];
    if (!current || !time.lt(n.start, current.end)) {
      chosen.push({ ...n });
    } else if (time.eq(n.start, current.start)) {
      report.dropped++; // a chord keeps its highest note
    } else {
      current.end = n.start;
      report.cut++;
      chosen.push({ ...n });
    }
  }
  return chosen;
}

function pitchFor(pitch, map, options) {
  if (map === "exact") return { pitch };
  check(options.system, `map "${map}" needs the target scale system`);
  if (map === "nearest") return { degree: tuning.quantize(options.system, pitch).degree };
  const source = options.source || tuning.edo(12, { ref: { step: 0, midi: 60 } });
  return { degree: tuning.quantize(source, pitch).degree };
}

// ---------------------------------------------------------------- writing

// A minimal Standard MIDI File writer. tracks: [{ name, events: [{ tick, data }] }],
// where data is the event's bytes after the time (a channel message, or
// [0xff, type, ...] for a meta event: give its data, the length is added).
// Events are sorted by tick; each track gets an end-of-track.
function writeMidi({ ppq = 480, tracks }) {
  check(tracks.length >= 1, "a MIDI file needs a track");
  const out = [...ascii("MThd"), ...u32(6), ...u16(tracks.length === 1 ? 0 : 1), ...u16(tracks.length), ...u16(ppq)];
  for (const track of tracks) {
    const events = [];
    if (track.name !== undefined) events.push({ tick: 0, data: [0xff, 0x03, ...ascii(track.name)] });
    events.push(...track.events);
    events.sort((a, b) => a.tick - b.tick);
    const body = [];
    let last = 0;
    for (const e of events) {
      body.push(...vlq(e.tick - last));
      last = e.tick;
      if (e.data[0] === 0xff) body.push(0xff, e.data[1], ...vlq(e.data.length - 2), ...e.data.slice(2));
      else body.push(...e.data);
    }
    body.push(0, 0xff, 0x2f, 0);
    out.push(...ascii("MTrk"), ...u32(body.length), ...body);
  }
  return Uint8Array.from(out);
}

// A tempo meta event's data, for writeMidi.
function tempoEvent(bpm) {
  const micros = Math.round(60e6 / bpm);
  return [0xff, 0x51, (micros >> 16) & 0xff, (micros >> 8) & 0xff, micros & 0xff];
}

const ascii = (text) => Array.from(text, (c) => c.charCodeAt(0) & 0xff);
const u16 = (v) => [(v >> 8) & 0xff, v & 0xff];
const u32 = (v) => [(v >>> 24) & 0xff, (v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff];
function vlq(value) {
  check(Number.isInteger(value) && value >= 0, `a MIDI time must be a whole number of ticks, got ${value}`);
  const out = [value & 0x7f];
  for (let v = value >> 7; v > 0; v >>= 7) out.unshift((v & 0x7f) | 0x80);
  return out;
}

exports.DEFAULT_BPM = DEFAULT_BPM;
exports.parseMidi = parseMidi;
exports.melodyFromMidi = melodyFromMidi;
exports.writeMidi = writeMidi;
exports.tempoEvent = tempoEvent;
