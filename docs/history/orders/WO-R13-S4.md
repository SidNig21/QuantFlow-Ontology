> **SUPERSEDED 2026-08-12.** The R13 slice plan was replaced by the V2 ladder in
> [../../proposals/V2-SCOPE.md](../../proposals/V2-SCOPE.md). Its work is not
> discarded: S1 and S5 became [WO-V2-1](../../orders/WO-V2-1.md) (installable
> product plus gate-board repair), and S2, S3 and S4 became WO-V2-2 (measure
> the first Hermes turn, fix the named cause, founder run). Kept for its
> reasoning and its measured baselines. Not authority.
# WO-R13-S4 â€” founder consumer acceptance

status: open
assignee: fable
depends: WO-R13-S3

> Not authorized until `NEXT.md` names this order.

## Objective

Prove the defining QuantFlow workflow is understandable and durable from the founder's point of view in the normal Windows app.

## In plain terms

The founder asks one football research question, watches real native Hermes seats do the work through QuantFlow's tools, receives a gated report, closes the app, reopens it, and finds the work still there.

## Context pack

- `docs/orders/GOLDEN-RUN.md` Part I and the R13 row
- `docs/orders/evidence/r13/PROGRESS.md`
- `docs/orders/evidence/act1-golden-path/FOUNDER-REVIEW.md`
- S3 verification evidence

## Deliverables

1. Produce one normal-mode Windows package and launch it with the founder's existing Hermes profile. No QA proof profile may be visible or launchable.
2. Use Computer Use to drive and capture the visible workflow while the founder observes: submit a benign settled-football question; orchestrator delegates; worker reads through generated ontology tools; deterministic Run and metrics appear where settled data permits; independent critic evaluates; gated Report appears.
3. Show one GLACIER tile per seat with the native CLI TUI as the tile body. No duplicate generic session/streaming tile may represent the same seat.
4. Close and reopen the app. The mission, task/delegation cable, evidence, Run, Evaluation, Report, and Research Ledger projection must recover from Kernel truth.
5. Write `docs/orders/evidence/r13/FOUNDER-REVIEW.md` with screenshots, exact package SHA, limitations, and the founder's accept/reject line.

## Contract

- The visible consumer workflow is the acceptance surface; CI fixtures cannot substitute for it.
- Computer Use may drive the app, but only the founder can give final visual acceptance.
- Keep GLACIER and native CLI TUIs. Improve wording/layout only when it removes a demonstrated consumer obstacle.
- No live bets or trades. Any sample data must be labeled honestly.

## Acceptance gates

- The complete visible workflow succeeds once from a fresh normal-mode launch.
- Close/reopen recovery succeeds from the same Kernel and artifact roots.
- `bun qa/verify-release.ts` passes in a fresh detached Windows worktree.
- Founder marks the review `ACCEPTED`. A rejection keeps R13 open and names one bounded rework.

## Out of scope

Installer signing/finalization, R14, RL training, live wagering, and additional product features.

## Report back

Return the package SHA, evidence link, founder verdict, and any single bounded rework. Stop before S5.
