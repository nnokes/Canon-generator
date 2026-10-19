"use strict";
// M3 part F: the piano roll's layout (cg-roll). The [v8ui] only draws what
// layout() returns, so here is where the roll is checked: where each note sits,
// its colour, where the markers point, the dissonance curve.
const test = require("node:test");
const assert = require("node:assert/strict");

const roll = require("cg-roll");
const presets = require("cg-presets");
const canon = require("cg-canon");
const analyze = require("cg-analyze");
const scales = require("cg-scales");

const SIZE = { width: 800, height: 260 };
const of = (out, role) => out.items.filter((i) => i.role === role);

// Two voices over two 4/4 bars; voice 1 enters at beat 2, a quarter tone up.
const view = {
  name: "test",
  voices: [{ name: "dux" }, { name: "comes" }],
  meter: { beats: 4, strong: [0] },
  events: [
    { t: 0, dur: 2, pitch: 60, voice: 0 }, { t: 2, dur: 2, pitch: 62, voice: 0 }, { t: 4, dur: 4, pitch: 64, voice: 0 },
    { t: 2, dur: 2, pitch: 67, voice: 1 }, { t: 4, dur: 2, pitch: 64.5, voice: 1 }, { t: 6, dur: 2, pitch: 65, voice: 1 },
  ],
};

test("notes: one rectangle each, in its voice's colour; time left to right, pitch upward, microtones exactly", () => {
  const notes = of(roll.layout(view, SIZE), "note");
  assert.equal(notes.length, 6);
  assert.deepEqual(notes.map((n) => n.color), [0, 0, 0, 1, 1, 1].map((v) => roll.VOICE_COLORS[v]));
  assert.notDeepEqual(roll.VOICE_COLORS[0], roll.VOICE_COLORS[1]);
  const [c, d, e, g, eHalf, f] = notes;
  assert.ok(c.x < d.x && d.x < e.x, "later notes sit further right");
  assert.ok(c.x >= 0 && f.x + f.w <= SIZE.width, "inside the box");
  assert.ok(g.y < e.y, "higher pitches sit higher");
  // 64.5 sits exactly halfway between 64 and 65.
  assert.ok(Math.abs(eHalf.y - (e.y + f.y) / 2) < 1e-9);
  // A note's width follows its duration (minus a 1 px gap).
  assert.ok(Math.abs((e.w + 1) - 2 * (d.w + 1)) < 1e-9);
});

test("bar lines from the meter, numbered; a pitch guide at each period from middle C", () => {
  const out = roll.layout(view, SIZE);
  const bars = of(out, "bar");
  assert.equal(bars.length, 3, "the start, bar 2, and the end");
  assert.ok(Math.abs(bars[1].x1 - (bars[0].x1 + bars[2].x1) / 2) < 1e-9);
  assert.deepEqual(of(out, "barnumber").map((b) => b.text), ["1", "2"]);
  const guides = of(out, "guide");
  assert.equal(guides.length, 1, "one C (60) in the range 58-69");
  assert.equal(guides[0].y1, of(out, "note")[0].y + of(out, "note")[0].h / 2, "on the C");
  // In Bohlen-Pierce the period is a tritave: no guide in this range but the C.
  assert.equal(of(roll.layout({ ...view, period: 1901.955 }, SIZE), "guide").length, 1);
});

test("markers: on each named voice's note at the violation's time, red for a fault, amber for a soft rule", () => {
  const report = {
    profile: "canon", model: "fux12", hard: 1, cost: 1,
    violations: [
      { t: 4, bar: 2, beat: 0, rule: "parallel-perfect", voices: [0, 1], hard: true },
      { t: 6, bar: 2, beat: 2, rule: "hidden-perfect", voices: [1], hard: false },
      { t: 0, bar: 1, beat: 0, rule: "mode-final", voices: [], hard: true },
    ],
    curve: [],
  };
  const out = roll.layout({ ...view, report }, SIZE);
  const notes = of(out, "note");
  const marks = of(out, "marker");
  assert.equal(marks.length, 4);
  const [onDux, onComes, soft, edge] = marks;
  const centre = (n) => n.y + n.h / 2;
  assert.equal(onDux.x, notes[2].x, "at t = 4");
  assert.equal(onDux.y, centre(notes[2]), "on the dux's E");
  assert.equal(onComes.y, centre(notes[4]), "on the comes's quarter-tone E");
  assert.deepEqual([onDux.color, soft.color], [roll.FAULT, roll.SOFT]);
  assert.ok(edge.y < notes.reduce((m, n) => Math.min(m, n.y), Infinity), "no voice: the top edge");
  // A click names it; far from any marker, nothing.
  assert.equal(roll.hit(out.markers, onDux.x + 2, onDux.y - 2), "bar 2 beat 1: parallel-perfect / dux and comes (fault)");
  assert.equal(roll.hit(out.markers, onDux.x + 40, onDux.y), null);
  assert.match(of(out, "caption")[0].text, /^test: canon rules: 1 fault \/ cost 1 \/ click a marker/);
});

test("the dissonance curve: a step per slice inside its strip, labelled with the model", () => {
  const report = { profile: "free", model: "roughness", hard: 0, cost: 0, violations: [],
    curve: [{ t: 0, score: 0 }, { t: 2, score: 0.4 }, { t: 4, score: 0.1 }] };
  const out = roll.layout({ ...view, report }, SIZE);
  const [curve] = of(out, "curve");
  assert.equal(curve.points.length, 6, "two points per slice: held until the next");
  for (const [px, py] of curve.points) {
    assert.ok(px >= 0 && px <= SIZE.width && py <= SIZE.height && py >= SIZE.height - 48, `${px}, ${py}`);
  }
  assert.ok(curve.points[2][1] < curve.points[0][1], "the rougher slice draws higher");
  assert.equal(curve.points[5][0], of(out, "note")[5].x + of(out, "note")[5].w + 1, "the last step runs to the end");
  assert.match(of(out, "curvelabel")[0].text, /roughness score, top = 0.4/);
});

test("the playhead, a caption that can be replaced, and an empty roll", () => {
  const out = roll.layout({ ...view, playhead: 4, caption: "clicked" }, SIZE);
  const [line] = of(out, "playhead");
  assert.equal(line.x1, of(out, "note")[2].x);
  assert.equal(of(out, "caption")[0].text, "clicked");
  assert.deepEqual(of(roll.layout({ ...view, playhead: -1 }, SIZE), "playhead"), []);
  const empty = roll.layout({ events: [] }, SIZE);
  assert.deepEqual(of(empty, "caption").map((c) => c.text), ["nothing rendered yet"]);
  assert.deepEqual(of(empty, "note"), []);
});

test("the round, analyzed: every note and marker inside the roll, one marker per violation and voice", () => {
  const spec = presets.preset(0);
  const rendered = canon.render(spec);
  const report = analyze.analyze(rendered, { system: scales.fromSpec(spec.system), meter: spec.meter, profile: "canon" });
  const out = roll.layout({
    events: rendered.events, voices: rendered.voices, meter: report.meter, period: report.metrics.period,
    report: { ...report, curve: report.metrics.dissonance.points },
  }, SIZE);
  assert.equal(of(out, "note").length, rendered.events.length);
  for (const item of [...of(out, "note"), ...of(out, "marker")]) {
    assert.ok(item.x >= 0 && item.x <= SIZE.width && item.y >= 0 && item.y <= SIZE.height, JSON.stringify(item));
  }
  assert.ok(of(out, "marker").length >= report.violations.length);
  assert.equal(of(out, "marker").filter((m) => m.hard).length > 0, report.hard > 0);
});
