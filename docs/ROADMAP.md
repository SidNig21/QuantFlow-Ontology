# QuantFlow Roadmap — the work-order ladder

> Established 2026-07-18 (WO-002). The phase gates are **fixed**. Order details are planned **one phase ahead only** — numbering every order to v1.0 today would be fiction; later phases are gates plus named placeholders, detailed when the prior phase ships.
> Work happens only through `docs/orders/`. This file and the order log must agree; the log wins on status.

## Definition of done (one sentence)

**QuantFlow v1 is done when it is the founder's daily driver for making predictions in a market of his choosing** — a console he opens each week to run Hypothesis → Report on real markets and trusts enough to act on. Market-agnostic core; sports betting (Bovada) is domain pack #1, not the identity. The demo bar (v1.0 gates below) is the proof, not the point.

## Foundation checklist (closes the "research forever" door)

| # | Item | Status |
|---|---|---|
| 1 | Stack decided — exact tool per layer | ✅ 2026-07-18, `BLUEPRINT.md` |
| 2 | Schema v0.1 frozen as `experimental` | ✅ 2026-07-18, `ONTOLOGY_SCHEMA.md` |
| 3 | Canvas-seam laws A–E adopted | ✅ 2026-07-18, `BLUEPRINT.md` |
| 4 | Docs graduated + roadmap ladder | ✅ this file (WO-002) |

**Foundation is CLOSED (2026-07-18).** Further research is reference material (`vault/Research/`), never a gate. From here the only path forward is the ladder below.

---

## Phase v0.1 — "one agent, one artifact, provable" (~4–8 weeks)

Gate: one real agent path streaming into a tile · cancel/fail/retry/close · one harmless tool · one durable artifact · CI green throughout. (Fork + CI already done — WO-000.)

| Order | Title | Proves | Status |
|---|---|---|---|
| WO-001 | Codegen spike `qf-kernel-schema` — Zod → SQL + MCP tools + ONTOLOGY.md, golden/lint/determinism tests | The L0→L3 bet: schema drift becomes a failing test | **done** 2026-07-18 |
| WO-002 | Docs graduation + roadmap (this order) | The plan is repo-visible | done |
| WO-003 | Schema expansion to full v0.2 + `qa` schema-lint gate (descriptions, lifecycle, no-removal-on-active) + **legal-transition tables with generated conformance tests** + **command/event split** (§State machines in `docs/ONTOLOGY_SCHEMA.md`) | The whole frozen schema compiles, lints, and rejects every illegal transition | **done** 2026-07-18 |
| WO-004 | Runtime ownership proof: AgentOS session → ACP agent → `ToolLoopAgent`, one session ID, no second Eve server | The L2 bet — **PROOF HELD**; Mastra fallback not needed | **done** 2026-07-18 |
| WO-005 | Kernel v0: SQLite from generated migrations + trace context on every command + ledger table; **Law E gates land here** (Kernel is sole SQLite owner; no domain writes via `canvas-state`/`canvas-persistence`) | L0/L1 substrate under real writes | **done** 2026-07-18 |
| WO-006a | **Creation commands** — the Kernel can bring an object into existence through the command/event layer; `publish_artifact` is the first, with content-addressing computed and enforced. Carries debt #0 (doc↔code action-surface gate). | Law D needs an Artifact the Kernel can create; Kernel v0 could not | **done** — merged 2026-07-18 |
| WO-006b | **Kernel in the app** — Artifact tile + the Law D cold-reopen demo; app's domain truth crosses one IPC seam into `kernel.db`; first founder-verifiable order | Law D is the v0.1 phase gate's substance | **done** 2026-07-19 — **Law D PASSED**, hashes independently verified |
| WO-006c | **One agent path end-to-end** — spawn from canvas, stream into tile, publish an Artifact through the Kernel; cancel/fail/retry/close | completes the v0.1 phase gate | **open** — order written 2026-07-19 against the swappable ACP seam |

**Why WO-006b/c split (2026-07-18, verifier).** Measured before drafting: the app runs Node (Electron 40), so the Kernel needed a driver seam before it can live in-process, and the agent seam (`acp-agent.ts`, 430 lines) is a separate integration from the persistence seam. Law D — the founder-verifiable demo — needs only the persistence seam; coupling it to agent streaming would put the phase gate behind the riskiest integration. WO-006b lands Law D; WO-006c lands the agent path on top of it.

**Why WO-006 split (2026-07-18, verifier).** Writing the order surfaced that its Law D path was not buildable: `execute()` handles state transitions only, object creation exists solely as direct inserts that bypass the event log, and the `artifact` table has no status column. Rather than hand a builder an order with an unbuildable first step — the defect class that has hit three of five code orders — the headless Kernel work is WO-006a and the canvas slice is WO-006b. WO-006a is cheap, fully gate-verifiable, and does not touch Electron.

### Known debt (adversarial review of WO-001→004, 2026-07-18)

Tracked so it is not rediscovered. None blocks the ladder; each lands by order when it starts costing more than it saves.

| # | Debt | Lands in |
|---|---|---|
| 0 | ~~doc↔code action-surface drift~~ — **killed** by WO-006a's `doc-action-surface` gate, falsified in both directions by the verifier | done |
| 1 | ~~`commands.ts` drift~~ — **killed** by WO-005's bidirectional lint, falsified both directions in verification | done |
| 2 | ~~P1 forged third layer · soft P4 · `/tmp` receipt oracle · fixture cost~~ — **killed** by WO-004a: forged assertion replaced with honest table membership, P4 hardened, receipt oracle deleted | done |
| 3 | `define.ts`/`sql.ts` walk private Zod internals (`_zod`) — introduce a `FieldSpec` IR so generators are dumb printers | order TBD, before the next generator change |
| 4 | `stateFieldName` `status\|grade` heuristic — replace with an explicit `stateField` | WO-005 if it touches the state field, else with #3 |
| 5 | `schema.ts` at 645 lines — split by plane (domain / research / ops / links / actions) before the next expansion crosses 1k | before any schema growth order |
| 6 | Zod↔Kernel `content_hash` contract disagreement — `publish_artifact`'s schema input requires it, Kernel treats it as advisory-but-verified; softening the Zod field is a schema-surface edit and needs an order | order TBD, before MCP exposure |
| 7 | Creation-path cleanup — `ARTIFACT_KINDS` duplicates the schema enum inside the Kernel; `from:"(none)"`/`to:"exists"` sentinel fields fake a transition shape for creations (discriminated result type instead) | WO-006b or first creation-path touch after it |
| 8 | **Post-v0.1 tooling evaluation** — `anomalyco/terminal-control` as first driver behind a QuantFlow `ExecutionEnvironment` interface (its recording layer maps to receipts/trajectories), plus Cloudflare Code Mode and `UsefulSoftwareCo/executor`. Deliberately deferred: none is needed for Law D, and each is an unmeasured external claim until audited | evaluation order after the v0.1 phase gate |
| 9 | `golden/tools.json` 1k+ dump — compact golden + determinism check | with #5 |
| 10 | `qa/run.ts` install→test copy-paste — extract one `bunPackageGate` helper | next gate added |
| 11 | `validate.ts` takes bare `string` — should take `StatefulType` | WO-005 (it consumes `validate`) |
| 12 | `no-canvas-domain-writes` matches property-key syntax only — a dot-assignment (`tile.content_hash = x`) evades it (measured, WO-006b round 2). Realistic shapes (declared interface + object literals) are caught | next order touching that gate |
| 13 | Deliverable 6 unexercised — File → Publish Artifact never clicked by a human; Law D's seam is proven via the identical `qf:execute` IPC | founder, one menu publish |
| 14 | **Legacy agent path** — `collab-electron/src/main/acp-agent.ts` (registered at `index.ts:54`) predates the species seam, imports `@agentclientprotocol/sdk` directly, and auto-approves permissions; frozen by WO-006c's gate exception. Removal order: delete the registration + file (or port agent-chat onto the seam) and delete the gate exception with it | first order after WO-006c proves the seam |
| 15 | `one-skin` gate scans hex only — `rgb()`/`rgba()`/`hsl()` evade it (remnants in `shell.css`); extend the scan and migrate | **WO-007** |
| 16 | `.js` files outside the `one-skin` scan — the shell's legacy canvas palette is exempt by extension; scan `.js` + migrate the canvas palette to tokens | **WO-007** |

## Phase v0.5 — "one real quant workflow" (~2–4 months) — **gates detailed 2026-07-19** (founder request)

**Phase gate (unchanged, closes the phase):** the defining workflow end-to-end on real data — Hypothesis → Dataset → Backtest → Artifact → Critic → Evaluation (CLV, ROI, Monte Carlo bankroll) → Report with full lineage. Plus: 12 sessions / 4 concurrent turns · typed delegation · trace timeline · object inspector.

> **How to read this section.** These gates are **binding acceptance criteria, fixed now** so they are not relitigated order by order. Order *files* are still written just-in-time by the architect when each rung starts (one-meaning-per-deliverable needs current code context) — an order file may **refine** its gate, never weaken it. Every order inherits the standing rules without restatement: cold-state, gate-falsification (neuter → red → restore → green, both outputs in the report), Laws A–F, builders never handle credentials, builder-run vs verifier-run gate split per `PROTOCOL.md`. Entry into this phase = WO-006c verified + the founder's Law D demo passed.

### The dock contract (binds WO-007/008 and every species forever)

The dock is QuantFlow's access point — the surface where **species become sessions become tiles**. Plug-and-play is a *measurable property*, not a slogan:

1. **A "plug" is data, not code.** One species = an AgentOS software package (any ACP guest) + an `agent_definition` row (name, package ref, description, tool allowlist) + a deny-by-default permissions manifest. **Admitting a new species requires zero changes to dock or canvas source** — this is gated by diff, not assumed.
2. **The dock is a projection** (Laws A–C). It renders `agent_definition` (the registry) and `agent_session` (live sessions in their transition-table states). It stores nothing; cold reopen rebuilds it from the Kernel alone.
3. **Session lifecycle on the dock IS the schema's state machine.** `starting → running ⇄ blocked → cancelled | failed → closed`, projected live; cancel/close actionable from the dock; every change is a Kernel event row.
4. **Guests are species behind the WO-004 seam.** `ToolLoopAgent`, Hermes (`hermes acp`), and whatever the founder finds next are packages. Guest-private memory stays agent-private; the Kernel remains sole writer (Law E gates already enforce this mechanically).

### Order ladder + gates (v0.5 numbering starts at WO-007)

**WO-006d · One skin — design coherence as a gate.** *Depends: WO-006c. Slots before the dock so WO-007 is born coherent.*
- `windows/shared/qf-tokens.css`: the founder-approved token set (ground `#07090C`, surface/raised/line neutrals, accent `#B7FF00` reserved for live state, node spectrum `#2FE6CF`/`#C79BFF`, semantic ok/warn/fail, Geist + Geist Mono, 8px unit, 10px radius) plus shared primitives (buttons, inputs, chips, status dots, dialog, scrollbar, empty state). Values come from the founder's own design corpus (old canvas, `logo/cube3d.js`, flow-cube-v2 spectrum) — the builder styles nothing from imagination.
- Every window imports the shared sheet; hardcoded colors/fonts in `windows/**` migrated to tokens.
- **Gate `one-skin` (falsifiable):** red on any raw hex color or `font-family` declared outside the tokens file (measured allowlist for generated/vendor files, each entry justified in the gate). Bait a rogue hex → red; remove → green.
- The founder's aesthetic verdict is the acceptance for *look* (screenshots in the report); the gate is the acceptance for *coherence* — the part that outlives everyone's taste.

**WO-007 · Dock v1 — species registry + spawn surface.** *Depends: WO-006c.*
- Dock lists species from `agent_definition` rows; **no hardcoded species list in renderer** — falsify: insert a row via Kernel command, dock shows it without rebuild.
- Spawn from dock → AgentOS session + `agent_session` (guest-minted ID adopted) + streaming tile; all three carry the same session ID (WO-004a's measured assertions reused, not re-proven).
- Live state per transition table; cancel and close actionable from the dock; each transition lands as a Kernel event.
- **Law D for the dock:** force-kill + relaunch rebuilds registry and sessions from the Kernel alone; in-flight sessions surface as terminal (`failed`/`cancelled` per policy), never phantom `running`.
- Zero new listeners; zero orphan child processes after close (WO-004a pattern, asserted).

**WO-008 · The plug test — Hermes through the same socket.** ***done** — verified + merged 2026-07-19 (round 2).* Outcome **B**: guest overlay cannot see the host Hermes install (`HERMES_BIN not found` while host file exists); critic-mock proved the dock path; admitting commits pure under `species/**` only. Reachability → WO-008b; live turn → WO-007b + WO-008a.
- **The diff is the gate:** the admitting commit touches only `species/**` — zero dock/canvas/host/kernel/gate changes.
- Kernel adopts the **ACP** session id (Hermes carries a second, internal id — never adopted).
- No prompt in any builder gate; the founder's live Hermes turn happens after WO-008a.

**WO-007b · Host seams — the spawn god-function dies.** ***done** — verified + merged 2026-07-20.* `admitAndStartSession` / `runTurn` split; dock spawn never prompts; manifest `agent.env` measured YES; renderer env rejected at IPC; extract-first held (renderer 1767→1746).
- Split `spawnAgentSession` (admit + create + always-prompt + publish, one function, default prompt `"uppercase quantflow"`) into `admitAndStartSession` and `runTurn` — a handshake-only spawn becomes a real host capability.
- Generic session env: verify-or-reject the SDK's manifest-env-defaults mechanism (`agent-os.js:2689` comment; absent from typed surface); land `createSession` env passthrough sourced from species data — never renderer-supplied.
- Post-merge findings land: session-tile Cancel gated to legal edges (dock is; tile isn't) · `closeSession` preload asymmetry fixed · renderer's `definitions[0]` singleton leftover removed.
- **Extract-first guardrail:** `renderer.js` (~1767 lines) and `tile-manager.js` (~969) may not grow — extraction precedes any addition. Binding on WO-008a and A2A too.

**WO-008b · Hermes reachability — bundle vs authorized mount.** ***done — PROBE HELD 2026-07-20.*** Mounts work (narrow RO); guest exec is WASM-only — native Hermes/Python cannot run in-VM. Bundle same wall. Mount plumbing kept; Hermes exec → **WO-008c**.

**WO-008c · Hermes host-bridged ACP.** ***done** — verified + merged 2026-07-20.* Host `hermes acp` stdio (Outcome A); `launch.json` + packed `*.meta.json` deploy-true; one shared `host-acp-client`; AgentOS kept for Node/WASM guests. Live turn → **WO-008a**.

**WO-008a · Permission bridge + tool policy.** ***done** — verified + merged 2026-07-20.* Host `runTurn` for Hermes; allowlist + founder Allow/Deny. Plumbing held; **UX rejected by founder** — session-tile Run turn ≠ Hermes.

**Standing rule (founder 2026-07-20):** Interactive agents that ship a **native TUI** always surface that TUI in a QuantFlow **term tile**. QuantFlow does not invent a parallel chat UI for them. ACP/AgentOS session tiles remain for ACP-only guests (toolloop, etc.).

**WO-008d · Hermes tile = real TUI.** ***done** — verified + merged 2026-07-20.* Dock Spawn Hermes → PTY term tile (`hermes --tui`); Kernel session + orphan hygiene; data-driven native TUI route.

**WO-008e · A2A proof — 4 Hermes tiles.** ***done** — verified + merged 2026-07-20 (rework).* Shared `a2a-core`; spawnSeats + dispatch IPC; PTY display fail-closed; scripted proof harness-only.

> **Direction lock (founder, 2026-07-20): after WO-008e merges, the next rung is "Run Workflow v1" — Hermes commands the desk.** One task typed at the dock → an orchestrator Hermes decomposes it, spawns/staffs worker tiles through Kernel-mediated levers, collects and reviews results, and reports back. WO-008e's fan-out/review/talk-back is the scripted rehearsal; Run Workflow generalizes it to founder-driven tasks. The order gets drafted only after 008e's merged shape is measured, with a doc-attached pre-build read (how Hermes best receives levers — MCP server vs ACP bridge — is an external-surface question, cite-or-probe). Datasets (WO-009) follow, feeding the commander real research work.

**WO-009 · Datasets I — bootstrap ingestion.** ***Current rung*** (unparked after WO-008e).*
- `ingestion` Runs → `dataset` objects + content-hashed Parquet; identical source bytes → identical `content_hash` (falsify by mutating one byte).
- `as_of` + `coverage` populated; DuckDB reads Parquet via the pointer; **no bulk rows in SQLite** — gated, not assumed.
- Failure honesty: truncated/malformed source → run `failed`, **zero partial Kernel writes**.
- Lineage: `produces` / `derived_from` edges traversable from every dataset.

**WO-010 · Python sidecar (uv + polars).** *Depends: WO-009.*
- `execution_environment` kind `local_python`; TS orchestrates, Python computes. A `feature_build` Run round-trips: input Dataset → sidecar → output Dataset/Artifact, hashes verified.
- Sidecar crash / nonzero exit → run `failed` with stderr captured; **no orphan python processes** (counted before/after).
- The sidecar has **no Kernel write path** — results enter only through commands (Law E falsified with a planted direct write).

**WO-011 · Datasets II — Bovada capture (the moat).** *Depends: WO-009.*
- Capture runs as `ingestion` Runs → `odds_series` pointers + Parquet ticks; quote timestamps captured at fetch time (the point-in-time fence's raw material).
- Entity resolution v0 via `external_refs`; an unresolvable entity is **flagged, never silently invented**.
- Site-shape change → loud failure, zero partial writes; re-runs idempotent per idempotency key; capture is rate-limited and research-only.

**WO-012 · Agent contracts — Researcher / Backtester / Critic.** *Depends: WO-008a.*
- Three species **as data** (agent_definition + versioned prompt/spec Artifact + allowlist): Researcher may create hypotheses/tickets but not grade; Backtester may start backtest runs; Critic is read-mostly + findings Artifact. Cross-permission attempts rejected — falsified per species.
- Typed delegation: Researcher→Backtester handoff is a Kernel-mediated `task`/`connection` with events — **no guest-to-guest side channel**.
- Contract changes version via `derived_from`, never mutate.

**WO-013 · Backtest engine v0 + CLV.** *Depends: WO-010, WO-012.*
- `backtest` Run: Strategy spec + Dataset → graded Tickets + `result_set` Artifact; **deterministic** — same inputs → identical result hash (falsify via seed/data mutation).
- **Point-in-time enforcement is a hard failure:** any feature timestamped after event start aborts the run naming the leak — falsified by planting one.
- Per-leg CLV vs Pinnacle close where the reference exists; missing reference → explicitly null, **never imputed**.
- Parlay pricing carries the correlation-aware fields the schema defines.

**WO-014 · Critic + Evaluation (Monte Carlo bankroll).** *Depends: WO-013.*
- Critic session over a backtest Artifact → triaged findings Artifact; must catch the planted leak from WO-013's falsification corpus.
- `record_evaluation` writes the full metric set (clv_avg, roi, risk_of_ruin, expected_max_drawdown, losing-streak length, p5/p50/p95 trajectories, kelly_growth, oos_consistency); MC deterministic under a fixed seed.
- `resolve_hypothesis` stays Evaluation-gated — falsify: resolution without an evaluation → rejected.

**WO-015 · Trace timeline + object inspector (L5).** *Depends: WO-007; parallel-eligible thereafter.*
- Span tree persisted under the existing per-command `trace_id`; click any tile → its timeline (spawn → turn → tool → run → artifact → evaluation).
- **"Where did this number come from"** answerable by clicks alone — scripted founder demo like `law-d.md` is the acceptance.
- Object inspector: any Kernel object → fields + links traversal both directions. Emission is zero-config (runtime-emitted, never agent-authored).

**WO-016 · Cloudflare CPU sandboxes.** *Deferrable — founder decides at order time whether local suffices for v0.5.*
- `execution_environment` kind `cloudflare_sandbox`; one real Run executes remotely; **artifact export before teardown enforced by `produces`** — falsify: skip export → run fails.
- Credentials: founder-exported env only; CI/offline → gate skips with a clear message.

**WO-017 · The defining workflow E2E — closes v0.5.** *Depends: all non-deferred above.*
- From the dock, on real data, one operator flow: Hypothesis → Dataset → Backtest → Artifact → Critic → Evaluation → Report; lineage traversable from the Report back to every source.
- Concurrency bar: 12 live sessions · 4 concurrent turns · 30–60 min soak · independent cancellation · zero orphans · bounded queues.
- **Founder-run demo script is the acceptance** (like `law-d.md`), including a Law D pass across the whole board.

### Sequencing at a glance

```
WO-006c ─→ 007 ─→ 008 ─→ 012 ─→ 013 ─→ 014 ─┐
                 └→ 015 (parallel after 007)  ├─→ 017
009 ─→ 010 ──────────────────┬→ 013           │
  └──→ 011 ──────────────────┘   016 (optional)┘
```

Two builders can run continuously: the dock/agent lane (007→008→012) and the data lane (009→010/011) never touch the same files until WO-013 joins them.

## Phase v1.0 — "daily driver" (~4–8 months) — gates only

Workspace recipes · save/reopen · lineage view · evaluation tile · guardrails · soak tests · Linux packaging · polished demo narrative.

**Operational proof bar:** 12 live tiles · 4 concurrent turns · 30–60 min soak · bounded event queues · correct attribution · independent cancellation · zero orphan processes · artifacts survive sandbox destruction.

---

## Post-v1 (reserved, deliberately unbuilt)

RL strategy discovery (PufferLib) · recall layer "L5.5" (distill-then-embed over reports/trajectories; evidence, never state) · L6 Evolve-equivalent (experiment search with backtest metrics as fitness) · **second domain pack** (proves the market-agnostic core: a new market arrives as `kind` values + ingestion runs, zero new object types) · **the dogfood flip** (the build process moves onto the Kernel: work orders become `task` objects with transition tables, builders run as `agent_session` tiles, reports land as `artifact`s, verification as `evaluation`s — git keeps the code, QuantFlow takes the coordination; the substrate is already in the schema, and the flip is the product's own proof: if QuantFlow can orchestrate its construction, it can orchestrate research). Substrate for all of these already exists in the schema.
