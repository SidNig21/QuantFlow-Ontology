/**
 * Peer-delivery bridge — the missing half of visible agent collaboration.
 *
 * The peer-bus MCP server records a peer message (real, agent-driven) into the
 * Kernel and enqueues it in the transport db (~/.qf-peer-bus/peer-bus.db).
 * That delivery is PULL: the recipient only sees it if its agent calls
 * read_inbox. This watcher makes delivery PUSH: it polls the transport db and
 * writes each undelivered message straight into the recipient seat's live PTY,
 * so the message appears in the recipient's real Hermes TUI and is processed as
 * a turn — no "check your inbox" required.
 *
 * Runtime: Electron main = Node, so this uses Node's built-in sqlite (never the
 * Bun-only binding). It reads/updates ONLY the transport db (SELECT + UPDATE of
 * the delivered flag); it never opens the Kernel's own database and never
 * imports the Kernel package. The seam gate grants this file a pattern-specific
 * exception for the transport sqlite import only — it stays flagged if it ever
 * references the Kernel db or package. Domain truth is written solely by the bus.
 */

import { DatabaseSync } from "node:sqlite";
import { existsSync } from "node:fs";
import { writeToSession } from "./pty";
import { onPtySessionExit } from "./pty";

/** Peer role ("orchestrator" | "worker") → the live ptySessionId of its seat. */
const seatPtyByRole = new Map<string, string>();

export function registerSeatPty(role: string, ptySessionId: string): void {
  seatPtyByRole.set(role, ptySessionId);
  console.log(`peer-delivery: seat role=${role} → pty=${ptySessionId}`);
}

function unregisterSeatPtyBySession(ptySessionId: string): void {
  for (const [role, id] of seatPtyByRole) {
    if (id === ptySessionId) seatPtyByRole.delete(role);
  }
}

type PendingRow = {
  id: string;
  from_role: string;
  to_role: string;
  body: string;
};

/**
 * How a peer message lands in the recipient's TUI. Collapsed to one line and
 * terminated with a carriage return (Enter) so the TUI submits it as a turn.
 * If a given TUI does not submit on \r, the fallback is `hermes chat --resume`
 * (see WO-PEER-BUS delivery notes) — swap the submit sequence here.
 */
function formatIncoming(fromRole: string, body: string): string {
  const oneLine = body.replace(/\s*\n\s*/g, " ").trim();
  return `[peer message from ${fromRole}] ${oneLine}\r`;
}

let timer: ReturnType<typeof setInterval> | null = null;
let busDbPath = "";
let exitHookInstalled = false;

function poll(): void {
  if (!busDbPath || !existsSync(busDbPath)) return;
  let db: DatabaseSync | null = null;
  try {
    db = new DatabaseSync(busDbPath);
    let rows: PendingRow[];
    try {
      rows = db
        .prepare(
          `SELECT id, from_role, to_role, body FROM messages
           WHERE delivered = 0 ORDER BY created_at ASC`,
        )
        .all() as PendingRow[];
    } catch {
      // messages table not created yet (no send has happened) — nothing to do.
      return;
    }
    for (const row of rows) {
      const pty = seatPtyByRole.get(row.to_role);
      if (!pty) continue; // recipient seat not spawned yet — leave undelivered.
      writeToSession(pty, formatIncoming(row.from_role, row.body));
      db.prepare(`UPDATE messages SET delivered = 1 WHERE id = ?`).run(row.id);
      console.log(
        `peer-delivery: pushed ${row.id} ${row.from_role}→${row.to_role} into live TUI`,
      );
    }
  } catch {
    // Transient (db locked by the bus mid-write, etc.) — next tick retries.
  } finally {
    try {
      db?.close();
    } catch {
      /* ignore */
    }
  }
}

/** Idempotent. Starts polling the transport db and installs the pty-exit cleanup. */
export function startPeerDelivery(dbPath: string, intervalMs = 800): void {
  busDbPath = dbPath;
  if (!exitHookInstalled) {
    onPtySessionExit(unregisterSeatPtyBySession);
    exitHookInstalled = true;
  }
  if (timer) return;
  timer = setInterval(poll, intervalMs);
  console.log(`peer-delivery: watching ${dbPath} every ${intervalMs}ms`);
}

export function stopPeerDelivery(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
