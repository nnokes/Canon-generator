"use strict";
// The bundled scripts in patchers/, loaded the way [v8] loads them.
const test = require("node:test");
const assert = require("node:assert/strict");

const fs = require("fs");
const path = require("path");

const { loadBundle } = require("./max-sim");
const build = require("../tools/build");
const { hello } = require("cg-hello");

// Every bundle in patchers/, so each new wrapper is checked without listing it here.
const BUNDLES = fs.readdirSync(path.join(__dirname, "..", "patchers"))
  .filter((file) => file.endsWith(".bundle.js"))
  .map((file) => file.replace(/\.bundle\.js$/, ""));

test("bundles in patchers/ are up to date with code/", () => {
  assert.deepEqual(build.check(), []);
});

test("each bundle exposes exactly its documented messages", () => {
  assert.deepEqual(loadBundle("cg.hello").handlers(), ["bang", "msg_int"]);
});

// One inlet and one outlet per [v8] wrapper (PLAN.md 2.4). If a script fails
// to load, [v8] keeps one inlet and one outlet and Max drops any other cords.
test("[v8] bundles have one inlet and one outlet", () => {
  assert.ok(BUNDLES.includes("cg.hello"), `bundles found: ${BUNDLES}`);
  for (const name of BUNDLES) {
    const { context } = loadBundle(name);
    assert.deepEqual([context.inlets, context.outlets, context.autowatch], [1, 1, 1], name);
  }
});

test("cg.hello answers like the library, in Max's atom order", () => {
  const h = hello(5);
  const [[outletIndex, ...atoms]] = loadBundle("cg.hello").send("msg_int", 5);
  assert.equal(outletIndex, 0);
  assert.deepEqual(atoms, ["hello", h.name, h.version, "seed", 5, "check", ...h.check, "note", h.note.midi, h.note.hz]);
});
