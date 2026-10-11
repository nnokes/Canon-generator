"use strict";
// The bundled scripts in patchers/, loaded the way [v8] loads them.
const test = require("node:test");
const assert = require("node:assert/strict");

const { loadBundle, SimDict } = require("./max-sim");
const build = require("../tools/build");
const { hello } = require("cg-hello");
const spike = require("cg-spike");
const mpe = require("cg-mpe");

const select = (out, selector) => out.filter(([, s]) => s === selector).map(([, , ...rest]) => rest);

test("bundles in patchers/ are up to date with code/", () => {
  assert.deepEqual(build.check(), []);
});

test("each bundle exposes exactly its documented messages", () => {
  assert.deepEqual(loadBundle("cg.hello").handlers(), ["bang", "msg_int"]);
  assert.deepEqual(loadBundle("cg.spike").handlers(), [
    "dictvalues", "dictwrite", "fired", "measuredhz", "mpeconfig", "mpenote", "mpeoff", "playerload", "tone",
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

test("cg.spike: tone, then the tracker's Hz comes back as a cents error", () => {
  const bundle = loadBundle("cg.spike");
  const [[, , hz]] = bundle.send("tone");
  assert.ok(Math.abs(hz - 328.40145361845435) < 1e-9);
  const [[, selector, cents]] = bundle.send("measuredhz", hz * Math.pow(2, 0.4 / 1200));
  assert.equal(selector, "cents");
  assert.ok(Math.abs(cents - 0.4) < 1e-9);
  // No pitch detected (silence, audio off): no reply.
  assert.deepEqual(bundle.send("measuredhz", 0), []);
  assert.deepEqual(bundle.send("measuredhz", -1), []);
});

test("cg.spike: every 10 readings, a cents summary goes to the Max window", () => {
  const bundle = loadBundle("cg.spike");
  const [[, , hz]] = bundle.send("tone");
  // 0.4 cents sharp, then 9 more readings from -0.5 to +0.3 cents.
  const cents = [0.4, -0.5, -0.4, -0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3];
  const summaries = [];
  cents.forEach((c, i) => {
    const out = bundle.send("measuredhz", hz * Math.pow(2, c / 1200));
    assert.equal(select(out, "cents").length, 1, `reading ${i} reaches the number box`);
    summaries.push(...select(out, "status"));
  });
  assert.equal(summaries.length, 1);
  const [label, , n, , mean, , min, , max] = summaries[0];
  assert.equal(label, "cents");
  assert.equal(n, 10);
  assert.ok(Math.abs(mean - cents.reduce((a, b) => a + b) / 10) < 1e-9);
  assert.ok(Math.abs(min + 0.5) < 1e-9 && Math.abs(max - 0.4) < 1e-9);
  // The next batch starts fresh; 'tone' also starts a fresh batch.
  assert.deepEqual(select(bundle.send("measuredhz", hz), "status"), []);
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

test("cg.spike: the player queue, progress while it plays, then stats", () => {
  const bundle = loadBundle("cg.spike");
  const out = bundle.send("playerload", 30);
  const coll = select(out, "coll");
  assert.deepEqual(coll[0], ["clear"]);
  const rows = coll.slice(1);
  assert.equal(rows.length, 60);
  assert.deepEqual(rows.map(([index]) => index), [...Array(60).keys()]);
  assert.equal(rows.at(-1)[1], -1);

  // The load line says how long until the stats appear.
  const intended = spike.tempoCanon({ notes: 30 }).map((e) => e.t);
  const seconds = Math.round((intended.at(-1) - intended[0]) / 1000);
  const [loaded] = select(out, "status");
  assert.deepEqual(loaded, ["queue", "loaded:", 60, "events,", "stats", "in", "about", seconds, "s", "after", "go"]);

  // Replay the queue with a fake clock that is 0.25 ms late on every onset.
  const statuses = [];
  let reply = [];
  intended.forEach((t, i) => {
    reply = bundle.send("fired", i, 5000 + t + (i ? 0.25 : 0));
    statuses.push(...select(reply, "status"));
  });
  assert.deepEqual(statuses, [["playing"], ["progress", 50, "of", 60]]);
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
