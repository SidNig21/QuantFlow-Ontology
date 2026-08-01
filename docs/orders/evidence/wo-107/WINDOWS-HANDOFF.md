# WO-107 Windows / WSL continuation handoff

## Plain-language status

The QuantFlow source and the complete WO-107 implementation are preserved on GitHub. WO-107 is
not approved or merged yet because the final packaged live Bovada capture and real Hermes reading
proof were not completed before the Linux-to-Windows move.

This file is a continuation handoff, not verification evidence and not a PASS record.

## Preserved Git state

- Stable local/remote baseline: `main` at `59ecdef7ce010d7ad0eec6e1a8c725df97713a85`.
- WO-107 branch: `codex/wo-107`.
- Exact product-and-gate commit: `2fb7ec137b0b4853c4480994c180589645ec80c2`.
- WO-107 product commit sequence:
  - `aadcf73` — Bovada football capture and Electron/CLI integration.
  - `f173133` — packaged Bovada QA gate.
  - `2fb7ec1` — corrected production mutation/falsification gates.

The architect's final read-only handoff audit found no newer WO-107 product source stranded in
another worktree. Temporary integration directories contained obsolete copies, generated package
output, or incomplete D5 harness files only.

## Start on Windows

QuantFlow is Linux-first. Use WSL2 with Ubuntu rather than treating native Windows as a supported
runtime.

```bash
git clone https://github.com/SidNig21/QuantFlow-Ontology.git
cd QuantFlow-Ontology
git fetch --all
git switch --track origin/codex/wo-107
```

If GitHub CLI operations are needed, authenticate on the new machine:

```bash
gh auth login -h github.com
```

Before changing anything, read these files in order:

1. `START_HERE.md`
2. `docs/orders/NEXT.md`
3. `docs/orders/WO-107.md`
4. `docs/orders/PROTOCOL.md`
5. `AGENTS.md`

## What is already implemented

- Fixed-origin, credential-free public Bovada NFL fetch.
- Strict selection of one future pregame Game-Line moneyline.
- Exact source bytes durably stored before market claims.
- Replay-safe Artifact, Venue, MarketEvent, Instrument, Quote, and derived-link ingestion.
- Same-body deduplication and changed-body quote history.
- Electron-owned Kernel and Artifact-root integration.
- Packaged `qf-canvas market bovada-football --once` and bounded `--at` command path.
- Timeout, cancellation, disconnect, shutdown, and staging cleanup behavior.
- Permanent deterministic package and mutation gates.

Focused remeasurement on the final product commit reported 33 package tests passing, strict
TypeScript passing, and all five mutation baits red then restored green. That focused result does
not replace the required independent canonical release and live D5 proof.

## Exact next job — do not redesign WO-107

1. Independently inspect the branch and run the canonical `bun qa/verify-release.ts` once from a
   fresh detached worktree against the final bytes.
2. Launch the finished Linux package with a fresh temporary Kernel and Artifact root.
3. Invoke the packaged `qf-canvas` command for one bounded live Bovada NFL capture.
4. Cross-check the resulting Artifact, Venue, MarketEvent, Instrument, Quote, links, events, and
   source-file hash.
5. Launch the real `hermes-worker` Dock profile against those same absolute Kernel/Artifact paths.
6. Archive the prompt, tool calls, answer, runtime identity, capture receipt, and Kernel cross-check
   under `docs/orders/evidence/wo-107/`.
7. Have an independent verifier issue PASS or REWORK. Merge only after PASS and founder approval.

Do not begin WO-109, broaden market coverage, add a poller, or rewrite the adapter while completing
this handoff.

## Not stored in GitHub

The repository intentionally does not include:

- `~/.quantflow/kernel.db`
- `~/.quantflow/artifacts/`
- app-local projection/log/socket data under `~/.quantflow/app/`
- the local Hermes installation, profiles, or authentication
- generated Linux packages or temporary verification directories

If existing operator data must move, stop QuantFlow first and transfer the Kernel and Artifact
directory separately through private storage. Never commit them or authentication material to
GitHub. A fresh Kernel is sufficient for continuing WO-107 verification.

## Pasteable restart prompt for the next lead agent

> Continue QuantFlow from `origin/codex/wo-107`. Read `START_HERE.md`, `docs/orders/NEXT.md`,
> `docs/orders/WO-107.md`, `docs/orders/PROTOCOL.md`, `AGENTS.md`, and this handoff. Treat
> `2fb7ec1` as the exact completed WO-107 product/gate commit. Do not redesign or extend the order.
> Independently complete the canonical release verification and the packaged live Bovada-to-Hermes
> D5 proof, archive the required evidence, and stop with PASS or numbered REWORK findings. Do not
> merge or start WO-109 without founder approval.
