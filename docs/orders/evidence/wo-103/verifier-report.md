Reports can now be trusted for this order: I re-ran the full verification cold, attacked the three failure-prone claims directly, and did not find a reproducible defect.

## Verdict

**PASS** — no numbered defects found for WO-103 on branch `wo-103`.

## Cold Transcript (Verifier Run)

Command run (unpiped, in fresh detached worktree):
- `git worktree add --detach /tmp/qf-verify wo-103`
- `cd /tmp/qf-verify && bun qa/run.ts --all; echo "REAL_EXIT_CODE:$?"`

Key output:
- `PASS repo-shape`
- `PASS lockfile-committed`
- `PASS schema`
- `PASS runtime-proof`
- `PASS kernel`
- `PASS typecheck`
- `PASS kernel-sole-writer`
- `PASS kernel-sole-writer-app`
- `PASS no-canvas-domain-writes`
- `PASS doc-action-surface`
- `PASS agent-path`
- `PASS one-skin`
- `PASS dock-registry`
- `REAL_EXIT_CODE:0`

## Gate Board (13 expected, 13 observed)

From `bun qa/run.ts --list` and cold run results:

- `repo-shape` — PASS  
- `lockfile-committed` — PASS  
- `schema` — PASS  
- `runtime-proof` — PASS  
- `kernel` — PASS  
- `typecheck` — PASS  
- `kernel-sole-writer` — PASS  
- `kernel-sole-writer-app` — PASS  
- `no-canvas-domain-writes` — PASS  
- `doc-action-surface` — PASS  
- `agent-path` — PASS  
- `one-skin` — PASS  
- `dock-registry` — PASS  

## Independent Re-measurement of High-Risk Claims

### 1) Arrival-settled rule (verb split, no relabel bypass)

I attacked `create_ticket` with grade/origin variants directly through `execute()`:

- `create_ticket` with `grade: "win"` -> **rejected** (`create_ticket does not accept "grade"`)
- `create_ticket` with `origin: "operator_supplied"` -> **rejected** (`create_ticket does not accept "origin"`)
- Brute-force grid over grade/origin combos -> **`settled_successes=0`**
- `observe_ticket` with terminal `grade: "win"` -> **accepted**
- Event log shows `ticket.observed`, not synthetic `pending -> win`

Also verified no command-input origin read:
- `rg "input\\.origin" packages/qf-kernel/src` -> no matches

Code seam confirms origin is rejected as input and derived by verb:

```551:556:packages/qf-kernel/src/create.ts
  rejectSuppliedInitialState(input, "origin", action);
  const kind = input.kind;
  if (kind !== "single" && kind !== "parlay") {
    throw new KernelError(`${action} requires kind single|parlay`);
  }
```

```641:646:packages/qf-kernel/src/create.ts
  rejectSuppliedInitialState(input, "grade", cmd.action);
  const fields = parseTicketFields(input, cmd.action);
  const grade = "pending";
  const origin = TICKET_ORIGIN.system;

  const id = fields.external_ref;
```

### 2) Endpoint validator layer (validator vs SQLite)

I reproduced a wrong-typed endpoint via `record_evaluation`:
- `artifact_id` set to a dataset id
- Result: `IllegalLinkError`, `layer=endpoint`, detail `evaluated_by from dataset`
- Event count unchanged, evaluation row count unchanged (`evaluation_rows=0`)

Then I proved SQLite alone does **not** enforce endpoint typing by direct insert:
- Inserted `links(kind='tests', from_id=<dataset>, to_id=<hypothesis>)` via raw SQL
- Insert succeeded

So rejection is coming from the validator layer, not SQLite.

Validator code:

```107:120:packages/qf-kernel/src/links.ts
  if (!def.from.includes(fromType)) {
    throw new IllegalLinkError(
      "endpoint",
      `${linkName} from ${fromType}`,
      `allowed from: ${def.from.join(", ")}`,
    );
  }
  if (!def.to.includes(toType)) {
    throw new IllegalLinkError(
      "endpoint",
      `${linkName} to ${toType}`,
      `allowed to: ${def.to.join(", ")}`,
    );
  }
```

SQLite schema only checks `kind`, not endpoint type pairing:

```439:447:qf-kernel-schema/golden/migration.sql
CREATE TABLE links (
  -- Primary key for this link instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- Link kind (schema link name), e.g. offered_on.
  kind TEXT NOT NULL CHECK (kind IN ('participates_in', 'offered_on', 'quotes', 'lists', 'settles', 'tests', 'has_leg', 'uses', 'executes_in', 'produces', 'derived_from', 'evaluated_by', 'gates', 'assigned_to', 'delegates_to')),
  -- Source object id.
  from_id TEXT NOT NULL,
```

### 3) Typecheck gate (cold status + red-path proof)

Cold verifier run included `PASS typecheck` with explicit runner exit:
- `REAL_EXIT_CODE:0`

I also ran typecheck alone unpiped:
- `cd /tmp/qf-verify && bun qa/run.ts typecheck; echo REAL_EXIT_CODE:$?`
- Result: `PASS typecheck`, `REAL_EXIT_CODE:0`

To confirm real red behavior on a true type mismatch, I ran:
- `bunx tsc --noEmit /tmp/qf-typecheck-bait.ts` with `const forcedTypeError: string = 123;`
- Output: `TS2322: Type 'number' is not assignable to type 'string'`
- Exit: `REAL_EXIT_CODE:2`

Gate executes this compiler path per `qa/run.ts`:

```265:285:qa/run.ts
      for (const cwd of discoverTypecheckInstallPackages(REPO_ROOT)) {
        const install = Bun.spawn(["bun", "install", "--frozen-lockfile"], {
...
      for (const cwd of typecheckPackages) {
        const proc = Bun.spawn(["bunx", "tsc", "--noEmit"], {
...
        if (code !== 0) {
          console.error(`typecheck: bunx tsc --noEmit in ${cwd} exited ${code}`);
```

## What I Re-measured vs Accepted

**Independently re-measured**
- Full cold `bun qa/run.ts --all` in detached `/tmp/qf-verify` (exit code explicitly captured).
- Gate count and names (`--list`: 13 gates).
- Arrival-settled bypass attempts (direct `execute()` probes + brute-force grade/origin matrix).
- Endpoint validator layer ownership (wrong endpoint rejected by `IllegalLinkError layer=endpoint`; raw SQL accepts wrong endpoint shape).
- Typecheck gate standalone run and compiler red-path behavior on an actual TS type error.
- Branch delta stats (`main...wo-103`) and commit count (`8` commits ahead `main`); `collab-electron` unchanged.

**Accepted without re-falsifying deeper internals**
- Existing non-target gates (`runtime-proof`, `agent-path`, `dock-registry`, `one-skin`, etc.) were accepted based on cold green results rather than additional bespoke sabotage in this verification round.

## Defects

1. **None.** No reproducible WO-103 defect found under the requested checks.

## Cleanup Note

I removed the filesystem worktree path (`/tmp/qf-verify` no longer exists), but `git worktree` metadata cleanup was blocked in this environment with:
- `failed to delete .../.git/worktrees/qf-verify: Device or resource busy`

It remains listed as `prunable`.  
If you want it fully gone from metadata on your side, run:

- `git worktree prune --expire now`  
- or `git worktree remove --force /tmp/qf-verify`
