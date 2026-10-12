# M0: Scaffold and spikes

> **Closed 2026-10-12.** All five spikes are recorded (Results, §3).
> - (c) passed on the Hz path. Its MPE half moved to M2.
> - Next: [`M1-checklist.md`](M1-checklist.md).

**Goal:** a repo you can clone and open in Max 9, with the build, tests and CI working, and
five spikes that settle the risky platform questions before any music code is written.

**Exit criteria (from PLAN.md §5):**
- all five spikes have a recorded result in the Results table below
- `cg.hello` round-trips from the Node tests to a sounding microtonal note in Max

**Status:**
- The scaffold is done and tested in Node (part 1).
- First run in Max 9: Max found nothing in subfolders of `patchers/` and no relative paths,
  and `sigmund~` is missing from Max 9. Fixed by **flattening**: everything Max loads now
  sits directly in `patchers/` (PLAN §2.2). Spike (c) now uses `fzero~`.
- Second run: **(a) and (d) pass** (Results below). (b) and (c) printed no numbers: the
  player was silent until its last onset, and the cents error only went to a number box.
  Both now report to the Max window.
- Third run: **(b) and the Hz half of (c) pass.**
  - (b)'s 2.3 ms was a start offset, not jitter. The stats now separate offset from jitter,
    and onset 0 is fired by the scheduler.
  - (c) clicked when audio turned on. The sine's gain now ramps.
  - MPE was untested: no synth was listening. It now plays Ableton's Drift
    (`abl.device.drift~`) inside Max and measures it.
- Fourth run: **(e) passes**, and (c) MPE sends the right bytes, but its reading was
  inconclusive.
  - `[fzero~]` jumped an octave on most readings of Drift's rich default sound, so the mean
    meant nothing. The highest reading, +6 cents, leans towards Drift honouring ±48.
  - Now: the summaries fold each reading to the nearest octave and report the median and the
    number of jumps, and Drift runs one oscillator (`@osc2enable 0`).
- Fifth run: (c) MPE sent the zone setup and the note correctly, but **no pitch readings came
  back**. That's the "unreadable" row of the decision rule. The panel in `canon.maxpat`
  answered `panel: hello …`.
- **M0 closed on 2026-10-12** on the Hz path. The MPE pitch check moved to M2 (PLAN §5).
  - The spike patches, `cg-spike.js` and their tests were removed. They're in git history
    at commit `1717e91`.
  - The octave-folding summary moved into `cg-tuning` (`foldCents`, `centsSummary`) for M2's
    MPE check.
  - The sections below are the record of how M0 ran, including spike instructions for files
    that no longer exist.

---

## 1. Scaffold (ported from cento): done

- [x] `package.json`: Node ≥ 20. Scripts: `test`, `build`, `build:watch`, `build:check`,
      `check:paths`, `patches`, `patches:check`, `patches:init`, `hooks`.
- [x] `.gitignore`
- [x] `LICENSE` (MIT)
- [x] `tools/build.js`: cento's bundler. Builds one self-contained
      `patchers/<name>.bundle.js` per `code/*.v8.js`, with `--watch` and `--check`.
- [x] `tools/check-paths.js` and `tools/hooks/pre-commit`: block personal absolute paths,
      stale bundles and stale generated patches.
- [x] `tests/max-sim.js`: cento's simulated `[v8]` context, plus a `Dict` stand-in.
- [x] `.github/workflows/ci.yml`: tests, `build:check`, `check:paths`, `patches:check`.
- [x] `tools/patchgen.py`: the hybrid patch generator (PLAN §4.4):
  - writes the *generated* patches, and `--check`s them in CI
  - creates the *hand-built* ones once with `--init`, then never touches them again
- [x] Engine modules (`code/lib/`, named `cg-<name>.js`, required as `"cg-<name>"`):
  - `cg-rng`: mulberry32
  - `cg-version`
  - `cg-tuning`: MIDI ↔ Hz, cents, EDO steps (M1 grows this)
  - `cg-mpe`: bend for a float pitch at ±48, zone setup, note-on/off bytes
  - `cg-hello`
  - `cg-spike`: helpers for the spikes only; delete after M0
- [x] `[v8]` wrappers:
  - `code/cg.hello.v8.js`
  - `code/cg.spike.v8.js` (for spikes b, c and d)
- [x] 37 Node tests:
  - the engine maths
  - each bundle loaded in a simulated `[v8]`
  - a patch lint: cords, the `[v8]` one-inlet/one-outlet rule, scripts, bpatchers and
    abstractions exist, and generated vs. hand-built ownership
  - spike (e), automated: in a scratch copy of the repo, an edited hand-built patch survives
    `patchgen.py --init` and a plain run byte for byte, missing hand-built patches are
    created, and the generated ones match the repo

### First-time setup on your Mac
```sh
git clone https://github.com/nnokes/Canon-generator.git
cd Canon-generator
npm test            # Node 20+; no npm install needed (no dependencies)
npm run hooks       # optional: the pre-commit check
npm run build:watch # while you work on code/: bundles rebuild, and [v8] reloads them
```

## 2. Spikes (run in Max 9)

Every spike patch is in `patchers/`, next to the main patch, and prints to the Max window.
Turn on **Options → Overdrive** for spike (b).

### (a) Flat layout: `patchers/cg.spike.a-paths.maxpat`
**First run (done):** Max 9 on a fresh clone found nothing in `patchers/scripts/` or
`patchers/parts/`, by bare name or by relative path. The decision was to flatten
(PLAN §2.2).

**Re-run:** keep **File Preferences untouched**, open the patch, and click each message box.

| Row | What it tests | Works if the Max window shows |
|---|---|---|
| 1 | `[v8 cg.hello.bundle.js]`, a script next to the patch | `a1-script: hello canon-generator 0.1.0 …` |
| 2 | `[cg.engine]`, an abstraction next to the patch | `a2-abstraction: hello …` (a solid box, not dashed) |
| 3 | `[bpatcher cg.engine.maxpat]` | the box shows its contents, and `a3-bpatcher: hello …` prints |

**Pass** if all three print and the Max window shows no "can't find file", "No such object"
or "error loading patcher".

### (b) Player jitter: `patchers/cg.spike.b-player.maxpat`
1. Click `playerload 100`. The script fills `[coll cg.queue]` with 200 onsets of a √2:1 tempo
   canon. Their times never land on a grid.
2. Click `go`. A Max-native chain (`[i]` → `[t i i i b]` → `[coll]` → `[if]` → `[delay]`)
   walks the queue in the scheduler thread. Each onset sends `[cpuclock]`'s time to the
   script.
3. Watch the Max window:
   - `player-status: playing` (if it never appears, the chain didn't start, so tell me)
   - `player-status: progress 50 of 200`, then `100` and `150`
   - after **about 45 s**: `player-stats: <count> offset <ms> jitter <ms> sd <ms> drift <ms>`
     - *offset* is a constant start latency (harmless)
     - *jitter* is the largest deviation from it: the real timing spread
     - *drift* is whether the clock walks away over the run
4. Optional: one more run while dragging a window around, to load the main thread.

**Pass** if jitter ≤ 2 ms with Overdrive on.

### (c) Microtonal output: `patchers/cg.spike.c-output.maxpat`
- **Hz path (first):**
  1. Click `tone`, then the speaker (`ezdac~`) to turn audio on.
  2. `[cycle~]` plays 31-EDO step 5 above D4 (328.40 Hz), and `[fzero~]` measures it.
     `sigmund~` isn't in Max 9.
  3. Every ~5 s the Max window prints `output-status: cents n 10 median … min … max …
     octaves 0:10`. Each reading is folded to the nearest octave first; `octaves -1:8 0:2`
     would mean 8 of the 10 readings were an octave low (a sine shouldn't do that). Send two
     or three of these lines.
  4. **Pass** if the median is within ±1 cent.
  
  The Hz path is exact by construction (a float frequency into `[cycle~]`). The tracker is
  only a sanity check, so if `fzero~` itself wobbles by more on a pure sine, record its
  spread instead.
- **MPE path (second), with Ableton's Drift inside Max:** our MPE bytes go one at a time
  (`[iter]`) into `[abl.device.drift~ @drift 0 @osc2enable 0]`. That's Drift from Live, as
  a Max 9 object that takes raw MIDI bytes:
  - `@drift 0` turns off its random per-voice detune
  - `@osc2enable 0` turns off its second oscillator, so the tracker has one clear
    fundamental to follow

  Drift's audio goes to the speakers and to `[fzero~]`, so Max measures the pitch itself,
  with no tuner.
  1. Audio on. Click `silence` (the sine fades), then `mpeconfig` **once** (the zone setup:
     15 member channels, bend ±48).
  2. Click `mpenote 64.5`: a quarter-tone above E4, sent as F4 with a large downward bend,
     which is the reading that best separates a ±48 range from a ±2 one. The Max window
     prints `output-status: mpe note ch 2 note 65 bend 8107 pitch 64.5 = note -50 cents`.
  3. **Hold it for about 15 s**, for 2–3 summaries: `cents n 10 median … min … max …
     octaves … implied bend range <st>`. The bend range is worked out from the folded median.
  4. Click `mpeoff`, and paste the summary lines.
  5. Read them with this rule:

     | Folded median | Implied bend range | What it means |
     |---|---|---|
     | within ±5 cents | ≈ 48 (about 43–53) | **Pass:** Drift honours our MPE setup, and is a usable MPE target inside Max. |
     | ≈ +48 cents | ≈ 2 | Drift kept a ±2 note bend range. Find its note pitch-bend attribute (right-click Drift → Open Reference), set it to 48 in the generator, and re-run once. |
     | ≈ +50 cents | ≈ 0 | Drift ignores per-channel bend: no MPE in this object. |
     | scattered | — | Still unreadable. |

     ±5 cents, not ±1: Drift models an analogue synth, and ±5 still tells 48 from 2 at a
     glance. **Either way, M0 closes after this run.** If the result is "no MPE" or
     "unreadable", M0 closes on the Hz path (the primary output, already passed), and the
     MPE pitch check moves to M2 with an external synth or Live 12.

     If `octaves` still shows readings spread over several octaves, open Drift's reference
     and look for an oscillator-shape attribute (set it to the purest wave), and note the
     name and default of its note pitch-bend range attribute.
  6. If `[abl.device.drift~]` is a dashed box ("No such object"), tell me your Max version
     (Max → About Max).

  `mpenote` with no number plays the test note (`note 64 bend 8181 = note -6.45 cents`). It
  still works, but at −6 cents the two bend ranges are hard to tell apart.
- **External synth (optional):** the same bytes also go to `[midiout]`. Double-click it to
  pick a port, and read a tuner on that synth. Expect 328.4 Hz (E4 −6.45 cents) for
  `mpenote`.

### (d) Dict precision: `patchers/cg.spike.d-dict.maxpat`
1. Click `dictwrite 256`. The script writes 256 full-precision floats into `dict cg.events`.
2. Max reads them back through `[dict]` → `[dict.unpack values:]` and returns them as atoms.
3. `dict-check` prints: expected, received, exact (1/0), max |difference|.
4. **Pass** if exact = 1. If not, record the precision Max keeps: about 1e-7 relative means
   32-bit floats, and event times then need care.

### (e) Hybrid workflow: `patchers/canon.maxpat` → `patchers/cg.panel.main.maxpat`
`canon.maxpat` and the panel are **hand-built**: they were created once by
`npm run patches:init`, and they're yours now. The panel shows the *generated*
`cg.engine.maxpat` in a bpatcher.

What needed Max has been seen in Max:
- `canon.maxpat` loads its script: `canon: hello …` printed (fourth run).
- A bpatcher of the generated `cg.engine.maxpat` loads and answers: spike (a), row 3.

What didn't need Max is now an automated test (`tests/patches.test.js`, every `npm test`
and every CI run): an edited hand-built patch survives the generator byte for byte. The
manual edit-and-diff steps are no longer needed. `npm run patches:check` reports any
generated patch edited in Max as stale, in CI too.

Optional: in `canon.maxpat`, click `hello` above the panel. `panel: hello …` should print.

---

## 3. Results

| Spike | Result | Decision |
|---|---|---|
| (a) search path | **First run:** nothing in subfolders or behind relative paths was found (v8 "can't find file", abstraction "No such object", bpatcher "error loading patcher"). **Re-run after flattening: PASS.** `a1-script`, `a2-abstraction` and `a3-bpatcher` all print `hello canon-generator 0.1.0 seed 1 check 627 2 527 981 note 63.935484 328.401454`, the same values the Node tests produce. | **Flatten**: everything Max loads in `patchers/` (PLAN §2.2). Done. |
| (b) player jitter | **Third run: PASS.** `player-stats: 200 2.298091 2.413542 2.311167` (old format: mean, max, last error), all ≈ 2.3 ms. That is a constant start offset: onset 0 was fired by the mouse click, every other onset by the scheduler. Onset to onset the spread is about ±0.1 ms, with no drift over 45 s. **Fifth run (an optional confirmation):** `queue loaded: 200 events` and `playing` printed. The progress and stats lines would come over the next ~45 s, and weren't in the paste. The chain is unchanged from the third run apart from the 100 ms start delay, so this doesn't change the result. | **Keep design 1** (`[coll]` + `[delay]` in the scheduler thread, PLAN §4.2). Stats now report offset / jitter / sd / drift, and onset 0 goes through `[delay 100]`. |
| (c) Hz / MPE accuracy | **First run:** `sigmund~: No such object` (not in Max 9). **Third run, Hz: PASS.** After the first batch (which caught the attack, min −9.2), every summary reads +0.13 to +0.24 cents, mean ≈ +0.17: `fzero~`'s own bias. **Click** when audio turned on before `tone` (DC from `[cycle~]` at 0 Hz). **MPE:** no synth was listening. **Fourth run, MPE via Drift: bytes correct, reading inconclusive.** The status lines were right (`note 64 bend 8181 … = note -6.451613 cents`; `note 65 bend 8107 pitch 64.5 = note -50 cents`). The one summary, `cents n 10 mean -968.68 min -1239.78 max 6.23`, only fits most readings sitting about an octave low: `fzero~` jumping octaves on Drift's rich default patch. So its `implied bend range 981.77` meant nothing. The highest reading, +6 cents, leans towards ±48: a ±2 range would have read about +48 cents. **Fifth run, MPE via Drift with one oscillator (`@osc2enable 0`): no readings.** `mpe zone set: 15 channels, bend 48` and `mpe note ch 2 note 65 bend 8107 pitch 64.5 = note -50 cents` printed, then no `cents` summaries at all. The tracker reported no pitch. Likely causes, not yet told apart: Drift went silent with its second oscillator off, its level fell below what `fzero~` tracks, or audio was off. | Use `fzero~`. The gain now ramps via `[line~]`; every M2 voice gets a ramp (PLAN §4.3). **MPE: unreadable, so by the decision rule M0 closes on the Hz path, and the MPE pitch check moves to M2** with an external MPE synth or a Live 12 instrument. Drift stays a candidate if a listen confirms it sounds. |
| (d) dict precision | **PASS:** `dict-check: 256 256 1 0`. All 256 doubles came back bit-exact through `[dict]` → `[dict.unpack]` → Max atoms → `[v8]`. | Float event times are safe through dicts and messages; no rounding scheme needed. |
| (e) hybrid workflow | **PASS.** The hand-built `canon.maxpat` loads its script: `canon: hello canon-generator 0.1.0 seed 1 check 627 2 527 981 note 63.935484 328.401454` (fourth run). A bpatcher of the generated engine loads and answers: spike (a), row 3. The hand-built panel hosting the generated engine answers too: `panel: hello canon-generator 0.1.0 seed 1 check 627 2 527 981 note 63.935484 328.401454` (fifth run). "Regenerating never touches a hand-built patch" is an automated test now. | **Keep the hybrid workflow** (PLAN §4.4): generated patches for wiring, hand-built for the main patch and panels, ownership checked on every `npm test` and CI run. |

## 4. Notes and gotchas
- `[v8]` needs Max 9 itself (or Live 12.2.1 or later, which bundles it).
- Max ignores symbolic links (cento M0). Don't symlink `patchers/` into the Max Packages
  folder.
- `[v8]` defers incoming messages to the main thread. That's why the player captures
  `[cpuclock]` *before* the onset message reaches the script: deferral can't distort the
  measurement.
- The spike patches and `code/lib/cg-spike.js` were removed when M0 closed (in git history
  at commit `1717e91`).
- **What M0 didn't measure:** how much work `[v8]` can do in one time slice before Max's
  interface stutters. Spike (b) measured the scheduler, not compute. M3 measures it, when time
  slicing is first built for the answer finder (PLAN §5).
