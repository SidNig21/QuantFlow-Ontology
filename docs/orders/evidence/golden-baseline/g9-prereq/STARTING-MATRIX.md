# G9 minimum prerequisite — frozen starting matrix

- source starting SHA: `615b347d6a8f9c7a5a1beca1f36ca87bcddc266a`
- product/source tree before matrix: clean
- paused G2 stash object: `4e4dac24187f54a7187e5e61ab0459acbe7cd3ed`
- paused G2 patch SHA-256: `5BFE74B5664C9C0C098DB0DA0224E3E05AE5F612754490C5DB1486BC106AD3BF`
- paused G2 manifest SHA-256: `55757E1F568EBAC4A17907A9233152D341EC17162D738C31627D181338FEA0BC`
- external preservation root: `C:\tmp\qf-g2-preserve-615b347`

## Matrix

| Command | Exit/result | Disposition |
|---|---:|---|
| `bun qa/run.ts artifact-root` | 1 | expected starting mechanical red: raw Bun cache copy `EPERM`; candidate may only delegate launcher install to accepted helper |
| accepted frozen package helper for ignored `packages/qf-kernel/node_modules` | 0 | operational recovery only; source tree unchanged |
| `bun qa/run.ts governed-review` | 0 / PASS | green |
| `bun qa/run.ts kernel-one-path` | 1 | pre-existing G8 proof-integrity red: 12 existing QA/test paths outside allowlist; prerequisite touches none |
| `bun qa/run.ts kernel-sole-writer` | 0 / PASS | green |
| `bun qf-atlas/generate.mjs --check` | 0 / current | 439 files, 126 channels, 13 strip candidates |
| `bun qf-atlas/falsify.mjs --receipt` | 0 / 98 of 98 | exact rerun; all injected source mutations restored |
| `bun qf-atlas/ratchet.mjs` | 0 | HARD RED 0; unexplained 0; undecided without blocker 0; AMBER 20 |

The first attempted matrix wrapper passed no Bun arguments and printed Bun help.
It is void and preserved only under the external temp root. The logs committed
with this receipt are the corrected direct-command receipts.

The first Atlas batch's parent wrapper ended before its child exit was captured.
The exact unchanged-source falsifier command was rerun through a live shell and
returned exit 0; that exact log and generated receipt are committed here.

## Pre-existing red ownership

The `kernel-one-path` red is outside this prerequisite's semantic and path
ownership. It names existing QA/test paths only and is assigned to G8's
proof-integrity work under ADR-0004. Candidate verification must reproduce the
same exact offender set or improve it only through an independently authorized
G8 change; this prerequisite may not edit the allowlist or offenders.

## Tree neutrality

Atlas temporary source fixtures were restored by the falsifier. The generated
`qf-atlas/falsifiers.json` receipt was copied into this evidence directory and
then restored to the starting SHA. No product/source diff remained before these
evidence files were added.
