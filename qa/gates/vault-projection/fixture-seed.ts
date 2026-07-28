/**
 * WO-V1 QA fixture seeding that cannot go through execute().
 *
 * QA fixtures construct arbitrary state, including illegal state — that is what
 * bait IS. They cannot be forced through execute() without losing the ability
 * to test what execute() refuses (dock-registry/run.ts precedent).
 *
 * Operations:
 *   - forceSessionCreatedAt — execute() stamps new Date().toISOString(); G4
 *     needs identical created_at across >100 rows to prove stable tiebreak.
 *   - reversePhysicalSessionOrder — storage order is not a domain operation;
 *     G4(c) requires reshuffling tied rows while keeping created_at equal.
 *   - createIncompleteKernelFixture — REWORK ROUND 1 missing-type gate: build a
 *     Kernel whose DDL is NOT golden/migration.sql so the gate cannot inherit
 *     the blindness of migrating from the live schema then checking it.
 *
 * Links are NOT seeded here — they go through execute()'s links: envelope.
 */

import { Database } from "bun:sqlite";

/** Minimal statement surface — avoids importing qf-kernel from qa/. */
type SeedDb = {
  query(sql: string): {
    run(...params: unknown[]): unknown;
    get(...params: unknown[]): unknown;
  };
};

/** Force identical created_at — required by G4 tied-timestamp fixture. */
export function forceSessionCreatedAt(
  db: SeedDb,
  id: string,
  createdAt: string,
): void {
  db.query(`UPDATE agent_session SET created_at = ? WHERE id = ?`).run(
    createdAt,
    id,
  );
}

/**
 * Reverse physical row order for tied created_at sessions via DELETE+INSERT.
 * Required by G4(c): reorder must leave projector output unchanged.
 */
export function reversePhysicalSessionOrder(
  db: SeedDb,
  ids: readonly string[],
): void {
  for (const id of [...ids].reverse()) {
    const row = db
      .query(
        `SELECT id, created_at, status, label FROM agent_session WHERE id = ?`,
      )
      .get(id) as {
      id: string;
      created_at: string;
      status: string;
      label: string | null;
    };
    db.query(`DELETE FROM agent_session WHERE id = ?`).run(id);
    db.query(
      `INSERT INTO agent_session (id, created_at, status, label) VALUES (?, ?, ?, ?)`,
    ).run(row.id, row.created_at, row.status, row.label);
  }
}

/**
 * Build a deliberately incomplete Kernel at `path` whose tables come from this
 * subset DDL — never from qf-kernel-schema/golden/migration.sql.
 *
 * Present: schema_meta, artifact, agent_session, links (+ events via attach).
 * Absent: every other declared object type (market_event, run, …).
 * openKernel then sees schema_meta and skips the live migration.
 */
export function createIncompleteKernelFixture(path: string): void {
  const db = new Database(path);
  try {
    db.exec(`
      CREATE TABLE schema_meta (
        type_name TEXT PRIMARY KEY NOT NULL,
        kind TEXT NOT NULL,
        lifecycle TEXT NOT NULL,
        description TEXT NOT NULL
      );
      INSERT INTO schema_meta (type_name, kind, lifecycle, description)
        VALUES ('artifact', 'object', 'active', 'subset fixture — not live migration');
      INSERT INTO schema_meta (type_name, kind, lifecycle, description)
        VALUES ('agent_session', 'object', 'active', 'subset fixture — not live migration');

      CREATE TABLE artifact (
        id TEXT PRIMARY KEY NOT NULL,
        created_at TEXT NOT NULL,
        kind TEXT NOT NULL,
        content_hash TEXT NOT NULL,
        storage_ref TEXT NOT NULL
      );
      CREATE TABLE agent_session (
        id TEXT PRIMARY KEY NOT NULL,
        created_at TEXT NOT NULL,
        status TEXT NOT NULL,
        label TEXT
      );
      CREATE TABLE links (
        id TEXT PRIMARY KEY NOT NULL,
        kind TEXT NOT NULL,
        from_id TEXT NOT NULL,
        to_id TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE events (
        id TEXT PRIMARY KEY NOT NULL,
        type TEXT NOT NULL,
        object_type TEXT NOT NULL,
        object_id TEXT NOT NULL,
        payload TEXT NOT NULL,
        trace_id TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
    db.query(
      `INSERT INTO artifact (id, created_at, kind, content_hash, storage_ref)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(
      "incomplete-art-1",
      "2026-07-27T00:00:00.000Z",
      "report",
      "incomplete-art-1",
      "/tmp/qf-vault-incomplete-fixture-does-not-exist.md",
    );
    db.query(
      `INSERT INTO agent_session (id, created_at, status, label)
       VALUES (?, ?, ?, ?)`,
    ).run(
      "incomplete-session-1",
      "2026-07-27T00:00:00.000Z",
      "closed",
      "subset-fixture",
    );
  } finally {
    db.close();
  }
}
