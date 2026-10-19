# M4: Generator: strict first-species canons

**Goal:** write new canons from the rules, instead of only finding the canons hidden in a
melody. `cg-generate` searches for a dux that makes the whole canon pass, as the treatises
describe writing one (PLAN.md §3.5): write a segment of the dux, copy it into the
follower, write the next segment against that copy, and so on, backtracking when a rule
breaks. The same search repairs your melody: the answer finder's **edits toggle** changes
as few notes as it can so that a canon works (§3.6).

**Exit criteria (from PLAN.md §5):**
- **Two voices:** valid canons at the octave, fifth and fourth, with delays of 1–4 bars.
- **Rounds:** 3–4-voice rounds built by the block method, with no 6/4 on strong beats
  and smooth perpetual joins.
- **Reproducible:** the same seed gives the same canon.
- **Responsive:** a 32-note canon finishes without hanging Max, each slice of the search
  within the time-slice budget recorded in M3 (400 ms, provisional; the default slice
  is 20 ms).
- **Edits toggle golden test:** take a clean canon from the M3 goldens (Mann Ex. 201, or
  a Fux figure) and change one note so it breaks. The repair finds a one-note fix that
  passes, and names the rule the change broke. With the toggle off, the melody is never
  changed.

"Valid" means the finished canon passes the M3 analyzer (`cg-analyze`) under its rule
profile with no hard faults: the generator and the analyzer judge with the same rules.

**Status:** started 2026-10-19.

---

## 0. Carried in from M3
- **Recheck the time-slice budget** with the generator's longer searches (Part G), and on
  a slower machine if you have one.
- **The edits toggle** (Part F): the answer to your clip at x1, where no three followers
  fit each other.
- **Schottstaedt's penalty table** (STAN-M-19, `docs/RESEARCH.md` §2) was to be read
  before M4, but the CCRMA site doesn't resolve from this environment. The rule weights
  stay those of `docs/controls.md` (from Fux and Albrechtsberger). If you have the PDF,
  upload it and I'll compare.
- **Sources:**
  - Fux, *The Study of Counterpoint*: first species (pp. 27–33, the M3 fixtures) and
    the three- and four-part chapters, for `fux-relaxed` (each rule will cite its page)
  - Mann, *The Study of Fugue*: Albrechtsberger's first draft of a round, the block
    method (pp. 232–237)

## Your choices
- **Where the generator lives in Max:** inside the **finder panel**, as a Generate
  section, so finding and generating share one window. Results play through the canon
  panel and show in its piano roll, as the finder's do.

## Part A. The constraint model (engine: `code/lib/cg-constraints.js`): done
The search needs to check a rule the moment it can be checked, not after the whole canon
exists.
- [x] **Rhythm fixed, pitches variable.** The canon's rhythm doesn't depend on the dux's
  pitches, so the skeleton is rendered once: every event, the dux note it plays and its
  time. Each event's pitch, for each degree its note could take, comes from a table
  rendered once per candidate degree (and per first note, when a voice inverts around
  it). If a canon's rhythm ever changed with its pitches, the model says so instead of
  guessing.
- [x] **Checks, one or two per slice** before the ending:
  - **now:** the slice, the motion into it, the melodic rules on the notes that start
    there, and the begin rules, on a window of the 4 slices before it and each voice's
    last 4 notes
  - **next:** the rules that read the following note (a dissonance's resolution,
    `dissonance-treatment`): the same window plus the next slice
  - each counts only what the analyzer reports **at that slice**, so every violation of
    the whole canon is counted once
- [x] **A check is ready as soon as every dux note in its window has a pitch** (§3.5).
  In first species with the follower a bar behind, the check at bar *k* + 1 needs the
  dux only up to note *k*.
- [x] **One set of rules.** A check runs `cg-rules` through `cg-analyze` on its window,
  told the whole canon's edges (`options.edges`: its first and last slices with two
  voices), so the begin rules and the 6/4's "first or last bar" judge the canon, not
  the window. Without edges the analyzer behaves exactly as in M3.
- [x] **Judged on the whole canon only:** the rules about the end (`end-perfect`,
  `penultimate`, `mode-final`) and the ending's slices (the cadence is built on the
  last notes): `full(dux)` analyzes the finished canon.
- [x] **Tests** (`tests/constraints.test.js`):
  - for random duxes, every check reports exactly what the whole canon's analysis
    reports at its slice, rule by rule: first species at the fifth, octave and lower
    fourth (240 violations over 8 rules compared), and Ex. 201's florid rhythm under
    the canon rules (dissonances caught by the next checks)
  - the real Ex. 201 passes every check at each of Albrechtsberger's answers
  - an inverting follower's pitches follow the first note
  - a check takes about 0.1 ms

## Part B. The search (engine: `code/lib/cg-generate.js`): done
- [x] **Depth-first, with backtracking.**
  - each note's candidates: the degrees in the dux's range. A candidate that breaks a
    hard rule in the checks it completes is left out; the rest are tried in order of
    the soft cost they add, plus a seeded jitter (`cg-rng`), so the same seed gives the
    same canon
  - **variable order:** left to right (the treatise chain); outside-in (first, last,
    second, second-to-last, ...) when any voice is R or RI, so crab and table canons are
    checked early
  - each finished dux: the whole canon analyzed (`full`), for the ending and anything
    a window can't see
- [x] **A node budget** (candidate notes tried; default 100,000), with the best complete
  canon so far (fewest hard faults, then cost) as the fallback.
- [x] **Beam mode:** keep the best *B* partial duxes, a note further each round.
- [x] **Fixed notes:** `fixed: { index: degree }`, for a cantus firmus or the notes you
  lock.
- [x] **Diagnostics:** how often each rule rejected a candidate, and the rule that
  stopped the deepest note reached, named when no canon is found.
- [x] **A generator function**, like the finder's: it yields progress (`nodes`, `depth`)
  every 64 steps, so the `[v8]` wrapper can run it in time slices.
- [x] **Tests** (`tests/generate.test.js`):
  - a canon at the fifth is found, and passes `fux-strict` analyzed afresh
  - the same seed gives the same canon, and other seeds give others
  - fixed notes keep their degree
  - the budget stops the search and says so
  - no canon: the blocking rule is named. With one degree only, `repeat`; started
    on G with the follower a fifth up, `mode-final` (it would enter on D over a bass
    that must be the final)
  - beam mode finds a canon; the generator yields progress; the variable orders

## Part C. Two-voice strict canons
- [ ] **First species:** one note per bar, in a mode. Settings: the final, the range, and
  the dux's length. Rule profile `fux-strict`.
- [x] **The ending:** the follower is cut where the dux ends, and a cadence follows
  (`free-cadence`). M2's formulas (7-6 | 8, 2-3 | 1) open on a suspension, a dissonance
  first species forbids, so every first-species canon failed at its close. Two
  first-species closes are added (Fux pp. 28-29): **6 | 8** (re under ti, opening to the
  octave) and **3 | 1** (ti under re, closing to the unison), and a formula now has any
  number of chords. The whole-canon analysis judges the join into the cadence.
- [ ] **Exit test:** canons at the octave, fifth and fourth, each with delays of 1, 2, 3
  and 4 bars, all pass the full analysis with no hard faults.
- [ ] **A 32-note canon:** time and node count in Node, for Part G.

## Part D. More voices: `fux-relaxed`
- [ ] **The profile:** `fux-strict`, relaxed as Fux relaxes it for three and four
  parts ("the rules are to be less rigorously observed", p. 139). Each relaxation cites
  its page. For example: hidden fifths and octaves only between the outer voices; a
  third allowed in the final chord; soft weights scaled by the number of voices.
- [ ] **N-voice chains:** followers at their own intervals and delays, every pair checked
  against the sounding bass, as the analyzer does.
- [ ] **Tests:** 3-voice canons pass `fux-relaxed`; the profile's table in
  `docs/controls.md`.

## Part E. Rounds by the block method (Mann pp. 232–237)
- [ ] **The block:** a round's *k* sections all sound at once once every voice is in, so
  the round is one *k*-part block. Solve it as *k*-part counterpoint.
- [ ] **The entries:** check the smaller groups heard while the voices pile up ("the
  first two or three voices form a perfect setting").
- [ ] **The joins** between sections, and the wrap-around join for perpetual rounds.
- [ ] **The bass cadence** placed where it can't make a 6/4.
- [ ] **Exit test:** 3- and 4-voice rounds pass, with no 6/4 on a strong beat and clean
  perpetual joins (judged with `perpetual`, as the finder judges round canons).

## Part F. The edits toggle (`allowEdits`) in the finder
- [ ] **Off (the default):** your melody is never changed; the finder ranks and reports,
  as now.
- [ ] **On:** for a chosen result (or the top *K*), find the version of your melody with
  the fewest changes that makes it pass:
  - the search from Part B, with the original pitch tried first and a soft cost for each
    note changed and how far it moves (in scale steps)
  - the rhythm kept as it is; locked notes never changed; an optional `maxEdits`
- [ ] **The result:** the edited melody, each changed note, and the rule its change fixed
  (from the diagnostics).
- [ ] **Golden test:** Mann Ex. 201 with one note changed so a canon breaks: the repair
  finds a one-note fix that passes and names the broken rule. With the toggle off, the
  melody comes back unchanged.

## Part G. Max: Generate in the finder panel
- [ ] **A Generate section** in `cg.panel.finder`:
  - the dux: final, length and range
  - the followers: voices, interval and delay (or "round" for the block method)
  - rules, seed, budget, and the time slice it shares with the finder
  - Generate and Stop, a results list, and a status line
- [ ] **Click a result** and it plays through the canon panel and shows in its piano
  roll (`usespec`, as finder results do).
- [ ] **The edits toggle:** allow edits, max edits, and a repair of the picked result;
  the status line lists the changed notes and the rules they fixed.
- [ ] **Tests:** the wrapper's messages and time slicing in the `[v8]` simulation; the
  panel's wiring.
- [ ] **Recheck the time-slice budget** with a 32-note canon.

## Max session 1 (after parts C–G)
To be written when the parts are built: generate canons at the octave, fifth and fourth,
a round, a 32-note canon at several slice sizes, and a repair of your clip.

## Results

| Check | Result | Decision |
|---|---|---|
| incremental checks = full analysis (Part A) | **PASS** (Node, `tests/constraints.test.js`): every check equals the whole canon's analysis at its slice, for random duxes, first species and florid | The analyzer takes the canon's edges; end rules judged on the whole canon |
| same seed, same canon (Part B) | **PASS** (Node, `tests/generate.test.js`) | The seed orders equal-cost candidates |
| 2-voice canons at the 8ve, 5th, 4th; delays 1–4 bars (Part C) | | |
| `fux-relaxed` (Part D) | | |
| rounds by the block method (Part E) | | |
| edits toggle golden test (Part F) | | |
| 32-note canon in Max within the slice budget (Part G) | | |
