# M1: Scale systems

**Goal:** every scale system the canons will use, built and tested in the engine, and
playable in Max: pick a system, play its degrees from a keyboard, hear the exact pitches.

**Exit criteria (from PLAN.md §5):**
- cents-value tests pass for every builder
- `.scl` fixtures round-trip (parse → write → parse gives the same system)
- each system auditions in Max

**Status:**
- The engine, the `[v8]` wrapper and both patches are built.
- All builders and the `.scl` round trip pass in Node (47 tests in all).
- **To do: the run in Max (§3).**

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

## 1. Engine: `cg-tuning` (Node-tested): done
The scale-system object is the one in PLAN §3.1:
`{ name, period_cents, steps_cents, ref, mode, ratios, period_ratio }`.
- `ref` anchors a **step**, not a degree, so changing the mode never moves the tuning.

**Builders.** Each one is tested against known cents values (`tests/tuning.test.js`):
- [x] **n-EDO** (12, 19, 22, 24, 31, 53, 72): step *k* = *k* · 1200 / *n*. Also `ed(n, period)`
  for any equal division of any period.
- [x] **Just-intonation ratio list:** 3/2 = 701.955 c, 5/4 = 386.314 c, 7/4 = 968.826 c. As in
  Scala, the last ratio is the period.
- [x] **Scala `.scl`** parse and write, following the Scala format:
  - `!` comment lines
  - a description line, then the note count
  - one pitch per line: a value with a `.` is cents, anything else is a ratio (`n` alone
    means `n/1`)
  - 1/1 is implied, and the last pitch is the period
  - Fixtures (`tests/fixtures/`):
    - 5-limit just major (ratios)
    - quarter-comma meantone (cents)
    - just Bohlen–Pierce (period 3/1)
    - an untidy file: CRLF line endings, text after values, a comment between pitches,
      and a bare `2` as the period
  - Unsorted pitches are sorted, with a warning. Broken files are refused with a message
    saying what's wrong.
- [x] **Harmonic series** m…n over f0, with no period (`period_cents: null`)
- [x] **Subharmonic (undertone) series**, lowest first
- [x] **Stretched or compressed spectrum:** f_k = f0 · k^s (s = 1 gives the harmonic series)
- [x] **FM spectrum:** |c ± k·m|. Duplicates and 0 Hz are dropped.
- [x] **Bohlen–Pierce:** 13 steps to 3:1. Tritave = 1901.955 c; step = 146.304 c
- [x] **Maximally even ME(c, d)** (Clough and Douthett): step *k* = ⌊(c·k + offset) / d⌋. It's
  built as c-EDO with the ME set as its mode.
  - ME(12, 7) = {0, 1, 3, 5, 6, 8, 10}, a diatonic collection
  - ME(12, 5) = {0, 2, 4, 7, 9}, the pentatonic scale
  - ME(31, 7) = {0, 4, 8, 13, 17, 22, 26}: a near-equal 7-note scale, **not** 31-EDO's
    meantone diatonic {0, 5, 10, 13, 18, 23, 28}. A test keeps the two apart.
- [x] **Raw Hz list**

**Conversions:**
- [x] degree → pitch → Hz and back:
  - negative degrees, and degrees past one period, wrap by the period
  - non-repeating systems raise an error past their ends
- [x] `mode`: degrees index the mode's steps. The PLAN example, 31-EDO D Dorian =
  [0, 5, 8, 13, 18, 23, 26], plays D E F G A B C.
- [x] `ref`: any step can be tied to any MIDI pitch or Hz (C4 = MIDI 60 by default)
- [x] **Quantize:** the nearest degree, with the error in cents.
  - A pitch exactly halfway goes to the lower degree.
  - Outside a non-repeating system, a pitch goes to the nearest end.

**Property tests, over all 20 starter systems:**
- every system's steps ascend
- degree → pitch → degree is the identity
- quantizing twice changes nothing

## 2. The Max side: built
- **`[v8]` wrapper** `code/cg.tuning.v8.js` → `patchers/cg.tuning.bundle.js`: one inlet,
  one outlet, and every output starts with a selector. Its messages are listed at the top
  of the file:
  - `starter`, `system`, `load`, `mode`, `ref`/`refhz`
  - `play`, `key`, `hold`, `silence`, `info`
- **`.scl` files** are read by `code/max/cg-file.js`, which uses Max's `File` object.
- **Generated** `cg.tuning.maxpat`: the wrapper and an audition voice (a sine with a ramped
  gain). `[fzero~]` measures the voice and sends its readings back to the script. On load,
  it fills the chooser and picks the first starter.
- **Hand-built** `cg.panel.tuning.maxpat` (created once, now yours):
  - the system menu, and "load a .scl file…"
  - a keyboard: C4 plays degree 0
  - "hold degree" (for measuring), silence and info
  - the run: `[metro]` → `[counter]` up and down one period. Max steps it; JS never
    schedules.
  - a readout: degree, Hz, MIDI pitch, cents from 12-TET

## 3. In Max (to do)
`git pull`, then open **`patchers/cg.panel.tuning.maxpat`**. The Max window should print
`tuning: 12-EDO: 12 degrees per period of 1200 cents ref 60 …`.

1. **Play.** Turn audio on (the speaker). Click keys on the keyboard: notes sound, and the
   readout shows degree, Hz, MIDI pitch and cents from 12-TET.
2. **Load a `.scl` file:** the `[v8]` `File` check.
   - Click the button next to "load a .scl file…", and pick
     `tests/fixtures/meantone-quarter-comma.scl` from the repo, or any `.scl` you have.
     Either sits outside `patchers/`, which is the point.
   - **Pass** if the Max window prints `tuning: file read: 17 lines, first: ! meantone…`,
     then the system's name.
   - If it prints `tuning-error: …`, or nothing, paste that: the fallback is Max's `[text]`
     object.
3. **Audition every starter.** Pick each of the 20 systems from the menu, play a few keys,
   and switch on the run for a few seconds. Note any that sound wrong or print an error.
4. **Measure two.** Each `tuning: cents n 10 median …` line takes about 5 s.
   - Choose 31-EDO, type 5 into "hold degree", and wait for two `cents` lines.
   - Choose Just major (5-limit), hold degree 4 (the 3/2), and wait for two more.
   - Click silence.
   - **Pass** if each median is within ±1 cent. `fzero~` reads about +0.17 cents on its
     own.
5. Paste the Max window lines from steps 2 and 4, and anything odd from step 3.

## 4. Results

| Check | Result | Decision |
|---|---|---|
| every builder's cents tests | **PASS** (Node, `tests/tuning.test.js`) | |
| `.scl` round trip | **PASS** (Node): 4 fixtures, plus 31-EDO, Bohlen–Pierce, ME(22,7) and the harmonic 8–16 scale, ratios kept | |
| `[v8]` reads a `.scl` file by full path (§3 step 2) | | |
| each system auditions in Max (§3 steps 3–4) | | |
