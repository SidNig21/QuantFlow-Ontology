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
| [WO-006c](WO-006c.md) | One agent path end-to-end: spawn → stream → tool → Artifact → lifecycle | **done** — verified + merged 2026-07-19 (round 2); 10 gates cold from zero installs; **v0.1 phase gate closed**; founder demo folded into the post-WO-008 checkpoint (founder decision 2026-07-19) | builder (Cursor) |
| [WO-006d](WO-006d.md) | One skin: token sheet + one-skin gate (design coherence) | **done** — verified + merged 2026-07-19; hex 55→0, fonts 33→0; look-verdict at the post-008 checkpoint | builder (Cursor) |
| [WO-007](WO-007.md) | Dock v1: species registry + spawn surface + cube empty-state | **done** — verified + merged 2026-07-19 (round 2); 12 gates cold; dock is a Kernel projection | builder (Cursor) |
| [WO-008](WO-008.md) | The plug test: Hermes through the same socket — admitting diff is the gate | **done** — verified + merged 2026-07-19 (round 2); Outcome B (guest cannot see host install); admitting commits pure; D1–D3 fixed | builder (Cursor) |
| [WO-007b](WO-007b.md) | Host seams: spawn split, generic env, tile-control parity | **done** — verified + merged 2026-07-20; admit≠turn; manifest env YES | builder (Cursor) |
| [WO-008b](WO-008b.md) | Hermes reachability: bundle vs authorized mount (probe `mounts`) | **done** — PROBE HELD 2026-07-20; mounts YES; guest WASM-only blocks native Hermes; → WO-008c | builder (Cursor) |
| [WO-008c](WO-008c.md) | Hermes host-bridged ACP (Outcome A outside guest exec) | **done** — verified + merged 2026-07-20 (rework D1–D2); host_acp + launch meta + one client | builder (Cursor) |
| [WO-008a](WO-008a.md) | Permission bridge + tool policy (deny-by-default; unblocks the founder's live turn) | **done** — verified + merged 2026-07-20; host runTurn + allowlist + founder permission UI | builder (Cursor) |
| [WO-008d](WO-008d.md) | Hermes tile = real TUI (standing: native TUI for all future interactive agents) | **done** — verified + merged 2026-07-20; Spawn → term tile `hermes --tui` | builder |
| [WO-008e](WO-008e.md) | A2A proof: 4 Hermes tiles (orchestrate → fan-out → review → talk-back) | **done** — verified + merged 2026-07-20 (rework D1–D5); `a2a-core` + spawn/dispatch IPC | builder |
| [WO-PEER-BUS](WO-PEER-BUS.md) | MCP peer plane beside the TUI (cold harness) | **done** — verified cold 2026-07-20 | builder |
| [WO-PEER-BUS-CANVAS](WO-PEER-BUS-CANVAS.md) | Peer-bus visual PASS — dock seat spawn + founder live turns | **open** — current (park ignored for this PASS); plan `docs/plans/2026-07-20-001-req-peer-bus-canvas-pass-plan.md` | builder |
| [WO-009](WO-009.md) | Datasets I: bootstrap ingestion (Parquet + Kernel pointer) | **parked** until canvas PASS holds | builder |
