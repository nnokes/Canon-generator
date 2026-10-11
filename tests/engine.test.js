"use strict";
// The M0 engine modules: RNG, version, tuning conversions, MPE bytes, hello.
const test = require("node:test");
const assert = require("node:assert/strict");

const rng = require("cg-rng");
const tuning = require("cg-tuning");
const mpe = require("cg-mpe");
const { hello, testNote } = require("cg-hello");
const { VERSION } = require("cg-version");
const pkg = require("../package.json");

const near = (actual, expected, tolerance, label) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual} is not within ${tolerance} of ${expected}`);

test("the engine version matches package.json", () => {
  assert.equal(VERSION, pkg.version);
});

test("rng: the same seed gives the same sequence; ints stay in range", () => {
  const a = rng.create(42);
  const b = rng.create(42);
  for (let i = 0; i < 100; i++) assert.equal(a.next(), b.next());
  const r = rng.create(7);
  for (let i = 0; i < 1000; i++) {
    const n = r.int(10);
    assert.ok(Number.isInteger(n) && n >= 0 && n < 10);
  }
  assert.throws(() => rng.create(NaN));
});

test("tuning: MIDI and Hz convert both ways, including microtones", () => {
  near(tuning.midiToHz(69), 440, 1e-9, "A4");
  near(tuning.midiToHz(60), 261.6255653005986, 1e-9, "C4");
  near(tuning.midiToHz(69.5), 440 * Math.pow(2, 1 / 24), 1e-9, "quarter-tone above A4");
  for (const p of [0, 21.37, 60, 63.9354838, 127.5]) near(tuning.hzToMidi(tuning.midiToHz(p)), p, 1e-9, `round trip ${p}`);
  near(tuning.midiToHz(60, { midi: 60, hz: 256 }), 256, 1e-12, "custom reference");
});

test("tuning: EDO steps and cents", () => {
  near(tuning.edoPitch(12, 7, 60), 67, 1e-12, "12-EDO fifth");
  near(tuning.edoPitch(31, 31, 60), 72, 1e-12, "31 steps of 31-EDO is an octave");
  near(tuning.cents(60, tuning.edoPitch(31, 18, 60)), (18 * 1200) / 31, 1e-9, "31-EDO fifth in cents");
  near(tuning.edoPitch(24, -1, 60), 59.5, 1e-12, "a quarter-tone down");
  assert.throws(() => tuning.edoPitch(0, 1, 60));
});

test("hello: deterministic, with the 31-EDO test note five steps above D4", () => {
  assert.deepEqual(hello(1), hello(1));
  assert.notDeepEqual(hello(1).check, hello(2).check);
  const note = testNote();
  near(note.midi, 62 + 60 / 31, 1e-12, "test note pitch");
  near(note.hz, 293.6647679174076 * Math.pow(2, 5 / 31), 1e-9, "test note Hz");
});

test("mpe: bend reaches every pitch within 0.6 cents at +/-48", () => {
  const stepCents = (96 / 16384) * 100;
  for (let p = 36; p <= 96; p += 0.0137) {
    const { note, bend } = mpe.bendFor(p);
    assert.ok(Number.isInteger(note) && note >= 0 && note <= 127);
    assert.ok(Number.isInteger(bend) && bend >= 0 && bend <= 16383);
    near((mpe.pitchOf(note, bend) - p) * 100, 0, stepCents / 2 + 1e-9, `pitch ${p}`);
  }
  assert.deepEqual(mpe.bendFor(60), { note: 60, bend: 8192 });
});

test("mpe: the bend range a synth used can be read back from the pitch it sounded", () => {
  const { note, bend } = mpe.bendFor(64.5);
  // Bend steps are whole numbers, so the read-back is within half a semitone of 48.
  near(mpe.impliedRange(64.5, note, bend), 48, 0.5, "synth honoured +/-48");
  near(mpe.impliedRange(mpe.pitchOf(note, bend, 2), note, bend), 2, 1e-9, "synth kept +/-2");
  assert.ok(Number.isNaN(mpe.impliedRange(60, 60, 8192)));
});

test("mpe: zone setup is RPN 6 on channel 1, then RPN 0 = 48 on channels 2-16", () => {
  const messages = mpe.zoneConfig();
  assert.equal(messages.length, 6 * 16);
  for (const m of messages) assert.ok(m.length === 3 && m.every((b) => Number.isInteger(b) && b >= 0 && b <= 255));
  assert.deepEqual(messages.slice(0, 4), [[0xb0, 101, 0], [0xb0, 100, 6], [0xb0, 6, 15], [0xb0, 38, 0]]);
  assert.deepEqual(messages.slice(6, 10), [[0xb1, 101, 0], [0xb1, 100, 0], [0xb1, 6, 48], [0xb1, 38, 0]]);
  assert.deepEqual(messages.slice(-4), [[0xbf, 6, 48], [0xbf, 38, 0], [0xbf, 101, 127], [0xbf, 100, 127]]);
  assert.throws(() => mpe.zoneConfig({ members: 16 }));
});

test("mpe: note-on sends the bend before the note; note-off matches the note", () => {
  const [bend, on] = mpe.noteOn(63.935483870967744, 100, 2);
  const expected = mpe.bendFor(63.935483870967744);
  assert.deepEqual(bend, [0xe1, expected.bend & 0x7f, expected.bend >> 7]);
  assert.deepEqual(on, [0x91, expected.note, 100]);
  assert.deepEqual(mpe.noteOff(63.935483870967744, 2), [[0x81, expected.note, 0]]);
  assert.throws(() => mpe.noteOn(60, 100, 17));
});
