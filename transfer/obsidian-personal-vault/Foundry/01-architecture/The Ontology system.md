---
tags: [foundry, ontology, architecture, free-tier]
source: https://palantir.com/docs/foundry/architecture-center/ontology-system/
fetched: 2026-07-22
---

# The Ontology system

> Heart of the architecture. This is the main free-tier learning target.

The Ontology represents **interconnected decisions**, not only data — so humans and AI agents can collaborate on operational workflows.

Examples in the docs: airline (flights, aircraft, crew…), hospital (patients, beds, supplies…), military readiness/ops.

## Four-fold model: data · logic · action · security

1. **Data** — unify ERP/CRM/sensors/etc. into **objects, properties, links** (semantics / “nouns”).
2. **Action** — “verbs”: from simple transactions to multi-step writebacks to operational systems (kinetics).
3. **Logic** — powers actions: business rules, ML, LLM functions, multi-step orchestration.
4. **Security** — woven through all three; different humans/agents get different scopes; actions and functions can have finer permissions than reads.

### Medical manufacturing vignette (docs)

Plants, work orders, customers, packages, shipments as objects. Production vs warehouse vs supply-chain analysts get different access. Agents inherit user or project scopes. Purchase-order triggers vs scenario runs vs LLM functions can each have different permission shapes — reconciled at interaction time.

## Language · Engine · Toolchain

Ontology is **not** a thin “semantic layer.”

| Piece | Role |
|-------|------|
| **Language** | Objects, links, properties; actions/automations; logic definitions |
| **Engine** | Reads (SQL, subscriptions, materializations) + writes (transactions, batch, streams, CDC) |
| **Toolchain** | Build on Ontology as backend (e.g. OSDK) + DevOps/governance tooling |

## Free-tier takeaway

Your learning path is: map data → **object/link types** → **Actions** → use in **Object Explorer / Workshop / AIP**. Skip enterprise agent-fleet tooling until/unless it shows as GA on Your Plan.

← AIP, Foundry, and Apollo · → The Multimodal Data Plane
