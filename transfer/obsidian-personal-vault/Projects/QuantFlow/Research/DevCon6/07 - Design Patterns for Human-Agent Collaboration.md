---
tags: [quantflow, palantir, devcon6, agent-stack, ux]
source: https://www.youtube.com/watch?v=O7aeOmnbCuo
speaker: Emily, Lita, Philip (Palantir product designers)
duration: "16:51"
analyzed: 2026-07-16
transcription: local whisper.cpp (base.en) — no captions on upload
---

# 07 — Design patterns for human-agent collaboration

Three Palantir product designers walk through three UX mistakes they've seen in fielded agentic apps, the design pattern that fixes each, and a bonus "stop your app looking like AI slop" segment. This is the talk closest to QuantFlow's core bet (the canvas), so it gets the deepest read.

## The argument, compressed

1. AI design patterns are churning fast; the interface paradigm built around the humble chatbot is breaking as agents spawn sub-agents and work alongside users at 10x human velocity.
2. **Mistake #1 — users don't understand how agents made decisions.** Fix: **Trust and Attribution** — explicitly label whether an agent or a human produced a piece of work, and restructure chain-of-thought from one dense wall into per-actor "cards" users can drill into.
3. **Mistake #2 — human and agent workflows are separated** (e.g. chat bolted on the side, forcing copy-paste into the real document). Fix: **Encourage Collaboration** — put the agent's status, multiple candidate solutions, source attribution, and edit affordances *inline in the document/task the human is already working in*, not in a detached side panel.
4. **Mistake #3 — plain markdown responses are dead ends.** Fix: **Enrich Responses** — inline-render ontology objects, linked sub-agents, and cited knowledge notes as live entities inside the response text; make chain-of-thought collapsible rather than deleting it.
5. **Bonus: stop AI slop.** Every vibe-coded app converges on the same purple-gradient/glassmorphism/emoji look, and at 10-20 apps the inconsistency compounds into real maintenance debt (five reimplementations of the same table). Fix with three tools: a shared OSDK component library, a `design.md` file encoding brand/typography/spacing as a machine-readable spec, and reusable "agent skills" for front-end conventions.

## Named design patterns (verbatim from slides)

| # | Pattern name | Mechanism (one line) |
|---|---|---|
| 1 | **Trust and Attribution** | Indicate whether an agent or a user produced the work; restructure single dense chain-of-thought into per-actor collapsible cards (human + multiple agent "logic functions" in one panel) |
| 1b | (unnamed — "complex systems" pattern) | Two competing visualizations for multi-agent orchestration: a **node/graph layout** (orchestrator fanning out to sub-agents, technical/granular) vs. a **chronological timeline** (simpler, "what did it spawn, what was the output," for less technical users) |
| 2 | **Encourage Collaboration** | Agent workflows integrate inline where users already work — agent status shown against the task's line items, multiple candidate solutions offered (not one answer), hover-attribution markers, agent asks for missing context rather than assuming, agent can partially fill a response and flag uncertainty for human review |
| 3 | **Enrich Responses** | Sources, ontology objects, and sub-agent links rendered as live, clickable entities inside response text; collapsible chain-of-thought; exposes underlying code/artifacts without overwhelming the default view |
| Bonus | **Shared OSDK component library** | Pre-built, theme-able, ontology-aware components (object table, filter list, viewer, action forms) so agents assemble from a known kit instead of reinventing UI |
| Bonus | **design.md** | A markdown file encoding color/typography/spacing/branding as a spec the coding agent reads before generating UI; exportable straight from an OSDK Storybook |
| Bonus | **Agent skills (front-end)** | Reusable packets of front-end process/convention a workflow agent invokes by name instead of improvising layout each time |

## Verdict: spatial/canvas UI shown?

**Partial yes, but not QuantFlow's kind of canvas.** Frame 0013 ("Different Design Patterns for Complex Systems," ~03:13) shows a genuine **node-graph layout** — an "Investigation Orchestrator" box with directional edges fanning out to five named sub-agents (Content Framing Agent, Material Provenance Agent, Investigation Report Editor Agent, Root Cause Synthesis Agent, Impact Assessment Agent), each rendered as a card with its own line-item list. That is spatial, graph-based, and structurally close to a tiles-and-cables idea. But the talk immediately frames it as *too technical for the common analyst* and pairs it against a plain chronological timeline as the more legible alternative for end users — i.e. Palantir treats the graph view as a power-user/debug artifact, not the primary collaboration surface. Every other UI shown (outbreak inbox, legal-agreement review, policy table, comment threads) is conventional: side panels, inline document annotation, tables, chat threads. There is no persistent infinite canvas, no freeform tile placement, no cable-based data flow as the *default* human-agent surface — the graph view is a one-off orchestration diagram, then abandoned for a timeline.

## AVAILABILITY SIGNALS

None found. This talk is UX doctrine and internal design patterns, not a product, SDK, or API surface — nothing here is something QuantFlow could adopt or integrate, only imitate.

## Key quotes

> "We all remember designing for our users, using like human, like computer interaction principles, but now we have to do human computer agent principles who work now at 10 times the velocity of our human designers."

> "Technical users love to see the granularity to see exactly where in the agent chain called out to other agents. But, a little technical for maybe your common analyst."

> "Remember, if you're just generating raw text as your agent response, think about how you can enrich the agent responses with the richness of the platform itself."

## QuantFlow mapping

| Palantir pattern | QuantFlow equivalent | Status |
| --- | --- | --- |
| Trust and Attribution (agent vs. human labels, per-actor cards) | Receipts (proof-of-work, actor identity per run) | partial — receipts exist, per-actor card UI unbuilt |
| Node/graph orchestration view | Canvas tiles + cables *is* this, made persistent and primary rather than a one-off diagram | ahead — this is QuantFlow's actual bet |
| Chronological timeline (their "simpler" alternative) | Dock timeline / run history | embryonic |
| Encourage Collaboration (inline agent status, multi-candidate, ask-not-assume) | Tile-level status, inline diffs on canvas objects | unbuilt |
| Enrich Responses (live entity links, collapsible CoT) | Tile detail expansion, receipt drill-down | partially specced |
| Shared component library / design.md / agent skills | Dock's low-code component kit; no design.md equivalent | gap |

**Lane read:** Palantir explicitly tried a node-graph collaboration surface and demoted it to "too technical," defaulting non-expert users to a timeline. That is the closest any DevCon 6 talk comes to validating — and then abandoning — the canvas lane. It suggests the spatial graph is real UX territory Palantir has prototyped but chosen not to productize as the default; QuantFlow betting the *whole* surface on it, for expert single-user quant workflows (not broad "common analyst" audiences), is a legitimate contrarian bet rather than an unexplored one.

**What QuantFlow's canvas should absorb:** (1) Trust and Attribution — every tile/cable output needs an explicit agent-vs-human origin marker, not just a receipt buried in history; (2) Enrich Responses — tile outputs should render linked entities (datasets, other tiles, source runs) as live clickable objects instead of flattened text, matching the "ontology reference gets its own visual treatment" idea; (3) the ask-not-assume and partial-fill-and-flag-uncertainty micro-patterns from Encourage Collaboration map directly onto how agent tiles should surface missing inputs or low-confidence outputs on canvas.

## Key frames

The node-graph vs. timeline pattern (closest thing to canvas validation):

![[Attachments/QuantFlow/DevCon6/07-human-agent-patterns/frame_0013.jpg]]

The three named design patterns:

![[Attachments/QuantFlow/DevCon6/07-human-agent-patterns/frame_0016.jpg]]
![[Attachments/QuantFlow/DevCon6/07-human-agent-patterns/frame_0024.jpg]]
![[Attachments/QuantFlow/DevCon6/07-human-agent-patterns/frame_0030.jpg]]

Conventional UIs shown (outbreak inbox with chain-of-thought density problem, inline legal-doc collaboration, sources panel):

![[Attachments/QuantFlow/DevCon6/07-human-agent-patterns/frame_0011.jpg]]
![[Attachments/QuantFlow/DevCon6/07-human-agent-patterns/frame_0012.jpg]]
![[Attachments/QuantFlow/DevCon6/07-human-agent-patterns/frame_0032.jpg]]

Anti-slop tooling (OSDK components, design.md):

![[Attachments/QuantFlow/DevCon6/07-human-agent-patterns/frame_0044.jpg]]

All 51 frames live in `Attachments/QuantFlow/DevCon6/07-human-agent-patterns/`.

## Full transcript

![[Attachments/QuantFlow/DevCon6/07-human-agent-patterns/transcript.txt]]
