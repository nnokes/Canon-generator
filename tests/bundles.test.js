"use strict";
// The bundled scripts in patchers/scripts, loaded the way [v8] loads them.
const test = require("node:test");
const assert = require("node:assert/strict");

const { loadBundle, SimDict } = require("./max-sim");
const build = require("../tools/build");
const { hello } = require("cg-hello");
const spike = require("cg-spike");
const mpe = require("cg-mpe");

const select = (out, selector) => out.filter(([, s]) => s === selector).map(([, , ...rest]) => rest);

test("bundles in patchers/scripts are up to date with code/", () => {
  assert.deepEqual(build.check(), []);
});

test("each bundle exposes exactly its documented messages", () => {
  assert.deepEqual(loadBundle("cg.hello").handlers(), ["bang", "msg_int"]);
  assert.deepEqual(loadBundle("cg.spike").handlers(), [
    "dictvalues", "dictwrite", "fired", "measured", "mpeconfig", "mpenote", "mpeoff", "playerload", "tone",
  ]);
});

// One inlet and one outlet per [v8] wrapper (PLAN.md 2.4). If a script fails
// to load, [v8] keeps one inlet and one outlet and Max drops any other cords.
test("[v8] bundles have one inlet and one outlet", () => {
  for (const name of ["cg.hello", "cg.spike"]) {
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

test("cg.spike: tone, then the tracker's pitch comes back as a cents error", () => {
  const bundle = loadBundle("cg.spike");
  const [[, , hz, midi]] = bundle.send("tone");
  assert.ok(Math.abs(hz - 328.40145361845435) < 1e-9);
  const [[, selector, cents]] = bundle.send("measured", midi + 0.004);
  assert.equal(selector, "cents");
  assert.ok(Math.abs(cents - 0.4) < 1e-9);
});

test("cg.spike: MPE setup and the test note go out as raw bytes", () => {
  const bundle = loadBundle("cg.spike");
  const config = bundle.send("mpeconfig");
  assert.deepEqual(select(config, "midi"), mpe.zoneConfig());
  assert.equal(select(config, "status").length, 1);
  const note = select(bundle.send("mpenote"), "midi");
  assert.equal(note.length, 2);
  assert.equal(note[0][0], 0xe1); // bend on channel 2 first
  assert.equal(note[1][0], 0x91);
  assert.deepEqual(select(bundle.send("mpeoff"), "midi"), [[0x81, note[1][1], 0]]);
});

test("cg.spike: the player queue, then stats once the last onset is reported", () => {
  const bundle = loadBundle("cg.spike");
  const out = bundle.send("playerload", 30);
  const coll = select(out, "coll");
  assert.deepEqual(coll[0], ["clear"]);
  const rows = coll.slice(1);
  assert.equal(rows.length, 60);
  assert.deepEqual(rows.map(([index]) => index), [...Array(60).keys()]);
  assert.equal(rows.at(-1)[1], -1);

  // Replay the queue with a fake clock that is 0.25 ms late on every onset.
  const intended = spike.tempoCanon({ notes: 30 }).map((e) => e.t);
  let reply = [];
  intended.forEach((t, i) => {
    reply = bundle.send("fired", i, 5000 + t + (i ? 0.25 : 0));
  });
  const [[count, mean, max, last]] = select(reply, "stats");
  assert.equal(count, 60);
  assert.ok(Math.abs(max - 0.25) < 1e-9 && Math.abs(last - 0.25) < 1e-9 && mean > 0);
});

test("cg.spike: dict values written, read back through Max atoms, compared exactly", () => {
  const bundle = loadBundle("cg.spike");
  assert.deepEqual(bundle.send("dictwrite", 64), [[0, "dictready"]]);
  const values = new SimDict("cg.events").get("values");
  assert.equal(values.length, 64);
  assert.deepEqual(select(bundle.send("dictvalues", ...values), "dictcheck"), [[64, 64, 1, 0]]);
  const [[, , exact, maxAbs]] = select(bundle.send("dictvalues", ...values.map(Math.fround)), "dictcheck");
  assert.equal(exact, 0);
  assert.ok(maxAbs > 0);
});
