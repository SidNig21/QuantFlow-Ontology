> **ARCHIVED** — Do not implement from this file. See [[Projects/QuantFlow/Start Here]].

# QuantFlow

### What's strong

The one-line rule at the bottom is the best thing in the document. Print it out and put it next to your monitor:

```
Visual routing → QuantFlow strings
Shared memory/tasks/evidence → Envoy
Pane IO → node-pty/herdr
External control → MCP
File-edit safety → worktrees
```

Every architectural argument ends with that table. No more confusion about what owns what.

The string modes are exactly right. `watch`, `trigger`, `handoff`, `reply`, `artifact`, `receipt`, `gate` — that covers every case in your RL loop without overcomplicating it.


---
QuantFlow is an autonomous trading research platform built on a visual infinite canvas. You open one window and see every agent, every training run, every market feed, and every gate decision laid out spatially — the way you think about them. The canvas is not decoration. It is the interface through which both you and your supervisor agent perceive and operate the entire system.

## What it does

QuantFlow trains reinforcement learning models to trade BTC perpetual futures on HyperLiquid at 40x leverage. It runs a continuous loop: record market data, build observation vectors, train a PufferLib PPO policy, run inference, gate every trade through a Cloudflare security layer, execute, and feed results back into the next training cycle. Every step of this loop is visible on the canvas as a named terminal tile. Every step is orchestrated by a supervisor agent that works the canvas exactly the way you would — spawning tiles, typing commands, reading output, making decisions.

## How the canvas works

Collaborator provides the visual layer. It renders an infinite canvas of draggable terminal tiles, browser tiles, and markdown tiles. Each terminal tile is a WSL session. You pan, zoom, drag tiles into spatial groups that match your mental model — market feeds on the left, policy inference in the center, training on the right, monitoring at the bottom.

herdr provides the session layer underneath. Every terminal tile connects to a herdr-managed session via its socket API. herdr owns the PTY lifecycle, tracks agent state (working, blocked, done, idle), and provides the primitives that make agent-to-agent communication possible: `pane read` to see what any tile is doing, `pane run` to type into any tile's stdin, `wait agent-status` to block until a tile reaches a specific state. When you close Collaborator, herdr sessions keep running. When you reopen, tiles reconnect instantly with full scrollback. herdr is the reason the system doesn't break.

## How agents work together

One supervisor agent sits in a Collaborator tile. It has a herdr skill loaded from your Obsidian vault that teaches it every herdr command. When it needs something done, it does exactly what you would do:

It spawns a fresh tile on the canvas. It types the WSL command to start the process. It reads the output to confirm the process started. It moves on to the next task. If it needs Pi-Policy to run inference on a new checkpoint, it types `herdr pane run pi-policy "python3 inference.py --checkpoint ckpt_312"` and then reads the response with `herdr pane read pi-policy --lines 20` to see the result. If confidence comes back below 0.65, it types into the hermes-agent tile to trigger a gate check. If the gate approves, it types into the executor tile to submit the trade.

No special IPC protocol. No message broker. No connector strings. The agents communicate by typing into each other's terminals and reading the output — the same way you do when you sit at the keyboard. herdr's socket API makes this reliable and fast instead of fragile and broken.

The supervisor can work with any agent on any tile. Claude Code in one tile, Codex in another, a plain Python script in a third, a PufferLib training run in a fourth. The supervisor doesn't care what's running inside a tile. It just reads and writes to it through herdr. Any tile that needs to be orchestrated just needs a name registered with herdr. No skill file required on the receiving end.

## The RL training loop

Pi-Scout records live HyperLiquid WebSocket data — every L2 book update, every trade, every funding event — to Parquet files in your Obsidian vault. This is your ground truth dataset. HyperLiquid's official historical dumps are incomplete and delayed; your own recordings are the only reliable source.

Pi-Calculator builds a 550-dimensional observation vector from that data: 60 timesteps of 9 base features (OHLCV, funding, OI, spread, position) plus 10 strategy signals (RSI, MACD, ATR, Bollinger position, volume ratio, trend strength, funding signal, liquidation distance, regime score, EMA crossover).

Pi-Policy loads the current PufferLib checkpoint and runs inference. The action space is discrete: FLAT, LONG, SHORT. The policy outputs an action and a confidence score. If confidence is above 0.65, the action goes directly to the gate. If below, the supervisor escalates to Hermes for 3-pass reasoning.

Training runs on Prime Intellect's GPU cluster using your credits. Your HLReplayEnv is wrapped as a StatefulToolEnv with a rubric scoring PnL, liquidation avoidance, and fee efficiency. The trainer tile shows `prime train logs -f` streaming progress. Your RTX 3080 stays free for live inference. When a training run hits the Sharpe gate (val Sharpe > 1.0, liquidation rate < 5%), the supervisor downloads the checkpoint to your Obsidian genome and loads it into Pi-Policy.

Walk-forward validation enforces temporal discipline: train on 2021-2023, validate on 2024, test on 2025. The test set is never touched until you're genuinely ready for paper trading.

## The gate layer

Every trade intent passes through a Cloudflare Worker before execution. The gate Worker validates an HMAC-signed request, checks the intent against a closed enum of five allowed actions (trade.execute, trade.increase_size, leverage.change, position.close_all, key.access), and mints a short-lived JWT if approved. Hard denials — leverage exceeding 40x, size exceeding max, key export — are rejected instantly and immutably logged to R2.

For low-confidence signals, HermesGate runs a 3-pass reasoning protocol inside a Durable Object with Fiber crash-safety: pattern recognition, risk interrogation, and final verdict. The verdict is APPROVE, DOWNGRADE (reduce to FLAT), or VETO (block entirely). Every gate decision is logged to your Obsidian vault as a markdown file with the full reasoning chain.

A dead-man timer on HyperLiquid continuously refreshes a scheduled cancel-all. If your system crashes or loses connection, the dead-man fires and closes all positions. This is mandatory at 40x leverage.

## The execution boundary

The signer is a separate process. It holds the HyperLiquid private key and exposes a tiny RPC surface: place_batch, cancel_batch, schedule_cancel, set_leverage. Nothing else. Pi-Executor presents the JWT from the gate Worker. The signer verifies it, checks it against the intent registry, and only then calls the HyperLiquid exchange endpoint. The signer runs locally during paper trading and migrates to a Tokyo-adjacent host (Fly.io) when capital goes live. Per-process API wallet per HyperLiquid's documented recommendation.

## What runs on your machine

Your Alienware Aurora R11 with the i9-10900KF, RTX 3080, 128GB RAM, and 2TB NVMe handles everything during development. Collaborator renders the canvas. herdr manages sessions inside WSL. Pi-Scout records data. Pi-Calculator builds obs vectors. Pi-Policy runs inference on the GPU. The supervisor agent orchestrates everything. Training bursts go to Prime Intellect's cluster so the GPU stays free for inference.

One GPU job at a time. Four to eight CPU replay workers on the NVMe. WSL2 is the operating system for everything that matters — herdr, Python agents, node processes, Rust binaries all run natively in Linux.

## The Obsidian vault

Your vault at `/mnt/c/Users/rybow/Obsidian/Cursor Collab/` is the genome of the system. Trade verdicts land as markdown files. Checkpoint metadata is logged. Hermes skills are stored as SKILL.md files the supervisor loads on startup. The herdr API audit lives here. The integration plan lives here. The hive.yml workspace definition lives here. The vault is the one thing that survives everything — if Collaborator crashes, if herdr restarts, if your machine reboots, the vault is the canonical record of what happened and what the system knows.

## How it flows

You open Collaborator. herdr is already running in WSL. Nine tiles reconnect to their herdr sessions instantly. The supervisor tile wakes up, reads the canvas through herdr, checks what happened overnight. Pi-Scout has been recording. The trainer finished a run at 3am — Sharpe 1.12, liquidation rate 1.8%. The supervisor downloads the checkpoint, loads it into Pi-Policy, and resumes the live inference loop. A candle closes. Pi-Scout fires. Pi-Calculator builds the obs. Pi-Policy outputs LONG with confidence 0.58. The supervisor sees the low confidence, types into the hermes-agent tile to trigger the gate. HermesGate runs three passes and returns APPROVE. The supervisor types into the executor tile with the JWT. The signer verifies and submits to HyperLiquid. The trade verdict lands in your Obsidian vault. The dead-man timer refreshes. You see all of it happening across your canvas in real time.

That is QuantFlow.