# QuantFlow — verifier current state

**As of:** 2026-11-08 (America/Los_Angeles)  
**Repo commit audited:** `b7d320d4` on `main` (branch `cursor/verifier-baseline-audit-f38e` carries verifier docs only)  
**Active product order:** [WO-W2-02](../orders/active/WO-W2-02-REAL-COLLABORATIVE-INQUIRY.md) — **OPEN, not implemented in code**

## One sentence

The Windows app can run a real UFC inquiry with Hermes Director, Bovada, history, Critic, and a one-shot Codex handoff (W2-01), but the **question → answer → revision → shared evidence table** loop W2-02 requires is **still missing** end to end.

## Active milestone

| Item | State |
|---|---|
| W2-01 Codex handoff | **Accepted** on Windows (`6f6cda09`) |
| W2-02 collaborative inquiry | **Open** — schema, app, tile, and gate named in the order are absent |
| PB-3 participant conformance / replacement | **Not started** (blocked on W2-02 acceptance) |
| NFL / prediction / outcome review | **Roadmap only** |

## What works today (machine-checked on Linux where noted)

| Capability | Evidence |
|---|---|
| Kernel schema + golden drift | `bun test` in `qf-kernel-schema` — **180/180 pass** (Linux, 2026-11-08) |
| TypeScript compile | `bun qa/run.ts typecheck` — **PASS** (Linux) |
| Governed review (R15) kernel logic | `bun qa/run.ts governed-review` — **PASS** (Linux) |
| Canvas domain write ban | `bun qa/run.ts no-canvas-domain-writes` — **PASS** |
| App-tree sole writer fence | `bun qa/run.ts kernel-sole-writer-app` — **PASS** |
| W1-03 UFC research + Critic path | Accepted receipt; regressions in QA gates (Windows-primary) |
| W2-01 Director → Codex Task/result | Accepted receipt; `windows-dock-species` (Windows only) |

## What is broken or misleading right now

| Issue | Impact |
|---|---|
| **No W2-02 implementation** — no `task_kind`, `create_question_task`, `asks_about`, `qf.question-answer.v1`, `qf.comparison-row.v1`, or `windows-collaborative-inquiry` gate in tree | Core product milestone cannot close |
| **`kernel-one-path` gate FAIL on `main`** | Five paths use `kernel.db` literals outside the documented allowlist (`qa/gates/kernel-one-path.ts` G1 output, Linux 2026-11-08) |
| **12 `qf-kernel` tests fail on Linux** | Upgrade/evidence tests use Windows-only temp cleanup guards (`packages/qf-kernel/src/wave1-evidence-upgrade.test.ts:17-18` and siblings) — **not** a schema bug; hides real failures on non-Windows dev |
| **`bun qa/verify-release-linux.ts` fails** | `qf-hermes-launch.test.ts` expects WSL `Ubuntu` (`collab-electron/cli/qf-hermes-launch.test.ts:35-38`); acceptable fail-closed, not Windows acceptance |
| **Atlas decisions** | **37/37 findings undecided** in `qf-atlas/decisions.json` — wiring map unread for governance |
| **DEBT.md row status** | Document warns statuses are not mechanized (`docs/DEBT.md:11-14`) |

## Verifier orders queued for Codex

See [ORDERS/](ORDERS/) — numbered **001–005**, sequenced for W2-02 first, then CI honesty.

## After next Codex session

Re-run on the immutable candidate (Windows for product proof):

```text
bun qa/run.ts typecheck
bun qa/run.ts windows-collaborative-inquiry
bun qf-atlas/generate.mjs --check
```

Update this file with PASS/FAIL per order.
