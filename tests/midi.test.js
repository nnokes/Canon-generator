"use strict";
// M2 part E: reading MIDI files into a dux melody (code/lib/cg-io.js).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const io = require("cg-io");
const mpe = require("cg-mpe");
const tuning = require("cg-tuning");
const fixtures = require("./fixtures/make-midi");

const FIXTURES = path.join(__dirname, "fixtures");
const read = (name) => io.parseMidi(fs.readFileSync(path.join(FIXTURES, name)));
const near = (a, b, tol, label) => assert.ok(Math.abs(a - b) <= tol, `${label}: ${a} is not within ${tol} of ${b}`);
const show = (notes) => notes.map((n) => (n.rest ? `r:${n.dur}` : `${n.pitch !== undefined ? n.pitch : `d${n.degree}`}:${n.dur}`));

test("bytes written by hand: running status, note-on velocity 0, sysex and an unknown chunk skipped", () => {
  const bytes = [
    0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, 0, 96, // MThd, format 0, 1 track, 96 PPQ
    0x58, 0x58, 0x58, 0x58, 0, 0, 0, 2, 0xab, 0xcd, // an unknown chunk, skipped
    0x4d, 0x54, 0x72, 0x6b, 0, 0, 0, 31, // MTrk, 31 bytes
    0x00, 0xff, 0x51, 0x03, 0x07, 0xa1, 0x20, // tempo 500000 us = 120 bpm
    0x00, 0xf0, 0x03, 0x7e, 0x7f, 0xf7, // sysex, skipped
    0x00, 0x90, 60, 100, // C4 on
    0x60, 62, 100, // 96 ticks later, D4 on (running status)
    0x00, 60, 0, // C4 off (velocity 0, running status)
    0x83, 0x00, 62, 0, // 384 ticks later (a two-byte time), D4 off
    0x00, 0xff, 0x2f, 0x00, // end of track
  ];
  const parsed = io.parseMidi(bytes);
  assert.equal(parsed.format, 0);
  assert.equal(parsed.ppq, 96);
  assert.deepEqual(parsed.tempos, [{ beat: 0, bpm: 120 }]);
  assert.deepEqual(parsed.notes.map((n) => [n.pitch, n.start, n.end, n.channel]), [[60, 0, 1, 1], [62, 1, 5, 1]]);
  assert.deepEqual(parsed.warnings, []);
});

test("your Live clip: 13 notes, 16 beats, no tempo in the file", () => {
  const parsed = read("live-clip.mid");
  assert.equal(parsed.format, 0);
  assert.equal(parsed.ppq, 96);
  assert.deepEqual(parsed.tracks, [{ index: 0, name: "" }]);
  assert.deepEqual(parsed.meters, [{ beat: 0, numerator: 4, denominator: 4 }, { beat: 0, numerator: 4, denominator: 4 }]);
  assert.deepEqual(parsed.tempos, [], "Live wrote no tempo event");
  assert.deepEqual(parsed.notes.map((n) => n.pitch), [60, 62, 64, 65, 67, 62, 65, 69, 67, 71, 69, 74, 72]);
  assert.deepEqual(parsed.notes.map((n) => n.end - n.start), [1.5, 0.5, 1.5, 0.5, 1, 2.5, 0.5, 1.5, 0.5, 1.5, 0.5, 2, 2]);
  assert.ok(parsed.notes.every((n) => n.vel === 100 && !n.glide));
  // Live writes the next note-on before the previous note-off at the same tick
  // (beats 5, 9.5, 11.5, 14). Touching notes don't overlap, so none is lost.
  for (const line of ["top", "bottom", "track"]) {
    const { notes, report } = io.melodyFromMidi(parsed, { line });
    assert.equal(notes.length, 13, line);
    assert.deepEqual([report.dropped, report.cut, report.rests, report.beats, report.tempo], [0, 0, 0, 16, null], line);
  }
});

test("a 12-TET melody: pitches, beats and the tempo", () => {
  const parsed = read("melody-12tet.mid");
  assert.deepEqual(parsed.notes.map((n) => [n.pitch, n.end - n.start]), fixtures.twelve);
  const { report } = io.melodyFromMidi(parsed);
  assert.equal(report.tempo, 90, "90 bpm, to 0.001 bpm");
  assert.deepEqual(report.tracks, ["melody"]);
});

test("a 31-EDO melody written with pitch bend (RPN 0 = 2 semitones) comes in exact", () => {
  const parsed = read("melody-31edo-bend.mid");
  assert.equal(parsed.format, 1);
  assert.deepEqual(parsed.tracks.map((t) => t.name), ["tempo", "31-EDO melody"]);
  parsed.notes.forEach((n, i) => {
    const [pitch, dur] = fixtures.thirtyOne[i];
    const { note, bend } = mpe.bendFor(pitch, 2);
    near(n.pitch, mpe.pitchOf(note, bend, 2), 1e-12, `note ${i}: exactly the bent pitch`);
    near(n.pitch, pitch, 0.025 / 100, `note ${i}: within 0.025 cents of 31-EDO`);
    assert.equal(n.end - n.start, dur);
  });
  // Read as degrees of 31-EDO on D4, the steps come back.
  const system = tuning.edo(31, { ref: { step: 0, midi: 62 } });
  const { notes } = io.melodyFromMidi(parsed, { map: "nearest", system });
  assert.deepEqual(notes.map((n) => n.degree), [0, 5, 8, 13, 18, 13, 10, 5, 0]);
});

test("MPE: a declared zone gives member channels +/-48; a bend under a note is a glide", () => {
  const parsed = read("melody-mpe.mid");
  assert.deepEqual(parsed.notes.map((n) => n.channel), [2, 3, 4, 2]);
  parsed.notes.forEach((n, i) => {
    const [pitch] = fixtures.mpeNotes[i];
    near(n.pitch, pitch, 0.6 / 100, `note ${i}: within 0.6 cents (the +/-48 resolution)`);
  });
  assert.deepEqual(parsed.notes.map((n) => n.glide), [false, false, false, true]);
  const { notes, report } = io.melodyFromMidi(parsed);
  assert.equal(report.glides, 1);
  near(notes[3].pitch, 63, 1e-9, "a glide keeps its starting pitch");
});

test("a polyphonic file: the top line is the skyline; bottom; track; one track only", () => {
  const parsed = read("polyphonic.mid");
  assert.deepEqual(parsed.tracks.map((t) => t.name), ["melody", "chords"]);
  // melody: E4 0-2, C5 1.5-2.5, G4 2-3, A4 3-4; chords: C3+G3 0-4.
  const top = io.melodyFromMidi(parsed, { line: "top" });
  assert.deepEqual(show(top.notes), ["64:1.5", "72:1", "67:0.5", "69:1"], "G4 comes back when C5 ends");
  assert.deepEqual([top.report.dropped, top.report.cut], [2, 2], "the chord is never heard; E4 and G4 are heard in part");
  const bottom = io.melodyFromMidi(parsed, { line: "bottom" });
  assert.deepEqual(show(bottom.notes), ["48:4"]);
  const track = io.melodyFromMidi(parsed, { line: "track", track: 0 });
  assert.deepEqual(show(track.notes), ["64:1.5", "72:0.5", "67:1", "69:1"], "each note cuts the one before");
  const chords = io.melodyFromMidi(parsed, { line: "track", track: 1 });
  assert.deepEqual(show(chords.notes), ["55:4"], "a chord keeps its highest note");
  assert.equal(chords.report.dropped, 1);
  assert.throws(() => io.melodyFromMidi(parsed, { channel: 9 }), /no notes found/);
});

test("rests, leading silence, quantize, and the three pitch maps", () => {
  const on = (key) => [0x90, key, 90];
  const off = (key) => [0x80, key, 0];
  const at = (beat, data) => ({ tick: Math.round(beat * 480), data });
  const file = io.writeMidi({
    ppq: 480,
    tracks: [{
      events: [
        at(2, on(60)), at(2.975, off(60)), // starts after 2 beats of silence; ends a little early
        at(4, on(61)), at(4.5, off(61)), // a gap of about 1 beat before it
        at(4.5, on(63)), at(4.52, off(63)), // a sliver that quantizes away
        at(5, on(64)), at(6, off(64)),
      ],
    }],
  });
  const parsed = io.parseMidi(file);
  const exact = io.melodyFromMidi(parsed);
  assert.equal(exact.report.trimmed, 2, "leading silence trimmed");
  assert.equal(exact.notes[1].rest, true, "gaps become rests");
  near(exact.notes[1].dur, 4 - 2.975, 1e-9, "the gap");

  const snapped = io.melodyFromMidi(parsed, { quantize: 0.5 });
  assert.deepEqual(show(snapped.notes), ["60:1", "r:1", "61:0.5", "r:0.5", "64:1"]);
  assert.equal(snapped.report.quantizeDropped, 1);

  // nearest: snapped onto C major; degree: semitones of 12-EDO read as 31-EDO steps.
  const major = tuning.edo(12, { mode: [0, 2, 4, 5, 7, 9, 11], ref: { step: 0, midi: 60 } });
  const nearest = io.melodyFromMidi(parsed, { quantize: 0.5, map: "nearest", system: major });
  assert.deepEqual(nearest.notes.filter((n) => !n.rest).map((n) => n.degree), [0, 0, 2], "C# goes down to C (ties go down)");
  const degree = io.melodyFromMidi(parsed, { quantize: 0.5, map: "degree", system: tuning.edo(31) });
  assert.deepEqual(degree.notes.filter((n) => !n.rest).map((n) => n.degree), [0, 1, 4]);
  assert.throws(() => io.melodyFromMidi(parsed, { map: "nearest" }), /needs the target scale system/);
  assert.throws(() => io.melodyFromMidi(parsed, { line: "middle" }), /top, bottom or track/);
});

test("files the reader refuses, with a reason", () => {
  assert.throws(() => io.parseMidi([1, 2, 3]), /not a MIDI file/);
  const header = (format, division) => [0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, format, 0, 1, division >> 8, division & 0xff];
  assert.throws(() => io.parseMidi([...header(0, 0xe728), 0x4d, 0x54, 0x72, 0x6b, 0, 0, 0, 0]), /SMPTE/);
  assert.throws(() => io.parseMidi([...header(2, 96), 0x4d, 0x54, 0x72, 0x6b, 0, 0, 0, 0]), /format 2/);
  assert.throws(() => io.parseMidi([...header(0, 96), 0x4d, 0x54, 0x72, 0x6b, 0, 0, 0, 2, 0x00, 0x90]), /ends in the middle/);
});

test("writeMidi round-trips through parseMidi, long times included", () => {
  const file = io.writeMidi({
    ppq: 960,
    tracks: [{ name: "long", events: [{ tick: 0, data: [0x90, 60, 80] }, { tick: 960 * 300, data: [0x80, 60, 0] }] }],
  });
  const parsed = io.parseMidi(file);
  assert.deepEqual(parsed.notes.map((n) => [n.pitch, n.start, n.end]), [[60, 0, 300]]);
  assert.equal(parsed.tracks[0].name, "long");
});

test("the generated fixtures are what tests/fixtures/make-midi.js writes", () => {
  for (const [name, file] of Object.entries(fixtures.FILES)) {
    assert.deepEqual(fs.readFileSync(path.join(FIXTURES, name)), Buffer.from(io.writeMidi(file)), `${name}: rerun make-midi.js`);
  }
});
