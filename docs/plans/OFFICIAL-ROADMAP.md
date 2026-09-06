# OFFICIAL-ROADMAP.md — from Golden to a useful live-market research desk, real collaboration, and repeated founder use

status: APPROVED — OFFICIAL PRODUCT PROGRAM; not build authority
revised: 2026-09-05 (founder product-model correction; Golden remains closed)
measured against: accepted local `main` @ `6340d78f`; Golden product candidate `7c26141f`; Golden evidence head `d3951366`; final founder product `a91b5dee`
build authority: `docs/orders/NEXT.md` only (DOCTRINE A9). This file names the route; `NEXT.md` opens each door.
owns: product sequence · dependencies · Proof A / Proof B · Founder Survival · Operator Season · maturity outcomes · open decisions by timing · stop conditions
does not own: contract clauses → [Institution Contracts](INSTITUTION-CONTRACTS.md); surface grammar → [Product Surface and Workflow Architecture](PRODUCT-SURFACE-AND-WORKFLOW-ARCHITECTURE.md); demo scripts → [Demo Spec](DEMO-SPEC.md); capability inventory → non-authoritative Vault research `03-DOCK-CAPABILITY-RATIONALIZATION.md`
supersedes on approval: the R18–R25 route in `docs/history/plans/INSTITUTIONAL-BUILD-PLAN.md`, the rung sequence after R17 in `docs/history/orders/GOLDEN-RUN.md`, and DOCTRINE Part V — all preserved as history of the pre-Golden plan
founder sources (Vault, non-authoritative research): Official Roadmap Draft 4 · Dock Clarification · Founder Closure Addendum · two founder-review responses of 2026-09-02

> **This file authorizes nothing.** Post-Golden Authority Normalization is accepted history. `NEXT.md` opens exactly one vertical delivery order. The first order begins with a bounded live-input decision door and continues directly into working product when a viable path is proved; it is not another planning rung.

---

## 1. Current proven state

Class key: **PROVEN** (gate or receipt on `main`) · **PARTIAL** · **PLANNED** · **UNVERIFIED**.

| Statement | Class | Evidence |
|---|---|---|
| Windows Electron app builds, packages (unsigned NSIS), installs, cold-boots isolated, shuts down clean | PROVEN | `windows-installer`, `windows-cold-boot`, G12 |
| Kernel SQLite is the sole durable truth; one write path `execute()`; 23 objects · 23 links · 43 actions · 104 generated tools | PROVEN | `kernel-sole-writer*`, `kernel-one-path`, `ONTOLOGY.md` |
| Production Dock is exactly four Hermes definitions (Research Director, Market Researcher ×2, Critic) | PROVEN | `dock-production-inventory` |
| One real production turn: Dock click → Hermes → OpenCode Go / Kimi K3 → four governed Ontology reads → Kernel-bound session → zero leaks | PROVEN (one nonce turn, one founder-created Task) | P14-B receipt; founder walkthrough 2026-08-30 |
| Task delegation, steering, second opinion, cancellation, durable history | PROVEN (fixture Missions and one real Task) | R5, R14 |
| Independent Critic gating Report publication, refusal, replay | PROVEN | R15, G9 |
| Immutable named Technique (`strategy`) selection; coverage refusal creates nothing; operator-settled grading (calibration, CLV); no placement surface | PROVEN on a **fixture** Technique; named Technique selection is optional in the target product | R17 |
| Bovada NFL public capture → Kernel market graph with replay | PROVEN as component; **not composed into any Mission** | WO-107 |
| Close/reopen restores Canvas and Kernel world | PROVEN for **mechanical** work; **UNVERIFIED** for a complete real live-market investigation | G5, Act I |
| Object inspection (Inspect pane, lineage views) | PROVEN for **tested objects**; **UNVERIFIED** as complete real-Mission inspection | G10 |
| Founder Hermes credentials never read or written by QuantFlow | PROVEN | R0 |
| Mission entry form with Technique selection | PROVEN **mechanically**; Technique-free investigation entry is **PLANNED** | R17, WO-RD-1 |
| Runtime-neutral institution | **UNVERIFIED — falsifier RED.** Source-observed Hermes coupling in Kernel and app seams (§9) | `execute.ts:237`, `ipc-kernel.ts`, `mission-activation.ts`, `dock-profiles.ts`, `agent-host.ts`, `host-native-tui.ts` |
| A complete useful current+historical Bovada investigation; a price-sensitive CANDIDATE/WATCH/PASS conclusion Ryan accepts; a second certified runtime; cross-runtime handoff/Evaluation; stranger-ready surface | **do not exist** | — |

Not claimed anywhere in this program: a betting edge; a validated Pressure Cascade Technique; PFF access; a working updater; commercial readiness; external demand; second-runtime certification; stranger-ready usability; production AlphaEvolve, TimesFM, PufferLib, or owned models.

## 2. Product definition

QuantFlow Ontology is **Ryan's governed sports-betting research institution, rendered on one persistent infinite desk.** Ryan may work through the Research Director, another participant, or the evidence directly. The Dock supplies governed Participants, Data, Tools, optional Methods, and Compute; the Director is Ryan's primary AI colleague and may compose and coordinate them, but is neither the whole application nor its only front door. The Canvas keeps current investigations understandable and controllable without replacing the desk with a special graph world. The Kernel/Ontology preserves shared questions, Tasks, observations, calculations, Artifacts, criticism, decisions, revisions, and outcomes as one durable truth. Bovada is the primary live-market environment. QuantFlow produces price-sensitive **CANDIDATE, WATCH, or PASS** research; Ryan acts in the world. QuantFlow never places a bet, exposes no placement control, or claims profitability.

## 3. System model

```
FOUNDER INTENT → BOUNDED INVESTIGATION → OPTIONAL TECHNIQUE / EXACT METHOD → DOCK COMPOSITION → TASKS
→ CURRENT + HISTORICAL EVIDENCE → DETERMINISTIC RUNS → ARTIFACTS → GOVERNED HANDOFFS
→ INDEPENDENT EVALUATION → CANDIDATE / WATCH / PASS → REVISION → OUTCOME → REVALIDATION
```

| Component | Job | Not its job |
|---|---|---|
| **Director** | serve as Ryan's primary AI colleague; interpret intent, operate the desk, compose participants/capabilities, supervise work, escalate founder decisions | become the whole product or the only way to work |
| **Technique** | preserve a reusable, evaluated research method when one exists | block exploration, or replace the exact method/envelope every decision-bearing calculation must record |
| **Dock** | govern what the institution may employ (Participants · Data · Tools · Methods · Compute) | package manager; agent launcher |
| **Ontology / Kernel** | define and preserve shared truth | graph spectacle |
| **Canvas** | keep the continuous working desk and its current investigations understandable and controllable | become a replacement Mission world, graph spectacle, or mirror of the Dock |
| **Inspect** | exact detail and provenance | mutate |
| **History** | what happened over time | chat log |
| **Participants** | own Tasks, produce work and judgment | terminal logos |
| **Capabilities** | provide Data, Tools, Methods, Compute | pose as Participants |

The Dock contains what the institution may employ. The Canvas displays only what matters to the active work. Contract semantics for every seam: [Institution Contracts](INSTITUTION-CONTRACTS.md). Surface behaviour: [Product Surface and Workflow Architecture](PRODUCT-SURFACE-AND-WORKFLOW-ARCHITECTURE.md).

## 4. Canonical language

| Term | Means | Kernel shape today |
|---|---|---|
| Mission / investigation | one bounded operator question or market investigation; it does not require a named Technique | `mission` + optional `hypothesis` |
| Technique | optional versioned, hashed reusable research method promoted from evaluated work | `strategy` (spec artifact, family, version) |
| Participant | a process holding a governed seat | `agent_definition` → `agent_session` |
| Role | institutional identity of a seat | `agent_definition.role` |
| Runtime species | the adapter a participant runs on (Hermes today) | manifest `adapter.id`; provenance, not semantics |
| Capability | governed Data / Tool / Method / Compute a role may use | produces `dataset` / `quote` / `run` / `artifact`; grant = `capability_group` |
| Bundle | Dock-visible packaging of one capability | *none yet* (governance metadata; `tool` object available when persistence is needed) |
| Task | one exact unit of work | `task` |
| Artifact / Report | immutable content-addressed output; Report is `artifact.kind` | `artifact` |
| Evaluation | independent judgment on an artifact | `evaluation` |
| Decision Set | current price-sensitive CANDIDATE/WATCH/PASS research projection over governed Artifact/Report authority | an existing governed Artifact/Report shape unless implementation proves a narrow schema need; never a parallel truth store |
| Bench | ordinary operator equipment (WSL terminal, files) on the canvas, outside institutional truth | none — not Kernel objects |

## 5. Product laws

Carried forward unchanged: Kernel owns truth (START_HERE); one write path (LAWS B); ephemeral whitelist (LAWS C); research and advisor only; no new truth stores; descriptions are the product; refusal is not delivery; proof must be real.

Added by this program:

9. **Participant ≠ Capability.** Different contracts; a participant uses a capability only via a role grant.
10. **No production capability without a real research consumer.** The Dock may describe governed inventory, but nothing enters a delivery's critical path until a current founder job needs it; nothing enters production because it is impressive.
11. **Docs, gates, and receipts are not the capability.** A package closes only when the operator runs the thing in the normal app.
12. **Runtime species and provider do not define institutional semantics.** They remain inspectable provenance bound to the exact participant and execution.
13. **Adding to the institution never adds to the grammar.** New things enter through an existing Dock class and tile family, or they are misclassified.

## 6. Critical path

```
GOLDEN + POST-GOLDEN FOUNDATION — COMPLETE (closed, untouched)
   ↓
WAVE 1 — FIRST USEFUL MARKET DESK
  live-input door → one current Bovada market class → trustworthy history → transparent calculation
  → independent criticism → CANDIDATE/WATCH/PASS → continuous Canvas → reopen/tracking
   ↓
WAVE 2 — REAL HETEROGENEOUS COLLABORATION
  de-Hermes institutional seams → second production runtime → exact Artifact handoff/Evaluation
   ↓
WAVE 3 — PROVE AND MATURE
  repeated live use → outcomes/CLV/calibration/baselines → multi-sport/Dock expansion
  → successful methods become Techniques → founder survival/release/visual hardening
   ↓
FOUNDER-PROVEN PERSONAL RESEARCH PRODUCT
```

### 6.1 Post-Golden Authority Normalization — COMPLETE

Accepted Foundation history already present in the `6340d78f` baseline. It:

1. preserves immutable Golden evidence and the product/runtime/config bytes it certifies;
2. replaces the P14-B receipt's "every tracked file outside four prefixes" fingerprint with an **explicit product-relevant fingerprint set**: every tracked file under `collab-electron/`, `packages/`, `qf-kernel-schema/`, `species/`, and `tools/`; all tracked standard lockfiles; every `.github/workflows/` file; and root `install.sh`. The exact non-packaged `species/hermes/README.md` is the only content exclusion inside those trees — neither living authority prose nor packaged Markdown is blindly exempted;
3. lets `START_HERE.md`, `AGENTS.md`, this roadmap, and living product documentation evolve under `doc-links`, `repo-shape`, and status checks;
4. makes "no active rung / builder door closed" a valid `rung-ladder` state and marks R18 `frozen`;
5. re-anchors `golden-g11-authority` so the truthful `g11-status: CLOSED` is green (G11 immutability stays hashed by requalification);
6. shortens `NEXT.md` to current authority and preserves its full ledger byte-for-byte as a dated document under `docs/orders/evidence/`;
7. applies the founder-approved stale-authority patch set P-1…P-7 and records the resulting authority in Git;
8. moves this roadmap and the contracts to `docs/plans/` with `README`/`START_HERE` links, so `docs/orders/` holds only orders, protocol, evidence — the authority/route distinction becomes visible in the path;
9. changes no product bytes, no schema, no Golden evidence.

Exit: accepted and closed. Do not reopen it as Wave-1 work.

### 6.2 Wave-1 live-input decision door (formerly FM-0)

A bounded first deliverable inside the opening product order, not a separate audit, rung, or founder decision ceremony. It proves one real current Bovada event/market with reliable participant identities, both sides and prices, event time, provider identity, local observation time, and an honest freshness statement; then proves one trustworthy historical path whose inputs can be reconstructed before the event cutoff. Attempt UFC first because it is live and useful to Ryan; use NFL as the reserved fallback under the same evidence bar. The order sets a hard timebox and switches promptly rather than protecting a favorite sport.

This door also identifies the smallest transparent calculation that the available evidence can honestly support. It does **not** require Ryan to invent or select a named Technique. Exploration begins without one; before any conclusion can influence CANDIDATE/WATCH/PASS, the exact formula, inputs, version, cutoff, missing-data behavior, and limitations become an immutable Run envelope. If both real-data paths fail inside the timebox, stop with the exact missing dependency. Never substitute fixtures on the live claim.

### 6.3 Minimum IC-0

The minimum Participant and Capability boundaries needed by the live slice ship with that slice and are exercised on the existing Hermes path. They are not standalone process work. Full runtime-neutral conformance remains Wave 2.

### 6.4 Proof-A ingredients

FM labels are **dependency units, not mandatory mini-rungs**; compose adjacent units that share one causal product boundary; do not recreate Golden ceremony.

| Unit | Runnable outcome | Proof proportional to risk |
|---|---|---|
| **FM-1 Evidence ingress** | Live Bovada evidence and one sport's trustworthy historical evidence enter as `quote`/`market_event` and `dataset` versions with source time/as-of + hash through real Dock capabilities | one real provider read + deterministic negative fixtures |
| **FM-2 Transparent computation** | The Research Lab runs an exact versioned calculation envelope through `execute_deterministic_run`; a reusable named Technique is used only when one actually exists | independent recomputation; bait: perturb one input byte or formula version |
| **FM-3 Director and direct composition** | Ryan or the Director can open an investigation, bind capabilities, and recruit roles without a Technique prerequisite; refusal is a founder-readable sentence | real Hermes Director turn plus direct UI path |
| **FM-4 Governed conclusion + failure diagnosis** | Price-sensitive CANDIDATE/WATCH/PASS conclusion; failed or contradicted work remains visible without being published as support | rendered UI oracle + fixture failures |
| **PS-0 floor** | [Product Surface and Workflow Architecture](PRODUCT-SURFACE-AND-WORKFLOW-ARCHITECTURE.md) §H behavioural floor | normal-app founder check |
| **FM-5 Interpretation + attack** | Researcher interprets the deterministic artifact; Critic evaluation names ≥ 1 material attack | governed-review extension |
| **FM-6 Lineage & Inspect** | From Decision Set to every input's bundle, as-of, hash | UI oracle |
| **FM-7 Close/reopen + backup** | Real Mission survives relaunch; in-app backup/restore with receipt | packaged relaunch gate |
| **FM-8 Golden Mission regression corpus** | One real Mission recorded as deterministic regression fixture; live path stays the claim | fixture + one live pass |

Recommended composition (architect decision): FM-1+FM-2 "evidence + computation"; FM-3+FM-4 "Director + decision"; FM-5+FM-6 "attack + lineage"; FM-7+FM-8 "survive + regress".

### 6.5 Proof A — useful live Bovada investigation

**Proves:** Ryan opens the normal Windows app, inspects a current Bovada market, opens one bounded investigation without first inventing a Technique, and uses real current and trustworthy historical evidence plus a transparent reproducible calculation. An independent Critic attacks the exact result. The desk ends in a price-sensitive CANDIDATE, WATCH, or PASS whose numbers trace to source, observation/as-of time, exact method envelope, and producer; previous observations and recommendation revisions survive close/reopen; no wager is invented or placed. All participants may be Hermes profiles; that does not satisfy Proof B.

**Minimum Proof-A Dock:** Participants — Research Director, one Evidence/Market Researcher, Independent Critic. Data — Bovada Live Markets and the selected sport's Historical Evidence. Tools/Compute — one Research Lab capable of the proved calculation. Method — optional; show a named Technique only if evaluated work has earned one. Literature/Browser Evidence remains optional when the investigation requires it.

**Acceptance:** independent verifier runs the Mission in the packaged app with real provider contact and pinned corpus; every decision-bearing metric satisfies C9 and every admitted Dataset/corpus satisfies C10; `participant-contract`, `capability-contract`, replay gate green with bait; Founder-Proven exit (Closure Addendum): founder completes it once unassisted from a fresh install; [Demo Spec](DEMO-SPEC.md) Demo A rejection conditions absent; product-surface acceptance per [Product Surface and Workflow Architecture](PRODUCT-SURFACE-AND-WORKFLOW-ARCHITECTURE.md) §H; screenshots preserved in the receipt.

**Outside Proof A:** second runtime; more than one completed sport/market class; stake logic; AlphaEvolve, PufferLib, TimesFM, Multivariate Forecast Engine; recall/learning.

### 6.6 Founder Survival lane (parallel, never blocking)

Operator-visible fixes that keep the founder using the product while Proof A builds (first-run desk, tile task titles, backup control, provider-unreachable sentence). Ships inside the nearest unit boundary, never as its own order. ≤ 10% of active work.

### 6.7 PB-0 — generalize Hermes-specific institutional seams

**Current:** the runtime-neutrality falsifier ([Institution Contracts](INSTITUTION-CONTRACTS.md) §5 F1) is **RED**. Source-observed coupling (2026-09-02): Kernel second-opinion critic identity (`packages/qf-kernel/src/execute.ts:237`); governed-review critic admission and Director mapping (`collab-electron/src/main/ipc-kernel.ts` L278–282, L459, L506, L679–692); Mission activation naming `hermes-worker` (`mission-activation.ts:7`); role tool allowlists as code literals (`ontology-role-tools.ts`); Dock bootstrap/profile validation shaped around Hermes (`dock-profiles.ts`); agent hosting with `species/hermes/` WSL/MCP checks (`agent-host.ts`, `host-native-tui.ts`); Hermes terminal status heuristics (`governed-critic-completion.ts`); packaging `extraResources` naming Hermes launcher and synthetic responder (`collab-electron/package.json` L79–84). Already neutral: schema, `collaboration-gateway`, `ontology-gateway`, Canvas identity, peer delivery targeting role/session.

**PB-0 outcome:** role semantics not keyed to Hermes ids; critic eligibility role/capability-based; Mission activation does not name Hermes profiles; tool grants derive from role/capability policy, not species literals; Dock validation accepts certified Participant manifests through a shared contract; agent hosting delegates only transport-specific behaviour to an adapter; peer delivery targets governed role/session identity; packaging admits declared runtime resources without embedding institutional semantics; **Hermes still works unchanged in meaning**; F1 green with bait; **no second runtime is added to prove PB-0**. PB-0 changes product bytes and therefore re-anchors the Golden receipt fingerprint by order.

### 6.8 Proof B — real heterogeneous collaboration

**Proves:** one real Mission + two genuinely different certified Participant runtimes + exact durable Tasks + shared role-authorized capabilities + at least one non-chat Data/Tool/Compute capability + one hash-bound Artifact produced by runtime A + governed handoff + independent Evaluation or meaningful extension by runtime B + shared Kernel/Dock/Canvas/Inspect lineage + stop/replacement/reopen without durable truth loss. Peer messaging and terminal prose may notify; they never constitute the handoff. Proof B is not two terminals.

**Sequence after PB-0:** select runtime two from the exact useful role and independence need Proof A revealed (open until then); implement only runtime-specific adapter/manifest/package/probe differences (PB-1); run the real cross-runtime Mission (PB-2); prove runtime-three admission requires only adapter/manifest/package declaration + bounded readiness/transport probes + the existing conformance suite, with no change to Kernel truth, role semantics, Dock semantics, Canvas identity, Task ownership, Artifact publication, Evaluation authority, collaboration truth, or History (PB-3, falsifier F1–F6).

**Outside Proof B:** a third runtime; runtime marketplaces; model routing; swarm framing.

### 6.9 Operator Season

The accepted investigation loop runs repeatedly on real upcoming events by Ryan as operator; outcomes are recorded only from verified external truth, with no placement or edge claim. This produces the first real history for CLV, calibration, coverage, failure, and baseline comparison. Decisions that need history open only after it.

### 6.10 Product Surface Maturity / External Pilot Readiness

After Operator Season, repeated evidence may authorize refined layout grammar, stranger-ready first use, Dock information architecture, typography and density, accessibility, performance, visual consistency, external-pilot presentation. This is the bridge from *usable and true* to *premium and show-ready*; before it, PS-0 is the only surface bar.

### 6.11 Evidence-led institution maturity

Only with season history: Technique iteration; second Technique family; recall; learning (PufferLib market policy, then institution policy — never one reward); AlphaEvolve as a research capability against a governed evaluator; owned models as governed inference capabilities.

**Recall law:** semantic retrieval may discover candidate prior Missions, Artifacts, Evaluations,
Techniques, and outcomes. Before retrieved material influences current authority, exact Ontology queries
verify identity, lineage, Technique version, evidence timing, Evaluation status, and whether the
conclusion is current, superseded, or historical. Search finds candidates for context; Kernel/Ontology
establishes truth. Search indexes remain derived, replaceable projections.

### 6.12 Domain expansion

After the first completed sport/market class, UFC, NFL, tennis, and later broader markets use the same Kernel, Dock classes, Canvas grammar, and institutional contracts. Expansion adds evidence/capability bundles and only those Techniques earned by evaluated work—not new architecture.

### 6.13 Fundability evidence boundary

Proof A + Proof B produce a **first-class show-ready technical/product demonstration**: coherent, real, attributable, technically defensible, product-legible, honest about what is unproven. They do not prove market demand, investor readiness, profitability, licensing, or release readiness. External demand, data economics, pricing, and investor evidence are later and separate.

## 7. Stop conditions

Stop and return to the founder only if: the bounded input door proves neither UFC nor NFL can supply the required real evidence without a credential or external access decision; any unit requires a second truth store; any unit passes only with a fixture on the live path; a real safety/authority conflict appears; the same semantic assertion fails twice after repair; or working software exposes a genuinely founder-only product choice. Do not stop for naming, ceremony, optional Technique selection, or implementation choices the architect can make from evidence.

## 8. Open decisions by timing

**Already settled by the founder:** this corrected product model and continuous execution through the three delivery waves; Golden remains closed.
**The Wave-1 input door decides from evidence:** §6.2 list, including UFC versus NFL fallback and the smallest honest calculation.
**After Proof A:** second runtime; exact PB-0/PB-1 implementation plan informed by the real role; adapter shape; untrusted-CLI security; Operator Season threshold.
**After real history:** §6.11–6.13.
Architect-settled (not founder questions): document ownership, contract wording, PB-0 placement, surface operating model, participant/capability distinction, compute/model placement, normalization shape, cadence. The Vault founder decision pack is non-authoritative research input; decisions that open or close work land in Git under the normal `NEXT.md`/order protocol.

## 9. Development operating model

One vertical operator-visible outcome at a time; adjacent dependency units combined on one causal boundary; one product writer at a time; proof proportional to semantic risk; real path for product claims, deterministic fixtures for regression; independent verification for institutional laws and final candidates; exact evidence reuse when bytes and meaning are unchanged; founder-visible packaged checkpoint within five active working days; two failed attempts on one symptom → classify the layer and stop; no parallel product orders; docs, gates, receipts never count as the capability; no process documentation as deliverable. Roadmap packages are dependency units, not mini-Goldens.

## 10. Authority boundary

**APPROVED — OFFICIAL ROADMAP 2026-09-03**

- Approval: the founder writes `APPROVED — OFFICIAL ROADMAP <date>` under this line, or it stays a candidate.
- `NEXT.md` opens one concise vertical order at a time, beginning with the real live-market opportunity desk; the bounded input door is Deliverable 0 of that order.
- Historical routes are preserved and not edited into agreement; they are history the moment this file is approved.
