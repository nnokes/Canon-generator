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

**Status:** started 2026-10-19. Parts A, B, C and G (for two voices) are built: 185
tests. Next: Max session 1 (below), then parts D, E and F.

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

## Part C. Two-voice strict canons: done
- [x] **First species:** `strict(settings)` turns musical settings into a search: one
  note per bar, in a mode; the final, the dux's length and range; each follower's
  interval (scale steps) and delay (bars); rule profile `fux-strict`. Defaults: C
  major, final C, 12 notes, a range from a sixth below the final to a tenth above, the
  octave a bar later.
- [x] **The ending:** the follower is cut where the dux ends, and a cadence follows
  (`free-cadence`). M2's formulas (7-6 | 8, 2-3 | 1) open on a suspension, a dissonance
  first species forbids, so every first-species canon failed at its close. Two
  first-species closes are added (Fux pp. 28-29): **6 | 8** (re under ti, opening to the
  octave) and **3 | 1** (ti under re, closing to the unison). A formula now has any
  number of chords. The whole-canon analysis judges the join into the cadence.
- [x] **Musica ficta in the close:** where the mode's penultimate isn't a major sixth (or
  minor third), the voice that leads to the final is raised a semitone: C sharp in D
  dorian, F sharp in G mixolydian, G sharp in A aeolian. Phrygian already has its major
  sixth (F under D). 12-tone tunings only; other tunings keep the mode's own step.
- [x] **Taste (ours, after Schottstaedt's penalties):** a soft cost that orders the
  search away from a dux rocking between two notes, toward steps, with few repeats. It
  only orders candidates; it isn't one of the rules and isn't in the analysis. `taste:
  false` turns it off.
- [x] **Exit test:** canons at the octave, fifth and fourth, above and below, each with
  delays of 1, 2, 3 and 4 bars (24 settings), all pass the full analysis with no hard
  faults, and the follower is the dux transposed and delayed. About 5 s in Node, most of
  it the 4-bar delays (the notes before the follower enters are barely constrained).
- [x] **A 32-note canon:** 31 ms and under 1,000 candidates at the fifth, 2 bars apart; the
  slowest setting tried (4 bars apart) about 0.9 s.
- [x] **Tests** (`tests/generate.test.js`, `tests/canon.test.js`): the 24 settings; the
  32-note canon; taste; strict's defaults and a canon in D dorian; the closes and their
  ficta in dorian, phrygian and ionian.

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

## Part G. Max: Generate in the finder panel (built first, at your request, for two voices)
- [x] **`code/cg.generate.v8.js`** (bundled to `patchers/cg.generate.bundle.js`):
  - glue around `cg-generate.strict()`, modelled on the finder's wrapper: each box sends
    its own message, every setting echoes back (`show <name> <value>`), and a refused
    value snaps back
  - **mode:** Fux's six modes in 12-EDO, each on its final (ionian C4, dorian D4, phrygian
    E4, lydian F4, mixolydian G3, aeolian A3), or `panel`: the canon panel's own tuning
    (from `cg.spec`), degree 0 the final
  - the dux's length (`notes`) and range (`below` / `above` the final, in steps); the
    follower's `interval` (steps) and `delay` (bars); `profile`; the close (`cadence`
    6|8 or 3|1); `seed` and `count` (one canon per seed); `taste`; `slicems`; `budget`
    (20,000 candidate notes per canon: a canon that exists is found in far fewer)
  - **run:** one search per seed, in time slices from a `Task`, as the finder runs; the
    search now yields after every note it tries (about a millisecond), so a slice of a
    few ms is honoured. Repeats are dropped. Menu items read `2. seed 3: C5 B4 D5 C5 ...
    / cost 1.5` (note names in 12-EDO, degrees elsewhere; no commas). A seed that found
    nothing gets a status line: the blocking rule, or the budget.
  - **pick:** the canon's spec to the dict `cg.generated`, then `audition cg.generated`
- [x] **`cg.generate.maxpat`** (generated): the twin of `cg.finder`: settings at load,
  `[deferlow]`, and a pick that plays at once (stop, `usespec cg.generated`, play, to
  `[s cg.canon.in]`).
- [x] **A GENERATE column** in `cg.panel.finder` (presentation mode, on the finder's rows):
  mode, notes, range, follower, rules and close, seed, canons and taste, run and stop,
  the canons menu (click to hear), a status line, and how to read it. The finder's time
  slice box drives both.
- [x] **Click a canon** and it plays through the canon panel and shows in its piano roll.
- [x] **Found while building it:**
  - **taste, stronger:** leaps cost by their size, a return to a note just left costs,
    and rocking between two notes costs most. The lines are now mostly steps (at the
    fifth a bar later: F4 C5 B4 D5 C5 B4 A4 G4 F4 E4 D4 C4). The octave a bar later can
    only move by leaps: a step makes a 7th or 9th against the follower. So the default
    follower is the fifth, a bar later.
  - **ficta in any octave tuning:** a close in 31-EDO D dorian never passed (its sixth
    was minor, and a 12-tone semitone isn't a 31-EDO pitch). The leading note is now
    raised by the tuning's own semitone (116 cents in 31-EDO).
- [x] **Tests:** the wrapper's messages, echoes and refusals; a run in 1 ms slices whose
  canons pass `fux-strict` and play through `usespec`; no canon names `repeat`; `mode
  panel` in 31-EDO D dorian; the patch's pick order; the column's wiring both ways and
  the shared time slice. Tests: 185.
- [ ] **The edits toggle** (Part F): allow edits, max edits, and a repair of the picked
  result.
- [ ] **More voices and rounds** (Parts D, E): their controls.
- [ ] **Recheck the time-slice budget** with a 32-note canon (session 1, below).

## Max session 1: hear the generated canons
**First round (2026-11-01):**
- **Dorian closes skipped into the C sharp.** Of eight D-dorian canons, one reached the
  raised leading note by step: the others came by a skip (E to C sharp, A to C sharp), an
  augmented-fifth outline (F A C sharp), a tritone outline (G B C sharp), or with the C
  natural just before (C B C sharp).
  - **Why:** the close is a formula after the dux, judged by the general rules only, and
    the augmented-interval rule counted steps from the nearest degree: C sharp sits between
    C and D, so F to C sharp read as a sixth.
  - **Fixed:** the close's notes carry their written degree, so F to C sharp is an
    augmented fifth; and a new hard rule in `fux-strict`, `cadence-approach`: the note
    leading to the final by a semitone is reached by step, without its natural form just
    before in that voice or (a false relation) in another. Now every dorian, mixolydian and
    aeolian close comes by step (B or D to C sharp; E or G to F sharp; A to G sharp), and
    phrygian's F falls to E by step; about 1,000 candidates for four canons.
- **Answer finder vs Generate wasn't clear.** They're two tools in one window: the titles
  now say what each works on ("canons hidden in the canon panel's melody"; "new melodies,
  written as canons"), with a line between them, and Generate's notes say it doesn't read
  your melody, and that a click replaces what the canon panel plays (your .mid stays
  loaded).

**Second round:** discard the finder panel again (`git checkout --
patchers/cg.panel.finder.maxpat`), then `git pull`.

**Second round results (2026-11-05):**
- **The voice leading passes:** the leading note now comes by step.
- **A text collision in the finder panel:** the "How to read it" text on the finder's side
  ran into the right side of the patch.
  - **Why:** every comment was sized at 6.5 px per character, and Max draws wider. The
    long hints were sized to end at x 816, just short of the divider (830) and GENERATE
    (840), and the help paragraphs had 370 px columns counted at 52 characters a line.
  - **Fixed:**
    - comments are now sized at 7.5 px per character, so the overlap lint catches this
    - the finder's hints are shortened
    - each tool's "How to read it" is one column, counted generously (88 characters a
      line at 760 px, 52 at 460 px) with a spare line
    - GENERATE's controls sit 10 px further right of their labels
    - the divider runs the full height, and the window grows to fit (about 1080 high;
      it scrolls on a smaller screen)
    - a browser mock-up at a deliberately wide text width shows no box overflowing
  - **The canon and tuning panels:** their layout code also passes at the new width,
    with small nudges (labels a few px clear of their boxes). Their saved files are
    unchanged, so your canon panel keeps its MIDI-out port; they change only when next
    rebuilt.

**Third round:** discard the finder panel again, pull, and reopen it. If anything still
overlaps, a screenshot will pin it.
**First:** the finder panel was remade (it's wider now, with GENERATE on the right), so
discard your copy: in the repo folder run `git checkout -- patchers/cg.panel.finder.maxpat`,
then `git pull`.
1. Open `patchers/cg.panel.canon.maxpat` and `patchers/cg.panel.finder.maxpat`.
2. In GENERATE, keep the defaults (ionian, 12 notes, the fifth a bar later, 4 canons) and
   click **run**. The canons menu fills; the status line says how many. Click each: it
   plays in the canon panel, and the roll shows no red markers (amber ones are soft).
3. Try other settings, a click on **run** after each:
   - the octave (interval 7) a bar later: leaps only (see How to read it)
   - the fourth below (interval −3), and the fifth (4) two bars later
   - modes: dorian (listen for the C sharp at the close), phrygian
   - a seed that finds none: the status line names the rule
4. **The time-slice budget:** set notes to 32 and canons to 8, then run at time slices
   of 20 and 400, dragging a box while it runs. Note whether it stays smooth, and the
   `done` lines.
5. **How do they sound?** That decides the taste cost and the next part.

## Results

| Check | Result | Decision |
|---|---|---|
| incremental checks = full analysis (Part A) | **PASS** (Node, `tests/constraints.test.js`): every check equals the whole canon's analysis at its slice, for random duxes, first species and florid | The analyzer takes the canon's edges; end rules judged on the whole canon |
| same seed, same canon (Part B) | **PASS** (Node, `tests/generate.test.js`) | The seed orders equal-cost candidates |
| 2-voice canons at the 8ve, 5th, 4th; delays 1–4 bars (Part C) | **PASS** (Node, `tests/generate.test.js`): all 24 settings, above and below, no hard faults | First-species closes 6 \| 8 and 3 \| 1, with ficta; taste orders the search |
| `fux-relaxed` (Part D) | | |
| rounds by the block method (Part E) | | |
| edits toggle golden test (Part F) | | |
| generated canons in Max (Part G) | First round: dorian closes skipped into the C sharp. Second round: **voice leading PASS**; a text collision in the finder panel | `cadence-approach` (hard), written degrees in the close; comments sized at 7.5 px a character, one help column per tool |
| 32-note canon in Max within the slice budget (Part G) | | |
