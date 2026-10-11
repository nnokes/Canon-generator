# M0: Scaffold and spikes

**Goal:** a repo you can clone and open in Max 9, with the build, tests and CI working, and
five spikes that settle the risky platform questions before any music code is written.

**Exit criteria (from PLAN.md §5):** all five spikes have a recorded result in the Results
section below, and `cg.hello` round-trips from Node tests to a sounding microtonal note in Max.

---

## 1. Scaffold (port from cento)

- [ ] `package.json`:
  - Node ≥ 20
  - scripts: `test`, `build`, `build:watch`, `build:check`, `check:paths`, `patches`,
    `patches:check`, `hooks`
  - `NODE_PATH=code/lib` for tests
- [ ] `.gitignore`: `node_modules/`, `frozen/`, `.DS_Store`, and personal data paths.
- [x] `LICENSE`: MIT (added).
- [ ] Before each spike, read the relevant pages of the official Max documentation
      (<https://docs.cycling74.com/>): the `v8` reference, File Preferences and the search
      path, Projects, Packages, and freezing Max for Live devices. Note in the Results table
      where Max's actual behavior differs from what the docs say.
- [ ] `tools/build.js`: port cento's bundler.
  - one self-contained `patchers/scripts/<name>.bundle.js` per `code/*.v8.js`
  - module prefix `cg.`
  - `--watch` and `--check` modes
- [ ] `tools/check-paths.js` and `tools/hooks/pre-commit`: block personal absolute paths in
      committed files.
- [ ] `tests/helpers/v8-sim.js`: port cento's simulated `[v8]` context (`post`, `outlet`,
      `Dict`, `Task`, `inlets`/`outlets`).
- [ ] `.github/workflows/ci.yml`: `npm test`, `npm run build:check`, `npm run check:paths`
      (and `patches:check` once `tools/patchgen` exists).
- [ ] `code/lib/cg.rng.js` (mulberry32) with tests.
- [ ] `code/lib/cg.hello.js` and `code/cg.hello.v8.js`.
  - Input: `edo 31 step 5`. Output: `note <midi-float> <hz>`.
  - Unit test, plus a bundle test in the simulated `[v8]` context.
- [ ] `patchers/canon.maxpat`: a minimal hand-built shell with one `[v8]` box (with a
      `textfile` entry) loading `cg.hello.bundle.js`.

## 2. Spikes

### (a) Search path: does a fresh clone load its bundles with no preference changes?
On a fresh clone, with Max's File Preferences untouched, try three layouts and record which
ones work. Then pick one for the whole project and update PLAN.md §2.2–2.3.
1. Relative path in the `[v8]` `textfile` entry or argument, e.g. `scripts/cg.hello.bundle.js`.
2. A Max Project (`canon.maxproj`) that lists `patchers/`, `parts/`, `parts/gen/` and
   `scripts/`.
3. Flat fallback: the bundles sit beside `canon.maxpat`.

Also check that an abstraction in `patchers/parts/gen/` is found by name from `canon.maxpat`.
Use the same three conditions.

### (b) Player: float-time accuracy
Render 200 events of a √2:1 tempo canon, whose times are irrational and never land on a
grid. Log the actual onset times with `[cpuclock]` and compare them with the intended ones,
using the same three player designs:
1. `[delay]`-chained ms scheduling (scheduler thread, Overdrive on).
2. A fine-grid `[metro @quantize]` pull, as in cento.
3. Sample-accurate MSP sequencing for the Hz path (control buffers, or `mc.` / `[poly~]`).

Record the mean and maximum jitter in ms, and the CPU cost. Choose one design per output path.

### (c) Microtonal output (Hz path first, then MPE)
1. **Hz to MSP:** `cg.hello` emits 31-EDO step 5 above D4. A minimal `cg.voices~` (`mc.cycle~`
   or a small additive synth) plays it. Measure the pitch with `[sigmund~]` or `[fzero~]`.
   **Pass if within ±1 cent.**
2. **MPE:** send the same note on channel 2 with pitch bend range ±48 (send the MPE
   configuration and RPN 0 first) into an MPE synth, or into Live 12 with tuning bypassed.
   Check it on a tuner. Expected resolution: 96/16384 ≈ 0.59 cents.

### (d) Dict round trip
The `[v8]` writes a 500-event list (float times and float pitches) into the named dict
`cg.events`. The Max player reads it back. **Pass if values survive bit-exact**, or record the
precision Max keeps.

### (e) Hybrid patch workflow
`tools/patchgen` writes a trivial `patchers/parts/gen/cg.engine.maxpat`. The hand-built
`patchers/parts/cg.panel.main.maxpat` hosts it in a `[bpatcher]`. Edit the panel by hand,
regenerate `cg.engine`, and confirm two things:
1. The panel is untouched.
2. `patches:check` catches a stale generated file.

Also run `tests/patches.test.js` (a lint that every `[v8]` has a `textfile` entry naming an
existing bundle) on both files.

---

## 3. Results (fill in during M0)

| Spike | Result | Decision |
|---|---|---|
| (a) search path | | |
| (b) player jitter | | |
| (c) Hz / MPE accuracy | | |
| (d) dict precision | | |
| (e) hybrid workflow | | |

## 4. Notes and gotchas found
- Check that Max 9 itself (or Live 12.2.1 or later, which bundles it) is in use. `[v8]` needs
  it.
- Max ignores symbolic links (cento M0). Do not symlink `patchers/` into the Max Packages
  folder.
