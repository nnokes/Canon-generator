# M0: Scaffold and spikes

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
- **To do: pull, then re-run (b) and (c), and run (e).**

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
- [x] 33 Node tests:
  - the engine maths
  - each bundle loaded in a simulated `[v8]`
  - a patch lint: cords, the `[v8]` one-inlet/one-outlet rule, scripts, bpatchers and
    abstractions exist, and generated vs. hand-built ownership

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
   - after **about 45 s**: `player-stats: <count> <mean |error| ms> <max |error| ms> <last
     error ms>`
4. Run it three times, and once more while dragging a window around to load the main
   thread. Send all four `player-stats` lines.

**Pass** if max |error| ≤ 2 ms with Overdrive on. If not, try a fine `[metro]` pull (cento's
approach), or sample-accurate MSP playback for the Hz path. PLAN §4.2 lists both options.

### (c) Microtonal output: `patchers/cg.spike.c-output.maxpat`
- **Hz path (first):**
  1. Click `tone`, then the speaker (`ezdac~`) to turn audio on.
  2. `[cycle~]` plays 31-EDO step 5 above D4 (328.40 Hz), and `[fzero~]` measures it.
     `sigmund~` isn't in Max 9.
  3. Every ~5 s the Max window prints `output-status: cents n 10 mean … min … max …`.
     Send two or three of these lines.
  4. **Pass** if the mean is within ±1 cent.
  
  The Hz path is exact by construction (a float frequency into `[cycle~]`). The tracker is
  only a sanity check, so if `fzero~` itself wobbles by more on a pure sine, record its
  spread instead.
- **MPE path (second):**
  1. Double-click `[midiout]` to choose a port: an MPE synth, an IAC bus into one, or Live
     12 with tuning bypassed.
  2. Click `mpeconfig` **once**. This sends the lower-zone setup: 15 member channels,
     bend ±48. It prints `output-status: mpe zone set …`.
  3. Click `mpenote`, read a tuner on the synth's output, then click `mpeoff`. The note is on
     channel 2.
  4. **Pass** if the tuner reads 328.4 Hz, i.e. E4 −6.5 cents. Resolution is about
     0.6 cents.
  5. Note which synth and port you used.
  
  If your synth ignores the RPN setup, set its bend range to ±48 by hand and note that here.

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
1. Open `canon.maxpat`. Click `hello`. `panel: hello …` should print.
2. Open the panel and move or add something. Save it in Max.
3. Run `npm run patches`. The panel must be unchanged (`git diff` shows only your edit).
4. Edit `patchers/cg.engine.maxpat` (generated) in Max, save it, then run
   `npm run patches:check`. It must report the generated patch as stale. CI checks this
   too.

---

## 3. Results (fill in on your machine)

| Spike | Result | Decision |
|---|---|---|
| (a) search path | **First run:** nothing in subfolders or behind relative paths was found (v8 "can't find file", abstraction "No such object", bpatcher "error loading patcher"). **Re-run after flattening: PASS.** `a1-script`, `a2-abstraction` and `a3-bpatcher` all print `hello canon-generator 0.1.0 seed 1 check 627 2 527 981 note 63.935484 328.401454`, the same values the Node tests produce. | **Flatten**: everything Max loads in `patchers/` (PLAN §2.2). Done. |
| (b) player jitter | Second run: only the load line printed (no stats yet). Now reports `playing`, progress and stats. | |
| (c) Hz / MPE accuracy | **First run:** `sigmund~: No such object` (not in Max 9). **Second run:** MPE setup sent (`mpe zone set`); no cents or tuner reading reported. The cents summary now prints to the Max window. | Use `fzero~`. |
| (d) dict precision | **PASS:** `dict-check: 256 256 1 0`. All 256 doubles came back bit-exact through `[dict]` → `[dict.unpack]` → Max atoms → `[v8]`. | Float event times are safe through dicts and messages; no rounding scheme needed. |
| (e) hybrid workflow | | |

## 4. Notes and gotchas
- `[v8]` needs Max 9 itself (or Live 12.2.1 or later, which bundles it).
- Max ignores symbolic links (cento M0). Don't symlink `patchers/` into the Max Packages
  folder.
- `[v8]` defers incoming messages to the main thread. That's why the player captures
  `[cpuclock]` *before* the onset message reaches the script: deferral can't distort the
  measurement.
- The spike patches and `code/lib/cg-spike.js` are temporary. Remove them, or move them to
  `docs/spikes/`, when M0 closes.
