# NEXT — the current order (rotated 2026-07-27, second rotation: the identity rungs are cut; the ladder resumes at WO-K1)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **[WO-K1](WO-K1.md) — one Kernel path, and they take turns**

**Read the order top to bottom before touching anything — every ruling and gate in it was paid for.**
Branch: `wo-k1`.

**In plain terms:** the system keeps its records in a database, and right now there are three of
those databases with nothing shared between them — the app looks in one place, the agent seats in
another, and the seats themselves are configured by files outside the repo that pin them to the
wrong answer. Worse, the founder's three peer-bus seats **cannot start at all right now**, because
their launch configs point at a scratchpad directory that no longer exists. WO-K1 makes the database
one file resolved by one function, makes it safe for several programs to hold open at once, and
repairs the founder's seat configs through the generator that writes them.

**How this order was hardened, so you respect its weight:** three adversarial pre-build reads
(grok-4.5 → composer-2.5 → grok-4.5), **each returned DO NOT CUT**, every finding fixed in the
order's text and re-measured. The last fix — G4's subprocess recipe — was then **probed live against
the SDK by a fourth seat** rather than re-read, because two of the architect's earlier fixes had
turned out to be requirements with no mechanism. Records:
[`evidence/wo-k1/`](evidence/wo-k1/). The G4 recipe and report-back item 5 carry the probe's
findings; do not substitute the harness's `envFor` for the explicit env — that exact substitution
was graded WORSE in round 3 and reproduced by measurement.

**Two founder-visible consequences, stated so they are decisions and not discoveries:** the app
opens a **fresh empty canvas** on first launch after this lands (the old app Kernel holds 0 events,
nothing is lost), and the three dead seat profiles start working again only when D8's generator
re-run repairs them. Do not hand-edit `~/.hermes/` configs ahead of the order — a hand edit that
disagrees with the generator is the exact defect shape (debt #29) this rung group exists to close.

## Parallel-eligible: **[WO-V1](WO-V1.md) — the reading vault, REWORK ROUND 1**

Off-ladder, independent of WO-K1 (no shared files), branch `wo-V1` at `52c435a`, nothing merged.
Read the order top to bottom, then the `REWORK ROUND 1` section at its end — that section is the
round. Substance: artifact-body rendering and wikilink emission have never been watched against real
data, and the missing-type ruling ships as robustness. The round-1 crash is **no longer reproducible**
— both live Kernels were rebuilt 2026-07-27 (26 tables, 7/7 formerly-missing types present).
**A second builder may take this while WO-K1 runs — but never run the QA suite while the other
agent is active** (see standing traps).

## Where the ladder stands

**WO-106b verified PASS** 2026-07-27 at `2730a00`, zero rework rounds, and **is merged** — `wo-106b`
is an ancestor of `main` (the previous rotation's "merge still pending" note is discharged).
**ROADMAP debt #25 closed.**

The 2026-07-27 post-merge review then found the Kernel-identity defect (three databases, zero shared
truth, gates structurally blind to all of it — debts #27/#28/#29), and **three identity rungs were
inserted before WO-107b**: **WO-K1** (one path, safe concurrency — this order) → **WO-K2** (the gate
can see the door; readers are readers) → **WO-K3** (bytes follow truth; drift refuses writes).
`SCOPES.md` §"The identity rungs" is authoritative on their contracts. Behind them: **WO-107b**
(market-plane bulk ingest — order not yet written; blocked on the K rungs), **WO-107** (first
market — Bovada only, doctrine A7; its order may not be written until the external-surface probe
runs), **WO-108**, then **WO-109/110/111** — the loop, the critic, and the one-shot proof.

**P1, P2 and P3 all closed.** Every remaining rung touches data the project does not control —
from here the fixtures come from someone else.

## Read this before you write a gate — it cost the project a full verification round

Round 1 of WO-V1 crashed on the founder's real Kernel: the schema declared **23** object types, the
database had **16**, and roughly a quarter of served MCP tools threw `no such table`. **Every gate
stayed green throughout**, because gates build their fixture database from the same schema they are
checking — both sides of every check came from one source and could never disagree. Reality was the
only thing capable of disagreeing and nothing was watching it.

This is the **third** time this exact shape has been found here: WO-103's arrival-settled rule (the
gate that existed to catch it had passed), WO-106's boot-path gate (it *modelled* the boot path
instead of watching it, and the real edit passed all 19 gates), and now this. **A check whose two
sides come from one source is not a check.** If you can satisfy your own gate by construction, it is
decoration. WO-K1's G2 (`busy_timeout=0` control) and G4 (child-side env receipt) are both written
to defeat this shape — that is why they look pedantic. They are not.

There is **no migration runner** — `SCOPES.md:105` makes wipe-and-recreate the ritual for a rung that
renames types, with no `ALTER` story. Every future rename recreates this condition silently.

## Four standing traps, all measured and logged

- **`agent-path` gives a false FAIL in a sandboxed shell** (debt #23) — its self-install exits 0 but
  leaves no `node_modules`. Pre-install before any before/after measurement.
- **Never pipe the gate runner.** It has cost two seats: one read `tail`'s exit 0 while the gate had
  failed. Unpiped, `$?` on its own line, every time.
- **Do not run the suite while another agent is running** (WO-106) — a concurrent Cursor session makes
  `runtime-proof` fail on foreign sockets. Run quiet, or you will chase a phantom red.
- **A third Kernel exists and is not yours** (2026-07-27). A long-running Electron dev instance holds
  a database at `QuantFlow-Ontology/.wo008-home/…`, a leftover from WO-008 testing that overrode
  `HOME`. It is stale, held open by a week-old process, and holds the only history that exists.
  **WO-K1 explicitly does not touch it.** Leave it alone; do not measure against it and do not treat
  it as evidence of drift.

## The standard this sequence set — match it

WO-106's builder **falsified every gate it wrote by editing shipping code**, not by flipping a fixture
switch, and sent back five defects in its own gates — three of them the same *one-source-two-sides*
shape. WO-106b then took **eight pre-build findings, three High** and built it with **zero rework
rounds**. WO-K1's own pre-build trail is three DO-NOT-CUT reads plus a live SDK probe. That is the bar.

## Standing seat constraint (founder, 2026-07-26)

Builder seats run **`composer-2.5` or `cursor-grok-4.5-high` only** — an API-cost decision, not a trust
one. One model builds, a different one verifies; no model checks its own work.

## Parked / parallel

**Design overhaul** — founder-run, off the critical path; returns as a brief with measured scope and
falsifiable gates, and must fit `one-skin`. **Market-abstraction test** — debt #20, trigger-gated.
**Durable execution** — debt #17, trigger-gated. **Promotion authority + freeze-lint bypass** — debt
#19 (`promote_type` deleted by WO-103b; its fixing order re-adds the action). **Caller identity** —
debt #22; WO-105 narrowed the served surface but the lock is still unbuilt. **Nested-key smuggling** —
debt #26; owned by whichever of WO-107b or WO-109/110 arrives first.

---

*Rotation rule unchanged: the verifier rotates this file when the current order verifies, and the log ([`README.md`](README.md)) wins if the two ever disagree.*
