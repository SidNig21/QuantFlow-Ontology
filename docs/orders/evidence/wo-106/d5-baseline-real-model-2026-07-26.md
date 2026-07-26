# D5 baseline — a real model against the served plane, BEFORE the debt #24 fix

**Date:** 2026-07-26 · **Run by:** the checking seat, founder present and requesting it
**Model:** `kimi-k3` via **OpenCode Go** (founder's subscription) driving **Hermes Agent**

> **Provenance, stated precisely.** `hermes sessions export` does not record the provider per message,
> so this was **not directly observed** for the two calls below. It is established by exclusion:
> `~/.local/share/opencode/auth.json` holds exactly one provider (`opencode-go`), `hermes status`
> reports `Model: kimi-k3 / Provider: OpenCode Go`, and **every other provider's key is unset**
> (OpenRouter, OpenAI, Google, DeepSeek, xAI, NVIDIA, Z.AI, Kimi, StepFun, MiniMax ×2, DeepInfra).
> Nothing else was credentialed to serve the request. Prior runs on 2026-07-19/20 do log it directly:
> `provider=opencode-go base_url=https://opencode.ai/zen/go/v1 model=kimi-k3`.
**Server:** `tools/qf-read-tools/src/server.ts` over stdio MCP, registered in Hermes as `quantflow`
**Tools offered:** **93/93 enabled** (69 read + 24 action; `qf_observe_ticket` absent as designed)

**This is a demo, not a gate.** It is non-deterministic and depends on an external subscription. No
gate depends on it. It exists because the founder asked to see the system work with a real model, and
because WO-106's D5 needs a pre-fix baseline to compare against.

**Its purpose is a before/after.** This run happened *before* WO-106's Ruling 1 lands. After that fix,
re-run the same two prompts: the write task should succeed on the first attempt with `params`
intact. The delta is the value of debt #24, measured rather than argued.

---

## What was established first (so the result is not a coincidence)

An external agent framework connected to the QuantFlow ontology and enumerated the tool plane —
93 tools with descriptions — with no QuantFlow-specific code in Hermes. The ontology is genuinely
framework-neutral: nothing about this run was QuantFlow-aware except the MCP server itself.

Seeded state before the model ran: `run-alpha` (backtest, running), `run-beta` (backtest, queued).

## Test 1 — read. **No tool named in the prompt.** PASSED cleanly.

> *"Using the QuantFlow ontology tools available to you, tell me what runs currently exist and what
> state each one is in. Do not guess — look it up."*

The model found and called `qf_run_query` unprompted and answered correctly: both runs, correct
statuses, correct `created_at` timestamps, correct trace ids, and the accurate observation that no
succeeded/failed/cancelled runs existed. **The read plane is discoverable and usable by a real model
with zero priming.**

## Test 2 — write. **No tool named.** Succeeded, but only by brute force.

> *"…create a new backtest run and then start it. Report exactly what you called, what arguments you
> sent, and any errors you got back verbatim."*

The model's own sequence, verbatim from its report:

| Attempt | Sent | Outcome |
|---|---|---|
| Recon | `qf_run_query {"limit":5}` | Used existing rows to guess the shape |
| 1 | `qf_create_run {kind, params:"{...}", trace_id}` | **Rejected** — `run_id` missing, `params` expected record |
| 2 | added `run_id`, `params` still a string | **Rejected** — `params` expected record |
| 3 | identical retry | **Rejected**, then Hermes' circuit breaker fired: *"unreachable after 3 consecutive failures"* — forced a ~60s wait |
| 4 | `{kind, run_id, trace_id}` — **`params` omitted entirely** | **Accepted** |
| 5 | `qf_start_run {run_id}` | Accepted — `queued → running` |

### The model's own diagnosis, quoted

> "the MCP tool schemas for the action tools expose no declared parameters, so I inferred argument
> names from the validation errors and the existing rows"

> "there is no way to send a record through this tool interface, so the run was created with default
> empty params"

**That is ROADMAP debt #24, stated by the victim.** The model reverse-engineered the schema from
GATE 1's rejection messages, burned four calls and a 60-second circuit-breaker penalty, and then
**dropped a field it could not express.** The resulting row carries `params: "{}"` — real data lost,
not because the Kernel refused it, but because the catalogue never said the field existed.

## Independently verified afterwards — not taken from the model's report

```
runs in the Kernel:
  {"id":"run-alpha","status":"running","params":"{}","trace_id":"t-1"}
  {"id":"run-beta","status":"queued","params":"{}","trace_id":"t-2"}
  {"id":"run-gamma","status":"running","params":"{}","trace_id":"t-3"}
event log (5 events):
  run.created run-alpha · run.started run-alpha · run.created run-beta
  run.created run-gamma · run.started run-gamma
```

Three findings from that verification:

1. **The model told the truth.** `run-gamma` exists, running, trace `t-3`, exactly as reported.
2. **GATE 1's rejections wrote nothing.** Five events for five successful operations. The four
   rejected calls left **zero** events and zero rows. That property was previously proven by a gate
   baiting itself; it is now proven by a real agent hammering the door with malformed input.
3. **`params` is `"{}"`.** The data loss is in the ledger, permanently, and it is visible.

## What this run proves, and what it does not

**Proves, with a real model and no mock anywhere:** the MCP plane is reachable by an external
framework; read tools are discoverable and correct; action tools *work*; GATE 1 rejects malformed
input and writes nothing when it does; and the whole path from an outside agent to the Kernel's
single write path functions end to end.

**Proves debt #24 is not theoretical:** an unprimed real model needed four attempts, a circuit-breaker
penalty, and a dropped field to do one create. The earlier argument for the fix was read off the SDK's
type signatures; this is the same conclusion measured in behaviour.

**Does not prove:** that discovery works — it demonstrably *did not*, for writes. That is the gap
WO-106 closes. It also does not prove anything repeatable; a different model or a different day may
behave differently, which is precisely why Ruling 2 keeps this out of the gate set.

## Reproducing it

```
hermes mcp add quantflow \
  --env QF_KERNEL_DB=<path to a kernel.db> \
  --command bun --args run <repo>/tools/qf-read-tools/src/server.ts
```

`--args` must be last — anything after it is swallowed into the argument list, which is why the first
registration attempt failed to connect. Seed a database first by calling `execute()` against a fresh
`openKernel(path)`; `create_run` needs `params` as a **record**, not a string (GATE 1 rejected the
seeding script's first attempt too, which is its own small confirmation that the gate is live).
