> **Active track:** [`docs/orders/NEXT.md`](docs/orders/NEXT.md) names the one active rung, and
> [`docs/orders/GOLDEN-RUN.md`](docs/orders/GOLDEN-RUN.md) holds the route and the rung status table.
> **This line deliberately states no status.** It used to, and it went stale: on 2026-08-03 it still
> announced the builder door was closed while `NEXT.md` named an active rung. A status copied into a
> second file has no mechanism to stay true, so this one points instead of asserting.

# START_HERE.md

> **The single front door to QuantFlow. Read this in full before doing anything — human or AI.**
> If any other document, comment, or prior message contradicts this file, **this file wins.**
> Born 2026-07-17 · Base: fork of collaborator-ai/collab-public (v0.8.3) · Work: `main` via short-lived order branches (`QuantFlow` branch retired 2026-07-24; history only) · Docs graduated 2026-07-18 (WO-002)

---

## 0. Mission (fixed)

**QuantFlow is a Windows-first, single-user, ontology-centered quantitative research and learning environment.** Its default front door is **Research Director**, a custom Hermes Agent Profile. Ryan states a research mission naturally; the Director uses governed Kernel actions to plan, recruit exact specialists, assign work, and route evidence. The canvas automatically reveals that active work and lets Ryan steer it. The Dock is optional manual inventory and control. Quantitative research is the invariant domain, sports betting is the first application, and QuantFlow never places a bet or trade.

## 1. The one rule

**The Kernel owns truth. Everything else is a projection or a cache.** The Kernel is a typed ontology (objects · links · actions) in local SQLite. Any change that makes something remember state outside the Kernel is rejected on sight.

At the canvas seam this rule is spelled out as **Canvas-seam Laws A–F** (`docs/LAWS.md`), which carry the same weight as this section. Short form: **a tile that remembers is a bug**; `Tile = render(projection) + dispatch(action)`; commands are rejectable, events are replayable, and the event log is the receipt log.

## 2. The product and domain loops

Primary product loop:

```
ASK → PLAN → WORK VISIBLY → STEER → REVIEW → LEARN
```

First governed domain loop:

```
Hypothesis → Dataset (versioned, point-in-time fenced) → Run (local | sandbox | training)
→ Artifact (hashed, durable) → Critic (independent session)
→ Evaluation (CLV, ROI, calibration, declared criteria) → Report (full lineage)
```

The domain loop serves the product loop; neither the research chain alone nor manual team composition is the complete product.

## 3. Authority documents

There are seven, and nothing else binds. If a document is not on this list, it cannot authorize work.

1. **This file** — mission and rules.
2. **`docs/orders/NEXT.md`** — the build authority (DOCTRINE A9). It names exactly one active rung, or closes the builder door. No agent selects work it does not name.
3. **`docs/DOCTRINE.md`** — the plan of record: why the ontology, the phases, the founder amendments. Where it and an older doc disagree on *direction*, it wins.
4. **`docs/LAWS.md`** — the Canvas-seam Laws A–F. Same weight as §1 of this file.
5. **`docs/orders/PROTOCOL.md`** — rules of engagement, roles, evidence standard.
6. **`docs/DEBT.md`** — the debt register. Binding, but blocks nothing.
7. **`docs/adr/`** — accepted decisions with their reasons. A later ADR explicitly supersedes an earlier one.

The route to the golden run is [`docs/orders/GOLDEN-RUN.md`](docs/orders/GOLDEN-RUN.md), and it holds
the **only** rung status table — the `rung-ladder` gate fails the build if any other authority
document grows a competing one. [`docs/orders/SPRINT.md`](docs/orders/SPRINT.md) tells a builder how
to walk that ladder continuously and where it must stop. Neither authorizes work; `NEXT.md` does.
The current R18-R25 outcome contracts are condensed in
[`docs/plans/INSTITUTIONAL-BUILD-PLAN.md`](docs/plans/INSTITUTIONAL-BUILD-PLAN.md).
That plan explains the destination but cannot open the Builder door.

Two surfaces are **generated and cannot go stale** — prefer them over any prose: `qf-kernel-schema/golden/ONTOLOGY.md` for the live schema (byte-checked against the generator), and `bun qa/run.ts --list` for the live gates.

If this branch has `qf-atlas/`, `qf-atlas/ATLAS.md` is a generated wiring map of the current tree — not Kernel truth, not the running app, not an order. Read it before changing IPC or SQL write paths. Regenerate it at the end of a rung (`bun qf-atlas/generate.mjs`). It cannot authorize work.

`docs/history/` is superseded material, kept for reasoning. **Nothing in it is authority and nothing in it reactivates by being read.**

The predecessor repo (`SidNig21/QuantFlow`) is the **parts shop**: read-only reference, organ harvest by explicit order only. Never copy code from it without an order saying so.

## 4. Toolchain

Bun + TypeScript strict (orchestration) · Electron shell inherited from Collaborator (canvas/tiles/PTY — projection only) · SQLite Kernel · Python sidecar for numeric work (arrives by order) · Parquet/DuckDB for bulk series · MCP tools **generated** from the schema, never hand-grown.

## 5. Hard rules for all agents (builders and residents alike)

1. Read this file, then the order you're executing. No order, no work.
2. No new truth stores. Ever.
3. Every change ships with a runnable `qa/` gate; the founder verifies outcomes, not diffs.
4. **No self-approval** — the agent that built a change is never its verifier.
5. Lockfiles are committed. Descriptions on every schema entity. LF line endings (.gitattributes enforces).
6. Windows is the primary product target. Platform-dependent code still takes an injectable `platform` parameter, but every release floor must pass natively on Windows before secondary-platform work counts.
7. Upstream (`collaborator-ai/collab-public`) stays a configured remote for future pulls. QuantFlow work lives on `main`.
8. **Substrate triage — three buckets, five minutes, no reconciliation weeks.** Every new tool the ecosystem ships gets classified on sight, never "evaluated":
   - **Dock item** — has a CLI, spawns as a seat, acts on the Kernel. *It depends on QuantFlow.* **Adopt freely; it is inventory.**
   - **Underlayer** — wants to run beneath all dock items. *QuantFlow would depend on it.* **Log it. Adopt only on a measured failure, with the trigger written down.**
   - **Neither** — logged, not evaluated.

   The dependency arrow is the whole test. A thing that plugs into the desk is free; a thing the desk plugs into is expensive. **Substrate proposals get logged, not evaluated, until the Research plane exists** — the ecosystem generates one of these every week and none of them advance the world model.

   Apply the dependency-arrow test per layer, never per brand. Historical products and predecessor integrations do not become QuantFlow architecture merely by appearing in research notes.

## 6. License

FSL-1.1-ALv2 (inherited). Free to build on; do not position QuantFlow as a general-purpose Collaborator substitute. Each upstream release converts to Apache-2.0 after two years.

---

*Keep this file short. Update it only by deliberate decision, and note the date at the top.*
