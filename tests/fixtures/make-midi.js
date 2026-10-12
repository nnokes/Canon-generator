#!/usr/bin/env node
"use strict";
// Writes the generated MIDI fixtures (M2 part E). Their contents are known
// exactly, so tests/midi.test.js can compare what the reader finds against
// tables of its own. Run: NODE_PATH=code/lib node tests/fixtures/make-midi.js
// (tests/fixtures/live-clip.mid is not generated: it was exported from Live.)

const fs = require("fs");
const path = require("path");
const io = require("cg-io");
const mpe = require("cg-mpe");

const PPQ = 480;
const on = (ch, key, vel = 96) => [0x90 | (ch - 1), key, vel];
const off = (ch, key) => [0x80 | (ch - 1), key, 64];
const bend = (ch, value) => [0xe0 | (ch - 1), value & 0x7f, value >> 7];
const cc = (ch, number, value) => [0xb0 | (ch - 1), number, value];
const rpn = (ch, lsb, value) => [cc(ch, 101, 0), cc(ch, 100, lsb), cc(ch, 6, value), cc(ch, 101, 127), cc(ch, 100, 127)];
const at = (tick, list) => list.map((data) => ({ tick, data }));
const beats = (b) => Math.round(b * PPQ);

// A melody as [pitch (float MIDI), beats] pairs, laid end to end on one channel.
// Off-grid pitches get a pitch bend first; `range` is the channel's bend range.
function melodyEvents(notes, ch, range, start = 0) {
  const events = [];
  let t = start;
  for (const [pitch, dur] of notes) {
    const { note, bend: value } = mpe.bendFor(pitch, range);
    events.push(...at(beats(t), [bend(ch, value), on(ch, note)]));
    events.push(...at(beats(t + dur), [off(ch, note)]));
    t += dur;
  }
  return events;
}

// 1. A 12-TET melody at 90 bpm, format 0.
const twelve = [[62, 1], [64, 0.5], [65, 0.5], [67, 1], [69, 1], [65, 2], [62, 2]];

// 2. A 31-EDO melody written with pitch bend (range set to 2 by RPN 0), format 1:
// a tempo track, then the melody. Steps of 31-EDO above D4.
const STEPS_31 = [0, 5, 8, 13, 18, 13, 10, 5, 0];
const thirtyOne = STEPS_31.map((s, i) => [62 + (s * 12) / 31, i === STEPS_31.length - 1 ? 2 : 1]);

// 3. MPE: a lower zone (MCM on channel 1, 3 members, so members default to +/-48),
// one note per member channel in rotation, quarter tones; the 4th note glides.
const mpeNotes = [[60, 1], [60.5, 1], [61.5, 1], [63, 2]];

// 4. Polyphonic, format 1: a melody track over a chord track.
//   melody: E4 (beats 0-2), then G4 (2-3) and A4 (3-4), plus a grace C5 at 1.5-2.5 (overlap)
//   chords: C3+G3 at 0-4 (a chord under everything)
const polyMelody = [
  ...at(0, [on(1, 64)]), ...at(beats(2), [off(1, 64), on(1, 67)]), ...at(beats(3), [off(1, 67), on(1, 69)]),
  ...at(beats(4), [off(1, 69)]), ...at(beats(1.5), [on(1, 72)]), ...at(beats(2.5), [off(1, 72)]),
];
const polyChords = [...at(0, [on(2, 48), on(2, 55)]), ...at(beats(4), [off(2, 48), off(2, 55)])];

const FILES = {
  "melody-12tet.mid": { ppq: PPQ, tracks: [{ name: "melody", events: [{ tick: 0, data: io.tempoEvent(90) }, ...melodyEvents(twelve, 1, 2)] }] },
  "melody-31edo-bend.mid": {
    ppq: PPQ,
    tracks: [
      { name: "tempo", events: [{ tick: 0, data: io.tempoEvent(72) }] },
      { name: "31-EDO melody", events: [...at(0, rpn(1, 0, 2)), ...melodyEvents(thirtyOne, 1, 2)] },
    ],
  },
  "melody-mpe.mid": {
    ppq: PPQ,
    tracks: [{
      name: "mpe",
      events: [
        ...at(0, rpn(1, 6, 3)),
        ...mpeNotes.flatMap(([pitch, dur], i) => melodyEvents([[pitch, dur]], 2 + (i % 3), 48, i)),
        // The 4th note (key 63 on channel 2, from beat 3) glides up a semitone halfway through.
        { tick: beats(4), data: bend(2, Math.round(8192 + 8192 / 48)) },
      ],
    }],
  },
  "polyphonic.mid": { ppq: PPQ, tracks: [{ name: "melody", events: polyMelody }, { name: "chords", events: polyChords }] },
};

if (require.main === module) {
  for (const [name, file] of Object.entries(FILES)) {
    fs.writeFileSync(path.join(__dirname, name), io.writeMidi(file));
    console.log("wrote tests/fixtures/" + name);
  }
}

module.exports = { FILES, thirtyOne, twelve, mpeNotes };
