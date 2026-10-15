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
| `fux-strict` | first species, note against note (Fux pp. 27–33) | hard: dissonance, parallel-perfect, hidden-perfect, begin-perfect, end-perfect, mode-final, penultimate, repeat, melodic-augmented, melodic-leap. Soft: prefer-imperfect (0.5), parallel-imperfect-run (1, max 3), leap-compensation (0.5) |
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
| `dissonance` | Every slice is consonant. A **fourth over the sounding bass** is a dissonance; between upper voices it isn't. | Fux pp. 20–21, 27 |
| `dissonance-treatment` | A dissonance must be one of two things: **(1)** a passing or neighbour note, stepping in and out, not on a strong beat; or **(2)** a suspension, held from a consonance and resolving down by step. A fourth over the bass with 3+ voices is reported as `six-four`. | ours, after Fux's 2nd–4th species (pp. 41–64) and Albrechtsberger's canons |
| `six-four` | A 6/4 against the actual sounding bass. It's "bad particularly in the first or in the last measure or on any strong beat". Reported by `dissonance-treatment`. | Mann pp. 228, 236–237 |
| `parallel-perfect` | Parallel (or similar, by octave displacement) motion between two perfect consonances of the same class: consecutive fifths, octaves, unisons. | Fux p. 22 |
| `hidden-perfect` | Similar motion into a perfect consonance from a different interval. It's forbidden because filling in the leap (diminution) would reveal consecutive fifths or octaves (Figs. 7–8). | Fux pp. 22, 32–33 |
| `begin-perfect` | The first slice with two or more voices has only perfect consonances over the bass. | Fux p. 28 |
| `end-perfect` | So does the last. With three or more voices, a third is allowed. | Fux pp. 28, 112 |
| `mode-final` | The lowest voice sounds the mode's final in the first and last slices. The final is `final`, or else voice 0's last note. | Fux p. 31 |
| `penultimate` | The next-to-last slice is an imperfect consonance, and the outer voices close by contrary step. In 12-EDO it must be a major sixth or minor third. | Fux pp. 28–29 |
| `prefer-imperfect` | Each perfect consonance between the beginning and the end. | Fux p. 28 |
| `parallel-imperfect-run` | More than `max` (3) parallel moves between imperfect consonances in a row. | Mann's note, Fux p. 21 |
| `repeat` | A tone repeated more than once (three in a row). | Fux p. 29n |
| `melodic-augmented` | An augmented, diminished or chromatic melodic interval. Ours, generalized: a k-step leap whose size occurs only once in the mode's k-step spectrum while another size occurs more. In the diatonic scale that's exactly the tritone. | Fux p. 27n |
| `melodic-leap` | A leap larger than a fifth, except the octave and the ascending minor sixth. Measured in cents. | Fux p. 27n |
| `leap-compensation` | A leap larger than a third that isn't turned back, or two leaps in a row in one direction. | Fux p. 27n |
| `entry-rest` | A voice coming back after a rest shorter than `beats` (1). "Let voices rest alternately, so that rests set up the entrances." | Mann pp. 216–217 |
| `phrase-seventh` | A phrase (a run of notes between rests) starting a 7th or 9th from the end of the phrase before. Checked in heptatonic modes. | Mann p. 217 |
| `roughness-ceiling` | The model's score above `ceiling` (0.6) in a slice, or above `windowCeiling` (0.4) on average over a window. | PLAN §3.3, the `spectral` profile |

**Rules reported elsewhere:**
- The **invertibility** of a canon's intervals (x ↔ period − x; Mann pp. 231–232) is
  reported by the answer finder, which knows each follower's interval.
- `fux-relaxed` (Fux p. 139: "the rules are to be less rigorously observed" as voices are
  added) arrives with the generator in M4.

## Consonance models (`cg-consonance`)

| Model | Classes | Default for |
|---|---|---|
| `fux12` | Fux's table, within 15 cents of a semitone | 12-EDO |
| `ratio` | The simplest ratio within 20 cents, n and d ≤ 16. Classes by Tenney height: perfect ≤ 2.6, imperfect ≤ 5.4. The prime limit is 5, or the system's own (7 for non-octave systems). | every other system |
| `roughness` | Sethares's sensory roughness from the voice bank's partials, normalized over one period at the bass's frequency: perfect ≤ 0.12, imperfect ≤ 0.45 | ask for it (`spectral`) |
| `table` | Your own entries `{ cents, cls }` | ask for it |
