# Scout: Execution / Control / Harness Primitives

**Scope:** QuantFlow-Ontology L2–L4 + `ExecutionEnvironment` (not Foundry). Sources: `QUANTFLOW_RESEARCH_LIBRARY.md`, `Executor + Terminal Control.md`, verified GitHub READMEs / Cloudflare docs (2026-07-22).

**Fit key:** **Adopt** = plug in behind a QuantFlow interface · **Inspire** = steal contract/receipt patterns only · **Skip** = wrong layer or chassis conflict.

---

## Top recommendations (5)

| # | Tool | Verdict | One-line fit |
|---|------|---------|--------------|
| 1 | [anomalyco/terminal-control](https://github.com/anomalyco/terminal-control) | **Adopt** | **ExecEnv / L4:** Rust session driver + JSONL recordings + `termctrl driver` protocol + `@kitlangton/terminal-control` TS client — maps 1:1 to Kernel `ExecutionSession` objects and term tiles; MCP (`termctrl mcp`) is agent-facing only, receipts still land in L0. |
| 2 | [Cloudflare Sandbox SDK](https://developers.cloudflare.com/sandbox/) (`@cloudflare/sandbox`) | **Adopt** (remote driver) | **ExecEnv / L2:** Already chosen in BLUEPRINT for disposable CPU work — `exec`, `runCode`, file ops, preview URLs, **`terminal()` WebSocket**; implement as `CloudflareDriver` sibling to local terminal-control, not a second orchestrator. |
| 3 | [UsefulSoftwareCo/executor](https://github.com/UsefulSoftwareCo/executor) (= [RhysSullivan/executor](https://github.com/RhysSullivan/executor)) | **Inspire** | **L3:** MCP/OpenAPI/GraphQL catalog with per-tool allow/gate/block + shared auth — good **external-integration edge**; do **not** replace Kernel-generated `qf_*`; borrow policy/connection model for third-party tools Executor hosts. |
| 4 | [Cloudflare Code Mode](https://developers.cloudflare.com/agents/tools/codemode/) (`@cloudflare/codemode`) | **Inspire** | **L2 / L3 / ExecEnv:** Model writes one sandboxed plan that composes many connector calls (`search`/`describe`, approvals, replay) — pairs with remote sandbox/Executor for large catalogs without stuffing L2 context; keep local ACP loop direct for small `qf_*` sets. |
| 5 | [hyperbrowserai/HyperAgent](https://github.com/hyperbrowserai/HyperAgent) | **Inspire** | **L4 / ExecEnv:** CDP-first browser actions + **action-cache replay** (XPath steps, deterministic re-run) — steal receipt shape for `BrowserSession` tiles; **Skip adopt** (bundled LLM agent competes with L2 `ToolLoopAgent`; default v1 browser tile = Electron `--remote-debugging-port` + Playwright CDP, per control-ui pattern). |

---

## Also evaluated (brief)

| Tool | Verdict | Why |
|------|---------|-----|
| **Playwright/CDP on Electron** (control-ui skill pattern, not a library URL) | **Adopt** (pattern) | **L4:** `chromium.connectOverCDP` against Collaborator/Electron debug port — minimal browser tile harness agents can drive; no HyperAgent dependency. |
| [meta-pytorch/OpenEnv](https://github.com/meta-pytorch/OpenEnv) | **Park** | **ExecEnv (`rl_gym`):** Gymnasium `reset/step/state` + Docker/WebSocket — strong L6 betting-gym substrate, wrong for v1 hypothesis→backtest slice. |
| [bytedance/UI-TARS-desktop](https://github.com/bytedance/UI-TARS-desktop) | **Skip** | **L2/L4:** Full multimodal GUI/browser *agent* product (Agent TARS CLI + vision operators) — duplicates runtime + canvas agent, not a tile driver. |
| [ngrok/webernetes](https://github.com/ngrok/webernetes) | **Skip** | In-browser K8s toy; no local-first exec. |
| [thellimist/clihub](https://github.com/thellimist/clihub) | **Inspire** | **L3:** JSON Schema → typed CLI; reference for codegen ergonomics, but QuantFlow generates MCP from Zod at L0. |
| [NVIDIA-NeMo/ProRL-Agent-Server](https://github.com/NVIDIA-NeMo/ProRL-Agent-Server) | **Park** | **L6:** “Harness as environment” for RL rollouts — after Run/Receipt model exists. |
| [firstbatchxyz/watchmen](https://github.com/firstbatchxyz/watchmen) | **Skip** | Session→skills mining; not execution control. |
| [raindrop-ai/workshop](https://github.com/raindrop-ai/workshop) | **Inspire** | **L5:** Dev-time trace/replay UI reference; production spans stay in Kernel SQLite. |
| [hyperbrowserai/hyperbrowser-app-examples](https://github.com/hyperbrowserai/hyperbrowser-app-examples) | **Skip** | Hosted Hyperbrowser SaaS demos — conflicts with local-first; cloud browser is optional L6+, not v1 tile primitive. |
| Modal sandbox blog / Vercel Eve | **Skip** | Hosted agent chassis; QuantFlow already fixed on AgentOS + Kernel + generated MCP. |

---

## Suggested vertical slice

**Phase A — term tile proves ExecutionEnvironment (Law D):**

1. **L0:** `ExecutionSession` + `ExecutionReceipt` Kernel types (id, driver, command, recording hash, link to `Run`).
2. **ExecEnv interface:** `spawn | write | read | resize | snapshot | kill | recording()` — driver enum `local_terminal | cloudflare_sandbox`.
3. **Local driver:** embed `terminal-control` via `@kitlangton/terminal-control` or `termctrl driver` JSONL; agent tools = thin MCP wrapper **or** ACP-bridged calls; every mutation emits Kernel receipt event.
4. **L4:** term tile = projection of `ExecutionSession` + xterm attach to driver stream (replace raw `node-pty`-only path for agent-driven sessions).
5. **Gate:** Kernel action creates Run → agent runs command in session → kill app → tile + receipt + linked Artifact restore from Kernel only.

**Phase B — browser tile (after A passes):**

- Electron CDP harness (Playwright `connectOverCDP`) as `BrowserSession` driver; optional HyperAgent **action-cache JSON** as replay artifact format, not runtime dependency.

**Phase C — remote CPU (parallel, not blocking A):**

- Cloudflare Sandbox `exec`/`runCode` for Python sidecar parity; Code Mode only if tool composition at edge becomes a measured bottleneck.

**Explicit non-goals for v1:** adopting Executor as tool catalog, OpenEnv as exec layer, UI-TARS/Hyperbrowser cloud as default browser, or MCP-as-Kernel-truth for terminals.

---

## Layer cheat sheet

| Layer | Primary picks from this scout |
|-------|------------------------------|
| **L2 Runtime** | Keep ACP → ToolLoopAgent; Code Mode inspires **remote** composition only |
| **L3 Tools** | Kernel `qf_*` + optional Executor-inspired policy for external MCP |
| **L4 Canvas** | terminal-control + CDP/Playwright tile adapters (projection only) |
| **ExecutionEnvironment** | **Adopt:** terminal-control (local) + Cloudflare Sandbox (remote) |
