# Phase 3 production-continuation sequencing amendment — 2026-08-30

This proposed gate-only amendment observes the one already-scheduled production review continuation instead of starting a duplicate review attempt.

status: **FRESH READER RECHECK REQUIRED / BUILDER CLOSED / TWO GATE-ORACLE FILES ONLY IF ACCEPTED**

- defect Reader task: `01a05212-f0e4-7101-a0d9-8e59df8a3f08`
- defect verdict at product source: **YES / YES — finite gate-only sequencing correction**
- product commit: `75515398d8e8357a73a18d636332653a02040036`
- product tree: `0ce5bb4d00bcf1bdfe2a8dbfa99b9c9e421d2033`
- sole parent: `a6292b3bf3c08f0481726169f95a1aa0ad5715a2`
- amendment approval: **PENDING — a fresh Reader must recheck this exact amendment commit before any Builder**

The defect verdict bounds the correction but does not approve this amendment. This commit changes documents/evidence only and authorizes no executable mutation.

## Proposed exact surface

If a fresh Reader accepts this amendment and a later receipt/rotation opens it, only these paths are editable:

- `qa/gates/technique-outcome-loop.ts`
- `qa/oracles/r17-technique-outcome.json`

No product file is editable. The gate must not initiate the fixture's second review after the production Run exists. It must wait for the already-scheduled production continuation to reach exactly one terminal review Task, exactly one Evaluation, exactly one findings Artifact, and exactly one current Report. It then binds those dynamically observed exact identities into the unchanged literal oracle structure.

The terminal pre-settlement world is exactly 15 objects and 17 links. Settlement alone adds exactly the Ticket, grade Artifact, and four grade links, producing exactly 17 objects and 21 links. The literal oracle remains exact across settlement and reopen; dynamic binding changes identity substitution, not membership meaning or acceptance strength.

R15 uniqueness remains exact per `(action_kind, source_task_id, attempt_id)`. Independent review and publication remain mandatory. The gate may not filter a duplicate, weaken counts, ignore an extra object/link, alter completion meaning, create a synthetic replacement, or substitute fixture review output for the scheduled production continuation.

## Required falsifiers

1. Initiate a second review attempt after the Run exists: the world expands and REDs on exact membership/cardinality and R15 attempt uniqueness.
2. Suppress or leave the scheduled continuation incomplete: RED because the single review Task is not terminal or its Evaluation, findings Artifact, or current Report is missing.
3. Bind any wrong dynamic Task, Evaluation, findings, or Report identity into the oracle: RED on exact literal identity/link comparison.
4. Submit settlement before the one production continuation is terminal and complete: RED before Ticket or grade mutation, with exact zero forbidden settlement delta.
5. Restore the one-attempt path: exactly one terminal review Task, Evaluation, findings Artifact, and current Report bind into the 15/17 oracle; settlement alone yields exact 17/21; exact identities, independent review/publication, conflicts, zero deltas, and reopen are GREEN.

## Preserved authority and stops

Product commit `75515398d8e8357a73a18d636332653a02040036` remains byte-immutable under this gate-only amendment. The accepted Run-result field ownership and Dock Inspect outcome-control behavior, earlier lifecycle/lineage repairs, and every existing settlement/oracle/conflict/reopen/zero-delta assertion remain binding.

P14-A parser/selection mutation remains closed and its safe measurement remains pending. P15 is not repaired or closed by this sequencing amendment. Any product edit, third path, filtered/ignored duplicate, count relaxation, synthetic review, changed R15 uniqueness, changed independent-review/publication meaning, R18 work, credential handling, or bet/trade behavior stops for new authority.

P18/candidate freeze, independent Verifier acceptance, Golden designation, `main`, every remote ref, and R18 remain closed. No candidate is permitted until P01-P17 are green. A separate receipt/rotation may open only the two listed files after a fresh Reader returns YES / YES against this amendment commit.
