# QuantFlow V2 — Product

> **Authority:** `CONCEPT.md` (what it is) + `SCOPE.md` (what's active) + `BUILD_PLAN_V2.md` (build order).
> This doc describes the **product surfaces, flows, and states** the V2 design serves. It is
> descriptive, not a scope change. Where a surface is forward-looking, it is marked **(later)**.

---

## 1. One sentence

QuantFlow is a **live topology console**: you see **tiles** (operational nodes) and **cables**
(signal routes) on a **routed canvas field**. Each WSL tile is a **real, interactive terminal**
backed by a **herdr pane**; Windows-only shells use node-pty without herdr.

## 2. The one flow that must work (the spine)

```
Legend click → herdr creates/owns pane → PTY shows that pane in xterm → you type and see live output
```

If a tile does not accept keyboard input like a normal terminal, it is broken. Everything in the
visual system serves the legibility of this flow — *which node is live, what is routed to what, and
is the system healthy.*

## 3. Surfaces

### 3.1 Canvas (the routed field)
- Infinite pan/zoom dotted grid with a calibrated depth floor and a **QF origin watermark**.
- Holds **tiles** and **cables**. Pan/zoom only — no process logic lives here.
- **Empty state** teaches the core gestures: *spawn* (dock / `+` / Ctrl+K), *connect* (drag port→port),
  *pan/zoom*. The QF mark anchors the empty field; it recedes as tiles fill in.
- Floating chrome: `+` new-tile, zoom indicator, minimap, **spawn mode pill** ("spawn · viewport center").

### 3.2 Left registry (system index)
- `Files` / `Tiles` modes. Tiles mode = **Tile Registry**: workspace name + `LIVE / ERR / TILES` counts.
- Filter (`name, host, status`). Entries **grouped by agent class**: Generic CLI · Codex CLI · Agents ·
  Terminal sessions · Memory **(later)**. Each row: type glyph, name, `@route`, live/err status chip.
- Selecting a row selects/links its tile on the canvas.

### 3.3 Spawn dock (control rail)
- Compact vertical rail, **grouped & labelled**: **FLOW** (activity) · **SPAWN** (agents/tools) ·
  **TMPL** (templates incl. RL) · **CONTROL** (GO / record / menu).
- Tooltips on every icon. **Spawn mode** vs **connect mode** are visually distinct. Active/disabled/
  **experimental** states are explicit; unfinished templates read as disabled.
- Roles map 1:1 to the spawn pipeline; each role carries a `runtimeTarget` (`herdr-wsl` | `windows-pty`).

### 3.4 Tile (operational node)
- Fixed header anatomy + per-type role signature (see `DESIGN.md §6`).
- WSL tiles display a **PTY bridge** to a herdr pane (interactive xterm). Tile persists
  `herdrPaneId` / `herdrAgentName`. **Reject:** `pane.read` screenshot loops as display.

### 3.5 Inspectors
- **Tile inspector:** title, role, `@route`, status, `herdr:paneId`, content summary, actions
  (focus, connect, send-text, retire).
- **Cable inspector:** endpoints (tile + side), kind (pipe/context/trigger), relay state
  (idle/sending/sent/failed), `connection_id` + `correlation_id`, bundle count.

### 3.6 Status strip
- `Workspace · Tiles · Health LED · Zoom · version · Ctrl+K`. Health LED: healthy / degraded / down.

### 3.7 Watchtower (later — Gate 3+)
- System health + per-agent state + **event stream**. Live tile state comes from herdr
  `events.subscribe`, **not** polling. (Current 2s polling stays until Gate 3 lands — `RETIREMENT.md`.)

### 3.8 Settings
- Theme (dark default · light · high-contrast), density (comfortable · compact), canvas opacity,
  diagnostics/health panels, canvas-skill install for agents.

## 4. Core states (must be visually distinct)

| State | Tile | Cable | Registry |
|---|---|---|---|
| **Idle** | muted rail, low | thin, quiet | muted dot |
| **Running / live** | flow rail + running shadow, lit ports | animated flow pulse | `LIVE` green |
| **Selected** | bright-green border + rail | brighter route + endpoint halos | left accent |
| **Queued / blocked** | amber `STATUS` | denser amber pulse | amber chip |
| **Error / exited** | coral border + `STATUS` | pressured/broken coral | `ERR` coral |
| **Experimental** | dashed border, dimmed, `EXPERIMENTAL` | — | disabled |

## 5. Ownership (who does what)

| Piece | Job |
|---|---|
| Canvas (Collaborator fork) | Draw tiles, cables, pan/zoom. No process logic. |
| herdr | WSL sessions: panes, agents, state, Unix-socket API. |
| node-pty | Display glass for WSL (herdr attach in PTY) + Windows shell fallback. |
| MCP `:9811` | Tools for agents. |
| A2A / Envoy | **(later)** routing + memory. Not active until the spine works. |

## 6. Active scope (do not get ahead of it)

Per `SCOPE.md`: prove **canvas + herdr = one product**.
- **Gate 1 — done:** socket ping → pong.
- **Gate 2 — active:** Legend spawn → herdr pane → **interactive** xterm.
- **Gate 3:** live tile state via `events.subscribe`.

Frozen until Gate 2 passes: A2A, Envoy bridge, full legend palette, Watchtower evolution, custom
tile forms. The memory/context type, Watchtower stream, and bundled-route inspector in this design
are **forward-looking targets** — drawn so the visual system is coherent, not a request to build them now.
