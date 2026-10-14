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
const mpe = require("cg-mpe");
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
    "delay", "info", "interval", "loadmidi", "loadspec", "midiline", "midimap", "midiquantize", "miditrack",
    "output", "passes", "preset", "presetmelody", "presets", "register", "render", "savespec", "select", "tempo", "timescale",
    "transform", "tuning", "tunings",
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

test("cg.canon: loadmidi puts your melody into every canon, and the options re-read it", () => {
  const bundle = loadBundle("cg.canon");
  bundle.send("preset", 0); // the round: four voices, one section apart
  const out = bundle.send("loadmidi", path.join(FIXTURES, "live-clip.mid"));
  assert.deepEqual(errors(out), []);
  const [, report] = select(out, "status");
  assert.equal(report.join(" "),
    "midi live-clip.mid: 13 notes, 0 rests, 16 beats, line top, map exact, quantize 0, dropped 0, cut 0, glides 0, trimmed 0, no tempo in the file (kept 100 bpm)");
  // The first voice plays the clip: C4 for 1.5 beats at 100 bpm, then D4.
  const queue = rows(out);
  assert.ok(Math.abs(queue[0][2] - tuning.midiToHz(60)) < 1e-9);
  assert.ok(Math.abs(queue[0][5] - 1.5 * 600) < 1e-9, "1.5 beats at 100 bpm");
  // Saved specs carry the notes, not the file.
  const os = require("os");
  const fs = require("fs");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cg-midi-"));
  bundle.send("savespec", path.join(dir, "clip.json"));
  const saved = JSON.parse(fs.readFileSync(path.join(dir, "clip.json"), "utf8"));
  assert.equal(saved.dux.from, "live-clip.mid");
  assert.equal(saved.dux.notes.length, 13);
  fs.rmSync(dir, { recursive: true });

  // A file with a tempo sets it; a group preset gets the melody in every canon.
  bundle.send("preset", 3); // the Goldberg ladder: nine canons
  const ladder = bundle.send("loadmidi", path.join(FIXTURES, "melody-12tet.mid"));
  assert.match(select(ladder, "status")[1].join(" "), /tempo 90 bpm/);
  assert.deepEqual(select(ladder, "bpm"), [[90]]);

  // Options: by name or menu index; a bad one changes nothing.
  bundle.send("loadmidi", path.join(FIXTURES, "polyphonic.mid"));
  assert.match(select(bundle.send("midiline", 1), "status")[1].join(" "), /1 notes, .*line bottom/);
  assert.match(select(bundle.send("midiline", "top"), "status")[1].join(" "), /4 notes, .*line top/);
  assert.match(select(bundle.send("miditrack", 1), "status")[1].join(" "), /line top/);
  assert.match(select(bundle.send("midimap", 1), "status")[1].join(" "), /map nearest/);
  assert.match(select(bundle.send("midiquantize", 0.5), "status")[1].join(" "), /quantize 0.5/);
  assert.match(errors(bundle.send("midiline", "middle"))[0], /line must be one of top bottom track/);
  assert.match(errors(bundle.send("miditrack", 7))[0], /no notes found/);
  assert.match(select(bundle.send("midiline", 0), "status")[1].join(" "), /line top/, "track 7 was refused; track 1 stayed");
  assert.match(errors(bundle.send("loadmidi", path.join(FIXTURES, "ji-major.scl")))[0], /not a MIDI file/);
});

test("cg.canon: your melody stays across presets; tuning re-maps it; presetmelody brings the presets' own back", () => {
  const bundle = loadBundle("cg.canon");
  const melody = (out) => select(out, "melody");
  // A preset with no file: the preset's own melody.
  assert.deepEqual(melody(bundle.send("preset", 0)), [["preset", library.names()[0]]]);
  assert.deepEqual(melody(bundle.send("loadmidi", path.join(FIXTURES, "live-clip.mid"))), [["live-clip.mid"]]);

  // The ladder keeps the clip: nine canons of 13 notes each, plus the 72-note ground.
  const ladder = bundle.send("preset", 3);
  assert.deepEqual(errors(ladder), []);
  assert.deepEqual(melody(ladder), [["live-clip.mid"]]);
  assert.equal(rows(ladder).length, 9 * 2 * 13 + 72);
  assert.deepEqual(select(ladder, "menu"), [["set", 3]]);
  assert.ok(select(ladder, "status").some((line) => line.join(" ") === `midi kept: live-clip.mid as the dux of ${library.names()[3]}`));

  // map nearest, then a tuning change re-maps: the same clip snapped to 31-EDO D Dorian.
  bundle.send("preset", 0);
  bundle.send("midimap", "nearest");
  const twelve = rows(bundle.send("render")).map((r) => r[2]);
  const dorian = bundle.send("tuning", 5);
  assert.deepEqual(melody(dorian), [["live-clip.mid"]]);
  const d31 = tuning.edo(31, { ref: { step: 0, midi: 62 }, mode: [0, 5, 8, 13, 18, 23, 26] });
  const firstHz = rows(dorian)[0][2];
  assert.ok(Math.abs(firstHz - tuning.degreeToHz(d31, tuning.quantize(d31, 60).degree)) < 1e-9, "C4 snapped into 31-EDO D Dorian");
  assert.notDeepEqual(rows(dorian).map((r) => r[2]), twelve);

  // presetmelody: the round's own melody, in the tuning chosen.
  const own = bundle.send("presetmelody");
  assert.deepEqual(melody(own), [["preset", library.names()[0]]]);
  assert.equal(rows(own).length, 256, "Frere Jacques again: 4 voices x 32 notes x 2 passes");
  assert.deepEqual(melody(bundle.send("preset", 1)), [["preset", library.names()[1]]], "no file any more");

  // loadspec: the spec's melody; a spec saved with the clip names it.
  const os = require("os");
  const fs = require("fs");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cg-melody-"));
  bundle.send("loadmidi", path.join(FIXTURES, "live-clip.mid"));
  bundle.send("savespec", path.join(dir, "with-clip.json"));
  bundle.send("presetmelody"); // the double canon's own melodies (preset 1 is current)
  bundle.send("savespec", path.join(dir, "double.json"));
  assert.deepEqual(melody(bundle.send("loadspec", path.join(dir, "with-clip.json"))), [["live-clip.mid"]]);
  assert.deepEqual(melody(bundle.send("loadspec", path.join(dir, "double.json"))), [["spec", library.names()[1]]]);
  const kept = bundle.send("presetmelody");
  assert.match(select(kept, "status")[0].join(" "), /came from a file/);
  fs.rmSync(dir, { recursive: true });
});

// ---------------------------------------------------------------- MPE out and the check (M2 part F)

test("cg.canon: output drift sends the gate, the zone setup, then MPE rows a Max [pipe] can time", () => {
  const bundle = loadBundle("cg.canon");
  bundle.send("preset", 0);
  const out = bundle.send("output", "drift");
  assert.deepEqual(errors(out), []);
  const order = out.map(([, selector]) => selector);
  assert.ok(order.indexOf("panic") < order.indexOf("mpeto"), "panic to the old destination before the switch");
  assert.ok(order.indexOf("mpeto") < order.indexOf("midi"), "the gate is set before the zone setup goes through it");
  assert.deepEqual(select(out, "mpeto"), [[1]], "1: Drift");
  assert.deepEqual(select(out, "midi"), mpe.zoneConfig(), "the lower zone, +/-48, before the notes");
  const queue = rows(out);
  const expected = canonEngine.render(library.preset(0)).events;
  assert.equal(queue.length, expected.length);
  const channels = mpe.allocate(expected);
  queue.forEach(([, , kind, ms, ...bytes], k) => {
    assert.equal(kind, "mpe", `row ${k}`);
    assert.equal(bytes.length, 9);
    const e = expected[k];
    assert.ok(Math.abs(ms - e.dur * 600) < 1e-9, "the note's length, for [pipe]");
    assert.deepEqual(bytes, [...mpe.noteOn(e.pitch, e.vel, channels[k]).flat(), ...mpe.noteOff(e.pitch, channels[k]).flat()]);
  });
  assert.equal(select(out, "status").at(-1).join(" "), "mpe: 256 notes on 15 channels (2-16, bend +/-48) to Drift");
});

test("cg.canon: one MPE destination at a time: Drift, MIDI out, or the Hz voices", () => {
  const bundle = loadBundle("cg.canon");
  bundle.send("preset", 0);
  // MIDI out: the same rows, the gate to 2.
  const midiOut = bundle.send("output", 2);
  assert.deepEqual(select(midiOut, "mpeto"), [[2]], "2: MIDI out");
  assert.match(select(midiOut, "status").at(-1).join(" "), /to MIDI out$/);
  // "mpe" means Drift.
  assert.deepEqual(select(bundle.send("output", "mpe"), "mpeto"), [[1]]);
  // The Hz voices: panic for whatever was sounding, no gate, no zone setup, plain rows.
  const hz = bundle.send("output", "hz");
  assert.deepEqual(select(hz, "panic"), [[]]);
  assert.deepEqual(select(hz, "mpeto"), []);
  assert.deepEqual(select(hz, "midi"), []);
  assert.ok(rows(hz).every((r) => typeof r[2] === "number"));
  // A bad value is refused, before any panic.
  const bad = bundle.send("output", "osc");
  assert.match(errors(bad)[0], /output must be one of hz drift midi/);
  assert.deepEqual(select(bad, "panic"), []);
  // The destination is kept in a saved spec.
  const os = require("os");
  const fs = require("fs");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cg-mpeto-"));
  bundle.send("output", "midi");
  bundle.send("savespec", path.join(dir, "midi.json"));
  bundle.send("output", "hz");
  const loaded = bundle.send("loadspec", path.join(dir, "midi.json"));
  fs.rmSync(dir, { recursive: true });
  assert.deepEqual(select(loaded, "mpeto"), [[2]]);
});

test("cg.canon: more than 15 MPE notes at once: the rest go to the Hz voices, and it says so", () => {
  const os = require("os");
  const fs = require("fs");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cg-chord-"));
  const file = path.join(dir, "chord.json");
  // 17 voices in unison: 17 notes at once.
  fs.writeFileSync(file, JSON.stringify({
    name: "17 at once", dux: { source: "list", notes: [{ dur: 1, degree: 0 }] },
    voices: Array.from({ length: 17 }, (_, k) => ({ name: `v${k}`, interval: k, out: "mpe" })),
  }));
  const bundle = loadBundle("cg.canon");
  const out = bundle.send("loadspec", file);
  fs.rmSync(dir, { recursive: true });
  const queue = rows(out);
  assert.equal(queue.filter((r) => r[2] === "mpe").length, 15);
  assert.equal(queue.filter((r) => typeof r[2] === "number").length, 2);
  assert.match(select(out, "status").at(-1).join(" "), /2 beyond 15 at once went to the Hz voices/);
});

test("cg.mpecheck: zone, a held note, and a summary with the bend range Drift applied", () => {
  const bundle = loadBundle("cg.mpecheck");
  assert.deepEqual(bundle.handlers(), ["measuredhz", "note", "off", "zone"]);
  assert.deepEqual(select(bundle.send("zone"), "midi"), mpe.zoneConfig());
  const on = bundle.send("note", 64.5);
  assert.deepEqual(select(on, "midi"), mpe.noteOn(64.5, 100, 2));
  assert.deepEqual(select(on, "status")[0].slice(0, 9), ["mpe", "note", "ch", 2, "note", 65, "bend", 8107, "pitch"]);
  // Ten readings: eight an octave low (Drift's rich sound), all at the pitch a
  // +/-48 synth sounds for this bend. The summary folds the octaves away.
  const { note, bend } = mpe.bendFor(64.5);
  const sounded = mpe.pitchOf(note, bend, 48);
  const summaries = [];
  for (let i = 0; i < 10; i++) {
    const out = bundle.send("measuredhz", tuning.midiToHz(sounded - (i < 8 ? 12 : 0)));
    summaries.push(...select(out, "status"));
  }
  assert.equal(summaries.length, 1);
  const line = summaries[0];
  assert.deepEqual(line.slice(line.indexOf("periods") + 1, line.indexOf("periods") + 3), ["-1:8", "0:2"]);
  assert.ok(Math.abs(line[line.indexOf("median") + 1]) < 0.5, "within half a cent");
  assert.ok(Math.abs(line.at(-1) - 48) < 0.5, `implied bend range ${line.at(-1)}`);
  // A synth stuck at +/-2 would read near 2.
  bundle.send("note", 64.5);
  let stuck = null;
  for (let i = 0; i < 10; i++) stuck = select(bundle.send("measuredhz", tuning.midiToHz(mpe.pitchOf(note, bend, 2))), "status")[0] || stuck;
  assert.ok(Math.abs(stuck.at(-1) - 2) < 0.5, `implied bend range ${stuck.at(-1)}`);
  assert.deepEqual(select(bundle.send("off"), "midi"), mpe.noteOff(64.5, 2));
  assert.deepEqual(bundle.send("measuredhz", 440), [], "no note: no reading");
});
