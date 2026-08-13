
## Verdict (with docs actually in hand)

Your three indexes clarify the stack. The repo is half-wired to Collaborator/Eve habits and half-documented as AgentOS + AI SDK. That’s the reconnect.

|Indexed doc|What it actually says|What QuantFlow does today|
|---|---|---|
|AgentOS SDK|Host `bindings` for A2A; isolated VMs; `createSession` / `sendPrompt`; permissions via `onPermissionRequest` / `respondPermission`|Electron `Map` + `claude-agent-acp`; auto `allow_once`; no bindings|
|AI SDK|Model/tool loop (`ToolLoopAgent` / `streamText`+tools); no session identity|Proven only in `tools/runtime-proof`; not in the app|
|Eve|Filesystem-first durable agent framework (`defineAgent`, channels, approvals)|Explicitly rejected as second server / Eve-coupled harvest — keep it as anti-pattern, not target|

---

## Compressed fix plan — 8 workstreams (was ~64 findings)

Each is one order-sized chunk. Fix these and most of the audit collapses.

### 1. Tell the truth in docs (½ day)

Problem: BLUEPRINT still says better-sqlite3, “WO-004a being reworked,” unqualified PROOF HELD, schema v0.1 vs v0.2, debt IDs doubled, WO files stuck at `status: open`.  
Fix: One docs commit. State clearly: L1/L2 proven in `runtime-proof`; app still on Collaborator ACP until WO-006c. Eve = do-not-rebuild.  
Unblocks: Every future builder.

### 2. Close WO-006b integrity (1 day) — merge blocker

Problem: Law E gate red on tile type `"artifact"`; `qf:execute` open to every webview; `path` → `readFileSync`.  
Fix: Allowlist tile-type/`artifactId` in the gate; allowlist execute (shell: `publish_artifact` only; tiles: list/get); pass bytes not paths.  
Unblocks: Merge + founder Law D demo.

### 3. One Kernel front door (2–3 days)

Problem: `insertRun` / `insertAgentSession` / public `appendEvent` + orphan schema actions + no Zod at `execute`. Laws B/E are prose.  
Fix (judo): Hide inserts/appendEvent; Zod-parse in `execute`; lint “every schema action → handler or explicitly deferred”; kill/deprecate orphans (`close_run`, etc.).  
Unblocks: Honest MCP later; safe IPC.

### 4. WO-006c = AgentOS host, not Eve/claude-acp (the real reconnect)

Against AgentOS docs:

- Embed AgentOS (`agentOS` / `AgentOs.create` as in proof)
- Session: guest mints → host adopts → Kernel `agent_session`
- Permissions: deny-by-default → UI/`pending` (docs show `respondPermission`; app auto-approves today)
- Do not put Eve in the Electron main path

Against AI SDK docs:

- `ToolLoopAgent` (or equivalent) owns tools only, inside the session — never forge a third session ID

Against Eve docs:

- Use as warning: durable filesystem agent + channels ≠ QuantFlow canvas Kernel. Don’t scaffold `eve init` into this app.

Kill: `claude-agent-acp` as lifecycle authority, dual Maps/prefs/JSON as truth.

### 5. Agent-to-agent = host bindings, not canvas mythology

AgentOS docs: A2A = writer gets a `review` binding; host copies files across VMs; coder drives `agentos-review submit`. VMs share no filesystem.  
QuantFlow today: schema link `delegates_to` only — zero runtime.  
Fix: After 006c, one order: Critic as second agentOS + `review` (or `critique`) binding; Kernel records `delegates_to` / `evaluation` as receipt, not as the transport.  
Don’t: invent Google-A2A or canvas cables as the message bus.

### 6. Creation + lineage path (after front door)

Problem: Only `publish_artifact`; no hypothesis/dataset/run/evaluation create; no link writers; replay only run/artifact.  
Fix: Creation commands + handlers + link emits + generic replay.  
Unblocks: v0.5 workflow (Hypothesis → … → Report).

### 7. Stop growing the shell blobs

Problem: `renderer.js` 1870, `tile-manager.js` 911 — Kernel/agent logic bolted into shortcuts/spawn clones.  
Fix: Cap rule: no new Kernel/agent code in those files; extract `publish-artifact`, `spawnConfiguredWebview`, agent forward.  
Unblocks: Maintainability; WO-006c won’t make 1870 → 2200.

### 8. Durability hygiene (small, high leverage)

Problem: one-shot migration skip; `storage_ref` = source path; TOCTOU outside txn.  
Fix: versioned migrate; content-addressed blob under `COLLAB_DIR`; validate+write inside one transaction.

---

## What the docs changed in the diagnosis

Before indexes: “something about AgentOS/A2A is wrong.”  
With indexes:

1. A2A is bindings on the host — not ACP-IBM, not canvas `delegates_to` alone.
2. AI SDK never owns session ID — already measured in WO-004a; docs confirm; stop designing like it does.
3. Eve is the wrong product to reconnect to — BLUEPRINT already banned the Eve-shaped host; your Eve index is useful as “don’t rebuild this.” Target remains AgentOS + AI SDK loop inside QuantFlow Kernel law.

---

## Suggested sequence (dogfood ASAP)

① Docs truth → ② WO-006b merge fixes → ③ USE Law D demo

↓

④ WO-006c AgentOS+AI SDK (permissions + Kernel session)

↓

⑤ Kernel front door → ⑥ A2A binding (Critic)

↓

⑦ Creation/lineage → v0.5 data workflow

Bottom line: You weren’t “wrong about indexing docs” — you were wrong about the app matching BLUEPRINT. The three docs turn 64 nits into 8 fixable streams. The only stream that needs the indexes every day is #4 + #5 (AgentOS host + bindings). Everything else is Kernel/gate discipline and doesn’t care about Eve.

This is serious and specific — which means it gets the same treatment as any other testimony: **measure before acting.** Several claims are checkable right now, and one is a security claim that outranks everything else.

  

Confirmed — `qf:execute` takes **any command string from any renderer**, and `_event` is ignored so there's no sender check. Severity depends entirely on one thing: whether a *browser* tile gets that preload.

  

Critical correction: **the browser tile gets no preload and runs `contextIsolation=yes, sandbox=yes`.** Arbitrary web content cannot reach `window.api.qf`. Let me check the remaining structural claims.

  

I verified the checkable claims rather than acting on them. **Cursor is substantially right, with one important overstatement — and its highest-severity finding is real.**

  

## Confirmed true

  

| Claim | Measured |

|---|---|

| `insertRun`/`insertAgentSession`/`appendEvent` exported publicly | **True** — `portable.ts:24,27`. Direct bypass routes around the command layer, exposed to the app. |

| No Zod validation at `execute` | **True** — zero parse calls. Any renderer can send malformed input to a Kernel command. |

| `qf:execute` accepts any command, no sender check | **True** — `_event` ignored, no allowlist. |

| BLUEPRINT still says `better-sqlite3` | **True** — stale; WO-006b measured and used `node:sqlite`. |

| `claude-agent-acp` still in the app | **True** — `acp-agent.ts` exists in main. WO-006c must not build alongside it. |

  

## Overstated — and the correction matters

  

**"`qf:execute` open to every webview" is false.** I traced it: browser tiles are created with **no preload attribute** and `contextIsolation=yes, sandbox=yes`. Arbitrary web content cannot reach `window.api.qf`. The bridge reaches app-owned views only.

  

The real shape is **unscoped command surface with no sender validation** — a least-privilege defect, not an open door. Still worth fixing (a compromised app view, say via model output rendered in agent-chat, would get full Kernel write access), but it's defense-in-depth, not an emergency. That distinction changes the priority, and I'd rather you have the true severity than an alarming one.

  

## Stale

  

**"Law E gate red on tile type `artifact`"** — that was D1. Fixed in round 2, verified by me with my own baits, merged in `ceabb8c`. The gate is field-based now with no `artifact` allowlist. Cursor reviewed a tree from before the merge, so **workstream #2 is already done.**

  

## What I can't verify

  

The A2A/bindings architecture claims come from AgentOS docs I can't reach — `agentos-sdk.dev` returned **403** to my fetcher. Cursor has them indexed; I don't. So on the question of *whether A2A is host bindings rather than canvas cables*, **Cursor's indexed docs beat my inference, and I should defer to it** — with the caveat that I haven't confirmed it independently.

  

That's exactly your point, and you were right: I was inferring where I should have been reading. I've been measuring the *repo* rigorously and treating *external SDK behavior* as assumable. The AgentOS-in-Electron question in WO-006c deliverable 0 is the same gap — I made it a smoke test because I couldn't read the docs, when the docs may simply answer it.

  

**Concretely useful:** if you can paste or point me at the AgentOS custom-agent and bindings pages, I'll fold them into WO-006c before a builder touches it. That's the one input that would most improve the phase-gate order.

  

## My read on the plan

  

Cursor's 8 streams are sound, and the sequencing is right. Two amendments:

  

1. **#2 is done** — drop it, go straight to the founder demo you've already run.

2. **Split #3.** The `qf:execute` allowlist + sender check is small and belongs *in WO-006c* (it's about to expand that IPC surface). The larger front-door work — hiding inserts, Zod at `execute`, orphan-action lint — is its own order after 006c.

  

And `acp-agent.ts` existing changes WO-006c: the order says "the app imports no agent brain," but there's already one in `main/`. That's a defect in my order I'd have shipped. **Worth a pre-build read catching it — or me amending it now.**

  

Want me to amend WO-006c with these findings and land the doc-truth commit (#1)?

----

----

that was claudes response and you caught him good. i have to switch accounts to give context for the other claude to build out the fix.

  

or im thinking why use him when he keeps making mistakes??

Checking what’s on the ladder now so the advice matches the current orders.