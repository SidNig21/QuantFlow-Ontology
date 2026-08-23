# Pre-R18 coherence independent verification — Round 1

verdict: REWORK
verifier-task: `01a02de8-530f-7091-b03d-668247fefc7a`
product-candidate: `d91eda86b1184fe2c381771e293fdd8a79bad98c`
evidence-head-tested: `dd7ff76dc7ec4bd9d3d2cf6c354bbdfd2f86f642`
local-origin-match: yes
worktree-before-after: clean and unchanged

## Named reds

### C14 was a false green

The accepted F1 oracle contains 16 objects and 20 links. The live
`pre-r18-coherence` control hard-coded and printed only 13 tiles and 15 cables,
built the inherited R16 manifest, and inspected only ten non-session objects. It
captured positions but asserted no F1 geometry predicate. C14's ledger checked the
oracle file hash/count and production source-string presence rather than the live
DOM/SVG state.

Independent receipts:

```text
bun qa/run.ts pre-r18-coherence: PASS, oracle_tiles=13 oracle_cables=15
bun qa/run.ts research-world-visible: PASS, oracle_tiles=13 oracle_cables=15
focused gate contract: 13/13 PASS while explicitly asserting inherited 13/15
C01-C14 falsifiers: each exited 1 with its named FALSIFY RED condition
```

The red is not that the R16 control failed. The red is that C14 claimed the wider
R17 world without measuring it.

### Required screenshot evidence was absent

No optimized implemented-state image or screenshot manifest was tracked under the
Pre-R18 evidence directory. Builder evidence explicitly substituted the live
13/15 DOM receipt for screenshots, which the order did not permit.

## Green bounded seams

```text
focused changed-surface tests: 25 pass, 0 fail, 173 expectations
bunx tsc --noEmit: exit 0
static gates: PASS
Atlas generate --check: PASS
Atlas ratchet: PASS, HARD RED 0
Atlas diff: UNCHANGED, 0 architectural changes
cleanup: zero owned processes and roots
```

Package-wide `bun test` remained environment/legacy red on both reports. The
Verifier observed 494 pass, 43 fail, 7 errors; the Builder observed 487 pass,
42 fail, 8 errors. Every current failure was outside the changed product surface.
This order does not absorb them.

Verification stopped before Computer Use or founder acceptance.
