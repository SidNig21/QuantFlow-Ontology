# Work orders

**Builders** start at [`NEXT.md`](NEXT.md). **Verifiers** start at [`VERIFYING.md`](VERIFYING.md).

Work happens **only** through a work order. Builders: read `/START_HERE.md`, then `PROTOCOL.md`, then your order, then nothing else. The roadmap ladder lives in `/docs/ROADMAP.md`.

## Log

| Order | Title | Status | Assignee |
|---|---|---|---|
| WO-000 | Cut the fork (vault) | done — this repo is the result | fable |
| [WO-001](WO-001.md) | Codegen spike `qf-kernel-schema` | **done** — verified + merged 2026-07-18 | builder (Cursor) |
| [WO-002](WO-002.md) | Docs graduation + roadmap | done | fable |
| [WO-003](WO-003.md) | Full schema v0.2 + transition tables + conformance tests | **done** — verified + merged 2026-07-18 | builder (Cursor) |
| [WO-004](WO-004.md) | Runtime ownership proof: one session ID, no second server | **done** — PROOF HELD (NARROWED); P1 overstated, see WO-004a | builder (Cursor) |
| [WO-004a](WO-004a.md) | Proof correction: assert what is actually true | **done** — verified + merged 2026-07-18; D1 fixed in rework round 1, falsified red/green by builder and verifier independently | builder (Cursor) |
| [WO-005](WO-005.md) | Kernel v0: SQLite from generated migration, command/event layer, Law E gates | **done** — verified + merged 2026-07-18 | builder (Cursor) |
| [WO-006a](WO-006a.md) | Creation commands: the Kernel can publish an Artifact (+ debt #0 gate) | **done** — verified + merged 2026-07-18 after 3 rounds (D1–D5); doc↔code gate falsified both directions | builder (Cursor) |
| [WO-006b](WO-006b.md) | Kernel in the app: Artifact tile + Law D cold-reopen demo | **done** — verified + merged 2026-07-19 (round 2); **Law D PASSED** | builder (Cursor) |
| [WO-006c](WO-006c.md) | One agent path end-to-end: spawn → stream → tool → Artifact → lifecycle | **rework** — verified 2026-07-19; falsifications/seam/allowlist confirmed; one defect (D1: agent-path gate not cold-safe — fresh checkout kills the qa runner) | builder (Cursor) |
