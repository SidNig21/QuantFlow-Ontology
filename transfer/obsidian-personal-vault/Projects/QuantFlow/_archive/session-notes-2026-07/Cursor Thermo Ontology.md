# Thermo-Nuclear Audit: Distance to a “Real Ontology”

**Verdict:** P0 substrate is banked and real. You are **not** one modeling week from “real ontology” on the *current* charter — you are sitting on a **second, contradictory ontology** (sports-betting v0.2 in `qf-kernel-schema`) that will distort P1–P4 if you treat it as the starting point. Distance to Doctrine Phase 4 is still ~weeks of modeling + codegen **after** a structural charter replace — not after another engine.

Audited tip: `origin/feat/peer-delivery` / `origin/main` doctrine-aligned README (local `feat/peer-delivery` is 3 commits behind). Doctrine = absolute truth.

---

## 1) Distance verdict

| Doctrine claim | Repo reality |
|---|---|
| P0 banked | **True** — Kernel sole-writer, event log, artifacts, peer bus + PTY delivery, Hermes seats, canvas, falsified `qa/` |
| Charter ~14 types as code in `ontology/` | **False** — no `ontology/`; charter is `qf-kernel-schema/src/schema.ts` (**19** objects, sports-first) |
| Tools generated from schema, one MCP world plane | **False** — `generateMcp` emits dead `golden/tools.json` defs only; no live get/search/traverse server; peer-bus is the only real MCP (collab plane) |
| Research loop nouns govern Kernel | **Partial / hollow** — tables exist; most research creations are **not** Kernel commands |
| P4 one-shot proof | **Impossible today** — no traversable world tools, no Evaluation→Report gate, wrong market nouns |

**Closer than you think** on substrate. **Behind where the README implies** on world model: the code still encodes the *pre-doctrine* sports ontology.

---

## 2) Structural blockers (current codebase)

### B1 — Dual / conflicting source of truth (blocks clean P1)
- **Doctrine / tip README:** Research = Hypothesis→Dataset→Run→Artifact→Evaluation→**Report**; Market = **Venue / Instrument / Quote / MarketEvent**; ~14 types.
- **Live code:** `qf-kernel-schema/src/schema.ts` + `docs/ONTOLOGY_SCHEMA.md` = competitor / event / market / odds_series / result / strategy / ticket; **Report is an artifact kind**, not a type; no Mission / Venue / Instrument / Quote / MarketEvent.
- **Authority map still wrong:** `DOC_AUTHORITY_MAP.md` marks `ONTOLOGY_SCHEMA.md` CURRENT and vault doctrine REFERENCE; `START_HERE.md` still locks sports-betting identity.
- Starting P1 by *adding* `ontology/` beside this = **two charters**. That is the spaghetti growth mode the rubric forbids.

### B2 — Schema is a catalog, not an executable world
`schema.actions` includes `create_hypothesis`, `register_dataset_version`, `record_evaluation`, etc., but `creationCommands` / handlers only implement:

- `publish_artifact`
- `create_agent_session`
- `register_agent_definition`

(`packages/qf-kernel/src/create.ts`, `qf-kernel-schema/src/commands.ts`)

`insertRun` in `insert.ts` is an informal bootstrap helper — **not** a governed action. `resolve_hypothesis` description claims evaluation-gating; `execute.ts` only flips status. **No `publish_report`. No Evaluation→Report mechanical gate.** Links table is generated; there is no agent-facing link write/traverse path.

This is the wrong-layer smell: ontology nouns on paper, Kernel verbs only for agent/session/artifact.

### B3 — MCP dual plane risk is already half-true
- **Collab (keep):** `tools/qf-peer-bus` — `list_peers` / `send_to_peer` / `read_inbox` — hand-grown, correct for agent↔agent.
- **World (missing):** `qf-kernel-schema/src/generate/mcp.ts` emits `qf_*_get` / `qf_*_query` + `qf_<action>` JSON only. No `traverse`. No server. No Kernel `execute()` / read binding. Seats cannot do the one-shot test through generated tools because **there are no generated tools that run**.

Do not grow a third hand-written `qf_*` ontology server “until codegen is ready.” That freezes dual planes permanently.

### B4 — 1k-line cliff + tool explosion
- `qf-kernel-schema/src/schema.ts` = **819 lines**. Part IV + sports retention → past 1k and past a maintainable charter.
- `tools.json` already ~65 tool *names* for the fat schema, all unwired. Keeping sports types *and* doctrine types → agent tool surface becomes unusable noise. Codegen must **shrink** the charter, not amplify it.

### B5 — Ops-plane type sprawl vs Doctrine Part IV
Live objects include `workspace`, `task`, `tool`, `connection`, `execution_environment`, plus betting spine types. Doctrine’s agent plane is basically `AgentDefinition` / `AgentSession` (+ trajectories as Artifacts). Extra canvas wiring types are fine as *projections later*; as Kernel object types they compete with the ~14-type discipline and bloat get/query.

### B6 — Doc↔code gate protects the wrong charter
`qa/gates/doc-action-surface.ts` locks `docs/ONTOLOGY_SCHEMA.md` ↔ `schema.ts`. Until authority flips, CI will fight Doctrine Part IV.

---

## 3) Code-judo target architecture (P1–P2)

**One pipeline. No second ontology.**

```
ontology/                    ← sole charter (TS modules)
  research.ts  market.ts  agent.ts  index.ts
        │
        ▼
qf-kernel-schema/            ← define + lint + generate only (no domain nouns)
  define.ts · lint (Part VI rules)
  generate/
    sql.ts          → golden/migration.sql
    mcp-server.ts   → tools/qf-ontology-mcp/ (get/search/traverse + actions)
    client.ts       → typed Kernel command helpers (optional, thin)
        │
        ▼
packages/qf-kernel           ← sole writer: generic create/transition/link + special publish_artifact
        │
        ▼
Hermes seats                 ← MCP: peer-bus (collab) + ontology-mcp (world)
```

**Judo moves (delete complexity):**

1. **Replace** `schema.ts` domain content with Doctrine Part IV; do not parallel it. Demote `docs/ONTOLOGY_SCHEMA.md` to ARCHIVE/REFERENCE; update `DOC_AUTHORITY_MAP` + `START_HERE` so doctrine wins.
2. **Split charter by plane** before it crosses 1k — `ontology/*.ts` assembled into one `Schema`; keep `defineObject` / lifecycle / description lint (already strong in `define.ts`).
3. **Generic Kernel create** from charter property shapes for ordinary creations; keep special-case handlers only where physics demands it (`publish_artifact` hash identity). Kill per-type orphan actions that can’t execute.
4. **MCP codegen emits a server**, not JSON theater: one boring handler table — `get` / `search` / `traverse_links` → SQLite reads; actions → `execute()`. Peer-bus stays separate. No framework.
5. **`pipelineFed: true`** on Quote / MarketEvent (and any pointer bulk) → codegen emits **no** write tools (Golden Hammer lint).
6. **Report as first-class type** (Doctrine) with `publish_report` rejected without passing Evaluation — one atomic Kernel command, not “artifact kind + hope.”
7. Sports types (`competitor`/`ticket`/…) → **delete from Kernel charter for P1–P3**, or defer as a later *row vocabulary* under Instrument — not a second plane of object types beside Venue/Instrument.

---

## 4) Phase-by-phase work + exit gates

### P0 — BANKED (do not rebuild)
Kernel, event log, artifacts, peer bus, Hermes seats, canvas, gate culture.

### P0.5 — Structural cleanup (**required before / as first commits of P1**)
| Work | Exit gate |
|---|---|
| Authority: Doctrine Part IV + tip README win; archive sports schema doc | `DOC_AUTHORITY_MAP` + `START_HERE` agree; doc-action gate retargeted or removed |
| Replace live charter with ~14 doctrine types in `ontology/` | `schema.objects.length` ≈ Part IV; no competitor/ticket as canonical types |
| Split files so no charter file approaches 1k | `wc -l ontology/*.ts` each ≪ 1k |
| Drop or stub-unwire non-executable actions | Every `creationCommands` + transition action has a Kernel path **or** is removed from schema |

### P1 — Charter as code
| Work | Exit gate (Doctrine) |
|---|---|
| Descriptions, links, actions, lifecycle on every type | Lint red on missing description / Run subtype clone / remove-or-retype on `active` — **bait-falsified** |
| Add Part VI lints: property-count ceiling, no type-name embedding kind enums, `pipelineFed` ⇒ no write tools | Bait commits go red |

### P2 — Generated world MCP
| Work | Exit gate (Doctrine) |
|---|---|
| Extend codegen: live MCP get/search/traverse + action tools on `@modelcontextprotocol/sdk` | New object type → tools appear with **zero** hand tool code; Hermes lists/calls cold |
| Retire any hand-grown *world* `qf_*` (peer-bus verbs stay) | Seats’ world allowlist = generated server only |

### P3 — One market pipeline
| Work | Exit gate |
|---|---|
| One Bun/cron pipeline → Instrument / Quote / MarketEvent via Kernel commands + ingest trace | Provenance recomputable; seat answers a cross-object question on **real** rows via generated tools only |

### P4 — Defining loop = REAL ONTOLOGY
| Work | Exit gate |
|---|---|
| Hypothesis → Dataset → Run → Artifact → Evaluation → Report; Evaluation gates Report; all via actions; trajectories recorded | One-shot: *last Run on Hypothesis X, which Evaluation gated it, re-run on newer Dataset?* — **tools-only, one pass, Kernel-recorded** |

### P5 / P6 — Out of scope for “real”
FTS5/sqlite-vec recall, category deny-list, Evaluation-as-fitness / Evolve. Mention only: do not start them to feel progress.

---

## 5) What NOT to build

- Foundry / competitor chassis / new agent harness / canvas rewrite / Effect orchestrator (until P4 Runs actually need it)
- A second charter doc or `ontology/` **beside** an unreformed `schema.ts`
- Hand-grown world MCP “temporarily”
- Keeping sports object types “just in case” through P2 codegen
- Per-action snowflake Kernel handlers for every CRUD
- Recall, permissioning theater, marketplace, multi-tenant
- Treating `golden/tools.json` as done for P2

---

## 6) Approve / block starting P1 as-is

### **BLOCK starting P1 on the current architecture.**

Not because define/lint/codegen seams are wrong — those are the right judo surface (`define.ts`, `generate/sql.ts`, description/lifecycle lint, transition↔command join). Block because:

1. Live charter **contradicts** Doctrine Part IV.
2. Most charter actions are **non-executable theater**.
3. MCP world plane is **JSON-only**.
4. Adding `ontology/` without replacing `schema.ts` creates dual type systems — the failure mode this audit exists to stop.

**Conditional path to APPROVE P1:** first landing is the P0.5 replace (authority + Part IV charter in `ontology/` + shrink/delete sports Kernel types + executable create path for research nouns). That *is* P1’s modeling week if you refuse to keep two ontologies. Modeling on top of competitor/ticket/event without that replace is not P1 — it is reinforcing the wrong world.

---

**Bottom line:** Stop extending the sports schema. Point the existing codegen gun at Doctrine Part IV, make Kernel+MCP the boring consequence of that charter, and keep peer-bus as the only hand-grown MCP. Until that replace lands, “start P1” will manufacture spaghetti and miss the one-shot proof.



### What it will take (sequence)

0. Do not rebuild P0 — Kernel, peer bus, Hermes seats, canvas, gates. Finished.

P0.5 — Structural cleanup (blocker; first commits)  
Replace the live charter with Doctrine Part IV. Do not add `ontology/` beside unreformed `schema.ts` (dual ontology = permanent spaghetti).

- Flip authority: Doctrine Part IV + tip README win; archive sports schema doc
- Split `ontology/{research,market,agent}.ts` → one Schema into existing codegen
- Delete or demote competitor/ticket/odds_series as Kernel types (markets = rows under Instrument)
- Every schema action either executes via Kernel or is removed

Gate: one charter, ≈14 types, no sports silos as object types.

P1 — Charter week  
Descriptions, links, actions, lifecycle; Part VI lints (Misnomer, no Run subtypes, `pipelineFed` ⇒ no write tools). Bait-falsified.

P2 — World MCP (weeks 2–3)  
Codegen emits a real `qf-ontology-mcp` server (get/search/traverse + actions → `execute()`). Peer-bus stays hand-grown; world tools never do.

Gate: new type → tools appear with zero hand tool code; Hermes calls cold.

P3 — One market pipeline (week 4)  
One cron → Instrument/Quote/MarketEvent through Kernel + ingest trace.

P4 — Defining loop (weeks 5–8) = done  
Hypothesis→Dataset→Run→Artifact→Evaluation→Report; Evaluation mechanically gates Report; one-shot proof recorded. Effect only if Runs actually need it.

P5/P6 (recall, Evolve) — out of scope for “real.”