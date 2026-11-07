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

**Status:** started 2026-10-19. Parts A–E and G are built (canons in two to four voices;
rounds by the block method): 206 tests. Next: Max session 3 (rounds, below), then Part F.

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
    last 4 notes (since Part E, each rule's own lookback: see Part E)
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

## Part D. More voices: `fux-relaxed`: done
**What blocked it.** A first try with the two-voice rules relaxed found **no** three-voice
canon in 150 settings. Where the voices enter two bars apart, the search did write clean
counterpoint. Its one fault was always the close (bar 13).
- The renderer's three-voice close held the middle voice on a note of the final chord
  through the next-to-last bar: over the bass's D (in C), a C, E or G is a seventh, ninth
  or fourth.
- Fux's own three-part closes then failed two of our rules:
  - **Fig. 105** puts an augmented fourth between the upper voices (G and C sharp over E).
    Our `dissonance` rule rejected it.
  - **Figs. 101 and 104** let the bass leap from the fifth to the final under the voices
    that close. Our `penultimate` rule wanted the outer voices to close by step.
- [x] **The closes for three and four voices** (`cg-canon`; Fux pp. 76–82, 112–116). Two
  voices close as in two parts, and the others fill the chords:
  - **6 | 8** (Fig. 105; four parts Fig. 165): the bass 2–1 under the top's 7–8; the
    inner voice from the third over the bass to the fifth (D F B to C G C); a fourth voice
    to the final chord's third.
  - **3 | 1** (Fig. 101; four parts Figs. 160, 163, 164): the bass leaps 5–1; the top
    2–1 over the voice below it, 7–1, a third closing to the unison (A C♯ E to D D D);
    a fourth voice holds the fifth.
  - **Phrygian** has no perfect fifth over its fifth degree (B–F, Fux p. 81), so its 3 | 1
    is Fig. 106's: the bass rises D–E under F–E, an inner voice falls A–G♯.
  - **Placement and ficta:** each voice moves to its close by its nearest octave, never
    below the bass. Ficta raises the pair that closes, as in two voices. A third in the
    final chord is made major (Fux pp. 80, 82; Fig. 165's F♯).
- [x] **Rules that change with the number of voices** (every profile; they leave two
  voices alone):
  - **Between upper voices,** consonance is reckoned from the bass: a fourth, and the
    augmented fourth or diminished fifth of a 6/3 chord, are consonant there (Fux p. 112
    and its note, "this already holds in three part writing").
  - **The penultimate:** some two voices close by contrary step into the unison or
    octave; the bass may leap (Figs. 101, 104–106).
  - **The opening** may be the full triad, as Fux's three-part examples open (Figs. 101,
    104, 105).
  - **`cadence-approach`:** only a semitone into the final is a leading note (an inner
    voice falling A to G♯ isn't).
- [x] **The profile, `fux-relaxed`:** `fux-strict`, relaxed only where Fux relaxes it, each
  with its page:
  - **one hidden fifth or octave is a cost** (2), "if there is no other possibility"
    (p. 78), "on account of ... the imitation" (p. 110). **Two in a row stay a fault**
    (p. 79, Fig. 102).
  - **`prefer-imperfect` off:** a triad holds a fifth over the bass (p. 71).
  - **`full-triad`** (new, soft 0.5): a cost for an empty chord, no third or sixth over
    the bass (pp. 71–72).
  - **Parallel fifths and octaves** stay faults between any two voices (p. 112).
  - The first plan's example, "soft weights scaled by the number of voices", has no source
    in Fux, so it's not used.
- [x] **N-voice chains:** followers at their own intervals and delays. `strict()` takes
  any number, and chooses `fux-relaxed` for more than one. Every pair is checked against
  the sounding bass, as before.
- [x] **Found:**
  - **Three voices:** 42 of 60 settings tried, mostly in a few hundred candidates (12
    notes; followers at the fifth, octave, fourth, unison and twelfth, above and below).
  - **Entries a bar apart twice running are impossible:** with the fifth below a bar later
    and the octave below two bars later, every step of the dux is a seventh or ninth
    against one of them. The search proves it (blocked by `dissonance`).
  - **Four voices:** at the fifth above (1 bar), the octave below (4) and the fourth below
    (5), every seed of the first four finds one, about 230 candidates each.
- [x] **Tests:**
  - **Fux's three-part figures as goldens** (transcribed, with his interval figures as a
    check): Figs. 101, 104 and 105 pass `fux-relaxed`; under `fux-strict` only the hidden
    fifths and octaves Fux accepts there fail; Fig. 102 fails where Aloys says, the second
    of two hidden progressions in a row.
  - the upper-voice fourth and tritone; the N-voice penultimate; the profile
  - the closes in ionian, dorian and phrygian, three and four voices
  - six three-voice settings: each found, a strict canon, passing `fux-relaxed` afresh;
    a four-voice canon; dorian with both closes; the impossible setting named
  - **The answer finder** now finds 12 clean four-voice sets on your clip at x2 (10
    before): two sets whose only fault was a tritone between upper voices.

## Part E. Rounds by the block method (Mann pp. 232–237): done
**Albrechtsberger's method.** Write a *k*-part "first draft" for equal voices, then use each
part as one section of the round's tune:
- the upper part first, the part with the bass cadence second
- "the first two or three voices in themselves should form a perfect two- or three-part
  setting" (p. 237)
- in his four-voice example two parts swap places, or the pile-up "would produce the
  effect of the incorrect six-four chord" (pp. 236–237)
- a round may stop at any section end, all voices together

- [x] **The block** (`round(settings)` in `cg-generate`). A round for *k* voices with
  sections of *S* bars:
  - the tune is *k*·*S* whole notes (first species, as all of M4)
  - each voice enters a section after the last, at the unison
  - judged as the finder judges perpetual canons: every voice twice through, cut at the
    leader's end. That's a section end, so the round ends on the block's last chord.
  - the search writes the block **column by column** (order `block`): bar *c* of every
    section together, as *k*-part counterpoint. The cadence's two columns come first,
    then the first column (the join into it), then the rest left to right.
  - **Defaults:** 3 voices, sections of 4 bars, `fux-relaxed` (`fux-strict` for 2).
- [x] **The entries, the joins and the bass cadence** are checked as the block is written.
  - The rendered round holds every group heard while the voices pile up, every join
    between sections, and the wrap-around join (the last section back to the first).
  - The sections are written in their final order, so the order is chosen with the notes.
    A placement that makes a 6/4 is a fourth over the sounding bass, which is a
    dissonance, so the search never keeps one. There's no separate rearranging step.
  - The round closes inside its tune: the end rules judge the block's last two bars. Some
    two voices close by contrary step into the final, and the final is in the bass.
- [x] **Check windows by what each rule reads** (`cg-constraints`).
  - **Why:** every check waited for 4 bars of history. Written column by column, a
    check near a section's start would have waited for the section's end, and with
    sections of 4 bars or less nothing would be checked until the block was written.
  - **Now:** each rule has a lookback (`LOOKBACK`): the chord alone (dissonance, the
    begin and end rules), the motion into it, or a voice's notes further back. Each
    slice has one check per lookback. The search merges those that become ready at the
    same step into one analysis, and runs once the checks that read the same notes the
    same way (a round's block, repeated, with its voices relabelled).
  - Two-voice canons search exactly as before: the same canons, candidates and time.
- [x] **Ficta in the tune** (your choice: rounds in all six modes).
  - At a section's next-to-last note, the degree below the final is the leading note.
    It's raised a semitone where the mode has no semitone next to its final: C♯ in D
    dorian, F♯ in G mixolydian, G♯ in A aeolian. Not ionian or lydian (B–C and E–F
    already are), and not phrygian, whose semitone is F–E and which "does not admit of
    any raising" (Fux p. 81).
  - `cadence-approach` now covers a raised note in the tune: reached by step, no natural
    form just before in that voice or another, and rising to the final.
  - The renderer marks a note written off its degree with that degree, as the close's
    notes are, so the rules count steps from the note as written.
- [x] **Found while building it:**
  - **Cadence first.** Written left to right, the search filled the block and then
    failed at the cadence over and over. With the cadence's columns first, every seed of
    the first four finds a round (3 and 4 voices; sections of 3, 4 and 6 bars) in under
    a second.
  - **The block method is a far smaller search than the chain.** The same rounds written
    left to right, as canons are: none in 20,000 candidates per seed. Column by column:
    about 1,700 each.
  - **The penultimate, tightened.** A dorian round "closed" E–G to F over D: two voices
    closing by contrary step, but onto the third. The N-voice `penultimate` now requires
    the pair to close on the final, as all of Fux's do.
  - **Unisons.** Equal voices share one range, so the first rounds sat on unisons (all
    three on D5 in a bar). A new soft rule in `fux-relaxed`, `unison` (0.5), after Fux
    p. 79: tenor and bass "blend in a unison, which is less harmonious than the octave".
  - **Sections of 2 bars** in 3 voices are proven impossible. Such a block is only the
    cadence (next-to-last chord, then final), and its first two sections can't also open
    on the final as the begin rules require. GENERATE's sections run from 2 bars, and
    its help says 3 or more.
- [x] **Found (12-note tunes, sections of 4 bars, the first four seeds):**
  - **3 voices:** every seed in every mode, in 5,000–11,000 candidates for the four.
  - **4 voices:** every seed in ionian, dorian, phrygian and lydian. Aeolian 3 of 4,
    mixolydian 1 of 4 within 20,000 candidates per seed: more seeds, or a larger budget.
- [x] **Mann goldens:** Ex. 218 (four voices) and Ex. 219 (five), "Turnus descendet ad
  inferos", transcribed from the scan.
  - **The reading:** where a half note's head was ambiguous, the harmony decided it.
    Every section sounds at once, so the only consonant reading is C major alternating
    with G major (C5 D5 D5 | E5 B4 B4 | C5 G4. G4 | E4).
  - **The analysis:** both pass Albrechtsberger's `canon` rules as perpetual rounds,
    with no 6/4. Ex. 218 has no cost at all; Ex. 219 has only soft hidden fifths.
  - **The finder:** given only the tune, the four-voice search finds Ex. 218's round
    (the unison, a bar apart), clean.
  - **Not `fux-relaxed`:** they're florid, so the first-species rules don't apply (their
    opening third and their close fail them). This is recorded, not tuned away.
- [x] **Tests:**
  - **The exit test:** rounds in 3 and 4 voices, in ionian, dorian, aeolian and
    phrygian, each:
    - found, and analyzed afresh as rendered, with no hard fault
    - no fourth over the sounding bass anywhere (no 6/4)
    - each group of sections alone, as a 2- or 3-part block, with no fault
    - the wrap-around join in the analysis
    - every voice the same tune, a section apart
  - **Other tests:**
    - ficta in dorian (and none in ionian or phrygian)
    - block vs chain; the same seed gives the same round; the block order
    - the Mann goldens
    - the windows still agree with the whole analysis, rounds with ficta included, and a
      column is checked once it's written
    - the raised note's approach, false relation and rise
    - the renderer's written degree
    - GENERATE's round controls, and a dorian round that plays through the canon panel

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
- [x] **More voices** (Part D): **voices** (2–4), and **follower 2** and **follower 3**
  (interval and delay; defaults the octave below 4 bars later and the fourth below 5 bars
  later). With more than two voices the rules switch to `fux-relaxed`, and back to
  `fux-strict` for two, unless you chose another profile. `fux-relaxed` is in the finder's
  rules menu too. The canon panel's rules menu gets it when that panel is next rebuilt
  (your saved copy keeps its MIDI-out port).
- [x] **Rounds** (Part E): on the Voices row, a **round** toggle and **section** (bars).
  With round on, the tune is voices × section bars, and notes, the followers and the close
  aren't used. Menu items read `generated: seed 1 / round for 3 voices / sections of 4
  bars`, and a raised note shows by its name (C#5). The help says what a round is here.
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

## Max session 2: three and four voices (Part D)
**First:** the finder panel was remade again (GENERATE has three new rows), so discard
your copy: `git checkout -- patchers/cg.panel.finder.maxpat`, then `git pull`.
1. Open the canon panel and the finder panel. In GENERATE, set **voices** to 3. The rules
   menu turns to `fux-relaxed`. Click **run**: four canons, each three voices (the melody,
   the fifth above a bar later, the octave below four bars later). Click each and listen,
   especially to the close: next-to-last chord D F B, then C G C (Fux's Fig. 105).
2. Try the close **3|1**: G B D to C C C, the bass leaping up a fourth or down a fifth
   (Fig. 101).
3. **Dorian:** listen for the C sharp in the close, and with 4 voices the F sharp in the
   final chord (Fig. 165).
4. **Voices 4:** the fourth below five bars later joins.
5. **Something that can't work:** follower 2 at 7 (the octave above), 2 bars. The status
   line says "blocked by dissonance": two entries a bar apart each, so a step in the melody
   makes a 7th or 9th against one of them.
6. **How do they sound?** Especially the inner voices and the closes. That decides whether
   the hidden-fifth cost (2) and the empty-chord cost (0.5) need changing.
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

## Max session 3: rounds (Part E)
**First:** the finder panel was remade again (a round toggle and section on the Voices row),
so discard your copy (`git checkout -- patchers/cg.panel.finder.maxpat`), then `git pull`.
1. Open the canon panel and the finder panel. In GENERATE, set **voices** to 3 and tick
   **round** (section 4). Click **run**. Each canon is a 12-note tune sung by three
   voices, each 4 bars after the last, at the unison.
2. **Listen to:**
   - the voices piling up: one, then two, then three
   - the cadence at every section end (the round can stop at any of them)
   - the join from the last section back to the first
3. **Dorian:** the leading note C♯ is in the tune. Mixolydian (F♯) and aeolian (G♯) have
   theirs too. Phrygian closes on its own F–E.
4. **Voices 4.** Mixolydian with 4 voices is the hardest: if a seed finds none, try more
   seeds.
5. **How do they sound?** Whole notes make chorale-like rounds; rhythm comes in M5. Are
   the tunes singable, and is the unison cost (0.5) about right?

## Results

| Check | Result | Decision |
|---|---|---|
| incremental checks = full analysis (Part A) | **PASS** (Node, `tests/constraints.test.js`): every check equals the whole canon's analysis at its slice, for random duxes, first species and florid | The analyzer takes the canon's edges; end rules judged on the whole canon |
| same seed, same canon (Part B) | **PASS** (Node, `tests/generate.test.js`) | The seed orders equal-cost candidates |
| 2-voice canons at the 8ve, 5th, 4th; delays 1–4 bars (Part C) | **PASS** (Node, `tests/generate.test.js`): all 24 settings, above and below, no hard faults | First-species closes 6 \| 8 and 3 \| 1, with ficta; taste orders the search |
| `fux-relaxed` (Part D) | **PASS** (Node, `tests/analyze.test.js`, `tests/generate.test.js`): Fux's Figs. 101, 104, 105 pass and Fig. 102 fails where he says; 3-voice canons in six settings, a 4-voice canon and dorian pass afresh | Fux's three- and four-part closes in the renderer; consonance between upper voices reckoned from the bass; the penultimate made by any two voices |
| rounds by the block method (Part E) | **PASS** (Node, `tests/generate.test.js`): 3- and 4-voice rounds in four modes, no hard fault, no 6/4, each group alone clean, the wrap-around join judged; Mann Ex. 218–219 pass the `canon` rules | Column by column, cadence first; check windows by rule; ficta in the tune; the penultimate closes on the final; `unison` (soft) in `fux-relaxed` |
| edits toggle golden test (Part F) | | |
| generated canons in Max (Part G) | First round: dorian closes skipped into the C sharp. Second round: **voice leading PASS**; a text collision in the finder panel | `cadence-approach` (hard), written degrees in the close; comments sized at 7.5 px a character, one help column per tool |
| 32-note canon in Max within the slice budget (Part G) | | |
