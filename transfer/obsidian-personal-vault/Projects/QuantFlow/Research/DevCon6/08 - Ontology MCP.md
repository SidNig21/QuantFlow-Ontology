---
tags: [quantflow, palantir, devcon6, mcp, ontology, agent-stack]
source: https://www.youtube.com/watch?v=bJsHKMUqCvg
speakers: Chad Wilquist (Commerce Solutions Architect, Palantir), Mike Manning (Technical Program Manager, Palantir)
duration: "33:59"
analyzed: 2026-07-17
transcription: local Whisper transcript (report.md flagged "no transcript available," but a transcript.txt was present and used; minor mis-transcriptions likely — e.g. "Palantir" → "Pounds")
---

# 08 — Ontology MCP

A two-hander (Chad interviewing Mike, who runs an internal Palantir team) demoing **OMCP — the Ontology MCP server** — Palantir's move to expose their own internal Foundry ontology to AI coding agents (Claude Code, Codex, Copilot) for real internal work: team retrospectives, OKR planning, and cross-team dependency analysis. Explicitly framed as Palantir eating its own dog food: "we have an ontologized... business."

## The argument, compressed

1. Palantir has built a large internal ontology covering essentially all connected internal systems — Foundry is the system of record for their own workflows, not just customer deployments.
2. **OMCP collapses N bespoke MCP servers into one.** Instead of one MCP server per system (Slack, GitHub, ticketing), everything is modeled into the ontology first, then exposed as a single MCP server — so the agent gets the *business process* across systems, not just per-system data access.
3. **Why that matters for agent reliability:** point five different MCP servers at an LLM and ask it to de-conflict/find patterns across them, and results vary run to run, burn tokens, and are error-prone. Pre-modeling the links between object types in the ontology gets you "a lot closer to one-shotting" cross-object analysis.
4. **Setup lives in the Foundry Dev Console** — the same place you'd build a custom OSDK app. Admin picks which object types, link types, action types, and functions the MCP server exposes (via an Ontology SDK), then flips an "MCP" tab on. Two deliberate breadth choices: bias toward broad (expose most of the ontology) vs narrow use-case-specific servers — they bias broad for internal use.
5. **Permissioning is two-layered.** (a) Every MCP call goes through Foundry auth as a scoped-down token — the agent inherits the calling user's own row/column-level ACLs and security markings, no privilege escalation. (b) A separate **marking-whitelist** restriction lets admins block categories (e.g., "anything marked PII") from ever leaving via MCP even if the user has access in Foundry — a distinct, stricter boundary for lower-trust external AI tools.
6. **Client-agnostic by design.** Same OMCP server plugged into Claude Code, Codex, Copilot, Claude Desktop, Gemini, even Word/PowerPoint — "meet them where they are" rather than picking one platform. A companion **Platform MCP** (build/administer Foundry itself) is distinct from **Ontology MCP** (consume/act on modeled data) — two servers, different jobs.
7. **Live demo — internal planning workflow (done 3x/year):** ask Claude Code to synthesize a retrospective from Slack + tickets + GitHub for a team → draft next-quarter OKRs from it → have a second agent (Codex) critique the draft using the same ontology access → publish back into the ontology via action-type calls (Create Objective, Create Key Result) → immediately query cross-team dependencies ("where is tech support blocked on network engineering?") now that the plan objects exist as linked data.
8. **Stated end-state:** manual multi-agent exploration is a discovery/prototyping phase; once a workflow proves valuable, codify it as an automated Foundry pipeline (e.g., recurring retro emails, weekly deconfliction) rather than re-running it by hand each time.

## Tooling named

- **OMCP (Ontology MCP)** — the star of the talk; ontology objects/links/actions exposed as MCP tools.
- **Platform MCP** — a separate, complementary server for building/administering Foundry itself (mentioned near the end, not demoed).
- **Foundry Dev Console** → **Ontology SDK** tab (pick exposed objects) → **MCP** tab (toggle server on, get install instructions, MCP Inspector) → **OAuth & restrictions** tab (object/link/action/function allow-lists + marking whitelist).
- Clients demoed live: **Claude Code** (VS Code plugin) and **Codex** (terminal); also name-dropped: Claude Desktop, Gemini, GitHub Copilot.
- **Workshop** — the existing internal planning app (form-based OKR entry) that OMCP-published plans still show up in for company-wide consumption.

## AVAILABILITY SIGNALS

None found for a free/Developer-Tier path specific to this talk. OMCP is set up entirely from the **Foundry Dev Console**, the same admin surface used for custom OSDK apps — i.e., it is a feature of an existing Foundry stack, consistent with every other DevCon6 talk's gating pattern ([[00 - The Integration Question]]). No pricing, no standalone install, no open-source mention, no reference to the free AIP Developer Tier lab. This talk is entirely Palantir demonstrating internal dogfooding, not a product pitch with a self-serve path.

## Key quotes

> "Instead of having an MCP server for every different kind of system, by modeling all of that into the ontology and then giving them one MCP server, that means I not just encode the system pieces, but the actual business processes across those systems and how they interact."

> "If you have five different MCP servers and you just throw your AI tool of choice at it and say like, de-conflict all these things, find patterns — it's going to do it a little differently every time. It's going to be pretty error prone... having it all modeled in the MCP lets us get a lot closer to one-shotting these analyses."

> "Everything that's coming through the MCP server... you're basically just offing to Foundry. So you get like a scoped-down token, you have the access that your user has... you can also do marking whitelisting — anything that's marked as PII, don't allow through the MCP server."

> "I spent zero time on publishing and sorting out the formatting of the plan and all of my time actually planning."

## Key frames

Ontology SDK — the objects actually exposed for this use case (developers, teams, plans, objectives, key results, plus signal sources: Slack messages, support tickets, GitHub PRs/issues):

![[Attachments/QuantFlow/DevCon6/08-ontology-mcp/frame_0011.jpg]]

OAuth & restrictions — the two-layer permission model: object/link/action/function allow-lists, and a separate marking-restriction (PII whitelist) surface:

![[Attachments/QuantFlow/DevCon6/08-ontology-mcp/frame_0016.jpg]]

The ontology graph with link types wired between object types, and the action types (Create Objective, Create Key Result, Create Plan) that become write-back tools:

![[Attachments/QuantFlow/DevCon6/08-ontology-mcp/frame_0019.jpg]]

Claude Code's synthesized retrospective — objectives, key results, and an "Operational Friction Analysis" pulled from Slack/tickets/GitHub data:

![[Attachments/QuantFlow/DevCon6/08-ontology-mcp/frame_0025.jpg]]

Terminal mid-flow — the agent making a chain of live OMCP tool calls while checking/publishing the draft plan:

![[Attachments/QuantFlow/DevCon6/08-ontology-mcp/frame_0036.jpg]]

Published plan back in the Workshop planning app, and the resulting cross-team dependency query:

![[Attachments/QuantFlow/DevCon6/08-ontology-mcp/frame_0044.jpg]]

## QuantFlow mapping

| OMCP concept | QuantFlow equivalent (quantflow-mcp) | Status |
| --- | --- | --- |
| Tools = ontology object CRUD + admin-defined action types (Create Objective, Create Issue...), auto-surfaced from the ontology SDK | Purpose-built verbs: `qf_task_*` lifecycle, tile/cable ops | **different granularity, deliberately** — theirs is generic-by-construction (any exposed object gets query/create tools for free); QuantFlow's are hand-designed per workflow. Worth asking whether Kernel object types (Workspace/AgentSession/Run/Artifact/Evaluation) should get the same "expose the type, get the CRUD tools free" treatment as the object model matures |
| Two-layer permissioning: (1) scoped-down Foundry token inheriting the calling user's row/column ACLs, (2) separate marking-whitelist deny-list for lower-trust AI clients | Kernel queries on :9811 are read-only by transport-level separation; no per-object or per-field allow/deny-list system yet | **gap worth stealing** — the marking-whitelist idea (block a *category* of data from ever reaching an external AI tool, independent of the user's own access) is a clean pattern for a future multi-tenant or cloud-sandbox QuantFlow, where Cloudflare sandbox agents shouldn't see the same data a local session can |
| One broad MCP server over a pre-modeled graph of linked object types, so agents "one-shot" cross-object synthesis (retrospective → OKRs → dependency query) instead of stitching 5 servers | Typed links (DELEGATES_TO/PRODUCES/DERIVED_FROM/EVALUATED_BY) in the incoming quant-research object model | **direct validation** — this talk is the strongest evidence yet that pre-wiring the *relationships*, not just exposing raw data per-system, is what makes agent-driven synthesis reliable. The re-fork's typed-link model is doing exactly what OMCP's link types do |
| Ontology MCP (consume/act on data) vs Platform MCP (build/administer the platform) — two separate servers, different jobs | quantflow-mcp today conflates admin-ish tile/cable ops with read-only Kernel queries in one server | **pattern to consider** — a future split between "build/administer the Kernel" tools and "query/act on session data" tools may reduce tool-surface confusion for agents as quantflow-mcp grows |
| Client-agnostic: same server plugged into Claude Code, Codex, Copilot, Gemini, Claude Desktop, even Word — "meet them where they are" | quantflow-mcp is already client-agnostic MCP (works with any MCP host) | **already aligned** — no change needed, just a confirmation the current approach (plain MCP over stdio/socket) is the right posture |
| Write-back via action types closes the loop: agent-drafted plan becomes real, linked, queryable data in one call | quantflow-mcp already supports writes (task lifecycle, tile/cable ops) | **already aligned**, and echoes the write-back doctrine independently noted in [[06 - Security Forge (Defensive Cyber)]] |

**Bottom line:** the single most portable idea here is that **tool design followed the ontology, not the reverse** — they didn't hand-craft 20 MCP tools; they modeled the object/link/action graph correctly first, and generic CRUD + action-type tools fell out of that "for free," which is *why* agents could reliably chain retrospective → plan → publish → dependency-query without per-step hand-holding. For quantflow-mcp v2 in the clean re-fork, that argues for finishing the Kernel object/link taxonomy (Workspace/AgentSession/Run/Artifact/Evaluation + typed links) *before* expanding the tool surface, rather than adding more bespoke `qf_*` verbs ad hoc — and for stealing the two-layer permission split (user-scoped token + a separate category-level deny-list) once QuantFlow has any multi-trust-boundary surface (e.g. Cloudflare sandbox agents vs local session).

## Full transcript

![[Attachments/QuantFlow/DevCon6/08-ontology-mcp/transcript.txt]]
