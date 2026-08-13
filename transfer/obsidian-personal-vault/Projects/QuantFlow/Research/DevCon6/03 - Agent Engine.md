---
tags: [quantflow, palantir, devcon6, agent-stack]
source: https://www.youtube.com/watch?v=mDGjptFvePY
speaker: (unnamed — female presenter, agent platform team)
duration: "19:49"
analyzed: 2026-07-16
transcription: local whisper.cpp — no captions on upload
---

# 03 — Product Launch: Agent Engine

The product-launch talk that fills in the two middle layers of the agent stack Ankit revealed in talk 01: **Agent Engine** (the runtime/API layer hosting agent primitives) and **Agent SDK** (pro-code layer on top). Live-demos a hospital-discharge agent, twice — once naive, once rebuilt with Agent Engine primitives to add human-in-the-loop approval and async data updates.

## The argument, compressed

1. Agents "aren't one shape" — task agents, co-pilots, autonomous, interactive, non-interactive — any framework must support all of them.
2. The real world is asynchronous and concurrent: an agent can be waiting on a nurse, a lab result, a build system for a week; two events can race. This makes a production agent look like **a distributed system, not a `while` loop wrapping tool calls**.
3. Every participant (nurse, hospital admin, another model doing feedback) needs a different rendering of the same agent state — "you can't build trust without properly rendering the agent to each participant."
4. Concretely: the AIP Foundry build/discharge functionality is "more of a state machine" with states (started, running, canceled, failed) and rich human-in-the-loop transitions.
5. Solution: three primitives — **context items**, **events**, **effects** — composed into an agent loop that is, under the hood, "a distributed state machine."
6. Demo arc: v1 agent (tool calls a `discharge_patient` action directly, no approval, no UI) → v2 agent (tool returns a `PendingDischargeContextItem` instead of executing; nurse approval becomes an event; a new-lab-result event can invalidate a pending decision and force reassessment) — "not that many lines of code" for the added complexity.
7. Roadmap teased: Agent Engine primitives will power a **no-code Agent Builder** ("coming soon") and a new **Agent Manager** app (cross-org pane of glass over every pro-code and low-code agent).

## The programming model (from code slides)

- **Context items** — strongly-typed, developer-defined state objects that live inside an agent session (e.g. `PendingDischargeContextItem` with a schema of `patientId` + `approvalStatus: pending | approved | denied | invalidated`). They hold their own state and are what gets rendered to the front end — instead of "just printing to the LLM" or regex-parsing a blob, the UI reads typed state directly.
- **Events** — typed messages that mutate context-item/session state (`submitDischargeApprovalEvent { approvalState }`, `newLabResultEvent`). Handlers you write in code receive events and return **mutations** (state updates) and/or **effects**.
- **Effects** — asynchronous, reach out to the real world (model provider calls, the `discharge_patient` ontology action) and dispatch new events back into the queue when they resolve. This is explicitly how the agent loop connects outward.
- **Session = list of typed "context items"** — system prompt, user messages, assistant messages, tool calls/results are all typed context items, not a flat message-array log (contrast with a plain chat-completions transcript).
- Tools on the SDK: `name`, `description`, input schema, async `execute` — visually resembles the Anthropic/OpenAI tool-call shape but the return value can be a literal string **or** a context item (which is how the approval gate gets inserted without changing the tool signature).
- Escape hatch: SDK is "pro-code" (define model, system prompt, tools in a few lines); you can always drop down to raw Agent Engine APIs for full control. Low-code Agent Builder (coming soon) will expose the same primitives to non-engineers.
- Everything sits on **Orchestrator** (durability layer from the prior talk) — session state survives process death, unlike, per the speaker's own example, "if the terminal dies while [Claude Code] is working, you lose all your sub-agents' work."

## AVAILABILITY SIGNALS

- Agent SDK: **"available here as a beta at DevCon"** — explicit hands-on availability, plus a Canary session at the conference walking through setup.
- Agent Engine itself: described as the underlying API/runtime layer the SDK is built on ("you can always escape hatch down to build on top of the agent engine API layer") — implies it's accessible to SDK beta users, not stated as separately gated.
- Agent Builder (low-code) and Agent Manager: both explicitly **"coming soon"** — not available at time of talk.
- No GitHub link, no open-source claim, no pricing, no mention of availability outside Foundry/AIP. All demos run inside AIP Foundry workspace UI (branch/files panel visible in code frames) — this is a Foundry-hosted dev experience, not a standalone SDK you `npm install` outside the platform.
- No developer-tier or self-serve signup mentioned in-talk.

## Key quotes

> "What we actually have is agents that need to be multiplayer, they need to handle race conditions and incoming signals, and they have to have maximal flexibility and be renderable to all participants."

> "By stitching these three primitives together, we actually get an extremely powerful agent loop that under the hood is a distributed state machine."

> "It wasn't that many lines of code in order to add the complexity that we actually require for an agent like this that's actually discharging patients."

## QuantFlow mapping

| Palantir concept | QuantFlow equivalent | Status |
| --- | --- | --- |
| Agent Engine (context items / events / effects loop) | v7 `RuntimeHandle` contract — the typed session-state contract AgentOS actors must satisfy | specced, unbuilt |
| Context item (typed, renderable state, not a message blob) | Kernel tile/task state as typed objects, not chat-log strings | partially true today — Kernel already avoids blob state |
| Event → handler → mutation/effect | Eve's ACP + Vercel `ToolLoopAgent` tool-call loop | loop exists; typed event/mutation split does not |
| Session surviving process death (Orchestrator underneath) | AgentOS actor encasement — durable session across tab/process loss | embryonic, same gap as talk 01 |
| Agent Builder (low-code, coming soon) | Dock | half — Dock is QuantFlow's low-code door already |
| Agent Manager | Receipts + watchtower | embryonic |

**What to steal:** the context-item pattern — model pending/uncertain agent decisions as a first-class typed state object (not a tool call that already executed, and not a raw string in the transcript) so a human-approval gate or an invalidating event (new data arriving mid-run) can be inserted without touching the tool's call signature. This maps directly onto hardening the `RuntimeHandle` contract: give it an explicit state-machine vocabulary (pending/approved/denied/invalidated equivalents for run proposals) instead of collapsing everything into "tool called, tool returned."

## Key frames

The three-primitive loop and stack layering:

![[Attachments/QuantFlow/DevCon6/03-agent-engine/frame_0009.jpg]]
![[Attachments/QuantFlow/DevCon6/03-agent-engine/frame_0024.jpg]]
![[Attachments/QuantFlow/DevCon6/03-agent-engine/frame_0026.jpg]]

Code: the pending-discharge context item, its event handlers, and the mutation/effect split:

![[Attachments/QuantFlow/DevCon6/03-agent-engine/frame_0017.jpg]]

Demo: typed context items in the raw session (tool result / string literal), and the nurse-facing rendered UI with async lab-result invalidation:

![[Attachments/QuantFlow/DevCon6/03-agent-engine/frame_0016.jpg]]
![[Attachments/QuantFlow/DevCon6/03-agent-engine/frame_0021.jpg]]

Roadmap teaser — low-code Agent Builder:

![[Attachments/QuantFlow/DevCon6/03-agent-engine/frame_0023.jpg]]

All 30 frames live in `Attachments/QuantFlow/DevCon6/03-agent-engine/`.

## Full transcript

![[Attachments/QuantFlow/DevCon6/03-agent-engine/transcript.txt]]
