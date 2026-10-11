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
- Third run: **(b) and the Hz half of (c) pass.**
  - (b)'s 2.3 ms was a start offset, not jitter. The stats now separate offset from jitter,
    and onset 0 is fired by the scheduler.
  - (c) clicked when audio turned on. The sine's gain now ramps.
  - MPE was untested: no synth was listening. It now plays Ableton's Drift
    (`abl.device.drift~`) inside Max and measures it.
- **To do: pull, then re-run (b) (a confirmation) and (c) MPE, and run (e).**

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
- [x] 35 Node tests:
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
  3. Every ~5 s the Max window prints `output-status: cents n 10 mean … min … max …`.
     Send two or three of these lines.
  4. **Pass** if the mean is within ±1 cent.
  
  The Hz path is exact by construction (a float frequency into `[cycle~]`). The tracker is
  only a sanity check, so if `fzero~` itself wobbles by more on a pure sine, record its
  spread instead.
- **MPE path (second), with Ableton's Drift inside Max:** our MPE bytes go one at a time
  (`[iter]`) into `[abl.device.drift~ @drift 0]`. That's Drift from Live, as a Max 9 object
  that takes raw MIDI bytes. `@drift 0` turns off its random per-voice detune. Drift's audio
  goes to the speakers and to `[fzero~]`, so Max measures the pitch itself, with no tuner.
  1. Audio on. Click `silence` (the sine fades), then `mpeconfig` **once** (the zone setup:
     15 member channels, bend ±48).
  2. Click `mpenote`. The Max window prints `output-status: mpe note ch 2: note 64 bend 8181
     pitch 63.935… = note -6.45 cents`, then every ~5 s `cents n 10 mean … implied bend
     range <st>`.
  3. Click `mpenote 64.5` (a quarter-tone above E4: sent as F4 with a large downward bend).
     This gives the clearest bend-range reading. Then click `mpeoff`.
  4. Read `implied bend range`:

     | Reading | What it means |
     |---|---|
     | ≈ 48 | Drift honoured our RPN setup. **Pass** if the cents mean is within ±1 cent. |
     | ≈ 2 | Drift kept MIDI's default and ignored the RPN; the mean will be about −48 cents on `mpenote 64.5`. We then set Drift's bend range another way (a Drift attribute, or an `mpeformat` setting). |
     | ≈ 0, or nonsense | Drift ignored per-channel bend (no MPE in this object). |

  5. Paste the lines. If `[abl.device.drift~]` is a dashed box ("No such object"), tell me
     your Max version (Max → About Max).
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
1. Open `canon.maxpat`. Click `hello`. `panel: hello …` should print.
2. Open the panel and move or add something. Save it in Max.
3. Run `npm run patches`. The panel must be unchanged (`git diff` shows only your edit).
4. Edit `patchers/cg.engine.maxpat` (generated) in Max, save it, then run
   `npm run patches:check`. It must report the generated patch as stale. CI checks this
   too.

---

## 3. Results

| Spike | Result | Decision |
|---|---|---|
| (a) search path | **First run:** nothing in subfolders or behind relative paths was found (v8 "can't find file", abstraction "No such object", bpatcher "error loading patcher"). **Re-run after flattening: PASS.** `a1-script`, `a2-abstraction` and `a3-bpatcher` all print `hello canon-generator 0.1.0 seed 1 check 627 2 527 981 note 63.935484 328.401454`, the same values the Node tests produce. | **Flatten**: everything Max loads in `patchers/` (PLAN §2.2). Done. |
| (b) player jitter | **Third run: PASS.** `player-stats: 200 2.298091 2.413542 2.311167` (old format: mean, max, last error), all ≈ 2.3 ms. That is a constant start offset: onset 0 was fired by the mouse click, every other onset by the scheduler. Onset to onset the spread is about ±0.1 ms, with no drift over 45 s. | **Keep design 1** (`[coll]` + `[delay]` in the scheduler thread, PLAN §4.2). Stats now report offset / jitter / sd / drift, and onset 0 goes through `[delay 100]`. |
| (c) Hz / MPE accuracy | **First run:** `sigmund~: No such object` (not in Max 9). **Third run, Hz: PASS.** After the first batch (which caught the attack, min −9.2), every summary reads +0.13 to +0.24 cents, mean ≈ +0.17: `fzero~`'s own bias. **Click** when audio turned on before `tone` (DC from `[cycle~]` at 0 Hz). **MPE:** no synth was listening. | Use `fzero~`. The gain now ramps via `[line~]`; every M2 voice gets a ramp (PLAN §4.3). MPE is now measured with Drift inside Max. |
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
