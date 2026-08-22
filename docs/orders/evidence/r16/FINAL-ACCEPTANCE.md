# R16 final acceptance — visible research world

**Result: PASS. R16 is complete.**

Date: 2026-08-22

Branch: `wo-R16`

Accepted candidate: `ca59628a334cc3da0060204b7685017fa381dc44`

Remote: `origin/wo-R16` matched the candidate at acceptance

Build timestamp: `2026-08-22T15:38:39.9891161Z`

## What the product now proves

One normal Guided Research Mission completed the real Research Director,
specialist worker, deterministic Run/result Artifact, independent Hermes
critic, numeric Evaluation, and gated Report path. The accepted Mission is
`mission-b69ba872-fd46-4a2b-a8fd-557c64aa2a4d`.

Its durable identities are:

- Director `ad9595f2-4751-4b27-9609-ec552d74c27e`;
- worker `3f6a9c2e-7b1d-4e5a-8f3c-1d2b4a6c8e0f`;
- source Task `task-e227bb5a-aa0c-493d-b32d-c07a30d0c347`;
- Run `run-d4230f95-8f4c-4ed7-9659-6f8a0a12f133`;
- critic `critic-f3bdbb80-d814-44a2-883a-cd2cc82e5ef9`;
- review Task `review-task-2bb0f1c1-7e31-4298-92e3-102892567fa7`;
- Evaluation `01636718-c243-4142-878e-0f1a0977a7e3`, verdict `supports`;
- gated Report `07cd1de85128e56e07eb73851c54619c07c32a00fa7844406aeb4e3d47925a4b`.

The critic's broker ledger contains exactly four successful governed
invocations in order: `qf_hypothesis_get`, `qf_run_get`, `qf_artifact_get`, and
`qf_record_evaluation`. The review Task completed rather than remaining a
running terminal-only review.

## Final layout defect and repair

The first normal consumer reveal found a real product defect: the completed
Mission reused a Dataset and result Artifact whose saved canvas coordinates
were far below the new Mission. The malformed-layout detector required four
already-present research tiles, so the two shared objects escaped repacking and
the viewport compressed the whole world into a tiny vertical strip.

Candidate `ca59628a334cc3da0060204b7685017fa381dc44` lowers the detector's
minimum meaningful comparison from four research tiles to two and adds the
exact saved-coordinate regression. One tile alone remains untouched. It changes
no ontology selection, cable projection, inspector contract, or terminal
surface.

## Independent verification

Fresh Luna Verifier `r16_layout_repack_verifier` returned PASS at the exact
candidate without editing it:

```text
bun test collab-electron/src/windows/shell/src/research-world.test.ts
8 pass / 0 fail / 37 expect calls

bun qa/run.ts research-world-visible
pointer_tiles=10 inspect=10 collapse=10
oracle_tiles=13 oracle_cables=15 dom_tiles=13 dom_cables=15
roots_remaining=0 leaked=[]
PASS research-world-visible

bun qf-atlas/generate.mjs --check
current — 433 files, 124 channels, 13 strip candidates

bun qf-atlas/ratchet.mjs
HARD RED: 0

bun qa/run.ts kernel-sole-writer-app
PASS kernel-sole-writer-app

git diff --check
exit 0
```

HEAD, the five candidate/generated file hashes, and the clean tree were
unchanged before and after verification. The Verifier specifically confirmed
that one saved research tile does not trigger repositioning while two distant
shared members do.

## Founder-visible normal application check

Computer Use opened the normal application from the identity-bound build. The
masthead displayed the exact candidate and timestamp above. The same completed
Mission reopened as a readable three-lane world containing the three real
sessions and ten inspectable research objects. The Dataset inspector opened by
pointer and displayed its durable id, kind, `as_of`, content hash, coverage,
and source Artifact payload. The isolated production gate independently opened
and collapsed all ten inspectors by pointer and counted the exact 13 objects
and 15 semantic cables.

The app was closed through its visible window control, relaunched against the
same canonical Kernel, and displayed the same Mission, object ids, Evaluation,
Report, and readable world. The final visible masthead again matched the exact
candidate and timestamp. Final ordinary shutdown reported:

```text
owned_processes_remaining=0
```

The founder-authorized single live Hermes terminal canary had already passed
on candidate `1dc2298`: mouse focus, keyboard text, erase without submission,
and pointer return to canvas. `git diff --name-only 1dc2298 ca59628` contains no
terminal, xterm, or PTY path, so the accepted layout-only tail does not invalidate
that receipt.

## Acceptance

Ryan can open a completed Mission and understand its question, ownership,
Dataset, deterministic execution, evidence, independent review, and gated
publication without reading terminal logs or a database. The world survives a
normal close/reopen and shuts down cleanly. R16 is accepted and complete.
