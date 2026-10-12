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

**Status:**
- Parts A–D are built and tested in Node: 78 tests in all.
- **To do: Max session 1** (end of part D).
- Then parts E and F.

**In M2 / later:**

| In M2 | Later |
|---|---|
| per-voice: `delay`, `interval` + `domain`, `scale` (answer scale), `transform` (P/I/R/RI, `segmentRetrograde`, `segmentPermute`), `axis` (degree, log, partial, linear), `timeScale`, `tapeSpeed`, `talea`, `loop`, `spiral` (transpose), `register`, `out` | `env` and `mask` (M8, Ligeti mode), `space` (with multichannel output), `spiral.kind: scaleWalk` (M7) |
| whole canon: `ending` (`cut`, `free-cadence`, `loop`), `groups` (double and triple canons), `free` voices | `ending: converge` (M6, needs the convergence solver), `rules` (M3) |

---

## Part A. Time and events (engine): done
- [x] `cg-time`: float beats, with `EPS` and comparisons that use it (PLAN §3.1: irrational
  ratios need a tolerance)
- [x] The event model `{ t, dur, pitch, vel, voice }`, sorted by time, then voice. Each event
  also carries:
  - `index`: which dux note it came from (M3's analysis needs it)
  - `pass`
  - `coda`, for cadence notes
- [x] Events into the named dict `cg.events` (M0 spike d showed doubles survive exactly).
  The Max wrapper writes it on every render.

## Part B. Transforms: `cg-transform` (engine): done
A note is a scale degree plus a cents offset, so off-scale pitches stay exact through
scale-step transposition.
- [x] Transpose:
  - `degree` domain: scalar, in steps of the active scale
  - `absolute` domain: cents or a ratio, with optional `quantize: nearest`
- [x] Invert around an `axis`:
  - `degree`: mirror in scale steps
  - `log`: mirror in cents
  - `partial`: n ↦ N + 1 − n inside a spectrum
  - `linear`: f ↦ 2c − f in Hz
- [x] Retrograde and RI. Plus `segmentRetrograde` (each segment reversed in place) and
  `segmentPermute` (beats inside each segment reordered; ties and rests come along)
- [x] `timeScale` (any float, irrational included), and `tapeSpeed` (ratio *r* plus
  time scale 1/*r*)
- [x] `talea`: a duration cycle replaces the rhythm, keeping the pitch order
- [x] Answer `scale`: degree *x* of the dux's system maps to degree *x + c* of the
  follower's (interscalar)
- [x] **Property tests** (PLAN §6):
  - I∘I = id and R∘R = id
  - transposing up then down gives the identity
  - augmentation then diminution gives the identity
  - transforms compose (T∘I∘R)

## Part C. Renderer: `cg-canon` (engine): done
The order inside a voice:
1. segment transform
2. retrograde
3. inversion
4. transposition (scale steps or exact)
5. answer scale
6. rhythm (talea, time scale)
7. register
8. passes, with spiral

Specs can also use `groups` with a `start` time each, so canons can follow one another
(the ladder). A random-walk dux (`source: "walk"`, seeded) is in too.
- [x] `render(spec)` → `{ voices: [{ events }], meta }`, for N voices
- [x] `step(state, leaderEvent)` → follower events. **`render` equals the fold of
  `step()`** (a property test; this is what live mode needs later).
- [x] `register` (octave placement) and `out` (Hz voice or MPE channel) per voice
- [x] `loop` (perpetual) and `spiral` (each pass transposed, so it drifts in a microtonal
  system)
- [x] Endings:
  - `cut`
  - `loop`: every voice repeats `passes` times, and all stop at the end of the leader's
    last pass. Whether the last note leads smoothly back is M3's analyzer check.
  - `free-cadence`: after the cut, the outer voices close with 7–6 | 8 (ending on the
    octave) or 2–3 | 1 (on the unison). Each line is placed nearest where its voice is,
    and the inner voices hold the final, its third or its fifth. In M2 this is a fixed
    formula; M4 can write smarter codas under the rules.
- [x] `groups` (several canons at once: double, triple) and `free` voices (e.g. a cantus
  firmus)
- [x] **Presets** as JS data, built into the bundle (PLAN §2.2), with Node tests on their
  rendered events:
  - the round: voice *k* is the dux, *k* section-lengths later
  - Pärt: durations exactly 1:2:4:8
  - the spiral: each pass transposed by the spiral step

## Part D. Max, first session: presets play
- [x] **Wrapper** `code/cg.canon.v8.js`:
  - presets, tunings, preset, tuning, tempo, render
  - the voice editor: select, then delay, interval, transform, timescale, register, passes
  - loadspec and savespec (JSON, through a file dialog)

  A bad edit is refused, and the spec stays as it was. The spec commands are `loadspec`
  and `savespec`, not `load` and `save`, because `[v8]` calls any `save()` function
  whenever the patch is saved.
- [x] **Player** (in the generated `cg.canon.maxpat`; design 1 from M0):
  - `[coll]` + `[delay]` in the scheduler, started through `[delay 100]`
  - each `[coll]` row holds the delay to the next note, then the note
  - notes at the same time have a delay of 0, and the last row's -1 stops the chain
- [x] **Hz voice bank** `[poly~ cg.voice~ 32]` (generated):
  - four harmonic partials; their weights are a `partials` message
  - each note's envelope is one `[line~]` list, so no note-offs
  - each voice is busy for its note's length, timed by Max
  - voices are panned across the stereo field, equal power
  - `[poly~]`'s `note` message strips the word "note", so a voice gets notes as plain lists
- [x] **Canon panel** `cg.panel.canon.maxpat` (hand-built, created once):
  - preset and tuning menus, play/stop, tempo, volume
  - load a spec / save the spec
  - the voice editor
  - **Changed from the plan:** one editor where you pick the voice by number, instead of
    one bpatcher row per voice. The presets have up to 19 voices, and one editor is simpler
    to wire and to use.
- [x] The patch lint now also checks that `[poly~ <voice>]` names a patch in `patchers/`.
- [ ] **Max session 1** (below)

### Max session 1
`git pull`, then open **`patchers/cg.panel.canon.maxpat`**. The Max window should print
`canon: 4-voice round (Frere Jacques): 4 voices, 256 notes, 88 beats at 100 bpm (53 s)`.

1. Turn audio on (the speaker), click **play**: the round, its four voices entering every
   two bars, spread left to right. Click **stop**: everything fades out.
2. **Every preset:** pick it, play at least 30 s, then stop. Listen for:

   | Preset | What to hear |
   |---|---|
   | round | entries every 2 bars, each voice twice through |
   | double canon | 5 voices (2 high, 3 low); after the canon, a cadence closing on D |
   | prolation 1:2:4:8 | the same descending line at four speeds, the fastest highest |
   | Goldberg ladder | a 2-voice canon every 4 bars, at the unison, then the second, ... the ninth, over the ground bass |
   | 31-EDO spiral | the canon rising a whole tone each pass. The 7th pass starts 38.7 cents short of the octave above the first. |
3. **Voice editor:** on the round, set voice to 1. Voices count from 0, so that's the one
   named "voice 2". Then:
   - set transform to I: that voice now plays the round upside down
   - set time scale to 2: it plays twice as slowly
   - type 0 into time scale: `canon-error: time scale must be above 0`, and nothing
     changes
4. **Tuning menu:** play the round in "31-EDO D Dorian" or "Just major (5-limit)". Then try
   plain "31-EDO": the presets' degrees then fall on 31-EDO's small steps, so the melody
   shrinks.
5. **Save and load:** "save the spec…" as `test.json` anywhere, pick another preset, then
   "load a spec…" with `test.json`. It should come back as saved. This is the first file
   *write* from `[v8]`.
6. Paste anything from `canon-error`, and note anything that sounds wrong: clicks, notes
   cut short, timing, voices missing.

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
