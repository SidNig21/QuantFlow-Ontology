---
tags: [quantflow, research, arxiv, deep-read]
created: 2026-07-27
paper: 2601.16443
retrieved: "https://arxiv.org/html/2601.16443v1"
---

# Endless Terminals (2601.16443) — deep read

**Actual title:** "Endless Terminals: Scaling RL Environments for Terminal Agents." **Authors:** Kanishk Gandhi, Shivam Garg, Noah D. Goodman, Dimitris Papailiopoulos. Abstract cross-checked separately at `https://arxiv.org/abs/2601.16443`; consistent with the full text.

See also: [[07 - Endless Terminals 2601.16443]] (first-pass note — still correct) · [[01D - ActiveGraph 2605.21997 deep]] (independent-verifier pattern, same underlying principle from a different paper).

## 1. What the paper actually does

A four-stage pipeline manufactures verifiable terminal-use tasks with no human annotation, then RL-trains small open models on the result.

**Stage I — task + privileged ground truth.** An LLM is prompted to produce (a) a task instruction phrased the way a user would ask an assistant, and (b) a "privileged information" section — exact file contents, paths, expected states — used only by the later stages and **never shown to the agent**. Diversity is sampled across three axes: task category (file management, text processing, log analysis, git operations, database queries, security scanning), complexity (single command → multi-step), and scenario framing.

**Stage II — container build/validation, self-correcting.** The model also emits an initial-state test file and a container definition (Dockerfile/Apptainer). The pipeline builds it, runs the initial-state tests inside the real container, and on failure feeds the failure output back to the model for a fix — up to k=3 rounds. Tasks that still can't produce a passing container after three rounds are discarded outright.

**Stage III — completion test generation, checked against triviality.** Given the task, the privileged ground truth, and the initial-state tests, the model writes a second test file checking post-completion state (created files, modified configs, computed results). A specific, checkable safeguard: the pipeline **verifies these completion tests do not already pass in the untouched initial state** — a test that would trivially pass without the agent doing anything is rejected. This is, independently, the exact same ritual QuantFlow already calls bait-then-green.

**Stage IV — solvability filtering by an independent model.** OpenAI o3 attempts each task 16 times (pass@16); only tasks where at least one attempt succeeds are kept. This discards roughly half of all candidates as underspecified or impossible. This is the one stage where the check comes from a source genuinely different from the one that authored the task — a separate, more capable model attempting the task blind, rather than the same generative process vouching for its own work.

**Training.** ~3,255 surviving tasks (Apptainer; ~2,500 ported to Harbor) are used to RL-train Llama-3.2-3B, Qwen2.5-7B, and Qwen3-8B-openthinker-sft with vanilla PPO (clip 0.2–0.28, no KL penalty — the authors found it hurt), a **binary, all-or-nothing, episode-level reward** (1 if completion tests pass, 0 otherwise, no partial credit, no intermediate reward), and a minimal loop: each turn sees history + prior shell output and emits either a command or a completion signal. No retrieval, no multi-agent scaffold, no specialized tools — the paper's headline claim is that environment scale, not scaffold sophistication, is what moved the needle.

## 2. Evidence quality

More rigorous than most papers in this batch: real pre/post numbers across three models, on both an in-distribution dev set and an out-of-distribution human-curated benchmark (TerminalBench 2.0). Dev-set gains are large in relative terms — Qwen2.5-7B 10.7%→53.3%, Qwen3-8B-openthinker-sft 42.6%→59.0% — but transfer to the real benchmark is small in absolute terms: Qwen2.5-7B only reaches 3.4%, the best anywhere is Qwen3-8B-openthinker-sft at 6.7%. For scale, the paper itself cites Claude Sonnet 4.5 with a full agentic scaffold at 42.8% on the same benchmark — six to twenty times higher than anything trained here. Honest read: procedurally generated tasks measurably improve a small model's ability to solve more tasks like themselves, and that does transfer a little to a real benchmark, but most of the capability gap to genuine competence is untouched. The authors are candid about why: the solvability filter caps difficulty at whatever the frontier validator (o3) can already do, so the pipeline structurally cannot manufacture anything harder than its own checker, and the generated tasks "resemble competitive programming problems more than the messy, underspecified requests users actually pose." Failure analysis is granular and credible — 39% of TerminalBench failures are looping (repeating commands), 26% are turn-exhaustion, both scaffold/capability problems rather than test-design problems. The clean gap in the evidence: "solvability" (o3 can pass it) is never the same claim as "the test checks the right thing," and the paper never measures the latter — no human audit of generated-test correctness is reported anywhere.

## 3. The transferable pattern

(a) **Adversarial-first fixture design as a standing discipline, applied to the generator itself, not just to one hand-reviewed gate**: every generated check must be shown to fail on the untouched/naive state before it is trusted to pass on the real one.

(b) **The verifier's ground truth must come from a source the generator cannot see or influence** — here, an independent frontier model attempting the task blind. QuantFlow's nearest analogue is raw introspection of actually-executed state (real container, real `sqlite_master`), not a re-read of the spec that produced the expectation.

## 4. Applies to QuantFlow how

Squarely a WO-104/Phase-2 codegen-testing pattern, and it reaches the gate-blindness wound directly if taken literally rather than just as inspiration.

**Proposal one — adversarial-mutant generation for the schema-drift class of bug.** A script takes the current schema, mutates it in ways a real migration mistake would actually produce (drop a table, add a column, loosen a CHECK constraint, rename a type), builds a scratch `kernel.db` from each mutant, and asserts the drift-detector gate (see [[01D - ActiveGraph 2605.21997 deep]]'s strict-replay proposal) fires on every mutant and on zero clean builds. This is Stage IV in miniature: don't write one clean test, generate a population of known-broken states and confirm the checker catches all of them. This is the direct fix for "every automated gate stayed green throughout" — a gate that has only ever seen clean input has never proven it recognizes dirty input, which is exactly what happened at WO-V1.

**Proposal two — for WO-104's generated read/traversal tools specifically**: once codegen emits a tool for a new object type or link, generate a battery of call-and-check fixtures (call the tool, assert response shape/hash) the way Endless Terminals generates completion tests from privileged ground truth. [[07 - Endless Terminals 2601.16443]] already scoped this; this read's addition is the "verify it fails on the naive/empty case first" discipline, plus a caution the paper's own numbers pay for: 3,255 generated tasks did not close the gap to real competence, so a large generated-fixture count should never be read as proof the *ontology* is correct — only that the tool wiring works. That caution was already in the existing note's "Do not" line; this read supplies the receipts (the TerminalBench transfer gap) for why it matters.

## 5. Where it conflicts with doctrine

The paper's actual deliverable is an RL training pipeline for teaching small open models to use a terminal better — that is out of scope outright ("research and advisor only"; the parked-RL-pile note applies), and nothing here recommends running PPO or hosting model checkpoints near the Kernel. Only the four-stage *fixture-generation* architecture (Stages I–IV, minus "then RL-train on it") is portable, and it must produce `qa/` fixtures and gate scripts, not a training corpus. No second system of record is implied as long as generated fixtures and their expected hashes stay content-addressed inside existing Kernel/`golden/` conventions rather than a bespoke task-store — [[07 - Endless Terminals 2601.16443]]'s steal checklist already says this.

## 6. Verdict

`adopt-pattern` — the adversarial-mutant-generation idea is a small, concrete, immediately buildable gate design that targets the exact failure class that just happened, at the cost of a script, not a training run.
