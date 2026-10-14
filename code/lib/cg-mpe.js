"use strict";
// MPE output maths (MIDI Polyphonic Expression, lower zone). Each note gets
// its own member channel (allocate), and its microtonal offset travels as
// per-channel pitch bend. The bend range depends on where the notes go (RANGES):
// +/-48 semitones for MIDI out, the MPE standard and what Live 12's tuning
// system expects (PLAN.md 4.3), about 0.59 cents per bend step; +/-2 for Drift.
//
// Everything here returns raw MIDI bytes for [midiout]. The engine computes
// the bytes ahead of time; Max sends them (JS never schedules notes).

const time = require("cg-time");

const DEFAULT_RANGE = 48;
// The bend range each MPE destination applies. Drift ignores the RPN in the
// zone setup and keeps its own per-note range ("Note PB", 2 by default): M2
// session 3 measured it. A note's bend stays within +/-50 cents of its key,
// so +/-2 covers it, in steps of about 0.05 cents.
const RANGES = { drift: 2, midi: DEFAULT_RANGE };
const CENTER = 8192;
const MAX_BEND = 16383;

const clamp = (value, lo, hi) => Math.min(hi, Math.max(lo, value));

// A float MIDI pitch -> the nearest note number and the 14-bit bend that
// reaches the exact pitch from it.
function bendFor(pitch, range = DEFAULT_RANGE) {
  const note = clamp(Math.round(pitch), 0, 127);
  const bend = clamp(Math.round(CENTER + ((pitch - note) / range) * CENTER), 0, MAX_BEND);
  return { note, bend };
}

// The pitch a note number and 14-bit bend actually sound.
function pitchOf(note, bend, range = DEFAULT_RANGE) {
  return note + ((bend - CENTER) / CENTER) * range;
}

// The bend range a synth actually used, from the pitch it sounded for a note
// sent with `bend`: the range it was sent for if it honoured it, 2 if it kept
// the MIDI default, about 0 if it ignored the bend. NaN when the bend is
// centred (nothing to infer from).
function impliedRange(measuredPitch, note, bend) {
  if (bend === CENTER) return NaN;
  return (measuredPitch - note) / ((bend - CENTER) / CENTER);
}

// MIDI channels are 1-16 here, as Max and Live show them.
function status(kind, channel) {
  if (!(channel >= 1 && channel <= 16)) throw new Error("MIDI channel must be 1-16, got " + channel);
  return kind | (channel - 1);
}

const cc = (channel, controller, value) => [status(0xb0, channel), controller, value];

// Registered parameter number `msb, lsb` set to `value` (data entry MSB), then
// the null RPN so later data-entry messages can't change it by accident.
function rpn(channel, msb, lsb, value, valueLsb = 0) {
  return [
    cc(channel, 101, msb),
    cc(channel, 100, lsb),
    cc(channel, 6, value),
    cc(channel, 38, valueLsb),
    cc(channel, 101, 127),
    cc(channel, 100, 127),
  ];
}

// The lower-zone setup: the MPE Configuration Message (RPN 6) on the master
// channel 1, then pitch-bend sensitivity (RPN 0) on every member channel.
function zoneConfig({ members = 15, range = DEFAULT_RANGE } = {}) {
  if (!(members >= 1 && members <= 15)) throw new Error("an MPE zone has 1-15 member channels, got " + members);
  const messages = rpn(1, 0, 6, members);
  for (let channel = 2; channel <= members + 1; channel++) messages.push(...rpn(channel, 0, 0, range));
  return messages;
}

// Bend first, then note-on, so the note starts at its exact pitch.
function noteOn(pitch, velocity, channel, range = DEFAULT_RANGE) {
  const { note, bend } = bendFor(pitch, range);
  return [
    [status(0xe0, channel), bend & 0x7f, bend >> 7],
    [status(0x90, channel), note, clamp(Math.round(velocity), 1, 127)],
  ];
}

function noteOff(pitch, channel, range = DEFAULT_RANGE) {
  const { note } = bendFor(pitch, range);
  return [[status(0x80, channel), note, 0]];
}

// Gives each note its own MPE member channel (channels `first`-`last`, 1-16
// numbering): no two notes that overlap in time share one, so each note's bend
// is its own. A free channel is chosen least recently freed first, so a new
// note's bend doesn't land on the release tail of the note just ended. Notes
// beyond the free channels get null (PLAN.md 4.3: they go to the Hz voices).
// events: [{ t, dur }] in time order. Returns one channel (or null) per event.
function allocate(events, { first = 2, last = 16 } = {}) {
  const freedAt = new Map(); // channel -> when it was freed (-Infinity: never used)
  for (let ch = first; ch <= last; ch++) freedAt.set(ch, -Infinity);
  const busy = []; // [{ channel, end }]
  return events.map((e) => {
    for (let i = busy.length - 1; i >= 0; i--) {
      if (!time.lt(e.t, busy[i].end)) {
        freedAt.set(busy[i].channel, busy[i].end);
        busy.splice(i, 1);
      }
    }
    let channel = null;
    for (const [ch, freed] of freedAt) {
      if (busy.some((b) => b.channel === ch)) continue;
      if (channel === null || freed < freedAt.get(channel)) channel = ch;
    }
    if (channel !== null) busy.push({ channel, end: e.t + e.dur });
    return channel;
  });
}

exports.DEFAULT_RANGE = DEFAULT_RANGE;
exports.RANGES = RANGES;
exports.allocate = allocate;
exports.bendFor = bendFor;
exports.pitchOf = pitchOf;
exports.impliedRange = impliedRange;
exports.zoneConfig = zoneConfig;
exports.noteOn = noteOn;
exports.noteOff = noteOff;
