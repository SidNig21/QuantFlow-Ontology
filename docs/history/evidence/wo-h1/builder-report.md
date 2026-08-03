I cleaned up the debt ledger so it now reflects what is actually true today, and I proved the edited safety checks still fail when broken and pass when restored.

Committed on `wo-h1`:
- `77ce20e` — `WO-H1: re-measure debt register and close gate-runner gaps`

### 18-line audit (open debts)

| Debt | Verdict | Measured note | Citation(s) |
|---|---|---|---|
| #3 | STANDS | Private Zod internals are still read directly. | `qf-kernel-schema/src/define.ts:79`, `qf-kernel-schema/src/define.ts:107`, `qf-kernel-schema/src/generate/sql.ts:19`, `qf-kernel-schema/src/generate/sql.ts:29` |
| #4 | STALE | `stateFieldName` heuristic now feeds `transition-meta` too (not just original call sites). | `qf-kernel-schema/src/define.ts:150`, `qf-kernel-schema/src/transition-meta.ts:2`, `qf-kernel-schema/src/transition-meta.ts:53` |
| #6 | STANDS | Schema action still requires `content_hash`; Kernel still treats it as advisory-verified. | `qf-kernel-schema/src/ontology/research.ts:522`, `qf-kernel-schema/src/ontology/research.ts:526`, `packages/qf-kernel/src/create.ts:121` |
| #7 | STANDS | `ARTIFACT_KINDS` duplication and creation sentinel shape are still present. | `packages/qf-kernel/src/create.ts:38`, `packages/qf-kernel/src/create.ts:64`, `packages/qf-kernel/src/create.ts:65` |
| #8 | STANDS | Explicitly deferred tooling evaluation remains trigger/risk managed. | `docs/ROADMAP.md:56`, `START_HERE.md:53` |
| #9 | STALE | Determinism check already exists (four tests); debt narrowed to compact-golden only. | `qf-kernel-schema/src/generate.test.ts:38`, `qf-kernel-schema/src/generate.test.ts:54` |
| #10 | DONE | Duplicate schema/kernel package gates were extracted to one helper. | `qa/run.ts:115`, `qa/run.ts:199`, `qa/run.ts:245` |
| #11 | STALE | `validate.ts` still accepts bare `string`; typed-boundary decision is still open. | `qf-kernel-schema/src/validate.ts:3`, `qf-kernel-schema/src/validate.ts:11`, `packages/qf-kernel/src/execute.ts:68` |
| #12 | DONE | Gate now catches dot-assignment in addition to prior key-shape detection. | `qa/gates/no-canvas-domain-writes.ts:50`, `qa/gates/no-canvas-domain-writes.ts:83` |
| #13 | COULD NOT MEASURE | Repo shows the menu path and `qf:execute` seam, but no durable “founder clicked” receipt to prove/deny execution. | `collab-electron/src/main/index.ts:368`, `collab-electron/src/main/ipc-kernel.ts:101` |
| #14 | STANDS | Legacy ACP path is still registered, imports ACP SDK directly, and auto-selects allow permission option. | `collab-electron/src/main/index.ts:54`, `collab-electron/src/main/index.ts:867`, `collab-electron/src/main/acp-agent.ts:19`, `collab-electron/src/main/acp-agent.ts:88` |
| #15 | STALE | `one-skin` is no longer hex-only; functional color syntax is now scanned. | `qa/gates/one-skin.ts:26`, `qa/gates/one-skin.ts:28` |
| #16 | STALE | `.js` files are now part of scan surface; residual is explicit allowlist policy. | `qa/gates/one-skin.ts:13`, `qa/gates/one-skin.ts:57` |
| #17 | STANDS | Durable execution debt remains trigger-gated by design. | `docs/ROADMAP.md:65` |
| #18 | STANDS | Object-level idempotency is present; step-level workflow key is still absent debt. | `qf-kernel-schema/src/ontology/research.ts:140`, `qf-kernel-schema/src/ontology/research.ts:422`, `docs/ROADMAP.md:66` |
| #19 | STALE | `promote_type` is still unwired; missing-action context is now six (not nine), bypass note still applies. | `qf-kernel-schema/src/schema.ts:146`, `qf-kernel-schema/src/schema.ts:166`, `qf-kernel-schema/src/commands.ts:24`, `qf-kernel-schema/src/commands.ts:170`, `qf-kernel-schema/src/schema.ts:173`, `qf-kernel-schema/src/define.ts:441` |
| #20 | STANDS | Market abstraction test trigger has not fired; schema still keeps instrument decoupled enough for future test. | `docs/ROADMAP.md:68`, `qf-kernel-schema/src/ontology/market.ts:62` |
| #21 | STALE | Trigger fired; hand-written schema doc still uses old object surface names. | `docs/ONTOLOGY_SCHEMA.md:24`, `docs/ONTOLOGY_SCHEMA.md:31`, `qf-kernel-schema/src/ontology/market.ts:30`, `qf-kernel-schema/src/ontology/market.ts:59`, `qf-kernel-schema/src/ontology/market.ts:111` |

Also left debt number **#22** unclaimed/reserved as instructed.

### Delivered changes

- `qa/run.ts`: extracted `bunPackageGate` and routed both `schema` + `kernel` through it.
- `qa/gates/no-canvas-domain-writes.ts`: added dot-assignment detection and kept existing property-key detection.
- `docs/ROADMAP.md`: corrected stale rows and marked swept debts done in-place (`#10`, `#12`), plus stale reroutes/wording updates (`#4`, `#9`, `#11`, `#15`, `#16`, `#19`, `#21`).

### Gate evidence

- **Deliverable 3 before**  
  - `bun qa/run.ts schema` → `PASS  schema` then `0`  
  - `bun qa/run.ts kernel` → `PASS  kernel` then `0`
- **Deliverable 3 after**  
  - `bun qa/run.ts schema` → `PASS  schema` then `0`  
  - `bun qa/run.ts kernel` → `PASS  kernel` then `0`
- **G1 falsification (runner helper safety)**  
  - Baited schema test: `FAIL  schema` / `schema: bun test exited 1` / `1`  
  - Restored schema: `PASS  schema` / `0`  
  - Baited kernel test: `FAIL  kernel` / `kernel: bun test exited 1` / `1`  
  - Restored kernel: `PASS  kernel` / `0`
- **G2 falsification (Law E hardening)**  
  - Dot-assignment bait (`tile.content_hash = ...` shape): `FAIL  no-canvas-domain-writes` / `via dot-assignment` / `1`  
  - Restore: `PASS  no-canvas-domain-writes` / `0`  
  - Legacy key-shape bait (`{ content_hash: ... }`): `FAIL  no-canvas-domain-writes` / `via property key` / `1`  
  - Restore: `PASS  no-canvas-domain-writes` / `0`
- **G3 exit code**  
  - `bun qa/run.ts --all; echo $?` → final line `0`

### Scope confirmation

`git diff --stat main...wo-h1`:
- `docs/ROADMAP.md`
- `qa/gates/no-canvas-domain-writes.ts`
- `qa/run.ts`
- `3 files changed, 60 insertions(+), 53 deletions(-)`

No committed edits in `qf-kernel-schema/src`, `packages/qf-kernel`, or `collab-electron`.

### Judgment calls

I treated debt #13 as **could not measure** instead of force-labeling it STANDS/STALE because the repository contains the path (`Publish Artifact…` to `qf:execute`) but no durable founder-action receipt proving whether that click has happened. Marking uncertainty explicitly is more faithful than inferring from absence.

I chose to mark #15 and #16 as **STALE** rather than DONE. The technical loopholes named in those rows are fixed (`rgb/hsl` and `.js` scanning now exist), but there is still an explicit allowlist policy decision around two founder palette files, so closing them entirely would overstate what is actually settled.

I ran `--all` and reported its exit code even though cold full-suite verification belongs to the verifier seat, because this order’s evidence section explicitly asks for G3 exit-code reporting. I’m not self-verifying; this is builder evidence only, and verifier still owns cold re-run authority.
