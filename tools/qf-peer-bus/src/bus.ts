/**
 * PeerBus — the transport plane for qf-peer-bus.
 *
 * Two concerns, deliberately kept apart (Law-clean, per WO-PEER-BUS):
 *   1. Domain truth — WHAT was said. Every message body is published to the
 *      shared Kernel (qf-kernel) as an immutable, content-addressed
 *      `trajectory` artifact. This happens unconditionally, every send,
 *      regardless of whether delivery is enabled.
 *   2. Transport bookkeeping — WHETHER it was routed. A small SQLite file
 *      (`peer-bus.db`) that this class owns exclusively, holding an inbox
 *      table. This file never touches kernel.db and is not domain truth —
 *      it is routing state, exactly like an MTA's queue.
 *
 * The `QF_PEER_DELIVERY=off` lever falsifies concern (2) only: the artifact
 * still lands in the Kernel (concern 1 is unconditional), but the inbox row
 * is never inserted, so the recipient's `readInbox()` will never see it.
 * That separation is the whole point of the falsification test in
 * src/harness.ts — it proves the Kernel record and the delivery guarantee
 * are two independent mechanisms, not one conflated write.
 */
import { Database } from "bun:sqlite";
import { closeKernel, execute, openKernel, type KernelDb } from "qf-kernel";

/** One row of the bus's own inbox table (transport state, not domain truth). */
export type PeerMessage = {
  id: string;
  from_role: string;
  to_role: string;
  artifact_id: string;
  body: string;
  created_at: string;
  delivered: number;
};

export type SendResult = {
  artifactId: string;
  messageId: string;
  /** false only when QF_PEER_DELIVERY=off suppressed the inbox insert for this send. */
  delivered: boolean;
};

/** Baseline peer roles this order is scoped to (orchestrator + worker, two peers). */
const KNOWN_PEERS = ["orchestrator", "worker"] as const;

const MESSAGES_DDL = `
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  from_role TEXT,
  to_role TEXT,
  artifact_id TEXT,
  body TEXT,
  created_at TEXT,
  delivered INTEGER DEFAULT 0
);
`;

export type PeerBusOptions = {
  /** Absolute path to the Kernel db, or ":memory:". Defaults to env QF_KERNEL_DB. */
  kernelDbPath?: string;
  /** Absolute path to the bus's own transport db, or ":memory:". Defaults to env QF_PEER_BUS_DB. */
  busDbPath?: string;
};

export class PeerBus {
  private readonly busDb: Database;
  private readonly kernelDb: KernelDb;

  constructor(opts: PeerBusOptions = {}) {
    const kernelDbPath = opts.kernelDbPath ?? process.env.QF_KERNEL_DB;
    const busDbPath = opts.busDbPath ?? process.env.QF_PEER_BUS_DB;
    if (!kernelDbPath) {
      throw new Error(
        "PeerBus requires a Kernel db path — set QF_KERNEL_DB (absolute path, or ':memory:')",
      );
    }
    if (!busDbPath) {
      throw new Error(
        "PeerBus requires a bus db path — set QF_PEER_BUS_DB (absolute path, or ':memory:')",
      );
    }

    // Kernel db: domain truth. openKernel() creates + migrates via qf-kernel.
    this.kernelDb = openKernel(kernelDbPath);

    // Bus db: transport bookkeeping, owned exclusively by this class, never
    // shares a connection or a schema with kernel.db.
    this.busDb = new Database(busDbPath);
    this.busDb.exec("PRAGMA journal_mode = WAL;");
    this.busDb.exec(MESSAGES_DDL);
  }

  /**
   * Publish `body` to the Kernel as a trajectory artifact (always), then
   * enqueue it in the recipient's inbox (unless QF_PEER_DELIVERY=off in
   * *this process's* env — the falsification lever).
   */
  send(from: string, to: string, body: string): SendResult {
    const bytes = new TextEncoder().encode(body);
    const result = execute(
      this.kernelDb,
      "publish_artifact",
      {
        kind: "trajectory",
        storage_ref: `peer://${from}->${to}`,
        bytes,
      },
      { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() },
    );
    const artifactId = result.object_id;
    const messageId = crypto.randomUUID();
    const deliveryEnabled = process.env.QF_PEER_DELIVERY !== "off";

    if (deliveryEnabled) {
      this.busDb
        .query(
          `INSERT INTO messages (id, from_role, to_role, artifact_id, body, created_at, delivered)
           VALUES (?, ?, ?, ?, ?, ?, 0)`,
        )
        .run(messageId, from, to, artifactId, body, new Date().toISOString());
    }

    return { artifactId, messageId, delivered: deliveryEnabled };
  }

  /** Return + mark-delivered all undelivered messages addressed to `role`. */
  readInbox(role: string): PeerMessage[] {
    const rows = this.busDb
      .query(
        `SELECT id, from_role, to_role, artifact_id, body, created_at, delivered
         FROM messages
         WHERE to_role = ? AND delivered = 0
         ORDER BY created_at ASC`,
      )
      .all(role) as PeerMessage[];

    for (const row of rows) {
      this.busDb.query(`UPDATE messages SET delivered = 1 WHERE id = ?`).run(row.id);
    }
    return rows;
  }

  /** Distinct roles seen in bus traffic, unioned with the known baseline set. */
  listPeers(): string[] {
    const rows = this.busDb
      .query(
        `SELECT from_role AS role FROM messages
         UNION
         SELECT to_role AS role FROM messages`,
      )
      .all() as { role: string }[];

    const seen = new Set<string>(KNOWN_PEERS);
    for (const row of rows) seen.add(row.role);
    return [...seen].sort();
  }

  close(): void {
    this.busDb.close();
    closeKernel(this.kernelDb);
  }
}
