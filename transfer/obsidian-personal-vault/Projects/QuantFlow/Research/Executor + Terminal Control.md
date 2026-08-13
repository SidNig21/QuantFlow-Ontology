https://github.com/anomalyco/terminal-control
https://github.com/UsefulSoftwareCo/executor
cloudflare code mode

---
**This one is extremely relevant to QuantFlow.** Probably more directly than Executor.

`anomalyco/terminal-control` is essentially a **native terminal runtime that turns terminal sessions into durable, controllable, observable objects**. The implementation is Rust, with native platform packages and TypeScript bindings/client layers. The repo has explicit session, driver, recording, MCP, and protocol layers.

And I think it maps almost perfectly onto the **ExecutionEnvironment / Harness** problem we were talking about.

## The key idea

QuantFlow currently has this conceptual execution layer:

```text
Agent
  ↓
AgentOS / session
  ↓
Pi Worker / harness
  ↓
terminal
  ↓
shell / code / tools
```

`terminal-control` gives you a much more serious implementation of:

```text
terminal
  ↓
native process/session driver
  ↓
control protocol
  ↓
recording
  ↓
MCP exposure
  ↓
TypeScript client
```

So instead of QuantFlow treating a terminal as:

```text
"spawn a process and pipe stdout"
```

you can treat it as:

```text
ExecutionSession {
  id
  process
  terminal state
  input/output
  resize
  recording
  lifecycle
  control protocol
}
```

That is a **much better primitive**.

---

# Where it fits in QuantFlow

I think the architecture becomes:

```text
┌────────────────────────────────────┐
│          QuantFlow Kernel          │
│                                    │
│  Run / Artifact / ExecutionEnv     │
└──────────────────┬─────────────────┘
                   │
                   ▼
┌────────────────────────────────────┐
│          AgentOS / Rivet           │
│       durable agent session        │
└──────────────────┬─────────────────┘
                   │
                   ▼
┌────────────────────────────────────┐
│             Pi Worker              │
│         agent execution            │
└──────────────────┬─────────────────┘
                   │
                   ▼
┌────────────────────────────────────┐
│         terminal-control           │
│                                    │
│  native terminal session           │
│  driver                            │
│  PTY/process                       │
│  input/output                      │
│  recording                         │
│  lifecycle                         │
└──────────────────┬─────────────────┘
                   │
                   ▼
       ┌──────────────────────┐
       │ shell / Python / uv   │
       │ Claude Code / Codex  │
       │ git / tests / builds  │
       └──────────────────────┘
```

**This is much closer to a real ExecutionEnvironment than just `node-pty`.**

---

# The part I really like: separate driver from session

The repo has an explicit `driver` layer and a documented driver protocol.

That is exactly the abstraction QuantFlow needs.

Instead of hardcoding:

```text
QuantFlow → node-pty
```

you can have:

```text
QuantFlow
    ↓
ExecutionEnvironment interface
    ↓
Terminal Control Protocol
    ↓
driver
    ↓
native implementation
```

Then the driver could eventually be:

```text
LocalDriver
    ↓
macOS / Linux / Windows native terminal

CloudflareDriver
    ↓
Cloudflare sandbox

ContainerDriver
    ↓
Docker / Podman

RemoteDriver
    ↓
SSH / cloud VM
```

The agent should not care.

It should just say:

```text
ExecutionEnvironment.spawn()
ExecutionEnvironment.write()
ExecutionEnvironment.read()
ExecutionEnvironment.resize()
ExecutionEnvironment.kill()
ExecutionEnvironment.snapshot()
```

That is a huge architectural improvement over letting every worker know how to spawn its own shell.

---

# Why the recording layer is particularly relevant

The repo has a dedicated recording subsystem.

This maps directly to QuantFlow's **Receipts / observability / RL trajectory** idea.

Imagine:

```text
Agent decides:
  "Run pytest"

        ↓

ExecutionSession created

        ↓

Agent sends:
  $ pytest

        ↓

Terminal outputs:
  test_1 passed
  test_2 failed

        ↓

Agent reacts:
  inspect failure

        ↓

Agent edits file

        ↓

Agent reruns tests
```

The entire thing becomes a replayable trajectory:

```text
ExecutionReceipt {
  session_id
  command
  input_events
  output_events
  timestamps
  exit_code
  artifacts
}
```

Then QuantFlow can eventually say:

> **This is not just a terminal transcript. This is an agent trajectory attached to a Run.**

That is directly useful for:

- debugging
    
- audit
    
- replay
    
- evaluation
    
- training data
    
- reward assignment
    
- comparing agent strategies
    

This is one of the strongest connections to your **L6 Evolve** layer.

---

# The MCP part is interesting, but I would use it carefully

The repository has a native MCP layer.

That means terminal control can be exposed as tools to an agent.

Conceptually:

```text
terminal_create
terminal_write
terminal_read
terminal_resize
terminal_kill
terminal_snapshot
```

But I would **not** make the Kernel depend on MCP for terminal truth.

Instead:

```text
Agent
  ↓
MCP terminal tool
  ↓
Terminal Control runtime
  ↓
ExecutionSession
```

while separately:

```text
ExecutionSession
  ↓
receipt/event
  ↓
QuantFlow Kernel
```

So MCP is the **agent-facing interface**, while the actual terminal runtime remains a real subsystem.

---

# This could replace the old "agentos-host" style architecture

This is where I think it becomes especially important for your repo.

Your old architecture had a huge integration layer that knew about:

```text
AgentOS
Eve
tiles
cables
connection graph
```

The new architecture is trying to avoid that.

`terminal-control` suggests a much cleaner model:

```text
AgentOS
  ↓
Agent session
  ↓
ExecutionEnvironment
  ↓
terminal-control
  ↓
native terminal
```

No:

```text
AgentOS
  ↓
custom QuantFlow host
  ↓
Eve server
  ↓
custom terminal wrapper
  ↓
tile
```

The terminal should be a **capability**, not part of the canvas runtime.

---

# How I would combine the three repos/technologies we just discussed

This is the architecture I would seriously consider:

```text
                       ┌─────────────────┐
                       │   QUANTFLOW      │
                       │   KERNEL         │
                       │                 │
                       │ durable truth   │
                       └────────┬────────┘
                                │
                          Run / Receipt
                                │
                                ▼
                       ┌─────────────────┐
                       │    AGENTOS       │
                       │                 │
                       │ actor/session   │
                       └────────┬────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ TOOLLOOPAGENT    │
                       │                 │
                       │ model/tool loop │
                       └──────┬──────┬───┘
                              │      │
              ┌───────────────┘      └───────────────┐
              ▼                                      ▼
      ┌──────────────┐                      ┌──────────────┐
      │ Code Mode    │                      │ qf_* MCP     │
      │              │                      │              │
      │ compose      │                      │ Kernel       │
      │ external     │                      │ actions      │
      │ tools        │                      └──────────────┘
      └──────┬───────┘
             │
             ▼
       ┌──────────────┐
       │ Executor     │
       │              │
       │ external     │
       │ integrations │
       └──────────────┘

                              AND

                       ┌─────────────────┐
                       │ ExecutionEnv    │
                       └────────┬────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ terminal-control│
                       │                 │
                       │ native session  │
                       │ driver          │
                       │ recording       │
                       └────────┬────────┘
                                │
                                ▼
                         shell / Python /
                       Codex / Claude Code /
                            tests / git
```

## The separation is clean:

**AgentOS** = _How long does this agent session live?_

**ToolLoopAgent** = _How does the model reason and call tools?_

**Cloudflare Code Mode** = _How does the agent compose many operations efficiently?_

**Executor** = _How does the agent reach external integrations?_

**terminal-control** = _How does the agent control a real execution session?_

**QuantFlow Kernel** = _What actually counts as truth?_

---

# My biggest insight from this repo

I think QuantFlow should stop thinking of an "agent" as:

```text
LLM + tools
```

and instead model it as:

```text
Agent
├── Session
├── Runtime
├── Capabilities
├── Execution Environments
├── Receipts
└── Artifacts
```

The terminal is one execution environment.

A Cloudflare sandbox is another.

A Python computational worker is another.

A browser could be another.

The agent shouldn't directly own any of them.

```text
Agent
  ↓
Capability request
  ↓
ExecutionEnvironment
  ↓
receipt
  ↓
artifact
  ↓
Kernel
```

**That is the actual AgentOS architecture QuantFlow is converging toward.**

And honestly, I think `terminal-control` may be the missing piece for the **"one agent, one artifact, provable"** vertical slice: the agent can do real work in a controlled session, the session can be recorded, and the resulting artifact can be tied back to the same durable run identity.

The key next question is whether we should **adopt terminal-control as the canonical local ExecutionEnvironment primitive**, or whether its runtime should inspire a QuantFlow-specific `ExecutionEnvironment` interface with `terminal-control` as the first driver.