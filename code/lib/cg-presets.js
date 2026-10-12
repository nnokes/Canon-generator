"use strict";
// The M2 presets (PLAN.md 5): canon specs as code, built into the bundle so
// Max needs no data folder (PLAN.md 2.2). Melodies are ours unless named.

// "0 1 2:2 r:1 -3:0.5" -> notes: a degree, an optional ":beats" (default `dur`),
// "r" for a rest. "|" marks bars for reading and is ignored.
function melody(text, dur = 1) {
  return text.trim().split(/\s+/).filter((token) => token !== "|").map((token) => {
    const [what, beats] = token.split(":");
    const length = beats === undefined ? dur : Number(beats);
    return what === "r" ? { dur: length, rest: true } : { dur: length, degree: Number(what) };
  });
}

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const DORIAN = [0, 2, 3, 5, 7, 9, 10];
const AEOLIAN = [0, 2, 3, 5, 7, 8, 10];
// 31-EDO's meantone minor: steps 5 3 5 5 3 5 5.
const MINOR_31 = [0, 5, 8, 13, 18, 21, 26];
const NAMES = ["unison", "second", "third", "fourth", "fifth", "sixth", "seventh", "octave", "ninth"];

// 1. A 4-voice round on "Frere Jacques" (traditional): four 2-bar sections,
// each voice entering one section after the last, twice through.
const round = {
  name: "4-voice round (Frere Jacques)",
  tempo: 100,
  system: { type: "edo", divisions: 12, mode: MAJOR, ref: { step: 0, midi: 60 } },
  dux: {
    source: "list",
    notes: melody(`
      0 1 2 0 | 0 1 2 0 |
      2 3 4:2 | 2 3 4:2 |
      4:0.5 5:0.5 4:0.5 3:0.5 2 0 | 4:0.5 5:0.5 4:0.5 3:0.5 2 0 |
      0 -3 0:2 | 0 -3 0:2`),
  },
  voices: [0, 1, 2, 3].map((k) => ({ name: `voice ${k + 1}`, delay: 8 * k, loop: 2 })),
};

// 2. A double canon in the layout of Palestrina's Ex. 225 (Mann p. 242): five
// voices, a 2-voice canon and a 3-voice canon sounding together, then a free
// cadence after the strict canon (Mann's "free addition"). The layout is
// Palestrina's; the melodies, intervals and delays are ours.
const doubleCanon = {
  name: "Double canon (layout of Palestrina, Mann Ex. 225)",
  tempo: 120,
  system: { type: "edo", divisions: 12, mode: DORIAN, ref: { step: 0, midi: 62 } },
  groups: [
    {
      name: "upper canon (2 voices)",
      dux: { source: "list", notes: melody("7:4 6:2 5:2 4:2 5:2 6:2 7:2 | 8:4 7:2 6:2 5:4 4:4 | 3:2 4:2 5:4 4:4 r:4", 1) },
      voices: [{ name: "cantus" }, { name: "altus", delay: 4, interval: -4 }],
    },
    {
      name: "lower canon (3 voices)",
      dux: { source: "list", notes: melody("r:2 0:4 1:2 2:2 3:4 2:2 1:2 | 0:4 -1:2 0:2 1:4 2:4 | 1:2 0:2 -1:4 0:4", 1) },
      voices: [
        { name: "tenor" },
        { name: "baritone", delay: 6, interval: -4 },
        { name: "bassus", delay: 12, interval: -7 },
      ],
    },
  ],
  ending: { kind: "free-cadence", formula: "7-6|8", final: 0, dur: 2 },
};

// 3. A Part-style prolation canon (after Cantus in Memoriam Benjamin
// Britten): a descending A-minor scale that adds a step each phrase, in four
// voices at speeds 1:2:4:8, each an octave lower than the last. The faster
// voices repeat, so all four span the same time.
const prolation = {
  name: "Prolation canon 1:2:4:8 (after Part)",
  tempo: 120,
  system: { type: "edo", divisions: 12, mode: AEOLIAN, ref: { step: 0, midi: 69 } },
  dux: {
    source: "list",
    notes: melody("0:2 0:2 -1:1 0:2 -1:1 -2:2 0:1 -1:2 -2:1 -3:2 0:1 -1:2 -2:1 -3:2 -4:4"),
  },
  voices: [1, 2, 4, 8].map((s, k) => ({
    name: `1:${s}`, delay: k, timeScale: s, register: 1 - k, loop: 8 / s,
  })),
};

// 4. A Goldberg-style ladder: canons at the unison, second, ... ninth in turn,
// one every four bars, over the first eight notes of the Goldberg ground
// (Bach, BWV 988 / 1087): G F# E D B C D G.
const ladder = {
  name: "Goldberg-style ladder (unison to ninth)",
  tempo: 90,
  system: { type: "edo", divisions: 12, mode: MAJOR, ref: { step: 0, midi: 67 } },
  groups: NAMES.map((name, k) => ({
    name: `canon at the ${name}`,
    start: 16 * k,
    dux: { source: "list", notes: melody("0 1 2 0 | 4:2 3 2 | 1 2 1 0") },
    voices: [{ name: `dux (${name})` }, { name: `comes at the ${name}`, delay: 4, interval: k }],
  })),
  free: [{ name: "ground", notes: melody("0:2 -1:2 -2:2 -3:2 -5:2 -4:2 -3:2 -7:2"), loop: 9, register: -1 }],
};

// 5. A spiral canon in 31-EDO (per tonos, after Bach's Musical Offering): a
// canon at the fifth that rises a meantone whole tone (5 of 31 steps) on each
// pass. In 12-TET six whole tones make an octave and Bach's spiral closes; here
// the seventh pass starts 30 steps up, a diesis (38.7 c) short of the octave,
// so the spiral never closes.
const spiral = {
  name: "Spiral canon in 31-EDO (per tonos)",
  tempo: 96,
  system: { type: "edo", divisions: 31, mode: MINOR_31, ref: { step: 0, midi: 60 } },
  dux: { source: "list", notes: melody("0 2 4:0.5 3:0.5 2 | 4 7:2 6 | 5 4 3:0.5 2:0.5 1 | 0:2 r:2") },
  voices: [
    { name: "dux", loop: 7, spiral: { cents: (5 * 1200) / 31 } },
    { name: "comes at the fifth", delay: 2, interval: 4, loop: 7, spiral: { cents: (5 * 1200) / 31 } },
  ],
};

const PRESETS = [round, doubleCanon, prolation, ladder, spiral];

function preset(index) {
  if (!Number.isInteger(index) || index < 0 || index >= PRESETS.length) {
    throw new Error(`no preset ${index} (0-${PRESETS.length - 1})`);
  }
  return JSON.parse(JSON.stringify(PRESETS[index])); // a copy the caller may change
}

exports.melody = melody;
exports.preset = preset;
exports.names = () => PRESETS.map((p) => p.name);
exports.count = PRESETS.length;
