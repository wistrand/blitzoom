# False-Neighbor Validation: Analytic Theory vs Measured Layouts

Empirical test of a closed-form collision law for the MinHash → Gaussian 2D
projection, run against the shipped pipeline and seeded matrices on 11 datasets
(~2.9M node pairs), followed by a diagnosis of the largest measured
false-neighbor rate (Pokemon, 18%), a validated fix (per-group seed search,
−45% to −95% FNR on affected datasets), and a 51-seed sweep showing the blend
kernel law holds in expectation over seeds while single-seed calibration
co-moves with anchor collision mass (Part 4).

Scripts (each runs under Node or `deno run --allow-read`, deterministic output):

| Script                                                                             | What it does                                                        |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| [false-neighbor-validation.mjs](../scripts/false-neighbor-validation.mjs)          | Kernel-law validation across 11 datasets (~60s)                     |
| [false-neighbor-pokemon.mjs](../scripts/false-neighbor-pokemon.mjs)                | Pokemon FNR anatomy, auto-tune/bearings interaction, seed fix (~2m) |
| [false-neighbor-seed-sweep.mjs](../scripts/false-neighbor-seed-sweep.mjs)          | Seed search across 7 property datasets, with controls (~2m)         |
| [false-neighbor-mitre-reseed.mjs](../scripts/false-neighbor-mitre-reseed.mjs)      | Reseeding vs blend calibration, 51-seed co-movement (~2m)           |

This addresses two open items from [SPEC.md](SPEC.md): the "no direct geometric
justification" hedge on treating MinHash signatures as vectors, and the
semantic-neighborhood-preservation entry under open validation questions.

## The theory under test

Per property group (k = 128): after z-scoring, a signature u has ‖u‖² = k
exactly. For a pair with signature correlation r = ⟨u,v⟩/k, the difference
‖u−v‖² = 2k(1−r). Averaged over Gaussian projection randomness, the projected
pair difference is 2D Gaussian with per-coordinate variance s² = 2k(1−r), so:

- **Kernel law**: t = d²/s² follows χ²₂ (CDF 1 − e^{−t/2}), and
  P(d ≤ ε) = 1 − exp(−ε²/(2s²)).
- **Blend extension** (α = 0, independent per-group matrices):
  s² = Σ_g (w_g/W)² · s²_g, same χ²₂ law. Empty-group cases: both empty → 0,
  one empty → k.
- **Bridge**: E[r] ≈ J (exact token Jaccard), with slight positive bias
  (mismatched MinHash components over overlapping sets are positively
  correlated).
- **Semi-analytic false-neighbor rate**: integrate the kernel against the
  dataset's pairwise-similarity histogram —
  FNR(ε) = Σ_{dissimilar} P(d ≤ ε) / Σ_{all} P(d ≤ ε).

Caveats built into the theory: the law averages over projection randomness but
BlitZoom uses one fixed seed (valid only if pair-difference directions are
diverse enough to self-average), and the blend extension assumes cross-group
independence.

## Method

For each dataset: run `runPipeline`, reconstruct every node's per-group token
sets and z-scored signatures, and verify the reconstruction reproduces the
shipped `projBuf` exactly (max delta 0.0 on all 11 datasets — the test
exercises the real algorithm, not a reimplementation). Then over all pairs
(sampled above 400K): measure t against χ²₂ for a single high-entropy group
(`label`) and for the blended position (α = 0, `group`-dominant default-style
strengths via `computeEffectiveWeights`); bin measured r against exact Jaccard;
count pairs within ε = c·σ_layout vs kernel-predicted counts; and compare
empirical vs semi-analytic FNR with "dissimilar" = weighted Jaccard < 0.10.
Amazon is node-subsampled to 15K (pair statistics need a representative node
set, not the full graph).

## Part 1: Kernel-law validation across 11 datasets

KS = Kolmogorov-Smirnov distance of t against the χ²₂ CDF (descriptive; pairs
are not independent). Calibration and FNR at ε = 0.1·σ_layout.

| Dataset         | Regime           |  Pairs | KS label | KS blend | In-ε actual vs predicted | FNR emp. | FNR semi-analytic |
| --------------- | ---------------- | -----: | -------: | -------: | ------------------------ | -------: | ----------------: |
| Epstein         | edge types       |   132K |    0.020 |    0.071 | 2,525 vs 3,113           |     0.1% |              3.1% |
| Pokemon         | rich props       |   459K |    0.028 |    0.028 | 1,731 vs 1,757           |    18.3% |             16.4% |
| MITRE ATT&CK    | rich props       |   387K |    0.140 |    0.256 | 5,594 vs 5,446           |        — |                 — |
| Marvel          | categorical      |    53K |    0.023 |    0.162 | 1,004 vs 1,000           |     0.9% |              0.6% |
| Porsche         | numeric          |    44K |    0.030 |    0.058 | 315 vs 324               |     9.8% |              7.4% |
| Synth Packages  | rich             |   400K |    0.008 |    0.183 | 3,547 vs 3,953           |     6.9% |             16.9% |
| BlitZoom Source | mixed            |   273K |    0.064 |    0.080 | 1,883 vs 2,453           |     3.7% |              3.4% |
| Karate          | edge-only        |    561 |    0.063 |    0.181 | 18 vs 25                 |     0.0% |              0.3% |
| Power Grid      | edge-only        |   394K |    0.050 |    0.077 | 1,050 vs 1,284           |        — |                 — |
| Facebook        | edge-only, dense |   388K |    0.043 |    0.166 | 1,032 vs 645             |        — |                 — |
| Amazon (15K/367K) | large scale    |   399K |    0.045 |    0.129 | 21,708 vs 23,181         |     0.0% |              1.1% |

Dashes: the τ = 0.10 dissimilarity threshold is vacuous — universally shared
baseline tokens (`leaf:false`, single-valued `group`) keep every pair's
weighted Jaccard above τ, so no pair counts as dissimilar.

Bridge check (label group, all datasets): measured r tracks exact Jaccard
monotonically (up to n=1 bins); the bias is positive for J ≳ 0.3 on every
dataset, matching the predicted direction, but its magnitude varies more than
a single range — Synth's dominant J∈[0.2,0.3) bin is only +0.006, Epstein's
is −0.009, and Marvel peaks at +0.166.

### Findings

1. **The single-group kernel law holds.** 10 of 11 datasets have KS ≤ 0.065,
   including edge-only graphs and the Amazon sample. Synth Packages, whose
   labels are near-random strings, is almost exact (KS 0.008) — the law is
   tightest exactly when pair-difference directions are most diverse, as the
   fixed-seed caveat predicts. The one outlier is MITRE (KS 0.140, mean t 2.84
   vs 2.0): heavy token sharing across technique names concentrates difference
   vectors into a low-dimensional subspace where one fixed matrix does not
   self-average. The SPEC's "empirical observation rather than a proven
   property" hedge can be sharpened: the projection obeys a quantitative,
   now-validated collision law with a characterized failure condition.

2. **The blend independence assumption is the fragile layer.** Blend-level
   deviations go in both directions — MITRE and Facebook come out narrower
   than predicted (mean t 1.08 and 1.29), Marvel and Synth wider (2.70 and
   2.93). Two-sided deviation is the signature of un-cancelled cross-group
   correlation terms under a fixed seed draw (correlated groups: MITRE's
   subtype/killchain/platforms, Marvel's five character attributes; degenerate
   groups: Facebook's two effective signals), not of a systematic modeling
   bias. Despite this, small-ε collision counts stay within ~25% everywhere
   except Facebook (−37%), and within 7% on half the datasets. (Part 4
   revises the attribution: the dominant driver of the two-sided scatter is
   the group-anchor draw itself, with cross-group correlation second-order.)

3. **Measured false-neighbor rates are low.** 0–18.3% across all informative
   datasets; only Pokemon exceeds 10%. Amazon — the scale where a
   birthday-problem argument predicts the worst — measures 0.0% with 41% of
   pairs dissimilar. The generic "2D is too few dimensions" pessimism assumes
   dissimilar pairs are placed indifferently; in practice the blend separates
   them beyond what their similarity statistics alone require.

4. **The semi-analytic FNR estimator is usable, and conservative when wrong.**
   Within ~2.5 percentage points of truth on 6 of 8 informative datasets. Its
   two misses (Epstein: predicts 3.1% vs 0.1% actual; Synth: 16.9% vs 6.9%)
   both over-predict. A cheap, similarity-histogram-only upper bound on layout
   error is a property none of the comparison baselines (ForceAtlas2, t-SNE,
   UMAP) offer.

### Scope limits

- All measurements at α = 0 (pure property layout) with default-style
  strengths. Edge-only datasets ship with α ≈ 1, where positions come from
  topology smoothing — their rows validate the projection math, not their
  shipped layouts.
- One seed (the shipped `PROJECTION_SEED_BASE`). The kernel law averages over
  seeds; per-dataset validation matters where group structure is degenerate or
  correlated.
- "Dissimilar" is defined by weighted Jaccard under the same weights that
  produce the layout; hand-tuned strengths shift both together.

## Part 2: Anatomy of Pokemon's 18% FNR

Script: [false-neighbor-pokemon.mjs](../scripts/false-neighbor-pokemon.mjs).
Pokemon's `group` column is the primary type — 18 categories. A category is a
single token, so every member shares one signature and projects to exactly one
**anchor point**. The default layout (`group:3` dominant) is 18 fixed anchors
with floor-weighted jitter, and the shipped seed dealt a bad draw:

| Closest anchor pairs (median distance 21.5) | Observed false pairs within ε |
| ------------------------------------------- | ----------------------------- |
| Psychic × Dragon: 1.52                      | Psychic × Water: 69           |
| Fighting × Poison: 1.88                     | Dragon × Water: 46            |
| Water × Dragon: 4.11                        | Bug × Fire: 23                |
| Fire × Psychic: 4.23                        | Dragon × Psychic: 23          |
| Grass × Bug: 4.33                           | Bug × Grass: 16               |

Every top false-pair combo is a closest-anchor pair, with counts scaled by
population product (Water has 127 nodes). This is the analytic capacity bound
realized: C anchors drawn from an isotropic 2D Gaussian have a close-pair
tail, and the entire FNR lives in it.

### Why auto-tune cannot see it

Headless `autoTuneStrengths` picks generation-solo 8 (α=0) — FNR 19.1%, no
better than default's 18.3%. Two structural reasons:

- **The purity term is single-group.** Purity is scored only for the dominant
  weighted group. Under a generation-dominant config, a cell mixing Water and
  Psychic is "pure" if the members share a generation — type-mixing is
  invisible to the objective.
- **Bearings never engage, and could not help.** `autoTuneBearings` returns
  `{}` for solo-strength configs (its entry guard requires ≥2 groups with
  strength > 0), and a bearing rotates a group's anchor set rigidly — within-
  group anchor collisions are invariant under any rotation.

The semi-analytic kernel FNR ranks all tested configs in the same order as the
empirical rate (predicted 16.4 / 18.0 / 21.0 / 26.5 vs empirical 18.3 / 19.1 /
22.3 / 26.7 for default / generation-solo / group+generation / equal-3), so it
is usable as an objective ingredient.

### The fix: seed search

Anchor placement is one draw of the seeded PRNG. Scoring 50 candidate seeds for
the `group` matrix by analytic collision mass —
`Σ pop_a·pop_b·exp(−(D_ab·w)²/(2σ²_floor))`, O(C²) per seed, microseconds —
and re-projecting with the winner:

| Config                            | FNR   |
| --------------------------------- | ----- |
| default, shipped seed             | 18.3% |
| auto-tune's choice (generation-8) | 19.1% |
| default, reseeded group matrix    | 10.0% |

The kernel could not predict this improvement (it sees signature correlations,
not anchor geometry) — the collision-mass score is the seed-aware complement to
the seed-blind kernel.

## Part 3: Seed search across datasets

Script: [false-neighbor-seed-sweep.mjs](../scripts/false-neighbor-seed-sweep.mjs).
Default-style weights, FNR at ε = 0.1σ, best of 50 candidate seeds by
collision mass:

| Dataset         | C (group) | Collision mass shipped → best | FNR shipped → reseeded | Layout σ    |
| --------------- | --------: | ----------------------------- | ---------------------- | ----------- |
| Pokemon         |        18 | 55K → 21K (38%)               | 18.3% → 10.0%          | 4.4 → 6.4   |
| Porsche         |        13 | 4.3K → 0.6K (13%)             | 9.8% → 0.5%            | 4.1 → 6.2   |
| Marvel          |         7 | 2.1K → 0.2K (8%)              | 0.9% → 0.0%            | 6.2 → 7.2   |
| Epstein         |         5 | 1.0K → ~0 (0%)                | 0.1% → 0.0%            | 6.0 → 11.3  |
| Synth Packages  |        12 | 60K → 33K (55%)               | 7.4% → 4.3%            | 8.1 → 7.5   |
| BlitZoom Source |        66 | 48K → 28K (58%)               | 3.7% → 3.6%            | 5.9 → 6.9   |
| MITRE ATT&CK    |        14 | 1.83M → 96K (5%)              | 0% → 0% (vacuous τ)    | 3.6 → 7.3   |

Shipped FNR values can differ slightly from Part 1 (Synth: 7.4% here vs 6.9%
there) — the two scripts stride pairs at different budgets (500K vs 400K), so
they sample different pair subsets of the same layout.

- **The fix generalizes.** Porsche's FNR is nearly eliminated (9.8% → 0.5%);
  every dataset with a meaningful rate improved. Controls pass: Marvel and
  Epstein went to zero, nothing got worse (Synth's σ dipped 8.1 → 7.5, the
  only observed cost).
- **The mechanism's boundary is cardinality.** BlitZoom Source (C = 66) did
  not move — with that many anchors, collision mass is diffuse and no seed can
  dodge it. Anchor collision dominates FNR when the dominant group is a
  low-cardinality categorical (roughly C ≤ 20), which is also the regime the
  strength defaults and auto-tune select most often.
- **MITRE's shipped seed is the worst draw in the corpus** (mass 1.83M, 30×
  Pokemon's); reseeding cuts it to 5% and doubles layout spread. Colliding
  anchors compress pairwise distances — the same direction as MITRE's blend
  anomaly in Part 1 (mean t = 1.08, distances ~√2 narrower than predicted).
  The two findings share a cause — confirmed in Part 4 via per-seed
  co-movement.

## Part 4: Reseeding vs blend calibration — the shared-cause test

Script: [false-neighbor-mitre-reseed.mjs](../scripts/false-neighbor-mitre-reseed.mjs).
Part 3 left a hypothesis: MITRE's blend anomaly (mean t = 1.08, KS 0.256) and
its worst-in-corpus collision mass share a cause. The originally proposed test
— re-run the blend validation with the reseeded group matrix and look for a KS
drop — turns out to be the wrong operationalization, in an instructive way:

| Dataset        | Shipped mean t / KS | Reseeded mean t / KS |
| -------------- | ------------------- | -------------------- |
| MITRE ATT&CK   | 1.08 / 0.256        | 3.22 / 0.287         |
| Pokemon        | 1.86 / 0.028        | 3.74 / 0.257         |
| Marvel         | 2.70 / 0.162        | 3.47 / 0.282         |
| Synth Packages | 2.93 / 0.183        | 2.56 / 0.128         |

Reseeding restores calibration nowhere — it flips every dataset to the wide
side, including breaking the one calibrated control (Pokemon, 0.028 → 0.257).
In hindsight this is forced: best-of-50 collision-mass selection picks a seed
whose anchors are *atypically spread*, and the kernel predicts distances for a
typical draw. Calibration cannot survive seed selection.

The correct test is co-movement across seeds. Precomputing the
seed-independent part of each pair's blend difference and sweeping all 51
candidate seeds:

| Dataset        | Mean t range | Grand mean (theory 2.000) | Spearman(log mass, mean t) |
| -------------- | ------------ | ------------------------- | -------------------------- |
| MITRE ATT&CK   | 0.92 – 3.73  | 2.057                     | −0.56                      |
| Pokemon        | 1.28 – 3.74  | 2.185                     | −0.85                      |
| Marvel         | 0.87 – 5.04  | 1.943                     | −0.68                      |
| Synth Packages | 0.90 – 3.89  | 2.059                     | −0.78                      |

- **Shared cause: confirmed.** Mean t anti-correlates with collision mass on
  every dataset (Spearman −0.56 to −0.85). MITRE's shipped seed sits at the
  bottom of its 51-seed range (1.08 in [0.92, 3.73]), exactly where its 1.83M
  collision mass predicts.
- **The blend kernel law holds in expectation over seeds.** Grand mean t is
  within 3–9% of 2.000 on all four datasets, while individual seeds scatter
  from 0.9 to 5.0. This sharpens finding 2: with a low-cardinality dominant
  group, C anchor points are far too few to self-average, so single-seed blend
  calibration is a draw from a wide distribution — the two-sided deviations
  across datasets are largely *where each dataset's shipped seed landed*, with
  cross-group correlation as a second-order effect.
- **FNR and calibration are in tension.** A low-collision seed is an atypical
  draw by construction, so under a reseeded matrix the kernel over-predicts
  collisions — which is exactly Part 2's residual (reseeded Pokemon:
  semi-analytic 16.5% vs empirical 10.0%). The semi-analytic estimator stays
  conservative under reseeding — the safe direction for a trust diagnostic.

## Recommendations for auto-tune

In order of value-per-effort, based on the measurements above:

1. **Per-group seed selection as a tuned parameter.** Score ~50 candidate
   seeds per categorical group by collision mass, keep winners in dataset
   settings / URL hash alongside strengths — determinism is preserved the same
   way strength settings preserve it. Demonstrated −45% to −95% FNR. Plumbing
   note: `normQuantize`/`radialQuantize` derive σ via `projNormSq(seed)`, so a
   per-group seed override must flow through there too.
   **Implemented**: `autoTuneProjSeeds` in blitzoom-utils.js (same candidate
   ladder and collision-mass score as the scripts here), applied by the viewer
   and `<bz-graph>` auto-tune flows; `projSeeds` constructor option /
   `setProjSeed` canvas API / `sd=` URL-hash param / `settings.projSeeds`
   dataset presets. See the "Projection seeds" entry in CLAUDE.md.
2. **Collision-mass term in the objective** — penalize configs whose dominant
   categorical group has high predicted collision mass (O(C²), free at tuner
   scale).
   **Attempted, not enabled.** The mechanism ships as an `opts.fnrPenalty`
   hook on `autoTuneStrengths` plus fixed-reference support in
   `createFNREstimator` (blitzoom-fnr.js), but the shipped callers do not
   pass it. Measured on this corpus with a gain-2 kernel penalty: Pokemon and
   Synth winners unchanged (their FNR excess is anchor-geometry, invisible to
   the seed-blind kernel — Part 4), and Porsche's winner degraded (empirical
   reference-FNR 3.0% → 8.8%). Two design traps documented on the hook: the
   dissimilarity reference must be config-independent (a candidate can hide
   mixing by down-weighting the group it mixes — the purity failure in
   Jaccard form), and per-config predicted σ diverges from measured σ per the
   Part 4 seed-draw scatter, which reorders config rankings. The post-tune
   seed search is the effective treatment for the same disease.
3. **Multi-group purity** — average purity over the cached categorical groups
   (or top-2 by weight) instead of only the dominant one, so type-mixing under
   a differently-dominated config costs score.
   **Implemented** (all cached categoricals, sqrt-purities averaged). On this
   corpus it changes no winner — the dilution across categoricals mutes the
   signal below the spread × CV gap — but it removes the blindness going
   forward and costs O(cached categoricals) per score.
4. **`autoTuneBearings` entry guard** — solo-strength configs (the tuner's
   most common winners) currently no-op silently; the guard should count
   effective groups or be removed.
   **Implemented** (guard removed; G ≥ 2 and N ≥ 4 remain). Solo configs now
   get bearings (e.g. Pokemon generation −44°), and the rotations measurably
   help: FNR at ε = 0.1σ drops 6.3% → 5.6% (Pokemon generation-solo) and
   0.4% → 0.0% (Marvel eye-solo) under a fixed similarity reference.

## Follow-ups worth doing

- MITRE also shows label-token sharing (single-group KS 0.140); that
  single-group effect is untouched by the Part 4 result (the label matrix was
  never reseeded) and remains the one unmodeled piece of the failure story.
- ~~The kernel + histogram estimator is cheap enough to ship as a layout-trust
  diagnostic.~~ **Shipped**: `createFNREstimator` in blitzoom-fnr.js (per-group
  signature reconstruction over a ~160-node sample, ~12.7K pairs, built in
  15-45ms, ~1ms per estimate; matches this doc's full-pair numbers within
  sampling noise — Epstein 3.1%, Synth 16.9%, MITRE vacuous). The viewer shows
  it in the algo-info line ("Est. false neighbors ~N% @0.1σ"), reports "n/a"
  when τ is vacuous, and suppresses it at α ≥ 0.75 where positions come from
  topology smoothing.
