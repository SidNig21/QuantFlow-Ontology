# R0 — live two-seat collaboration from the installed application

**Captured 2026-08-04, founder present, driving the UI.** This is the first recorded QuantFlow
collaboration where both seats ran a real model, launched from an application installed by the real
installer rather than `bun run dev`.

**In plain terms.** Two AI agents, started from the installed app, sent each other a question and an
answer twice over. The app wrote down what happened, and the written record still matches the files
on disk when checked independently.

## What was run

Installer `QuantFlow Setup 0.8.4.exe`, built 2026-08-03 17:21, installed silently (exit 0) to
`C:\Users\rybow\QuantFlow-L1-Acceptance\install`. The installed `resources/app.asar` hashes
`233322EBB5F8B87AB6A05833F2EA2E78A0BC71BCC1E7690E7C28286A864AF228`, identical to the freshly built
bundle — so the running application is the merged `main` of 2026-08-03, not a stale install.

Both seats reported `kimi k3` and `MCP Servers (1) connected`. The founder typed the second task by
hand into the orchestrator tile.

## Kernel event trail

Eight events, ordered, no gaps.

| Time (UTC) | Event | Object |
|---|---|---|
| 00:26:31.846 | `agent_session.created` | orchestrator `224bb45a-f894-4b52-8527-5fd1d7293c24` |
| 00:26:31.851 | `agent_session.started` | `starting` → `running` |
| 00:26:48.507 | `agent_session.created` | worker `16a2f8df-882d-41b8-ae61-ff2549a60378` |
| 00:26:48.509 | `agent_session.started` | `starting` → `running` |
| 00:28:24.684 | `artifact.published` | `7afef345…` — task leg 1 |
| 00:28:34.644 | `artifact.published` | `cfb1df97…` — result leg 1 |
| 00:29:57.118 | `artifact.published` | `abc7533d…` — task leg 2 |
| 00:30:03.233 | `artifact.published` | `5025b1a2…` — result leg 2 |

Both sessions are distinct rows with distinct ids, and those ids match the tile headers the founder
saw (`…3c24` orchestrator, `…0378` worker). Session creation and start share a `trace_id`; each
artifact publish carries its own.

## Artifact hashes — recomputed, not trusted

Read from `~/.quantflow/artifacts/peer-handoffs/<hash>.json` and re-hashed with SHA-256:

| Artifact | Bytes | Result |
|---|---|---|
| `7afef3451bc16517…` | 423 | **VERIFIED** — recomputed hash equals id |
| `cfb1df97250b46bf…` | 438 | **VERIFIED** |
| `abc7533dd3ea4b0b…` | 423 | **VERIFIED** |
| `5025b1a230773d57…` | 438 | **VERIFIED** |

Every artifact is content-addressed: `id == content_hash == SHA-256(bytes on disk)`.

## What this proves

- Two real model-backed Hermes seats spawn from the **installed** application.
- They are distinct Kernel sessions, not one seat addressed twice.
- One task and one result cross the app-owned collaboration MCP, twice, and land as durable
  content-addressed Kernel artifacts.
- The canvas receipt shows sender, recipient, status, and Kernel identity, and those match the
  Kernel.
- The provider blocker that stopped live Hermes seats earlier on 2026-08-03 is gone.

## What this does NOT prove

Stated plainly, because a demo that impresses is the easiest place to overclaim.

- **The ontology is still not connected to any seat.** Both seats report exactly one MCP server: the
  collaboration bus. No seat called a generated ontology tool, because no seat can. That is R1, and
  nothing here changes it.
- The work exchanged was arithmetic, not research. No hypothesis, dataset, run, or evaluation was
  touched.
- Close, reopen, stopped-seat recovery, orphan-process check, and the founder-state comparison are
  recorded separately; this file covers the live exchange only.
- The founder's Hermes state comparison is a **hand-captured** before/after hash, not a gate. See
  `NEXT.md` deliverable 10.

## Shutdown, reopen, and founder-state comparison

**Normal close.** Closed with a real close request (`CloseMainWindow`, the same signal as clicking
the X — not a kill). 12 processes → **0**. No Hermes or OpenCode processes remained inside WSL. The
`node` PIDs still present predate the launch; `wslservice`/`wslrelay`/`vmmemWSL` are WSL
infrastructure, not app-owned.

**Reopen.** Both sessions persisted with identical ids and creation times, and boot reconciliation
moved them `running` → `closed` rather than leaving them falsely alive. The canvas showed both tiles
as `SESSION STOPPED`, and the Dock's session list showed both `CLOSED`, with ids matching the Kernel.
Dock availability text is honest: it states authentication is checked at launch and names the
recovery step.

**Tile transcripts did not return, by design.** A tile is a projection and may not remember anything
itself (Law A). The durable record survived where it is supposed to — in the Kernel, hash-verified
above. Recorded here because "collaboration intact" reads visually thinner than it is; that is a UX
question for the founder, not a correctness defect.

**Founder state, before versus after** (`founder-state-before.json`, `founder-state-after.json`):

| File | Before | After | Verdict |
|---|---|---|---|
| `~/.hermes/config.yaml` | `e94b59965d330dec…` · 10560 B | `e94b59965d330dec…` · 10560 B | **unchanged** |
| `~/.hermes/auth.json` | `2924b6a33c67b172…` · 12141 B | `2924b6a33c67b172…` · 12141 B | **unchanged** |
| `~/.quantflow/kernel.db` | `9487242D…` · 282624 B | `B6AF9C52…` · 294912 B | grew 12288 B, expected |

Hermes entries are SHA-256 only; contents were never read into any output file.

## Acceptance lines still open

Recorded so this run is not mistaken for a full R0 pass.

1. **App boot with Hermes genuinely unavailable was never tested.** The Dock's message was read, but
   Hermes was installed and working throughout. The "never blocks app boot" clause is unproven.
2. **Cancel was not exercised.** Spawn, receipt, close, reopen, and stopped recovery were; cancelling
   a running seat was not.
3. **No gate covers the founder-Hermes comparison.** The table above was captured by hand. Until
   `NEXT.md` deliverable 10 lands, this is an acceptance step, not a measurement, and must not be
   described as proven.

## Reproduce

```bash
bun qa/verify-release.ts
```

Then launch the installed application, spawn `hermes-orchestrator` and `hermes-worker` from the Dock,
and ask the orchestrator to have the worker compute something and send the answer back.
