**Plain-language opener:** Every write request now gets checked against the action's declared shape before anything touches the database — but that check breaks every existing `publish_artifact` caller that sends raw file bytes or a file path, because those fields aren't in the schema.

---

## Deliverable 1 — GATE 1 at `execute()`

### Parse site

**Line 120** of `packages/qf-kernel/src/execute.ts`:

```120:120:packages/qf-kernel/src/execute.ts
  const validatedInput = actionDef.input.strict().parse(bodyForParse) as Record<string, unknown>;
```

**Sequencing (both branches):**

1. **Resolve command** (lines 103–112): `creationCommands` vs `commands`; reject unknown.
2. **Creation only — extract envelope** (lines 114–118): `extractLinkSpecs` strips `links` before parse.
3. **Strict parse** (line 120): single site, `.strict()` applied here only — ontology schemas unchanged.
4. **Handlers** (lines 122–161): creation → `executeCreation(..., validatedInput, ..., linkSpecs)`; transition → DB read/write using `validatedInput`.

`executeCreation` in `create.ts` no longer calls `extractLinkSpecs`; it receives pre-extracted `body` + `links`.

Schemas resolve from `qf-kernel-schema` via `actionByName` map built from `schema.actions`. No schema duplication. `golden/` unchanged (verified: `git diff --stat qf-kernel-schema/golden/` empty).

---

## Before / after suite runs (unpiped)

### BEFORE (parse disabled — branch baseline)

| Command | Result | `$?` |
|---|---|---|
| `cd packages/qf-kernel && bun test` | 28 pass, 0 fail | **0** |
| `cd qf-kernel-schema && bun test` | 152 pass, 0 fail | **0** |
| `bun qa/run.ts agent-path` (repo root) | PASS | **0** |

### AFTER (parse enabled)

| Command | Result | `$?` |
|---|---|---|
| `cd packages/qf-kernel && bun test` | **19 pass, 9 fail** | **1** |
| `cd qf-kernel-schema && bun test` | 152 pass, 0 fail | **0** |
| `bun qa/run.ts agent-path` (repo root) | **FAIL** — `ZodError` on `publish_artifact` | **1** |

**agent-path failure (after):**
```
"code": "invalid_type", "path": ["content_hash"], "message": "Invalid input: expected string, received undefined"
"code": "unrecognized_keys", "keys": ["path"], "message": "Unrecognized key: \"path\""
```

---

## G1 transcripts

Harness scripts (untracked, optional re-run): `packages/qf-kernel/scripts/g1-*.ts`

### Malformed — rejected before write

**1. Wrong type (transition `start_run`, `run_id` number)**
```
before: event_count=1 run_rows=1 hypothesis_rows=0
  error_names_field=run_id issues=[{"expected":"string","code":"invalid_type","path":["run_id"],...}]
after: event_count=1 run_rows=1 hypothesis_rows=0
  run_status_unchanged=queued
```

**2. Missing required field (creation `create_hypothesis`, no `success_criteria`)**
```
before: event_count=0 run_rows=0 hypothesis_rows=0
  error_names_field=success_criteria issues=[{"expected":"string","code":"invalid_type","path":["success_criteria"],...}]
after: event_count=0 run_rows=0 hypothesis_rows=0
```

**3. Unknown extra key (transition `start_run`, `__g1_unknown_extra__`)**
```
before: event_count=1 run_rows=1 hypothesis_rows=0
  unrecognized_keys=["__g1_unknown_extra__"]
after: event_count=1 run_rows=1 hypothesis_rows=0
  run_status_unchanged=queued
```

### Well-formed — accepted

**Transition `start_run`:**
```
before: event_count=1 run_rows=1 hypothesis_rows=0
after: event_count=2 run_rows=1 hypothesis_rows=0
  accepted: to=running event=run.started
```

**Creation `create_hypothesis`:**
```
before: event_count=0 run_rows=0 hypothesis_rows=0
after: event_count=1 run_rows=0 hypothesis_rows=1
```

**Creation with `links` envelope (extract-before-parse proof):**
```
before create_run+links: event_count=1 run_rows=0 hypothesis_rows=1
after create_run+links: event_count=2 run_rows=1 hypothesis_rows=1
  accepted: object_id=run-links-1 event=run.created
```

### Boundary bait — parse disabled (line 120 commented out)

```
BEFORE: event_count=1 run_status=queued
AFTER: event_count=2 run_status=running
last_event_payload={"command":"start_run","input":{"run_id":"run-bait","__g1_bait_extra__":"lands_in_payload"},...}
bait_key_in_payload=true
g1-bait-disabled exit: 0
```

Garbage extra key lands in event payload only when GATE 1 is off. Transition handlers do not reject unknown keys.

### Boundary bait — parse restored

```
BEFORE: event_count=1 run_status=queued
REJECTED: [{"code":"unrecognized_keys","keys":["__g1_bait_extra__"],...}]
AFTER: event_count=1 run_status=queued
g1-bait-restored exit: 0
```

---

## Caller findings (nonconforming input, field by field)

| Caller | Command | Nonconforming fields | Zod issue |
|---|---|---|---|
| `packages/qf-kernel/src/kernel.test.ts` (6 tests) | `publish_artifact` | `bytes` (unrecognized); `content_hash` missing when omitted | `unrecognized_keys: ["bytes"]`; `invalid_type` on `content_hash` |
| `qa/gates/agent-path/run.ts:197-201` | `publish_artifact` | `path` (unrecognized); `content_hash` missing | `unrecognized_keys: ["path"]`; `invalid_type` on `content_hash` |
| `tools/qf-peer-bus/src/bus.ts:119-123` | `publish_artifact` | `bytes` (unrecognized) | `unrecognized_keys: ["bytes"]` (out of scope to fix) |
| `packages/qf-kernel/src/kernel.test.ts` G4 / G4b | `create_ticket`, `create_run` | `grade`, `status` on creation commands | Now rejected at GATE 1 (`unrecognized_keys`) instead of handler `/does not accept/` messages — tests fail on error text, not on rejection behavior |

Per order: findings only — no `collab-electron`, no schema loosening, no second envelope field.

---

## Judgment calls (order silent)

1. **Module-level `actionByName` map** — O(1) lookup; schema is static at import time.
2. **`ZodError` propagates unwrapped** — order says Zod issue path is sufficient; no new error class.
3. **Transition event payload uses `validatedInput` not raw `input`** — ledger stores only schema-conformant fields after GATE 1; bait used disabled-parse to prove raw `input` would carry garbage.
4. **`executeCreation` signature change** — takes `(body, links)` separately so extraction and parse happen only in `execute()`.
5. **G1 harness scripts left untracked** — re-runnable evidence; not part of deliverable commit unless you want them.

---

## Standing closer — suspected order defect

**`publish_artifact` is structurally incompatible with GATE 1 as written.** The Kernel has always accepted kernel-only transport fields `bytes` and `path` (see `create.ts:resolveBytes`, `agent-path/run.ts:200`, `bus.ts:123`), but the Zod schema only declares `{ kind, content_hash, storage_ref }`. The order permits exactly one envelope field (`links`), forbids a second, forbids schema loosening, forbids fixing callers — yet names `agent-path` as a before/after risk check that **must** call `publish_artifact` with `path`. Enabling strict parse makes that gate and 6 kernel tests fail with no in-scope remediation. This looks like a missing prerequisite order to either add `bytes`/`path` to the schema (with `golden/` regen) or formally designate them as envelope fields with a strip step — the declared risk is measured, but the order offers no lawful fix within WO-105's hard outs.

Secondary: G4/G4b kernel tests assert handler error **wording** for `grade`/`status` on creation commands; GATE 1 now rejects earlier with `ZodError`. Behavior is correct; tests need a follow-on update the order doesn't authorize here.

---

## Working tree

```
 M packages/qf-kernel/src/create.ts
 M packages/qf-kernel/src/execute.ts
?? packages/qf-kernel/scripts/   (G1 harness — optional)
```

`golden/` unchanged. Not committed per instruction.
