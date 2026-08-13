---
tags: [quantflow, palantir, devcon6, agent-stack, orchestrator]
source: https://www.youtube.com/watch?v=ZTw66mjYATo
speaker: unnamed Palantir engineer (product launch)
duration: "17:30"
analyzed: 2026-07-16
transcription: local whisper.cpp transcript (transcript.txt) — no captions on upload; report.md frame extraction had no transcript, transcript.txt supplied separately
---

# 02 — Orchestrator (Agent Infrastructure Layer)

Product launch for **Orchestrator**, Palantir's durable-execution layer for agents. Builds a toy "patient discharge agent," walks through every way it fails in production, then shows how wrapping it in the Orchestrator SDK (two methods: `orchestrator.run`, `orchestrator.signal`) fixes all of them, closing with a live demo on the DevCon Foundry stack.

## The argument, compressed

1. Demo-layer agents fail in production for boring infra reasons, not model quality: process crashes, node upgrades, OOM, model/provider outages.
2. Naive fixes don't work: local memory is lost on restart; persisting only the *conversation* history still leaves non-deterministic tool inputs (e.g. a `now()`/`day` variable resolves differently on replay — Tuesday's labs vs. Wednesday's labs).
3. Three concrete production failure modes named explicitly: **no memory across restart**, **duplicate side effects on replay** (double prescription, double billing), **can't wait** (long-lived human-in-the-loop processes are themselves an OOM/restart liability, and cost money while idle).
4. Also: can't easily replay/debug agents after the fact because the world (side effects, patient state) has moved on.
5. **Central thesis, stated as a slide**: "The bottleneck is not intelligence. It is trust." Models are already smart enough; what's missing is confidence the agent will complete work safely and exactly once.
6. Orchestrator SDK: wrap each step in `orchestrator.run(...)` — executes once, result recorded to a durable **ledger**; every later re-invocation replays from the ledger instead of re-executing, using an idempotency key per execution attempt to guarantee exactly-once side effects.
7. `orchestrator.signal(...)` lets a process check for an external signal (doctor sign-off, webhook, timer, ontology object change, LLM completion) and **suspend** — fully torn down, zero memory/CPU/disk/cost, existing only as ledger state — until the signal lands, at which point a new micro VM is spun up and rehydrated from ledger + signal.
8. Named adjacent concerns (mentioned, not solved in this talk): **isolation** via micro VMs (kernel-level, prevents malicious/runaway code execution), **sub-agent orchestration** (agent-calls-agent graphs tens/hundreds deep, propagating retries/cancellations through the whole graph), **security/permissioning** (Foundry access controls gating agent resource access), **observability at scale** (deferred to next speaker's talk).
9. Architecture diagram: execution request → queue (enables backpressure under model-provider outage/rate limits) → event loop → "core-dight"(?) service spins up a micro VM → agent runs, calls tools/subagents → hits suspension point → shuts down, exists only in ledger → signal service (LLM completion, user approval, ontology change, timer, webhook) fires → rehydrate from ledger + signal → resume.

## AVAILABILITY SIGNALS

None found. No pricing, no self-serve tier, no SDK distribution outside Foundry/AIP mentioned, no GitHub link, no "available today" language, no public developer docs referenced. The demo runs entirely "on our DevCon stack" (i.e., inside Foundry). The SDK import shown on-slide is `import { DurableContext } from "@palantir/durable-functions"` — an internal/Foundry-scoped package name, not shown as installable outside the platform.

## Key quotes

> "The bottleneck for an agent's usefulness today is often not intelligence. It is trust."

> "Suspend here means that the process is entirely torn down. It has no memory, no CPU, no disk. It does not exist anywhere except for in the ledger basically. And it therefore costs nothing."

> "Once you realize that restarting agents is safe, you realize that you can build agents that can stop."

## QuantFlow mapping

| Orchestrator concept | QuantFlow equivalent | Status |
| --- | --- | --- |
| Ledger (durable record of each `orchestrator.run` step) | v7 `RuntimeHandle` execution log / receipts | receipts exist as concept, not wired to per-step replay |
| `orchestrator.run` exactly-once + idempotency key | AgentOS host durable actor session — needs an equivalent idempotency contract for tool/side-effect calls | gap — not yet specced at this granularity |
| `orchestrator.signal` + suspend (zero-cost teardown, rehydrate on external event) | Closest fit: the kill-switch + durable session pause QuantFlow doesn't have yet ("no pause" is explicit v1 scope per 00 doc) | gap — Orchestrator's suspend model is the missing piece for QuantFlow's declared "no pause" limitation |
| Micro VM isolation per agent execution | Cloudflare sandbox execution environments (CPU-only, 4 vCPU/12GiB) | different substrate, same intent (isolate agent code execution) |
| Sub-agent orchestration graph | DELEGATES_TO link type in Kernel ontology | conceptually mapped, no runtime graph-level retry/cancel propagation built |
| Signal service (webhook/timer/approval/ontology-change) | Kernel event bus / watchtower | embryonic |

**Lane note:** this talk is the sharpest available argument for QuantFlow's own durability gap. QuantFlow's v1 scope explicitly excludes "pause" (per 00 — The Integration Question); Orchestrator's suspend/rehydrate-for-free model is exactly the primitive that would fill that gap, and it maps cleanly onto a single-user local-first system since the "ledger" here is just durable storage + a replay discipline, not something that requires Foundry's queueing/backpressure machinery at QuantFlow's scale.

## Key frames

The core idea, stated in code — `orchestrator.run` / `orchestrator.signal`:

![[Attachments/QuantFlow/DevCon6/02-orchestrator/frame_0006.jpg]]

Thesis slide:

![[Attachments/QuantFlow/DevCon6/02-orchestrator/frame_0005.jpg]]

Live demo — triage/discharge dashboard built on Orchestrator:

![[Attachments/QuantFlow/DevCon6/02-orchestrator/frame_0009.jpg]]

Demo code — signal-gated tool call (`fetchExternalRecords`) with approval:

![[Attachments/QuantFlow/DevCon6/02-orchestrator/frame_0010.jpg]]

Demo — suspended process awaiting signal, ledger/technical-details view with task completions:

![[Attachments/QuantFlow/DevCon6/02-orchestrator/frame_0011.jpg]]

All 15 frames live in `Attachments/QuantFlow/DevCon6/02-orchestrator/`.

## Full transcript

![[Attachments/QuantFlow/DevCon6/02-orchestrator/transcript.txt]]
