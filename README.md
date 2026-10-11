# Canon Generator

A canon generator for **Max/MSP** (with **Max for Live** later), made for composing classical
electroacoustic music. It ranges from strict Fux-style canons through process canons
(mensuration, tempo, spiral) to Ligeti-style micropolyphony, in any tuning: equal divisions,
just intonation, Scala files, and harmonic and inharmonic spectra.

> **Status:** planning. No code yet. Start with [`PLAN.md`](PLAN.md).

## What it will do
- **Render** canons with **N voices**. Each voice has its own **delay**, **interval of
  imitation** (in scale steps or exact cents/ratios), **inversion / retrograde / retrograde
  inversion**, and **augmentation / diminution**, which can be any time-scale ratio, including
  Nancarrow-style irrational tempo canons.
- **Analyze** any canon against a chosen rule profile: Fux's species rules, a spectral
  roughness model computed from the timbre you are actually hearing, or your own tables.
- **Generate** canons by searching for a leader that forms good counterpoint with its own
  transformed copies.
- **Sound** them as exact frequencies through an MSP voice bank, or as MPE MIDI (pitch bend
  ±48, which Live 12's tuning system expects).

## Documents
- [`PLAN.md`](PLAN.md): decisions, architecture, data model, engine, Max layer, and
  **milestones M0–M11** with exit criteria.
- [`docs/RESEARCH.md`](docs/RESEARCH.md): annotated research on canons, algorithmic
  counterpoint, tuning and spectral music, each entry mapped to a milestone.
- [`docs/M0-checklist.md`](docs/M0-checklist.md): the first concrete steps and platform
  spikes.

## Lineage
The architecture follows [`nnokes/cento`](https://github.com/nnokes/cento): a pure-JavaScript
engine tested in Node, thin `[v8]` wrappers, and single-file script bundles. Everything Max
loads sits below the main patch, so Max never has to look in folders above it.

## Requirements (planned)
- Max 9 (for `[v8]`)
- Ableton Live 12 with Max for Live (from M9)
- Node 20+ for development and tests
