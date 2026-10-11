"use strict";
// MPE output maths (MIDI Polyphonic Expression, lower zone). Each voice gets
// its own member channel, and its microtonal offset travels as per-channel
// pitch bend. The bend range is +/-48 semitones, the value Live 12's tuning
// system expects (PLAN.md 4.3), which gives 96/16384 semitones, about 0.59
// cents, per bend step.
//
// Everything here returns raw MIDI bytes for [midiout]. The engine computes
// the bytes ahead of time; Max sends them (JS never schedules notes).

const DEFAULT_RANGE = 48;
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
// sent with `bend`: about 48 if it honoured our setup, 2 if it kept the MIDI
// default. NaN when the bend is centred (nothing to infer from).
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

exports.DEFAULT_RANGE = DEFAULT_RANGE;
exports.bendFor = bendFor;
exports.pitchOf = pitchOf;
exports.impliedRange = impliedRange;
exports.zoneConfig = zoneConfig;
exports.noteOn = noteOn;
exports.noteOff = noteOff;
