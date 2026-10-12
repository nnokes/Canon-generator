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

// ---------------------------------------------------------------- cg.tuning (M1)

const tuning = require("cg-tuning");
const scales = require("cg-scales");
const FIXTURES = path.join(__dirname, "fixtures");
const select = (out, selector) => out.filter(([, s]) => s === selector).map(([, , ...rest]) => rest);
const errors = (out) => select(out, "error").map(([message]) => message);

test("cg.tuning exposes exactly its documented messages", () => {
  assert.deepEqual(loadBundle("cg.tuning").handlers(), [
    "hold", "info", "key", "load", "measuredhz", "mode", "play", "ref", "refhz", "silence", "starter", "starters", "system",
  ]);
});

test("cg.tuning: the chooser lists every starter; picking one announces it", () => {
  const bundle = loadBundle("cg.tuning");
  const menu = select(bundle.send("starters"), "menu");
  assert.deepEqual(menu[0], ["clear"]);
  assert.deepEqual(menu.slice(1), scales.names().map((name) => ["append", name]));

  const out = bundle.send("starter", 5); // 31-EDO D Dorian
  assert.deepEqual(select(out, "menu"), [["set", 5]]);
  assert.deepEqual(select(out, "runmax"), [[7]], "one period up and down: degrees 0-7");
  const [status] = select(out, "status");
  assert.equal(status[0], "31-EDO D Dorian:");
  assert.deepEqual(errors(bundle.send("starter", 99)), ["no starter system 99 (0-19)"]);
});

test("cg.tuning: a note is a frequency, one envelope list for [line~], and a readout", () => {
  const bundle = loadBundle("cg.tuning");
  bundle.send("starter", 5);
  const system = scales.starter(5);
  const out = bundle.send("play", 1); // E, 6.45 cents flat
  assert.deepEqual(out.map(([, selector]) => selector), ["freq", "amp", "readout"]);
  const [[hz]] = select(out, "freq");
  assert.ok(Math.abs(hz - tuning.degreeToHz(system, 1)) < 1e-9);
  assert.deepEqual(select(out, "amp"), [[0.2, 10, 0.2, 400, 0, 200]]);
  const [readout] = select(out, "readout");
  assert.deepEqual(readout.filter((a) => typeof a === "string"), ["degree", "hz", "midi", "cents12"]);
  assert.ok(Math.abs(readout[7] - -6.451612903) < 1e-6, `cents from 12-TET: ${readout[7]}`);
  // Keyboard key 60 is degree 0, so key 61 plays degree 1.
  assert.deepEqual(select(bundle.send("key", 61), "freq"), [[hz]]);
  // A held note (to measure) has no release; silence fades it.
  assert.deepEqual(select(bundle.send("hold", 1), "amp"), [[0.2, 20]]);
  assert.deepEqual(bundle.send("silence"), [[0, "amp", 0, 80]]);
});

test("cg.tuning: 'system' builds each kind; mistakes come back as errors", () => {
  const bundle = loadBundle("cg.tuning");
  const runmax = (...message) => select(bundle.send("system", ...message), "runmax")[0];
  assert.deepEqual(runmax("edo", 19), [19]);
  assert.deepEqual(runmax("ed", 13, 1901.955), [13]);
  assert.deepEqual(runmax("bp"), [13]);
  assert.deepEqual(runmax("ji", "9/8", "5/4", "3/2", "2/1"), [4]);
  assert.deepEqual(runmax("me", 31, 7), [7]);
  assert.deepEqual(runmax("harmonic", 1, 16, 55), [15], "non-repeating: degrees 0-15");
  assert.deepEqual(runmax("subharmonic", 1, 8, 880), [7]);
  assert.deepEqual(runmax("stretched", 1, 12, 55, 1.02), [11]);
  assert.deepEqual(runmax("fm", 440, 311.127, 3), [6]);
  assert.deepEqual(runmax("hz", 110, 220, 264, 330), [3]);
  assert.match(errors(bundle.send("system", "pythagorean"))[0], /unknown system "pythagorean"/);
  assert.match(errors(bundle.send("system", "edo", 0))[0], /at least 1/);
  // Playing past the end of a non-repeating system is an error, not a crash.
  bundle.send("system", "harmonic", 1, 16, 55);
  assert.match(errors(bundle.send("play", 16))[0], /outside its 16 degrees/);
});

test("cg.tuning: mode and reference pitch", () => {
  const bundle = loadBundle("cg.tuning");
  bundle.send("system", "edo", 12);
  assert.deepEqual(select(bundle.send("mode", 0, 2, 4, 5, 7, 9, 11), "runmax"), [[7]]);
  const [[c5]] = select(bundle.send("play", 7), "freq");
  assert.ok(Math.abs(c5 - tuning.midiToHz(72)) < 1e-9, "degree 7 of the major mode on C4 is C5");
  bundle.send("ref", 62);
  const [[d4]] = select(bundle.send("play", 0), "freq");
  assert.ok(Math.abs(d4 - tuning.midiToHz(62)) < 1e-9);
  bundle.send("refhz", 432);
  assert.ok(Math.abs(select(bundle.send("play", 0), "freq")[0][0] - 432) < 1e-9);
  assert.deepEqual(select(bundle.send("mode"), "runmax"), [[12]], "no steps: every step again");
  assert.match(errors(bundle.send("mode", 0, 12))[0], /isn't a step/);
});

test("cg.tuning: load reads a .scl file by full path through Max's File", () => {
  const bundle = loadBundle("cg.tuning");
  const out = bundle.send("load", path.join(FIXTURES, "meantone-quarter-comma.scl"));
  assert.deepEqual(errors(out), []);
  const [read, announced] = select(out, "status");
  assert.deepEqual(read, ["file", "read:", 17, "lines,", "first:", "! meantone-quarter-comma.scl"]);
  assert.equal(announced[0], "1/4-comma meantone, 12 notes from C:");
  // Degree 0 is C4; degree 7 is the quarter-comma fifth above it.
  const [[g]] = select(bundle.send("play", 7), "freq");
  assert.ok(Math.abs(g - tuning.midiToHz(60) * Math.pow(2, 696.578 / 1200)) < 1e-9);

  // CRLF line endings come through.
  const messy = bundle.send("load", path.join(FIXTURES, "messy.scl"));
  assert.deepEqual(errors(messy), []);
  assert.equal(select(messy, "status")[1][0], "Messy but valid:");
  assert.match(errors(bundle.send("load", path.join(FIXTURES, "missing.scl")))[0], /can't open/);
});

test("cg.tuning: pitch readings against the held note, summarized every 10", () => {
  const bundle = loadBundle("cg.tuning");
  bundle.send("starter", 0);
  const [[hz]] = select(bundle.send("hold", 9), "freq"); // A4
  assert.ok(Math.abs(hz - 440) < 1e-9);
  // Two readings an octave low (the tracker's mistake), eight 0.5 cents sharp.
  const summaries = [];
  for (let i = 0; i < 10; i++) {
    const sharp = hz * Math.pow(2, 0.5 / 1200);
    const out = bundle.send("measuredhz", i < 2 ? sharp / 2 : sharp);
    assert.equal(select(out, "cents").length, 1);
    summaries.push(...select(out, "status"));
  }
  assert.equal(summaries.length, 1);
  const [label, , n, , median, , , , , periods, ...counts] = summaries[0];
  assert.deepEqual([label, n, periods, counts], ["cents", 10, "periods", ["-1:2", "0:8"]]);
  assert.ok(Math.abs(median - 0.5) < 1e-9, `median ${median}`);
  assert.deepEqual(bundle.send("measuredhz", 0), [], "no pitch: no reply");
});

// ---------------------------------------------------------------- cg.canon (M2)

const canonEngine = require("cg-canon");
const library = require("cg-presets");
const { SimDict } = require("./max-sim");
const rows = (out) => select(out, "coll").filter((r) => r[0] !== "clear");

test("cg.canon exposes exactly its documented messages", () => {
  assert.deepEqual(loadBundle("cg.canon").handlers(), [
    "delay", "info", "interval", "loadspec", "passes", "preset", "presets", "register", "render", "savespec",
    "select", "tempo", "timescale", "transform", "tuning", "tunings",
  ]);
});

test("cg.canon: the menus, then a preset fills the player's queue", () => {
  const bundle = loadBundle("cg.canon");
  assert.deepEqual(select(bundle.send("presets"), "menu").slice(1), library.names().map((n) => ["append", n]));
  assert.equal(select(bundle.send("tunings"), "tmenu").length, 1 + scales.count);

  const out = bundle.send("preset", 0);
  const expected = canonEngine.render(library.preset(0));
  assert.deepEqual(select(out, "coll")[0], ["clear"]);
  const queue = rows(out);
  assert.equal(queue.length, expected.events.length);
  // Row i: index, ms to the next note, Hz, gain L, gain R, total ms, envelope pairs.
  const ms = 60000 / expected.tempo;
  let clock = 0;
  queue.forEach(([i, delta, hz, gl, gr, total, ...envelope], k) => {
    const e = expected.events[k];
    assert.equal(i, k);
    assert.ok(Math.abs(clock - e.t * ms) < 1e-6, `row ${k} starts at its time`);
    assert.ok(Math.abs(hz - tuning.midiToHz(e.pitch)) < 1e-9);
    assert.ok(Math.abs(gl * gl + gr * gr - 1) < 1e-12, "equal-power pan");
    assert.ok(Math.abs(total - e.dur * ms) < 1e-9);
    assert.equal(envelope.length, 6);
    assert.ok(Math.abs(envelope[1] + envelope[3] + envelope[5] - total) < 1e-9, "the envelope lasts the note");
    clock += delta;
  });
  assert.equal(queue.at(-1)[1], -1, "the last row stops the chain");
  assert.deepEqual(select(out, "bpm"), [[100]]);
  assert.deepEqual(select(out, "editor"), [[0, "voice 1", 0, 0, 0, 1, 0, 2]]);
  assert.match(select(out, "status")[0].join(" "), /4 voices, 256 notes, 88 beats at 100 bpm/);
  // The events are in the named dict too, for whatever else reads them.
  assert.equal(new SimDict("cg.events").get("events").length, expected.events.length);
});

test("cg.canon: the voice editor changes one voice and re-renders; a bad edit changes nothing", () => {
  const bundle = loadBundle("cg.canon");
  bundle.send("preset", 0);
  assert.deepEqual(select(bundle.send("select", 1), "editor"), [[1, "voice 2", 8, 0, 0, 1, 0, 2]]);
  const before = rows(bundle.send("render"));
  // Voice 2 inverted around its first note (C): its D becomes a B.
  const inverted = rows(bundle.send("transform", 1));
  assert.deepEqual(select(bundle.send("select", 1), "editor")[0].slice(4, 5), [1]);
  assert.notDeepEqual(inverted, before);
  const spec = library.preset(0);
  spec.voices[1].transform = "I";
  assert.equal(inverted.length, canonEngine.render(spec).events.length);
  // A time scale of 0 is refused, and the queue stays as it was.
  const refused = bundle.send("timescale", 0);
  assert.deepEqual(errors(refused), ["time scale must be above 0, got 0"]);
  assert.deepEqual(rows(refused), []);
  assert.deepEqual(rows(bundle.send("render")), inverted);
  // Other fields.
  for (const [message, value] of [["delay", 4], ["interval", 2], ["timescale", 2], ["register", -1], ["passes", 1]]) {
    assert.deepEqual(errors(bundle.send(message, value)), [], message);
  }
  assert.deepEqual(select(bundle.send("select", 1), "editor"), [[1, "voice 2", 4, 2, 1, 2, -1, 1]]);
  assert.match(errors(bundle.send("select", 9))[0], /no canon voice 9/);
});

test("cg.canon: the tuning menu plays the canon in another system; tempo rescales the queue", () => {
  const bundle = loadBundle("cg.canon");
  const twelve = rows(bundle.send("preset", 0));
  const thirtyOne = rows(bundle.send("tuning", 4)); // 31-EDO, every step
  assert.notDeepEqual(thirtyOne.map((r) => r[2]), twelve.map((r) => r[2]));
  assert.ok(Math.abs(thirtyOne[1][2] - tuning.midiToHz(60 + 12 / 31)) < 1e-9, "degree 1 is one 31-EDO step");
  const faster = rows(bundle.send("tempo", 200));
  assert.ok(Math.abs(faster[0][1] - thirtyOne[0][1] / 2) < 1e-9, "twice the tempo, half the delay");
  assert.match(errors(bundle.send("tuning", 99))[0], /no starter system 99/);
});

test("cg.canon: save then load gives the same canon", () => {
  const os = require("os");
  const fs = require("fs");
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "cg-spec-")), "my canon.json");
  const bundle = loadBundle("cg.canon");
  bundle.send("preset", 4);
  bundle.send("select", 1);
  bundle.send("delay", 3);
  const edited = rows(bundle.send("render"));
  assert.deepEqual(select(bundle.send("savespec", file), "status"), [["saved", file]]);
  assert.equal(JSON.parse(fs.readFileSync(file, "utf8")).voices[1].delay, 3);
  bundle.send("preset", 0);
  assert.deepEqual(rows(bundle.send("loadspec", file)), edited);
  fs.rmSync(path.dirname(file), { recursive: true });
  assert.match(errors(bundle.send("loadspec", file))[0], /can't open/);
});
