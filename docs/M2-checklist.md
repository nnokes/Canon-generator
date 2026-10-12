# M2: Canon renderer (process canons, no rules)

**Goal:** turn a canon spec into sounding voices. That means any number of voices, each with
its own:
- delay
- interval (in scale steps or exact)
- transform: prime, inversion, retrograde, retrograde inversion, and the segment transforms
- time scale (augmentation, diminution, any ratio)
- answer scale

All of it plays in Max through the Hz voice bank or MPE. No counterpoint rules yet: M2
renders and plays; M3 judges.

**Exit criteria (from PLAN.md §5):**
- the transform property tests pass
- these presets play correctly in Max:
  - a 4-voice round
  - a double canon in the layout of Palestrina's Ex. 225 (Mann p. 242)
  - a Pärt-style prolation canon on a descending scale at 1:2:4:8
  - a Goldberg-style ladder of canons at each interval
  - a spiral canon in 31-EDO
- **MIDI import:**
  - these fixtures come in with pitches and times intact:
    - a 12-TET melody
    - a 31-EDO melody written with pitch bend
    - a polyphonic file (one line taken, the rest reported)
    - a clip exported from Live
  - one of them plays as a canon in Max
- **MPE pitch** (carried over from M0 spike c): a quarter-tone note (64.5) through
  `cg.mpe.out`, measured with `fzero~` and `centsSummary`. The folded median is within
  ±5 cents, and the implied bend range is about 48.

**Status:** not started.

**In M2 / later:**

| In M2 | Later |
|---|---|
| per-voice: `delay`, `interval` + `domain`, `scale` (answer scale), `transform` (P/I/R/RI, `segmentRetrograde`, `segmentPermute`), `axis` (degree, log, partial, linear), `timeScale`, `tapeSpeed`, `talea`, `loop`, `spiral` (transpose), `register`, `out` | `env` and `mask` (M8, Ligeti mode), `space` (with multichannel output), `spiral.kind: scaleWalk` (M7) |
| whole canon: `ending` (`cut`, `free-cadence`, `loop`), `groups` (double and triple canons), `free` voices | `ending: converge` (M6, needs the convergence solver), `rules` (M3) |

---

## Part A. Time and events (engine)
- [ ] `cg-time`: float beats, with `EPS` and comparisons that use it (PLAN §3.1: irrational
  ratios need a tolerance)
- [ ] The event model `{ t, dur, pitch, vel, voice }`, sorted by time, then voice
- [ ] Events into the named dict `cg.events` (M0 spike d showed doubles survive exactly)

## Part B. Transforms: `cg-transform` (engine)
- [ ] Transpose:
  - `degree` domain: scalar, in steps of the active scale
  - `absolute` domain: cents or a ratio, with optional `quantize: nearest`
- [ ] Invert around an `axis`:
  - `degree`: mirror in scale steps
  - `log`: mirror in cents
  - `partial`: n ↦ N + 1 − n inside a spectrum
  - `linear`: f ↦ 2c − f in Hz
- [ ] Retrograde and RI. Plus `segmentRetrograde` (each segment reversed in place) and
  `segmentPermute` (beats inside each segment reordered; ties and rests come along)
- [ ] `timeScale` (any float, irrational included), and `tapeSpeed` (ratio *r* plus
  time scale 1/*r*)
- [ ] `talea`: a duration cycle replaces the rhythm, keeping the pitch order
- [ ] Answer `scale`: degree *x* of the dux's system maps to degree *x + c* of the
  follower's (interscalar)
- [ ] **Property tests** (PLAN §6):
  - I∘I = id and R∘R = id
  - transposing up then down gives the identity
  - augmentation then diminution gives the identity
  - transforms compose (T∘I∘R)

## Part C. Renderer: `cg-canon` (engine)
- [ ] `render(spec)` → `{ voices: [{ events }], meta }`, for N voices
- [ ] `step(state, leaderEvent)` → follower events. **`render` equals the fold of
  `step()`** (a property test; this is what live mode needs later).
- [ ] `register` (octave placement) and `out` (Hz voice or MPE channel) per voice
- [ ] `loop` (perpetual) and `spiral` (each pass transposed, so it drifts in a microtonal
  system)
- [ ] Endings:
  - `cut`
  - `loop`: the last note leads back into the second bar
  - `free-cadence`: a short coda closing on 2–3 | 1 or 7–6 | 8, or on a unison, octave or
    third. In M2 this is a fixed formula; M4 can generate smarter codas under the rules.
- [ ] `groups` (several canons at once: double, triple) and `free` voices (e.g. a cantus
  firmus)
- [ ] **Presets** as JS data, built into the bundle (PLAN §2.2), with Node tests on their
  rendered events:
  - the round: voice *k* is the dux, *k* section-lengths later
  - Pärt: durations exactly 1:2:4:8
  - the spiral: each pass transposed by the spiral step

## Part D. Max, first session: presets play
- [ ] **Player** (generated, design 1 from M0): `[coll]` + `[delay]` in the scheduler,
  started through a short `[delay]`. Each event goes to its voice.
- [ ] **Hz voice bank** `cg.voices~` (generated):
  - additive voices whose partial list is a parameter (the same list M3's roughness model
    will use)
  - each note's envelope is one `[line~]` list, so no note-off scheduling is needed
  - every gain ramps
- [ ] **Canon panel** (hand-built):
  - a preset menu; render, play and stop; tempo
  - the scale system (reusing `cg.tuning`)
  - one voice row per voice (a bpatcher): delay, interval + domain, transform, time scale
- [ ] **Max session 1:** all five presets play, and changing a voice row re-renders.

## Part E. Your melody: dux sources (engine + Max)
- [ ] A list, and a seeded random walk
- [ ] **`.mid` import** in `cg-io` (PLAN §3.1 "Dux sources"):
  - a pure-JS Standard MIDI File reader: types 0 and 1, tempo map, PPQ
  - pitch bend with each channel's RPN range, including MPE, so pitches come in exact
  - `line` (top, bottom or track), with what was dropped reported
  - `quantize` (optional)
  - `map`: exact, nearest, or degree
- [ ] Fixtures in `tests/fixtures/`:
  - the 12-TET, 31-EDO pitch-bend and polyphonic files are generated by a script, so their
    contents are known exactly
  - **a clip exported from Live comes from you** (Live: right-click a clip →
    Export MIDI Clip…)
- [ ] **First check in Max:** `[v8]`'s `File` reads raw bytes (M1 proved text). Fallback:
  `[detonate]` reads the file and passes its events in.

## Part F. MPE out: `cg.mpe.out` (generated)
- [ ] Lower zone: channels 2–16, bend ±48 (`cg-mpe` from M0), one channel per sounding
  voice. Note-offs are timed by Max, not JS. Voices beyond 15 go to the Hz path.
- [ ] **The MPE pitch check.** Its audio has to reach `[fzero~]` in Max. In order of effort:
  1. **Drift inside Max again, with its second oscillator on** (the default). The first M0
     run *did* give readings that way; they only jumped octaves, and octave folding now
     handles that.
  2. An external MPE synth or a Live 12 instrument, its audio brought back into Max: an
     audio interface input, or a loopback device, into `[adc~]`.
- [ ] **Max session 2:** a `.mid` melody plays as a canon, and the MPE check.

## Results

| Check | Result | Decision |
|---|---|---|
| transform property tests | | |
| presets play in Max (session 1) | | |
| `[v8]` reads raw bytes (Part E) | | |
| `.mid` fixtures import intact | | |
| a `.mid` melody plays as a canon | | |
| MPE pitch (Part F) | | |
