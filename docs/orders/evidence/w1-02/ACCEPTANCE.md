# W1-02 acceptance — UFC historical evidence and transparent calculation

status: ACCEPTED
candidate: `f9b11bd1d6df38d2e109456c2f1f2c2969a7de19`
date: 2026-09-06
branch: `codex/wo-wave1-evidence-computation`

## Founder-readable result

Ryan can take an exact live Bovada UFC market already on the QuantFlow desk, add trustworthy
pre-fight historical evidence, and run one transparent calculation over that evidence. The result
shows its inputs, arithmetic, cutoff, sample size, and limitation; it remains explicitly raw and
unreviewed rather than pretending to be a betting recommendation.

## Authority and independent verification

- Original semantic Reader: `01a079c3-c79e-7940-bbf6-7b6d21a71827`, `YES/YES` on amended order
  `0036c18b64ce57ef80963c6aac91dce4a4ea22ae`.
- Founder-walkthrough amendment Reader: `01a07a59-3c0d-7000-8f6a-12633ee3af93`, conditional
  `YES/YES` after the exact manual-TIDY finding was narrowed in `70a17914`.
- Builder: `01a079d0-da3e-7d32-ab99-c8588f7d1cca`.
- Fresh independent Verifier: `01a07a70-b286-7d00-a187-abf39900ea9f`.
- Verifier verdict: `YES/YES` on exact clean candidate `f9b11bd1d6df38d2e109456c2f1f2c2969a7de19`.

Independent evidence:

- Legacy publication shape: reproduced the pre-repair `no such column: authority_key` failure;
  normal Kernel open then migrated before projection, succeeded twice, and created zero false
  publications.
- Governed Report authority: 7 tests passed, including atomic migration refusal and publication
  partition controls.
- TIDY comparison over the same 12 completed-world tiles: old fit `0.393296`; repaired fit `0.6`;
  zero overlaps in both cases.
- Raw-result Inspect comparison: the old candidate omitted the calculation facts; the repaired
  candidate displayed both fighters, observed prices, normalized market probabilities,
  source-listed records, counts/fractions, cutoff, and limitation.
- Focused suites: 50 passed, 0 failed.
- `bun qa/run.ts wave1-evidence-computation`: PASS.
- `bun qa/run.ts typecheck`: PASS after transient frozen-install environment failures.
- Atlas check and ratchet: current, hard red 0, no W1-01 architectural change.
- `bun qa/run.ts golden-g12-package-operations`: six stages PASS; installer and cold boot used the
  exact candidate and reconstructed the same state. Run `4e9377fb-54bb-49c7-a31d-933c55f20dfd`.
- Verifier cleanup: processes `0`, roots remaining `0`, leaked `[]`.

## Router-owned packaged-app check

The Architect used native Computer Use against the exact packaged candidate with the preserved,
isolated Fiorot–Grasso Kernel and Artifact roots. All product observations came from the rendered
QuantFlow window.

1. The packaged footer displayed exact build
   `f9b11bd1d6df38d2e109456c2f1f2c2969a7de19`.
2. Reopen reconstructed the real Fiorot–Grasso Mission, Bovada Quote, historical Dataset,
   transparent Run, raw Artifacts, and calculated Result Set from Kernel truth.
3. A pointer click on TIDY reported `Tidied 12 tiles`; every object remained present and visibly
   non-overlapping at the repaired readable scale.
4. A pointer click on the real Result Set opened INSPECT. It visibly showed Manon Fiorot and Alexa
   Grasso, their observed prices, normalized market probabilities, source-listed records, sample
   sizes/fractions, cutoff, and the limitation that descriptive history is not an estimated win
   probability.
5. The surface continued to state `RAW RESULT — NOT REVIEWED`, with no Evaluation or current Report
   invented.
6. Back-to-world navigation worked. Normal window close left zero QuantFlow/Electron processes.

The Router pass reused the persisted real observation and calculation. It did not claim a second
live acquisition, Critic review, recommendation, closing price, outcome, or provider inference.

## Diagnostic isolation incident

The first pre-repair Computer Use launch set isolated app and Artifact paths but accidentally omitted
`QF_KERNEL_DB`. QuantFlow therefore opened the founder's default Kernel at
`C:\Users\rybow\.quantflow\kernel.db`. The visible `Research this market` action reached the legacy
projection failure and may have changed founder state before that failure. No before-hash exists, so
the exact delta cannot be proven; the default Kernel was not altered or deleted during later proof.
This run is diagnostic evidence only and does not satisfy acceptance.

## Cleanup receipt

No QuantFlow/Electron process was running. Before deletion, the two disposable Router proof roots were:

| Literal path | Files | Bytes | Kernel SHA-256 |
| --- | ---: | ---: | --- |
| `C:\tmp\qf-w1-02-founder-d3173371` | 77 | 3,914,020 | absent; this launch fell back to founder state |
| `C:\tmp\qf-w1-02-founder-clean-d3173371` | 87 | 4,385,519 | `A937940D506BC201E6C281DB8E6AE76B407E13A32AC55FEA8C56BA6A02B55B03` |

After Ryan explicitly approved both exact paths, each was deleted by literal path. `Test-Path` returned
`False` for both. The deleted disposable roots are not recoverable; the durable acceptance evidence is
this receipt, the candidate history, the Verifier transcript, and the Router Computer Use transcript.

## Accepted limits and next ownership

W1-02 ships evidence acquisition and one descriptive calculation. It does not claim independent
Critic judgment, a predictive probability or edge, CANDIDATE/WATCH/PASS, closing-line capture,
outcome grading, a second runtime, or a complete useful betting loop. Those limits remain explicit;
no next slice is authorized by this receipt.
