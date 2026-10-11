"use strict";
// M0 spike: proves the same code gives the same answer in Node and in Max.
// "check" is four seeded random numbers, so any difference between
// environments shows up at once; "note" is the microtonal test note the
// output spike plays (31-EDO, five steps above D4).

const rng = require("cg-rng");
const tuning = require("cg-tuning");
const { VERSION } = require("cg-version");

const TEST_NOTE = { divisions: 31, step: 5, baseMidi: 62 };

function testNote() {
  const midi = tuning.edoPitch(TEST_NOTE.divisions, TEST_NOTE.step, TEST_NOTE.baseMidi);
  return { ...TEST_NOTE, midi, hz: tuning.midiToHz(midi) };
}

function hello(seed) {
  const random = rng.create(seed);
  const check = [];
  for (let i = 0; i < 4; i++) check.push(random.int(1000));
  return { name: "canon-generator", version: VERSION, seed, check, note: testNote() };
}

exports.hello = hello;
exports.testNote = testNote;
