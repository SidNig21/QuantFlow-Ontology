/**
 * Regression: connection read-back must use getObject(id), never
 * queryObjects({ id }) — id is not on connection's declared filter surface.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  closeKernel,
  execute,
  getObject,
  openKernel,
  queryObjects,
} from "qf-kernel";

const FIXTURE_ENV = "QF_KERNEL_SYNC_UNSAFE_FIXTURES_ONLY";
const dirs: string[] = [];

afterEach(() => {
  delete process.env[FIXTURE_ENV];
  for (const d of dirs.splice(0)) {
    rmSync(d, { recursive: true, force: true });
  }
});

describe("connection create read-back", () => {
  test("queryObjects({ id }) throws; getObject returns the row", () => {
    process.env[FIXTURE_ENV] = "1";
    const dir = mkdtempSync(join(tmpdir(), "qf-conn-readback-"));
    dirs.push(dir);
    const db = openKernel(join(dir, "k.db"), { create: true });

    execute(
      db,
      "create_connection",
      {
        connection_id: "c-readback",
        kind: "view",
        from_ref: "tile-a:e",
        to_ref: "tile-b:w",
      },
      { trace_id: "t", span_id: "s" },
    );

    expect(() => queryObjects(db, "connection", { id: "c-readback" }, 1)).toThrow(
      /Unknown filter key for connection: id/,
    );

    const row = getObject(db, "connection", "c-readback");
    expect(row).toMatchObject({
      id: "c-readback",
      kind: "view",
      from_ref: "tile-a:e",
      to_ref: "tile-b:w",
    });

    closeKernel(db);
  });
});
