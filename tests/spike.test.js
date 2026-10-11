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

test("jitter: ignores a constant start-up offset, reports the worst error", () => {
  const intended = [0, 100, 250, 400];
  assert.deepEqual(spike.jitter(intended, intended.map((t) => t + 37)), { count: 4, meanAbs: 0, maxAbs: 0, last: 0 });
  const stats = spike.jitter(intended, [1000, 1101, 1249, 1400.5]);
  assert.equal(stats.count, 4);
  assert.ok(Math.abs(stats.maxAbs - 1) < 1e-9);
  assert.ok(Math.abs(stats.last - 0.5) < 1e-9);
  assert.deepEqual(spike.jitter([], []), { count: 0, meanAbs: 0, maxAbs: 0, last: 0 });
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
