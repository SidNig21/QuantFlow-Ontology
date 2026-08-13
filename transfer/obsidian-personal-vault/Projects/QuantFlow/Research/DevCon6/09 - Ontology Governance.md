---
tags: [quantflow, palantir, devcon6, ontology, agent-stack, schema-design]
source: https://www.youtube.com/watch?v=mzBDupsPPcs
speaker: Cody Wagemuel (Forward Deployed Architect), Jonas Lang (Forward Deployed Engineer)
duration: "30:39"
analyzed: 2026-07-17
transcription: local whisper — report.md's bundled transcript said "none available," but a separate transcript.txt was present and used (same pattern as talk 05)
---

# 09 — Ontology governance: building a robust ontology

A two-person doctrine talk: four "fundamental best practice patterns" for designing and maintaining a Palantir ontology, each paired with the anti-patterns Cody and Jonas say they see repeatedly in the field. No product demo, no new tooling — this is pure schema-design discipline, grounded in software-engineering theory (domain-driven design, DRY, open/closed, composition-over-inheritance) but reworked for objects/links/actions instead of classes/functions.

## The argument, compressed

1. **The ontology models the real world, not your data warehouse.** "How do I model your business in the nouns and verbs of how it's actually operating" — not how a reporting tool needs a data warehouse shaped, not a 1:1 copy of source system tables.
2. Four fundamental patterns, applied in this order for every new domain: **Domain-Driven Design → Don't Repeat Yourself → Open for Extension/Closed for Modification → Composition Over Deep Hierarchies.**
3. Each pattern has named anti-patterns the two have seen recur across customers — God Object, Kitchen Sink, Department Silos, System Silos, Action Sprawl, Golden Hammer, Misnomer.
4. Governance is operational, not bureaucratic: an **experimental → active** lifecycle flag on object types (a platform feature) signals when a type is production and "closed" to structural change; extension happens through **new linked types + interfaces**, not new properties bolted onto a live object.
5. The naming/description discipline is doubly important now because **agents read the ontology to decide what to do** — bad naming that used to just cost a human a Slack message to a colleague now degrades agent decision quality directly.

## Design principles, mechanisms, and named anti-patterns

| # | Principle | Mechanism | Anti-patterns named |
|---|---|---|---|
| 1 | **Domain-Driven Design** | Three ordered steps: understand the domain → design the ontology (object types, links, actions) → map source data & logic onto it — never model-from-source-schema first | **God Object** (one type represents several distinct real-world entities, polluted with team-specific/technical fields); **Kitchen Sink** (every source column mapped 1:1 even when business-meaningless) |
| 2 | **Don't Repeat Yourself** | One canonical object type per real-world entity — or an **interface** if the workflows are genuinely distinct — not one type per team/department | **Department Silos**; **System Silos** (mirrors each source system's copy instead of integrating them); **Action Sprawl** (duplicate actions across duplicate types, or over-granular single-property actions); **Golden Hammer** (building a write-action for data that should be pipeline-fed) |
| 3 | **Open for Extension, Closed for Modification** | Object types carry an **experimental → active** lifecycle flag; active/production types gain capability via new linked object types + interfaces, never new bolted-on properties | Recurrence of **God Object** via "overloading" an in-production type as new use cases pile on |
| 4 | **Composition Over Deep Hierarchies** | Flatten long parent-child chains (item → physical asset → schedulable building → arena) with a shared **interface** (e.g. `Building`) exposing common properties/actions instead of a deep inheritance chain | **Misnomer** — vague/generic type names ("item," "asset") that force people, and now agents, to go ask what the thing actually means |

## Anti-patterns, detailed

- **God Object** — a source table (e.g. raw `order_data`) mapped straight into one object type ends up representing the order *and* the customer *and* the product, plus technical noise. "Someone... gets confused. Do I really need this, what does this actually mean?"
- **Kitchen Sink** — mapping every source column 1:1 regardless of business value: `cim_extracted_at`, `cim_batch_id` and similar ETL/pipeline fields have "no business value" on an ontology object and shouldn't be there.
- **Department/System Silos** — separate `SalesCustomer`/`SupportCustomer`/`BillingCustomer` types (or one customer type per source ERP/CRM) each maintained independently: "updating a name in one object and not doing it in the third... your data is stale" in one part of the ontology. Cited scale: customers with "70 or hundreds or 150 different ERP systems alone, all with customer" — a type-per-system approach doesn't scale.
- **Action Sprawl** — duplicated update-actions across duplicated object types, and the finer-grained version: separate actions for `update name` / `update email` / `update phone` instead of one `update customer contact information` action.
- **Golden Hammer** — "if everything you have is a hammer, everything looks like a nail": building an action for data that's actually pipeline-sourced and rarely changes (e.g. contact info maintained by a system of record) rather than letting a pipeline write it.
- **Misnomer** — called "one of the worst anti-patterns": a generic name like "item" or "physical asset" could mean equipment, inventory, or a building. Cody: bad naming/missing descriptions mean people "gather a lot of information from other colleagues," and now agents "don't have an understanding and make worse decisions" — naming quality is load-bearing for both humans and AIFDE-style agent tooling.

## Governance and modeling mechanics

- **Lifecycle gate, not committee review**: experimental (in development) → active (production; "I have to be careful here, I cannot just change things just like that"). This is a platform-level flag, but functions as the governance signal — no formal review board described.
- **Extension over modification is enforced by cost, not policy**: Cody notes platform safeguards exist (global branching, change management), but removing a field from a live object type still "will have ripple effects... very expensive from a time and overhead standpoint" — so the discipline is to make new capability additive (new linked type + interface) rather than editing the closed type.
- **Interfaces are the reuse mechanism twice over**: once across duplicate-shaped types (one `updateContactInfo` action implemented across a `Customer` interface instead of three near-identical actions), and once across hierarchy siblings (one `Building` interface giving `Arena`/`OfficeBuilding`/`Restaurant` a shared `schedule` action despite different real-world scheduling semantics — event-length vs. lease-length).
- **When workflows genuinely diverge, don't force one object** — split into workflow-scoped types (`SalesLead`, `SupportContact`, `BillingAccount`) that link to a separate canonical `Customer` object, rather than either three duplicate customer types or one overloaded customer type carrying every department's fields.
- **Dimensional-warehouse caution**: the Order/Customer/Product example "reminds me very much of a dimensional model" (fact/dimension) and that's "a trap" — it works for simple many-to-one cases but breaks down under many-to-many relationships across different measures and granularities; the ontology is meant to model that full complexity directly, not force it into a static warehouse shape.
- **No formal versioning/migration system was described** beyond the lifecycle flag + branching + "prefer additive." This talk names the discipline (extend, don't mutate) but not a concrete migration tool or schema-diff process — that's a gap QuantFlow would need to fill itself.
- **Agent-era rationale for description quality**: "these LLMs were not trained on your enterprise's data" — so the ontology's naming and structure *is* the grounding context an agent reasons over; sloppy naming that was previously a human-only tax now directly produces worse agent decisions.

## AVAILABILITY SIGNALS

None found. This is pure modeling doctrine for Foundry's ontology layer — no SDK, product, pricing, or install path is mentioned anywhere in the talk. Same category as talk 07: everything here is stealable only as *principle*, not as tooling.

## Key quotes

> "If everything you have as a hammer, then everything looks like a nail."

> "In my opinion, the misnomer is one of the worst anti-patterns... if the naming conventions are bad and descriptions are missing for properties or for the object types, then agents don't have an understanding and make worse decisions."

> "These LLMs were not trained on your enterprise's data. And so us representing the context about how things are actually operating is super important so that they can reason across [it]."

## QuantFlow mapping

Solo-operator translation — there's no committee, no review board, so "governance" has to live in schema files, lint rules, and a `qa/` gate instead of a process.

| Palantir principle/anti-pattern | Solo-operator equivalent for the Kernel |
| --- | --- |
| Domain-driven design (understand → design → map, in order) | Model the actual research workflow first (assign → session → run → artifact → evaluation), then map source data (job queues, tool logs) onto it — don't let a DB migration or a tool's log schema dictate object shape |
| God Object / Kitchen Sink | Don't let `Run` absorb every tool's raw log fields; keep ETL/pipeline-only noise (internal job IDs, worker heartbeats) out of the schema entirely |
| Department/System Silos | Resist making a `BacktestRun`/`ScreenerRun`/`OptimizerRun` per tool — one canonical `Run` object + `Tool` link, differentiated by composition, not by type-per-integration (this is the "sales/support/billing customer" trap wearing a quant-research costume) |
| Action Sprawl / Golden Hammer | `Run` status/cost/timing should be written by `ExecutionEnvironment` reporting back (pipeline-shaped), not by a manually-invoked "update run status" action; don't build three narrow actions where one coherent one will do |
| Open for extension, closed for modification | A `status: "draft" \| "stable"` field on each Kernel schema type; a `qa/` lint rule that fails if a diff removes/retypes a property on a `"stable"` type instead of adding a new linked type (e.g. extend `Evaluation` via a new linked detail object, not new columns on `Run`) |
| "Ripple effects are expensive" / no formal migration system shown | Since Palantir didn't show one either, QuantFlow should build its own: a schema-diff check in `qa/` plus a CHANGELOG entry required for any breaking change to a stable object type |
| Composition over deep hierarchies | Already mostly satisfied — `Workspace/Task/Run/Tool/Artifact` are siblings linked via `EXECUTES_IN`/`USES`/`PRODUCES`, not a nested parent-child chain. This talk validates that flat link-graph choice over a deep hierarchy alternative |
| Misnomer / naming for agents | Since `AgentDefinition`/`AgentSession` will read Kernel objects to decide what to do, require a non-empty `description` on every object type and property, enforced as a `qa/` schema-review gate — the same reasoning Cody gives for AIFDE, applied to QuantFlow's own agents |

**Top rules for the Kernel schema, day one:** (1) model the research workflow's real nouns and verbs first, map tool/log data onto it second — never let a tool's native schema become an object type; (2) one canonical object type per entity (`Run`, not `BacktestRun`/`ScreenerRun`), reuse via links and interfaces, with a lint-enforced `stable` flag that blocks silent property removal on shipped types; (3) require descriptions on every type and property from the start, since QuantFlow's own agents will be reasoning over this schema exactly the way Foundry's do.

## Key frames

Domain-Driven Design — the three-step ordering (understand domain → design ontology → map source data):

![[Attachments/QuantFlow/DevCon6/09-ontology-governance/frame_0004.jpg]]

Don't Repeat Yourself — three duplicated types/three maintenance burdens vs. a single canonical type or interface:

![[Attachments/QuantFlow/DevCon6/09-ontology-governance/frame_0015.jpg]]

Don't Repeat Yourself — the refactor in practice (Sales/Support/Billing Customer → Customer interface, with shared contact-info action):

![[Attachments/QuantFlow/DevCon6/09-ontology-governance/frame_0019.jpg]]

Open for Extension, Closed for Modification — equipment object extended via a linked `EquipmentCertification` type + interface rather than new properties:

![[Attachments/QuantFlow/DevCon6/09-ontology-governance/frame_0030.jpg]]

Composition Over Deep Hierarchies — the deep parent-child chain (item → physical asset → schedulable building → arena):

![[Attachments/QuantFlow/DevCon6/09-ontology-governance/frame_0044.jpg]]

Composition Over Deep Hierarchies — favor interfaces over inheritance (shared `Building` interface across Arena/Office/Restaurant):

![[Attachments/QuantFlow/DevCon6/09-ontology-governance/frame_0045.jpg]]

All 19 frames live in `Attachments/QuantFlow/DevCon6/09-ontology-governance/`.

## Full transcript

![[Attachments/QuantFlow/DevCon6/09-ontology-governance/transcript.txt]]
