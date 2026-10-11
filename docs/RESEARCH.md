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

### Alfred Mann, *The Study of Fugue* (Rutgers UP, 1958; Norton/Dover reprints)
- **What it is.** A history of fugal theory, with translations of the fugue chapters of Fux
  and passages from Marpurg, Albrechtsberger and Martini. Older theory treats canon as the
  strictest form of imitation (*fuga ligata*).
- **What we take from it.** The canon and fugue terms, the historical methods of writing a
  canon (the dux–comes chain behind §3.5), and invertible counterpoint for later work.
- **Link.** <https://archive.org/details/studyoffugue00mann>
- **Milestone.** M5, M6.
- **Status.** `secondary`. archive.org was unreachable from the build environment.

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

- [ ] The **second PDF** and **Mann's book**. The user sent both, but neither reached the
      build environment. Re-attach them.
- [ ] The Max documentation pages for M0. docs.cycling74.com is blocked by this cloud
      environment's network policy, so read them locally, or allow the domain.
- [ ] Mann, *The Study of Fugue*: the canon sections (needs a connection that can reach
      archive.org).
- [ ] Levy (2013) and Jarvlepp (1982): the exact Ligeti rules and subdivisions, before M8.
- [ ] Schottstaedt STAN-M-19: the penalty table, before M4.
- [ ] Nemire (2014): check the convergence formula, before M6.
- [ ] Tenney *Spectral CANON*: entry offsets and the duration series, before M7.
- [ ] A canon-specific constraint paper. Searches found none dedicated to canons beyond the
      Strasheela example. Try "canon constraint satisfaction", "puzzle canon solver" and
      "Bach canon computational".
