I updated the schema wording and guardrails so agents read clearer intent and unsafe schema-shape changes are now blocked before they land.

## 1) Deliverables completed (no commit made)

- **Deliverable 2 (`research` + `agent` descriptions only):**
  - Rewrote research-plane object/property descriptions in `qf-kernel-schema/src/ontology/research.ts`.
  - Rewrote agent-plane object/property descriptions in `qf-kernel-schema/src/ontology/agent.ts`.
  - Kept market-plane descriptions untouched.
  - Regenerated generated artifacts: `qf-kernel-schema/golden/ONTOLOGY.md`, `qf-kernel-schema/golden/migration.sql`, `qf-kernel-schema/golden/tools.json`.

- **Deliverable 3 (RL names, names-only):**
  - Added experimental objects `mission`, `policy`, `environment` in `qf-kernel-schema/src/ontology/research.ts`.
  - Added `"training"` to `run.kind` in `qf-kernel-schema/src/ontology/research.ts`.
  - Wired new objects into schema aggregation in `qf-kernel-schema/src/schema.ts`.
  - No actions added, no commands added, `qf-kernel-schema/src/commands.ts` untouched.

- **Deliverable 4 (`mission` decision):**
  - Implemented `mission` as a distinct experimental type in `qf-kernel-schema/src/ontology/research.ts`.
  - Left `workspace` unchanged as a separate concept in `qf-kernel-schema/src/ontology/agent.ts`.

- **Deliverable 5 (anti-pattern lints):**
  - Extended lint layer in `qf-kernel-schema/src/define.ts`:
    - Silo lint (`kind`-value embedded in object name).
    - Active-freeze lint against committed baseline.
    - Baseline builder utility.
  - Added tests in `qf-kernel-schema/src/define.test.ts` for:
    - Silo failure.
    - Active-freeze removed property failure.
    - Active-freeze retyped property failure.
  - Added governed baseline artifacts:
    - `qf-kernel-schema/schema-baseline.json`
    - `qf-kernel-schema/scripts/update-schema-baseline.ts`
    - `qf-kernel-schema/package.json` script: `update-schema-baseline`

- **G2 fixture artifact required by order:**
  - Added `qa/fixtures/charter-101.md`.

## 2) G1 bait transcripts (full unedited output, both directions)

### A) Missing description sabotage (red)

```
57 |   }
58 | }
59 | 
60 | function assertNonEmptyDescription(description: unknown, offender: string): asserts description is string {
61 |   if (typeof description !== "string" || description.trim().length === 0) {
62 |     throw new Error(`${offender} is missing a required non-empty description`);
                   ^
error: Object "bait_missing_desc".claim is missing a required non-empty description
      at assertNonEmptyDescription (/home/sidnig21/qf-worktrees/wo-101/qf-kernel-schema/src/define.ts:62:15)
      at assertPropertyDescriptions (/home/sidnig21/qf-worktrees/wo-101/qf-kernel-schema/src/define.ts:100:5)
      at defineObject (/home/sidnig21/qf-worktrees/wo-101/qf-kernel-schema/src/define.ts:164:3)
      at /home/sidnig21/qf-worktrees/wo-101/[eval]:1:124

Bun v1.3.14 (Linux x64)
```

### A) Missing description restore (green)

```
GREEN: description lint restored
```

### B) `backtest_run` silo sabotage (red)

```
355 |   for (const candidate of schema.objects) {
356 |     for (const [owner, kindValues] of kindValuesByObject.entries()) {
357 |       if (owner === candidate.name) continue;
358 |       for (const value of kindValues) {
359 |         if (!containsKindValueTokenSequence(candidate.name, value)) continue;
360 |         throw new Error(
                        ^
error: Object "backtest_run" embeds kind value "backtest" from "run.kind"; keep "run" as the type and encode "backtest" in kind
      at assertNoKindSilos (/home/sidnig21/qf-worktrees/wo-101/qf-kernel-schema/src/define.ts:360:19)
      at lintSchema (/home/sidnig21/qf-worktrees/wo-101/qf-kernel-schema/src/define.ts:436:3)
      at /home/sidnig21/qf-worktrees/wo-101/[eval]:1:537

Bun v1.3.14 (Linux x64)
```

### B) Silo restore (green)

```
GREEN: silo lint restored
```

### C) Active-freeze property removal sabotage (red)

```
399 |     }
400 | 
401 |     for (const [propertyName, baselineFingerprint] of Object.entries(baselineObject.properties)) {
402 |       const field = currentObject.properties.shape[propertyName];
403 |       if (!field) {
404 |         throw new Error(
                        ^
error: Active object "stable_fixture" removed baseline property "weight"
      at assertActiveFreeze (/home/sidnig21/qf-worktrees/wo-101/qf-kernel-schema/src/define.ts:404:19)
      at lintSchema (/home/sidnig21/qf-worktrees/wo-101/qf-kernel-schema/src/define.ts:439:5)
      at /home/sidnig21/qf-worktrees/wo-101/[eval]:1:723

Bun v1.3.14 (Linux x64)
```

### C) Active-freeze restore (green)

```
GREEN: active-freeze lint restored
```

## 3) Test counts before → after

Evidence for **before** (HEAD, pre-this-run state):
- `git show HEAD:qf-kernel-schema/src/define.test.ts | rg "test\(" -c` → `12`
- `git show HEAD:qf-kernel-schema/src/generate.test.ts | rg "test\(" -c` → `10`
- `git show HEAD:qf-kernel-schema/golden/conformance.test.ts | rg "meta: accept=.* total=.*"` → `// meta: accept=25 reject=93 total=118`

Before total = `12 + 10 + 118 = 140`.

Evidence for **after**:
- `rg "test\(" -c qf-kernel-schema/src/define.test.ts` → `15`
- `rg "test\(" -c qf-kernel-schema/src/generate.test.ts` → `10`
- `rg "meta: accept=.* total=.*" qf-kernel-schema/golden/conformance.test.ts` → `// meta: accept=25 reject=93 total=118`

After total = `15 + 10 + 118 = 143`.

Observed growth: **140 → 143**.

Verification commands run:
- `cd qf-kernel-schema && bun test`
  - `143 pass / 0 fail / Ran 143 tests across 3 files`
- `cd qf-kernel-schema && bun run generate && bun test`
  - `Wrote golden/...`
  - `143 pass / 0 fail / Ran 143 tests across 3 files`
- `bun qa/run.ts --list` (from repo root) ran and listed all gates.

## 4) Proposed RL link naming (proposal only, not implemented)

- `run` → `policy`: `trained_with`
- `run` → `environment`: `trained_in`
- `evaluation` → `policy`: `scores`
- `policy` → `environment`: `optimized_for`

These stay verb-first and readable in lineage questions while avoiding collision with existing generic `derived_from`.

## 5) `mission` decision and reasoning

I implemented the order’s recommendation: **`mission` is its own experimental type, `workspace` stays separate**. `workspace` is a spatial/UI container, while `mission` is research intent and hypothesis-scoping authority; combining them would couple layout concerns to scientific lineage, which would blur governance and make intent traversal harder for agents.

## 6) Places I exercised judgment where WO-101 was silent

- Chose a fingerprint-based active-freeze baseline (`z.toJSONSchema` normalized, metadata-stripped) so description edits do not falsely trigger type-freeze failures.
- Chose a controlled bypass flag (`QF_SCHEMA_SKIP_ACTIVE_FREEZE`) only for baseline regeneration script, so normal linting remains enforced.
- Kept `policy`/`environment` minimal (two properties each) to satisfy “names-only reservation” without pre-committing runtime semantics.
- Executed G1 falsification via isolated `bun -e` sabotage probes rather than mutating tracked source files for red/green, to avoid scope drift and keep working tree stable.
- Wrote G2 fixture with separate scoring sections for Q1/Q2 matching the order’s split-gate intent.

## 7) Broken things found and not fixed

- Per your hard constraints, I left known WO-103-owned breakage untouched (no writable links, unwired actions, etc.).
- I found one process artifact I did **not** fix: `.tmp/before/.git` is left untracked from an attempted temporary worktree cleanup that sandbox permissions blocked. It is outside deliverable scope, and no tracked repo files depend on it.  
  - Working tree currently includes untracked `.tmp/` for that reason.

If you want, I can do one follow-up pass just to remove `.tmp/` once you allow full filesystem permission for that cleanup command.
