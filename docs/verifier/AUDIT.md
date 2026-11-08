# QuantFlow baseline audit (verifier)

**Date:** 2026-11-08 (America/Los_Angeles)  
**Commit:** `b7d320d4` (`docs: explain the governed Dock edge stack`)  
**Role:** Independent verifier — read-only product audit + fix orders for Codex  
**Active order:** [WO-W2-02](../orders/active/WO-W2-02-REAL-COLLABORATIVE-INQUIRY.md) — OPEN

Ryan can already open the packaged Windows app and complete a **bounded UFC research path** with live Bovada, official UFC history, Hermes researcher and Critic, and a **single Codex delegation** (W2-01). He **cannot** yet complete the **full collaborative loop** the product vision needs: Director asks Codex a **material evidence question**, Codex answers with **Kernel-backed facts**, revises after Critic pressure, and Ryan **manipulates the same evidence rows** on Canvas while the Kernel keeps every version.

---

## 1. Authority alignment

| Document | Finding |
|---|---|
| `docs/orders/NEXT.md` | W2-02 OPEN; W2-01 accepted at `6f6cda09` |
| `docs/plans/OFFICIAL-ROADMAP.md` | Matches NEXT: collaboration + table = W2-02; NFL/prediction = later |
| `README.md` | Checkpoint 2026-09-28; agrees W2-02 not accepted |
| Code vs W2-02 order | **Large gap** — see §5 |

---

## 2. Architecture map — exists / works / stubbed

### 2.1 Kernel & schema (`packages/qf-kernel`, `qf-kernel-schema`)

| Component | Status | Notes |
|---|---|---|
| `execute()` write path | **Works** | Entry `packages/qf-kernel/src/execute.ts` — actions routed to create/pipeline/governed review |
| Golden ritual | **Works** | `qf-kernel-schema`: 180 tests, 0 fail (Linux run 2026-11-08) |
| Governed review / revision admission | **Works (kernel)** | `governed-review` gate PASS; `request_revision` surfaced in `kernel.ts:1310` |
| Question Tasks, `asks_about`, `create_question_task` | **Missing** | Grep: no matches outside the W2-02 order doc |
| `qf.comparison-row.v1` selection keys | **Missing** | No code references; order §Deliverable 1/3 |
| `qf.question-answer.v1` | **Missing** | Not in schema or app |
| DB upgrade tests | **Linux-broken** | 12 failures — path guard assumes Windows temp dirs (§3) |

### 2.2 Electron shell (`collab-electron/`)

| Component | Status | Notes |
|---|---|---|
| Canvas / one-skin / Dock | **Works (accepted paths)** | Golden + W1/W2 Windows gates |
| Research world projection | **Works** | `research-world-projection.ts` — missions, tasks, market lineage |
| Collaboration MCP / `send_task` / `send_result` | **Works (W2-01 scope)** | `collaboration-gateway.ts` |
| Director → Codex hire | **Accepted** | W2-01 receipt |
| Material Q&A between Director and Codex | **Stubbed at best** | Only generic task/result; no question specialization |
| Interactive evidence table tile | **Missing** | No comparison-row binding in renderer |
| Legacy ACP agent | **Removed from tree** | `DEBT.md` #14 still mentions `acp-agent.ts`; file absent at expected path — debt text stale |

### 2.3 Species (`species/hermes`, `species/codex`)

| Component | Status | Notes |
|---|---|---|
| Hermes Director / Critic prompts | **Works (bounded)** | Packed profiles, allowlists |
| Codex worker admission | **Accepted W2-01** | `species/codex/tools-allowlist.json` is minimal (`kind:think` only in file — full surface comes from app gateway) |
| Cross-runtime revision + second Critic | **Not proven** | W2-02 deliverable 2 |

### 2.4 Dock tools (`tools/`)

| Tool | Status |
|---|---|
| `qf-bovada-football` | **Production data** (UFC markets); Windows integration gates |
| `qf-ufc-history` | **Production evidence** (bounded official history) |
| `qf-read-tools` | **MCP read/action** plane for seats |
| NFL simulator / nflverse | **Not installed** — roadmap inventory only |

### 2.5 QA & Atlas

| Component | Status | Notes |
|---|---|---|
| `qa/run.ts` | **~78 registered gates** | Windows-heavy for product proof |
| `windows-collaborative-inquiry` | **Not registered** | Named only in W2-02 order |
| `kernel-one-path` | **FAIL on Linux** | §3 |
| `qf-atlas/` | **Generated 2026-09-29** | **37 undecided** findings; `reaches-sql` on reads (e.g. `qf:tasks:surface` → direct SELECT at `kernel.ts:855`) is **read path**, not proven write breach |

---

## 3. Correctness problems (with evidence)

### 3.1 W2-02 not started (blocks vision)

The open order specifies ontology and app changes (`docs/orders/active/WO-W2-02-REAL-COLLABORATIVE-INQUIRY.md:73-90`, `:133-154`, `:171-193`). Repository search shows **zero** implementation of `create_question_task`, `task_kind`, `asks_about`, or `windows-collaborative-inquiry`.

**Why it matters:** Roadmap layer “communication and revision” is the hinge between “impressive demo” and “Ryan trusts the desk on game day.”

### 3.2 `kernel-one-path` red on `main`

```text
bun qa/run.ts kernel-one-path
```

Linux 2026-11-08 — G1 offenders (paths use `kernel.db` construction outside allowlist):

- `qa/gates/bovada-football/run.ts`
- `qa/gates/windows-dock-species.ts`
- `qa/gates/kernel-sole-writer-app.ts`
- `qa/gates/hermes-production-inference.ts`
- `packages/qf-kernel/src/wave1-evidence-upgrade.test.ts`

Allowlist documentation at `qa/gates/kernel-one-path.ts:35-77` explicitly describes repeated omissions when new Windows gates land. **A red gate on `main` trains everyone to ignore it.**

### 3.3 Kernel package tests: false red on Linux

Example (`packages/qf-kernel/src/wave1-evidence-upgrade.test.ts:17-18`):

```typescript
if (!target.startsWith(`${resolve(tmpdir())}\\`) || !target.includes("qf-w1-evidence-upgrade-")) {
  throw new Error(`unsafe cleanup ${target}`);
}
```

On Linux, temp paths use `/tmp/...`, so tests **fail in `afterEach`** even when upgrade logic passed. Full package run: **124 pass, 12 fail** (same root cause across upgrade suites).

### 3.4 Linux release verifier stops early

```text
bun qa/verify-release-linux.ts
```

Fails at `collab-electron/cli/qf-hermes-launch.test.ts:38` — expects `wsl.exe -d Ubuntu` (status 2); received `null` (no WSL on cloud VM). **Expected**; not a substitute for `verify-release.ts` on Windows.

### 3.5 Electron production build OOM on constrained Linux host

```text
cd collab-electron && bun run build
```

Exits with V8 heap OOM after ~27s (cloud agent VM). **Not measured on Windows** in this audit; do not infer Windows build health from this failure.

### 3.6 Direct SQL in main (read path — watch, not panic)

`kernelListTaskSurface()` at `collab-electron/src/main/kernel.ts:855` runs `SELECT` on `qf_review_source_work` outside `execute()`. Atlas classifies `qf:tasks:surface` as `reaches-sql`. This is a **read**, consistent with “projections may read.” It becomes a problem only if copied for writes.

### 3.7 Test-only SQL in `research-world.test.ts`

Fixtures insert via `statement.run` (`collab-electron/src/main/research-world.test.ts:123-149`) — **test harness only**, not production.

---

## 4. Rot risks

| Risk | Detail |
|---|---|
| **Undecided Atlas findings** | 37/37 `undecided` — deletes and refactors lack recorded verdicts (`qf-atlas/ATLAS.md:10-15`) |
| **DEBT status drift** | `docs/DEBT.md:11-14` — rows may say “open” after closure |
| **Docs vs code (W2-02)** | Order is precise; implementation absent — highest product rot |
| **`kernel-one-path` not in release stage** | Documented at `qa/gates/kernel-one-path.ts:57-58` — can stay red unnoticed |
| **Verifier docs were missing** | No `docs/verifier/` before this audit — fixed in this branch |

---

## 5. Vision gaps (ranked by blocking core loop)

| Rank | Gap | Blocks |
|---:|---|---|
| 1 | Question Task ontology + `create_question_task` + answer artifact | Director ↔ Codex evidence exchange |
| 2 | Director orchestration using critic evaluation → question → revision | Second round across runtimes |
| 3 | Evidence table tile + `qf.comparison-row.v1` | Ryan inspects same rows as agents |
| 4 | `windows-collaborative-inquiry` gate + receipt | Acceptance / anti-fake-close |
| 5 | PB-3 conformance / replacement | Safe multi-seat production |
| 6 | NFL props, prediction bench, outcome review | Post-core-loop roadmap |
| 7 | Monte Carlo / RL simulator | External Dock tool (future) |

---

## 6. Roadmap layer completion (honest, technical)

Percent = **accepted product behavior on Windows packaged app**, not “code exists.”

| Layer | ~Complete | Notes |
|---|---:|---|
| Kernel + schema foundation | **90%** | Golden stable; W2-02 ontology slice missing |
| Windows package / lifecycle | **85%** | Golden + cold boot; founder-state needs WSL |
| UFC market + history Dock | **80%** | W1 path accepted; not NFL |
| Hermes research + Critic | **75%** | W1-03; revision loop incomplete |
| Codex cross-runtime | **40%** | W2-01 handoff only |
| **W2-02 collaboration + table** | **0%** | Open order, no bytes |
| Participant replacement (PB-3) | **0%** | Not authorized |
| Predictive / calibration / NFL | **0%** | Explicitly unavailable in kernel paths |
| Learning / outcome review | **0%** | Roadmap |

---

## 7. Checks run (actual output, Linux VM unless noted)

| Command | Result |
|---|---|
| `cd qf-kernel-schema && bun test` | **PASS** — 180 pass, 0 fail |
| `cd packages/qf-kernel && bun test` | **FAIL** — 124 pass, 12 fail (temp path guards) |
| `bun qa/run.ts schema` | **PASS** |
| `bun qa/run.ts typecheck` | **PASS** |
| `bun qa/run.ts governed-review` | **PASS** |
| `bun qa/run.ts kernel-sole-writer-app` | **PASS** |
| `bun qa/run.ts no-canvas-domain-writes` | **PASS** |
| `bun qa/run.ts kernel-one-path` | **FAIL** — 5 allowlist offenders |
| `bun qa/verify-release-linux.ts` | **FAIL** — Hermes launch / WSL test |
| `cd collab-electron && bun run build` | **FAIL** — OOM (VM) |
| `bun qa/verify-release.ts` | **Not run** — requires native Windows 11 (per `qa/verify-release.ts:4-7`) |

Windows acceptance for W2-01 remains on **`bun qa/run.ts windows-dock-species`** and full **`bun qa/verify-release.ts`** — **not re-run in this session.**

---

## 8. Codex fix orders

Numbered orders in [ORDERS/](ORDERS/) — execute in order **001 → 005** unless founder reprioritizes.

| Order | Title |
|---|---|
| [001](ORDERS/001-question-task-ontology.md) | Question Task ontology + kernel actions |
| [002](ORDERS/002-director-question-answer-flow.md) | Director → Codex Q&A after Critic |
| [003](ORDERS/003-evidence-table-tile.md) | Interactive evidence table (presentation-only) |
| [004](ORDERS/004-windows-collaborative-inquiry-gate.md) | Packaged acceptance gate |
| [005](ORDERS/005-ci-kernel-one-path-linux-tests.md) | Green `kernel-one-path` + Linux-safe kernel tests |

---

## 9. Judgment calls (verifier)

1. **Treated Linux kernel test failures as portability debt**, not schema regression, after reading cleanup guards — Codex should still fix in Order 005 so Linux CI is trustworthy.  
2. **Did not open a competing product order** — all builder work stays under WO-W2-02; orders 001–004 are decompositions of that order, not new NEXT pointers.  
3. **`reaches-sql` Atlas flags** on read-only IPC were downgraded to “watch” unless writes are proven — consistent with `START_HERE` one-rule spirit and Atlas’s own amber wording.

---

*Next verifier action after Codex lands W2-02: run Windows `windows-collaborative-inquiry`, semantic read of question/answer prose, update `CURRENT_STATE.md`, mark orders PASS/FAIL.*
