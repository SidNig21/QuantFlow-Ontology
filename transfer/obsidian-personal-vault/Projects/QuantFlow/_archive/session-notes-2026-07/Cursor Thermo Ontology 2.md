# Thermo-nuclear audit: dock / canvas species plug-in

## 1. Verdict

**Hermes-specialized with false generality. Does not scale to arbitrary CLI/TUI guests.**

What looks plug-in-ready (`agent_definition` + `launch.json` / packed meta + dock species list from Kernel) is only half a model. The **collaborative canvas path** (`qf:seats:spawn`, peer-delivery, setup-seats MCP) is a Hermes seat product bolted beside a generic species admit path. Extending “collaborate with any species” by adding seats or species without unifying those paths will entrench spaghetti.

Tip fact: `hermes-seats.ts` is `orchestrator | worker` only — no `worker2` on this tip.

---

## 2. What is FACTUALLY wired today (cable)

**A. Species package → Kernel row (desk Kernel)**  
`species/<name>/register.ts` → `qf-kernel` `register_agent_definition` (`name`, `role`, `package_ref`) into the **app** Kernel (`collab-electron/src/main/kernel.ts` → `~/.collaborator/.../kernel.db`).  
Hermes: `species/hermes/register.ts`. Critic: `species/critic-mock/register.ts`. Gate: `qa/gates/dock-registry` proves register → list → no species literals in windows (for `qf-toolloop`), not peer seats.

**B. Surface / launch / tools (data beside package)**  
- Surface: `species-surface.ts` — packed `*.meta.json` → committed `launch.json` → default `acp_session`. Hermes: `route: native_tui`, `argv: ["--tui"]`.  
- Launch (ACP path only): `species-launch.ts` — `agentos` | `host_acp`.  
- Tools: `species-tools.ts` — used on **host_acp** admit, not native_tui.  
Critic-mock: **no** `launch.json` → defaults `acp_session`.

**C. Dock “species Spawn” (generic-looking)**  
`dock.js` → `listDefinitions` → Spawn → `qf:sessions:spawn` → `admitAndStartSession(species)` → term tile **or** session tile (`ipc-kernel.ts`). Renderer cannot pass env/argv.

**D. Dock “seat Spawn” (Hermes product)**  
Hardcoded HTML (`index.html`: Spawn Hermes Orchestrator/Worker) → `qf:seats:spawn({ seatId })` → `resolveHermesSeat` → **always** `admitAndStartSession("hermes", { argvOverride, sessionLabel, displayName })` → `create-term-tile` → `registerSeatPty(seatId, pty)` → `startPeerDelivery(~/.qf-peer-bus/peer-bus.db)`.

**E. native_tui binary**  
`host-native-tui.ts` / `admitHostAcpSpecies`: `HOST_ACP_BIN` / `HERMES_BIN` then **hardcoded Hermes path fallbacks**. Env always stamps `HERMES_BIN`.

**F. Collaboration MCP (beside guest, not in Electron ACP)**  
`tools/qf-peer-bus` stdio MCP → **separate** `~/.qf-peer-bus/kernel.db` + `peer-bus.db`.  
`setup-founder-seats.ts` **replaces entire `mcp_servers:`** in Hermes profile `config.yaml` for `qf-orchestrator` / `qf-worker`.  
Electron ACP: `acp-agent.ts` `mcpServers: []`. Host allowlist ≠ guest MCP.

**G. Push into TUI**  
`peer-delivery.ts`: poll transport DB → `writeToSession` + delayed `\r` (Hermes paste-submit quirk). Roles = seatIds.

**H. Schema MCP**  
`qf-kernel-schema/src/generate/mcp.ts` = **JSON tool defs only**. No live ontology MCP server.

**I. Third spawn**  
`qf:a2a:spawnSeats` — cold/harness A2A orchestra, not product dock.

---

## 3. Structural blockers / spaghetti

| Smell | Reality |
|--------|---------|
| Dual dock spawn | Species Spawn vs seat Spawn — different IPC, UX, and semantics |
| Dual Kernel | App Kernel (sessions/defs) vs `~/.qf-peer-bus/kernel.db` (trajectory truth for peer bus) |
| Dual “role” | `agent_definition.role` vs seat `seatId` / `QF_PEER_ROLE` — not one type |
| Hermes leak in “generic” host | Binary fallbacks, `HERMES_BIN`, seats hardcode `species: "hermes"` |
| MCP triangulation | Hermes yaml ↔ host allowlist ↔ empty ACP `mcpServers` — three non-aligned planes |
| Atomic setup smell | `upsertMcpConfig` nukes whole `mcp_servers:` section; half-applied if one profile fails mid-loop |
| 1k-line risk | `agent-host.ts` ~777 (extracted TUI helps); bolting more species branches into host / `ipc-kernel` / `dock.js` is the failure mode |
| False plug-in | Critic-mock registers as species but has **zero** seat/MCP/native_tui cable |

Naive “add Claude Code seat” = copy Hermes special cases into HTML + `hermes-seats` + setup PROFILES + peer-delivery submit hack. That is the regression.

---

## 4. Code-judo target (one dock model)

**Inevitable model:** one concept — **Seat = (species, role, host argv/profile, display)** — driven by host allowlist data, not renderer free-text.

Unify / delete:

1. **One spawn IPC** — e.g. only `qf:seats:spawn` (or one `qf:sessions:spawn` that accepts optional `seatId`). Delete product use of a second seat channel; keep A2A spawn as harness-only if needed.
2. **One seat registry module** (rename off Hermes) — `{ seatId, species, argv, sessionLabel, displayName, peerRole }` sourced from one file; dock renders from `listSeats()`, not hardcoded buttons.
3. **Species registration stays in Kernel** — `register_agent_definition` + packed meta / `launch.json` for surface. Seats **reference** species; they do not invent a parallel species type.
4. **Guest MCP stays outside Electron** — peer-bus (or guest-native config) beside the process. Do not hand MCP through ACP `mcpServers` from Electron “for convenience.”
5. **Binary resolution** — per-species command from host mounts / seat spec; delete Hermes-only fallbacks as the default path.
6. **Peer delivery** — role→pty map stays; submit strategy becomes per-species (or “guest owns inbox pull”) — do not bake Hermes `\r` as universal.
7. **Kernel story** — either document dual-Kernel as intentional (desk vs peer plane) and stop pretending one world, or converge peer recording onto the desk Kernel. Do not add a **third**.

Prefer **deleting** seat-vs-species dual UX over adding a third spawn path.

---

## 5. Plug-in recipe for a NEW species (existing seams only)

### Hypothetical Critic CLI / Claude Code TUI

| Step | Existing seam? | Status |
|------|----------------|--------|
| Pack + `register_agent_definition` into **app** Kernel | `species/*/register.ts`, Kernel create path | **EXISTS** |
| `launch.json` / meta `surface: native_tui` + argv | `species-surface.ts` | **EXISTS** (critic-mock: **GAP**) |
| Appear in dock species list + Spawn | `dock.js` + `qf:sessions:spawn` | **EXISTS** (gets a tile if binary resolves) |
| Host binary not Hermes | `HOST_ACP_BIN` / mounts | **PARTIAL** — fallbacks still Hermes |
| Collaborative seat buttons / peer roles | `hermes-seats` + HTML + `qf:seats:spawn` | **GAP** — Hermes-only |
| Guest can call peer-bus MCP | stdio server + guest config | **EXISTS for Hermes yaml**; **GAP** for Claude Code / Critic config formats |
| Push delivery into that TUI | `peer-delivery.ts` | **GAP** — Hermes submit semantics |
| Live ontology MCP from `generate/mcp.ts` | — | **GAP** (JSON only) |
| Seat MCP setup without wiping guest MCP section | `setup-founder-seats` | **GAP** — Hermes-specific, whole-section replace |

**Honest recipe today:** you can admit a second **species** as ACP or (if you fight binary resolution) native_tui tile. You **cannot** plug a second collaborative canvas guest through the seat/peer path without new Hermes-shaped special cases.

---

## 6. Approve / block

**BLOCK** expanding the seat registry, adding dock seat buttons, or “just registering” a new collaborative species until the judo above lands (at minimum: generic seat registry + one spawn path + seats keyed by `species`, not hardcoded `"hermes"`).

**Approve** only: pack/register/surface data for **non-collaborative** species admit via `qf:sessions:spawn`, or cold harness work — not “any species on the shared canvas.”

---

## 7. What NOT to do

- Hand MCP into Electron ACP (`mcpServers`) to “make collaboration work”
- Open a **third** Kernel / world DB for a temporary guest
- Stand up live `qf_*` servers from `generate/mcp.ts` JSON as if ontology MCP were implemented
- Add a third spawn IPC or `if (species === "claude")` branches in `agent-host` / `ipc-kernel` / `dock.js`
- Grow seat allowlist + HTML + `setup-founder-seats` PROFILES independently (desync = half-applied founder state)
- Treat Doctrine / WO prose as implemented plug-in architecture
- Invent Foundry-style ontology hosting as the guest bus

---

**Bottom line:** The scalable seam that already exists is **Kernel species + surface files + admitAndStartSession**. The canvas collaboration story is a **Hermes seat sidecar**. Until those are one model, “arbitrary CLI/TUI species on the dock” is marketing over the wrong cable.


**Verdict:** The canvas does **not** yet have a guest-agnostic plug-in model. What’s real is a **generic species admit path** beside a **Hermes-only collaboration seat path**. “Any CLI on the dock” only works for the first half today.

Full audit: [Dock plug-in audit](138d1aa0-d552-4e0c-a402-953b57951283)

*(Tip note: `origin/feat/peer-delivery` has `orchestrator|worker|worker2` and dock buttons generated from the seat registry — still Hermes-profile seats, not arbitrary CLIs.)*

---

### What’s actually plugged in today

Two cables:

| Cable | What it does | Who it works for |
|---|---|---|
| **Species Spawn** | `register_agent_definition` → dock lists Kernel rows → `qf:sessions:spawn` → `admitAndStartSession` → tile (`native_tui` or ACP) | Any packed species with surface/launch data (hermes, critic-mock, toolloop) |
| **Seat Spawn** | Host seat registry → `qf:seats:spawn` → always admits **`hermes`** with profile argv → term tile → peer-delivery | Hermes profiles only (`qf-orchestrator` / `qf-worker` / `qf-worker-2`) |

Collaboration tools are **not** injected by Electron. Hermes loads `mcp_servers.qf-peer-bus` from its own `config.yaml` (`setup-seats`). Peer-bus writes trajectories to `~/.qf-peer-bus/kernel.db`; app sessions live in the Collaborator worktree Kernel. ACP sessions pass `mcpServers: []`.

So: **tile on canvas ≠ collaborative guest.** Critic-mock can register as a species; it has no seat/peer-bus cable.

---

### How future CLI/TUI *should* plug in (code-judo — not built)

One concept, not two:

**Seat = `{ seatId, species, argv/profile, displayName, peerRole }`**  
Dock renders from that registry. One spawn IPC. Species stays Kernel (`register_agent_definition` + `launch.json` / packed meta). Guest owns MCP config (peer-bus / later ontology server as stdio). Electron owns PTY tile + optional push-delivery — with **per-species** submit behavior, not Hermes `\r` as universal law.

Until that lands, adding “Claude Code seat” means copying Hermes special cases into registry + setup + delivery. That’s the spaghetti the thermo bar blocks.

---

### Honest recipe for a new guest (today)

| Step | Status |
|---|---|
| Pack + register into app Kernel | **Exists** |
| `launch.json` → `native_tui` + appear as species Spawn | **Exists** (if binary resolves) |
| Host binary not Hermes-default | **Partial** (`HERMES_BIN` fallbacks) |
| Collaborative seat + peer role | **Gap** (Hermes-only) |
| Guest MCP peer-bus without wiping `mcp_servers` | **Gap** (Hermes yaml rewrite) |
| Push delivery into that TUI | **Gap** |
| Ontology world MCP | **Gap** (JSON only) |

---

### Approve / block

**BLOCK** growing the seat registry / “just add another collaborative species” until seats are species-keyed and spawn paths unify.

**OK now:** non-collaborative species admit via Species Spawn, or cold harness work.

**Do not:** hand MCP through Electron ACP, open a third Kernel, bolt `if (species === …)` into `agent-host` / `ipc-kernel` / `dock.js`, or treat peer-bus comments about “Claude Code / Codex” as dock wiring.

**Bottom line:** Shared canvas layer today = PTY/session tiles + Kernel session rows. Shared *collaboration* layer = Hermes ↔ peer-bus. Future CLIs plug into the first via pack/register/surface; they only plug into the second after you delete the Hermes dual-path and make seats data.