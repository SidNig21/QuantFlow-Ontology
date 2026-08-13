---
tags: [quantflow, hub]
created: 2026-07-16
---

# QuantFlow hub

Where autonomous work becomes visible, coordinated, and provable.

> **START HERE → [[QUANTFLOW_QUICKSTART]]** — the build operating guide: the four seats, the
> copy-paste prompt for each, your four checks, and exactly what to do tomorrow morning.
>
> **Repo: `~/QuantFlow-Ontology`, branch `main`**, public on GitHub. Everything binding lives
> there; this vault is reference only. Where the two disagree, **the repo wins.**

## Current era (corrected 2026-07-25 — three items below were stale and reversed)

- **Platform:** Linux (since 2026-07-16); Windows era archived, Mac rebuild abandoned before it started.
- **Active plan:** the **Ontology Doctrine ladder**. `docs/DOCTRINE.md` is the plan of record,
  `docs/orders/SCOPES.md` is the eleven-rung sequence, `docs/orders/NEXT.md` points at the live
  order. The repo's `START_HERE.md` is the front door. *(The old `docs/v7/DOCK_RUNTIME_REWORK_SPEC.md`
  / AgentOS-Anchor plan belongs to the predecessor repo — history, not a route.)*
- **Cloud pivot: REVERSED (2026-07-24).** QuantFlow runs **local on the Alienware tower**, with
  Tailscale for remote reach. The client/server seam was measured and does exist if ever
  needed — it is not needed. The canvas stays either way.
- **Scope, settled:** **research and advisor only.** QuantFlow proposes, backtests, criticizes,
  evaluates and reports. The operator places every bet and trade. No rung relaxes this.

## Strategic question — ANSWERED (2026-07-24)

*Leverage Palantir's ontology/agent stack, or borrow its framing and stay independent?*

**Borrow the doctrine, build on none of their platform.** QuantFlow sits at the *Orchestrator +
Agent Manager* altitude with a spatial canvas nobody in that stack has — see
[[01 - Opening Remarks (Ankit Shankar)]]. Foundry is the teacher, never the host.

## Research

- [[QuantFlow Rebuild Blueprint]] — **the founding document of the rebuild** (stack layers, schema rules, roadmap)
- [[QuantFlow Ontology Schema v0]] — **schema v0.2** — types + transition tables + command/event split; freezes at WO-003
- [[QuantFlow Build Order]] — **the full WO ladder** — v0.1 detailed, v0.5 named, v1.0 gated; definition of done
- [[Orders/Workshop Protocol|Workshop Protocol]] — how the build runs: Fable architects/verifies, builders (Codex/Cursor/Claude #2) execute work orders, gates + CI verify
- **Order board:** [[Orders/WO-000 - Cut the fork|WO-000 Cut the fork]] (fable+founder) · [[Orders/WO-001 - Codegen spike|WO-001 Codegen spike]] (builder — ready now)
- [[DevCon6 Hub]] — Palantir DevCon 6 talk-by-talk analysis (9 talks)
- [[Cerebras Knowledge Base - Retrieval Layer Notes]] — the future recall layer (system of record vs system of recall; distill-then-embed, hybrid retrieval, RRF)

## Repo state — **do not cache it here**

This section used to hold gate counts, the live order number, and type counts. All of it rots,
and this file has already been caught nine days stale once, telling the wrong repo and a
reversed decision. **State goes in the repo; this file tells you how to ask.**

```bash
cd ~/QuantFlow-Ontology && git pull
bun qa/run.ts --all          # are the checks green?
cat docs/orders/NEXT.md      # which order is live?
git log --oneline -5         # what just happened?
```

For *why* the plan is shaped the way it is — including the write-path gap found 2026-07-25 —
read `docs/DOCTRINE.md` amendment A5 and `docs/orders/SCOPES.md`. Those are versioned and move
with the code. This note is not.

*Any pre-2026-07-18 audit numbers you find in this vault describe the **predecessor** repo
`~/QuantFlow`, now a read-only parts shop. Not this one.*
