# Research notes: canons, algorithmic counterpoint, tuning and spectra

This is an annotated reading list for the canon generator. Each entry gives:
- **What it is**
- **What we take from it**, the specific feature or rule it informs
- **Milestone**, the PLAN.md milestone(s) it feeds
- **Status:**
  - `read`: read in the source itself
  - `secondary`: known from reliable secondary sources or search results, not yet read in full
  - `verify`: a detail we rely on still needs checking against the primary source before we
    build on it

Links worked when collected. Some sites (archive.org, mtosmt.org, docs.cycling74.com) could not
be reached from the build environment, so those entries are `secondary` until someone reads
them on a normal connection.

---

## 1. Counterpoint and canon: historical and theory sources

### Fux, *The Study of Counterpoint* (*Gradus ad Parnassum*, 1725), trans. Alfred Mann (Norton, rev. ed. 1965)
- **What it is.** The standard teaching method for species counterpoint. The user attached the
  PDF.
- **What we take from it.** The `fux-strict` rule profile and the golden tests:
  - Consonance classes (p. 21). Perfect: unison, fifth, octave. Imperfect: thirds and sixths.
    Dissonant: second, fourth, diminished fifth, tritone, seventh.
  - **The four rules of motion** (p. 22). Perfect to perfect only by contrary or oblique
    motion. All other progressions may use any motion.
  - Prefer imperfect consonances. Begin and end on perfect ones (p. 28).
  - Penultimate note: a major sixth when the cantus firmus is below, a minor third when it is
    above (pp. 28–29). Raise the seventh degree in Dorian, Mixolydian and Aeolian (p. 29n).
  - Melodic limits (p. 27n):
    - no augmented, diminished or chromatic intervals
    - no leap larger than a fifth, except the octave and the ascending minor sixth
    - avoid consecutive leaps in one direction, and compensate leaps
  - Repeat a note at most once (p. 29n). Stay in the mode of the given melody (p. 31).
  - **Hidden fifths and octaves revealed by "diminution"**, meaning filling in a leap
    (pp. 32–33, Figs. 7–8). This is why direct motion into a perfect consonance is banned.
  - Modes on D, E, F, G, A and C; B is excluded because it has no perfect fifth (p. 33).
  - Mann's note limits parallel imperfect consonances to "three or four" in a row (p. 21n).
  - **"As the number of voices increases, the rules are to be less rigorously observed"**
    (p. 139). This becomes the voice-count weight scaling in `fux-relaxed`.
  - The appendix on harmonic and arithmetic division (pp. 141–143) derives the intervals from
    proportions and relates them to the overtone series. That is the historical bridge to our
    harmonic/subharmonic ("log-axis") inversion and to the spectral consonance models.
  - Fig. 5 (correct) and Fig. 6 (with Fux's marked errors at bar 1 and bars 2–3) become
    analyzer golden tests.
- **Milestone.** M3, M4, M5.
- **Status.** `read` for pp. 1–33 and 138–149. Species 2–5 (pp. 41–70) are to be read in
  detail at M5.

### Albrechtsberger, "The Canon," from *Gründliche Anweisung zur Komposition* (1790), trans. in Alfred Mann, *The Study of Fugue* (Rutgers UP, 1958), pp. 213–261
- **What it is.** The canon chapter Albrechtsberger used to teach Beethoven. Mann's
  introduction makes a point that matters for this project: **Fux's *Gradus* does not treat
  canon at all.** Albrechtsberger added a canon chapter, citing Marpurg rather than Fux
  (p. 214). So `fux-strict` supplies the counterpoint rules, and this chapter supplies the
  canon-specific ones.
- **What we take from it** (page numbers are Mann's):
  1. **Definition and strictness** (p. 227). The follower imitates *everything*: note values,
     rests (except those before its first entry), ties, syncopations, skips, whole and half
     steps, and ornaments. In our terms, the renderer must carry rests, ties and ornaments
     through every transform.
  2. **Taxonomy** (pp. 227–228):
     - concluded vs. perpetual canons
     - retrograde, augmentation, diminution and inversion
     - double (4 voices), triple (6) and quadruple (8) canons
     - canons at every interval
     - *"Entrances at different intervals … may not be mixed in one and the same canonic
       voice"*: one interval per follower
  3. **Strict vs. scale-step answers** (p. 228). Only canons at the unison and octave can
     copy whole and half steps exactly. At the fifth and fourth this is sometimes possible.
     At the 2nd, 3rd, 6th, 7th and 9th it is impossible. This is exactly our `interval.domain`
     split: `absolute` is the strict answer, and `degree` is the ordinary answer in the scale.
     It also matches Tymoczko's chromatic vs. scalar transposition (§3a).
  4. **Register matters** (p. 228). A unison canon sung by soprano and tenor turns into an
     octave canon. Open or closed canons sung in the wrong registers can produce a **6/4
     chord where a 5/3 belongs**. So the analyzer must judge every slice against the
     *actual sounding bass*, not the written voice order.
  5. **Writing by chaining** (p. 228). A two-voice canon at the unison or octave needs no
     double counterpoint: write it note by note, placing the answer "a half or full measure
     or more" later. This is the chain method behind `cg.generate` (PLAN §3.5).
  6. **Perpetual ↔ concluded** (pp. 229–230):
     - perpetual: drop the closing note, and repeat from measure 2; the last note must lead
       smoothly back into measure 2
     - concluded: add a final note in each voice, ending on a unison, octave or third;
       otherwise use the cadence formulas **2–3 | 1** (tied second) or **7–6 | 8** (tied
       seventh)
     
     These become the `loop` wrap check and the `free-cadence` formulas.
  7. **Hidden answers** (p. 230). A mostly stepwise line can hide several canons. Ex. 201 can
     be answered at the upper 2nd, lower 3rd, upper 6th, lower 7th, upper and lower octave,
     lower 9th and lower 10th. This motivates the **answer finder** (PLAN §3.6).
  8. **Interval relationships** (pp. 231–232):
     - canons at the 6th, 7th and octave come from double counterpoint at the octave
     - the canon at the 10th is a simple transposition
     - a canon at the 9th is a transposed canon at the 2nd, which can be read as a canon at
       the 7th
     
     In general, in any scale system, an interval *x* inverts to *period − x* (PLAN §3.3,
     invertibility check).
  9. **The round as a block** (pp. 232–237). Write a *first draft* (*inventio*): a 3- or
     4-part setting for equal voices. Its parts become successive *sections* of one melody.
     That melody is notated either *open* (*apertus*, in score) or *closed* (*clausus*, one
     line with § entry signs). Rules for the first draft (p. 237):
     - every voice is a good melody on its own
     - the first two or three voices already form a complete 2- or 3-part setting
     - the last voice completes the harmony
     
     The section carrying the bass cadence (a fifth down or a fourth up, p. 233n) must sit
     where it will not create a 6/4 on strong beats (pp. 236–237). This is the **block
     method for rounds** (PLAN §3.5).
  10. **Entries and phrases** (Albrechtsberger's corrections to Beethoven, pp. 216–217):
      - let voices rest alternately, so rests set up the thematic entrances
      - *"It is not good to place the beginning of a new phrase at the distance of a seventh
        or ninth from the end of the preceding phrase."*
      
      Both become soft rules.
  11. **Endings and sectional canons** (p. 242). § marks the end of the strict canon, and the
      remaining bars are "a free addition". Ex. 225 (Palestrina, 5 voices) combines a 2-voice
      canon and a 3-voice canon at the same time, a **double canon** (`groups` in the spec).
  12. **Riddle canons** (pp. 255–261).
      - Only the dux is given. The solver tries intervals, inversion, retrograde,
        retrograde inversion, different clefs (nine possibilities), rests, augmentation and
        diminution.
      - Kirnberger's canon *"All of us fail, but each fails in a different way."*
      - Ex. 233–234: **each measure is answered by its own retrograde** in the next voice.
      - Ex. 237–238: the answer **reorders the beats inside each measure** (third quarter
        first, then first, then second), including ties and rests.
      - Ex. 239–240 (Albrechtsberger to Haydn, 1806): one perpetual canon with two
        solutions, entering at the lower fifth and octave, or at the upper fourth and lower
        octave.
      
      These become the **answer finder** and two new transforms, `segmentRetrograde` and
      `segmentPermute` (PLAN §3.1).
  13. **Aesthetics** (p. 245). The charm of canon is that *"a work of art appears before us in
      the act of its very creation"*: one voice alone, then others joining until a full
      harmony appears. That is also a fair description of *Lontano* fanning out from one
      pitch.
- **Link to the whole book.** <https://archive.org/details/studyoffugue00mann>
- **Milestone.** M2 (transforms, groups, endings), M3 (register-aware bass, answer finder),
  M4 (block method for rounds), M5–M6 (cadence formulas, invertibility).
- **Status.** `read`: pp. 212–261 (the end of Marpurg, all of Albrechtsberger, including
  the chorale fugue and the canon), from the chapter PDF the user supplied. The rest of the
  book (Fux on fugue, Marpurg, Martini) is not read.

### J. S. Bach: *Goldberg Variations* BWV 988, *Musical Offering* BWV 1079, *Fourteen Canons* BWV 1087
- **What it is.** The canon catalogue.
  - The Goldberg canons step through intervals from the unison to the ninth (every third
    variation). Vars. 12 and 15 are inversion canons.
  - The *Musical Offering* includes canons *cancrizans* (crab), *per motum contrarium*,
    *per augmentationem contrario motu*, *per tonos* (spiral) and *perpetuus*, plus the
    "Quaerendo invenietis" puzzle canon.
  - BWV 1087 is fourteen canons on the first eight bass notes of the Goldberg ground.
- **What we take from it.** The full set of transforms the spec must express, and preset
  ideas: the "Goldberg ladder" and a *per tonos* spiral in a microtonal system.
- **Links.** [Crab canon](https://en.wikipedia.org/wiki/Crab_canon) ·
  [The Musical Offering](https://en.wikipedia.org/wiki/The_Musical_Offering)
- **Milestone.** M2, M6.
- **Status.** `secondary`.

### Mensuration and prolation canons: Ockeghem, *Missa prolationum*; Pärt, *Cantus in Memoriam Benjamin Britten* (1977)
- **What it is.**
  - Ockeghem's mass is built from double mensuration canons, with the canonic interval
    widening through the mass.
  - Pärt's *Cantus* is a prolation canon: a descending scale in several string voices at
    speeds that double from voice to voice.
- **What we take from it.** The `timeScale` field, and the Pärt preset in M2.
- **Milestone.** M2, M6.
- **Status.** `secondary`. The exact voice ratios in *Cantus* are `verify`.

### Conlon Nancarrow, *Studies for Player Piano* (tempo canons)
- **What it is.** Canons whose voices run at different tempi, including irrational ratios.
  Examples:
  - Study No. 24: 14:15:16
  - Study No. 33: √2:2
  - Study No. 36: 17:18:19:20
  - Study No. 37: twelve tempi
  - Study No. 40: e:π
  - acceleration and deceleration canons
- **What we take from it.** Float time with an explicit ε, the convergence-point solver, and
  "converge at x" endings (§3.4).
- **Sources:**
  - Kyle Gann, *The Music of Conlon Nancarrow* (Cambridge UP, 1995). The definition of a
    convergence point.
  - Julie Nemire, "Convergence Points in Nancarrow's Tempo Canons," *Music Theory Online*
    20/1 (2014).
    <https://www.mtosmt.org/issues/mto.14.20.1/mto.14.20.1.nemire.php>
  - Clifton Callender, "Performing the Irrational: Paul Usher's Arrangement of Nancarrow's
    Study No. 33, Canon 2: √2," *MTO* 20/1 (2014). Approximating irrational rhythms, and the
    need for a tolerance.
    <https://www.mtosmt.org/issues/mto.14.20.1/mto.14.20.1.callender.php>
  - A 2026 arXiv paper summarizing the convergence-point calculation strategies:
    <https://arxiv.org/abs/2603.16890>
- **Milestone.** M6.
- **Status.** `secondary`. Our formula in PLAN.md §3.4 is derived independently and will be
  checked against Nemire.

### James Tenney, *Spectral CANON for CONLON Nancarrow* (1974), for player piano
- **What it is.** A 24-voice canon on partials 1–24 of a harmonic series on A, with the piano
  retuned. Every voice shares one duration series that accelerates and then runs in
  retrograde. Rhythm ratios between voices match their frequency ratios (Cowell's
  "rhythmicon" idea).
- **What we take from it.** The model for a canon where pitch and time come from one spectrum.
  It is the **M7 flagship preset**: voice *k* on partial *k*, time scale 1/*k*.
- **Sources:**
  - Robert Wannamaker, *The Music of James Tenney*, vol. 2 (Univ. of Illinois Press, 2021)
  - the program note at <https://highlike.org/james-tenney/>
- **Milestone.** M7.
- **Status.** `secondary`. The entry offsets and the exact duration series are `verify`.

### György Ligeti: micropolyphony (*Requiem* Kyrie 1965, *Lux aeterna* 1966, *Lontano* 1967, *Atmosphères*)
- **What it is.** Dense unison or near-unison canons: many voices share one pitch sequence,
  but each has its own rhythm (different beat subdivisions). The individual lines merge into
  a texture. *Lontano* reuses the canon of *Lux aeterna* and opens on a single A♭ from which
  the lines fan out. Ligeti said the polyphonic rules were as strict as Palestrina's but of
  his own devising.
- **What we take from it.** **Ligeti mode (M8)**:
  - a shared pitch sequence (*color*) with a per-voice subdivision or "elastic talea"
  - no simultaneous attacks
  - the band unfolds from one pitch
  - entries, exits and "holes"
  - density envelopes
- **Sources:**
  - Benjamin R. Levy, "'Rules as Strict as Palestrina's': The Regulation of Pitch and Rhythm
    in Ligeti's *Requiem* and *Lux aeterna*," *Twentieth-Century Music* 10/1 (2013).
  - Jan Jarvlepp, "Pitch and Texture Analysis of Ligeti's *Lux Aeterna*," *ex tempore* 2/1
    (1982). <https://www.ex-tempore.org/jarvlepp/jarvlepp.htm> Sixteen-part unison canon,
    ten textural blocks.
  - Jane Piper Clendinning, "Structural Factors in the Microcanonic Compositions of György
    Ligeti," in *Concert Music, Rock, and Jazz since 1945* (Rochester, 1995). Introduces the
    term "microcanon".
  - Richard Steinitz, *György Ligeti: Music of the Imagination* (Faber, 2003).
  - Jonathan W. Bernard, "Voice Leading as a Spatial Function in the Music of Ligeti,"
    *Music Analysis* 13 (1994).
  - Overview: [Micropolyphony](https://en.wikipedia.org/wiki/Micropolyphony)
- **Milestone.** M8.
- **Status.** `secondary`. Levy's exact rhythmic rules and the per-voice subdivisions in
  *Lux aeterna* are **`verify` before M8**.

### Benjamin R. Levy, *The Electronic Works of György Ligeti and Their Influence on His Later Style* (PhD diss., University of Maryland, 2006)
- **What it is.** Analyses of *Glissandi* (1957) and *Artikulation* (1958), based on
  spectrographs and Ligeti's sketches, and of what carried over into *Apparitions* and
  *Atmosphères*. **Note:** it does *not* cover the *Lux aeterna* canon rules; those are in
  Levy's 2013 article, still `verify`. But its rhythm and texture techniques are directly
  usable for Ligeti mode (M8) and for electroacoustic output.
- **What we take from it** (Levy's page numbers):
  1. **Equal-share durations** (pp. 97–99, 205–211; Ligeti, "Metamorphosis of Musical Form",
     *Die Reihe* 7). This is Ligeti's alternative to the serial duration row: *duration ×
     number of occurrences = a constant*, so every duration value fills the same share of
     time.
     - *Apparitions* I uses inter-onset intervals of 2, 3, 4, 6, 10, 14, 20, 32, 48, 80, 112
       and 160 thirty-second notes, occurring 80, 53, 40, 27, 16, 11, 8, 5, 3, 2, 1 and 1
       times (product ≈ 160).
     - In *Artikulation* the constant changes with the texture, so average density changes
       too.
     - The values are distributed statistically, not serially. Ligeti then nudges them to
       avoid repetition or any hint of metre, adding to one value whatever he subtracts from
       another so the section sums stay fixed (Table 4.4).
     - The scheme defines **entry points, not note lengths** (p. 215). Sounds may overrun
       the next entry or leave it partly empty.
  2. **Geometric duration scales.** *Artikulation* starts from 10 mm of tape and multiplies
     by **11/10** for 50 steps (about 14 s), rounding to whole millimetres (p. 96).
     *Atmosphères*'s section lengths form a near-geometric scale (step ratios 1.06–1.33).
     They are reordered so there is **no clear trajectory and no two neighbouring sections
     share a proportion** (pp. 247–248).
  3. **Additive and Fibonacci acceleration** (*Glissandi*, pp. 42, 48–49). Section lengths
     shrink by differences grouped in near-Fibonacci counts. Events per second climb
     1, 1, …, 2, 3, 4, 5, 7, 10, 15, with the increases themselves following 1, 1, 2, 3, 5:
     an exponential build-up.
  4. ***Bewegungsfarbe* ("moving colour")** (pp. 215–218). This comes from Koenig's
     experiment: notes about **50 ms** apart (20 per second) sit at the blur threshold.
     Ligeti found it most interesting when some elements are above the threshold and some
     below, so rhythm turns into timbre and back. In *Apparitions* II m. 17, violins play 10
     against 9 at ♩ = 80, about 24 attacks per second, and the parts coincide only on the
     first attack. Ligeti also welcomed players' **mistakes**: the *Walküre* Magic Fire
     string parts *"add up and create a floating, fluctuating pattern … Atmosphères is based
     on the same principle"* (p. 218). Tempos are "approximate indications" (p. 249).
  5. **Cross-fades as gestures** (pp. 226–232).
     - *Apparitions* I m. 49: an upper chromatic cluster fades out while the adjacent lower
       one fades in, so register appears to move through dynamics alone.
     - *Atmosphères* letter B: the white-key and black-key subsets of one cluster are
       cross-faded.
     
     Both come from studio cross-fading, which *Artikulation* also uses for reverb and for
     moving sound between channels.
  6. **The crawling cluster** (*Apparitions* mm. 62–63; *Pièce électronique no. 3*; pp.
     232–235). The lowest note of a chromatic cluster leaps up to become its highest, again
     and again. Each part moves once, by a big leap, while the whole cluster creeps upward.
     **This is a canon**: the dux is a staircase of leaps of N steps every N·Δ beats, and
     follower *k* answers one step higher and Δ·*k* beats later.
  7. ***Pièce électronique no. 3*'s pitch field** (pp. 224–225). Sixteen sine tones per
     octave:
     - *harmonic* above 1000 Hz (partials 16–31 of 62.5 Hz, i.e. 1000–1937 Hz)
     - *subharmonic* below it (16000/n for n = 16–31, i.e. 1000 down to about 517 Hz)
     
     That is exactly our log-axis inversion around 1000 Hz. Tones fade out toward 667,
     1000 and 1500 Hz. The 1500 is the arithmetic mean of the upper octave and the 667 the
     harmonic mean of the lower one, which is Fux's appendix again. Entries and exits follow
     Stockhausen's *modus* orders: low to high, high to low, or toward a centre.
  8. ***Glissandi*'s form** (pp. 37–41, 67–92). The second half plays the first half and its
     retrograde *at the same time*, heavily filtered so only traces come through, with a few
     "anomalies" transplanted from other sections. Palindromic "invariant gestures" make
     prime and retrograde hard to tell apart. In canon terms it is a **masked crab canon**.
     Its mirror-image glissandi come from ring modulation (c ± m), a mirror in *linear*
     frequency. Variable-speed tape couples transposition and duration (an octave up means
     half the length, pp. 36, 75).
  9. **Form as layers** (Sabbe, quoted pp. 237–238). Each parameter changes at its own rate.
     Boundaries feel strong where several parameters change together. Levy's
     segmentation method counts how many of Cogan's sonic oppositions change at once
     (pp. 19–24).
- **→ design** (PLAN §3.1, §3.6, M8):
  - an **equal-share inter-onset distribution** with a rebalancing step that keeps sums fixed
  - geometric duration scales and reordering rules
  - **pairwise-coprime per-voice subdivisions**: subdivisions *n* and *m* coincide inside a
    beat only *gcd(n, m)* times, so pairwise-coprime choices (3, 4, 5, 7 …) can collide only
    on beat boundaries (our derivation)
  - an **aggregate attack-rate** metric drawn against the 50 ms (20/s) threshold
  - seeded timing **jitter**
  - **cross-fade groups** (per-voice amplitude envelopes)
  - entry and exit *modus* orders
  - a `tapeSpeed` follower option (interval *r*, time scale 1/*r*)
  - a `linear` inversion axis (f ↦ 2c − f)
  - a post-render **mask** (time-varying band and gating)
  - a per-voice `space` (channel or pan)
  - presets: crawling cluster, *Glissandi*-form masked crab canon, and the PE3
    harmonic/subharmonic field
- **Links:**
  - [Monoskop PDF](https://monoskop.org/images/3/3e/Levy_Benjamin_Robert_The_Electronic_Works_of_Gyorgy_Ligeti_and_Their_Influence_on_His_Later_Style.pdf)
  - [UMD DRUM record](https://drum.lib.umd.edu/handle/1903/3457)
  - [Levy 2013, "Rules as Strict as Palestrina's" (abstract)](https://resolve.cambridge.org/core/journals/twentieth-century-music/article/abs/rules-as-strict-as-palestrinas-the-regulation-of-pitch-and-rhythm-in-ligetis-requiem-and-lux-aeterna/6F18D8E9E64B983A25F66B73F002ADED)
    The abstract says the *Requiem*'s pitch rules survive in sketches, but *Lux aeterna*'s
    rhythmic rules must be inferred from the score. The article is paywalled.
- **Milestone.** M8, M2 (`tapeSpeed`, `linear` axis), stretch (spatial canons).
- **Status.** `read`: the full text pasted by the user.

### Per Nørgård: the infinity series
- **What it is.** A self-similar integer sequence (OEIS A004718): `a(0)=0`, `a(2n) = −a(n)`,
  `a(2n+1) = a(n)+1`, giving 0, 1, −1, 2, 1, 0, −2, 3, … Every 2nd term gives the series
  inverted, and every 4th term gives the series itself. **It is a mensuration and inversion
  canon of itself by construction.**
- **What we take from it.** A dux generator whose copies at 1:2 (inverted) and 1:4 (prime)
  speed coincide with the original. This is a stretch preset.
- **Links.** <https://oeis.org/A004718> ·
  <https://www.lawtonhall.com/blog/2019/9/9/per-nrgrds-infinity-series>
- **Milestone.** Stretch.
- **Status.** `secondary`. The recurrence was checked by hand against the first eight terms.

### Steve Reich, phase canons (*Piano Phase* 1967, *Clapping Music* 1972)
- **What it is.** Canons whose delay drifts continuously, or steps through a cycle.
- **What we take from it.** A `delay` that can be a function of time. A small addition to M2 or
  M6.
- **Status.** `secondary`.

### Tom Johnson, rhythmic tiling canons; Vuza canons (Vuza, Andreatta, Amiot)
- **What it is.** Rhythmic canons whose voices tile the time line exactly, with no two attacks
  together. Vuza canons have no inner periodicity. Johnson's *Tilework* series (2003 onward)
  is built on them.
- **What we take from it.** A rhythm-only canon mode, a cousin of the "no simultaneous
  attacks" rule in Ligeti mode.
- **Links:**
  - [Johnson, "Tiling in my music"](https://www.editions75.com/texts/Tiling_in_my_music.pdf)
  - [Johnson, "Tiling the Line in Theory and in Practice"](https://www.editions75.com/texts/Tiling_the_Line_in_Theory_and_in_Practice.pdf)
  - [An integer linear programming model for tilings](https://arxiv.org/abs/2107.04108)
  - [Modulus *p* Vuza canons](https://arxiv.org/abs/1505.06930)
  - [CNRS, "Mathematics of rhythmic canons"](https://www.insmi.cnrs.fr/en/cnrsinfo/maths-musique-6-canons-rythmiques)
- **Milestone.** Stretch.
- **Status.** `secondary`.

---

## 2. Computational counterpoint and canon generation

### Bill Schottstaedt, *Automatic Species Counterpoint* (CCRMA report STAN-M-19, 1984; also in *Current Directions in Computer Music Research*, MIT Press, 1989)
- **What it is.** An early, influential generator. Fux's rules (bent and extended where
  needed) become **weighted penalties**, and a depth-first search with backtracking finds
  low-penalty solutions.
- **What we take from it.** The hard and soft rule split and the shape of the backtracking
  search in `cg.generate`.
- **Link.** <https://ccrma.stanford.edu/papers/view/2686>
- **Milestone.** M4.
- **Status.** `secondary`. The PDF (stanm19.pdf) is to be read before M4.

### FuxCP, from the UCLouvain group under Peter Van Roy, with an IRCAM link
- **What it is.** A series of theses and papers formalizing Fux's species counterpoint as
  constraint programming, using Gecode with an OpenMusic interface:
  - two voices (Wafflard 2023)
  - three voices (Lamotte 2024)
  - four voices (Cleenewerk and de Patoul 2024)
  - a hard vs. soft rule split, with **minimal unsatisfiable subsets** to diagnose conflicts
    against Fux's own examples (Lai 2025)
  - fixes for slow higher-species and multi-voice runs (Burignat and de Mentendehorne 2026)
  - a related paper from the group by Sprockeels et al., JIM 2023
- **What we take from it.** The most complete machine-readable list of Fux's rules, so it is
  our checklist when writing `fux-strict`. The minimal-unsatisfiable-subset idea becomes
  our lighter "which rule blocked the search" diagnostics.
- **Links:**
  - [FuxCP (four voices)](https://thesis.dial.uclouvain.be/entities/masterthesis/4e63f1e0-f0cd-4b44-9219-3b8213f7d30a)
  - [Making FuxCP generate harmonious counterpoints](https://thesis.dial.uclouvain.be/entities/masterthesis/958f395d-c02e-4b4f-a9fa-b195efda1367)
  - [Wafflard 2023](https://webperso.info.ucl.ac.be/~pvr/WAFFLARD_46581700_2023.pdf)
  - [Lai 2025](https://webperso.info.ucl.ac.be/~pvr/LAI_08721900_2025.pdf)
  - [Sprockeels et al., JIM 2023](https://webperso.info.ucl.ac.be/~pvr/SPROCKEELS-JIM2023.pdf)
- **Milestone.** M3–M5.
- **Status.** `secondary`. The exact paper titles are `verify`.

### Strasheela (Torsten Anders), with a canon example
- **What it is.** A constraint-based composition system written in Oz. Its example
  `03-FloridCounterpoint-Canon.oz` writes two-voice florid counterpoint in which the voices
  form a canon at the fifth. Background: Anders and Miranda, "Constraint Programming Systems
  for Modeling Music Theories and Composition," *ACM Computing Surveys* 43/4 (2011).
- **What we take from it.** How to write "the follower equals a transformed dux" as a
  constraint, and how to combine it with counterpoint rules.
- **Link.** <https://strasheela.sourceforge.net/strasheela/examples/03-FloridCounterpoint-Canon.oz>
- **Milestone.** M4–M6.
- **Status.** `secondary`.

### Anton: Boenn, Brain, De Vos and ffitch, "Automatic Music Composition using Answer Set Programming," *Theory and Practice of Logic Programming* 11 (2011)
- **What it is.** Renaissance counterpoint rules written in AnsProlog. A solver composes
  pieces and can also **diagnose errors in human compositions**. Its rhythm is based on Farey
  sequences.
- **What we take from it.** Using one rule set both to generate and to analyze. This matches
  how our generator and analyzer share `cg.rules`.
- **Link.** <https://arxiv.org/abs/1006.4948>
- **Milestone.** M3, M4.
- **Status.** `secondary`.

### David Cope, *Gradus*: "A Musical Learning Algorithm," *Computer Music Journal* 28/3 (2004); *Computer Models of Musical Creativity* (MIT Press, 2005)
- **What it is.** It learns settings for six counterpoint goals from example first-species
  pieces, then composes over a cantus firmus. It is a direct cousin of cento, which is
  EMI-inspired.
- **What we take from it.** A stretch idea: learn the soft-rule weights from example canons
  instead of hand-tuning them.
- **Milestone.** Stretch.
- **Status.** `secondary`.

### Other generation approaches
- **Herremans and Sörensen**, "Composing first species counterpoint with a variable
  neighbourhood search algorithm," *Journal of Mathematics and the Arts* (2012). Local search
  with an objective made of 19 melodic and 19 harmonic rules (the FuX app). This is our
  fallback if backtracking struggles on long canons.
  [sourceforge.net/p/fuxapp](https://sourceforge.net/p/fuxapp/)
- **Farbood and Schoner**, "Analysis and Synthesis of Palestrina-Style Counterpoint Using
  Markov Chains," ICMC 2001. A statistical alternative.
  [PDF](https://bpb-us-e1.wpmucdn.com/wp.nyu.edu/dist/f/11865/files/2020/08/Farbood-ICMC2001.pdf)
- **Kemal Ebcioğlu**, CHORAL (*CMJ* 12/3, 1988). The classic rule-based expert system, which
  plans with backtracking. Historical context.
- **Örjan Sandred**, PWGL Cluster Engine, for rhythm and pitch constraint solving. Useful for
  rhythm constraints at M5 and M8.

### Surveys
- **Fernández and Vico**, "AI Methods in Algorithmic Composition: A Comprehensive Survey,"
  *JAIR* 48 (2013). <https://arxiv.org/abs/1402.0585>
- **Herremans, Chuan and Chew**, "A Functional Taxonomy of Music Generation Systems," *ACM
  Computing Surveys* 50/5 (2017). <https://arxiv.org/abs/1812.04186>
- **Eleanor Selfridge-Field**, course materials on artificial counterpoint (Stanford Music 254).
  <https://esf.ccarh.org/Mus254_2024/06B_Artificial-Counterpoint_2024.pdf>

---

## 3. Tuning, consonance and spectra

### William A. Sethares, *Tuning, Timbre, Spectrum, Scale* (Springer, 2nd ed. 2005); "Local consonance and the relationship between timbre and scale," *JASA* 94 (1993)
- **What it is.** Dissonance curves computed from a timbre's partials, built on Plomp and
  Levelt's roughness data. It shows that each spectrum has its own matching scales.
- **What we take from it.** The **`roughness` consonance model**, which uses the same partial
  list as the MSP voice bank (PLAN §3.3, §4.3). This is how Fux-style rules can run on
  inharmonic spectra.
- **Milestone.** M3, M7.
- **Status.** `secondary`. The curve constants are `verify` against the book's appendix.

### R. Plomp and W. J. M. Levelt, "Tonal Consonance and Critical Bandwidth," *JASA* 38 (1965)
- The perceptual data behind the roughness model. **M3.**

### James Tenney, *A History of "Consonance" and "Dissonance"* (Excelsior, 1988), and harmonic distance
- **Tenney height** log₂(n·d) for the ratio n/d is the score in the `ratio` model. The book
  explains why "consonance" has meant different things in different periods, which is useful
  when choosing per-system thresholds. **M3, M7.**

### Clarence Barlow, harmonicity ("Two Essays on Theory," *CMJ* 11/1, 1987)
- An alternative score for the `ratio` model that weights prime factors. **M7.**

### Spectral music
- **Joshua Fineberg**, "Guide to the Basic Concepts and Techniques of Spectral Music,"
  *Contemporary Music Review* 19/2 (2000). Harmonic, stretched and FM spectra, and
  instrumental synthesis.
- **Gérard Grisey**, *Partiels* (1975), a harmonic spectrum.
- **Tristan Murail**, *Gondwana* (FM spectra) and "spectral distortion" (stretched or
  compressed partials).
- **What we take from it.** The scale-system builders: harmonic, subharmonic, stretched
  `f0·k^s`, FM `|c ± k·m|`. Also register spacing based on the spectrum in the `spectral`
  profile. **M1, M7.**

### The Scala `.scl` format (Manuel Op de Coul)
- `!` lines are comments. Then come a description line and a note count. Each pitch is in
  cents if it contains a `.`, otherwise a ratio. The last pitch is the period. The Scala
  archive has thousands of scales. **M1** (parse and write).

---

## 3a. Geometry of music and scale theory

### Dmitri Tymoczko, *A Geometry of Music: Harmony and Counterpoint in the Extended Common Practice* (Oxford Studies in Music Theory, OUP, 2011)
- **What it is.** A theory in which pitch is a continuous real number (log-frequency), each
  chord is a point in a "chord space", and a voice leading is a path between points. The
  spaces are orbifolds: the n-torus divided by voice permutation, Tⁿ/Sₙ. The book argues
  that **harmony and counterpoint constrain each other**, and that tonality comes from **five
  components**:
  1. conjunct melodic motion
  2. acoustic consonance
  3. harmonic consistency
  4. limited macroharmony (a small pitch collection over a moderate span of time)
  5. centricity (one pitch heard as a centre)
- **Structure:**
  - Part I, Theory:
    1. Five Components of Tonality
    2. Harmony and Voice Leading
    3. A Geometry of Chords
    4. Scales
    5. Macroharmony and Centricity
  - Part II, History and analysis: the extended common practice, functional harmony,
    chromaticism, scales in twentieth-century music, and jazz.
  
  Chapter 2 treats transposition and inversion as distance-preserving maps of pitch space,
  and defines voice-leading size. Chapter 4 covers scale degrees, **scalar transposition**,
  **scalar inversion**, evenness, and **interscalar transposition**.
- **What we take from it:**
  1. **The model of pitch is ours already.** Pitch is a continuous real number, so the
     geometry works the same in 12-TET, 31-EDO or a harmonic series. Our float-MIDI pitch is
     Tymoczko's pitch space.
  2. **Canon transforms are his isometries.** Transposition and inversion in pitch space are
     distance-preserving maps, the same as our `absolute` interval and `log`-axis inversion.
     Retrograde and time-scaling act on time, not on pitch space.
  3. **Scalar vs. chromatic transposition** formalizes our `interval.domain`:
     - `degree` = scalar transposition or inversion (the scale works as a ruler)
     - `absolute` = chromatic transposition or inversion
     
     Albrechtsberger's strict vs. ordinary answers (§1, Mann) are the same distinction, two
     centuries earlier.
  4. **Interscalar transposition** suggests a new option: a follower that answers in a
     *different* scale or spectrum, mapped degree by degree. For example, a dux in the
     harmonic series answered in a stretched spectrum, or a diatonic dux answered in a
     31-EDO mode. Albrechtsberger's "e for e♭ according to the tonal changes" (Mann p. 258)
     is the small tonal version of the same idea (PLAN §3.1, per-voice `scale`).
  5. **The five components become analyzer metrics.** Each works on any tuning (PLAN §3.6):
     - conjunct motion: mean absolute melodic step, in cents
     - consonance: the chosen consonance model
     - harmonic consistency: distance between successive vertical *chord types*, ignoring
       transposition
     - macroharmony: pitch-class spread over a sliding window
     - centricity: how concentrated the pitch-class weight is
     
     Also **voice-leading size**: the summed motion of all voices between consecutive
     slices. These double as targets for the `spectral` and `micropoly` profiles. In Ligeti
     mode, for example, macroharmony *is* the band width, and centricity starts at maximum
     on a single pitch, as in *Lontano*.
  6. **A canon is a path.** Every slice of an N-voice canon is a point in N-note chord space.
     The canon traces a path, and because the voices are copies of the dux, its
     voice-leading size depends only on the dux's intervals at the different delays. One
     stretch idea is to draw that path (as Tymoczko's ChordGeometries software does), for
     example in Jitter.
  7. **Evenness.** Nearly even chords sit close to their own transpositions, so they allow
     efficient voice leading. This suggests a maximally-even scale builder (see Clough and
     Douthett, below).
- **Status.** `secondary`. The user's PDF of the book would not load. The structure and claims
  above come from library catalogue records, the MAA review listing, reviews, and Tymoczko's
  papers below. Three uploads of the book failed, so **we are moving on without it.** The design
  relies only on the confirmed definitions, and labels our own formulas. Chapter notes follow.
- **Links:**
  - [Wikipedia summary](https://en.wikipedia.org/wiki/Dmitri_Tymoczko)
  - [MAA review / contents](https://old.maa.org/node/111660)
  - [Princeton Alumni Weekly feature](https://paw.princeton.edu/article/grand-unified-theory-music)
  - [OUP page](https://global.oup.com/academic/product/a-geometry-of-music-9780195336672)
  - [Hook's review, *MTO* 17/3 (2011)](https://www.mtosmt.org/issues/mto.11.17.3/mto.11.17.3.hook.pdf)
  - [Gogins's review, *CMJ* 36/1](https://www.computermusicjournal.org/reviews/36-1/gogins-tymoczko-book.html)

#### Chapter notes, chapters 2–5 (`secondary`: from the table of contents, reviews and Tymoczko's papers; the book text itself has not been read)

The book's pages and these reviews could not be opened from the build environment. Section
titles come from publisher and library listings. Definitions come from Tymoczko's papers and
the reviews, as quoted in search results. Each note ends with **→ design**, the concrete
consequence for the generator. Where we invent a formula, it is labelled as ours.

**Chapter 2, Harmony and Voice Leading.** Linear vs. circular pitch space. Transposition and
inversion as distance-preserving maps. Voice-leading size. "Near identity."
- Tymoczko (2006) asks every voice-leading measure to respect two principles: small voice
  leadings move each voice a short distance, and along paths that don't cross. Hall and
  Tymoczko (Bridges 2007) show these principles amount to the *submajorization* order, and
  say intuition alone cannot pick one exact metric. The common choices (taxicab, Euclidean,
  Chebyshev) all respect the principles, and the book argues they agree with straight-line
  distance in chord space.
- → design:
  - voice-leading size gets a selectable norm, `vlNorm: taxicab | euclidean | chebyshev`,
    defaulting to taxicab in cents
  - linear pitch space is our float pitch; circular pitch-class space is pitch modulo the
    scale system's period
  - non-periodic systems (harmonic series, inharmonic spectra) have no natural pitch
    class, so pitch-class metrics fold at a configurable `pcPeriod` (default 1200 cents)
    and the report says so

**Chapter 3, A Geometry of Chords.** Ordered pitch space, two-note chord space,
three-dimensional chord space, voice-leading lattices, and "two musical geometries".
- N-note chords live in Tⁿ/Sₙ:
  - two-note chord space is a Möbius strip
  - three-note chord space is a triangular prism whose ends are glued with a twist
  - the perfectly even chord (the augmented triad, in 12-TET) runs up the centre
  - unisons lie on the edges, and chords with a doubled note on the sides
  
  Voice crossings and unisons are where a path touches the boundary. A *voice-leading
  lattice* is the discrete grid that a particular tuning carves out of the continuous
  space.
- → design:
  1. **An evenness metric for verticals** (our formulation): the distance from each slice to
     the nearest perfectly even chord with the same number of notes (equal division of the
     period). It runs from cluster (low evenness) to equal division (high). In Ligeti mode,
     evenness rises as the band widens.
  2. **Crossings and unisons are reported as boundary events.** Unison canons and
     micropolyphony produce many of them by design. Fux-style profiles penalize them;
     `micropoly` doesn't.
  3. **A fact about rounds.** In a perpetual round at the unison with delay *d*, each voice at
     time *t + d* plays what the previous voice played at *t*. So every vertical repeats, as a
     set of pitches, every *d* beats: the canon is a closed loop in chord space, and its
     harmonic rhythm cycles with period *d*. This is the geometric reason Albrechtsberger's
     block method works.
  4. An EDO is a finer lattice in the same space, so the stretch-goal chord-space view works
     unchanged for microtonal canons.

**Chapter 4, Scales.** 4.1 "A scale is a ruler"; scale degrees; scalar transposition;
scalar inversion; evenness and scalar transposition; constructing the familiar scales;
modulation as voice leading; voice leading between common scales; scalar and interscalar
transposition.
- A scale defines a metric: distance is counted in scale steps.
  - *Scalar transposition* moves by scale steps; *chromatic transposition* moves by a fixed
    pitch distance.
  - *Interscalar transposition* sends degree *x* of collection A to degree *x + c* of
    collection B (Tymoczko's 2004 abstract).
  - Modulation is itself a voice leading between scales. Scales related by single small
    moves form a network (Tymoczko, "Scale Networks in Debussy," *JMT* 48/2, 2004).
- → design:
  1. **Melodic rules are measured on the scale's ruler; consonance in cents.** "Step vs.
     leap", leap compensation and conjunct motion count *scale steps of the active scale*.
     Consonance and roughness use cents. This is how Fux's melodic rules carry over to
     31-EDO or a harmonic-series segment.
  2. **Answer distortion** (our metric): the cents gap between a follower's `degree` answer
     and its `absolute` answer. In nearly even scales the gap is small, while in uneven ones
     (harmonic series, whose steps shrink going up) the dux's shape bends more. The answer
     finder reports this so you can pick the domain on purpose.
  3. **Per-voice `scale`** is interscalar transposition exactly: degree *x* in the dux's scale
     maps to degree *x + c* in the follower's scale.
  4. **Scale-walk spiral**, a generalized *per tonos* canon: on each pass the scale itself
     moves by a small voice leading (a walk through a scale network, in any tuning) instead
     of being transposed. The dux is re-mapped by interscalar transposition each time.

**Chapter 5, Macroharmony and Centricity.** Sections include macroharmony; 5.3 pitch-class
circulation; 5.4 modulating the rate of pitch-class circulation; macroharmonic consistency;
and where centricity comes from.
- Macroharmony is *"the total collection of notes used over small stretches of time"*. Tonal
  music typically uses about 5–7 pitch classes over moderate spans. Centricity is the sense
  that one or more notes are more stable and important. Scale, macroharmony and centricity
  are independent of one another.
- → design (the formulas are ours, guided by the section titles):
  1. **Macroharmony size**: distinct pitch classes in a sliding window. Pitch classes within
     a tolerance (`pcTolerance`, in cents) count as one, so microtones don't inflate the count.
  2. **Pitch-class circulation rate**: how many new pitch classes enter per beat, and how
     quickly the window's contents turn over.
  3. **Macroharmonic consistency**: how much successive windows overlap.
  4. **Centricity**: how concentrated the duration-weighted pitch-class distribution is
     (its maximum share, or its entropy), with extra weight for the bass and for phrase
     starts and ends.
  5. **Ligeti mode is "modulating the rate of pitch-class circulation."** The *Lux
     aeterna*/*Lontano* unfolding becomes a **circulation-rate envelope** that controls how
     fast new pitches enter the shared pitch sequence. Centricity starts at maximum on one
     pitch and is released over time.
  6. An optional alternative (Chiu, *MTO* 27/3, 2021): describe macroharmony by the DFT
     magnitudes of the pitch-class distribution. The DFT is defined on the continuous pitch
     circle, so it works in any tuning.
     <https://www.mtosmt.org/issues/mto.21.27.3/mto.21.27.3.chiu.pdf>

### Tymoczko, "Geometrical Methods in Recent Music Theory," *Music Theory Online* 16/1 (2010)
- **What it is.** *Correction to an earlier note in this file:* this is **not** an overview of
  the book. It is a short (four-page) response to Joti Rockwell's "Birdcage Flights"
  (*MTO* 15.5, 2009). It makes one methodological point that bears directly on our analyzer:
  1. **Graph steps are not distances.** A graph whose edges are "local moves" (the Tonnetz,
     Rockwell's birdcage graphs) need not measure the distance between chords that are
     *not* adjacent. On the Tonnetz, C major is two steps from F major and three from F minor.
     Yet C major → F minor takes only **two** semitones of total motion, and C major →
     F major takes **three** (¶3). Tonnetz distance just counts parsimonious moves.
  2. **Some graphs are faithful.** Douthett and Steinbach's "Cube Dance" path lengths equal
     the voice-leading size, meaning the **taxicab** total of semitone steps across all
     voices (¶5).
  3. **Changing the number of voices breaks distance.** Rockwell's two-edge paths can cancel
     motion: A♭⁷ and C⁷ are both two edges from A♭ minor, but need 3 and 4 semitones of motion
     (¶6). A graph linking clusters, dyads and single notes puts {F♯, G, A♭} and {C♯, D, E♭}
     seven edges apart, though at least 15 semitones of motion separate them (¶7, n. 4).
     Following Callender, Quinn and Tymoczko (2008), *"to obtain completeness without
     sacrificing contrapuntal fidelity, we must restrict ourselves to multisets of a
     particular size."*
  4. **The moral (¶8).** Tell apart models that only list local moves (a subway map) from
     models whose distances mean something between *any* two objects. Coherent geometries
     exist for voice leading among chords with a fixed number of notes. Footnote 1 defines
     **OPC space**: ignore octave, order and note multiplicity, so (C4, E4, G4) ≡
     (E3, G4, G5, C2, E4).
- **What we take from it** (PLAN §3.6):
  - **Measure motion directly; never count graph steps.** Voice-leading size is the summed
    absolute motion in cents, which works in any tuning. Discrete graphs like the Tonnetz are
    12-TET-specific, and they are not reliable distances anyway.
  - **Use voice identity, which canons give us for free.** In a canon each voice is labelled,
    so the actual voice leading between slices is known, and there is no "minimal voice
    leading" search over unordered chords.
  - **Never fold entries and exits into a distance.** Voice-leading size is computed only over
    the voices sounding in *both* slices. Entries, exits and Ligeti-style "holes" are
    reported as separate counts.
  - **Harmonic consistency** is compared only between verticals with the *same number of
    sounding voices*. Comparisons across different numbers of voices are left undefined, not
    approximated.
- **Further reading from its works cited:**
  - Tymoczko, "Three Conceptions of Musical Distance," in *Mathematics and Computation in
    Music* (Springer, 2009): the fullest treatment of the distance question
  - Tymoczko, "Scale Theory, Serial Theory, and Voice Leading," *Music Analysis* 27/1 (2008):
    the row transforms P, I, R and RI are our canon transforms
  - Douthett and Steinbach, "Parsimonious Graphs," *JMT* 42/2 (1998)
  - Cohn, "Maximally Smooth Cycles," *Music Analysis* 15/1 (1996)
  - Rockwell, "Birdcage Flights," *MTO* 15.5 (2009)
- **Link.** <https://mtosmt.org/issues/mto.10.16.1/mto.10.16.1.tymoczko.html> (its figures are
  online only)
- **Milestone.** M3 (metric definitions), M8 (entries, exits, holes).
- **Status.** `read`, from the PDF the user supplied (text only; the figures were not
  included).

### Callender, Quinn and Tymoczko, "Generalized Voice-Leading Spaces," *Science* 320 (2008): 346–348
- The **OPTIC** framework. Five equivalences, used in any combination: **O**ctave,
  **P**ermutation, **T**ransposition, **I**nversion, **C**ardinality. Together they give
  32 kinds of chord equivalence and their quotient spaces. A voice leading is a path in one of
  these spaces.
- **What we take from it.** A precise vocabulary for what the analyzer should ignore. For
  example, "harmonic consistency" compares verticals while ignoring octave, permutation and
  transposition (OPT). Canon transforms are the T and I in OPTIC.
- **Link.** <https://collaborate.princeton.edu/en/publications/generalized-voice-leading-spaces/>
- **Status.** `secondary`.

### Tymoczko, "The Geometry of Musical Chords," *Science* 313 (2006): 72–74
- The first paper on the orbifold model, with an algorithm for finding the shortest voice
  leading between two chords. The companion ChordGeometries software draws pieces as paths in
  chord space.
- **Milestone.** M3 (voice-leading size), stretch (path view).
- **Status.** `secondary`.

### John Clough and Jack Douthett, "Maximally Even Sets," *Journal of Music Theory* 35 (1991): 93–173
- Subsets of *c* equal steps whose notes are spread as evenly as possible, written ME(*c*, *d*).
  ME(12, 7) is the diatonic scale. The construction works for any number of equal steps.
- **What we take from it.** A `maximallyEven(c, d)` scale builder, which gives diatonic-like
  but non-diatonic scales in any equal division (PLAN §3.1). Tymoczko's "evenness and scalar
  transposition" builds on this idea.
- **Link.** [Maximal evenness](https://en.wikipedia.org/wiki/Maximal_evenness)
- **Milestone.** M1.
- **Status.** `secondary`.

---

## 4. Max, Live and output

### cento (`nnokes/cento`), the user's earlier project
- **What we take from it.** The whole architecture:
  - a pure-JS engine with thin `[v8]` wrappers
  - single-file bundles with no runtime `require()`
  - everything Max loads lives in `patchers/`
  - "JS never schedules notes"
  - the simulated `[v8]` tests
  - generated patches checked in CI
  - the M0 spikes and the frozen-device test
- **Link.** <https://github.com/nnokes/cento> (see its `PLAN.md` and `docs/M0-spikes.md`)
- **Milestone.** M0 onward.
- **Status.** `read` (README, PLAN outline, M0 spikes, package.json).

### Cycling '74: `[v8]` and JavaScript in Max
- The `v8` object (Max 9) runs modern ECMAScript. The older `js` object uses JavaScript 1.8.5.
- `require()` in Max is CommonJS-like and resolves by name on the search path, not relative
  to the file. Forum reports show trouble with subdirectories. That is why we bundle.
- **Links:**
  - [Max documentation (home)](https://docs.cycling74.com/), the authority for anything
    about Max behavior
  - [v8 reference](https://docs.cycling74.com/reference/v8)
  - [JS require (legacy)](https://docs.cycling74.com/legacy/max8/vignettes/jsrequire)
  - [forum: relative paths](https://cycling74.com/forums/how-to-use-relative-paths-in-jss-new-require/)
- **Milestone.** M0.
- **Status.** `secondary`. M0 spike (a) settles it on a real machine.

### Ableton Live 12 tuning systems; Microtuner; MPE
- Live 12 loads `.scl` and `.ascl` tunings and **retunes notes with MPE pitch bend at ±48
  semitones**. A track can bypass the tuning. Microtuner is a Max for Live device that imports
  `.scl`.
- **What we take from it.** The ±48 MPE convention for `cg.mpe.out`, and the M9 interplay
  with Live's tuning.
- **Links:**
  - [Live 12 manual, Using Tuning Systems](https://www.ableton.com/en/live-manual/12/using-tuning-systems/)
  - [Tuning Systems FAQ](https://help.ableton.com/hc/en-us/articles/11535414344476)
  - [Microtuner](https://www.ableton.com/en/packs/microtuner/)
- **Milestone.** M0, M2, M9.

### ODDSound MTS-ESP
- A global tuning table that client plug-ins read, with free Max modules. The suite is paid
  software. **Stretch.**
- **Link.** [MusicTech coverage](https://musictech.com/news/aphex-twin-and-oddsound-mts-esp-plug-in-musical-tuning/)

### bach: automated composer's helper (Agostini and Ghisi), a Max package
- `bach.roll` and `bach.score` display microtonal notation in Max. **This is an optional view
  in M10**, not a dependency, because it installs outside the repo.

---

## 5. Still to find or read

- [x] Mann, *The Study of Fugue*: the canon chapter (Albrechtsberger, pp. 213–261), read from
      the user's chapter PDF.
- [x] Tymoczko, *A Geometry of Music*: closed. Three uploads failed, so we moved on with
      secondary sources (§3a chapter notes) plus the 2010 *MTO* response (read). If the book
      becomes available, checking chapters 2–5 is optional.
- [ ] Transcribe Mann Ex. 201 (p. 228) and Ex. 239–240 (p. 261) as answer-finder golden tests
      for M3.
- [ ] The Max documentation pages for M0. docs.cycling74.com is blocked by this cloud
      environment's network policy, so read them locally, or allow the domain.
- [ ] Levy (2013) and Jarvlepp (1982): the exact Ligeti rules and subdivisions, before M8.
- [ ] Schottstaedt STAN-M-19: the penalty table, before M4.
- [ ] Nemire (2014): check the convergence formula, before M6.
- [ ] Tenney *Spectral CANON*: entry offsets and the duration series, before M7.
- [ ] A canon-specific constraint paper. Searches found none dedicated to canons beyond the
      Strasheela example. Try "canon constraint satisfaction", "puzzle canon solver" and
      "Bach canon computational".
