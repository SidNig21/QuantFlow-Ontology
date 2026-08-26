# Golden Baseline G4 — Frozen starting evidence

status: **frozen before mutation**
build-base-sha: `dd1dcb7ef50248e46f4de5acb543ef7e7753a981`

starting-tree-sha: `010f3f0fa7a9a0d0593a6fa241864b3f844a6914`
branch: `wo-golden-g2`
upstream: `origin/wo-golden-g2`
protected-main: `5882ab2febf00f2c15a94c868c191420ed561bb4`
product-tree-clean-at-freeze: `true`
product-process-check: `zero`

The complete frozen descendant/hash census is in `RUNTIME-PROOF-BEFORE.tsv`.
The frozen current-package and route/profile censuses are in
`PACKAGE-STAGING-BEFORE.tsv`, `KERNEL-DEFINITIONS-BEFORE.json`, and
`ROUTES-BEFORE.json`; the complete starting matrix is in `MATRIX-BEFORE.tsv`.
The frozen all-reference scan is in `REFERENCES-BEFORE.tsv` and the pre-edit
build output hash manifest is in `BUILD-OUTPUT-BEFORE.tsv`.

Frozen baseline conclusions:

- Current production supported-state universe: canonical production Kernel,
  production Dock manifests/resources, and runtime staging from the source
  tree; no other persisted package root is supported.
- Before G4, current production route metadata resolved to `native_tui` for
  Hermes and Claude; QA qf-proof/runtime-proof references were present.
- `agentos` was not a supported current production route. Prior to G4 it still
  had a parser/host fallback path and AgentOS-only QA proof surfaces.
- The required G4 refusal shape is an exact post-resolution dispatcher error:
  unsupported route names its route and `package_ref`, with no mutation before
  dispatch. The accepted Contract A timing decision is recorded in
  `G4-ROUTE-TIMING-READER.md`.

Starting matrix ownership: pre-existing package/Windows reds remain assigned
to G12, Kernel/write-law reds remain assigned to G8, and the exact matrix plus
owners is frozen in `MATRIX-BEFORE.tsv`.
