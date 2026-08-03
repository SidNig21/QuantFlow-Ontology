## Summary

WO-105 delivered what it promised: AI agents can now call 24 write tools, every write is checked at the Kernel door before anything is saved, and the operator-only “record a real bet” button is kept out of the agent catalogue by schema flag rather than a hidden name check. The core architecture is sound, but the review found gaps between what the gates claim and what CI actually enforces, plus a real hole where strict validation only applies at the top level — nested JSON fields can still carry undeclared data into the ledger.

---

## Findings

### 1. GATE 1 is top-level strict only — nested garbage lands in the DB

**Severity: Medium**

`.strict()` is applied only to the action’s top-level Zod object at `execute.ts:122`. Nested fields declared as `z.record(z.string(), z.unknown())` / `jsonArray` (e.g. `create_ticket.legs`, `create_run.params`, `record_evaluation.metrics`) accept arbitrary inner keys.

**Failure scenario:** An agent calls `qf_create_ticket` with:

```json
{ "legs": [{ "selection": "A", "price": 1.9, "fabricated_lineage": true }] }
```

GATE 1 passes; `fabricated_lineage` is persisted in the `ticket.legs` column.

**Measured:**

```
NESTED smuggle legs stored: [{"selection":"A","price":1.9,"smuggled_field":"yes"}]
```

**Code path:** `execute.ts:122` → `create.ts` `createTicket` → row insert with unfiltered `legs`.

The tool-plane gate exercises GATE 1 only on a **transition** (`start_run` + `bogus_gate1_field`). No automated test covers nested smuggling on creation.

---

### 2. G3 bait (a) is dead code; derived set-equality fails open on `operatorOnly` removal

**Severity: Medium**

The order required G3 bait (a): strip `operatorOnly` from `observe_ticket` → harness goes red. The fixture exists but is never run:

```26:26:tools/qf-read-tools/src/harness.ts
const observeLeakSchema = join(import.meta.dir, "fixtures/observe-leak-schema.ts");
```

`observeLeakSchema` is declared and never referenced. `gateG2` / `gateToolPlaneActions` never set `QF_READ_SCHEMA_MODULE` to it.

If it were wired naïvely, the bait would **not** go red. `assertServedSet` derives expected tools from the **same** schema the server loads:

```50:62:tools/qf-read-tools/src/harness.ts
function expectedServedToolNames(schema: Schema): Set<string> {
  // ...
  for (const action of schema.actions) {
    if (action.operatorOnly !== true) {
      names.add(`qf_${action.name}`);
    }
  }
}
```

With `operatorOnly` stripped, both expected and served sets grow to include `qf_observe_ticket` — set-equality stays green. `operatorOnlyLeaks` also fails open (it only checks actions that still carry `operatorOnly === true`).

**What actually catches a production leak today:**

1. Build-time `lintCommands` / G4 tests in `define.test.ts` (observation-coupled ↔ `operatorOnly`).
2. A **hardcoded name check** in the harness:

```205:207:tools/qf-read-tools/src/harness.ts
  if (listed.tools.some((t) => t.name === "qf_observe_ticket")) {
    throw new Error("qf_observe_ticket must not be served");
  }
```

That is the name-based guard the order explicitly rejected for the lint. Runtime flag-based exclusion is not what the automated gate proves; schema lint is the real backstop.

---

### 3. G3 bait (b) and G1 disable-parse bait are not in CI

**Severity: Low**

| Order requirement | CI status |
|---|---|
| G3 (b): hand-register an action tool outside the schema loop → set-equality red | Not automated |
| G1: disable parse at `execute.ts:122`, show transition garbage in event payload, restore | Builder transcript only (`builder-report-d1-blocked.md`); no committed test |

The `tool-plane` gate would not catch a regression that removed GATE 1 entirely, unless someone re-runs the manual bait. Kernel package tests (`kernel.test.ts`) have no `unrecognized_keys` assertions.

---

### 4. `publish_artifact.path` is a new arbitrary file-read surface for served agents

**Severity: Medium**

D0 correctly declared `path` as an optional schema field. With 24 action tools now served, any MCP client can call `qf_publish_artifact` with any string `path`. GATE 1 validates type only; `resolveBytes` reads whatever path the process can open:

```29:34:packages/qf-kernel/src/create.ts
function resolveBytes(input: Record<string, unknown>): Uint8Array {
  if (input.bytes instanceof Uint8Array) return input.bytes;
  if (typeof input.path === "string" && input.path.length > 0) {
    return new Uint8Array(readFileSync(input.path));
  }
```

**Failure scenario:** Agent calls `qf_publish_artifact` with `{ kind: "report", storage_ref: "x", path: "/home/operator/.ssh/id_rsa" }`. File contents are hashed and stored as a content-addressed artifact.

**Measured:** `TEST4 path read: ACCEPTED (reads arbitrary path post-GATE1)`.

This existed for in-process callers before WO-105; it is a **new trust-boundary concern** now that agents have a served write tool for it. `qf:execute` allowlist still limits renderer IPC to `publish_artifact` only, but the MCP action plane does not.

---

### 5. Envelope mechanism — sound today, one future footgun

**Severity: Low (future schema change)**

Current behavior at `execute.ts:114-125`:

1. Creation only: `extractCreationEnvelope` strips `links` and `bytes` before parse.
2. `bytes` must be `Uint8Array` at strip time — JSON `"bytes": [1,2,3]` throws before parse.
3. After strict parse, `bytes` is re-attached; `links` stay in `linkSpecs` (not merged back into `validatedInput`).

**Smuggling:** Envelope fields cannot override declared fields in the parse body — they are removed first. No action currently declares `bytes`; re-attachment cannot collide.

**Footgun:** If a future action declares `bytes` in its Zod schema, envelope re-attachment (`{ ...validatedInput, bytes: envelopeBytes }`) would overwrite the parsed value and bypass Zod’s type constraint on that field.

**`links` on all creations:** Parallel to the logged `bytes` hole — `links` is stripped from every creation action, not rejected as an unknown key. Invalid links fail later at `writeLinks` (measured: `create_hypothesis` + bad link → `IllegalLinkError`). Valid links on actions that use the envelope by design (`create_run`) work as intended.

---

## Security / trust-boundary assessment

| Invariant | Status |
|---|---|
| `execute()` is the only write path from MCP | **Holds.** `registerActionTools` only calls `execute()`; no direct SQL in `tools/qf-read-tools`. `kernel-sole-writer` still applies. |
| `observe_ticket` not served to agents | **Holds** via `operatorOnly` filter in `register.ts:119-120`. Runtime enforcement leans on a hardcoded name check in the harness (finding 2); build-time G4 lint is the structural backstop. |
| `observe_ticket` unreachable entirely | **Does not hold** — by design (debt #22). Any in-process caller with a DB handle can still `execute(db, "observe_ticket", ...)`. WO-105 scoped serving exclusion, not caller identity. |
| RW MCP DB breaks sole-writer | **Does not break.** RW open is required for `execute()`; writes still go through the Kernel. |

---

## Areas that look sound

- **Single parse site** before the creation/transition fork at `execute.ts:122`, with envelope extraction sequenced correctly for creations.
- **Transition event payloads** now store `validatedInput`, not raw `input` — fixes the pre-WO-105 path where unknown transition keys could land in events.
- **`operatorOnly` lint** is suffix-coupled, generic, and covered by committed tests in `define.test.ts` (including the synthetic `run.observed` bait).
- **MCP transport** uses `z.object({}).passthrough()` so GATE 1 in `execute()` is the rejecting layer; harness confirms Zod issue paths surface on `callTool`.
- **Rework fix** for `fail_agent_session.reason` is the right correction (schema matches callers; gate models boot path again).
- **`bytes` over JSON MCP** cannot smuggle binary — non-`Uint8Array` `bytes` is rejected at envelope extraction.

---

## Judgment call the order left open

The D3 fork (permissive transport vs. discoverable parameters) was resolved in favor of not double-validating — logged as debt #24. The review agrees that choice is coherent with GATE 1, but it means WO-106’s “cold seat discovers parameters” goal is blocked until advertisement is fixed separately.The envelope/path probe finished successfully. Results:

- **`bytes` on `create_ticket`** — accepted (same known envelope hole as in verification)
- **`links` on `create_hypothesis`** — rejected at link validation (`IllegalLinkError`), not at GATE 1
- **Extra key on `start_run`** — rejected with `unrecognized_keys` (GATE 1 working on transitions)
- **`publish_artifact` with arbitrary `path`** — accepted; file contents were read and published post-validation

Those measurements are in the review above — especially the nested-key smuggling and `path`-based file ingest findings.
