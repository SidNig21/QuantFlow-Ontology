# Golden Baseline G2 — Semantic Reader Round 1

status: **NO / NO — SEVEN ORDER DEFECTS LANDED**
reader-task: `01a0371d-ab6a-7f72-b6a4-a680a64e5fcc`
reviewed-order-sha: `8b0ace36277c710c2629091878fba22335f1c084`
reviewed-file: `docs/orders/WO-GOLDEN-G2.md`

## Reader verdict

1. Can every acceptance gate actually fail on the defect it names? **NO**
2. Does every deliverable have exactly one meaning? **NO**

All eleven frozen target hashes matched. The Reader named seven finite order
defects; no repository/product defect was diagnosed and no Builder was opened.

## Defects and landed corrections

1. D1 retained an A2A coverage condition after deleting A2A. The order now
   explicitly removes `sawA2a`, keeps the main-file floor, and requires
   `sawHost === true`.
2. D2 allowed raw substring checks. It now names two exact current consumers and
   requires comment-stripped named imports plus calls of imported names, followed
   by the real Electron build.
3. Falsifier 42 could remain green through other anchors. It now requires the
   exact `dock-production-inventory.ts` importer edge in the Atlas row.
4. Falsifier 43 used an already-reachable product file. It now creates an
   isolated two-file, tree-neutral fixture and requires the subject to remain
   exactly `unreachable`.
5. Build/package and process censuses lacked commands and denominators. The order
   now carries exact PowerShell assertions and reuses the accepted G1 process
   definition verbatim.
6. D4 did not name the current receipts replacing the obsolete R13 wrapper. It
   now binds Mission admission, market lineage, governed review, and pure
   research-world projection to four exact focused commands.
7. The Atlas causal-diff condition was qualitative. It is now a finite path-keyed
   before/after table with exact allowed row and importer-edge changes.

The corrected order requires a full re-read and `YES/YES`. This receipt does not
authorize implementation or change `NEXT.md`.
