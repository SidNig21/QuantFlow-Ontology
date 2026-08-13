# QuantFlow GoalBuddy Goals (v3)
## Complete goal definitions — all 7 goals

**v3 merges:** canonical migration inventory + repo-aligned Goal 2 wording from **`quantflow-goalbuddy-goals.md`**, dual-channel architecture + MCP `pty_*` tools + enriched Goals 6–7 tracks from **`quantflow-goalbuddy-goals2.md`**.

**Quality standard applies to every goal:**
Every goal must produce production-quality output. No stubs left in place of real implementation.
No "good enough for now" shortcuts on typed surfaces, test coverage, or error handling.
The bar is: would you trust this code at 40x leverage with real money? If no, it's not done.

**Spec authority:** Read [[Cursor Opus QuantFlow Plan — INDEX]] before starting any goal.
The INDEX defines which spec file wins when two files conflict. Never implement from a superseded file.

**Orchestration spine:** [[Cursor Opus QuantFlow Plan — Orchestration & flow spine]] + repo `QuantFlow/docs/phase-7.5-orchestration-spine.md` — use for correlation/runs/registry when §5/§3 diverge from prose.

**Canonical copy:** This file (`quantflow-goalbuddy-goals3.md`) is the **single GoalBuddy playbook** alongside the INDEX; bump the migration inventory below when you ship new SQL.

---

## Repo migration inventory (canonical)

**Checked:** `quantflow-electron/src/main/runtime-state/migrations/` — **`001`**, **`002`**, **`003`** only (`database.ts` registers versions **1–3**). **No `004`**, **no numbering gaps.**

| File | `schema_migrations.version` |
|------|------------------------------|
| `001-initial.sql` | 1 |
| `002-orchestration-spine.sql` | 2 |
| `003-task-message-schema.sql` | 3 |

**Next DDL milestone:** Goal 2 → add **`004-*.sql`** and `{ version: 4, … }` in `database.ts` (never reuse **003** or renumber shipped files).

**Goal 1:** Relay + §5 lifecycle in **code/types**; add a migration **only** if the task-state graph needs new columns — if so, still use **`004`** (first free slot after **003**).

If disk or `MIGRATIONS[]` ever disagrees with this table, **trust the repo**.

---

## Dual-channel architecture principles

**Document in [[QuantFlow Unification]] (or appendix) before Goal 3 starts** so Hermes/tooling/docs stay aligned.

QuantFlow uses two distinct communication models. Tiles are categorized accordingly. **Semantic (§5) traffic and raw PTY stream tooling must not be conflated on the same abstraction without an explicit adapter.**

**Channel 1 — Semantic (agent-to-agent)**  
- Schema-validated JSON over **§5** cables / correlated tasks  
- Carries `correlation_id`, `trace_id`, `run_id`  
- Malformed messages → structured errors  
- Used by: Hermes ↔ adapters, Hermes ↔ other LLM tiles, orchestrated Pi flows over JSON  
- **Visual:** solid cables; color by **tile/cable type** (terminal=blue, note=purple, browser=teal, file=gold) per UX goal

**Channel 2 — Stream (agent-to-terminal)**  
- Raw stdin/stdout via **`quantflow_pty_write`** / **`quantflow_pty_expect`** (Goal 3)  
- No JSON contract on the byte stream — pattern/keystroke semantics  
- Used by: PufferLib, bash-heavy processes, scripted trainers  
- **Visual:** dashed blue for stream links (distinct from semantic cables)

**Script tile adapter pattern**  
- Terminal tile running an adapter bridges **Channel 1 → Channel 2 → Channel 1**  
- JSON intent in → commands via herdr → JSONL/`§5` receipt out  
- **Visual:** gold border chrome + gold accent on the adapter boundary cable

**Rule:** Production agents should not **parse unstructured PTY dribble** as their primary truth path — receipts or structured MCP reads are the handshake back to semantic layer.

---

## Goal 1 — Spine integration glue + §5 core messaging

**GoalBuddy slug:** `quantflow-goal-1-spine-glue-section5`

**Outcome:** The relay uses correlated tasks. Every send carries `correlation_id`, `trace_id`, and `run_id`. The §5 message lifecycle is live. Agents converse — they do not broadcast.

**Spec authority:**
- Primary: `Cursor Opus QuantFlow Plan — Orchestration & flow spine` §7 + §5 prep  
- Secondary: `Cursor Opus QuantFlow Plan Section 3,4,5` §5 (full narrative)  
- Patch: `Cursor Opus QuantFlow Plan Section 6,7,8  3,5v2` §5 patch (wins conflicts)

**Non-goals:**
- No §3 cable persistence yet · No §4 profiles · No Watchtower UI · No backpressure

**Tasks:**

**T001 — Relay wiring**  
- Wire `string-relay.ts` (and every cable send path) to `createCorrelatedTask` (`orchestration-service.ts`).  
- Outbound: `correlation_id` (UUID v4), `trace_id` (propagate or new root), `run_id` (null if none).  
- Reply matching + timeout (default e.g. 30s); prove with unit/integration test (`correlation_id` match).  

**T002 — §5 lifecycle state machine**  
- **Implement in code + DB**, not prose: extend `TaskStatus` / `tasks` semantics from today’s `pending | running | done | error | cancelled` toward the §5+v2-patch graph (e.g. toward `queued → delivered → sent → (replied | failed | timed_out)` — **exact names MUST match INDEX + full §5 + v2 patch after you read them**).  
- If new columns/enums required, ship in **Goal 1 only** via migration **`004-…`** if Goal 2’s `004-contracts-*` would collide — otherwise coordinate so **only one Goal 2 migration chain** owns connection DDL (prefer: lifecycle in Goal 1 without schema churn if you can map to existing columns + `events`).  
- Every transition → `events` row with `trace_id`; structured log payload `{task_id, correlation_id, from_state, to_state, tile_id, at_ms}`.  
- Replies on a **reply path**, not as fake “reverse cable sends” unless v2 §5 explicitly models it that way.  

**T003 — v2 §5 patch**  
- Apply narrowed `delivered` / `sent` semantics per v2; v2 wins on conflicts; cite in commit message.  
- Tests prove patch semantics without breaking T002.  

**Internal gate:** T001 → T002 → T003.  

**Acceptance:** T001–T003 tests · `bun test` runtime-state / orchestration / string-relay · `bun run build` · manual: cable send leaves `correlation_id` on `tasks` row.

---

## Goal 2 — §5 contracts + §3 connections

**GoalBuddy slug:** `quantflow-goal-2-contracts-connections`

**Outcome:** Typed messages where opted in; **`connections[]`** canonical persistence; malformed structured payloads get structured errors; connections survive restart.

**Spec authority:**
- §5 contracts: `Cursor Opus QuantFlow Plan Section 3,4,5` §5  
- §3 only: `Cursor Opus QuantFlow Plan Section 6,7,8  3,5v2` §3 (never §3 from `Section 3,4,5`)

**Non-goals:** §4 enforcement · Tier 3 transforms · reactive graph · gate layer  

**Tasks:**

**T001 — §5 schema validation path**  
- **`tasks`** already expose nullable **`schema_id` / `schema_version`** (`003-task-message-schema.sql`). Add **connection-level** defaults only when v2 §3 requires **`schema_id?` on persisted `connections[]`** — document **precedence** (connection default vs task override).  
- Schema registry table or JSON blob in **`runtime.db`**: `schema_id → JSON Schema`.  
- When schema active on a semantic message path, validate inbound payload; rejection shape `{error:"schema_validation_failed", schema_id, violations:[...]}`.  
- **`artifacts`:** table exists in **`002`**. Extend for `qf-blob://`, hashes, media types as needed — do not duplicate table.  

**T002 — §3 `connections[]` runtime**  
- Canonical row shape per v2 §3; persist `connections` table; canvas JSON references DB ids (DB is source of truth).  
- Compatibility checks when both ends declare schema.  

**Internal gate:** T001 before T002.  

**Acceptance:** T001–T002 tests · **New SQL = `004-*.sql` + version 4** (never collide with **`003-task-message-schema`**) · `bun run build` · manual: restart retains cable · malformed typed message surfaces error **(Watchtower when Goal 4 exists, else event log)**

---

## Goal 3 — §4 profiles + §7 MCP expansion

**GoalBuddy slug:** `quantflow-goal-3-profiles-mcp`

**Outcome:** Profiles constrain spawn/tools; **`quantflow_route_task`** resolves tiles from capabilities; one read path across tile types; **Channel 2** MCP surfaces for PTY control.

**Spec authority:**
- §4: `Cursor Opus QuantFlow Plan Section 3,4,5` §4  
- §7: **`Cursor Opus QuantFlow Plan Section 6,7,8  3,5v2` §7** — **not** `Section 9,10,11,12` (that file is §9–§12 only).  
- Dual-channel principles (above) + optional Unification appendix.

**Non-goals:** Extra MCP tools beyond T001–T005 · transforms · gate · Watchtower UI  

**Tasks:**

**T001** — Profiles + vault memory scopes (**Unification** appendix personas). Structured deny on violations.  

**T002** — **`quantflow_route_task`** → `{tile_id, pane_id?, capability_tags, current_state}` from `tile_capabilities` + keywords (no LLM routing core).  

**T003** — **`quantflow_tile_read`** — terminal / note / browser / file; herdr-backed where applicable; limitations in metadata.  

**T004** — **`quantflow_pty_expect`** `{pane_id, regex_pattern, timeout_ms?}` → `{matched, output, elapsed_ms}` (poll herdr reads per audited patterns `--source visible`, etc.).  

**T005** — **`quantflow_pty_write`** — inject into PTY via **documented herdr sequence** (e.g. `send-text` + `send-keys Enter` per `herdr-api-audit`); do not assume `pane run` if audit says otherwise.  

**Internal gate:** T001 → T002 → T003 → T004 → T005.  

**Cap:** Judge rejects scope creep beyond these five tools (new tools → future §7 extension goal).  

**Acceptance:** All T001–T005 tests · `npm test` quantflow-mcp · `bun run build` · manual: route + tile_read + pty_expect on a real pane.

---

## Goal 4 — §6 inspector + §8 reliability

**GoalBuddy slug:** `quantflow-goal-4-inspector-reliability`

**Outcome:** Limits on **semantic relay** paths; Watchtower/trace answers “why slow” from **`runtime.db`** (no mocks).

**Spec:** §6 + §8 in **`Section 6,7,8  3,5v2`** · spine Tier 1/2 tracing concepts.

**Clarifier:** Goal 4 **queue_depth / overflow** attaches to **`connections[]` semantic rows**, not dashed PTY edges (unless you explicitly model PTY bridges later).

**Tasks:** (**unchanged substance from v1/v2**) T001 real-path backpressure + `connections.queue_depth`, events on overflow · T002 Watchtower timelines, correlation groups, badges.

**Acceptance:** T001 tests overflow · T002 manual real trace · `bun run build`.

---

## Goal 5 — §9 diagnostics + §10 UX polish

**GoalBuddy slug:** `quantflow-goal-5-diagnostics-ux`

**Outcome:** **`qf doctor`** health model · QuantFlow look/feel · **dual-channel visuals** applied.

**Spec:** §9 + §10 in **`Section 9,10,11,12`**.

**⚠️ Impeccable:** Load https://github.com/pbakaus/impeccable before §10 UI passes (same token list as v2).

**Tasks:**

**T001 — `qf doctor`**  
- herdr reachable · SQLite `integrity_check` · MCP ping · **tile recency:** flag stale **`tiles_runtime.last_seen_at`** (and/or heartbeats if you add a column — align names with **actual** `tiles_runtime` schema; avoid inventing `last_heartbeat_at` unless migrated) · migration version vs `MIGRATIONS[]` · `QUANTFLOW_DIR` writable · JSON + exit codes **0/1/2** · optional `--backup-db`.  

**T002 — §10 polish**  
- Remove Collaborator chrome · Impeccable + QuantFlow tokens · **solid vs dashed vs gold** cables per dual-channel doc · agent vs script tile chrome.

**Split trigger:** T002 alone > ~500k tokens → split Goal 5b (T002 only).

**Acceptance:** doctor proofs · screenshots · Collaborator invisible in UX · `bun run build`.

---

## Goal 6 — §11 RL trading system

**GoalBuddy slug:** `quantflow-goal-6-rl-trading-system`

**Outcome:** Paper gate + adapters + bifurcated validation + lifespan rules.

**Spec:** §11 in **`Section 9,10,11,12`** · Unification §11 notes · immutable gate thresholds (Sharpe > 1, liq rate < 5%, 200 cycles, dead-man refreshed each cycle logged to vault where specified).

**Non-goals:** Live trading · Gate Worker §12 internals (HermesGate **lives Goal 7**).

**Tasks:**

**T001** — JSONL receipts + **script tile adapters** + vault trade logs (from v2 · Pydantic models referenced in T004).  

**T002** — 200-cycle reliability gate artifact in vault (**user reads file before done**).  

**T003** — Ephemeral vs persistent tiles + spawn denies + nightly reflection cron.  

**T004** — **Hard:** Pydantic on Pi receipts, zero retries, stderr `receipt_validation_failed` escalation · **Soft:** LangChain **`RetryOutputParser`** (≤2 retries) on named Hermes structured outputs (`HermesGateDecision`, etc.).  

**Internal gate:** T001 → T002 → T003 → T004.

**Acceptance:** as v2 (adapters · gate file · pydantic · retry parser · cron · tests · build).

---

## Goal 7 — §12 gate layer integration

**GoalBuddy slug:** `quantflow-goal-7-gate-layer`

**Outcome:** Unsigned Electron · Worker + reasoning path · signer sidecar · dead-man + kill-switch discipline.

**Spec:** §12 in **`Section 9,10,11,12`** · existing worker / `gate_client.py` · immutable security bullets from v1/v2.

**Tasks:**

**T001** — Worker prod · HMAC · enums · deny list **in Worker** · JWT ≤30s · KV nonce · R2 audit · kill switch KV — **proof via `wrangler tail` + R2 samples**.

**T002 — HermesGate reasoning (choose track at kickoff — do not implement both in one PR without PM split):**

- **Track A — Cloudflare Durable Object MVP (default):**
  - HermesGate DO wired to Worker when `confidence < 0.65` (threshold per spec tweak ok).
  - 3-pass reasoning inside DO (crash-safe step logging): (1) pattern / regime history, (2) risk interrogation (liq distance, ATR, funding), (3) APPROVE / DOWNGRADE→FLAT / VETO.
  - Each pass persisted to DO storage before advancing; recovery continues from last completed pass on retry.
  - Verdict mirrored to vault: `trading/genome/trades/gate/YYYYMMDD_HHMM.md` with reasoning chain.
  - DOWNGRADE: reshape intent `{action: FLAT, reason: "hermes_downgrade"}` and re-submit through gate · VETO: R2 deny, vault log, Pi-Policy correlated failure path.
  - Proof: low-confidence path runs 3 passes; vault+R2 artifacts; VETO path structured.

- **Track B — LangGraph Python sidecar (stretch):** Worker/DO routes to sidecar · LangGraph `StateGraph` + `SqliteSaver` · conditional `instant_veto` edges · Fly/WSL deploy story · **same verdict+R2/JWT contracts as Track A** (see `quantflow-goalbuddy-goals2.md` Goal 7 T002 for full detail).

- **Rule:** Security review covers **whichever track ships** (trust boundaries, JWT mint locus, no keys in Electron).

**T003** — Dead-man refresh cadence · kill-switch drill · paper signer process isolation · code review: **no private key in Electron**.

**Security review (user-signed checklist — mandatory before done; Judge cannot close alone):**
1. Gate Worker source reviewed — no embedded signing key material.  
2. Hard deny includes leverage > 40×.  
3. JWT expiry ≤ 30s everywhere.  
4. Signer isolated from Electron renderer (no shared trust surface).  
5. R2 audit sample ≥ 10 decisions.  
6. Kill switch toggles in KV verified.

**Acceptance:** T001–T003 · `wrangler tail` live · reuse Goal 6 paper harness · vault gate markdown · **`bun run build`** · user signs checklist above.

---

## Cross-goal quality standards

**Code:** No unexplained `any` · structured logging (no stray `console.log` in prod paths) · no hardcoded secrets/tile IDs · migrations forward-only/idempotent · NULL justification for nullable columns.

**Tests:** Cover new functions + error branches · avoid mocking the unit under test.  
**Persistence integration:** Prefer **file-backed `runtime.db` or temp-file DB tests** where goal proves disk persistence; an in-memory (`:memory:`) suite is acceptable for pure logic — don't fail Judge on the existing adapter pattern **if** that goal also adds a file-backed persistence test where it matters.

**Review:** User reviews each goal merge · **`pty.ts` / `index.ts` diffs** user-read · Gate goals → full security read.

**Non‑negotiable:** Goal 6 200-cycle file user-reviewed · Goal 7 security checklist · **`bun run build`** everywhere.

---

## GoalBuddy YAML template

```yaml
goal: quantflow-goal-N-slug
spec_authority:
  - "Cursor Opus QuantFlow Plan — INDEX.md (read order)"
  - "Primary spec file for this goal"
quality_standard: "Production quality. 40x leverage bar. No stubs."
tasks:
  - id: T001
    description: "one sentence"
    proof: "specific test or manual note"
    status: open
  - id: T002
    description: "one sentence"
    proof: "specific test or manual note"
    status: open
    gate: "T001 must pass first"
acceptance:
  - "bun test green for touched packages"
  - "bun run build passes"
  - "manual notes submitted"
  - "user review completed"
non_goals:
  - "explicit list of what is NOT in scope"
```

**Revision note (v3):** Merge date — carry forward corrections: §7 spec file, migration **004+**, `tasks`/`artifacts` already in **002/003**, HermesGate **Track A/B** choice, `qf doctor` ↔ `tiles_runtime.last_seen_at`, dual-channel + pty MCP from v2 goals file.
