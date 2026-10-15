# Canon Generator — design plan

This is a canon generator for Max/MSP and Max for Live, built for composing classical
electroacoustic music. It is meant to handle strict Fux-style canons, process canons
(mensuration, tempo, spiral) and Ligeti-style micropolyphony, in any tuning: equal divisions,
just intonation, Scala files, harmonic and inharmonic spectra.

This is a working plan. Each milestone gets its own checklist in `docs/` when work on it starts.
The research behind each design choice is in [`docs/RESEARCH.md`](docs/RESEARCH.md).

---

## 0. Decisions so far

| Topic | Decision |
|---|---|
| Platform | Max 9 (needed for `[v8]`); Live 12 later |
| Host order | **Standalone Max first** (M0–M8). The Max for Live adapter comes in M9. The engine stays host-agnostic from day one, so the port only adds an adapter. |
| Microtonal output | **Hz to MSP synthesis first** (built in M0). **MPE MIDI second**, its bend range per destination: ±48 to MIDI out, ±2 to Drift inside Max (proven in M0, finished in M2). MTS-ESP and Live 12 `.scl` tuning are stretch goals. |
| Patch authoring | **Hybrid.** UI panels and the main patch are built by hand in Max. Wiring-heavy abstractions are generated from code and checked in CI. The two sets live in separate folders, so the generator never touches a hand-built file (§4.4). |
| Live performance (play the leader, followers answer in real time) | **Stretch goal or future addition.** The engine API keeps it possible (§3.4). |
| Architecture | Taken from [`nnokes/cento`](https://github.com/nnokes/cento): a pure-JS engine, thin `[v8]` wrappers, and single-file bundles with no `require()` at runtime |
| Rule sources | **Fux** supplies the counterpoint rules. **Albrechtsberger** (Mann, pp. 213–261) supplies the canon rules, since Fux's *Gradus* does not treat canon. **Tymoczko** supplies the tuning-independent geometry: scalar vs. chromatic transposition, and the analysis metrics. |
| License | **MIT**, the same as cento (see `LICENSE`) |
| Max reference | The official Max documentation at <https://docs.cycling74.com/> is the authority for `[v8]`, search paths, projects and Max for Live behavior |

---

## 1. What we are building

A **canon** is a piece in which one or more voices (*comes*, followers) imitate a leader
(*dux*) strictly, after a delay. Each follower may be transposed, inverted, played in
retrograde, or stretched in time. The generator does three things:

1. **Renders** canons: give it a leader and per-voice settings, and it returns every voice as
   timed, microtonal events.
2. **Analyzes** canons: it slices all N voices vertically, scores each simultaneity with a
   chosen consonance model, and reports rule violations, including Fux's.
3. **Generates** canons: it searches for a leader whose own transformed copies form good
   counterpoint against it, under a chosen rule profile.

It works in any **scale system**. Fux's rules generalize because "consonant", "perfect" and
"imperfect" become thresholds on a pluggable consonance model rather than a fixed 12-tone
table (§3.3).

### Long-term goals (from the brief)
- N voices.
- Inversion, augmentation and diminution (plus retrograde, retrograde inversion, and any
  time-scale ratio).
- A delay between the leader and each follower, set per voice.
- Microtones and scale systems that are not diatonic.
- An aesthetic reach from Fux through Ligeti and spectralism.

---

## 2. Architecture

### 2.1 Guiding principle (from cento)
- **The engine is pure JavaScript** in `code/lib/`. It has no Max APIs, uses CommonJS modules,
  and is tested with `node --test`.
- **Thin `[v8]` wrappers** in `code/*.v8.js` connect the engine to Max.
- **The patch holds only wiring and UI.**

The reasons are the same as cento's: tests that are easy to run, offline batch runs in Node,
diffs that are easy to read, and control over how long the main thread is blocked.

### 2.2 The search-path problem, solved by a flat layout
**Settled by M0 spike (a).** On a fresh clone, with File Preferences untouched, Max 9 found
files **only in the folder of the patch you open**. It failed in every other case:
- a script in `patchers/scripts/` by bare name: "can't find file"
- the same script by relative path (`scripts/cg.hello.bundle.js`): "can't find file"
- an abstraction in a subfolder: "No such object"
- bpatchers in subfolders, by bare name or relative path: "error loading patcher"

So:
- **Everything Max loads lives directly in `patchers/`**, next to `canon.maxpat`: the
  patches, the abstractions and the script bundles. Every reference is a bare name. The
  patch lint fails on any path in a name, and on any loadable file in a subfolder of
  `patchers/`.
- **Bundles are self-contained.** `tools/build.js` inlines every module into one
  `patchers/<name>.bundle.js` per wrapper. **Nothing calls `require()` at runtime.**
  cento's M0 found that frozen Max for Live devices miss scripts loaded with `require()`.
- **Source stays organized in `code/`**, which Max never loads.
- **CI fails if a committed bundle is out of date** relative to `code/`.
- **Working data stays out of the repo.** Exports, presets and personal scale files go in
  `~/Documents/canon-generator/`.
- **Data Max needs is built into the bundle, or opened by a full path.** A `data/` folder
  would be a subfolder that Max can't see.
  - The starter scale systems and presets are JS data modules in `code/lib/`, so
    `tools/build.js` inlines them, and they travel with the bundle (and with a frozen Max
    for Live device).
  - Your own files (`.scl`, `.mid`, saved specs) come in through a file dialog
    (`[opendialog]`), which gives a full path, so the search path doesn't matter.
  - Test fixtures live in `tests/fixtures/`, which only Node reads.
- **For M9 (Max for Live):** a device doesn't search its own folder (cento M0). During
  development Live needs `patchers/` in its File Preferences. Frozen devices embed their
  files and need nothing.

### 2.3 Repository layout
```
README.md  PLAN.md  package.json  .gitignore  LICENSE
code/
  lib/            engine: cg-tuning, cg-transform, cg-canon, cg-consonance,
                  cg-rules, cg-analyze, cg-generate, cg-io, cg-rng   (plain JS, Node-tested)
  *.v8.js         [v8] wrappers (glue only)
patchers/         everything Max loads, flat (2.2):
  canon.maxpat          main patch (hand-built)
  cg.panel.*.maxpat     UI panels (hand-built)
  cg.engine.maxpat …    abstractions (generated: cg.engine, cg.player, cg.voices~, cg.mpe.out)
  cg.*.bundle.js        bundled [v8] scripts (generated, committed)
tests/            node tests, golden tests from Fux, simulated [v8] context
  fixtures/       .scl and .mid test files (Node only; Max never loads them)
tools/            build.js, check-paths.js, patchgen.py, hooks/
docs/             RESEARCH.md, Mx-checklist.md, controls.md
.github/workflows/ CI
```

### 2.4 Conventions (from cento)
- Every `[v8]` wrapper has **one inlet and one outlet**. Each output starts with a selector
  (`status`, `progress`, `done`, `error`), and the patch routes on it.
- Every `[v8]` box has a `textfile` entry naming its script.
- **JS never schedules notes.** The engine writes a sorted event list into a named `dict`, and a
  Max-native player plays it (§4.2).
- **Long searches never block Max.** The generator is an iterator. Its wrapper advances it in
  short time slices from a `Task` and emits `progress` as it goes.
- Randomness always comes from a **seeded RNG** (mulberry32, as in cento), so the same seed
  gives the same canon.

### 2.5 Files to port from cento (same author, MIT)
- `tools/build.js` (the bundler, renamed to the `cg.` prefix)
- `tools/check-paths.js` and `tools/hooks/` (the pre-commit check for personal paths)
- the simulated `[v8]` test context from `tests/`
- the CI workflow
- the mulberry32 RNG

---

## 3. Engine

### 3.1 Data model

**Pitch.** A float MIDI number: 60.0 is middle C, and 60.5 is a quarter-tone above it. It is
never rounded inside the engine. Hz is derived from it (`hz = ref.hz · 2^((p − ref.midi)/12)`).

**Scale system.** This says which pitches exist and how scale degrees map to them:
```js
{ name, period_cents /* 1200, 1901.955 (tritave), or null for non-repeating */,
  steps_cents: [...],            // ascending from 0: one period's steps, or every pitch if non-repeating
  ref: { step: 0, midi: 62, hz: 293.66 },   // this step sounds at this pitch
  mode: [0, 5, 8, 13, 18, 23, 26],          // optional: the step indices the degrees walk through
  ratios: ["1/1", "9/8", ...], period_ratio: "2/1" }   // optional: steps known as ratios
```
- **Degrees vs. steps.** Degrees count through the mode, or through every step if there
  is none. In a repeating system, degree *d* is degree *d* mod *size* in period
  ⌊*d* / *size*⌋, so negative degrees go down. A non-repeating system has degrees
  0 … *size* − 1 only. `ref` anchors a *step*, not a degree, so changing the mode never
  moves the tuning.
- **Quantize** gives the nearest degree and the error in cents. A pitch exactly halfway
  goes to the lower degree, and outside a non-repeating system it goes to the nearest end.
- **As built in M1** (`code/lib/cg-tuning.js`):
  - `ME(c, d)` is c-EDO with the ME set as its mode, so the chromatic steps stay available
    for `absolute` answers.
  - `.scl` files keep their ratios, so writing one back gives the same ratios.
  - The starter systems (`code/lib/cg-scales.js`) are built into the bundle.

Builders (M1):
- **n-EDO**: 12, 19, 22, 24, 31, 53 or 72 equal divisions
- **just-intonation ratio lists**
- **Scala `.scl` import**
- **harmonic series segment**: partials m…n over f0, with no period
- **subharmonic (undertone) series**
- **stretched or compressed spectrum** `f_k = f0 · k^s` (Murail-style "spectral distortion")
- **FM spectrum** `|c ± k·m|`
- **Bohlen–Pierce** (13 steps to a 3:1 tritave)
- **maximally even** `ME(c, d)`: *d* notes spread as evenly as possible over *c* equal steps
  (Clough and Douthett), giving diatonic-like scales in any equal division
- **raw Hz list**

**Time.** Float beats, where a quarter note is 1.0. Irrational tempo ratios (√2, e:π) rule
out integer ticks. Every time comparison uses an explicit tolerance ε (`cg.time.EPS`), following
Callender's point that irrational convergence needs one.

**Event.** `{ t, dur, pitch, vel, voice }`, with times in beats and pitch as float MIDI.

**Dux (leader).** A list of `{ dur, degree | pitch, rest? }`. It is entered as a list, read
from a MIDI file or Live clip, generated by a random walk, or found by the generator.

**Dux sources: your own melody.** A melody you bring is a dux like any other, so it goes
through the same renderer, analyzer and answer finder (§3.6, §3.7).
- **`.mid` file (M2).** `cg-io` has a pure-JS Standard MIDI File reader (types 0 and 1),
  tested in Node on fixture files. It reads:
  - notes, the tempo map and PPQ → float beats
  - pitch bend, with each channel's RPN bend range, including MPE files → exact float MIDI
    pitch, so a microtonal melody comes in exactly
- **Melodies with chords.** If the chosen track or channel is polyphonic, the reader takes
  one line (`line: top | bottom | track`) and reports what it dropped. Overlapping notes are
  trimmed.
- **Rhythm.** Kept exactly by default. An optional `quantize` grid is available; the
  strict-species rules need one note per grid unit.
- **Pitch mapping into the active scale system (`map`):**
  - `exact` (default): keep the pitches as they are
  - `nearest`: quantize each pitch to the system
  - `degree`: read the melody as degrees of a source scale (detected or chosen) and re-render
    those degrees in the target system. This is the interscalar mapping of the per-voice
    `scale` field, applied to the dux. A C-major tune becomes the same tune in 31-EDO Dorian
    or on a harmonic series.
- **As built in M2** (`code/lib/cg-io.js`):
  - The `top` and `bottom` lines are the skyline: at every moment the highest (lowest)
    sounding note, so a covered note comes back when it's uncovered.
  - Note-ons are paired with note-offs into intervals first, because Live writes the next
    note-on before the previous note-off at the same tick.
  - A loaded melody becomes the dux of every canon group in the spec.
  - Glides keep their onset pitch and are reported. Following the bend through a note,
    and detecting the source key for `degree`, are later.
- **Max side.** The file comes from a dialog (`[opendialog]`, a full path; §2.2). The `[v8]`
  wrapper reads its bytes with Max's `File` object. M1 first checks that `[v8]` can read a
  text file this way (for `.scl`); the first M2 task checks raw bytes (for `.mid`).
  Fallback: Max's own `[detonate]` reads the
  file and dumps its events into the script.
- **Live clip (M9).** The selected clip's notes come through the Live API
  (`get_notes_extended`) into the same dux format. To check in M9: whether per-note MPE bend
  or Live 12's tuning system can be read through the API. If not, clip notes come in as whole
  semitones.
- **Before M9:** Live's **Export MIDI Clip…** turns any clip into a `.mid` file, so melodies
  from Live work from M2.

**Canon spec.** This JSON describes the whole canon. Example: a three-voice canon in 31-EDO
D Dorian.
```json
{
  "system": { "type": "edo", "divisions": 31, "ref": { "step": 0, "midi": 62 },
              "mode": [0, 5, 8, 13, 18, 23, 26] },
  "dux":    { "source": "generate", "length": 16, "rules": "fux-strict", "seed": 7 },
  "voices": [
    { "name": "dux" },
    { "delay": 2, "interval": { "steps": -4, "domain": "degree" }, "transform": "P" },
    { "delay": 4, "interval": { "ratio": "1/2", "domain": "absolute" },
      "transform": "I", "axis": { "degree": 0 }, "timeScale": 2 }
  ],
  "ending": "free-cadence"
}
```

Per-voice fields:

| Field | Meaning |
|---|---|
| `delay` | Entry offset after the leader, in beats. |
| `interval` + `domain` | `degree` transposes by scale steps, so it stays in the scale and the exact intervals change: the generalized "diatonic" answer, which is Tymoczko's *scalar* transposition. `absolute` transposes by an exact cents value or ratio, with optional `quantize: nearest`: Tymoczko's *chromatic* transposition. Albrechtsberger says that only unison and octave canons can copy whole and half steps exactly (Mann p. 228), which is why `degree` is the ordinary case. In a harmonic series, a degree shift means partial *n* → *n+k*. An absolute ratio *r* means *n* → *n·r*, which stays inside the series when *r* is a whole number. One interval per follower (Mann p. 228). |
| `scale` | Optional. The follower answers in a *different* scale system or spectrum (Tymoczko's *interscalar* transposition): degree *x* of the dux's scale maps to degree *x + c* of the follower's scale, where *c* is the interval in steps. Examples: a harmonic-series dux answered in a stretched spectrum, or the tonal "e for e♭" answer (Mann p. 258). |
| `transform` | `P` (prime), `I` (inversion), `R` (retrograde) or `RI` (retrograde inversion). Plus two segment transforms from Albrechtsberger's riddle canons: `segmentRetrograde` (each segment, such as each measure, is reversed in place; Mann Ex. 233–234) and `segmentPermute` (the beats inside each segment are reordered by a permutation, ties and rests included; Ex. 237–238). |
| `axis` | The inversion axis. `axis.kind` is `degree` (mirror in scale steps), `log` (mirror in cents or log-frequency; around f0 this maps harmonic partials onto subharmonics, Fux's arithmetic/harmonic division taken literally) or `partial` (n ↦ N+1−n inside a spectrum), or `linear` (f ↦ 2c − f, a mirror in linear Hz, as ring modulation produces; the arithmetic counterpart of `log`; Levy 2006 pp. 60, 224–225). |
| `timeScale` | Augmentation (2), diminution (0.5), or any float. Ratios give mensuration (prolation) canons; irrational ratios give Nancarrow-style tempo canons. |
| `talea` | An optional duration cycle that replaces the leader's rhythm while keeping its pitch order (isorhythm: shared *color*, per-voice *talea*). This is the core of Ligeti mode. |
| `loop`, `spiral` | Perpetual canon, and *per tonos*. In the default `spiral.kind: transpose`, each pass is transposed by `spiral`, which drifts indefinitely in a microtonal system. In `spiral.kind: scaleWalk` (M7), the scale itself moves by a small voice leading on each pass, and the dux is re-mapped by interscalar transposition (Tymoczko ch. 4). |
| `tapeSpeed` | Shorthand for a variable-speed-tape answer: an absolute ratio *r* plus `timeScale` 1/*r* (an octave up is twice as fast). This is also Tenney's rhythm-equals-frequency link. |
| `env` | An optional amplitude envelope (breakpoints) for the voice, used for cross-fade groups (*Apparitions* m. 49, *Atmosphères* letter B). |
| `register`, `out`, `space` | Octave placement, the output route (MSP voice, MPE channel), and spatial placement (channel, pan or trajectory) for multichannel MSP output. |

Whole-canon fields:
- `ending`:
  - `free-cadence`: a free coda after the strict canon (Mann p. 242), closing with the
    cadence formulas 2–3 | 1 or 7–6 | 8, or on a unison, octave or third (p. 230)
  - `cut`
  - `loop`: a perpetual canon; the last note must lead smoothly back into the second
    measure, and the analyzer checks that join (p. 229)
  - `converge`
- `rules`: a profile name (§3.3).
- `groups`: several canons sounding at once, each with its own dux and followers. This
  covers double (4 voices), triple (6) and quadruple (8) canons (Mann p. 227), such as
  Palestrina's double canon in Ex. 225.
- `free`: voices that are not canonic, such as a cantus firmus or a free bass under the canon.
- `mask`: a post-render filter that thins the canon so only traces sound: a time-varying register band (pass or stop) plus gating segments. This is how *Glissandi*'s second half works (Levy 2006, pp. 67–92).

### 3.2 Modules (`code/lib/cg-<name>.js`, required as `"cg-<name>"`)

Wrappers are named `code/cg.<name>.v8.js` and bundle to `patchers/cg.<name>.bundle.js`. That's cento's convention: hyphens for library modules, dots for things Max loads.

| Module | Job | First needed |
|---|---|---|
| `cg.rng` | mulberry32, seeded | M0 |
| `cg.tuning` | Scale-system builders, `.scl` parse/write, degree ↔ pitch ↔ Hz, quantize, cents/ratio utilities | M1 |
| `cg.scales` | The starter scale systems, and a scale system from a spec | M1 |
| `cg.time` | Float beats: `EPS` and the comparisons that use it; event order | M2 |
| `cg.transform` | Transpose (degree or absolute), invert (4 axis kinds), retrograde, segment retrograde and permutation, time-scale, talea re-rhythm; all pure, and composable as `T∘I∘R` | M2 |
| `cg.canon` | Turns a spec into events; loops and spirals; endings; convergence-point solver (M6); incremental `start`/`step`/`finish` API | M2 / M6 |
| `cg.presets` | Canon specs as code, built into the bundle (§2.2) | M2 |
| `cg.consonance` | Pluggable consonance models (below) | M3 |
| `cg.rules` | Rule profiles: hard and soft rules with weights (`fux-strict`, `florid`, `canon`, `spectral`, `free`; `docs/controls.md`) | M3 |
| `cg.analyze` | Vertical slices across N voices, using the sounding bass in real registers; motion classification; violations; dissonance curve; Tymoczko metrics | M3 |
| `cg.finder` | The answer finder for one follower and N-voice sets (§3.6), on `cg.analyze` | M3 |
| `cg.generate` | Searches for a dux (§3.5), including the minimal-edit repair behind the answer finder's edits toggle (§3.6) | M4 |
| `cg.io` | Spec JSON, MIDI file import (M2) and export, MusicXML with microtonal accidentals | M2 / M10 |

### 3.3 Consonance models and rule profiles

Fux's rules depend on telling consonance from dissonance and perfect from imperfect
(*Study of Counterpoint*, pp. 20–22). In 12-TET that is a lookup table. In other tunings it
has to be computed, so `cg.consonance` has one interface with several models:

| Model | Idea | Good for |
|---|---|---|
| `fux12` | Fux's table, used directly. Perfect: unison, fifth, octave. Imperfect: thirds and sixths. Dissonant: seconds, fourths, sevenths, tritone. | 12-TET, the golden tests |
| `ratio` | Approximate the interval by the nearest simple ratio within a tolerance, then score it by **Tenney harmonic distance** log₂(n·d), or by Barlow harmonicity | JI, EDOs, harmonic series |
| `roughness` | **Sethares/Plomp–Levelt sensory roughness** computed from the *timbre actually being synthesized*, using the same partial list as the MSP voice bank | Spectral and inharmonic work: the analyzer "hears" what you hear |
| `table` | A table the user writes, per scale system | Anything else |

"Perfect", "imperfect" and "dissonant" become **thresholds on the model's score**, set per
system. Each scale system ships with defaults.

**Rule profiles.** Each rule is either *hard* (prunes the search) or *soft* (adds a weighted
cost). Every rule is listed in `docs/controls.md` with its source.
- **`fux-strict`** (first species first, other species in M5):
  - the four rules of motion (p. 22): perfect into perfect only by contrary or oblique motion
  - begin and end on perfect consonances, and prefer imperfect consonances in between
    (p. 28)
  - cadence: major sixth or minor third at the penultimate note (pp. 28–29), with the raised
    leading tone in Dorian, Mixolydian and Aeolian (p. 29n)
  - stay in the mode of the dux (p. 31)
  - no hidden fifths or octaves (pp. 32–33)
  - no more than three or four parallel imperfect consonances in a row (Mann's note, p. 21)
  - a note repeated at most once (p. 29n)
  - melodic limits (p. 27n): no augmented or diminished leaps, nothing larger than a fifth
    except the octave and the ascending minor sixth, and leaps compensated
- **`fux-relaxed`**: the same rules, with soft weights scaled down as the voice count rises.
  Fux himself: *"as the number of voices increases, the rules are to be less rigorously
  observed"* (p. 139).
- **`canon`** (Albrechtsberger, Mann pp. 213–261). Fux does not treat canon (p. 214), so these
  canon-specific rules layer on top of any counterpoint profile:
  - every slice is judged against the **actual sounding bass**, so a 6/4 on a strong beat,
    or in the first or last measure, is flagged (pp. 228, 236–237)
  - entries should be set up by a rest in that voice (p. 216)
  - a new phrase should not start a 7th or 9th from the end of the previous one (p. 217)
  - in a round, every group of voices that sounds while the entries pile up must already
    be a complete 2- or 3-part setting (p. 237)
  - **invertibility check**: within a scale system's period *P*, interval *x* inverts to
    *P − x*. This is what turns a canon at the 2nd into one at the 7th or 9th
    (pp. 231–232), and it can be checked in any tuning.
- **`spectral`**: the motion rules use the model's perfect/imperfect classes. Roughness
  ceilings apply per slice and over a sliding window (a density envelope). Register spacing
  follows the spectrum (wide at the bottom, close at the top).
- **`micropoly`** (Ligeti mode): no simultaneous attacks across voices, which Levy describes
  for *Lux aeterna*. The pitch band unfolds step by step. A maximum band width applies.
- **`free`**: no rules. The analyzer still reports.
- **`florid`** (added in M3): the dissonance treatment of species 2–4 (passing and
  neighbour notes off the strong beats, prepared suspensions resolving down by step),
  brought forward from M5. The answer finder judges Albrechtsberger's florid canons with
  it; `canon` layers on top of it. Its melodic rules are soft, because a follower inherits
  the dux's melody.

### 3.4 Rendering and the incremental API
`cg.canon.render(spec)` → `{ voices: [{ events: [...] }], meta }`. Internally, rendering is a
fold over `cg.canon.step(state, leaderEvent) → followerEvents`.

That incremental form costs nothing now. It is what a future **live-performance mode** needs:
a real-time host feeds leader notes in and gets follower notes out. Retrograde, and
diminution followers that overtake the leader, need the leader's future. In live mode they
would be limited, and that limit will be documented.

**Convergence points (M6).** This applies to tempo and mensuration canons. Say voice *i* plays
the shared material at speed *vᵢ*, measured in material beats per real beat, and enters at real
time *eᵢ*. Then two voices reach the same point *x* in the material at the same moment when

```
x = (e₂ − e₁) / (1/v₁ − 1/v₂)        (needs v₂ > v₁ when e₂ > e₁: the later voice must be faster)
t = e₁ + x / v₁                       (real time of the convergence)
```

Inverted, this lets you **choose where the voices converge** and solve for the delay:
`e₂ − e₁ = x · (1/v₁ − 1/v₂)`. Nancarrow placed convergence points this way (Nemire; Gann).
For irrational ratios the comparison uses ε.

### 3.5 Generation: a canon is counterpoint against itself
Treatises describe writing a canon as a chain:
1. Write a segment of the dux as long as the delay.
2. Copy it into the follower.
3. Write the next dux segment as counterpoint against that copy.
4. Repeat.

`cg.generate` turns that procedure into a search.

- **Variables.** The dux notes d[0..L−1], one per grid unit (first species). Rhythm comes in
  M5.
- **Which dux note each voice is playing.** At grid time *t*, voice *k* plays dux index
  `iₖ(t) = floor((t − δₖ) / aₖ)` for P and I, or `L−1−iₖ(t)` for R and RI. It applies its
  pitch map `Tₖ`.
- **Constraints.** Each vertical slice and each pair of consecutive slices (the motion rules)
  is a constraint over a small set of dux indices. **A constraint is checked as soon as all of
  its indices are assigned.** This one rule handles:
  - followers that lag, the ordinary case
  - diminution followers that overtake the leader (their checks are deferred)
  - retrograde voices (their checks pair early and late indices)
- **Variable order.** Left to right by default, which is the treatise chain. When any voice is
  R or RI, the order runs outside-in, alternating d[0], d[L−1], d[1], d[L−2], and so on, so
  crab and table canons get checked early.
- **Search.** Depth-first with backtracking:
  - candidates are ordered by soft cost plus seeded jitter
  - there is a node budget, with a best-so-far fallback
  - an optional beam mode keeps the top-*B* partial duxes
  - an optional fixed cantus firmus is supported
- **Diagnostics.** The search counts which rules caused backtracking. This is a lightweight
  version of FuxCP's minimal-unsatisfiable-subset idea, so when no canon exists for some
  settings, the report says which rule blocks it.

**Block method for rounds** (Albrechtsberger's *first draft*, Mann pp. 232–237). A round has
*k* voices at the unison, each entering one section length after the last. Once all voices
are in, every section sounds at once, so the whole round is decided by one *k*-part
**block** whose parts are the *k* sections. The melody is those sections joined end to end.
The generator therefore:
1. solves the block as ordinary *k*-part counterpoint
2. checks the smaller groups of voices heard while the entries pile up (the "first two or
   three voices form a perfect setting" rule)
3. checks the joins between sections, and the wrap-around join for perpetual rounds
4. places the bass-cadence section where it cannot cause a 6/4

This is a much smaller search than the chain, and M4 uses it for rounds.

### 3.6 Analysis extras: Tymoczko metrics and the answer finder

**Tymoczko's five components of tonality** become analyzer metrics. Each works in any tuning
(*A Geometry of Music*, ch. 1):

| Metric | How it is measured | Use |
|---|---|---|
| conjunct motion | mean absolute melodic step, in **scale steps of the active scale** (the scale is a ruler, ch. 4), with cents alongside | melody smoothness |
| acoustic consonance | the chosen consonance model | the dissonance curve |
| harmonic consistency | distance between successive vertical chord types, ignoring octave, voice order and transposition (OPT in OPTIC terms). Compared **only between verticals with the same number of sounding voices**; otherwise left undefined | texture uniformity |
| macroharmony | distinct pitch classes in a sliding window, merging any within `pcTolerance` cents; plus the **circulation rate** (new pitch classes per beat) and **macroharmonic consistency** (overlap between successive windows) (ch. 5) | Ligeti band width and unfolding speed; spectral density |
| centricity | how concentrated the duration-weighted pitch-class distribution is (maximum share or entropy), with extra weight for the bass and phrase ends. This formula is ours | a *Lontano*-style single-pitch start |
| evenness (ours, after ch. 3) | distance from each vertical to the nearest perfectly even chord with the same number of notes | cluster ↔ equal-division axis; Ligeti band widening |

Also **voice-leading size**: the motion, in cents, of the voices sounding in *both* of two
consecutive slices, under a selectable norm (`vlNorm`: taxicab by default, or Euclidean or
Chebyshev; ch. 2).
**Answer distortion** (ours): the cents gap between a follower's `degree` answer and its
`absolute` answer, reported by the answer finder.
**Boundary events**: voice crossings and unisons, the places where the canon's path touches
the edge of chord space (ch. 3). In a canon this depends only on the dux's intervals at the
different delays. The `spectral` and `micropoly` profiles can set targets or envelopes for any
of these metrics.

**Measurement rules** (Tymoczko, *MTO* 16/1, 2010):
- Distances are always measured directly in cents. They are never graph-step counts like
  Tonnetz moves, which don't give real distances between chords that aren't adjacent and
  only exist in 12-TET.
- Canon voices are labelled, so the actual voice leading is known. There is no
  minimal-voice-leading search over unordered chords.
- Entries, exits and "holes" change the number of sounding voices, so they are reported as
  separate counts and never folded into a distance.
- Pitch-class metrics fold at the scale system's period. Non-periodic systems (harmonic
  series, inharmonic spectra) fold at a configurable `pcPeriod` (default 1200 cents), and the
  report says so.
- Melodic rules (step vs. leap, leap compensation) count scale steps of the active scale.
  Consonance counts cents. This is how Fux's melodic rules carry over to any tuning.

**Answer finder** (Albrechtsberger: hidden answers, p. 230; riddle canons, pp. 255–261).
Given any dux, including one you wrote yourself, it searches every follower setting:
interval (both domains), delay, transform (including the segment transforms) and time scale.
It ranks the settings with the analyzer. This needs no generation, only rendering plus
analysis, so it arrives in M3. It is also how Albrechtsberger's Ex. 201 can be answered in
eight ways (at the upper 2nd, lower 3rd, upper 6th, lower 7th, both octaves, lower 9th and
lower 10th), and how his canon for Haydn has two solutions.
- **Search space.** You set the ranges:
  - intervals, in both domains
  - delays, in beats or grid units
  - transforms: P/I/R/RI and the segment transforms
  - time scales

  The finder renders and analyzes every combination. It has a node budget, and runs
  time-sliced in `[v8]` with progress (the M4 mechanism, brought forward).
- **One follower.** The result is a ranked list of settings. Each one shows its score, its
  violations (rule, bar and voices) and its answer distortion.
- **N voices.** A 3+-voice canon is a set of followers in which every pair works:
  - **Pairs.** Every pair of followers is checked against each other directly, which is
    cheap (two voices, rendering plus analysis). The one-follower results can't stand in for
    a follower pair:
    - a `degree` shift can change an interval's exact size (a fifth can become a diminished
      fifth)
    - two inverted, retrograde or time-scaled followers relate through the *transformed*
      melody, not the dux
    - strong beats fall in different places when a follower enters mid-bar
  - **Combining.** A small clique search finds the sets in which no pair breaks a hard rule.
  - **Whole set.** Each candidate set is then analyzed in full against the actual sounding
    bass, because 6/4s and the "first voices already form a complete setting" rule only show
    up with all the voices present.
  - **Result.** A ranked list of N-voice canons.
- **Edits toggle (`allowEdits`, off by default; M4, because it uses `cg.generate`).**
  - **Off:** your melody is never changed. The finder only ranks and reports.
  - **On:** for a chosen setting, or the top *K*, the finder searches for the version of your
    melody with the fewest changes that makes that setting pass. It uses the §3.5 search
    with:
    - a soft cost for staying close to the original: the number of notes changed and how far
      they move, in scale steps
    - each note's original pitch tried first
    - the rhythm kept as it is
    - notes you lock never changed
    - an optional `maxEdits`
  - **Result:** the edited melody, each changed note, and the rule that forced the change
    (from the search's backtracking diagnostics), so you can compare it with your original.

### 3.7 Workflow: from your melody to canons
1. **Load** a `.mid` file (from M9, a Live clip). Choose the line, the pitch mapping and,
   optionally, a quantize grid (§3.1).
2. **Set the search:** the ranges and a rule profile. Then run the finder.
3. **Browse** the ranked 2-voice and N-voice results. Click one to audition it in Max.
4. **Optionally allow edits** for a near-miss, and compare the edited melody with yours.
5. **Keep** a result as a spec preset (JSON). Later, export it as MIDI or MusicXML (M10).

---

## 4. Max layer

### 4.1 Patches (standalone Max first)
- `canon.maxpat` is the main patch, hand-built. It contains:
  - a scale-system chooser with an audition keyboard
  - a canon-spec editor: a voice table with delay, interval, transform, time scale and output
  - buttons: render, generate, analyze
  - a piano roll in `[v8ui]` with voice colors, violation markers and the dissonance curve
- As built (M2–M3), the main patch is split into panels, one per job:
  `cg.panel.tuning`, `cg.panel.canon`, and `cg.panel.finder` (the answer finder, M3). The
  finder reads the canon panel's spec from the dict `cg.spec`, and plays a picked result
  through the canon panel (`[s cg.canon.in]`, `usespec`).
- `cg.engine` (generated) hosts the `[v8]` wrappers and named dicts:
  - `cg.spec`: the canon spec
  - `cg.events`: the rendered events
  - `cg.report`: analysis results

### 4.2 Player
The player is Max-native and locked to the transport, and it reads `cg.events`. Times are
floats, so a fixed tick grid is not enough. There are three candidate designs:
1. `[delay]`-chained ms scheduling in the scheduler thread, with Overdrive on. The JS fills
   a `[coll]` with the delay to each next onset, and an `[i]` → `[coll]` → `[delay]` loop
   walks it. M0 spike (b) builds and measures this one first.
2. a fine-grid `[metro @quantize]` pull, as cento does
3. sample-accurate MSP sequencing for the Hz path, through per-voice control buffers or
   `mc.`/`[poly~]`

**Decided by M0 spike (b): design 1.** Over 200 onsets of a √2:1 tempo canon (45 s, Max 9,
Overdrive on), the spread from onset to onset was about ±0.1 ms, with no drift. The 2.3 ms
the first metric showed was a constant start offset: onset 0 was fired by a mouse click, the
rest by the scheduler. Players therefore start through a short `[delay]`, so every onset
comes from the scheduler. Designs 2 and 3 aren't needed for timing. Design 3 may still come
back for sample-accurate *audio* events in the voice bank.

### 4.3 Output adapters (build order)
1. **`cg.voices~`: Hz to an MSP voice bank** (`mc.`).
   - **M0 proved the path:** one `[cycle~]` at a float frequency, read by `[fzero~]` at
     +0.17 cents (the tracker's own bias). `sigmund~` isn't in Max 9.
   - The full voice bank arrives with the M2 renderer. Each voice is a simple additive
     synth. Its **partial list is a parameter, and the same list feeds the `roughness`
     consonance model**. There is no MIDI channel limit, which suits dense Ligeti textures.
   - **Every voice's gain ramps** (`[line~]` or `[curve~]`): never a DC step or a hard gate.
     M0 found that a bare `[cycle~]` at 0 Hz outputs DC and clicks when audio turns on.
   - **Candidate building blocks:** Max 9's ABL objects (Ableton's DSP). `abl.dsp.*`
     oscillators and filters take frequencies directly, which suits this path.
   - **Measuring a rich sound needs octave folding.** A pitch tracker on a harmonically rich
     synth often locks an octave off (M0 saw this on Drift). Any pitch check folds each
     reading to the nearest period and uses the median: `cg-tuning`'s `foldCents` and
     `centsSummary`.
2. **`cg.mpe.out`: MPE MIDI.**
   - **As built in M2:**
     - each *note* gets its own member channel, least recently freed first
       (`cg-mpe.allocate`); notes beyond 15 at once go to the Hz voices
     - `[pipe]` delays each note-off by the note's length, so Max times it, not JS
     - **one MPE destination at a time:** Drift inside Max, or MIDI out through the
       panel's `[midiout]`, whose port is chosen there and saved with the panel. M2's
       first build sent to both, and an unconfigured `[midiout]` reached the Mac's General
       MIDI synth (channel 10 = drums). GM synths aren't MPE targets.
     - **latency:** an external synth sounds later than Max's own audio, by its own
       latency. That only matters when mixing it with Max's voices; M9 (Live) relies on
       Live's delay compensation.
     - `cg.check.mpe.maxpat` measures one note, through Drift only
   - lower zone, channels 2–16
   - **pitch bend range per destination** (`cg-mpe.RANGES`):
     - MIDI out: ±48 semitones, the MPE standard and what Live 12's tuning system
       expects; resolution 96/16384 ≈ 0.59 cents
     - Drift: ±2, its own per-note range ("Note PB"); it ignores the RPN (M2 session 3).
       A note's bend stays within ±50 cents of its key, so ±2 covers it, at about
       0.024 cents.
   - at most 15 notes at once per port; the rest route to MSP
   - **Inside Max, without an external synth:** `abl.device.*` instruments such as
     `abl.device.drift~` take raw MIDI bytes. M0 spike (c) measures whether Drift honours
     per-channel bend and our ±48 RPN; the "implied bend range" line answers it.
     - **M0 result: the bytes are right; the pitch is unconfirmed.**
       - First run: the tracker jumped octaves on Drift's rich default sound, and the
         highest reading (+6 cents) leaned towards ±48.
       - Second run, with one oscillator (`@drift 0 @osc2enable 0`): no pitch readings at
         all.
     - Drift has its own per-note ("Note PB") bend range. Reports disagree on whether its
       default is 2 or 48.
     - **The MPE pitch check moved to M2:** `cg.mpe.out` measured on an external MPE synth
       or a Live 12 instrument. Drift stays a candidate if a listen confirms it sounds with
       one oscillator.
     - **M2 tries Drift first** (the user's choice), with its second oscillator on, as in
       M0's first run, which did give readings. If that's unreadable, a Live 12
       instrument with its audio brought back into Max.
     - **M2 session 3: `fzero~` gave no readings at all of Drift's default sound**, a
       steady tone. So the check now lowpasses Drift (two `[lores~]` at 1.5× the target)
       before the tracker and shows the tracker's raw Hz. As a fallback, a reference sine
       at the target plays to the speakers only: a clean unison means ±48, and a beating
       of about 9 Hz means ±2. If only the ear can confirm it, M2 records it that way, and
       the measured check moves to M9 with a Live 12 instrument.
     - **M2 session 3, third round: Drift applies ±2.**
       - The sine beat against Drift.
       - The user found why `fzero~` had read nothing: it was fed after the `[*~ 0.3]`
         speaker gain, too quiet for it. Fed Drift's raw output, it read 9 summaries:
         medians 47–51 cents, all an octave low.
       - So Drift ignores our RPN and keeps its own "Note PB" range (forum posts: 2 by
         default).
       - The implied range scattered from 0.6 to 2.7. At ±48 the bend for 64.5 is only 85
         steps from centre, so a cent of noise moves the estimate by about a semitone.
     - **Decision: each destination gets its own range** (above). Drift's bends are
       computed for ±2. The check taps Drift's raw output and bends for ±2: `note 64.5`
       then sends bend 6144, so honouring ±2 and ignoring the bend are 50 cents apart.
3. **MIDI file** export, one track per voice (M10).
4. **MTS-ESP** (stretch).

### 4.4 Hybrid patch authoring
- **Hand-built:** `patchers/canon.maxpat` and `patchers/cg.panel.*.maxpat`.
- **Generated:** the abstractions (`patchers/cg.engine.maxpat`, later the player and voice bank). During M0 this included the `patchers/cg.spike.*` patches, removed when M0 closed. They're written by `tools/patchgen.py`, Python standard library only. All patches share one folder (2.2), so ownership comes from the generator's two lists and the note inside each patch, not from folders. A test checks that every patch is on exactly one list. This is a
  slimmed-down port of cento's `maxgen.py` idea. CI regenerates these files and fails if they
  differ.
- **Checked:** `tests/patches.test.js` lints *all* patches:
  - every `[v8]` has a `textfile` entry
  - each bundle it names exists
  - cords use only `[v8]` inlet 0 and outlet 0

  Hand-built files get linted but never rewritten.

### 4.5 Max for Live (M9)
- A host adapter (`cg.host.live`) next to `cg.host.max`. The engine is unchanged.
- Canon voices are written as Live clips through the Live API, with one track per voice, or
  one MPE track.
- Live parameters map to the spec.
- Live 12's own tuning system: either bypass it per track, or send MPE at ±48 so it agrees.
- Exit test: a frozen `.amxd` runs without the repo on the search path (cento's M0/M12
  pattern).

---

## 5. Milestones

Each milestone gets a checklist in `docs/Mx-checklist.md` when work on it starts.
**Exit criteria are what "done" means.**

| # | Milestone | Scope | Exit criteria |
|---|---|---|---|
| **M0** | Scaffold and spikes | **Closed 2026-10-12.** Port cento's layout, bundler, path check, hooks, simulated `[v8]` tests and CI. `cg.hello` round trip. See [`docs/M0-checklist.md`](docs/M0-checklist.md). (c)'s MPE half moved to M2. | Five spikes recorded:<br>(a) a fresh clone loads its bundles with no preference changes<br>(b) the player's jitter is measured and a design chosen<br>(c) a JS-generated 31-EDO note sounds through the MSP Hz path within ±1 cent, then through MPE at ±48<br>(d) the event dict round-trips JS ↔ Max with floats intact<br>(e) a hand-built panel hosts a generated abstraction, and regenerating it leaves the panel untouched |
| **M1** | Scale systems | **Closed 2026-10-12.** See [`docs/M1-checklist.md`](docs/M1-checklist.md). `cg.tuning`: every builder (including maximally even), `.scl` parse and write, degree/pitch/Hz conversion, quantize. A Max chooser with an audition keyboard. | Cents-value tests pass for every builder. `.scl` fixtures round-trip. Each system auditions in Max. |
| **M2** | Canon renderer (process canons, no rules) | **Closed 2026-10-15.** See [`docs/M2-checklist.md`](docs/M2-checklist.md). The MPE pitch measurement (at Drift's ±2) moved to M3's first Max session. `cg.transform` and `cg.canon.render` for N voices: delay, interval (both domains), P/I/R/RI (all four axis kinds: degree, log, partial, linear), segment retrograde and segment permutation, time scale, talea, loop, spiral, endings (including the free coda and the 2–3 \| 1 and 7–6 \| 8 cadences), canon groups (double and triple canons), free voices, and a per-voice answer scale. The dux comes from a list, a random walk or a **`.mid` file** (§3.1): tempo map, pitch bend and MPE, `line`, `quantize`, and `map` (exact, nearest, degree). MPE output finished. | Transform property tests pass. These presets play correctly in Max: a 4-voice round; a double canon in the layout of Palestrina's Ex. 225 (Mann p. 242); a Pärt-style prolation canon on a descending scale at 1:2:4:8; a Goldberg-style ladder of canons at each interval; a spiral canon in 31-EDO.<br>**MIDI import:** these fixtures come in with pitches and times intact: a 12-TET melody; a 31-EDO melody written with pitch bend; a polyphonic file (one line taken, the rest reported); a clip exported from Live. One of them plays as a canon in Max.<br>**MPE pitch (carried over from M0 spike c):** a quarter-tone note (64.5) through `cg.mpe.out` into an external MPE synth or a Live 12 instrument, measured with `fzero~` and `centsSummary`. The folded median is within ±5 cents, and the implied bend range matches the destination's (±48 for MIDI out; Drift turned out to keep its own ±2, session 3). |
| **M3** | Analysis and consonance models | `cg.consonance` (all four models), `cg.rules` (`fux-strict` first species, `canon`, `spectral`, `free`), `cg.analyze` with the sounding bass in real registers, Tymoczko metrics, the answer finder (one follower and N-voice sets, with a ranges panel and ranked result lists, §3.6), piano-roll overlays. The first `[v8]` time slicing (§2.4): measure how much work one slice can do before Max's interface stutters, and set the **time-slice budget**. | **Golden tests from the Fux PDF** (Figs. 5–8):<br>• Fig. 5 is clean<br>• Fig. 6 flags the mode error at bar 1 and the hidden fifth from bar 2 to bar 3, as Fux marks them<br>• Figs. 7–8 show the hidden fifths that diminution reveals<br>**Answer-finder golden tests from Mann:** it finds the eight answers Albrechtsberger lists for Ex. 201 (p. 230) and both solutions of the canon for Haydn (Ex. 239–240, p. 261).<br>**Your melody:** a `.mid` melody gives ranked 2-voice and 3-voice lists in Max, and clicking a result auditions it.<br>**Time-slice budget** recorded in the M3 checklist. The finder runs with Max's interface staying responsive.<br>The roughness curve matches Sethares's published shape for a harmonic timbre. |
| **M4** | Generator: strict first-species canons | `cg.generate` with a left-to-right search, backtracking, beam, seed, node budget, diagnostics. 2 voices, then N; `fux-relaxed` for N > 2. The block method for rounds (§3.5). Time-sliced in `[v8]` with progress. The answer finder's **edits toggle** (`allowEdits`): minimal-edit repair of your melody (§3.6). | Valid 2-voice canons at the octave, fifth and fourth with delays of 1–4 bars. 3–4-voice rounds, built by the block method, with no 6/4 on strong beats and smooth perpetual joins. Same seed, same canon. A 32-note canon finishes without hanging Max, each slice of the search staying within the budget recorded in M3.<br>**Edits toggle golden test:** take a clean canon from the M3 goldens (Mann Ex. 201, or a Fux figure) and change one note so it breaks. The repair finds a one-note fix that passes, and names the rule the change fixed. With the toggle off, the melody is never changed. |
| **M5** | Rhythm: species 2–5 and florid | A rhythmic grid; passing and neighbour notes; suspensions (4th species); florid mixtures. Rules follow Fux's chapters on the second to fifth species (pp. 41–70). | A 4th-species canon at the 2nd/9th with chains of suspensions. A florid 2-voice canon passes `fux-strict`. |
| **M6** | Transformations under rules, plus convergence | Generation with I, R and RI voices (outside-in order) and time-scaled voices. Convergence-point solver and "converge at x" endings. | Contrary-motion, crab, table and mensuration canons generated under the rules. The solver matches convergence points worked out by hand (including a √2 case within ε). |
| **M7** | Microtonal and spectral counterpoint | Rule profiles running on the `ratio` and `roughness` models; spectral presets; undertone answers; partial-index inversion; interscalar answers and the scale-walk spiral. | These presets analyze clean under their own models:<br>• **Tenney *Spectral CANON*-style**: voice *k* on partial *k*, tempo ∝ *k*, rhythm and frequency ratios matched<br>• a strict 31-EDO canon<br>• a Bohlen–Pierce canon<br>• a harmonic-series dux answered in the undertone series |
| **M8** | Micropolyphony (Ligeti mode) | 8–48 voices share one pitch sequence (*color*), each with its own subdivision (3/4/5/6-tuplets) or "elastic talea". `micropoly` rules. Entries, exits and "holes". The band unfolds from a single pitch (*Lux aeterna*, *Lontano*), driven by a **pitch-class circulation-rate envelope** (Tymoczko ch. 5) and a centricity release. Density envelopes. **Rhythm tools from Levy 2006:** equal-share inter-onset distributions (duration × count = constant) with sum-preserving rebalancing; geometric duration scales (e.g. 11/10) reordered with no trajectory and no repeated neighbouring proportion; pairwise-coprime subdivisions; an aggregate attack-rate envelope across the 50 ms (*Bewegungsfarbe*) threshold; seeded timing jitter; cross-fade groups; entry and exit *modus* orders. Presets: crawling cluster, the *Glissandi*-form masked crab canon, and the PE3 harmonic/subharmonic field. MSP output. | A 16-voice texture rendered from one dux reports **zero simultaneous attacks** when that rule is on. The equal-share generator reproduces the *Apparitions* I counts (Levy Table 4.1) from its duration scale and constant. The crawling-cluster preset sounds as one rising cluster. Band width follows the envelope. It plays without dropouts in Max. |
| **M9** | Max for Live product | `cg.host.live`, clip writing, **a Live clip as the dux** (the selected clip through the Live API, §3.1), Live parameters, a shared panel, Live 12 tuning interplay. | A frozen `.amxd` writes a canon into clips and plays it, without the repo on the search path. The selected clip becomes the dux and goes through the answer finder. |
| **M10** | Export and notation | Per-voice MIDI files; MusicXML with microtonal accidentals; an optional `bach.roll` view (the `bach` package as an optional add-on, not a dependency). | Files open in a notation program and a DAW with pitch intact, or with cents written as text where the format can't carry them. |
| **M11** | Ship | Package into a zip with a read-me; test on a clean machine (the cento M12 pattern). | A fresh user opens `canon.maxpat` and renders a preset with no setup. |

### Stretch and future additions (not scheduled)
- **Live-performance canon.** The leader comes from a MIDI keyboard or pitch tracking
  (`sigmund~`, `fzero~`), and the followers answer in real time through `cg.canon.step()`.
- **Audio-domain canons.** Followers are delayed, pitch-shifted or time-stretched copies of
  recorded or live audio.
- **MTS-ESP output**, and **Live 12 `.scl` tuning** as a second route to microtones.
- **Rhythmic tiling (Vuza) canons**, after Tom Johnson's *Tilework*.
- **A Nørgård infinity-series dux.** The series is a canon of itself, so it can feed the
  renderer directly.
- **Chord-space view.** Draw a canon as a path through Tymoczko's chord space (as his
  ChordGeometries software does), for example in Jitter.
- **Learned rule weights.** Like Cope's *Gradus*, fit soft weights from example canons; this
  connects to cento's taste layer.

---

## 6. Testing

- **Unit tests:** `node --test` on `code/lib/`, using cento's `NODE_PATH` approach.
- **Golden tests** from the Fux PDF, encoded as fixtures in `tests/fixtures/fux/`, with page and
  figure cited in each fixture.
- **Property tests:**
  - I∘I = id and R∘R = id
  - transposing up then down by the same interval gives the identity
  - augmentation then diminution gives the identity
  - degree → pitch → degree round-trips for every scale system
  - `render` equals the fold of `step()`
- **Bundle tests:** each bundle runs inside a simulated `[v8]` context (ported from cento).
- **Patch lint:** described in §4.4.
- **CI** on GitHub Actions: tests, `build:check`, `patchgen --check`, path check.

---

## 7. Open questions

1. **Tymoczko, *A Geometry of Music*. Closed: moving on without the book.** Three upload
   attempts failed, so its ideas come from secondary sources (RESEARCH.md §3a). The plan
   depends only on definitions confirmed in those sources (scalar and interscalar
   transposition, the voice-leading-size principles, macroharmony, centricity). Every formula
   built on them is labelled as ours. If the book ever becomes readable, checking chapters
   2–5 is a nice-to-have, not a blocker.
2. **Ligeti mode details.** The exact rhythmic rules (Levy 2013) and the per-voice subdivisions
   in *Lux aeterna* still need checking against primary sources before M8 (see RESEARCH.md).
3. **Rest of Mann's *Study of Fugue*.** The canon chapter (Albrechtsberger, pp. 213–261) has
   been read and folded in. The Fux and Marpurg fugue chapters, which cover invertible
   counterpoint, are optional reading before M5 and M6.
