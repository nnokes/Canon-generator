# Controls: rule profiles and the rules in them

Every rule the analyzer can apply (`code/lib/cg-rules.js`), what it checks, and where it
comes from (PLAN.md §3.3).

**Hard and soft:**
- A **hard** rule's violations are faults. M4's generator prunes on them, and the answer
  finder ranks on them first.
- A **soft** rule adds its weight to a cost for each violation.

**Your own profile** looks like this:
```
{ base: "fux-strict",
  rules: { "hidden-perfect": { hard: false, weight: 2 }, repeat: false },
  only: [...] }
```
- `base` names the profile to start from.
- `rules` changes a rule's hard/soft setting or weight, or removes it with `false`.
- `only` keeps just the rules you list.

**Counting:**
- Melodic rules count **scale steps of the active scale**; consonance counts **cents**. That
  is how Fux's melodic rules carry over to any tuning (PLAN §3.6).
- "Perfect", "imperfect" and "dissonant" come from the consonance model
  (`cg-consonance`; see the models below).

**Page numbers:**
- Fux: *The Study of Counterpoint* (trans. Mann, 1965).
- Albrechtsberger: in Mann, *The Study of Fugue* (1958).

## Profiles

| Profile | For | Rules |
|---|---|---|
| `free` | anything; reports only | none |
| `fux-strict` | first species, note against note (Fux pp. 27–33) | hard: dissonance, parallel-perfect, hidden-perfect, begin-perfect, end-perfect, mode-final, penultimate, repeat, melodic-augmented, melodic-leap, cadence-approach. Soft: prefer-imperfect (0.5), parallel-imperfect-run (1, max 3), leap-compensation (0.5) |
| `fux-relaxed` | first species in three and four parts (Fux pp. 71–116): the generator's default for more than one follower | `fux-strict`, as Fux relaxes it for more parts ("as the number of voices increases, the rules are to be less rigorously observed", p. 139): hidden-perfect hard only for two in a row, one alone costs 2 (pp. 77–79, 110); no prefer-imperfect (a triad holds a fifth, p. 71); soft full-triad (0.5, pp. 71–72). Parallel fifths and octaves stay hard between any two voices (p. 112) |
| `florid` | florid canons as Albrechtsberger writes them | hard: dissonance-treatment, parallel-perfect. Soft: hidden-perfect (1), melodic-augmented (1), melodic-leap (0.5), repeat (0.25) |
| `canon` | the answer finder's default | `florid`, plus soft entry-rest (0.5) and phrase-seventh (1) |
| `spectral` | spectral and inharmonic work | soft: parallel-perfect (2), hidden-perfect (0.5), roughness-ceiling (1) |

**Why the `florid` profile exists, and why it's built now:**
- Fux's other species (M5) are what judge florid music.
- But the M3 answer finder has to judge Albrechtsberger's canons, which use passing notes
  and suspensions. So `florid` brings their dissonance treatment forward.
- Its melodic rules are soft. A follower inherits the dux's melody, and a composer fixes a
  scale-step answer with an accidental, as Albrechtsberger does with the E♮ in Ex. 210.

## Rules

| Rule | Checks | Source |
|---|---|---|
| `dissonance` | Every slice is consonant. A **fourth over the sounding bass** is a dissonance. Between upper voices, consonance is reckoned from the bass: a fourth, and the augmented fourth or diminished fifth of a 6/3 chord (G and C sharp over E), are consonant there (octave tunings: a tritone is within 45 cents of 600). A second between upper voices stays a dissonance. | Fux pp. 20–21, 27; p. 112 and its note ("this already holds in three part writing"); Fig. 105 |
| `dissonance-treatment` | A dissonance must be one of two things: **(1)** a passing or neighbour note, stepping in and out, not on a strong beat; or **(2)** a suspension, held from a consonance and resolving down by step. A fourth over the bass with 3+ voices is reported as `six-four`. | ours, after Fux's 2nd–4th species (pp. 41–64) and Albrechtsberger's canons |
| `six-four` | A 6/4 against the actual sounding bass, "bad particularly in the first or in the last measure or on any strong beat". Reported by `dissonance-treatment`: hard there, soft (its weight) on a weak beat inside the piece. | Mann pp. 228, 236–237 |
| `parallel-perfect` | Parallel (or similar, by octave displacement) motion between two perfect consonances of the same class: consecutive fifths, octaves, unisons. | Fux p. 22 |
| `hidden-perfect` | Similar motion into a perfect consonance from a different interval. It's forbidden because filling in the leap (diminution) would reveal consecutive fifths or octaves (Figs. 7–8). With `single: "soft"` (`fux-relaxed`), one on its own costs its weight, and only a second straight after another is a fault. | Fux pp. 22, 32–33; for more parts pp. 77–79 (Figs. 100–102), 110 |
| `begin-perfect` | The first slice with two or more voices has only perfect consonances over the bass. With three or more voices sounding, a third is allowed: the full triad. | Fux p. 28; pp. 71, 78 and Figs. 101, 104, 105 (each opens with a third over the final) |
| `end-perfect` | So does the last. With three or more voices, a third is allowed. | Fux pp. 28, 112; p. 82 (leaving the third out of a three-part close "holds true only in cases in which it is possible") |
| `mode-final` | The lowest voice sounds the mode's final in the first and last slices. The final is `final`, or else voice 0's last note. | Fux p. 31 |
| `penultimate` | The next-to-last slice is an imperfect consonance, and the outer voices close by contrary step. In 12-EDO it must be a major sixth or minor third. With three or more voices, **some two voices** close that way into a unison or octave, and the rest are free: the bass may leap from the fifth to the final. | Fux pp. 28–29; pp. 76–82, Figs. 101, 104–106 |
| `full-triad` | Inside the canon, a slice with three or more voices sounding and no third or sixth over the bass (only unisons, octaves and fifths: an empty chord). Ours as a cost. | Fux p. 71 ("the harmonic triad" in each measure if possible), p. 72 (a sixth or an octave may stand in) |
| `prefer-imperfect` | Each perfect consonance between the beginning and the end. | Fux p. 28 |
| `parallel-imperfect-run` | More than `max` (3) parallel moves between imperfect consonances in a row. | Mann's note, Fux p. 21 |
| `repeat` | A tone repeated more than once (three in a row). | Fux p. 29n |
| `melodic-augmented` | An augmented, diminished or chromatic melodic interval. Ours, generalized: a k-step leap whose size occurs only once in the mode's k-step spectrum while another size occurs more. In the diatonic scale that's exactly the tritone. | Fux p. 27n |
| `melodic-leap` | A leap larger than a fifth, except the octave and the ascending minor sixth. Measured in cents. | Fux p. 27n |
| `leap-compensation` | A leap larger than a third that isn't turned back, or two leaps in a row in one direction. | Fux p. 27n |
| `cadence-approach` | At a close the renderer added: the note that leads to the final by a semitone (C sharp up to D in dorian, B up to C in ionian, F down to E in phrygian) is reached **by step**; and where it was raised by ficta, its natural form (C for C sharp) doesn't sound in that voice in the two notes before it, or in any voice in the slice just before (a false relation). The close's notes carry their written degree, so steps count from the note as written: F to C sharp is an augmented fifth, not a sixth. Only a semitone **into the final** counts as a leading note: an inner voice falling a semitone to the final chord's third (A to G sharp over E) doesn't. | ours, after Fux's first-species closes (pp. 28–29) and musica ficta (M4 session 1) |
| `entry-rest` | A voice coming back after a rest shorter than `beats` (1). "Let voices rest alternately, so that rests set up the entrances." | Mann pp. 216–217 |
| `phrase-seventh` | A phrase (a run of notes between rests) starting a 7th or 9th from the end of the phrase before. Checked in heptatonic modes. | Mann p. 217 |
| `roughness-ceiling` | The model's score above `ceiling` (0.6) in a slice, or above `windowCeiling` (0.4) on average over a window. | PLAN §3.3, the `spectral` profile |

**Screening part of a texture:** when the answer finder checks part of an N-voice canon
(a follower against the dux, or two followers), every pair is judged as upper voices, so
a fourth (or a tritone) is consonant. Another voice may sound below them. The whole set is then judged
against its real bass (`fourthsFree` in `cg-analyze`).

**Rules reported elsewhere:**
- The **invertibility** of a canon's intervals (x ↔ period − x; Mann pp. 231–232) is
  reported by the answer finder, which knows each follower's interval.
- **The closes for more voices** aren't a rule but the renderer's (`cg-canon`, M4 part D):
  Fux's three- and four-part cadences, with musica ficta on the two voices that close, and
  a third in the final chord made major (Fux pp. 80, 82). See `docs/M4-checklist.md`, Part D.

**Fux's three-part examples as golden tests** (`tests/fixtures/fux/fig101.json` to
`fig105.json`): Figs. 101, 104 and 105 pass `fux-relaxed`; under `fux-strict` only the
hidden fifths and octaves Fux accepts there fail. Fig. 102, Joseph's rewrite, fails where
Aloys says: two hidden progressions in a row (p. 79).

## Consonance models (`cg-consonance`)

| Model | Classes | Default for |
|---|---|---|
| `fux12` | Fux's table, within 15 cents of a semitone | 12-EDO |
| `ratio` | The simplest ratio within 20 cents, n and d ≤ 16. Classes by Tenney height: perfect ≤ 2.6, imperfect ≤ 5.4. The prime limit is 5, or the system's own (7 for non-octave systems). | every other system |
| `roughness` | Sethares's sensory roughness from the voice bank's partials, normalized over one period at the bass's frequency: perfect ≤ 0.12, imperfect ≤ 0.45 | ask for it (`spectral`) |
| `table` | Your own entries `{ cents, cls }` | ask for it |
