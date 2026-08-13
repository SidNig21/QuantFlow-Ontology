Outcome B. Branch `wo-008` @ `14751b7`, pushed, not merged. Cut from `origin/QuantFlow` (`a4b6e55`).

### Outcome letter first

B — guest space cannot reach the host Hermes install.  
`linkSoftware` ok → `createSession("hermes", { env })` fails because the guest overlay cannot see `HERMES_BIN`. No prompt was sent. Hermes-in-guest becomes a design order (bundle vs mount); dock-path proof is critic-mock.

### Gates

1. Static gates

PASS repo-shape

PASS lockfile-committed

PASS kernel-sole-writer

PASS no-canvas-domain-writes

PASS kernel-sole-writer-app

PASS doc-action-surface

PASS one-skin

2. D0 log (excerpt)

d0-smoke: createSession env keys= HERMES_BIN,HOME

d0-smoke: linkSoftware ok

adapter_stderr="hermes-acp-shim: HERMES_BIN not found: /home/sidnig21/.hermes/hermes-agent/venv/bin/hermes"

OUTCOME B — guest space cannot reach host install (or spawn/handshake failed)

Host binary exists at that path; guest cannot see it.

3. Admitting commit (`git diff --name-only HEAD^..HEAD`)

species/hermes/.gitignore

species/hermes/README.md

species/hermes/agent-package/agentos-package.json

species/hermes/agent-package/package.json

species/hermes/agent-package/src/acp-shim.ts

species/hermes/bun.lock

species/hermes/d0-smoke.ts

species/hermes/package.json

species/hermes/register.ts

species/hermes/scripts/pack-agent.mjs

Nothing outside `species/hermes/`. Prior commit `02ba362` is `species/critic-mock/**` only.

4. Deliverable 4 (B path) — dock lists `critic-mock`, spawn → `end_turn` / closed, cancel ok.  
Screenshot: `species/critic-mock/evidence/dock.png`  
`register.ts: ok id=critic-mock event=agent_definition.registered`

5. Corrupt-package falsify

RED_ERROR_NAME PackageRefUnresolvedError

GREEN_OK { packagePath: ".../critic-mock.aospkg" }

6. build — `collab-electron` exit 0 (prior run this session).

### Env keys at `createSession`

`HERMES_BIN` = `/home/sidnig21/.hermes/hermes-agent/venv/bin/hermes`  
`HOME` = `/home/sidnig21`

### Three decisions

1. Packed package is `agent-package/` (zero native deps); harness holds agentos/qf-kernel (same shape as runtime-proof).
2. `HERMES_BIN` points at the venv binary, not the bash wrapper (avoids `env bash` under empty guest PATH).
3. Critic-mock commit first; hermes tip is the admitting commit per order.

### Note (not patched — WO-007b)

Shipped `spawnAgentSession` only forwards `QF_PROOF_SLOW_CHUNK_MS`, not a generic `{ env }` map. D0 used AgentOS `createSession` directly; Hermes dock spawn stays out of this order by design.

PR: [https://github.com/SidNig21/QuantFlow-Ontology/pull/new/wo-008](https://github.com/SidNig21/QuantFlow-Ontology/pull/new/wo-008)

can you check the integrity, im not sure how it went /thermo-nuclear-code-quality-review

Verdict: REQUEST CHANGES on quality/integrity — the plug result itself is still credible.

### How the delivery actually went (integrity)

|Claim|Holds?|
|---|---|
|Admitting tip is only `species/hermes/**`|Yes — `14751b7` is clean|
|Outcome B (guest can’t see host Hermes)|Yes — measured honestly once; host binary exists, guest stderr is `HERMES_BIN not found`|
|Dock path still proven under B|Yes — critic-mock registered, spawned, cancelled; screenshot in-tree|
|No host/kernel/gate patches to force admit|Yes — correct WO-008 discipline|
|Re-run / package hygiene|Weaker — see below|

So: the science of WO-008 (B + mock dock path) is fine. What’s shaky is how durable/honest the packaging of that proof is.

### Thermo-nuclear findings (priority)

1. Blocker — `wo008-dock-proof.mjs` shouldn’t live in the species tree  
    Hardcoded `/home/sidnig21/QuantFlow-Ontology`, leaves Electron running, not a portable harness. Keep the PNG + a short README; move/delete the script.
    
2. Blocker (integrity) — `d0-smoke` Outcome B classifier is a garbage bin  
    Substring matching + `else → B` means a protocol bug can be mislabeled B on re-run. B should be a _positive_ assertion: host has binary ∧ createSession fails ∧ stderr matches the shim’s typed `HERMES_BIN not found:` line. Everything else is C or “unknown.”
    
3. Important — critic-mock still announces `agentInfo.name: "qf-toolloop"`  
    Package says `critic-mock`; ACP handshake still says ToolLoop. Incomplete rename / silent fork of `runtime-proof`.
    
4. Important — byte-identical fork of `acp-main.ts`  
    Will drift. Acceptable under “clone” only if identity is fixed and upstream is noted; better long-term: one guest source + species overlay.
    
5. Nit — duplicated `register.ts` / `pack-agent.mjs`  
    Acceptable under the admitting-commit constraint; extract a shared species harness only when a third species appears.
    

### What went well

- Hermes shim is small and correct for the guest-env model (`HERMES_BIN` + `HOME`, no PATH lookup).
- Commit split matches the order (critic-mock, then hermes-only tip).
- No 1k-line sprawl; no app spaghetti from this PR.

I can apply the two blockers (drop/quarantine dock-proof script, tighten D0 classifier + rename `agentInfo`) in a follow-up commit on `wo-008` if you want.