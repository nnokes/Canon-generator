# M3: Analysis and consonance models

**Goal:** judge any canon the renderer makes:
- every vertical slice against the actual sounding bass, in real registers
- consonance computed in any tuning
- counterpoint rules as hard or soft profiles
- Tymoczko's metrics

The **answer finder** is built on that analysis: give it a melody, and it ranks the
canons hidden in it, for two voices or for N.

**Exit criteria (from PLAN.md §5):**
- **Golden tests from Fux** (*Study of Counterpoint*, Figs. 5–8):
  - Fig. 5 is clean
  - Fig. 6 flags the mode error at bar 1 and the hidden fifth from bar 2 to bar 3, as Fux
    marks them
  - Figs. 7–8 show the hidden fifths that diminution reveals
- **Answer-finder golden tests from Mann:**
  - it finds the eight answers Albrechtsberger lists for Ex. 201 (p. 230)
  - it finds both solutions of the canon for Haydn (Ex. 239–240, p. 261)
- **Your melody:** a `.mid` melody gives ranked 2- and 3-voice lists in Max, and clicking a
  result auditions it.
- **The time-slice budget** is recorded here, and the finder runs with Max's interface
  staying responsive.
- **The roughness curve** matches Sethares's published shape for a harmonic timbre.

**Status:**
- Started 2026-10-15. Parts A–E are built: 136 tests.
- **Next: Max session 1** (below), then part F (the piano roll).
- Carried in from M2: the MPE pitch check at Drift's ±2 (session 1, step 1).

---

## 0. Carried in from M2
- **The MPE pitch check at ±2.** M2's fourth round, moved here when you paused it. Each
  MPE destination has its own bend range (`cg-mpe.RANGES`: Drift ±2, MIDI out ±48).
- **Sources for the golden tests.** Both scans are images only, so the examples are
  transcribed by eye, and each fixture cites its page and figure:
  - Fux: Figs. 5–8, pp. 29–33, PDF pages 18–20 (two book pages per PDF page)
  - Mann:
    - Ex. 201 and the answers in Exs. 205–211 (pp. 228–231)
    - Ex. 239–241 (p. 261)
  - Ex. 241 shows only the first 8 bars of solution 1, and the second solution's score
    isn't in the excerpt. So the end of the Haydn melody is read from Ex. 239's second
    line, and that fixture is marked for you to check against the book (session 1).

## Part A. Consonance models: `cg-consonance` (engine): done
- [x] **One interface:**
  - `fromSpec(spec.consonance, system)` returns a model, and `model.classify(cents,
    { lowHz })` returns `{ cls, fourth, score, ratio }`
  - `cls` is perfect, imperfect or dissonant
  - intervals are folded to the system's period first, except by `roughness`, which hears
    the actual interval in its register
  - the default model is `fux12` for 12-EDO, and `ratio` for everything else
- [x] **The fourth** is flagged on its own (`fourth: true`, `cls` dissonant). It's
  dissonant against the bass (Fux p. 21) and consonant between upper voices; the rules
  decide which applies.
- [x] **`fux12`:** Fux's table, snapped to the nearest semitone within 15 cents. Off-grid
  intervals are dissonant.
- [x] **`ratio`:**
  - the **simplest** ratio within 20 cents, not the nearest: with numbers up to 16,
    something complex is always near
  - scored by Tenney height log₂(n·d): perfect ≤ 2.6 (1/1, 2/1, 3/2), imperfect ≤ 5.4
  - the prime limit is 5, or a JI system's own largest prime. Systems that don't repeat at
    the octave start at 7, because Bohlen–Pierce is built on 3:5:7.
  - it agrees with Fux's table on every 12-EDO class up to two octaves, including the
    tritone (no simple 5-limit ratio) and the minor seventh (9/5 sits just over the
    threshold)
  - in 31-EDO: thirds (5/4, 6/5) and sixths (5/3, 8/5) are imperfect, and the neutral
    third is dissonant
- [x] **`roughness`:**
  - Sethares's `dissmeasure` (2005): D* 0.24, S1 0.0207, S2 18.96, A1 −3.51, A2 −5.75,
    summed over every pair of partials of both tones
  - the timbre is the voice bank's own partials, `DEFAULT_PARTIALS` = 0.48 0.24 0.16
    0.12; a test checks the generated `cg.voice~` plays the same weights
  - classes are thresholds (0.12, 0.45) on roughness, normalized over one period at the
    bass's frequency, so a low third really is rougher
  - it measures sensation, not Fux's classes. With 4 partials at middle C, the minor third
    reads rough. It's for the `spectral` profile.
- [x] **`table`:** your own entries `{ cents, cls }`; the nearest within the tolerance
  wins.
- [x] **Golden (Sethares):** a 7-partial harmonic timbre (amplitudes 0.88ᵏ) has local
  minima at 6/5, 5/4, 4/3, 3/2, 5/3 and 2/1, within 2 cents, at 220, 261.63 and 500 Hz.
  The septimal 7/6, 7/5 and 7/4 are minima too, as expected with a 7th partial.

## Part B. The analyzer core: `cg-analyze` (engine): done
- [x] **`meter`** in the spec, `{ beats, strong }`, default `{ beats: 4, strong: [0] }`.
  `render` passes it through. Every slice knows its bar (from 1), its beat (from 0), and
  whether that beat is strong.
- [x] **Slices** at every onset, built in one sweep:
  - held notes sound on into later slices
  - the **sounding bass** is the lowest pitch, in real registers. A canon voice written as
    the bass but sung above puts its fourth over the real bass, and that's a 6/4 (Mann
    p. 228).
  - each slice has its intervals above the bass and between every pair, classed by the
    model, with `withBass` marking the pairs that include the bass
- [x] **Motion** per voice pair, between consecutive slices: parallel, similar, contrary,
  oblique, or none. Crossings are marked.
- [x] **The Tymoczko metrics** (PLAN §3.6):
  - conjunct motion, in scale steps and in cents
  - the dissonance curve (the model's score above the bass, per slice)
  - harmonic consistency: chord types under octave, order and transposition, compared
    only between slices of the same size
  - macroharmony: size per window, circulation rate, consistency
  - centricity (ours): duration-weighted, with the bass and phrase ends counted double
  - evenness (ours): cents from each slice to the nearest even chord
  - voice-leading size under `vlNorm` (taxicab, euclidean, chebyshev)
  - entries and exits counted apart
  - boundary events: unisons and crossings
- [x] **The report:** `{ model, profile, meter, slices, motion, metrics, violations, hard,
  cost }`

## Part C. Rule profiles and the Fux golden tests: `cg-rules`: done
- [x] **Profiles:** `fux-strict` (first species), `florid`, `canon` (florid plus
  Albrechtsberger's rules), `spectral`, `free`. Your own profile can name a base, override
  rules, remove them, or keep `only` some.
- [x] **`florid` is new** (not in the plan): passing and neighbour notes off the strong
  beats, prepared suspensions resolving down by step, and a 6/4 against the sounding bass
  reported as `six-four`.
  - The answer finder has to judge Albrechtsberger's canons, which are florid. Fux's
    other species arrive in M5; this brings their dissonance treatment forward.
  - Melodic faults are soft in `florid`: a follower inherits the dux's melody.
- [x] **Carrying the rules to other tunings (ours):**
  - augmented/diminished = a k-step size that occurs once in the mode's k-step spectrum.
    In the diatonic scale it flags exactly the tritone (F–B up, B–F down).
  - leap limits are in cents
- [x] **`docs/controls.md`:** every rule, with its source and the profiles that use it.
- [x] **Fux golden tests** (`tests/fixtures/fux/`, each fixture citing its page and
  figure):
  - **Fig. 5:** no hard violations. The only soft costs are the two interior fifths (bars 4
    and 6).
  - **Fig. 6:** exactly two hard violations, as Fux marks them:
    - `mode-final` at bar 1 (G, a fifth from the final D)
    - `hidden-perfect` from bar 2 to bar 3 (a third to a fifth, similar motion)

    With Aloys's corrections (D an octave below, held into a tenth) it's clean.
  - **Figs. 7–8:**
    - each whole-note version: `hidden-perfect` (3→5, then 8→5 descending and ascending)
    - each filled-in version: `parallel-perfect` at the same place, the fifths that the
      filling reveals

## Part D. The answer finder: `cg-finder` (engine): done
- [x] **A generator over the ranges:**
  - settings: intervals (scale steps or exact cents) × delays × transforms × time scales
  - it yields progress (phase, done, total, best so far), stops at a node budget (renders
    plus analyses), and returns the ranked results
  - `find` runs it to the end; `specFor(result)` gives a spec ready to play
- [x] **One follower:**
  - ranked by hard violations, then cost
  - each result shows its violations (rule, bar, beat, voices)
  - each result shows its **answer distortion**: the cents between the degree answer and
    the exact one, measured at the dux's first note
  - each result shows its **inversion** at the period (x ↔ 7 − x in a 7-note mode; Mann
    pp. 231–232)
- [x] **N voices:**
  1. each follower against the dux
  2. each pair of passing followers against each other, rendered without the dux
  3. a clique search for sets where every pair passes. Entries are one after another by
     default (`distinctDelays`).
  4. each set analyzed whole, against its real sounding bass
- [x] **Two findings:**
  - **Fourths need the whole texture.** Steps 1–2 screen with fourths consonant, because
    another voice may sound below. Otherwise solution 1 of the canon for Haydn is lost:
    its alto sits a fourth below the dux, over the tenor and bass.
  - **A 6/4 is hard only where Mann says it's bad** ("in the first or in the last measure
    or on any strong beat", p. 228), and soft elsewhere. Solution 1 has one, on a weak
    beat, in the repeat.
- [x] **`perpetual`:** every voice loops `passes` times, cut at the leader's end, so a
  perpetual canon is judged in its steady state.
- [x] **Mann golden tests** (`tests/fixtures/mann/`):
  - **Ex. 201** (the dux as Exs. 205–211 give it):
    - all eight hidden answers pass: upper 2nd after ½ bar, lower 3rd after 2, upper 6th
      after 2, lower 7th after ½, both octaves after 1, lower 9th after 1½, lower 10th
      after 2. So does the unison.
    - of the 152 settings tried (19 intervals × 8 delays), only 12 pass. The other three
      are octave equivalents: the upper 9th after ½ bar (Ex. 205 an octave up), and the
      lower 2nd and upper 7th after 1½ bars (Ex. 210 one and two octaves up).
    - the lower 9th costs a soft melodic tritone: the leap Albrechtsberger avoids with
      the E♮ in Ex. 210
  - **Ex. 239–240** (the canon for Haydn, 4 voices, perpetual):
    - both solutions pass and are found: lower 5th + lower octave + lower 12th (Ex.
      239/241), and upper 4th + lower octave + lower 5th (Ex. 240)
    - of the 36 sets, the 15 that pass all enter at the fifth below (or fourth above) and
      the octave, in some register
    - **check:** I read bars 9–12 of the melody from an unclear scan (D5 | B4 G4 B4 | C5
      E5 | D5); please compare them with p. 261 (session 1)

## Part E. Max: the finder panel and time slicing: built
- [x] **`code/cg.finder.v8.js`:**
  - one inlet and one outlet
  - it reads the melody, scale system and meter from the dict **`cg.spec`**, which the
    canon wrapper now writes on every render
  - it runs the search from a **`Task`**: each tick works for `slicems` milliseconds
    (default 20), then yields to Max
  - outputs: `progress`, a ranked `results` list (for a umenu), `done <results> <ms>
    <slices> <ms per slice>`, `status`, `error`
  - settings: `voices`, `intervals`, `delays`, `transforms`, `timescales`, `profile`,
    `perpetual`, `budget`
- [x] **Audition:**
  - `pick <i>` writes the result's spec to the dict `cg.audition` and sends `usespec
    cg.audition` through `[s cg.canon.in]`
  - the generated `cg.canon` has the matching `[r cg.canon.in]`, and the wrapper a new
    `usespec`
  - so a result plays through the canon panel's own player, and your canon panel isn't
    touched. A loaded `.mid` stays loaded.
- [x] **`cg.finder.maxpat`** (generated): the `[v8]`, the audition send, and one outlet.
- [x] **`cg.panel.finder.maxpat`** (hand-built, created once):
  - voices, the interval and delay ranges, a profile menu, perpetual, the time slice
  - run / stop / info
  - the results menu (click to audition) and a progress line; `[print finder]` for the
    rest
- [x] **Tests:**
  - the `[v8]` simulation has a `Task` now, driven tick by tick
  - the finder's message list, and bad values reported, not thrown
  - `cg.spec` is written on every render
  - a search on the round runs in many 1 ms slices and lists all 30 settings; the
    round's own answer (unison after two bars) is clean
  - a pick plays in the canon through `usespec`
  - stop leaves nothing running

## Max session 1
**First:** your local edit to the generated MPE check patch has to go. In the repo folder
run `git checkout -- patchers/cg.check.mpe.maxpat`, then `git pull`. Nothing else you
edited is regenerated: the new finder panel is new, and your canon panel is untouched.

1. **The MPE pitch check at ±2** (from M2):
   - open `patchers/cg.check.mpe.maxpat` and turn audio on
   - click `zone`: it prints `bend 2`
   - click `note 64.5`: it prints `note 65 bend 6144`. Hold it about 15 s, then `off`;
     paste every `mpe-check:` line.
   - hold the note again with the **reference sine** on: a unison, or a beating?
   - in the canon panel, set output to **MPE to Drift** and play the 31-EDO spiral. The
     status says `bend +/-2) to Drift`, and the tuning should sound as it does on the Hz
     voices.

   | What you get | Meaning |
   |---|---|
   | median within ±5 cents, range about 2, a unison with the sine | **Pass**: M2's MPE criterion is met |
   | median about +50, range about 0, a beating | Drift ignores per-note bend inside Max; we decide then |
   | anything else | paste it |
2. **The finder, 2 voices:**
   - open `patchers/cg.panel.canon.maxpat` **and** `patchers/cg.panel.finder.maxpat`
   - in the canon panel, load your `.mid` (or keep the round)
   - in the finder: voices 2, intervals −9 to 9, delays 1 to 8 step 1, profile canon. Click
     **run**.
   - the Max window prints `finder: <n> clean of 152 tried in <ms> ms, <slices> slices
     of 20 ms`, and the results menu fills
   - pick a result: the canon panel loads it (`melody ...` prints). Click **play** there.
     Try a few, clean and not.
3. **The finder, 3 voices:**
   - voices 3, delays 2 to 8 step 2, then run: the results are sets of two followers
   - play the best two or three
4. **The time-slice budget:**
   - set time slice to 5 and run a 3-voice search
   - while it runs, play the canon panel and drag a number box
   - repeat with 10, 20, 50, 100 and 200
   - report the largest value at which the interface and the audio stay smooth, and the
     `done` line (its last number is the measured ms per slice)
5. **Check my transcription:** compare bars 9–12 of the canon for Haydn
   (`tests/fixtures/mann/ex239.json`: D5 | B4 G4 B4 | C5 E5 | D5) with Mann p. 261.
6. Paste anything from `finder` or `canon-error`, and anything that sounds wrong.

## Part F. The piano roll (after session 1)
- [ ] `[v8ui]`: voice colours, violation markers and the dissonance curve

## Results

| Check | Result | Decision |
|---|---|---|
| answer finder (Part D) | **PASS** (Node, `tests/finder.test.js`): Ex. 201 gives all eight of Albrechtsberger's answers (plus the unison), and only their octave equivalents besides; Ex. 239–240 gives both solutions | Fourths screened as upper voices until the whole set; a 6/4 hard only on strong beats and in the first and last bars (Mann p. 228) |
| Fux golden tests (Part C) | **PASS** (Node, `tests/analyze.test.js`): Fig. 5 clean; Fig. 6 exactly the mode error at bar 1 and the hidden fifth from bar 2 to 3, clean once corrected; Figs. 7–8 hidden fifths in direct motion, parallel fifths once filled in | Rules as `docs/controls.md` lists them |
| roughness curve (Part A) | **PASS** (Node, `tests/consonance.test.js`): minima at 6/5, 5/4, 4/3, 3/2, 5/3, 2/1 within 2 cents (plus 7/6, 7/5, 7/4), fifth and octave smoother than the third, seconds roughest | Sethares's shape for a harmonic timbre |
