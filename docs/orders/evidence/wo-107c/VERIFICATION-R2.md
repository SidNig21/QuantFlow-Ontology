# WO-107c independent verification receipt — R2

## Plain-language result

QuantFlow's packaged Linux app now stores Bovada venue and football-event context safely, keeps
trusted ingestion actions away from agents, and survives deliberate failures without leaving false
market data behind.

**Status: independent PASS — candidate awaits founder-approved merge.**

## Candidate and canonical proof

- Product candidate: `0924f502124fa32c4bca0d95c1daf61b96c74f41`
- Isolated clone: `/tmp/qf-wo107c-final.lfG3Ka/repo`
- Canonical command: `bun qa/verify-release.ts`, invoked once outside the filesystem sandbox
- Run ID: `304169e3-4e27-4c06-8fdd-cbc11d202673`
- Final result: `PASS  release-verification`
- Package receipt log SHA-256: `1600f41ac994ac0304da7c9baf38f732b912c7fb125dc9c4395f62951917820f`

The same run proved:

- frozen Electron install, 277 unit tests, production main/preload/renderer build, and unsigned Linux
  package;
- 203 MB `quantflow` executable, `app.asar`, qf-toolloop package, Hermes package/metadata/profile/
  allowlist files, and byte-identical `0001`, `0002`, and `0003` SQL authority;
- schema `160/0`, Kernel `70/0`, and strict typecheck;
- runtime P2 had zero listeners and the packed guest's socket attempt failed with
  `maximum socket count reached`, leaving sessions `[] -> []`;
- runtime P4 returned exactly `cancelled`, emitted no post-cancel chunks, and left no orphan process
  or listener;
- 23 objects, 28 actions, 97 complete generated tools, 92 advertised/served tools, with
  `register_venue`, `schedule_market_event`, and `ingest_market_batch` generated but not served;
- trusted context replay/conflict, all three derived market edges, the full predecessor upgrade
  matrix, packaged `0003`, and MCP direct-call rejection for both hidden context actions.

CI3's five drift fixtures completed in `529.43ms`, `235.18ms`, `4.53ms`, `198.63ms`, and
`356.35ms`, all far below the five-second ceiling.

## Independent falsifiers

A fresh Luna verifier started clean at the exact product candidate and used temporary `apply_patch`
mutations only. No bait was committed.

1. `register_venue.operatorOnly: true -> false` changed the served-tool hash to `6eb659...` instead
   of pinned `f42d367...`; exact restore returned `PASS market-context` outside the sandbox.
2. The runtime predecessor's literal `0003` loader was changed to `0002`; the upgrade matrix failed
   with `KernelUpgradeShapeError: 0003 did not produce the exact current shape`; exact restore
   returned `PASS market-context` outside the sandbox.
3. Exact context replay was made to append a second provenance event; the gate failed with
   `context exact replay appended a provenance event`; exact restore returned
   `PASS market-context` outside the sandbox.
4. The injected test driver's outer transaction wrapper was disabled while preserving the final
   valid `offered_on` fault. The gate observed residue — instruments `3 vs 2`, `lists` links `3 vs 2`,
   ingest events `5 vs 4` — proving the transaction is the rollback boundary. The wrapper was
   restored byte-for-byte. The restored in-sandbox run passed every market and rollback assertion,
   then stopped only at the known `mcp_connect` sandbox boundary. Two requests to run that final
   focused MCP tail outside the sandbox timed out in the approval service before process creation.

## Judgment

The fourth bait's final command did not print a second full green after restoration, so that fact is
not hidden. PASS is still warranted because the worktree was clean at the exact canonical candidate;
the same candidate had already passed the full outside-sandbox `market-context` gate after bait 3 and
the canonical release verifier; after bait 4, every affected market/transaction assertion passed and
only the unrelated sandbox MCP process launch was unavailable. No product byte or durable state
remained from any bait.
