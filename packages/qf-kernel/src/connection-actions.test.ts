/**
 * WO-g5a — create_connection / delete_connection through execute().
 */
import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { closeKernel, openKernel } from "./db-bun.ts";
import { execute } from "./execute.ts";
import { KernelError } from "./errors.ts";

const FIXTURE_ENV = "QF_KERNEL_SYNC_UNSAFE_FIXTURES_ONLY";
const dirs: string[] = [];

afterEach(() => {
  delete process.env[FIXTURE_ENV];
  for (const d of dirs.splice(0)) {
    rmSync(d, { recursive: true, force: true });
  }
});

function tempDir(): string {
  const d = mkdtempSync(join(tmpdir(), "qf-g5a-conn-"));
  dirs.push(d);
  return d;
}

function trace() {
  return { trace_id: "g5a-trace", span_id: "g5a-span" };
}

describe("WO-g5a connection write path", () => {
  test("create + delete persist through reopen; rejects self-loop and duplicate", () => {
    process.env[FIXTURE_ENV] = "1";
    const path = join(tempDir(), "conn.db");
    let db = openKernel(path, { create: true });

    const created = execute(
      db,
      "create_connection",
      {
        connection_id: "conn-1",
        kind: "view",
        from_ref: "tile-a:e",
        to_ref: "tile-b:w",
      },
      trace(),
    );
    expect(created.object_id).toBe("conn-1");
    expect(created.to).toBe("exists");

    const row = db
      .query(`SELECT kind, from_ref, to_ref FROM connection WHERE id = ?`)
      .get("conn-1") as { kind: string; from_ref: string; to_ref: string };
    expect(row).toEqual({
      kind: "view",
      from_ref: "tile-a:e",
      to_ref: "tile-b:w",
    });

    expect(() =>
      execute(
        db,
        "create_connection",
        {
          connection_id: "conn-loop",
          kind: "view",
          from_ref: "tile-a:e",
          to_ref: "tile-a:w",
        },
        trace(),
      ),
    ).toThrow(/self-loop/);

    expect(() =>
      execute(
        db,
        "create_connection",
        {
          connection_id: "conn-dup",
          kind: "view",
          from_ref: "tile-a:e",
          to_ref: "tile-b:w",
        },
        trace(),
      ),
    ).toThrow(/duplicate/);

    const deleted = execute(
      db,
      "delete_connection",
      { connection_id: "conn-1" },
      trace(),
    );
    expect(deleted.to).toBe("(none)");
    expect(
      db.query(`SELECT id FROM connection WHERE id = ?`).get("conn-1"),
    ).toBeNull();

    const events = db
      .query(
        `SELECT type FROM events WHERE object_id = ? ORDER BY created_at, id`,
      )
      .all("conn-1") as Array<{ type: string }>;
    expect(events.map((e) => e.type)).toEqual([
      "connection.created",
      "connection.deleted",
    ]);

    closeKernel(db);
    db = openKernel(path);
    expect(
      db.query(`SELECT id FROM connection WHERE id = ?`).get("conn-1"),
    ).toBeNull();
    closeKernel(db);
  });

  test("delete unknown id refuses", () => {
    process.env[FIXTURE_ENV] = "1";
    const db = openKernel(":memory:");
    expect(() =>
      execute(db, "delete_connection", { connection_id: "missing" }, trace()),
    ).toThrow(KernelError);
    closeKernel(db);
  });
});
