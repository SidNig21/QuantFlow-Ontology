## Plain-language summary

This order is aimed at the right problem: write tools currently hide their arguments from agents, and four old read helpers still sit beside the generated ones. But as written it fights itself in a few places — most sharply, it tells the builder both to add new query parameters (which must change the generated catalogue) and to leave that catalogue byte-identical, and it bans old function names from the app tree in a way that also bans unrelated UI labels and leaves out several real call sites. Until those collisions are fixed in the order text, a careful builder can fail by following the order literally, or pass gates that do not prove what the order claims.

---

## Measured-claims table

| Claim | Verdict | What I measured |
|---|---|---|
| `tools/list` override works; `callTool` stays passthrough | **Sound** | Reproduced against `@modelcontextprotocol/sdk` in-repo: override advertises real props; `callTool` returned `{"anything":1,"kind":"single"}` untouched. |
| `McpServer.server` public (`mcp.d.ts:18`) | **Sound** | `readonly server: Server` at line 18. |
| `setRequestHandler` on Protocol (`protocol.d.ts:389`) | **Sound** | Present at line 389. |
| Real shape in `_meta["qf/inputSchema"]` | **Sound** | `register.ts:129`; live list shows action props `[]` and `_meta` present for all 24 actions. |
| Transport validator `z.object({}).passthrough()` | **Sound** | `register.ts:18` as `actionTransportInput`. |
| Served 93 (69+24); golden 94 | **Sound** | Live registration 93; `generateMcp` / `golden/tools.json` 94; one `operatorOnly` action (`observe_ticket`); 23×3 read + 24 action = 93. |
| Retirement targets `db.ts:88,95,102,109` | **Sound** | Line numbers and behaviours match. |
| Four wrappers `kernel.ts:83-99` | **Wrong (incomplete)** | Those lines exist, but there is a **fifth** wrapper: `listAgentDefinitions()` at `kernel.ts:103-105`. |
| **8 app callsites, 5 files** with listed lines | **Wrong** | Undercounts. In `agent-host.ts` alone, real uses are **134, 135, 151, 191, 263** (order lists only 135, 263). Also unlisted: `kernel.ts:60` (`listArtifacts` on open). Consumer call sites in main-process code are **12**, not 8. |
| Generated readers take `schema` (`read.ts:64,81,111`) | **Sound** | Confirmed. |
| Agent seats use mock model (cited paths) | **Sound** | Citations match SCOPES/WO-105 pattern; not re-opened here beyond grep confirmation of the files’ role. |
| 15 gates today | **Sound** | `bun qa/run.ts --list` → 15 lines. |

---

## Q1. Can each acceptance gate actually fail?

### G1 — advertisement real and derived
**Can fail:** yes, with honest baits (a)/(b)/(c).

**Passing cheat that violates the claim:**
- Implement `tools/list` by returning a **frozen snapshot** of today’s 93 schemas (copied once from `golden/tools.json`), while still registering tools from the live schema. Bait (a) fails only if the gate mutates the live handler’s output and the snapshot is what the gate reads — a builder can make the gate compare snapshot-to-snapshot.
- Stronger cheat: gate deep-equals **only `properties`/`required` for one canary tool** (or only property counts). Bait (a) “hand-edit one advertised property” can be satisfied by editing that canary; the other 92 stay unchecked.
- Bait (c) is the strongest of the three; a gate that always re-loads from `generateMcp(schema)` (or from regenerated golden) and compares to an advertisement that does the same is the intended shape, not a cheat. Say so: **I cannot construct a durable cheat that survives baits (b) and (c) together if both are implemented as written against the live served plane.** The residual risk is a gate that only ever exercises one known row / one tool.

### G2 — MCP still not a validator
**Can fail:** yes; the bait (swap in the real Zod schema) is well-aimed.

**Passing cheat:** assert only that *some* error string is returned and that **one** table has zero new rows, without checking the **events** log or confirming the error class is Kernel GATE 1 (`Unrecognized key` / strict parse) rather than a later failure. Or call a tool whose handler catches and stringifies errors without proving `execute()` ran. The order’s “Kernel’s error visible” is checkable; a vague `isError: true` check is not.

### G3 — operator door absent (93/93/94)
**Can fail:** yes if sets are derived live.

**Passing cheat (High):** hardcode three fixtures — advertised names = current 93, served names = current 93, golden includes `qf_observe_ticket`. Bait “remove `operatorOnly` from `observe_ticket`” changes **live** registration to 94, but a gate that never re-enumerates registration and only checks the hardcoded arrays **stays green**. This is exactly the “count/set that happens to match” failure mode WO-105’s verification said it had killed for `tool-plane`. D4 says counts must be derived; **G3’s own text still nails the magic numbers 93/93/94**, inviting a hardcoded implementation.

### G4 — verbs gone
**Can fail:** yes as a string/export presence check.

**Passing cheat:** delete the four `db.ts` functions but leave **thin re-exports or aliases** under different names that still wrap the old SQL (`listAllArtifacts`, etc.) — “two tools for one job” remains; the bait only catches reintroducing the *old names*.

**Worse — structurally near-unsatisfiable as literal text:** “No `listArtifacts` … remains in `packages/qf-kernel/src` or `collab-electron/src`” also hits **renderer/preload IPC API names** (`preload/shell.ts:58`, `preload/universal.ts:158`, `windows/artifact-tile/.../App.tsx:30`). Those are not the Kernel verbs D3 deletes. A literal name-ban gate goes red forever unless the order renames the UI API (not in deliverables) or narrows the match (e.g. `export function listArtifacts`).

### G5 — boot path not silently shrunk
**Can fail:** yes if seeded rows are independently counted after reconcile.

**Passing cheat:** seed **101 rows** but only ≤100 in statuses `reconcileStaleSessions` actually closes (`starting|running|blocked|cancelled|failed`); the rest are already `closed`. Gate “every seeded row is closed” passes without ever needing `limit > 100`. Alternate cheat: assertion uses the **same limited query** as the boot path (`rows.length === closedCount`), so both sides see ≤100.

### G6 — cold suite, 16 gates, golden identical
**Can fail:** yes (suite red).

**Passing cheat:** not really for the suite itself. **Internal collision with D2** (see Q3): if D2 changes query tool input schema, golden **cannot** stay byte-identical to today’s committed tree. A builder who keeps golden identical by **not** advertising new query params then fails D2/D1/G1; one who updates golden fails a literal reading of G6.

---

## Q2. Does each deliverable have exactly one meaning?

### D0 — amend `SCOPES.md`
**Mostly one meaning.** Second reading: how much of the WO-106 SCOPES section to rewrite (gate line only vs retirement paragraph that still sounds like a live-agent proof). Low.

### D1 — honest `tools/list`
**Second readings (Medium–High):**
1. Override handler emits schemas from **`generateMcp(schema)` live** vs by **reading `golden/tools.json`**. Ruling 1 allows both (“same generator output”); they diverge the moment golden is stale mid-edit.
2. “`execute()` remains the sole rejecting layer” — for **actions** (passthrough kept) vs **all tools**. Read tools already validate via Zod on `registerTool` today; two builders can “fix” or “leave” that and both cite D1.
3. “Complete” advertisement (G1) vs D4’s **properties + required only** — different equality bars.

### D2 — ordering + unbounded `queryObjects`
**Multiple meanings (High):**
- Unbounded sentinel unnamed: `limit: null`? omit? `Infinity`? `0`? (golden today has `exclusiveMinimum: 0` on limit — `0` is illegal in MCP schema).
- Ordering API unnamed: `order: "asc"|"desc"`? `orderBy`? boolean?
- “Existing callers keep current observable behaviour” vs D3 forcing ASC on definitions callers — which callers count as “existing” (MCP tool vs Electron)?

### D3 — delete four verbs, migrate “8 callsites”
**Multiple meanings / closed list is false (High):**
- Order’s “8 callsites” omits `agent-host.ts:134,151,191` and `kernel.ts:60`.
- Does not mention `packages/qf-kernel/src/species.ts:34`, `index.ts` / `portable.ts` re-exports, or **qa gates** (`agent-path`, `dock-registry`) that import the same symbols.
- Two builders: (A) migrate only the eight listed lines; (B) migrate every compile break. Both can claim D3; only B can pass G4/G6.

### D4 — sufficiency gate `tool-discovery`
**Second reading (High):** “one named end-to-end task” is **never named**. Create-ticket? Six-stage workflow? Boot reconcile? Two builders pick different tasks; both satisfy the sentence.
Also: “Expect 16 gates” is a count check another gate can hardcode (same class as G3).

### D5 — founder demo
**Two readings of “say so and stop” (High):**
1. Stop the **whole order** if no real model/API key (blocks ship on non-gate evidence; collides with Ruling 2).
2. Stop **faking the demo**, report D5 skipped, continue D0–D4/G1–G6.

Ruling 2 says the demo is explicitly not a gate; D5’s “stop” without defining the scope makes the deliverable two different jobs.

---

## Q3. Does the order contradict itself?

### 1. D2 / D1 require golden to change · G6 forbids it — **High**
- D2: “The MCP `_query` tool’s advertised schema must reflect any new parameter — D1’s gate will catch it if not.”
- G6: “`golden/` regenerates byte-for-byte identical.”

Adding order/unbounded to the generated query input **must** change `golden/tools.json` (query tools currently expose only `limit`/`offset`/filters). Both passages cannot be true of the same finished tree. **G6’s golden clause looks like WO-105 boilerplate and is the wrong one here** if D2 stands.

### 2. D3’s closed migration list · G4 / G6’s deletion + green suite — **High**
- D3: delete four verbs; migrate the listed **8** callsites.
- G4: those names must not remain under `packages/qf-kernel/src` or `collab-electron/src`.
- G6: full suite green.

After a literal D3: `species.ts` still imports `getAgentDefinition`; `qa/gates/agent-path` and `dock-registry` still import `listArtifacts` / `listAgentSessions` / `listAgentDefinitions` — suite breaks. G4 also still sees `listArtifacts` in preload/UI. **D3 understates the work G4/G6 demand.** The incomplete callsite table is the smoking gun (same shape as WO-105’s missed boot callers).

### 3. G4 name-ban · UI/preload `listArtifacts` — **High**
- G4 bans the string/symbol in all of `collab-electron/src`.
- D3 only retires Kernel/Electron **read helpers**, not the canvas IPC method name.

Those collide. **G4’s scope wording is wrong** (or D3 must explicitly rename the IPC surface — it does not).

### 4. Ruling 1 / D1 “sole rejecting layer” · existing read-tool Zod validation — **Medium**
- Ruling 1 / D1: keep permissive `registerTool` so “`execute()` remains the only / sole rejecting layer.”
- Measured: read tools already pass real Zod shapes into `registerTool`; MCP validates reads today; live list already shows real props for all 69 read tools.

The mechanism ruling is sound for **actions**; the “sole rejecting layer” sentence overclaims and can be read as requiring read tools to become permissive too (which would weaken reads) or as already false. **Narrow the sentence to action transport** — the overclaim is the defect.

### 5. G1 “complete inputSchema” · D4 “properties and required only” — **Medium**
Two different equality predicates for the same advertisement. A builder can pass D4/G4-sufficiency while failing a strict G1 complete-schema check (or vice versa) depending on which text they treat as law. **Pick one bar.**

### 6. D5 hard stop · Ruling 2 “not a gate” — **Medium**
- Ruling 2(b): demo is evidence; “no gate depends on it.”
- D5: “If it cannot be run … say so and **stop**.”

If “stop” means abort the order, D5 elevates a non-gate to a blocker and also fights the cold-state / no-API-key rule Ruling 2 itself cites. **D5’s stop-scope is the defective passage.**

### 7. G3 magic numbers · D4 “derived at runtime” — **Medium**
D4 forbids hardcoded counts; G3 writes “exact relation 93 / 93 / 94.” Same order teaches both. Prefer G3 worded as set relations over `operatorOnly` / generation, with 93/94 as today’s measurement only.

---

## What’s sound — do not fix

- **Ruling 2’s split** of “cold seat” into a deterministic sufficiency gate vs a labelled founder demo is the right honesty move; SCOPES currently promises something unprovable with mocks, and this order correctly refuses to forge it.
- **Ruling 1’s mechanism** (list-handler advertisement + passthrough `registerTool` validator) is probed end-to-end and matches the debt #24 fork; do not replace it with “pass real Zod to `registerTool`.”
- **G2’s bait** (swap real schema into transport → SDK error → red) correctly guards the two-validators failure WO-105 forbade.
- **Ruling 3’s behavioural deltas** (ASC vs DESC; no LIMIT vs default 100) are correctly measured against `db.ts` / `read.ts` / `reconcileStaleSessions`.
- **Keeping `operatorOnly` / `qf_observe_ticket` off the served map** is consistent with WO-105’s verification record.
- **D0-first SCOPES amend** is the right process fix for the contract/order contradiction class WO-105’s read missed.
- Most SDK and `register.ts` rows in the claims table are accurate; the dangerous wrong rows are the **callsite census** and the **“four wrappers”** undercount.The background probe finished cleanly: live `tools/list` serves **93** tools; generated golden has **94**. All **69** read tools already match generated `properties`; all **24** action tools still advertise **empty** props with the real shape only in `_meta["qf/inputSchema"]`. That measurement is already folded into the WO-106 pre-build review above.
