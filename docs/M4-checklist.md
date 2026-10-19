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

## Part A. The constraint model (engine)
The search needs to check a rule the moment it can be checked, not after the whole canon
exists.
- [ ] **Rhythm fixed, pitches variable.** The canon's rhythm doesn't depend on the dux's
  pitches, so the skeleton is rendered once: for every slice, which dux note each voice
  plays (the rendered events already carry their dux index). First species is the simple
  case: one note per bar.
- [ ] **Constraints with index sets:**
  - each slice: the dux notes sounding in it, plus their neighbours where a rule needs
    them (a passing note needs the notes either side)
  - each pair of consecutive slices: the motion rules
  - each pair and triple of consecutive dux notes: the melodic rules
  - the opening and the close: the begin, end, mode-final and penultimate rules
- [ ] **A constraint is checked as soon as all its indices are assigned** (§3.5). This
  covers followers that lag (the ordinary case), followers that overtake the leader, and
  retrograde voices, which pair early and late notes.
- [ ] **One set of rules.** A check runs `cg-rules` on a small window built with
  `cg-analyze`'s own slice and motion functions, so generating and analyzing can't
  disagree (Anton's idea: one rule set to compose and to diagnose). Every finished canon
  then gets the full analysis.
- [ ] **Tests:**
  - for random duxes, the incremental verdict equals the full analysis's, rule by rule
  - the Fux and Mann goldens give the same faults as in M3

## Part B. The search (engine: `code/lib/cg-generate.js`)
- [ ] **Depth-first, with backtracking.**
  - each note's candidates: the scale degrees in the dux's range, ordered by soft cost
    plus a seeded jitter (`cg-rng`), so the same seed gives the same canon
  - **variable order:** left to right (the treatise chain); outside-in (first, last,
    second, second-to-last, ...) when any voice is R or RI, so crab and table canons are
    checked early
- [ ] **A node budget**, with the best canon so far as the fallback.
- [ ] **Beam mode:** keep the best *B* partial duxes.
- [ ] **Fixed notes:** a given cantus firmus, or the notes you lock.
- [ ] **Diagnostics:** count which rules forced each backtrack. When no canon exists for
  the settings, the report names the rule that blocks it (a light version of FuxCP's
  minimal unsatisfiable subsets).
- [ ] **A generator function**, like the finder's: it yields progress, so the `[v8]`
  wrapper runs it in time slices.
- [ ] **Tests:** the same seed gives the same canon; another seed, another canon; the
  budget stops the search and returns the best so far; an impossible setting names its
  blocking rule.

## Part C. Two-voice strict canons
- [ ] **First species:** one note per bar, in a mode. Settings: the final, the range, and
  the dux's length. Rule profile `fux-strict`.
- [ ] **The ending:** the follower is cut where the dux ends, and a cadence follows (the
  M2 `free-cadence`, 7-6 | 8 or 2-3 | 1). The search checks the join into the cadence
  with the close.
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
| incremental checks = full analysis (Part A) | | |
| same seed, same canon (Part B) | | |
| 2-voice canons at the 8ve, 5th, 4th; delays 1–4 bars (Part C) | | |
| `fux-relaxed` (Part D) | | |
| rounds by the block method (Part E) | | |
| edits toggle golden test (Part F) | | |
| 32-note canon in Max within the slice budget (Part G) | | |
