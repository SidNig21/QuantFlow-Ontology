/**
 * Peer-delivery bridge — the DESK-UX half of visible agent collaboration.
 *
 * The peer-bus MCP server records a peer message (real, agent-driven) into the
 * Kernel and enqueues it in the transport db. Delivery is PULL: an agent only
 * sees a message if it calls read_inbox. This watcher adds a PUSH surface: it
 * polls the transport db and writes each not-yet-pushed message into the
 * recipient seat's live PTY, so it appears in the real Hermes TUI and is
 * processed as a turn — no "check your inbox" required.
 *
 * ── DEBT (accepted 2026-07-21, thermo-review) ──────────────────────────────
 * Injecting into a TUI's stdin and forging Enter is a desk-UX bridge, NOT the
 * long-term collaboration path. It relays REAL agent messages (never host-
 * authored content — that distinction is why this is delivery, not the banned
 * scripted movie), but it depends on TUI paste-mode timing (SUBMIT_DELAY_MS)
 * which is environment-sensitive. Replacement plan: a wake/notify path (a
 * Hermes-native interrupt, or a host cue that prompts read_inbox) so pull-inbox
 * stays the sole delivery truth. KILL when that lands. Until then this stays a
 * clearly-labelled bridge that writes ONLY the push-tracking column.
 *
 * Runtime: Electron main = Node, so this uses Node's built-in sqlite (never the
 * Bun-only binding). It reads the transport db and writes ONLY `pushed_at`
 * (its own push-tracking column, owned conceptually by this bridge); it never
 * touches `delivered` (the pull path's flag), never opens the Kernel's own
 * database, and never imports the Kernel package. The seam gate grants a
 * pattern-specific exception for the transport sqlite import only.
 */

import { DatabaseSync } from "node:sqlite";
import { existsSync } from "node:fs";
import { writeToSession } from "./pty";
import { onPtySessionExit } from "./pty";

/** Peer role ("orchestrator" | "worker" | "worker2" | …) → live ptySessionId. */
const seatPtyByRole = new Map<string, string>();

/** Messages mid-injection this tick — guards against a second write landing
 *  between a message's text and its Enter on the same PTY. */
const inFlight = new Set<string>();

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

/** The message text that appears in the recipient's TUI (no Enter — see below). */
function formatIncoming(fromRole: string, body: string): string {
  const oneLine = body.replace(/\s*\n\s*/g, " ").trim();
  return `[peer message from ${fromRole}] ${oneLine}`;
}

/**
 * Delay before the Enter keystroke. The text and the Enter MUST be separate
 * writes: sent as one burst, the TUI's paste-detection treats the trailing
 * carriage return as pasted content and never submits (proven — the text
 * appeared but did not send). Writing "\r" as a distinct keystroke after the
 * text lands submits the turn (proven: the worker's model then reasons over it).
 */
const SUBMIT_DELAY_MS = 400;

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
      // Not-yet-pushed only. `delivered` (the pull path) is never read here.
      rows = db
        .prepare(
          `SELECT id, from_role, to_role, body FROM messages
           WHERE pushed_at IS NULL ORDER BY created_at ASC`,
        )
        .all() as PendingRow[];
    } catch {
      // messages table / pushed_at column not present yet — nothing to do.
      return;
    }
    for (const row of rows) {
      if (inFlight.has(row.id)) continue; // its Enter is still pending.
      const pty = seatPtyByRole.get(row.to_role);
      if (!pty) continue; // recipient seat not spawned yet — leave for later.
      // Split write: text now, Enter as a separate keystroke (defeats the TUI's
      // paste-detection). Mark pushed_at ONLY after the Enter is written — a
      // seat that dies mid-inject is never falsely marked, so it retries.
      inFlight.add(row.id);
      writeToSession(pty, formatIncoming(row.from_role, row.body));
      const { id, from_role, to_role } = row;
      setTimeout(() => {
        try {
          writeToSession(pty, "\r");
          const mark = new DatabaseSync(busDbPath!);
          try {
            mark
              .prepare(`UPDATE messages SET pushed_at = ? WHERE id = ?`)
              .run(new Date().toISOString(), id);
          } finally {
            mark.close();
          }
          console.log(
            `peer-delivery: pushed ${id} ${from_role}→${to_role} into live TUI`,
          );
        } catch {
          // Seat closed between text and Enter, or db busy — leave pushed_at
          // NULL so the next tick retries into a (possibly respawned) seat.
        } finally {
          inFlight.delete(id);
        }
      }, SUBMIT_DELAY_MS);
      break; // one message per tick.
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
