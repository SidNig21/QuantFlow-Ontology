## What QuantFlow is (one picture)

QuantFlow is a **research desk on a big canvas**. You don’t “chat with an app that remembers things in secret.” You look at **typed objects** (agents, sessions, datasets, results) that live in one place of truth — the Kernel — and everything you see on screen is just a **live view** of that.

The dock is the **front door for agents**.

---

## Plug-and-play, in plain English

Think of agents like **USB devices**.

| Piece | Everyday meaning |
|---|---|
| **Species** | The *kind* of agent (Hermes, Critic, Researcher…) — the “device type” |
| **Package** | The installable plug (a small folder that knows how to start that agent) |
| **Registry row** | A line in QuantFlow’s notebook: “this species exists, here’s how to launch it” |
| **Session** | One *running* instance of that species — like plugging the device in |
| **Tile** | The window on the canvas where that session’s work streams |
| **Dock** | The rail that lists species + live sessions and lets you start / cancel / close |

**Plug-and-play means:** to add a new agent type, you add a package + a registry row. You should **not** have to rewrite the dock or the canvas. If you did, it wasn’t really a plug.

That’s the whole contract.

---

## How it works when you use it

```text
1. Registry says: "Hermes exists" (and points at its package)
2. You hit Spawn on the dock
3. Host starts that package → a live session begins
4. Kernel writes the session (starting → running → …)
5. A tile appears and streams work
6. You Cancel / Close from the dock
7. Kill the app and reopen → dock rebuilds from the Kernel (it stored nothing itself)
```

The dock is a **mirror**, not a second brain. Kill the app mid-run and reopen: species and sessions come back from the Kernel, not from some forgotten UI cache.

---

## Hermes as the first real agent — what’s the plan, and where you are

**Intended story**

1. **WO-007** — dock works with a proof species (ToolLoop mock).  
2. **WO-008** — drop Hermes in as a package under `species/hermes/` with **no dock/app rewrite**. That’s the plug test.  
3. **WO-007b** — fix the host so “start session” and “send a turn” are separate (today spawn always wants to talk).  
4. **WO-008a** — permission prompts (allow/deny tools) so Hermes can safely do real work.  
5. **Then A2A** — two agents working together live.  
6. **Founder demo once** — skin → dock → Hermes → A2A, all in one sitting.

**What just happened in practice (honest)**

Hermes **package** is there. When QuantFlow tried to start it inside AgentOS’s guest space, that guest **could not see** your host Hermes install (`HERMES_BIN not found` inside the sandbox). That’s **Outcome B**: the plug shape is right; **reaching a host-installed Hermes from the guest still needs a design decision** (bundle Hermes into the package vs allow a controlled mount).

So today the **dock path** is proven with **critic-mock** (safe fake agent, same admission path). Hermes is the *first real* target; the live Hermes turn waits on host seams + permissions + that guest-reachability fix.

---

## Layers so far (what you’ve already built)

From the bottom up:

1. **Kernel (truth)**  
   Local notebook of objects and events. Only this may write research truth. Commands in, events out, replayable receipts.

2. **Schema / ontology**  
   The vocabulary: what an agent session *is*, what “cancel” is allowed to do, what an artifact is. The lawbook for the Kernel.

3. **Agent runtime seam (AgentOS + ACP)**  
   How an outside agent process talks to QuantFlow over a standard pipe. Guests stay guests; QuantFlow doesn’t become their memory.

4. **App host (Electron main)**  
   Opens the Kernel, registers IPC, seeds/admits packages, starts sessions. One door to the DB (`kernel.ts`), one door to AgentOS (`agent-host.ts`).

5. **Shell + canvas**  
   Infinite board, tiles, the look (one skin). Projection only — tiles show Kernel state; they don’t invent a second ledger.

6. **Dock**  
   Species list + session list + spawn/cancel/close. Built from Kernel rows, refresh on push, no hardcoded species names in the UI.

7. **Species packages (`species/`)**  
   Drop-in plugs. Hermes package + critic-mock. Admitting a species should be “add folder + register,” not “edit dock.”

8. **Proof / gates**  
   Machines that fail if someone cheats the rules (sole writer, one skin, dock registry, etc.).

9. **Process (orders)**  
   Work only through work orders; builders don’t self-approve; cold verification.

**v0.1 phase (through WO-006c)** was basically: Kernel + creation + agent path + Law D (kill app, truth survives) + then skin + dock.

---

## Future layers (what’s next on the ladder)

**Near (agents become usable for real)**

- **WO-007b** — clean host: handshake without forcing a chat turn; proper env for species.  
- **WO-008a** — you see and approve tool asks; deny-by-default.  
- **A2A** — two species collaborating with Kernel-mediated handoffs.  
- **Hermes live** — after reachability + permissions, your first real turn from the dock.

**Research stack (the actual quant workflow)**

- **Datasets** — ingest tennis/UFC/odds archives into versioned data (not dumping bulk into SQLite).  
- **Python sidecar** — number-crunching outside the UI; results come back only through Kernel commands.  
- **Bovada capture** — live odds as research data (the moat), honest failures.  
- **Agent contracts** — Researcher / Backtester / Critic as *data* (who may do what).  
- **Backtest + CLV** — same inputs → same hash; no future-looking leaks.  
- **Critic + Evaluation** — findings + bankroll-style metrics; hypothesis resolution gated on evaluation.  
- **Trace timeline + inspector** — click a number → see every step that made it.

**Later / bigger**

- Cloud sandboxes if local isn’t enough.  
- Second market pack (proves the core isn’t “UFC-only”).  
- Eventually: QuantFlow coordinating its *own* build (work orders as Kernel tasks) — dogfooding the product.

Phase gate for v0.5: one real flow end-to-end on real data —  
**Hypothesis → Dataset → Backtest → Artifact → Critic → Evaluation → Report**, with lineage you can walk.

---

## One sentence that ties it together

**The Kernel is the notebook, the dock is the agent launcher, species folders are the plugs, Hermes is the first serious plug — and the rest of QuantFlow is the research factory that those agents will drive once permissions, data, and backtests are online.**