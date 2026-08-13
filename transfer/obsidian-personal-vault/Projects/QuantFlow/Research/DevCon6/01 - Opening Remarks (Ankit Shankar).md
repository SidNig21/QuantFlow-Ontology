---
tags: [quantflow, palantir, devcon6, agent-stack]
source: https://www.youtube.com/watch?v=6_6OvDIET_w
speaker: Ankit Shankar
duration: "09:30"
analyzed: 2026-07-16
transcription: local whisper.cpp (base.en) — no captions on upload
---

# 01 — Opening remarks (Ankit Shankar)

The talk that launches Palantir's **agent stack**. Builds from a trivial `generateText` agent up through the real production problems, then reveals the six-layer stack as the answer.

## The argument, compressed

1. Palantir ships real agents to production (hospital discharge, mortgages, defense) — and forward-deployed engineering taught them what earning those wins takes.
2. A real agent is **"more of a state machine than a simple function"** — multiplayer, with users and external systems mutating shared state mid-run.
3. A frontend exists to **build trust before increasing autonomy** — put the agent in front of the nurse/foreman/network engineer, show **proof of work** and **the state of the world as the agent saw it when deciding**.
4. Message-log formats lose the structure needed for both good interfaces *and* **compounding** (aggregating success/failure patterns to improve agents over time).
5. **Durable execution**: model/API failures leave sessions incomplete; sessions span hours-to-weeks; critical workflows can't drop sessions.
6. Plus: security (minimum scope, isolated sessions), retry semantics, concurrency, end-to-end observability, model migration.
7. Answer: the agent stack — Ontology → Orchestrator → Agent Engine → Agent SDK/Builder → Agent Manager → AIP Evolve.

## Key quotes

> "The world might have changed. And we might be showing a state that is not what the agent saw when it was going and making these decisions."

> "It's more of a state machine than a simple function."

> "We need to be able to understand their work and build trust before increasing their autonomy."

> "And of course, all of this is possible because it's built on that foundation of ontology. The substrate that represents your organization."

## QuantFlow mapping

| Palantir layer | QuantFlow equivalent | Status |
| --- | --- | --- |
| Ontology | Kernel — but note the altitude difference: theirs models the *organization*, ours models the *work* (tiles, tasks, runs, proofs) | different altitude |
| Orchestrator | AgentOS host (durable actor sessions) | embryonic |
| Agent Engine | v7 `RuntimeHandle` contract | specced, unbuilt |
| Agent SDK / Builder | Dock = low-code door; no pro-code SDK | half |
| Agent Manager | Receipts + watchtower | embryonic |
| AIP Evolve | — | **gap** |

**Lane hypothesis:** QuantFlow sits at the Orchestrator + Agent Manager altitude wearing a spatial canvas — the "watch and govern the agents" layer. Palantir puts agents in front of decision makers via conventional UIs; nobody in their stack renders the work spatially. Their trust/proof/state-at-decision-time doctrine *is* the Kernel Constitution + receipts, independently arrived at.

## Key frames

The stack reveal, layer by layer:

![[Attachments/QuantFlow/DevCon6/01-opening-remarks/frame_0016.jpg]]
![[Attachments/QuantFlow/DevCon6/01-opening-remarks/frame_0019.jpg]]
![[Attachments/QuantFlow/DevCon6/01-opening-remarks/frame_0020.jpg]]

Frontend doctrine and production challenges:

![[Attachments/QuantFlow/DevCon6/01-opening-remarks/frame_0008.jpg]]
![[Attachments/QuantFlow/DevCon6/01-opening-remarks/frame_0015.jpg]]

All 18 frames live in `Attachments/QuantFlow/DevCon6/01-opening-remarks/`.

## Full transcript

![[Attachments/QuantFlow/DevCon6/01-opening-remarks/transcript.txt]]
