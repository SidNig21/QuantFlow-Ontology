# QuantFlow Claude Design Brief — Pass 1

> Copy everything below the line into Claude Design (or OpenCode). Pass 1: no predecessor screenshots.

---

You are designing QuantFlow’s visual projection layer for a desktop Electron app (Collaborator shell already exists). Treat this entire message as law.

Project type: UI mockups. Skills: Frontend design (+ Wireframe if attached).

Pass 1 only — invent freely within this brief. No predecessor screenshots. Do not redesign navigator, window chrome, or tile drag/resize. Design tile interiors + ontology chrome on an infinite dotted canvas.

Immediate deliverables (in order):
1) Color + type tokens (light + dark) — Geist / Geist Mono, lime accent on near-black for dark; dual theme required.
2) Shared primitives sheet: entity chip, origin badge (human/agent/system), state pills, metric block (CLV north star), approval gate, uncertainty/missing-input row.
3) Four tile mockups: Artifact, Run, Agent session, Evaluation (parlay-honest metrics — RoR/drawdown beat hit rate).
4) One canvas composition: Hypothesis → Dataset → Backtest Run → Artifact → Critic → Evaluation → Report, with typed cables and attribution visible without a drawer.

Do NOT create: purple/glass neon UI, QF Dock/spawn rail, Envoy/Eve, a 3D QUANTFLOW cube on the canvas, chat-first layouts, or fake data fields not in the ontology section below.

Ask at most 3 clarifying questions only if blocked; otherwise start generating.

## 0. Role and product

Design the visual projection layer for QuantFlow — a Linux-first, single-user spatial operating console for AI-assisted quantitative research. v1 domain pack: sports betting markets (Bovada; UFC, tennis, football). Research-only: it never places bets.

The app shell already exists (Collaborator Electron): left navigator, infinite pan/zoom canvas, tiles (terminal / note / code / image / graph / browser / artifact), viewer, local JSON layout under ~/.collaborator/. Do not redesign shell chrome, windowing, or tile resize/drag mechanics. Design what lives inside QuantFlow tiles and shared ontology chrome.

Truth model (non-negotiable):
- Kernel (SQLite ontology) owns all durable state.
- Canvas JSON stores layout + object ids only.
- Tile = render(projection) + dispatch(action).
- A tile that remembers domain state is a bug.

## 1. Audience and job

- Sole user: founder/operator running Hypothesis → Dataset → Backtest → Artifact → Critic → Evaluation → Report weekly.
- Needs: trust what an agent did, reopen last week’s work cold, judge CLV/ROI/bankroll risk, not admire gradients.
- Density over delight. Expert console, not onboarding product.

## 2. Visual direction

Name: QuantFlow
Tone: research console / trading desk — precise, receipt-first, slightly severe. Dark near-black canvases with a lime primary accent are in-family; light theme must still work.

Do:
- On the working canvas, object identity and state outrank brand. “QUANTFLOW” wordmark belongs in about/settings/empty-state — not as a permanent 3D hero over the workspace.
- Type: Geist (sans) + Geist Mono (mono) unless proposing a documented swap.
- Atmosphere: subtle dot grid, thin borders, one sharp accent (lime/chartreuse family). Status color as a small vocabulary, not a rainbow.
- Motion: tile focus, running pulse, cable activity on stream, approval gate appear. Cap at 2–3 motifs.

Do not:
- Purple/cyan orb glow, glassmorphic sidebars, heavy multi-layer neon
- Recreating QF Dock, spawn rails, Envoy, Eve, Hermes CTA, or “Run Workflow” as product chrome (predecessor concepts; agents spawn as tiles/sessions on Collaborator)
- Warm cream + terracotta “AI editorial” look
- Broadsheet / dense newspaper chrome
- Emoji decoration, rounded-full pill clusters, stat strips as tile heroes
- Chatbot-first as the primary surface (canvas is primary)

Cards: default no cards. Card chrome only for interaction containers (approval gate, candidate picker, critic finding). Prefer labeled rows, tables, entity chips.

## 3. Implementation target

- Tokens: CSS variables in collab-electron/packages/theme/src/styles.css — compatible with --background, --foreground, --border, --muted-*, --primary, --destructive, --radius, light + .dark
- UI: React 19 + Tailwind CSS 4 — Tailwind-friendly spacing (4/8px)
- Shell: Electron multi-webview tiles — tile interiors (transparent webview) or viewer pane, not a separate app
- Data: Kernel projections via IPC — only fields that exist on ontology types; no fake fields

Existing token baseline (extend, don’t ignore):
- --font-sans: Geist
- --font-mono: Geist Mono
- --background / --foreground / --border / --muted-*
- --primary / --destructive / --radius: 0.625rem
- --item-type-* accents for file kinds

Add QuantFlow-specific tokens (propose exact values):
- --qf-origin-human / --qf-origin-agent / --qf-origin-system
- --qf-state-queued|running|succeeded|failed|cancelled|blocked|pending
- --qf-verdict-supports|rejects|inconclusive
- --qf-sport-ufc|tennis|football (subtle)
- --qf-entity-* accents per object family (hypothesis, strategy, ticket, dataset, run, artifact, evaluation, agent_session, market, event)
- --qf-cable, --qf-cable-live, --qf-uncertainty, --qf-approval

## 4. Ontology → UI mapping

Every primary research object appears as: canvas tile, inline entity chip, and inspector strip.

- hypothesis — Claim + status — claim, success_criteria, status (open|supported|rejected|inconclusive)
- strategy — Versioned rule identity — version, stake_model, link to spec artifact
- ticket — Atomic wager proposal — kind single/parlay, legs, combined_price, grade
- dataset — Versioned fenced snapshot — kind, content_hash short, as_of, coverage summary
- run — Execution lifecycle — kind (ingestion|feature_build|backtest|analysis), status machine, params summary, trace_id
- artifact — Immutable publish — kind (strategy_spec|code|result_set|report|trajectory), content_hash, storage_ref, created_at
- evaluation — Verdict + bankroll honesty — metrics (clv_avg, roi, risk_of_ruin, drawdown, streaks, p5/p50/p95), verdict
- event / market / competitor — Domain context — sport, starts_at (PIT fence), market kind+sides, correlation_group
- agent_session — Live worker — species (Researcher / Backtester / Critic / …), status machine, origin attribution
- connection — Typed cable between tiles — type label, live vs idle

Defining workflow (must be legible as connected canvas story):
Hypothesis → Dataset → Run(backtest) → Artifact → Critic session → Evaluation → Report artifact (lineage preserved).

## 5. Required UX patterns

1. Trust & Attribution — every output shows origin: Human / Agent / System. Agent outputs show species + session short-id. Per-actor reasoning is collapsible, never one dense wall.
2. Encourage Collaboration (inline) — agent status on the task/object tile, not a side chat ghetto. Missing inputs as on-tile asks. Partial fills show uncertainty flags.
3. Enrich Responses — ontology refs as live entity chips (click → focus/open tile), not plain markdown.
4. Graph primary, timeline secondary — canvas+cables default; chronological trace timeline is a secondary lens.
5. Receipt visibility — actions leave visible receipt affordances (trace_id / event type).
6. State machines as UI — illegal transitions not shown as enabled buttons; terminals look terminal.

## 6. Component inventory

A. Shared primitives:
- Entity chip (type color + short label + hover metadata)
- Origin badge (human/agent/system)
- State pill (run / session / ticket / hypothesis / event) — restrained
- Uncertainty flag + missing-input ask row
- Approval gate (pending / approve / deny)
- Hash/id shortener (8…4) with full value on hover
- Metric block (CLV, ROI, RoR, drawdown) — CLV is north star
- Lineage crumb / derived-from strip
- Empty / loading / error / rejected-command states

B. Tile interiors (priority):
1. Artifact tile
2. Run tile
3. Agent session tile
4. Evaluation tile (parlay-honest: RoR/drawdown beat hit rate)
5. Hypothesis tile
6. Ticket tile (parlay legs + correlation note)
7. Dataset tile
8. Report artifact reading view

C. Canvas chrome (light-touch):
- Cable styles: typed, idle vs streaming
- Tile title bar: origin + object-type accent only
- Selection inspector: projection fields + last receipt

D. Secondary lens:
- Trace timeline for one trace_id (spawn → turn → model → tool → sandbox → artifact → evaluation)

## 7. Layout and density

- Tile padding 12–16px; row gap 8px
- 12px mono for ids/hashes/prices; 13–14px sans for claims/rationale
- Labeled rows for metadata; tables for legs/metrics; no decorative hero imagery inside research tiles
- First viewport of a tile: identity + state + 1 primary metric or claim
- Collapse gracefully from ~440×540 down to ~280×320

## 8. Light / dark

Provide both. Light is default product appearance; dark is first-class. WCAG AA text. State colors distinguishable for deuteranopia (don’t rely on green/red alone — pair with label/icon).

## 9. Motion

Only:
1. State change cross-fade / pulse on running
2. Cable activity shimmer when session streaming
3. Approval gate entrance

No parallax, no ambient particles.

## 10. Explicit non-goals

- Landing-page marketing site
- Replacing Collaborator navigator / file tree aesthetics wholesale
- Mobile-first layouts
- Multi-user avatars / presence
- Betting checkout / wallet / book login UI
- Purple AI product skins
- Inventing ontology fields not listed above

## 11. Deliverables

1. design.md — tokens, type scale, spacing, color roles, do/don’t, component usage rules
2. Token table — light + dark CSS variables mapped to Collaborator names + new --qf-* names
3. Component sheets — primitives A + tiles B1–B4 minimum (B5–B8 can be wireframe)
4. One canvas composition — defining workflow as 6–8 tiles + cables on dotted infinite canvas
5. Enrichment example — agent message with entity chips + attribution + uncertainty flag
6. Evaluation honesty example — longshot parlay metrics where RoR/drawdown outrank hit rate
7. States matrix — run and agent_session, every legal state; illegal actions absent/disabled
8. Handoff notes — what maps to packages/theme vs windows/*-tile CSS vs shell-only accents

## 12. Acceptance criteria

- Builder can implement Artifact + Evaluation tiles without inventing colors
- Attribution visible without opening a drawer
- Without the word QuantFlow, still reads as research console, not chatbot
- Lime/chartreuse accent OK; purple orb glow, glass docks, cream-terracotta not OK
- Every mock field maps to the ontology table above
- Cold reopen assumed: tiles show Kernel projection, not local draft truth
- No predecessor dock / Envoy / Eve / spawn-rail chrome

## 13. Repo constraints

- Theme today: collab-electron/packages/theme/src/styles.css
- Artifact tile baseline: collab-electron/src/windows/artifact-tile/
- Tile types: term | note | code | image | graph | browser | artifact
- Shell: Collaborator Electron fork (collab-public)

---

## Pass 2 mood card (optional — after Pass 1)

Attach the old QuantFlow screenshot and paste:

Mood reference only — not a UI to recreate.

KEEP (energy): near-black field; lime/chartreuse as primary live accent; small status-dot vocabulary; dense operator feel; sharp contrast.

KILL (structure): QF Dock / spawn rail / SPAWN·ROUTE tabs; glassmorphic sidebar; 3D wireframe cube brand hero as the working canvas; purple/cyan glowing orbs; Envoy / Eve / Hermes / “Run Workflow” CTA; treating empty brand splash as the product.

Revise Pass 1 tokens and tile chrome toward the KEEP energy. Keep Collaborator shell (navigator + infinite canvas + tiles). Output a short before/after note: what you borrowed from the mood ref vs what you refused.
