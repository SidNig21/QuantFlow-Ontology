# R13 progress — 2026-08-13

status: V2-1 ACCEPTED — V2-2 AUTHORIZED

## V2-1 closeout

- Founder verdict: `ACCEPT`.
- Candidate masthead: `c93b04f1d6a448cee299b2a79a6c21204fdc8502`.
- Build timestamp: `2026-08-14T02:58:00.926Z`.
- Six production profiles, no `ungranted`; QA mode off. The pre-existing Kernel
  retained seven `agent_definition` rows including stale
  `claude-code-ungranted`, while the packaged manifest was clean.
- Live `hermes-critic`: `3 tools · 0 skills` — one ontology evaluation tool
  plus `collaboration_send_result` and `collaboration_send_task`.
- Orchestrator count: `5 tools · 0 skills` — three ontology tools plus two
  standard collaboration tools. The critic's four intended read tools were not
  visible.
- Plain-spawn argv used the two app-owned toolsets and `--tui` once.
- Shutdown went `11 -> 0`; no WSL Hermes seats remained. Hermes config/auth
  files remained unchanged and dated `2026-08-03`.

## Current authorization

`WO-V2-2` is the only active order. It must measure the first Hermes turn
synthetically before one bounded live fixture-backed turn, repair only the
earliest failed boundary, and prove the governed research chain. The one live
turn remains founder-only after independent verification; no live turn or model
quota may be spent by the builder or verifier. V2-3 remains excluded.

Receipts: [`FOUNDER-REVIEW.md`](FOUNDER-REVIEW.md),
[`V2-1-VERIFICATION.md`](V2-1-VERIFICATION.md), and [`NEXT.md`](../../NEXT.md).
