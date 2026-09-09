/**
 * WO-g6/W1-03: live cable geometry plus the one-Canvas projection boundary.
 * Falsify: mutate assertions / strip a row and watch it go red.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { connectionPath } from "../../collab-electron/src/windows/shell/src/cable-math.js";
import {
  cableEndpointsMoved,
} from "../../collab-electron/src/windows/shell/src/glacier-feel.js";

const REPO = join(import.meta.dir, "../..");

export function checkGlacierFeel(): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  // D2 — endpoints follow tile geometry
  const conn = {
    id: "c1",
    kind: "view",
    from_ref: "a:e",
    to_ref: "b:w",
  };
  const before = new Map([
    ["a", { x: 0, y: 0, width: 100, height: 100 }],
    ["b", { x: 300, y: 0, width: 100, height: 100 }],
  ]);
  const after = new Map([
    ["a", { x: 80, y: 20, width: 100, height: 100 }],
    ["b", { x: 300, y: 0, width: 100, height: 100 }],
  ]);
  if (!cableEndpointsMoved(conn, before, after, connectionPath)) {
    errors.push("D2: cable endpoints did not move when tile geometry moved");
  }

  // Source must redraw cables from live tiles, not store cable coords in canvas-state
  const canvasState = readFileSync(
    join(REPO, "collab-electron/src/windows/shell/src/canvas-state.js"),
    "utf8",
  );
  if (/\bconnections\b/.test(canvasState) || /\bcable\b/i.test(canvasState)) {
    errors.push("D2: canvas-state must not hold cable/connection geometry");
  }
  const renderer = readFileSync(
    join(REPO, "collab-electron/src/windows/shell/src/renderer.js"),
    "utf8",
  );
  if (!renderer.includes("cableOverlay?.redraw()")) {
    errors.push("D2: renderer must redraw cable overlay on reposition");
  }

  // W1-03 — one Canvas deliberately projects useful work instead of one tile
  // per Kernel row. Exact provenance remains available through Inspect.
  const oneCanvas = readFileSync(
    join(REPO, "collab-electron/src/windows/shell/src/one-canvas.js"),
    "utf8",
  );
  if (!oneCanvas.includes("oneCanvasSurfaceObjects")) {
    errors.push("W1-03: one Canvas must own the deliberate surface projection");
  }
  if (!oneCanvas.includes("Technical details")) {
    errors.push("W1-03: exact Kernel detail must remain reachable through Inspect");
  }
  for (const obsolete of ["kernel-ledger", "research-world-projection", "CURRENT_MISSION", "FULL_LINEAGE"]) {
    if (renderer.includes(obsolete)) {
      errors.push(`W1-03: renderer revived obsolete alternate-world surface ${obsolete}`);
    }
  }

  // Coverage floor. Fixed-path reads throw on missing files; still refuse PASS
  // if any protected source arrived empty (truncated/moved content).
  if (!canvasState.trim() || !renderer.trim() || !oneCanvas.trim()) {
    errors.push(
      "glacier-feel: scan collapsed — a protected source file was empty. " +
        "Refusing to report PASS on a scan that read nothing.",
    );
  }

  if (errors.length) {
    console.error("glacier-feel FAIL:");
    for (const e of errors) console.error(`  - ${e}`);
    return { ok: false, errors };
  }
  console.log("glacier-feel OK (live cable geometry + deliberate one-Canvas projection)");
  return { ok: true, errors: [] };
}

if (import.meta.main) {
  const { ok } = checkGlacierFeel();
  process.exit(ok ? 0 : 1);
}
