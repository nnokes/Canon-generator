"use strict";
// Time is in float beats (a quarter note is 1.0). Irrational tempo ratios
// rule out integer ticks, so every comparison of times goes through a
// tolerance (PLAN.md 3.1, after Callender).

const EPS = 1e-9;

const eq = (a, b) => Math.abs(a - b) <= EPS;
const lt = (a, b) => a < b - EPS;
const le = (a, b) => a <= b + EPS;

// Events in time order; simultaneous ones by voice, then pitch.
function compareEvents(a, b) {
  if (lt(a.t, b.t)) return -1;
  if (lt(b.t, a.t)) return 1;
  return a.voice - b.voice || a.pitch - b.pitch;
}

function sortEvents(events) {
  return events.slice().sort(compareEvents);
}

exports.EPS = EPS;
exports.eq = eq;
exports.lt = lt;
exports.le = le;
exports.compareEvents = compareEvents;
exports.sortEvents = sortEvents;
