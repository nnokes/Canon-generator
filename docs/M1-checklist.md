# M1: Scale systems

**Goal:** every scale system the canons will use, built and tested in the engine, and
playable in Max: pick a system, play its degrees from a keyboard, hear the exact pitches.

**Exit criteria (from PLAN.md §5):**
- cents-value tests pass for every builder
- `.scl` fixtures round-trip (parse → write → parse gives the same system)
- each system auditions in Max

**Status:** not started.

---

## 0. Carried in from M0
- **Flat layout (PLAN §2.2).** Max can't load from subfolders, so:
  - the starter scale systems are a JS data module (`code/lib/cg-scales.js`), built into
    the bundle
  - your own `.scl` files come in through a file dialog, which gives a full path
  - `.scl` test fixtures go in `tests/fixtures/`, which only Node reads
- **Audition through the Hz path.** M0 proved it to +0.17 cents (`fzero~`'s own bias). Every
  gain ramps through `[line~]` (no clicks). MPE output waits for M2.
- **Pitch checks** fold at the system's period: `cg-tuning`'s `foldCents` and `centsSummary`
  already take a period, so a tritave system (Bohlen–Pierce) folds at 1901.96 cents.

## 1. First check in Max: `[v8]` reads a text file by full path
`.scl` import depends on it, and it's the first half of M2's `.mid` check.
1. `[opendialog]` → a full path → `[v8]` reads the file with Max's `File` object.
2. The script prints the line count and the first line.
3. **Pass** if a `.scl` file from anywhere on disk (e.g. Downloads) loads.
4. **Fallback:** Max's `[text]` object reads the file and sends its lines to the script.

| Check | Result | Decision |
|---|---|---|
| `[v8]` `File` reads a text file by full path | | |

## 2. Engine: `cg-tuning` (Node-tested)
The scale-system object is the one in PLAN §3.1:
`{ name, period_cents, steps_cents, ref, mode }`.

**Builders.** Each one gets tests against known cents values:
- [ ] **n-EDO** (12, 19, 22, 24, 31, 53, 72): step *k* = *k* · 1200 / *n*
- [ ] **Just-intonation ratio list:** 3/2 = 701.955 c, 5/4 = 386.314 c, 7/4 = 968.826 c
- [ ] **Scala `.scl`** parse and write, following the Scala format:
  - `!` comment lines
  - a description line, then the note count
  - one pitch per line: a value with a `.` is cents, anything else is a ratio (`n` alone
    means `n/1`)
  - 1/1 is implied, and the last pitch is the period
  - Round trip on the fixtures.
- [ ] **Harmonic series** m…n over f0, with no period (`period_cents: null`)
- [ ] **Subharmonic (undertone) series**
- [ ] **Stretched or compressed spectrum:** f_k = f0 · k^s (s = 1 gives the harmonic series)
- [ ] **FM spectrum:** |c ± k·m|
- [ ] **Bohlen–Pierce:** 13 steps to 3:1. Tritave = 1901.955 c; step = 146.304 c
- [ ] **Maximally even ME(c, d)** (Clough and Douthett): step *k* = ⌊c·k / d⌋
  - ME(12, 7) = {0, 1, 3, 5, 6, 8, 10}, a diatonic collection
  - ME(12, 5) = {0, 2, 4, 7, 9}, the pentatonic scale
  - ME(31, 7) = {0, 4, 8, 13, 17, 22, 26}: a near-equal 7-note scale, **not** 31-EDO's
    meantone diatonic {0, 5, 10, 13, 18, 23, 28}. A test keeps the two apart.
- [ ] **Raw Hz list**

**Conversions:**
- [ ] degree → pitch → Hz and back:
  - negative degrees, and degrees past one period, wrap by the period
  - non-repeating systems index the full list and raise an error past its ends
- [ ] `mode`: degrees index the mode's subset. The PLAN example, 31-EDO D Dorian =
  [0, 5, 8, 13, 18, 23, 26], plays D E F G A B C.
- [ ] `ref`: any degree can be tied to any MIDI pitch or Hz (A4 = 440 Hz by default)
- [ ] **Quantize:** the nearest pitch in the system, with the cents error. A pitch exactly
  halfway between two steps goes to the lower step (tested).

**Property tests:**
- degree → pitch → degree is the identity
- quantizing twice changes nothing
- every system's steps are in ascending order

## 3. Max: chooser and audition keyboard
- [ ] A `[v8]` wrapper, `code/cg.tuning.v8.js`. One inlet, one outlet, and every output
  starts with a selector. Messages:
  - `system <builder> <args…>`
  - `load <full path>` (an `.scl` file)
  - `degree <n>` → `hz <f> <midi>`
  - `info` → name, size, period
- [ ] **Generated** (wiring): an audition voice. It's an Hz voice with a ramped gain, and a
  simple stepper made of Max objects that plays the scale up and down. JS never schedules.
- [ ] **Hand-built** (UI): `cg.panel.tuning.maxpat`:
  - a menu of starter systems, plus "load .scl…"
  - a keyboard (`[kslider]`, or the computer keyboard) mapped to degrees
  - a readout: degree, Hz, cents from 12-TET
- [ ] **In Max:** each starter system plays from the keyboard and as a scale run. One EDO
  step and one JI ratio are measured with `fzero~` and `centsSummary`; pass if the median is
  within ±1 cent.

## 4. Results

| Check | Result | Decision |
|---|---|---|
| `[v8]` reads a text file (§1) | | |
| every builder's cents tests | | |
| `.scl` round trip | | |
| each system auditions in Max | | |
