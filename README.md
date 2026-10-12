# Canon Generator

A canon generator for **Max/MSP** (with **Max for Live** later), made for composing classical
electroacoustic music. It ranges from strict Fux-style canons through process canons
(mensuration, tempo, spiral) to Ligeti-style micropolyphony, in any tuning: equal divisions,
just intonation, Scala files, and harmonic and inharmonic spectra.

> **Status:** M0 (scaffold and spikes) and M1 (scale systems) are done. M2, the canon
> renderer, is under way ([`docs/M2-checklist.md`](docs/M2-checklist.md)). To play the
> preset canons, open `patchers/cg.panel.canon.maxpat`; for the scale systems,
> `patchers/cg.panel.tuning.maxpat`.

## What it will do
- **Render** canons with **N voices**. Each voice has its own **delay**, **interval of
  imitation** (in scale steps or exact cents/ratios), **inversion / retrograde / retrograde
  inversion**, and **augmentation / diminution**, which can be any time-scale ratio, including
  Nancarrow-style irrational tempo canons.
- **Analyze** any canon against a chosen rule profile: Fux's species rules, a spectral
  roughness model computed from the timbre you are actually hearing, or your own tables.
- **Generate** canons by searching for a leader that forms good counterpoint with its own
  transformed copies.
- **Start from your own melody:** bring a `.mid` file (later, a Live clip) and get a ranked
  set of canons on it, for 2 or more voices. Your melody stays as written unless you switch
  on edits, which suggest the fewest note changes that make a near-miss work.
- **Sound** them as exact frequencies through an MSP voice bank, or as MPE MIDI (pitch bend
  ±48, which Live 12's tuning system expects).

## Documents
- [`PLAN.md`](PLAN.md): decisions, architecture, data model, engine, Max layer, and
  **milestones M0–M11** with exit criteria.
- [`docs/RESEARCH.md`](docs/RESEARCH.md): annotated research on canons, algorithmic
  counterpoint, tuning and spectral music, each entry mapped to a milestone.
- [`docs/M0-checklist.md`](docs/M0-checklist.md): the scaffold and platform spikes (done).
- [`docs/M1-checklist.md`](docs/M1-checklist.md): scale systems (done).
- [`docs/M2-checklist.md`](docs/M2-checklist.md): the canon renderer (in progress).

## Development
```sh
npm test              # engine, bundles in a simulated [v8], and a lint of every patch
npm run build         # code/ -> patchers/*.bundle.js (or build:watch while working)
npm run patches       # rewrite the generated patches from tools/patchgen.py
npm run patches:init  # create missing hand-built patches (never overwrites)
npm run hooks         # pre-commit: personal paths, stale bundles, stale generated patches
```
- **Engine:** `code/lib/cg-*.js`, plain JavaScript with no Max APIs, tested in Node.
- **`[v8]` wrappers:** `code/*.v8.js`, glue only. Never hand-edit the bundles.
- **Patches:** generated ones say so in their first comment. Hand-built ones (`canon.maxpat`,
  the panels) are yours to edit in Max (PLAN.md 4.4).

## License
MIT. See [`LICENSE`](LICENSE).

## Lineage
The architecture follows [`nnokes/cento`](https://github.com/nnokes/cento): a pure-JavaScript
engine tested in Node, thin `[v8]` wrappers, and single-file script bundles. Everything Max
loads sits directly in `patchers/`, next to the main patch, so it opens on any clone with no
Max setup.

## Requirements (planned)
- Max 9 (for `[v8]`)
- Ableton Live 12 with Max for Live (from M9)
- Node 20+ for development and tests
