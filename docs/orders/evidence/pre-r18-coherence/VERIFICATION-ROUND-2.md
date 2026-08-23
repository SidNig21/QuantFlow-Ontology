# Pre-R18 coherence independent verification — Round 2

verdict: FAIL
verifier-role: fresh independent verifier; candidate unchanged
product-candidate: `b035d3fdfe7205747e1041e8d0303b01df653636`
origin-match-before-after: yes
worktree-before-after: clean (the evidence commit is the only verifier change)

## Decisive reds

1. Required focused matrix:
   `bun test src/windows/shell/src/research-world.test.ts src/main/research-world.test.ts src/windows/shell/src/cable-math.test.ts src/windows/shell/src/cable-overlay.test.ts src/windows/shell/src/task-composition.test.ts src/windows/shell/src/participant-projection.test.ts src/windows/shell/src/dock.test.ts`
   exited 1: 34 passed, 1 failed. An isolated rerun reproduced the same failure:
   `Task footer projection > retains one opaque session receipt and preserves the unchanged no-receipt projection`
   (2 passed, 1 failed). No fix was made.
2. `bun qf-atlas/generate.mjs --check` exited 1 with
   `STALE — atlas.json fingerprint 4a3f3da50ce3efd1 != bad12b4b2414f5ac`.
   `bun qf-atlas/ratchet.mjs` independently exited 1 for the same stale Atlas.
   `bun qf-atlas/generate.mjs --diff 4d25fa3df91964fc90223a135d8969ebd61c5374` exited 0
   and reported `UNCHANGED`; the verifier did not regenerate or edit Atlas.
3. All fourteen tracked WebPs were opened and visually inspected. Metadata is honest
   but the evidence is not: every file is 1600×1000, hashes match the manifest, all
   hashes are distinct, total size is 459,330 bytes, and every file is below 600 KB;
   however the manifest records `0 / 0` objects/links for every state and each image
   shows the generic logo/line motif rather than the named populated world, object
   tiles, Artifact/Evaluation/Report authority, selected cable, or cable-dense state.
   Dock-mode highlights vary, but the Canvas evidence is semantically empty and does
   not prove the named states/defects.

## Green receipts

- `bun qa/run.ts pre-r18-coherence`: PASS; oracle SHA
  `038a68c2508d3d671a60a1ab3d562d8d387e70ed08e582a4cca2e7fbf0519fa7`, 16 resolved
  objects, 20 resolved links, 16 object Inspect views, 20 link Inspect views,
  actual DOM/SVG geometry, C01–C14 PASS, `roots_remaining=0 leaked=[]`.
- Fourteen independent `QF_PRE_R18_COHERENCE_FALSIFY=C01..C14` runs each exited 1
  and printed its own named `FALSIFY RED` condition.
- `bun qa/run.ts research-world-visible`: PASS with inherited 13/15 oracle/cable
  counts and zero leaked roots. `bunx tsc --noEmit` from `collab-electron`: PASS.
- Eight static gates (`repo-shape`, `lockfile-committed`, `kernel-sole-writer`,
  `no-canvas-domain-writes`, `kernel-sole-writer-app`, `doc-action-surface`,
  `one-skin`, `rung-ladder`): all PASS. `bun qa/run.ts doc-links`: PASS (73).
  Both `git diff --check` commands: PASS.
- Boundary review: the literal R17 oracle and R16 thresholds are unchanged; the
  only sole-writer addition is the read-only Pre-R18 oracle allowlist entry. Ports
  use existing `portPosition`/`connectionPath`; layout uses object/link roles and
  `defaultSize("session")`; hidden/reduced-motion fit uses the existing final fit.
- Package-wide `bun test` was environment/legacy red: 539 tests, 496 pass, 43 fail,
  8 errors, 1,202 expectations. Documented categories include Hermes/package
  resources, Windows `ls`, native/Electron mocks, PTY/sidecar, image extensions,
  panel DOM, and the focused task-composition failure. The suite left six exact
  workspace `pty-sidecar.js` processes; those six were terminated after verification.
  Final process check: `owned_quantflow_processes=0`. Final candidate tree remained clean.

This is a verifier evidence receipt only; no product, test, gate, oracle, screenshot,
manifest, Atlas capability, NEXT, or order meaning was modified. The docs-only evidence
commit SHA is reported separately from the candidate SHA in the handoff.
