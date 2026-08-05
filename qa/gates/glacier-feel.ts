/**
 * WO-g6: D2 cable geometry tracking + D4 ledger projection equality.
 * Falsify: mutate assertions / strip a row and watch it go red.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { connectionPath } from "../../collab-electron/src/windows/shell/src/cable-math.js";
import {
  cableEndpointsMoved,
  projectKernelLedger,
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

  // D4 — projected ledger equals events query set/order
  const rows = [
    { id: "e1", type: "connection.created", object_type: "connection", created_at: "2026-08-05T04:32:17.308Z" },
    { id: "e2", type: "agent_session.started", object_type: "agent_session", created_at: "2026-08-05T04:30:00.000Z" },
    { id: "e3", type: "connection.deleted", object_type: "connection", created_at: "2026-08-05T04:34:40.043Z" },
  ];
  const projected = projectKernelLedger(rows);
  const ids = projected.map((p) => p.id);
  if (ids.join(",") !== "e3,e1,e2") {
    errors.push(`D4: expected newest-first e3,e1,e2 got ${ids.join(",")}`);
  }
  if (projected.length !== rows.length) {
    errors.push("D4: projected length diverged from events rows");
  }
  for (const row of rows) {
    const hit = projected.find((p) => p.id === row.id);
    if (!hit) {
      errors.push(`D4: missing event ${row.id}`);
      continue;
    }
    if (hit.type !== row.type || hit.object_type !== row.object_type) {
      errors.push(`D4: row ${row.id} type/object_type mismatch`);
    }
  }

  // Ledger module must exist and project, not invent
  const ledgerSrc = readFileSync(
    join(REPO, "collab-electron/src/windows/shell/src/kernel-ledger.js"),
    "utf8",
  );
  if (!ledgerSrc.includes("projectKernelLedger")) {
    errors.push("D4: kernel-ledger.js must project via projectKernelLedger");
  }

  // Coverage floor. Fixed-path reads throw on missing files; still refuse PASS
  // if any protected source arrived empty (truncated/moved content).
  if (!canvasState.trim() || !renderer.trim() || !ledgerSrc.trim()) {
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
  console.log("glacier-feel OK (D2 geometry tracking + D4 ledger projection)");
  return { ok: true, errors: [] };
}

if (import.meta.main) {
  const { ok } = checkGlacierFeel();
  process.exit(ok ? 0 : 1);
}
