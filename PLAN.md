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
| Microtonal output | **Hz to MSP synthesis first** (built in M0). **MPE MIDI with ±48 pitch bend second** (proven in M0, finished in M2). MTS-ESP and Live 12 `.scl` tuning are stretch goals. |
| Patch authoring | **Hybrid.** UI panels and the main patch are built by hand in Max. Wiring-heavy abstractions are generated from code and checked in CI. The two sets live in separate folders, so the generator never touches a hand-built file (§4.3). |
| Live performance (play the leader, followers answer in real time) | **Stretch goal or future addition.** The engine API keeps it possible (§3.4). |
| Architecture | Taken from [`nnokes/cento`](https://github.com/nnokes/cento): a pure-JS engine, thin `[v8]` wrappers, and single-file bundles with no `require()` at runtime |
| License | **Open:** MIT, like cento? |

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

### 2.2 The search-path problem, solved by layout
Max finds files next to, or below, the patch it opens, but has trouble with folders above it. So:

- **Everything Max loads lives in `patchers/`**: the main patch, the abstractions, and the
  script bundles.
- **Bundles are self-contained.** `tools/build.js` inlines every module into one
  `patchers/scripts/<name>.bundle.js` per wrapper. **Nothing calls `require()` at runtime.**
  cento's M0 found that frozen Max for Live devices miss scripts loaded with `require()`.
- **CI fails if a committed bundle is out of date** relative to `code/`.
- **Working data stays out of the repo.** Exports, presets and personal scale files go in
  `~/Documents/canon-generator/`.

**Still to confirm in M0, spike (a).** cento's notes say standalone Max searches the folder of
the patch it opens, but its README also tells users to add `patchers/` to the search path with
*Subfolders* enabled. The spike tests three ways to load from subfolders on a fresh clone with
no preference changes:
1. a relative path in the `[v8]` `textfile` entry
2. a Max Project (`.maxproj`), which covers all its folders
3. a flat fallback, with bundles beside the main patch

### 2.3 Repository layout (target)
```
README.md  PLAN.md  package.json  .gitignore
code/
  lib/            engine: cg.tuning, cg.transform, cg.canon, cg.consonance,
                  cg.rules, cg.analyze, cg.generate, cg.io, cg.rng   (plain JS, Node-tested)
  *.v8.js         [v8] wrappers (glue only)
patchers/
  canon.maxpat    main patch (hand-built)
  parts/          hand-built UI panels (cg.panel.*)
  parts/gen/      generated abstractions (cg.engine, cg.player, cg.voices~, cg.mpe.out)
  scripts/        generated *.bundle.js (committed)
data/
  scales/         starter .scl files and scale-system JSON
  presets/        canon specs (round, Pärt prolation, Tenney spectral, Ligeti cloud …)
tests/            node tests, golden tests from Fux, simulated [v8] context
tools/            build.js, check-paths.js, patchgen, hooks/
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
  steps_cents: [...],            // one period's steps, or the full list if non-repeating
  ref: { degree: 0, midi: 62, hz: 293.66 },
  mode: [0, 5, 8, 13, 18, 23, 26] /* optional subset of step indices */ }
```
Builders (M1):
- **n-EDO**: 12, 19, 22, 24, 31, 53 or 72 equal divisions
- **just-intonation ratio lists**
- **Scala `.scl` import**
- **harmonic series segment**: partials m…n over f0, with no period
- **subharmonic (undertone) series**
- **stretched or compressed spectrum** `f_k = f0 · k^s` (Murail-style "spectral distortion")
- **FM spectrum** `|c ± k·m|`
- **Bohlen–Pierce** (13 steps to a 3:1 tritave)
- **raw Hz list**

**Time.** Float beats, where a quarter note is 1.0. Irrational tempo ratios (√2, e:π) rule
out integer ticks. Every time comparison uses an explicit tolerance ε (`cg.time.EPS`), following
Callender's point that irrational convergence needs one.

**Event.** `{ t, dur, pitch, vel, voice }`, with times in beats and pitch as float MIDI.

**Dux (leader).** A list of `{ dur, degree | pitch, rest? }`. It is entered as a list, read
from a MIDI file or Live clip, generated by a random walk, or found by the generator.

**Canon spec.** This JSON describes the whole canon. Example: a three-voice canon in 31-EDO
D Dorian.
```json
{
  "system": { "type": "edo", "divisions": 31, "ref": { "degree": 0, "midi": 62 },
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
| `interval` + `domain` | `degree` transposes by scale steps, so it stays in the scale and the exact intervals change: the generalized "diatonic" answer. `absolute` transposes by an exact cents value or ratio, with optional `quantize: nearest`. In a harmonic series, a degree shift means partial *n* → *n+k*. An absolute ratio *r* means *n* → *n·r*, which stays inside the series when *r* is a whole number. |
| `transform` | `P` (prime), `I` (inversion), `R` (retrograde) or `RI` (retrograde inversion). |
| `axis` | The inversion axis. `axis.kind` is `degree` (mirror in scale steps), `log` (mirror in cents or log-frequency; around f0 this maps harmonic partials onto subharmonics, Fux's arithmetic/harmonic division taken literally) or `partial` (n ↦ N+1−n inside a spectrum). |
| `timeScale` | Augmentation (2), diminution (0.5), or any float. Ratios give mensuration (prolation) canons; irrational ratios give Nancarrow-style tempo canons. |
| `talea` | An optional duration cycle that replaces the leader's rhythm while keeping its pitch order (isorhythm: shared *color*, per-voice *talea*). This is the core of Ligeti mode. |
| `loop`, `spiral` | Perpetual canon, and *per tonos* (each pass transposed by `spiral`, which drifts indefinitely in a microtonal system). |
| `register`, `out` | Octave placement, and the output route (MSP voice, MPE channel). |

Whole-canon fields: `ending` (`free-cadence`, `cut`, `loop` or `converge`) and `rules`
(a profile name, §3.3).

### 3.2 Modules (`code/lib/`, prefix `cg.`)

| Module | Job | First needed |
|---|---|---|
| `cg.rng` | mulberry32, seeded | M0 |
| `cg.tuning` | Scale-system builders, `.scl` parse/write, degree ↔ pitch ↔ Hz, quantize, cents/ratio utilities | M1 |
| `cg.transform` | Transpose (degree or absolute), invert (3 axis kinds), retrograde, time-scale, talea re-rhythm, spiral; all pure, and composable as `T∘I∘R` | M2 |
| `cg.canon` | Turns a spec into events; endings; convergence-point solver; incremental `step()` API | M2 / M6 |
| `cg.consonance` | Pluggable consonance models (below) | M3 |
| `cg.rules` | Rule profiles: hard and soft rules with weights | M3 |
| `cg.analyze` | Vertical slices across N voices, motion classification, violations, dissonance curve | M3 |
| `cg.generate` | Searches for a dux (§3.5) | M4 |
| `cg.io` | Spec JSON, MIDI file export, MusicXML with microtonal accidentals | M2 / M10 |

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
- **`spectral`**: the motion rules use the model's perfect/imperfect classes. Roughness
  ceilings apply per slice and over a sliding window (a density envelope). Register spacing
  follows the spectrum (wide at the bottom, close at the top).
- **`micropoly`** (Ligeti mode): no simultaneous attacks across voices, which Levy describes
  for *Lux aeterna*. The pitch band unfolds step by step. A maximum band width applies.
- **`free`**: no rules. The analyzer still reports.

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

---

## 4. Max layer

### 4.1 Patches (standalone Max first)
- `canon.maxpat` is the main patch, hand-built. It contains:
  - a scale-system chooser with an audition keyboard
  - a canon-spec editor: a voice table with delay, interval, transform, time scale and output
  - buttons: render, generate, analyze
  - a piano roll in `[v8ui]` with voice colors, violation markers and the dissonance curve
- `cg.engine` (generated) hosts the `[v8]` wrappers and named dicts:
  - `cg.spec`: the canon spec
  - `cg.events`: the rendered events
  - `cg.report`: analysis results

### 4.2 Player
The player is Max-native and locked to the transport, and it reads `cg.events`. Times are
floats, so a fixed tick grid is not enough. M0 spike (b) compares three designs:
1. `[delay]`-chained ms scheduling in the scheduler thread, with Overdrive on
2. a fine-grid `[metro @quantize]` pull, as cento does
3. sample-accurate MSP sequencing for the Hz path, through per-voice control buffers or
   `mc.`/`[poly~]`

It picks one design per output path based on measured jitter.

### 4.3 Output adapters (build order)
1. **`cg.voices~`: Hz to an MSP voice bank** (`mc.`, built in M0). Each voice is a simple
   additive synth. Its **partial list is a parameter, and the same list feeds the
   `roughness` consonance model**. There is no MIDI channel limit, which suits dense Ligeti
   textures.
2. **`cg.mpe.out`: MPE MIDI.**
   - one channel per voice (lower zone, channels 2–16)
   - pitch bend range ±48 semitones, which Live 12's tuning system expects; resolution is
     96/16384 ≈ 0.59 cents
   - at most 15 voices per port; denser textures route to MSP
3. **MIDI file** export, one track per voice (M10).
4. **MTS-ESP** (stretch).

### 4.4 Hybrid patch authoring
- **Hand-built:** `patchers/canon.maxpat` and `patchers/parts/cg.panel.*`.
- **Generated:** `patchers/parts/gen/*.maxpat`, written by `tools/patchgen`. This is a
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
| **M0** | Scaffold and spikes | Port cento's layout, bundler, path check, hooks, simulated `[v8]` tests and CI. `cg.hello` round trip. See [`docs/M0-checklist.md`](docs/M0-checklist.md). | Five spikes recorded:<br>(a) a fresh clone loads its bundles with no preference changes<br>(b) the player's jitter is measured and a design chosen<br>(c) a JS-generated 31-EDO note sounds through the MSP Hz path within ±1 cent, then through MPE at ±48<br>(d) the event dict round-trips JS ↔ Max with floats intact<br>(e) a hand-built panel hosts a generated abstraction, and regenerating it leaves the panel untouched |
| **M1** | Scale systems | `cg.tuning`: every builder, `.scl` parse and write, degree/pitch/Hz conversion, quantize. A Max chooser with an audition keyboard. | Cents-value tests pass for every builder. `.scl` fixtures round-trip. Each system auditions in Max. |
| **M2** | Canon renderer (process canons, no rules) | `cg.transform` and `cg.canon.render` for N voices: delay, interval (both domains), P/I/R/RI (all three axis kinds), time scale, talea, loop, spiral, endings. The dux comes from a list, MIDI file or random walk. MPE output finished. | Transform property tests pass. These presets play correctly in Max: a 4-voice round; a Pärt-style prolation canon on a descending scale at 1:2:4:8; a Goldberg-style ladder of canons at each interval; a spiral canon in 31-EDO. |
| **M3** | Analysis and consonance models | `cg.consonance` (all four models), `cg.rules` (`fux-strict` first species, `spectral`, `free`), `cg.analyze`, piano-roll overlays. | **Golden tests from the Fux PDF** (Figs. 5–8):<br>• Fig. 5 is clean<br>• Fig. 6 flags the mode error at bar 1 and the hidden fifth from bar 2 to bar 3, as Fux marks them<br>• Figs. 7–8 show the hidden fifths that diminution reveals<br>The roughness curve matches Sethares's published shape for a harmonic timbre. |
| **M4** | Generator: strict first-species canons | `cg.generate` with a left-to-right search, backtracking, beam, seed, node budget, diagnostics. 2 voices, then N; `fux-relaxed` for N > 2. Time-sliced in `[v8]` with progress. | Valid 2-voice canons at the octave, fifth and fourth with delays of 1–4 bars. 3–4-voice rounds. Same seed, same canon. A 32-note canon finishes in a time budget recorded in M0 without hanging Max. |
| **M5** | Rhythm: species 2–5 and florid | A rhythmic grid; passing and neighbour notes; suspensions (4th species); florid mixtures. Rules follow Fux's chapters on the second to fifth species (pp. 41–70). | A 4th-species canon at the 2nd/9th with chains of suspensions. A florid 2-voice canon passes `fux-strict`. |
| **M6** | Transformations under rules, plus convergence | Generation with I, R and RI voices (outside-in order) and time-scaled voices. Convergence-point solver and "converge at x" endings. | Contrary-motion, crab, table and mensuration canons generated under the rules. The solver matches convergence points worked out by hand (including a √2 case within ε). |
| **M7** | Microtonal and spectral counterpoint | Rule profiles running on the `ratio` and `roughness` models; spectral presets; undertone answers; partial-index inversion. | These presets analyze clean under their own models:<br>• **Tenney *Spectral CANON*-style**: voice *k* on partial *k*, tempo ∝ *k*, rhythm and frequency ratios matched<br>• a strict 31-EDO canon<br>• a Bohlen–Pierce canon<br>• a harmonic-series dux answered in the undertone series |
| **M8** | Micropolyphony (Ligeti mode) | 8–48 voices share one pitch sequence (*color*), each with its own subdivision (3/4/5/6-tuplets) or "elastic talea". `micropoly` rules. Entries, exits and "holes". The band unfolds from a single pitch (*Lux aeterna*, *Lontano*). Density envelopes. MSP output. | A 16-voice texture rendered from one dux reports **zero simultaneous attacks** when that rule is on. Band width follows the envelope. It plays without dropouts in Max. |
| **M9** | Max for Live product | `cg.host.live`, clip writing, Live parameters, a shared panel, Live 12 tuning interplay. | A frozen `.amxd` writes a canon into clips and plays it, without the repo on the search path. |
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

1. **The second PDF.** The brief mentions two attached PDFs, but only Fux's *Study of
   Counterpoint* arrived. Please re-attach the other one.
2. **License.** MIT, like cento?
3. **Ligeti mode details.** The exact rhythmic rules (Levy 2013) and the per-voice subdivisions
   in *Lux aeterna* still need checking against primary sources before M8 (see RESEARCH.md).
4. **Mann's *Study of Fugue*.** The archive.org scan could not be reached from the build
   environment. Its canon and fugue material (translations of Fux, Marpurg and Albrechtsberger)
   should be read before M5 and M6.
