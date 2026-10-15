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
- Started 2026-10-15. Parts A–E come first, then Max session 1, then part F.
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

## Part A. Consonance models: `cg-consonance` (engine)
- [ ] One interface. `fromSpec(spec.consonance, system)` returns a model, and
  `model.classify(cents)` returns `{ cls, fourth, score }`:
  - `cls` is perfect, imperfect or dissonant
  - intervals are folded to the system's period first
  - the default model is `fux12` for 12-EDO and `ratio` otherwise
- [ ] `fux12`: Fux's table. The fourth is flagged on its own: it's dissonant against the
  bass and consonant between upper voices.
- [ ] `ratio`: the nearest simple ratio, scored by Tenney height log₂(n·d), with
  thresholds per system
- [ ] `roughness`: Sethares (after Plomp and Levelt), using the voice bank's own partials
- [ ] `table`: your own table per scale system
- [ ] Golden: Sethares's minima for a harmonic timbre (1/1, 6/5, 5/4, 4/3, 3/2, 5/3, 2/1)

## Part B. The analyzer core: `cg-analyze` (engine)
- [ ] `meter` in the spec: a strong beat is a bar start
- [ ] Slices at every onset:
  - the sounding bass is the lowest pitch, in real registers (Mann p. 228)
  - each slice has its intervals above the bass and between every pair
- [ ] Motion per voice pair: parallel, similar, contrary or oblique
- [ ] The Tymoczko metrics (PLAN §3.6)
- [ ] The report: slices, violations (rule, bar, beat, voices, hard or soft), metrics and
  score

## Part C. Rule profiles and the Fux golden tests: `cg-rules`
- [ ] `fux-strict` (first species), `florid` (dissonance treatment for florid canons),
  `canon`, `spectral`, `free`
- [ ] `docs/controls.md`: every rule, with its source
- [ ] Fixtures `tests/fixtures/fux/`: Figs. 5–8

## Part D. The answer finder: `cg-finder` (engine)
- [ ] A generator over the ranges, with a node budget and progress
- [ ] One follower: a ranked list. N voices: pairs, a clique search, then the whole set.
- [ ] Mann golden tests: Ex. 201's eight answers, and the canon for Haydn

## Part E. Max: the finder panel and time slicing
- [ ] `cg.finder.v8.js`, time-sliced from a `Task`
- [ ] The canon wrapper writes `cg.spec`, and a picked result plays through the canon
  panel (`usespec`)
- [ ] `cg.panel.finder.maxpat` (hand-built, created once)

## Max session 1
(Written when part E is done.)

## Part F. The piano roll (after session 1)
- [ ] `[v8ui]`: voice colours, violation markers and the dissonance curve

## Results

| Check | Result | Decision |
|---|---|---|
