# Phase 3 pre-R18 continuation sequencing amendment — 2026-08-30

This proposed one-file P13/P16 amendment makes the pre-R18 consumer observe the already-scheduled production continuation instead of invoking a second fixture review.

status: **FRESH READER RECHECK REQUIRED / BUILDER CLOSED / ONE GATE FILE ONLY IF ACCEPTED**

- defect Reader task: `01a05212-f0e4-7101-a0d9-8e59df8a3f08`
- defect verdict at source: **YES / YES — finite one-file gate sequencing correction**
- source commit: `513cc25722bdcadbe9b0635b155489bc4d400ca8`
- source tree: `022b19eae8a837ae8e822a7284c8bd8bd7b52d71`
- sole parent: `f9e7dccbd01b3bd14f7c4830798699a9ea982bc1`
- amendment approval: **PENDING — a fresh Reader must recheck this exact amendment commit before any Builder**

The defect verdict bounds the amendment but cannot approve it. This commit changes authority/evidence only and authorizes no executable mutation.

## Proposed exact one-file correction

If a fresh Reader accepts this amendment and a later receipt/rotation opens it, the sole editable executable path is `qa/gates/pre-r18-coherence.ts`. `qa/oracles/r17-technique-outcome.json` remains byte-immutable.

The gate retains its initial `r17_technique` Dataset/Technique fixture load. After the production Run exists, it removes only the later `visible_world` fixture-review call and does not initiate another review. It waits for exactly one already-scheduled production continuation to reach one terminal review Task, one Evaluation, one findings Artifact, and one current Report. It binds the dynamically observed exact executor, critic, review Task, Evaluation, findings Artifact, and current Report identities into the existing unchanged literal oracle.

After complete terminal continuation, the gate reveals and asserts the exact 15-object/17-link world. It retains the accepted pointer path: select the exact Run-result Artifact, open Dock `INSPECT`, operate the existing outcome row through IPC to Kernel settlement, and assert settlement alone yields the exact 17-object/21-link world. After any projection refresh and again after reopen, the gate must reselect the exact Run-result Artifact before making Dock Inspect or outcome-control assertions.

No oracle byte, object/link meaning, identity relationship, fixture Dataset/Technique meaning, product behavior, IPC, Kernel settlement, projection, lifecycle, review/publication, timing contract, or reopen meaning changes.

## Mandatory fail-capable baits

1. Reintroduce the later `visible_world` fixture-review call: RED because the second review expands the world to 21 objects/29 links instead of the exact one-continuation 15/17 journey.
2. Suppress or incompletely await production continuation: RED when the one review Task is nonterminal or its exact Evaluation, findings Artifact, or current Report is missing.
3. Bind a wrong executor, critic, Task, Evaluation, findings, or Report identity: RED on the unchanged literal oracle's exact object/link identity comparison.
4. Move the settlement IPC call before complete terminal continuation observation: RED on gate sequencing; no product early-refusal claim is made.
5. Omit exact Run-result reselection after refresh or reopen: RED because Dock Inspect/outcome assertions are not bound to the exact result selection.
6. Restore the positive path: initial Dataset/Technique fixture load only; one complete production continuation dynamically bound; exact 15/17 revealed; exact result selected into Dock Inspect; settlement through IPC/Kernel adds only Ticket, grade Artifact, and four grade links to 17/21; exact result is reselected after refresh and reopen; all unchanged oracle, identity, review/publication, conflict, zero-delta, persistence, geometry, and cleanup assertions GREEN.

## Preserved authority and stops

All product files and the oracle file remain unchanged. The accepted lifecycle, lineage, Run-result field ownership/outcome control, production-continuation semantics, and current oracle hash pin remain binding. No filtering, count weakening, fallback identity, second review, synthetic replacement, sleep-as-proof, or assertion relaxation is authorized.

P14-A parser/selection mutation remains closed and its measurement remains pending. P15 is not repaired or closed by this amendment. P18/candidate freeze, independent Verifier acceptance, Golden designation, `main`, every remote ref, and R18 remain closed. No candidate is permitted until P01-P17 are green. Any second executable path or changed meaning stops for new authority.
