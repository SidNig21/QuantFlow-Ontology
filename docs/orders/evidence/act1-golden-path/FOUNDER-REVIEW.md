# Act I golden path — founder review

Status: deterministic packaged proof passed; live Hermes review pending founder observation.

## What is already proven

On native Windows, one packaged QuantFlow build accepted a founder question, launched the QA
orchestrator and worker through the production admission/MCP path, created and completed a Kernel
task, returned a fixture-backed cited result, shut down, deleted `peer-bus.db`, reopened, and
recovered the same task and cable from Kernel truth.

- Gate: `bun qa/run.ts windows-golden-run`
- Result: PASS on 2026-08-10
- Fixture only: this is not a live Bovada or model-quality claim.

## Founder-only live Hermes check

Use the same verified Windows package in normal mode. Do not set `QF_DOCK_QA_MODE`. QuantFlow must
use the existing WSL Hermes installation and its existing authentication; nobody should copy,
display, modify, or test those credentials.

1. Confirm the Dock lists `hermes-orchestrator` and `hermes-worker`, and does not list or launch any
   `qf-proof-*` profile.
2. Submit: “Summarize the labelled fixture market event and return its cited id.”
3. Observe the orchestrator open, hire one Hermes worker, and create one visible assignment cable.
4. Observe the worker use the QuantFlow market tool and return a result containing the fixture id.
5. Close both seats and QuantFlow, then reopen the app.
6. Confirm the completed task, cited result, and assignment cable are still present.

Acceptance is the founder’s visible confirmation that this workflow is understandable and useful.
A deterministic QA pass never substitutes for a failed live Hermes run.

