# Open questions

Things I couldn't decide alone. Resolve these before or during implementation.

---

## 1. Tile-renderer source not in handoff project

I never had `tile-renderer.js`, `tile-manager.js`, `canvas-viewport.js`, or `canvas-persistence.ts` available when assembling this. §4.2, §4.3, §4.5 of HANDOFF.md describe what to change, but I cannot produce exact diffs.

**Action:** in your Codex CLI / Claude Code session, open these files alongside the handoff and ask the tool to apply the described changes literally. The output structure in §4.2 (`<div class="canvas-tile" data-running="…">`, `<div class="tile-spine">`, `<div class="tile-title-bar">`, etc.) is binding — match the class names exactly so the CSS in `Theme.css` hits.

## 2. Tile `kind` enum — does it match your existing model?

I assumed: `'term' | 'note' | 'file' | 'browser' | 'data' | 'agent'`.

If your codebase already discriminates tile types differently (e.g. `'terminal'` vs `'term'`), adjust the type in `TileRegistry.tsx` and the `KIND_GLYPH` map. The Watchtower component doesn't care.

## 3. Watchtower placement: nav window vs new BrowserWindow?

HANDOFF.md describes mounting it inside the nav window via `App.tsx` at fixed bottom. The prototype shows it overlaying the canvas (inside the shell window). Pick one:

- **Option A — nav window, fixed bottom** (current HANDOFF default). Simpler. Watchtower scrolls independently. But it can't overlay the canvas — it's locked to nav's column.
- **Option B — shell window, overlay** (matches prototype 07). Watchtower sits inside `#panel-viewer` as an absolute-positioned panel. Visually nicer but cross-cuts the shell's existing layout rules.
- **Option C — separate `watchtower/` BrowserWindow**. Most flexible (user can pop out / hide), most work to wire IPC for. Worth doing later, not v1.

If you don't pick: go A.

## 4. Workflow-chain grouping data — where does it live?

The Tile Registry groups tiles by "chain". Three places this metadata could come from:

- **Tile field** — each tile carries `chainId: string`. Schema bump, easy to query, hard to refactor later.
- **Top-level array in `canvas-state.json`** — `{ chains: [{ id, name, tileIds }] }`. Decoupled, flexible. Recommended.
- **Derived from cables** — connected-component analysis on the cable graph. Magic. Probably wrong for v1 (user wants explicit groups including unattached "Scratchpad").

If you don't pick: go option 2 (top-level array, user-curated).

## 5. Sidebar replaces or augments existing Files tab?

I wrote `TileRegistry.tsx` assuming it's *the* sidebar. Your current nav window has Files + Tiles tabs. Options:

- Replace the Tiles tab with `<TileRegistry>`, keep Files unchanged.
- Replace both — the registry becomes the only thing in the sidebar.
- Add a third tab "Registry" alongside Files + Tiles.

The prototype's Sidebar artboard goes "registry only" (option 2). If you don't pick: go option 1 (replace Tiles tab, keep Files).

## 6. Sample data for Watchtower until IPC lands

The component takes `events`, `cables`, `agents`, `alerts`, `throughput` props. Until you wire real telemetry:

- Read last N lines from each tile's stdout buffer to synthesize events
- Synthesize `queue depth = 0` per cable
- `agents = tile-manager.list().filter(t => t.kind === 'agent' || t.kind === 'term')` mapped to `WtAgent[]`
- Hardcode `throughput = []` for now

Or just feed it the prototype's sample data (in `06_watchtower.jsx`) verbatim. It'll look right.

## 7. Accent color persistence — design token or per-user setting?

The prototype Tweaks panel switches accent color (green / amber / cyan / blue). In production this should probably be:

- A user preference (saved to user-data dir) — power-users will want to set their own.
- OR a hardcoded `--accent` in Theme.css (you've already picked green).

If green is the answer forever, drop the swatch picker entirely. If users should be able to customize, expose `--accent` as a settings field in the app's preferences UI (out of scope here).

## 8. Cable kinds — ship all three or just `pipe`?

Theme.css defines `--cable-pipe`, `--cable-context`, `--cable-trigger`. The original handoff README said "start with pipe only". Do you want me to remove the other two until they're meaningful?

If you don't pick: keep them defined in Theme.css (cheap), but the cable-manager defaults to `kind: 'pipe'` and the renderer ignores `kind` for now. Cost = a few unused CSS lines.

## 9. Geist font licensing

The prototype loads Geist + Geist Mono from Google Fonts at runtime. For a packaged Electron app you'll want to either:

- Self-host the woff2 files (Geist is OFL, redistribution allowed).
- Keep the Google Fonts CDN link in `index.html` (simpler, fails offline).
- Fall back to system-ui / Menlo if Geist unavailable (already in Theme.css fallback stack).

If you don't pick: self-host Geist (one-time, 200 KB total).
