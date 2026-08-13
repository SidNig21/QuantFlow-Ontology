Good context dump — and the Hermes/AgentOS reasoning from that chat is architecturally sound, so before answering your questions I want to make it _repo truth_ rather than chat memory. The shared-truth rule cuts both ways: a direction you've adopted that lives only in a conversation doesn't exist. Let me land it, then answer.

Landed as `73e22b7` (CI confirming in background). The Hermes direction, the open-host rule, and the dock's place are now in `BLUEPRINT.md` and `ROADMAP.md` — not just in a chat you'll lose. Now your actual questions.

## The Hermes verdict, in one line

That other chat's architecture is correct and I recorded it as written: **the ACP seam WO-004 proved is a socket, and guests are species** — `ToolLoopAgent` is the v0.1 species, Hermes (`hermes acp`) is the recorded candidate for v0.5, and next month's find plugs into the same hole. The three anti-Eve rules are now doctrine: Kernel stays sole writer (Hermes' own memory SQLite is _its_ working state, never QuantFlow's ledger), new tools enter as MCP/software packages under deny-by-default, and the dock is a Kernel projection like every tile. Your "I like finding new tools" requirement is now a stated design principle, not a preference I have to remember.

One consequence for me as order-writer: **WO-006c gets written against the seam, not against ToolLoopAgent** — so swapping Hermes in later is a package change, not a rework.

## How far does the roadmap take us?

All the way to your definition of done: **v1.0 = your daily driver for making predictions in a market of your choosing.** The ladder is v0.1 (one agent, one artifact, provable) → v0.5 (one real quant workflow end-to-end) → v1.0 (recipes, save/reopen, lineage view, soak, packaging). Beyond that, post-v1 is deliberately reserved, not planned: RL via PufferLib, the recall layer, Evolve-style experiment search, and the dogfood flip. So the roadmap doesn't run out — it ends exactly at the product you described, with the ambitious stuff parked where it can't cause scope creep.

## What's left on your list _right now_

**To close v0.1 — three steps, and the first two are this week:**

1. **I verify WO-006b** — it's built and pushed (`761ba58`), sitting unverified. Say "verify 006b" (or paste Cursor's report) and I'll run it cold.
2. **You run the Law D demo** — [docs/demos/law-d.md](https://claude.ai/epitaxy/docs/demos/law-d.md), the publish → force-kill → relaunch script. This is _founder acceptance_, the first hands-on gate that's yours by design. It's also the first launch of the app on this machine ever, which is its own finding.
3. **WO-006c** — I write it (against the swappable seam), a builder builds it, I verify. Spawn from canvas → stream into tile → publish through the Kernel → cancel/retry/close. **That closes v0.1.**

**Then v0.5 — seven chunks, now including yours:** dock rebuild · agent contracts with the species seam (Researcher/Backtester/Critic — this is your "evolution of specialized agents") · data reality (bootstrap datasets, then the Bovada scraper) · Python sidecar · Cloudflare sandboxes · trace timeline + object inspector · the defining-workflow E2E order that closes the phase. My honest guess: **8–12 orders**, and unlike v0.1 they won't all be one-day orders — the scraper and point-in-time data correctness have real-world messiness that codegen didn't.

## On the time struggle

Ground truth: the roadmap estimated **4–8 weeks** for v0.1. You're closing it in about **two days**, with six verified orders, a Kernel that can't drift, and a runtime bet proven instead of assumed. The reason it _feels_ slow is that everything built so far is load-bearing and invisible — schemas, gates, proofs. The next two steps are exactly where that flips: WO-006b puts the Kernel _on the canvas_, and your redesign work in Claude design is the face it gets. The dock screenshot you posted is the old repo's ghost; the new one gets rebuilt on truth.

Say the word and I'll start the WO-006b verification.

Memory updated — a fresh session now inherits the true board: v0.1 one order from closing, WO-006b built and awaiting verification, the open-host principle, and the hard-won process lessons.

Standing by on two fronts, whichever you trigger first:

1. **"Verify 006b"** — I run it cold in a clean worktree, then hand you the Law D demo script.
2. **Cursor's WO-006b report** — same thing, with its claims to check against.

After that: your force-kill → relaunch demo, then I write WO-006c against the species seam, and v0.1 closes.

---
---
# Cursor Report:
**Status (2026-07-17 → 2026-07-19):** QuantFlow went from fork/foundation to a verified Kernel + creation path, with WO-006b built on a branch (not merged). Authored commits under `SidNig21`.

### By work order

**WO-000 / foundation (Jul 17)**  
Fork cleaned; CI branch filters fixed; `docs/orders/` whitelisted; front door + qa gates + honest test suite landed (`ba9da39`).

**WO-002 (+a/b/c) (Jul 18 early)**  
Blueprint, schema v0.1, roadmap, protocol graduated; Laws A–E adopted (foundation closed); Law F + shared-truth; market-agnostic definition of done + dogfood flip named. Handoff machinery: founder script, `NEXT.md`, reviewer role, `VERIFYING.md`.

**WO-001 (Jul 18)**  
`qf-kernel-schema` codegen spike shipped and **PASS-merged** (`05dffc9` → `e3cf7af`).

**WO-003 (Jul 18)**  
Full schema v0.2 + transition conformance gates shipped and **PASS-merged** (`ad20c58` → `a3cdc6f`); schema gate self-install fix for CI.

**WO-004 (Jul 18)**  
Mock-model proof (no API keys); rejected Eve-coupled `agentos-host` harvest; AgentOS→ACP→ToolLoopAgent proof held and **PASS-merged**; P1 later amended (self-equality).

**WO-004a (Jul 18)**  
Proof correction: measured session identity, strict cancel, `/tmp` receipt removed; rework D1 (listSessions without keyed lookup); **PASS-merged**; debt #2 retired; WO-006 split recorded.

**WO-005 (Jul 18)**  
Kernel v0: generated migration SQLite, command/event layer, Law E gates — **PASS-merged** (`ed05703` → `a80e763`).

**WO-006a (Jul 18)**  
`publish_artifact` + content hash; three verify/rework rounds (D1–D5: metadata conflict, replay id, dispatch table, single event writer, Kernel env bypass removed); **PASS-merged**; debt #0 retired.

**WO-006b (Jul 18–19)**  
Orders drafted/amended (`node:sqlite`, pre-build 5-blocker fix); feat branch pushed — Kernel in app, Artifact tile, Law D demo (`761ba58`). **Not verified/merged.** Open-host / swappable guest-agent principle recorded (`73e22b7`).

**WO-006c**  
Blocked; order not written in this window.

---

**Bottom line:** In ~1.5 days, WO-001→006a are done on `QuantFlow`; the remaining v0.1 rung is closing WO-006b (+ then 006c).
---
---
# Close-out — 7/19

## v0.5 gates fixed (`c0f3fd5`)

Founder asked for the v0.1 → v0.5 path detailed enough not to revisit. Landed in `ROADMAP.md`:

**The dock contract** — binds WO-007/008 and every species forever. Plug-and-play made measurable, not slogan:
1. **A plug is data, not code** — one species = AgentOS software package + `agent_definition` row + deny-by-default manifest.
2. **Admitting a species requires zero dock/canvas source changes** — gated *by diff*, not assumed.
3. **The dock is a projection** (Laws A–C) — renders the registry and live sessions, stores nothing, gets its own Law D test.
4. **Session lifecycle on the dock IS the schema's transition table.**

**Eleven rungs, WO-007 → WO-017**, each with falsifiable gates: dock v1 · the plug test (second species, Hermes target, *the admitting diff is the gate*) · bootstrap datasets · Python sidecar · Bovada capture · agent contracts as data · deterministic backtest + hard point-in-time failure + CLV-never-imputed · Critic that must catch a *planted* leak · trace timeline + inspector · Cloudflare (deferrable) · defining-workflow E2E.

Two lanes run in parallel — dock/agent (007→008→012) and data (009→010/011) — no file overlap until 013 joins them.

## WO-006b verified — REWORK, one defect, mine (`8b42739`)

Cold clean-room verification at `761ba58`. **Ten of eleven gates green.** Independently confirmed rather than taken on report:
- `kernel-sole-writer-app` **falsified both ways by the verifier** — bait renderer import → red; bait `kernel.db` reference → red; restored → green, diff empty.
- Build exit 0; `artifact-tile` emitted as a real renderer entry with its own JS+CSS — shell wiring genuine.
- **Electron-safety measured**: `bun:sqlite` exists only in `db-bun.ts`, never re-exported by `portable.ts`.
- Tile caches nothing to disk.
- `law-d.md`'s path claim checked against `paths.ts` — accurate.

**D1:** `qa --all` exits 1 on `no-canvas-domain-writes`. Measured first — the code *is* Law B compliant (tile-type discriminator + `artifactId` reference + layout; **zero domain fields**). False positive in substance, hard blocker in fact.

**Attribution: architect order defect.** Deliverable 4 authorized a change that predictably trips an existing Law E gate, didn't authorize updating that gate, left it off the builder-run list, *and* forbade `qa --all` — so the builder couldn't have found it. Fix specified: make the gate **precise, not permissive**.

## Law D — **PASSED** (founder acceptance)

```
artifacts=1  →  force-kill  →  relaunch  →  artifacts=2
```
Both artifact tiles restored, metadata re-fetched from `kernel.db` via `qf:artifacts:list` — not from canvas JSON.

**Verifier independently recomputed both content hashes against the real files — exact match.** `c9a4d784…` *is* the SHA-256 of `docs/orders/NEXT.md`. Content-addressing is measured, not claimed. The `artifact.published` event row carries the same id.

**One deliverable unexercised:** the publish lever was driven via `qf:execute` IPC in a headless agent env, not clicked. Same seam → Law D's substance holds, but the GUI affordance is unverified. One menu publish closes it.

Also: **the app launched on this machine for the first time ever** and ran clean — an open item since the July foundation audit, now closed.

## Where it stands

| | |
|---|---|
| WO-001 → 006a | done, verified, merged |
| **WO-006b** | built · Law D passed · **rework D1 only** |
| WO-006c | blocked — order not written; will be written against the **swappable ACP seam**, not `ToolLoopAgent` |
| v0.5 | gates fixed, ladder ready |

**Next three moves:** Cursor fixes D1 → I verify and merge → I write WO-006c. That closes v0.1.

Debt register renumbered 0–11 (parallel edits had produced duplicate 6/7/8).

## Vision check — founder asked "is Tile = Artifact?"

Close, but four things were being merged into one. **Tile ≠ Artifact** — a tile is a viewport onto *any* Kernel object. The cast: **AgentSession** (the researcher at their desk) · **Run** (the job they ran) · **Artifact** (the sealed envelope of results, immutable + content-addressed) · **Evaluation** (the audit). The model's *process* is session + run + trace spans; **artifacts are what the activity produces** — and a trajectory can itself become one.

Why content-addressing matters: **the id IS the hash**, so a backtest cannot be faked. Change one number, get a different id. That's what makes the eventual Evaluation trustworthy — the Critic points at a specific immutable artifact, not a vibe.
