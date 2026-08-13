---
tags: [quantflow, palantir, devcon6, agent-stack, security]
source: https://www.youtube.com/watch?v=hymyfucOgSo
speaker: Nick (Infrastructure Security Engineer, Palantir)
duration: "14:49"
analyzed: 2026-07-16
transcription: local whisper.cpp — no captions on upload
---

# 06 — Security Forge: Wielding Agents for Defensive Cyber

A **reference architecture** talk: how Palantir turned a single Claude Code / Codex vulnerability-review session into a governed, ontology-backed, multi-agent system that runs across thousands of internal repositories and closes the loop from detection to remediation.

## The argument, compressed

1. **The threat has scaled past human-vs-human.** Adversaries now use LLMs to probe and exploit at a speed/scale no human security team can match alone — that's the forcing function for Security Forge.
2. **Evolution in three steps:** (a) single Cloud Code session with codebase as context → (b) multi-agent architecture (parallel subagent sessions) for scale → (c) multi-agent + organizational context/documentation/API attack-surface knowledge, because generic scanning missed what makes *your* architecture unique (e.g., Palantir's centralized auth microservice pattern).
3. **Security Forge sits between systems of record** (source code, docs, deployment infra) **and coordinates everything through the ontology** — closing the vulnerability remediation loop: Detect → Validate → Remediate → Resolve → Learn (a continuously improving cycle, not a one-shot scan).
4. **Orchestration pipeline per review:** threat modeling → attack-surface mapping → specialized hunting agents (e.g., one agent tasked specifically with auth-bypass issues) → triage (true/false positive) → deduplication → prioritized reporting, so humans see a short, high-signal list instead of thousands of raw findings.
5. **Grounding, not hallucination:** findings are tied to CVE records, CWEs, and MITRE ATT&CK/D3FEND techniques via the ontology, so severity/CVSS scores are explainable and reliable rather than model-invented.
6. **Human handoff at the end of the loop:** either trigger automated code-generation remediation, or hand packaged context (vulnerability description, code locations, impact, provenance of the finding) to developers via the **ontology MCP** so they fix it in their own Cloud Code/Codex session — "meeting developers where they are."
7. **Scaling isn't just running more copies** — it's tailored orchestrators per service type/language/vulnerability class, modeled and configured in the ontology, assembled from reusable stages (recon, hunting stage with parallel/sequential/looped agents) instead of hand-written from scratch each time.
8. **Compounding via agent introspection:** every tool call, MCP server used, and reasoning trace is captured — if an agent gets blocked and pivots, that trajectory feeds future runs so the system gets less blocked over time. Read *and* write access to the ontology (threat models, findings, pentest reports) makes this durable and reusable across workflows, not just within one run.

## AVAILABILITY SIGNALS

None found. No public repo, SDK, pricing, or self-serve access mentioned; Security Forge is presented purely as an internal Palantir capability built on AIP/ontology, illustrating the pattern rather than offering a product to adopt.

## Key quotes

> "Adversaries are utilizing AI at a speed and scale that we haven't seen before... humans are no longer the only threat."

> "The model alone wasn't the only answer. It's all of the context and the system around the model that we need to build in order to generate the best results."

> "We can know for a fact that the results are of the highest signal, and that we're not wasting [human operators'] time when they have to look through a report of findings."

## QuantFlow mapping

| Security Forge element | QuantFlow equivalent | Notes |
| --- | --- | --- |
| Threat-modeling + hunting agents (auth-bypass specialist, etc.) | Researcher agent(s) in Researcher → Backtest → Critic → Evaluation | Their per-vulnerability-class specialist agents mirror a tailored-Researcher pattern instead of one generic prompt |
| Triage (true/false positive) + dedup | Critic stage | Same job: cut signal-to-noise before a human ever looks |
| CVE/CWE/MITRE grounding | Evidence/receipts requirement | Both refuse to let the agent assert severity/confidence without an external, auditable reference — this is the strongest structural parallel |
| Ontology read+write (threat models, findings, pentest reports stored back) | Kernel + receipts, but QuantFlow's receipts are currently read-mostly | **Gap to close**: Security Forge explicitly writes outcomes back into the substrate so future runs inherit prior trajectories (agent introspection → compounding) — QuantFlow's Evaluation stage should feed forward into Researcher priors, not just log a verdict |
| Human handoff via ontology MCP to developer's own Cloud Code session | Operator-gated Conductor approval gate | Both patterns "meet the human where they are" with packaged context rather than raw agent output |
| Tailored orchestrators per service/language/vuln-class, modeled abstractly and reused | v7 RuntimeHandle / Dock templates | Confirms the "don't write a harness from scratch every time" instinct is right — orchestrator-as-configuration, not orchestrator-as-code |

**What QuantFlow should steal:** the write-back loop — capturing full agent introspection (tool calls, pivots, blocked-then-recovered trajectories) from every Backtest/Critic run and feeding it into the ontology/Kernel so the next Researcher run starts smarter — and the triage-before-human-eyes discipline (dedup + grounded confidence) so the Evaluation stage surfaces only high-signal results, not a raw findings dump.

## Key frames

The core loop (Detect/Validate/Remediate/Resolve/Learn) and orchestration model:

![[Attachments/QuantFlow/DevCon6/06-security-forge/frame_0006.jpg]]
![[Attachments/QuantFlow/DevCon6/06-security-forge/frame_0009.jpg]]

A single finding walked end-to-end — attack-chain graph, CVSS breakdown, remediation action:

![[Attachments/QuantFlow/DevCon6/06-security-forge/frame_0004.jpg]]
![[Attachments/QuantFlow/DevCon6/06-security-forge/frame_0002.jpg]]

Orchestrator library (tailored per service/vuln-class) and a multi-stage pipeline run in progress:

![[Attachments/QuantFlow/DevCon6/06-security-forge/frame_0012.jpg]]
![[Attachments/QuantFlow/DevCon6/06-security-forge/frame_0010.jpg]]

All 21 frames live in `Attachments/QuantFlow/DevCon6/06-security-forge/`.

## Full transcript

![[Attachments/QuantFlow/DevCon6/06-security-forge/transcript.txt]]
