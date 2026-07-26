import type { KernelDb } from "./db.ts";

/** Harness-only DDL for G2 fixture table — lives in Kernel package per kernel-sole-writer gate. */
export function seedExperimentalFixtureTable(db: KernelDb): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS experimental (
      id TEXT PRIMARY KEY NOT NULL,
      created_at TEXT NOT NULL,
      label TEXT NOT NULL
    );
  `);
  db.query(
    `INSERT INTO experimental (id, created_at, label) VALUES (?, ?, ?)`,
  ).run("exp-probe-1", "2026-07-26T12:00:00.000Z", "gate-fixture");
}
