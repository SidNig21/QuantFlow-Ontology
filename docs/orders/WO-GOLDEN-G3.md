# WO-GOLDEN-G3 — Retire peer-bus and critic-mock package islands

status: **SEMANTIC READER YES/YES — AWAITING NEXT.md BUILDER ROTATION**
order-type: Golden Baseline Phase 2 non-rung group
branch: `wo-golden-g2`
founder-approved-route: G3 — peer-bus and critic-mock islands
parent-group: G2 **CLOSED / ACCEPTED** at `1ae84771d043c77bebaece4f886096c8cae5b981`
round-1-reader-task: `01a03c4f-47ab-7f50-82ca-c7b87a676ca1`
r18-authority: **FROZEN**
main-authority: **NONE**
builder-authority: **NONE UNTIL FINAL READER YES/YES + NEXT.md ROTATION**

## Outcome and one meaning

G3 removes two obsolete standalone package islands:

- `tools/qf-peer-bus/**`;
- `species/critic-mock/**`.

It retains the current app-owned notification transport and the current governed critic path. “One collaboration truth path” means Kernel Task, Artifact, Evaluation, and Report objects remain authoritative while `collab-electron/src/main/kernel.ts` app-owned notifications flow through `peer-delivery.ts` to Agent Host/native TUI. Transport rows are delivery state, never domain truth.

A “consumer” is an executable import, spawn/launch route, Dock inventory entry, package/build resource, supported predecessor-state requirement, or explicit R18–R25 implementation dependency. QA, generated output, history, filename strings, and comments are classified separately and do not count as production consumers.

The consumer census treats `docs/orders/NEXT.md` and `docs/orders/WO-GOLDEN-G3.md` as active scope/authority records, not executable consumers. It excludes its own output root `docs/orders/evidence/golden-baseline/g3/**` from self-census. These accepted historical evidence paths may contain obsolete names without becoming current consumers: `docs/DEBT.md`, `docs/orders/evidence/post-merge-review-kernel-identity.md`, and all files under `docs/orders/evidence/wo-103/**`, `wo-103b/**`, `wo-104/**`, `wo-106/**`, `wo-106b/**`, `wo-ci4/**`, `wo-ci5/**`, and `wo-k1/**`. Any other current-authority occurrence must be classified explicitly in BEFORE.md and corrected if it asserts the obsolete package is live.

## Preserved current boundary

G3 may not remove, disable, rename, or semantically relabel:

- app-owned `QF_PEER_BUS_DB`, `.qf-peer-bus` compatibility directory, transport schema, or migration behavior;
- `collab-electron/src/main/kernel.ts` notification transport;
- `collab-electron/src/main/peer-delivery.ts`;
- `collab-electron/src/main/index.ts`, `agent-host.ts`, `host-native-tui.ts`, or `sidecar/server.ts` collaboration seams;
- current Dock collaboration and Windows/WSL forwarding;
- `hermes-critic`, Kernel independent-critic tests, or governed-review implementation/tests;
- shared MCP, ACP, AgentOS, AI, Zod, or `qf-kernel` dependencies used elsewhere.

G4 owns AgentOS, G5 owns ACP/Agent Chat/Terminal, and G7 owns broader dependency contraction.

## Exact tracked deletion manifest

The Builder must verify exact bytes at `BUILD_BASE_SHA`, then delete all and only:

1. `tools/qf-peer-bus/.gitignore`
2. `tools/qf-peer-bus/README.md`
3. `tools/qf-peer-bus/bun.lock`
4. `tools/qf-peer-bus/package.json`
5. `tools/qf-peer-bus/tsconfig.json`
6. `tools/qf-peer-bus/scripts/setup-founder-seats.ts`
7. `tools/qf-peer-bus/src/bus.ts`
8. `tools/qf-peer-bus/src/harness.ts`
9. `tools/qf-peer-bus/src/server.ts`
10. `species/critic-mock/.gitignore`
11. `species/critic-mock/README.md`
12. `species/critic-mock/agent-package/agentos-package.json`
13. `species/critic-mock/agent-package/package.json`
14. `species/critic-mock/agent-package/src/acp-main.ts`
15. `species/critic-mock/bun.lock`
16. `species/critic-mock/evidence/dock.png`
17. `species/critic-mock/package.json`
18. `species/critic-mock/register.ts`
19. `species/critic-mock/scripts/pack-agent.mjs`

After tracked deletion, remove ignored/generated descendants under these two exact roots, including present `tools/qf-peer-bus/node_modules`, then remove the empty roots. No wildcard or parent deletion is allowed. Record every literal removed path and prove both exact roots absent.

Only the two package-local locks/manifests and dependencies leave. A shared root/app dependency may change only if the G3 census proves no surviving declaration/consumer and the Reader explicitly names it; otherwise G7 owns it.

## Deliverable A — Frozen purpose and consumer census

Before mutation create `docs/orders/evidence/golden-baseline/g3/BEFORE.md` with:

- clean `BUILD_BASE_SHA`, branch/upstream, product-process count zero;
- path/bytes/SHA-256 for all 19 tracked targets;
- ignored-descendant manifest for both roots;
- exact import, spawn, runtime inventory, Dock manifest, Electron `extraResources`, package ref, build output, installer, compatibility/state, QA, current authority, history, generated, comment/string, and R18–R25 references;
- package-local and surviving shared dependency declarations;
- exact starting matrix results and all pre-existing reds;
- Atlas 432-file/126-channel/13-strip-candidate starting baseline and clean-tree hash.

Search universe is every tracked file plus package/build/update/runtime resolution inputs and ignored descendants under the two roots. Exclude `.git`, external `node_modules` except the named in-root residue, disposable temp roots, caches, and generated build output except for a literal target-name absence scan.

Add `qa/gates/golden-g3-consumer-census.ts` and register `golden-g3-consumer-census` in `qa/run.ts`. It must enumerate the consumer classes above, reject either obsolete root in every production/package/compatibility/future-rung class, permit only the explicitly named QA/history/generated/comment/control-document occurrences, and assert the preserved app-owned seams remain present. Exclude `docs/orders/evidence/golden-baseline/g3/**` from self-census. Its non-writing selector `QF_G3_CONSUMER_CENSUS_FALSIFY=peer-bus|critic-mock` injects exactly one virtual row with `class=production-import` and `source=qa:falsifier` targeting the selected obsolete root. Each selector exits 1 with exact prefix `golden-g3-consumer-census: forbidden production-import qa:falsifier ->` followed by the selected root; unset exits 0. No filesystem bait, new product truth, or runtime code.

Because neither target is a current package input, G3 requires this explicit package-boundary census and Electron build, not a full installer/release traversal.

## Deliverable B — Dedicated lifecycle-command fixture

The generic recursive-install lifecycle invariant remains current but may not depend on an obsolete package.

Add exact QA-only fixture root `qa/fixtures/lifecycle-command/` containing:

- `package.json`: private package, `scripts.typecheck = "tsc --noEmit"`, only `devDependencies.typescript = "5.9.3"`;
- empty `tsconfig.json`;
- committed frozen `bun.lock`.

In `qa/run.ts`, replace only the obsolete `PEER_BUS_DIR` lifecycle target with this fixture, rename the constant to `LIFECYCLE_FIXTURE_DIR`, and keep discovery/matcher behavior unchanged. Preserve all allowed/rejected controls and selectors `literal`, `flagged`, and `chained`.

For each selector, `bun qa/run.ts typecheck` must exit 1 with `typecheck: forbidden lifecycle` and name the fixture. With the selector unset it exits 0. Unknown selector behavior remains fail-closed.

## Deliverable C — Current law gates remain falsifiable

### Kernel one path

Remove the obsolete `tools/qf-peer-bus/src/harness.ts` allowlist entry.

Add a self-cleaning `QF_KERNEL_ONE_PATH_FALSIFY=1` bait under exact QA temp path `tools/_qf-k1-path-bait/falsify.ts` containing an unauthorized `process.env.QF_KERNEL_DB` read and `kernel.db` literal. The falsifier run exits 1 naming the bait. A `finally`/signal-safe cleanup removes the exact bait root. The unset run exits 0 and the tree is byte-identical.

### Kernel sole writer

Remove only allowlist rows for deleted G3 files. Preserve all other Law E classifications and use the gate’s existing self-cleaning selectors:

- `QF_KERNEL_SOLE_WRITER_FALSIFY_OPEN=1`;
- `QF_KERNEL_SOLE_WRITER_FALSIFY_WRITE=1`.

Each exits 1 naming its bait; normal `kernel-sole-writer` and `kernel-sole-writer-app` runs exit 0.

No allowlist change may exempt a new product path.

## Deliverable D — Atlas remains honest

Remove only the standalone peer-bus special classifier/transport rows from `qf-atlas/classify.mjs`. Preserve app `peer-delivery.ts` and Kernel transport classification.

Retarget falsifier 18 to exact temporary path `tools/_qf-atlas-coverage-bait.ts` with exact content `export const qfAtlasCoverageBait = "INSERT INTO mission (id) VALUES ('atlas-coverage-bait')";`. This top-level SQL string has one SQL site and no enclosing indexed function. During the falsifier, the regenerated model must contain that exact path with `status === "unindexed"`, `sqlInText === 1`, and `sqlIndexed === 0`; the generated Markdown coverage table must contain that exact path under `What the analyzer could not read`. Use the existing falsifier model generation and output-byte snapshot/restore contract. Create/remove the bait through the existing fixture helper, plus finally/signal cleanup, and require pre/post HEAD, status, generated-output bytes, and tree hash equality. Update `qf-atlas/markdown.mjs` wording to describe the temporary coverage bait rather than an obsolete named package.

Regenerate `atlas.json`, `ATLAS.md`, and `atlas.html` only after the product/QA candidate is committed clean. Require check, all falsifiers, ratchet HARD RED 0, and before/after tree hash equality for non-generating proof runs.

## Deliverable E — Current docs and identity

Update current claims in `README.md`, `species/hermes/README.md`, `docs/DOCTRINE.md`, and `docs/RESEARCH.md` so they name the app-owned peer notification transport rather than the deleted MCP package. Correct the stale top comment in `peer-delivery.ts` without changing behavior.

Current critic identity is `hermes-critic`, never `critic-mock`. Remove obsolete critic-mock product-identity/allowlist references only after the consumer census proves absence.

Historical receipts, including `docs/DEBT.md` and accepted evidence, remain byte-preserved unless they falsely claim current authority. A short annotation may mark an old claim historical; do not rewrite accepted history.

## Command-exact starting and candidate matrix

All commands run from repository root in PowerShell. Record command, UTC start/end, exit, log SHA-256, pre/post HEAD, and pre/post status. Falsifier failures are expected exit 1 and must restore the clean starting tree. Builder runs the starting/candidate matrix; independent Verifier reruns the final matrix except generation, using the immutable candidate.

### 1 — Freeze identity and starting temp roots

```powershell
$BUILD_BASE_SHA = (git rev-parse HEAD).Trim()
$UPSTREAM_SHA = (git rev-parse origin/wo-golden-g2).Trim()
if ((git status --porcelain=v1) -or $BUILD_BASE_SHA -ne $UPSTREAM_SHA) { throw "G3 start is not clean/upstream-equal" }
$g3Prefixes = @("qf-dock-production-inventory-*","qf-product-identity-*","qf-windows-dock-collaboration-*")
$g3Before = Get-ChildItem -LiteralPath $env:TEMP -Directory | Where-Object { $n=$_.Name; $g3Prefixes.Where({$n -like $_}).Count -gt 0 } | Select-Object -ExpandProperty FullName | Sort-Object
$g3Before | Set-Content -LiteralPath docs/orders/evidence/golden-baseline/g3/TEMP-ROOTS-BEFORE.txt -Encoding utf8
```

Expected: no throw; `BUILD_BASE_SHA == origin/wo-golden-g2`.

### 2 — Lifecycle red controls and green

```powershell
$env:QF_TYPECHECK_FALSIFY_RECURSIVE_INSTALL="literal"; bun qa/run.ts typecheck; $code=$LASTEXITCODE; Remove-Item Env:QF_TYPECHECK_FALSIFY_RECURSIVE_INSTALL; if($code -ne 1){throw "literal expected 1 got $code"}
$env:QF_TYPECHECK_FALSIFY_RECURSIVE_INSTALL="flagged"; bun qa/run.ts typecheck; $code=$LASTEXITCODE; Remove-Item Env:QF_TYPECHECK_FALSIFY_RECURSIVE_INSTALL; if($code -ne 1){throw "flagged expected 1 got $code"}
$env:QF_TYPECHECK_FALSIFY_RECURSIVE_INSTALL="chained"; bun qa/run.ts typecheck; $code=$LASTEXITCODE; Remove-Item Env:QF_TYPECHECK_FALSIFY_RECURSIVE_INSTALL; if($code -ne 1){throw "chained expected 1 got $code"}
bun qa/run.ts typecheck; if($LASTEXITCODE -ne 0){throw "typecheck green failed"}
```

Each red includes `typecheck: forbidden lifecycle` and the fixture path; final run exits 0.

### 3 — Kernel law red controls and green

```powershell
$env:QF_KERNEL_ONE_PATH_FALSIFY="1"; bun qa/run.ts kernel-one-path; $code=$LASTEXITCODE; Remove-Item Env:QF_KERNEL_ONE_PATH_FALSIFY; if($code -ne 1){throw "kernel-one-path red expected 1 got $code"}
if(Test-Path -LiteralPath tools/_qf-k1-path-bait){throw "kernel-one-path bait leaked"}
bun qa/run.ts kernel-one-path; if($LASTEXITCODE -ne 0){throw "kernel-one-path green failed"}
$env:QF_KERNEL_SOLE_WRITER_FALSIFY_OPEN="1"; bun qa/run.ts kernel-sole-writer; $code=$LASTEXITCODE; Remove-Item Env:QF_KERNEL_SOLE_WRITER_FALSIFY_OPEN; if($code -ne 1){throw "sole-writer open red expected 1 got $code"}
$env:QF_KERNEL_SOLE_WRITER_FALSIFY_WRITE="1"; bun qa/run.ts kernel-sole-writer; $code=$LASTEXITCODE; Remove-Item Env:QF_KERNEL_SOLE_WRITER_FALSIFY_WRITE; if($code -ne 1){throw "sole-writer write red expected 1 got $code"}
if(Test-Path -LiteralPath tools/_qf-k2-sole-writer-bait){throw "sole-writer bait leaked"}
bun qa/run.ts kernel-sole-writer; if($LASTEXITCODE -ne 0){throw "sole-writer green failed"}
bun qa/run.ts kernel-sole-writer-app; if($LASTEXITCODE -ne 0){throw "sole-writer-app green failed"}
```

Red diagnostics name their exact bait/claim. All baits are absent; both green gates exit 0.

### 4 — Consumer-census red controls and green

```powershell
$env:QF_G3_CONSUMER_CENSUS_FALSIFY="peer-bus"; bun qa/run.ts golden-g3-consumer-census; $code=$LASTEXITCODE; Remove-Item Env:QF_G3_CONSUMER_CENSUS_FALSIFY; if($code -ne 1){throw "peer-bus census red expected 1 got $code"}
$env:QF_G3_CONSUMER_CENSUS_FALSIFY="critic-mock"; bun qa/run.ts golden-g3-consumer-census; $code=$LASTEXITCODE; Remove-Item Env:QF_G3_CONSUMER_CENSUS_FALSIFY; if($code -ne 1){throw "critic-mock census red expected 1 got $code"}
bun qa/run.ts golden-g3-consumer-census; if($LASTEXITCODE -ne 0){throw "G3 census green failed"}
```

Each red prints exact prefix `golden-g3-consumer-census: forbidden production-import qa:falsifier ->` plus the selected root; green exits 0.

### 5 — Current critic, transport, inventory, and package proof

```powershell
bun test packages/qf-kernel/src/r12-independent-critic.test.ts packages/qf-kernel/src/r15-governed-review.test.ts collab-electron/src/main/governed-review.test.ts; if($LASTEXITCODE -ne 0){throw "critic/governed tests failed"}
bun qa/run.ts governed-review; if($LASTEXITCODE -ne 0){throw "governed-review failed"}
bun qa/run.ts governed-review-live; if($LASTEXITCODE -ne 0){throw "governed-review-live failed"}
bun qa/run.ts windows-dock-collaboration; if($LASTEXITCODE -ne 0){throw "app-owned collaboration failed"}
bun qa/run.ts dock-production-inventory; if($LASTEXITCODE -ne 0){throw "Dock inventory failed"}
bun qa/run.ts product-identity; if($LASTEXITCODE -ne 0){throw "product identity failed"}
bun test collab-electron/scripts/package-lib/shared-paths.test.ts; if($LASTEXITCODE -ne 0){throw "package paths failed"}
Push-Location -LiteralPath collab-electron
try {
  bun install --frozen-lockfile --ignore-scripts; if($LASTEXITCODE -ne 0){throw "Electron frozen install failed"}
  bun run build; if($LASTEXITCODE -ne 0){throw "Electron build failed"}
} finally { Pop-Location }
bun qa/run.ts repo-shape; if($LASTEXITCODE -ne 0){throw "repo-shape failed"}
bun qa/run.ts doc-links; if($LASTEXITCODE -ne 0){throw "doc-links failed"}
bun qa/run.ts rung-ladder; if($LASTEXITCODE -ne 0){throw "rung-ladder failed"}
```

Every command exits 0. The collaboration gate proves isolated transport/task/ACK and cleanup.

### 6 — Atlas proof

```powershell
$atlasHead=(git rev-parse HEAD).Trim(); $atlasStatus=git status --porcelain=v1
bun qf-atlas/generate.mjs --check; if($LASTEXITCODE -ne 0){throw "Atlas drift"}
bun qf-atlas/falsify.mjs; if($LASTEXITCODE -ne 0){throw "Atlas falsifiers failed"}
bun qf-atlas/ratchet.mjs; if($LASTEXITCODE -ne 0){throw "Atlas ratchet failed"}
if((git rev-parse HEAD).Trim() -ne $atlasHead -or (git status --porcelain=v1) -ne $atlasStatus){throw "Atlas non-generating proof mutated tree"}
```

Expected: current, all falsifiers PASS, HARD RED 0, exact pre/post identity.

### 7 — Literal deletion and built-output absence

```powershell
$g3Targets=@(
"tools/qf-peer-bus/.gitignore","tools/qf-peer-bus/README.md","tools/qf-peer-bus/bun.lock","tools/qf-peer-bus/package.json","tools/qf-peer-bus/tsconfig.json","tools/qf-peer-bus/scripts/setup-founder-seats.ts","tools/qf-peer-bus/src/bus.ts","tools/qf-peer-bus/src/harness.ts","tools/qf-peer-bus/src/server.ts",
"species/critic-mock/.gitignore","species/critic-mock/README.md","species/critic-mock/agent-package/agentos-package.json","species/critic-mock/agent-package/package.json","species/critic-mock/agent-package/src/acp-main.ts","species/critic-mock/bun.lock","species/critic-mock/evidence/dock.png","species/critic-mock/package.json","species/critic-mock/register.ts","species/critic-mock/scripts/pack-agent.mjs"
)
$remaining=$g3Targets | Where-Object { Test-Path -LiteralPath $_ }
$roots=@("tools/qf-peer-bus","species/critic-mock") | Where-Object { Test-Path -LiteralPath $_ }
if($remaining -or $roots){throw "G3 deletion incomplete: $($remaining+$roots -join ', ')"}
rg -n "tools/qf-peer-bus|species/critic-mock" collab-electron/out
if($LASTEXITCODE -eq 0){throw "deleted island string present in Electron build"}
if($LASTEXITCODE -gt 1){throw "built-output absence scan failed"}
```

Expected: zero remaining targets/roots and no built-output hit.

### 8 — Diff, temp, and process zero

```powershell
git diff --check "$BUILD_BASE_SHA...HEAD"; if($LASTEXITCODE -ne 0){throw "candidate diff check failed"}
git diff --check; if($LASTEXITCODE -ne 0){throw "worktree diff check failed"}
$g3Before=@(Get-Content -LiteralPath docs/orders/evidence/golden-baseline/g3/TEMP-ROOTS-BEFORE.txt -ErrorAction Stop)
$g3Prefixes=@("qf-dock-production-inventory-*","qf-product-identity-*","qf-windows-dock-collaboration-*")
$g3After=@(Get-ChildItem -LiteralPath $env:TEMP -Directory | Where-Object { $n=$_.Name; $g3Prefixes.Where({$n -like $_}).Count -gt 0 } | Select-Object -ExpandProperty FullName | Sort-Object)
$leaked=@(Compare-Object $g3Before $g3After | Where-Object SideIndicator -eq "=>" | Select-Object -ExpandProperty InputObject)
if($leaked){throw "G3 temp roots leaked: $($leaked -join ', ')"}
$repoPattern=[regex]::Escape((Resolve-Path .).Path)
$proc=@(Get-CimInstance Win32_Process | Where-Object { $_.ProcessId -ne $PID -and $_.Name -match '^(electron|bun|node|hermes)(\.exe)?$' -and $_.CommandLine -match $repoPattern })
if($proc){$proc | Format-Table ProcessId,Name,CommandLine -AutoSize | Out-String | Write-Error; throw "G3 repository processes remain"}
$wsl=@(wsl.exe -e sh -lc "pgrep -af '[h]ermes|[c]ollab-electron|[Q]uantFlow' || true")
if(($wsl -join "").Trim()){throw "G3 WSL product processes remain: $($wsl -join '; ')"}
"roots_remaining=0 leaked=[] process_count=0"
git status --porcelain=v1
git rev-parse HEAD
```

Expected: both diff checks 0; `roots_remaining=0 leaked=[] process_count=0`; empty status; immutable candidate SHA.

On the frozen starting SHA, new G3 selectors may be recorded as `not-yet-implemented`, never green. All existing commands run before mutation. Any other starting red is classified before Builder opens.

## Evidence and candidate

Write `BEFORE.md`, `AFTER.md`, `COMMANDS.tsv`, literal manifests, reference census, package-boundary census, Atlas before/after, and cleanup receipt under `docs/orders/evidence/golden-baseline/g3/`.

Commit product/QA/docs changes, regenerate Atlas from a clean candidate, commit generated outputs/evidence, then record:

- `BUILD_BASE_SHA`;
- immutable candidate SHA;
- product/config tree identity for any evidence-only commit;
- exact candidate parent chain;
- clean upstream match.

## Throughput and stops

A red that changes product behavior, semantic authority, acceptance meaning, group scope/order, supported compatibility, or PASS meaning requires semantic Reader adjudication.

A red proven on the frozen starting SHA and limited to same-meaning classification, selector, allowlist, invocation, teardown, generated metadata, or receipt formatting may be repaired directly by the Router. It receives one focused old-red/new-green falsifier and non-regression proof.

Independent commands may run concurrently only without shared-state mutation. Exact-byte receipts may be reused when relevant bytes/configuration are equal. One immutable candidate and one independent Verifier remain mandatory.

The same semantic assertion red twice after repair stops G3. A proven red owned by another Golden group is assigned there only when G3 non-regression remains independently provable.

G3 may not merge to `main`, open G4 Builder authority, begin R18, or combine groups.
