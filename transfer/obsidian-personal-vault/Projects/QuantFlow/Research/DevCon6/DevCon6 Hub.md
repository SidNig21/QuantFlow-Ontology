---
tags: [quantflow, palantir, devcon6, research]
created: 2026-07-16
---

# DevCon 6 hub

Palantir DevCon 6 (July 2026). Content is fresh — no captions on uploads, so transcripts are produced locally (whisper.cpp). Each talk gets a note with summary, QuantFlow mapping, key frames, and full transcript.

## The agent stack (as launched at DevCon 6)

Bottom to top:

| Layer | Role |
| --- | --- |
| **Ontology** | Substrate representing the customer's organization; how AIP understands deployed agents |
| **Orchestrator** | Durable execution layer — isolation, security, observability, long timescales |
| **Agent Engine** | The agent primitive; expressive API for many agent shapes |
| **Agent SDK / Agent Builder** | Pro-code (strongly typed) and low-code doors to the same building blocks |
| **Agent Manager** | Fleet-wide telemetry and observability for deployed agents |
| **AIP Evolve** | Automatic model migration / cost-performance optimization across whole workflows |

## Talks analyzed

0. [[00 - The Integration Question]] — the strategic frame + **final verdict**
1. [[01 - Opening Remarks (Ankit Shankar)]] — the agent stack launch and its motivation
2. [[02 - Orchestrator (Agent Infrastructure Layer)]] — durable ledger, replay, zero-cost suspend via `run`/`signal`
3. [[03 - Agent Engine]] — context items / events / effects; typed sessions; approval gates as pending state objects
4. [[04 - Agent Observability & Optimization]] — zero-config telemetry, Agent Timeline, Evolve's experiment-search mechanism
5. [[05 - DevX SuperRepo & Agent Development]] — local embedded Rust ontology, schema-drift as lint error, parallel worktrees; **key availability evidence**
6. [[06 - Security Forge (Defensive Cyber)]] — governed multi-agent reference architecture; ontology write-back loop
7. [[07 - Design Patterns for Human-Agent Collaboration]] — trust/attribution patterns; **they retreated from the graph view**
8. [[08 - Ontology MCP]] — one ontology-backed MCP server beats N per-system servers; tools fall out of the object/link graph
9. [[09 - Ontology Governance]] — DDD-first modeling, the six anti-patterns (God Object, Kitchen Sink, Silos, Action Sprawl, Golden Hammer, Misnomer), extend-don't-mutate
