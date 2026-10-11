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
    "dictvalues", "dictwrite", "fired", "measuredhz", "mpeconfig", "mpenote", "mpeoff", "playerload", "silence", "tone",
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

test("cg.spike: tone fades in, then the tracker's Hz comes back as a cents error", () => {
  const bundle = loadBundle("cg.spike");
  const out = bundle.send("tone");
  // The gain ramps up before the frequency arrives (no click), and 'silence' ramps it down.
  assert.deepEqual(out.map(([, selector]) => selector), ["amp", "tone"]);
  assert.deepEqual(select(out, "amp"), [[0.1, 20]]);
  assert.deepEqual(bundle.send("silence"), [[0, "amp", 0, 50]]);
  const [[hz]] = select(out, "tone");
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
  const [[hz]] = select(bundle.send("tone"), "tone");
  // 0.4 cents sharp, then 9 more readings from -0.5 to +0.3 cents.
  const cents = [0.4, -0.5, -0.4, -0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3];
  const summaries = [];
  cents.forEach((c, i) => {
    const out = bundle.send("measuredhz", hz * Math.pow(2, c / 1200));
    assert.equal(select(out, "cents").length, 1, `reading ${i} reaches the number box`);
    summaries.push(...select(out, "status"));
  });
  assert.equal(summaries.length, 1);
  assert.equal(summaries[0].length, 9, "no bend-range field for the sine");
  const [label, , n, , mean, , min, , max] = summaries[0];
  assert.equal(label, "cents");
  assert.equal(n, 10);
  assert.ok(Math.abs(mean - cents.reduce((a, b) => a + b) / 10) < 1e-9);
  assert.ok(Math.abs(min + 0.5) < 1e-9 && Math.abs(max - 0.4) < 1e-9);
  // The next batch starts fresh; 'tone' also starts a fresh batch.
  assert.deepEqual(select(bundle.send("measuredhz", hz), "status"), []);
});

test("cg.spike: MPE setup, then notes as raw bytes with a status line", () => {
  const bundle = loadBundle("cg.spike");
  const config = bundle.send("mpeconfig");
  assert.deepEqual(select(config, "midi"), mpe.zoneConfig());
  assert.equal(select(config, "status").length, 1);

  for (const pitch of [undefined, 64.5]) {
    const out = pitch === undefined ? bundle.send("mpenote") : bundle.send("mpenote", pitch);
    const p = pitch === undefined ? hello(1).note.midi : pitch;
    // The sine fades first, so the tracker hears the synth; then bend, note-on, status.
    assert.deepEqual(out.map(([, selector]) => selector), ["amp", "midi", "midi", "status"]);
    assert.deepEqual(select(out, "amp"), [[0, 50]]);
    assert.deepEqual(select(out, "midi"), mpe.noteOn(p, 100, 2));
    const { note, bend } = mpe.bendFor(p);
    const [status] = select(out, "status");
    assert.deepEqual(status.slice(0, 9), ["mpe", "note", "ch", 2, "note", note, "bend", bend, "pitch"]);
    assert.equal(status[9], p);
    // Note-off matches the note that's sounding.
    const off = bundle.send("mpeoff");
    assert.deepEqual(select(off, "midi"), mpe.noteOff(p, 2));
    assert.deepEqual(select(off, "status"), [["mpe", "note", "off"]]);
  }
});

test("cg.spike: the MPE summary reports the bend range the synth actually applied", () => {
  const { midiToHz } = require("cg-tuning");
  const readRange = (soundedPitch) => {
    const bundle = loadBundle("cg.spike");
    bundle.send("mpenote", 64.5);
    let summary = null;
    for (let i = 0; i < 10; i++) {
      const [line] = select(bundle.send("measuredhz", midiToHz(soundedPitch)), "status");
      if (line) summary = line;
    }
    assert.deepEqual(summary.slice(9, 12), ["implied", "bend", "range"]);
    return summary[12];
  };
  const { note, bend } = mpe.bendFor(64.5);
  // A synth honouring our +/-48 sounds 64.5; one stuck at +/-2 sounds about F4 -2 cents.
  assert.ok(Math.abs(readRange(64.5) - 48) < 0.5);
  assert.ok(Math.abs(readRange(mpe.pitchOf(note, bend, 2)) - 2) < 1e-6);
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
  // Onset 0 on time, every later one 0.25 ms late: an offset, no jitter, no drift.
  const [[count, , offset, , jitter, , sd, , drift]] = select(reply, "stats");
  assert.equal(count, 60);
  assert.deepEqual(select(reply, "stats")[0].filter((a) => typeof a === "string"), ["offset", "jitter", "sd", "drift"]);
  assert.ok(Math.abs(offset - 0.25) < 1e-9);
  assert.ok(jitter < 1e-9 && sd < 1e-9 && Math.abs(drift) < 1e-9);
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
