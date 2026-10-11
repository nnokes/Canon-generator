"use strict";
// The M0 spike helpers in code/lib/cg-spike.js.
const test = require("node:test");
const assert = require("node:assert/strict");

const spike = require("cg-spike");

test("tempo canon: sorted, two voices, follower faster and off the beat grid", () => {
  const events = spike.tempoCanon({ notes: 50 });
  assert.equal(events.length, 100);
  for (let i = 1; i < events.length; i++) assert.ok(events[i].t >= events[i - 1].t);
  const follower = events.filter((e) => e.voice === 1);
  assert.equal(follower.length, 50);
  // At sqrt(2):1 most follower onsets fall between 16th-note grid points.
  const offGrid = follower.filter((e) => Math.abs(e.t / 125 - Math.round(e.t / 125)) > 1e-6);
  assert.ok(offGrid.length > 40, `${offGrid.length} follower onsets off the 16th grid`);
  assert.deepEqual(spike.tempoCanon({ seed: 3 }), spike.tempoCanon({ seed: 3 }));
});

test("queue: deltas rebuild the onset times; the last row stops the chain", () => {
  const events = spike.tempoCanon({ notes: 20 });
  const rows = spike.queueRows(events);
  assert.equal(rows.at(-1).delta, -1);
  let t = events[0].t;
  for (let i = 0; i < rows.length - 1; i++) {
    assert.ok(rows[i].delta >= 0);
    t += rows[i].delta;
    assert.ok(Math.abs(t - events[i + 1].t) < 1e-9);
  }
});

test("jitter: a constant start offset is not jitter; a wobble is", () => {
  const near = (a, b) => Math.abs(a - b) < 1e-9;
  const intended = [0, 100, 250, 400];
  // Every onset 37 ms late, including the first: nothing at all.
  assert.deepEqual(spike.jitter(intended, intended.map((t) => t + 37)), { count: 4, offset: 0, jitter: 0, sd: 0, drift: 0 });
  // Onset 0 from a mouse click, the rest 2.3 ms later from the scheduler: offset only.
  const late = spike.jitter(intended, [1000, 1102.3, 1252.3, 1402.3]);
  assert.ok(near(late.offset, 2.3) && near(late.jitter, 0) && near(late.sd, 0) && near(late.drift, 0));
  // A real wobble: errors 2, 2.5, 1.5 around 2.
  const wobble = spike.jitter(intended, [0, 102, 252.5, 401.5]);
  assert.ok(near(wobble.offset, 2) && near(wobble.jitter, 0.5) && near(wobble.drift, -0.5));
  assert.ok(near(wobble.sd, Math.sqrt((0 + 0.25 + 0.25) / 3)));
  // Too few onsets to say anything.
  assert.deepEqual(spike.jitter([], []), { count: 0, offset: 0, jitter: 0, sd: 0, drift: 0 });
  assert.deepEqual(spike.jitter([5], [9]), { count: 1, offset: 0, jitter: 0, sd: 0, drift: 0 });
});

test("foldOctave: octave jumps fold away, the residual stays", () => {
  const near = (a, b) => Math.abs(a - b) < 1e-9;
  const cases = [
    [-1239.78, -39.78, -1],
    [-1200, 0, -1],
    [6.23, 6.23, 0],
    [650, -550, 1],
    [-600, -600, 0],
    [600, -600, 1],
    [2400.5, 0.5, 2],
  ];
  for (const [input, cents, octaves] of cases) {
    const f = spike.foldOctave(input);
    assert.ok(near(f.cents, cents), `${input}: residual ${f.cents}, expected ${cents}`);
    assert.equal(f.octaves, octaves, `${input}: octaves`);
    assert.ok(f.cents >= -600 && f.cents < 600);
  }
  assert.ok(Object.is(spike.foldOctave(-1).octaves, 0), "no -0 octave");
});

test("robustSummary: an octave-jumping tracker still gives the right median", () => {
  // Eight readings an octave low and two in place, all within a few cents of the pitch.
  const readings = [-1203, -1198, -1201, -1199, -1204, -1196, -1200, -1202, 1.5, -0.5];
  const s = spike.robustSummary(readings);
  assert.equal(s.n, 10);
  // Folded: -4 -3 -2 -1 -0.5 0 1 1.5 2 4, so the median is (-0.5 + 0) / 2.
  assert.ok(Math.abs(s.median - -0.25) < 1e-9, `median ${s.median}`);
  assert.equal(s.min, -4);
  assert.equal(s.max, 4);
  assert.deepEqual(s.octaves, { "-1": 8, 0: 2 });
  // Odd count: the middle value.
  assert.equal(spike.robustSummary([3, -1, 2]).median, 2);
  assert.deepEqual(spike.robustSummary([]), { n: 0, median: 0, min: 0, max: 0, octaves: {} });
});

test("cents error and dict value comparison", () => {
  assert.ok(Math.abs(spike.centsError(60, 60.013) - 1.3) < 1e-9);
  const values = spike.dictValues(256);
  assert.equal(values.length, 256);
  assert.deepEqual(spike.compareValues(values, values.slice()), { expected: 256, received: 256, exact: true, maxAbs: 0 });
  const rounded = values.map((v) => Math.fround(v)); // what a 32-bit float would keep
  const result = spike.compareValues(values, rounded);
  assert.equal(result.exact, false);
  assert.ok(result.maxAbs > 0);
});
