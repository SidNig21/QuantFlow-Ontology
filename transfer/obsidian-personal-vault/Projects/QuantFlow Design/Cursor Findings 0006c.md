Reviewed `origin/QuantFlow` `docs/orders/WO-006c.md` @ `7b309e0` (amended 2026-07-19). Findings only.

---

### 1. Can each acceptance gate actually fail?

| Gate | What must break for red | Verdict |
|---|---|---|
| **1** schema test + generate | Wrong `defineAction` / catalog / goldens | Can fail |
| **2** `qf-kernel` tests | Missing creation handler (D3) or broken handler | Can fail |
| **3** `agent-path` + 3 falsifications + doc-action one-sided | Cancel / ID adoption / publish / doc-only action | Can fail **if built as specified** — see F1/F4 for holes the gate never probes |
| **4** Dev-app log paste | Nothing mechanical — verifier must re-run | **Satisfiable by construction** (unfalsifiable without founder/verifier redo) |
| **5** `bun run build` | Type/compile/bundle break | Can fail |

Deliverable 9’s (a)(b)(c) pairs are real. Deliverable 5’s sender proof is not: “if feasible, or unit test” lets a green report skip a live `event.sender` rejection.

---

### 2. Does each deliverable have exactly one meaning?

**Ambiguous (two competent readings both “right”):**

| Deliverable | Reading A | Reading B |
|---|---|---|
| **1** `creationCommands` entry | Literal `type` / `to` fields as written | Match live shape: `object_type` only (no `to`) — `qf-kernel-schema/src/commands.ts:137–150` |
| **1** handler | Call `insertAgentSession` (already emits `agent_session.created`) | Mirror `publishArtifact`: own `INSERT` + one `appendEvent`; do **not** call `insertAgentSession` |
| **5** “shows … species” | Ephemeral host map / tile props only | Stuff species into `label` (only nullable string on `agent_session`) |
| **5** sender check | Real Electron sender reject (disallowed webContents) | Unit-test mock of the predicate |
| **8** vs **9** | Truly concurrent two sessions | Sequential second session cancel (gate text allows this) |
| **Contract L63** “two authorized files” | `ONTOLOGY_SCHEMA.md` + `docs/demos/agent-path.md` | Ontology only → deliverable 10 forbidden |

---

### 3. External-surface check (indexed docs)

| Order claim | Docs / evidence | Result |
|---|---|---|
| `AgentOs.create` → `createSession("qf-toolloop")` embedded host | Matches `tools/runtime-proof/src/proof.ts:78–93` + `@rivet-dev/agentos-core` | **Hold** (repo-measured) |
| Guest mint → host adopt as Kernel ID | Matches WO-004 / `acp-main.ts:103–107` + core `createSession` | **Hold** for **core** path |
| Public AgentOS Sessions page | “The public session ID is stable… AgentOS keeps the adapter’s private ACP session ID **internal**”; API is `openSession` / `prompt` via `@rivet-dev/agentos` client | **Contradicts** treating ACP mint as the *public* AgentOS ID on the **actor/client** surface |
| Measured facts: “whether `@rivet-dev/agentos` runs in Electron” | Proven path imports `@rivet-dev/agentos-core` | **Misnamed package** |
| `ToolLoopAgent` has no session identity; brains stay in guest | AI SDK building-agents: `ToolLoopAgent` is model/tool loop; no session ID API | **Hold** |
| A2A / bindings = host bindings, not canvas cables | AgentOS agent-to-agent: bindings execute on host, VMs share no FS | **Hold** (order correctly keeps this out of scope) |
| Hermes as later species via pack/registry | Compatible with AgentOS custom ACP guest; Hermes review skills are *Hermes-internal* orchestration, not the QF host seam | **No contradiction** |
| Eve approvals / channels | Eve = different product; order out-scopes approval gates | **Correct anti-target** |

**Deliverable 0 smoke would not surface:** fail-from-`starting` illegality; creationCommands field typo; double `agent_session.created`; concurrent independence; packaged/asar native sidecar vs unpackaged main; actor `openSession` identity semantics; sender allowlist; permissionPolicy defaults (`allow_all` on Sessions docs — out of scope here, but smoke never asks).

---

## Ranked findings

1. **BLOCKER — Boot reconciliation is illegal for `starting` (and thus for “any non-terminal”).**  
   Order L43: fail then close every non-terminal with reason `app_terminated`.  
   Evidence: `qf-kernel-schema/src/transitions.ts` — `starting: ["running"]` only; `fail_agent_session` / `close_agent_session` edges only from `running|blocked` / `cancelled|failed|running` (`commands.ts:82–129`). A force-kill during spawn leaves `starting` with **no legal Kernel path** to `failed/closed`. Same trap for deliverable 3 guest-crash before `running`. Gate 9 only reconciles a synthetic **`running`** row — it can go green while the founder demo’s mid-spawn kill cannot.

2. **BLOCKER — `creationCommands` entry invents fields the catalog does not have.**  
   Order L35: `type: "agent_session"`, `to: "starting"`.  
   Evidence: `CreationCommand` is `{ action, object_type, event }` only (`commands.ts:137–150`); `publish_artifact` has no `to`. Literal compliance fails typecheck; “fix it up” is improvisation the order forbids.

3. **HIGH — Deliverable 1 handler instruction double-writes or contradicts the publish pattern.**  
   Order L36: “mirroring `publishArtifact`’s shape, using `insertAgentSession` + the event append.”  
   Evidence: `insertAgentSession` already `appendEvent`s `agent_session.created` (`insert.ts:71–77`); `publishArtifact` does **not** call insert helpers — it inserts + appends once (`create.ts:92–109`). Reading A → duplicate events; Reading B → ignore half the sentence. Not one meaning.

4. **HIGH — Concurrent independence (L51) is not falsified by gate 9.**  
   Gate requires a second session cancelled and orphans zero — satisfiable by a **singleton serial host**. Deliverable 8’s “spawn two concurrently; cancel one; the other completes” can ship broken and still pass (a)(b)(c).

5. **HIGH — External API fork: public AgentOS docs vs order’s core path; smoke won’t catch the wrong surface.**  
   Order L19/L29 correctly copies runtime-proof (`AgentOs.create` / `createSession`). Indexed Sessions docs document `openSession` + host-owned public ID / internal ACP ID. Measured-facts L24 names `@rivet-dev/agentos` while the proven embed is `@rivet-dev/agentos-core`. A builder who “reads the vendor docs” instead of the proof tree can implement the actor client and still print a smoke line that looks green until identity/adoption assertions are checked — and L29’s smoke does not assert guest-mint ≡ Kernel id.

6. **MED — Contract L63 vs deliverable 10.**  
   “Do not touch `docs/` beyond the **two authorized files**” never names them; L33 authorizes `ONTOLOGY_SCHEMA.md`; L56 requires `docs/demos/agent-path.md`. Builder can refuse the demo as out-of-contract or write it and still be “compliant.”

7. **MED — Species on the tile has no Kernel column; Law B ambiguity.**  
   L45 requires showing species; `agent_session` properties are only `status` + `label` (`schema.ts:286–294`); order forbids new columns (L34). Species in host memory dies across relaunch; species in `label` overloads the field. Both are defensible; neither is specified.

8. **MED — Least-privilege proof is soft; gate 4 is log theater.**  
   L45: sender pair “if feasible, or unit test.” L71: paste logs. Neither can go red under PROTOCOL’s gate-falsification rule without verifier re-measurement. Allowlist reject paste is real; sender check is optional in practice.

---

**Not clear.** Amend before build — especially F1 (schema transition for `starting` → `failed`, or narrow reconciliation to states that already have edges) and F2/F3 (catalog + single event writer).