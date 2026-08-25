# G2 Router Staging Correction

A Router docs-only commit accidentally included the eleven G2 deletions because
the stopped Builder had staged those deletions before returning the red receipt.

Recorded commits:

- 33605d95f7f30e2ca61eeba262bfd76eda1bd589 — accidental mixed commit.
- 9223522 — complete revert of that mixed commit.
- 4a06e5b1b583b2f58a8b8695abf2caf402cb5098 — docs-only amendment commit.
- 7465fb823531052447c873a005732af3caaecd07 — NEXT Builder hold.

The revert restored all eleven target paths. Their byte lengths and SHA-256
values exactly match the frozen manifest in WO-GOLDEN-G2. The Builder's
uncommitted proof, Atlas and evidence edits remain present. No product source
edit was lost or added.

The same Builder must re-delete the exact eleven targets after amendment Reader
YES/YES and NEXT reauthorization. The Vault archive is already complete and may
not be repeated.