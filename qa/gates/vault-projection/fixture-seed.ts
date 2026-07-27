/**
 * WO-V1 QA fixture seeding that cannot go through execute().
 *
 * QA fixtures construct arbitrary state, including illegal state — that is what
 * bait IS. They cannot be forced through execute() without losing the ability
 * to test what execute() refuses (dock-registry/run.ts precedent).
 *
 * Two operations only:
 *   - forceSessionCreatedAt — execute() stamps new Date().toISOString(); G4
 *     needs identical created_at across >100 rows to prove stable tiebreak.
 *   - reversePhysicalSessionOrder — storage order is not a domain operation;
 *     G4(c) requires reshuffling tied rows while keeping created_at equal.
 *
 * Links are NOT seeded here — they go through execute()'s links: envelope.
 */

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
