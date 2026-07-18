# START_HERE.md

> **The single front door to QuantFlow. Read this in full before doing anything — human or AI.**
> If any other document, comment, or prior message contradicts this file, **this file wins.**
> Born 2026-07-17 · Base: fork of collaborator-ai/collab-public (v0.8.3) · Working branch: `QuantFlow` · Docs graduated 2026-07-18 (WO-002)

---

## 0. Mission (fixed)

**QuantFlow is a Linux-first, single-user spatial operating console for AI-assisted quantitative research** — v1 domain: sports betting markets (Bovada; UFC, tennis, football). Agent sessions, execution environments, datasets, tickets, artifacts, and evaluations are **typed objects on an infinite canvas**. Agents stream visible work into tiles, delegate through validated relationships, and publish durable versioned artifacts. Every action carries an end-to-end trace.

Research-only: QuantFlow **never places bets or executes trades**. It proposes, backtests, criticizes, evaluates, and reports — the operator acts in the world.

## 1. The one rule

**The Kernel owns truth. Everything else is a projection or a cache.** The Kernel is a typed ontology (objects · links · actions) in local SQLite. Any change that makes something remember state outside the Kernel is rejected on sight.

## 2. The defining v1 workflow (everything else is scope creep until this runs)

```
Hypothesis → Dataset (versioned, point-in-time fenced) → Backtest Run (local | sandbox)
→ Artifact (hashed, durable) → Critic (adversarial, separate session)
→ Evaluation (CLV, ROI, Monte Carlo bankroll) → Report (full lineage)
```

## 3. Authority documents

1. **This file** — mission and rules.
2. **`DOC_AUTHORITY_MAP.md`** — is any doc CURRENT / REFERENCE / ARCHIVE.
3. **`docs/BLUEPRINT.md`** — the seven-layer architecture and decided stack. **`docs/ONTOLOGY_SCHEMA.md`** — the typed schema, frozen v0.1. **`docs/ROADMAP.md`** — the work-order ladder and phase gates.
4. **`docs/orders/`** — active work orders (`PROTOCOL.md` = rules of engagement). Work happens **only** through a work order.

The predecessor repo (`SidNig21/QuantFlow`) is the **parts shop**: read-only reference, organ harvest by explicit order only. Never copy code from it without an order saying so.

## 4. Toolchain

Bun + TypeScript strict (orchestration) · Electron shell inherited from Collaborator (canvas/tiles/PTY — projection only) · SQLite Kernel · Python sidecar for numeric work (arrives by order) · Parquet/DuckDB for bulk series · MCP tools **generated** from the schema, never hand-grown.

## 5. Hard rules for all agents (builders and residents alike)

1. Read this file, then the order you're executing. No order, no work.
2. No new truth stores. Ever.
3. Every change ships with a runnable `qa/` gate; the founder verifies outcomes, not diffs.
4. **No self-approval** — the agent that built a change is never its verifier.
5. Lockfiles are committed. Descriptions on every schema entity. LF line endings (.gitattributes enforces).
6. Windows-era thinking is dead: this repo is Linux-first from birth; platform-dependent code takes an injectable `platform` parameter.
7. Upstream (`collaborator-ai/collab-public`) stays a configured remote: `main` tracks it pristine for future pulls; QuantFlow work lives on `QuantFlow`.

## 6. License

FSL-1.1-ALv2 (inherited). Free to build on; do not position QuantFlow as a general-purpose Collaborator substitute. Each upstream release converts to Apache-2.0 after two years.

---

*Keep this file short. Update it only by deliberate decision, and note the date at the top.*
