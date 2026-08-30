# G11 Builder receipt — candidate awaiting independent verification

QuantFlow now has one truthful cold-start route and one byte-preserved historical plan location; no product, Kernel, Canvas, R18, package, or G12 behavior changed.

## Identity and authority

- `G11_AUTHORITY_PARENT`: `dc16169f1494d270388eda1c0b369bc0a0aaf73a`
- `G11_AUTHORITY_PARENT_TREE`: `0676258d6a78a0bbdb76cb1bd74e979f494eb370`
- replacement Reader task: `01a050eb-06dd-7450-978e-d684f0063538`, verdict `YES / YES`
- frozen denominator: `b1720c086bb2d93942448a3fdd352b7d58af9483` / tree `97b2768e3bc79d45c321336e73ec30167c6c8959`; 1,421 tracked paths
- candidate identity cannot be embedded in the commit whose bytes determine that identity; the Router/Verifier freezes the literal candidate commit and tree externally after this amend
- reproducible candidate commit command: `git rev-parse HEAD`
- reproducible candidate tree command: `git show -s --format=%T HEAD`
- reproducible first-parent command: `git rev-parse HEAD^`
- external freeze field: `candidate_commit` and `candidate_tree` in `docs/orders/evidence/golden-baseline/g11/VERIFIER-ACCEPTANCE-20260829.md`

## Exact changed paths

- `README.md` — current route wording
- `docs/orders/NEXT.md` — Reader YES/YES and bounded Builder candidate route
- `docs/orders/PROTOCOL.md` — role/authority wording
- `docs/orders/WO-GOLDEN-G11.md` — live reference rewritten to the archive destination
- `docs/plans/2026-08-16-001-feat-atlas-finish-line-plan.md` → `docs/history/plans/2026-08-16-001-feat-atlas-finish-line-plan.md` — `ARCHIVE_BYTE_EXACT`
- `qf-atlas/ATLAS.md` — exact authority-tree receipt wording only
- `qa/gates/golden-g11-authority.ts` and the registration in `qa/run.ts` — `G11_STATIC_VERIFIER_ONLY`
- this receipt and `G11-COMMAND-RECEIPTS-20260829.md` — G11 administration only

No B instrument, product package, Kernel/schema, Canvas, R18, existing gate assertion, dependency, lockfile, workflow, package lifecycle, PTY, process-root, shutdown, or relaunch path changed.

## Archive and immutable evidence

- destination SHA256: `05965A70032DDB6E96B986682FCD39A7EF6773F69F499E4FA1201C353EAB6202`, identical to the source row in `G11-ARCHIVE-MAP.tsv`
- all 380 tracked immutable rows are checked against working bytes; filesystem-denied evidence logs are checked against their frozen Git blob identities in `G11-CURRENT-DISPOSITION.tsv`
- external Phase-1 content address is checked separately from `G11-PHASE1-EXTERNAL.tsv`
- `.mcp.json` remains unchanged as `RETAIN_CURRENT_WORKFLOW`; all other B instruments remain `RETAIN_FAIL_CLOSED`

## Rollback proof

The archive map is unique, the original source is absent, the destination exists at the recorded hash, and the payload's intentional self-reference remains byte-exact. A normal inverse commit can therefore move that destination back to the sole source, restore modified A paths from `G11_AUTHORITY_PARENT`, and remove only candidate-created G11 receipt/static-verifier paths. The final verifier must compare the candidate's first parent/tree to the authority identity above; no reset, checkout-overwrite, rebase, or force-push is authorized.

## Inherited status

`G12 package/process status: RED — inherited; not exercised or repaired by G11`

`G10 owned-run final: processes=0 roots_remaining=0 leaked=[]`

Judgment: inaccessible immutable log files could not be hashed through the checkout ACL. The gate fails closed by requiring their exact frozen Git blob OIDs from the 1,421-row disposition manifest; readable immutable files still receive direct SHA256 comparison. This preserves the assertion without changing ACLs or evidence bytes.
