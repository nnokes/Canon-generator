"use strict";
// Seeded pseudo-random numbers (mulberry32, ported from nnokes/cento). The same
// seed gives the same sequence in Node and in [v8], so any canon can be reproduced.

function mulberry32(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// create(seed) -> { next(): float in [0, 1), int(n): integer in [0, n), pick(list) }
function create(seed) {
  if (!Number.isFinite(seed)) throw new Error("rng seed must be a number, got " + seed);
  const next = mulberry32(Math.trunc(seed));
  return {
    next,
    int(n) {
      return Math.floor(next() * n);
    },
    pick(list) {
      return list[Math.floor(next() * list.length)];
    },
  };
}

exports.create = create;
