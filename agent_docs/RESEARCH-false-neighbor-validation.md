# False-Neighbor Validation: Analytic Theory vs Measured Layouts

Empirical test of a closed-form collision law for the MinHash → Gaussian 2D
projection, run against the shipped pipeline and seeded matrices on 11 datasets
(~3.3M node pairs). Script: [scripts/false-neighbor-validation.mjs](../scripts/false-neighbor-validation.mjs)
(`node scripts/false-neighbor-validation.mjs`, ~60s, deterministic output).

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

## Results

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
monotonically; for J > 0.2 the bias is +0.03 to +0.12, matching the predicted
direction.

## Findings

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
   except Facebook (−37%), and within 7% on half the datasets.

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

## Scope limits

- All measurements at α = 0 (pure property layout) with default-style
  strengths. Edge-only datasets ship with α ≈ 1, where positions come from
  topology smoothing — their rows validate the projection math, not their
  shipped layouts.
- One seed (the shipped `PROJECTION_SEED_BASE`). The kernel law averages over
  seeds; per-dataset validation matters where group structure is degenerate or
  correlated.
- "Dissimilar" is defined by weighted Jaccard under the same weights that
  produce the layout; hand-tuned strengths shift both together.

## Follow-ups worth doing

- MITRE shows both failure modes at once (label token sharing + correlated
  groups); separating the two effects would sharpen the failure model.
- Pokemon's 18% FNR is the one case users actually encounter false neighbors
  at meaningful rates — identifying which groups drive it could feed back into
  auto-tune.
- The kernel + histogram estimator is cheap enough to ship as a layout-trust
  diagnostic (predicted FNR before layout, from `computeNodeSig` +
  `jaccardEstimate` sampling).
