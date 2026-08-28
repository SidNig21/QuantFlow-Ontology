import { createHash } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, mock, test } from "bun:test";

type FixtureRow = {
  to_role: string;
  to_session_id: string;
  message_kind: "task" | "result";
  pushed_at: string | null;
};

type ThrowStage = "open" | "prepare" | "get" | "close";
type Fixture = {
  schema: "ready" | "missing-table" | "missing-column";
  rows: FixtureRow[];
  throwStage?: ThrowStage;
};

const fixtures = new Map<string, Fixture>();

class FixtureDatabaseSync {
  private readonly fixture: Fixture;

  constructor(path: string) {
    const fixture = fixtures.get(path);
    if (!fixture) throw new Error("fixture path is not registered");
    if (fixture.throwStage === "open") throw new Error("injected open failure");
    this.fixture = fixture;
  }

  prepare(sql: string): { get: (role: string, sessionId: string) => { pending: number } | undefined } {
    expect(sql).toContain("to_role = ?");
    expect(sql).toContain("to_session_id = ?");
    expect(sql).toContain("pushed_at IS NULL");
    if (this.fixture.schema === "missing-table") throw new Error("no such table: messages");
    if (this.fixture.schema === "missing-column") throw new Error("no such column: pushed_at");
    if (this.fixture.throwStage === "prepare") throw new Error("injected prepare failure");
    return {
      get: (role, sessionId) => {
        if (this.fixture.throwStage === "get") throw new Error("injected query failure");
        return this.fixture.rows.some((row) =>
          row.to_role === role
          && row.to_session_id === sessionId
          && row.message_kind === "result"
          && row.pushed_at === null
        ) ? { pending: 1 } : undefined;
      },
    };
  }

  close(): void {
    if (this.fixture.throwStage === "close") throw new Error("injected close failure");
  }
}

mock.module("node:sqlite", () => ({ DatabaseSync: FixtureDatabaseSync }));
mock.module("./pty", () => ({ writeToSession: () => true, onPtySessionExit: () => {} }));

function fixtureFile(root: string, name: string, fixture: Fixture): string {
  const path = join(root, name);
  writeFileSync(path, "transport fixture", "utf8");
  fixtures.set(path, fixture);
  return path;
}

function fixtureHash(fixture: Fixture): string {
  return createHash("sha256").update(JSON.stringify(fixture.rows)).digest("hex");
}

test("transport pending-result predicate obeys the exact truth table and is read-only", async () => {
  const root = mkdtempSync(join(tmpdir(), "qf-g5-peer-delivery-test-"));
  try {
    const { hasUndeliveredResult } = await import("./peer-delivery");
    const absentPath = join(root, "absent.db");
    expect(hasUndeliveredResult("orchestrator", "director", absentPath)).toBe(false);

    const ready: Fixture = {
      schema: "ready",
      rows: [
        { to_role: "orchestrator", to_session_id: "director", message_kind: "result", pushed_at: null },
        { to_role: "orchestrator", to_session_id: "acknowledged", message_kind: "result", pushed_at: "2026-08-27T00:00:00.000Z" },
        { to_role: "worker", to_session_id: "other", message_kind: "result", pushed_at: null },
        { to_role: "orchestrator", to_session_id: "director", message_kind: "task", pushed_at: null },
      ],
    };
    const readyPath = fixtureFile(root, "ready.db", ready);
    const readyBefore = fixtureHash(ready);
    expect(hasUndeliveredResult("orchestrator", "director", readyPath)).toBe(true);
    expect(hasUndeliveredResult("orchestrator", "acknowledged", readyPath)).toBe(false);
    expect(hasUndeliveredResult("worker", "other", readyPath)).toBe(true);
    expect(hasUndeliveredResult("worker", "director", readyPath)).toBe(false);
    expect(hasUndeliveredResult("orchestrator", "missing", readyPath)).toBe(false);
    expect(fixtureHash(ready)).toBe(readyBefore);

    for (const schema of ["missing-table", "missing-column"] as const) {
      const fixture: Fixture = { schema, rows: [] };
      const path = fixtureFile(root, `${schema}.db`, fixture);
      expect(hasUndeliveredResult("orchestrator", "director", path)).toBe(false);
      expect(fixtureHash(fixture)).toBe(fixtureHash({ schema, rows: [] }));
    }

    for (const throwStage of ["open", "prepare", "get", "close"] as const) {
      const fixture: Fixture = {
        schema: "ready",
        rows: [{ to_role: "orchestrator", to_session_id: "director", message_kind: "result", pushed_at: null }],
        throwStage,
      };
      const path = fixtureFile(root, `${throwStage}.db`, fixture);
      const before = fixtureHash(fixture);
      expect(hasUndeliveredResult("orchestrator", "director", path)).toBe(true);
      expect(fixtureHash(fixture)).toBe(before);
    }
  } finally {
    fixtures.clear();
    rmSync(root, { recursive: true, force: true });
  }
});
