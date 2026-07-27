/**
 * WO-K1 G2 — writers take turns when busy_timeout is set; control fails at 0.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { closeKernel, openKernel } from "./db-bun.ts";

const FIXTURE_ENV = "QF_KERNEL_SYNC_UNSAFE_FIXTURES_ONLY";

afterEach(() => {
  delete process.env[FIXTURE_ENV];
});

describe("WO-K1 G2 busy_timeout turn-taking", () => {
  test("two writers on one file both succeed with default busy_timeout", async () => {
    process.env[FIXTURE_ENV] = "1";
    const dir = mkdtempSync(join(tmpdir(), "qf-g2-ok-"));
    const path = join(dir, "kernel.db");
    const setup = openKernel(path);
    closeKernel(setup);

    const worker = join(dir, "writer.ts");
    await Bun.write(
      worker,
      `import { Database } from "bun:sqlite";
const path = Bun.argv[2];
const id = Bun.argv[3];
const db = new Database(path);
db.exec("PRAGMA busy_timeout = 5000;");
db.exec("PRAGMA journal_mode = WAL;");
db.exec("BEGIN IMMEDIATE");
const end = Date.now() + 250;
while (Date.now() < end) {}
db.query(
  "INSERT INTO events (id, type, object_type, object_id, payload, trace_id, created_at) VALUES (?, 't', 'o', 'i', '{}', 'tr', datetime('now'))",
).run(id);
db.exec("COMMIT");
db.close();
console.log("ok " + id);
`,
    );

    const a = Bun.spawn(["bun", worker, path, "evt-a"], {
      stdout: "pipe",
      stderr: "pipe",
    });
    await Bun.sleep(20);
    const b = Bun.spawn(["bun", worker, path, "evt-b"], {
      stdout: "pipe",
      stderr: "pipe",
    });
    const [codeA, codeB, outA, outB, errA, errB] = await Promise.all([
      a.exited,
      b.exited,
      new Response(a.stdout).text(),
      new Response(b.stdout).text(),
      new Response(a.stderr).text(),
      new Response(b.stderr).text(),
    ]);
    expect(codeA).toBe(0);
    expect(codeB).toBe(0);
    expect(outA + outB).toContain("ok evt-a");
    expect(outA + outB).toContain("ok evt-b");
    if (errA.trim()) console.error(errA);
    if (errB.trim()) console.error(errB);

    rmSync(dir, { recursive: true, force: true });
  });

  test("control: busy_timeout=0 makes concurrent BEGIN IMMEDIATE fail", async () => {
    process.env[FIXTURE_ENV] = "1";
    const dir = mkdtempSync(join(tmpdir(), "qf-g2-ctrl-"));
    const path = join(dir, "kernel.db");
    const setup = openKernel(path);
    closeKernel(setup);

    const worker = join(dir, "writer0.ts");
    await Bun.write(
      worker,
      `import { Database } from "bun:sqlite";
const path = Bun.argv[2];
const id = Bun.argv[3];
const holdMs = Number(Bun.argv[4] ?? "400");
const db = new Database(path);
db.exec("PRAGMA busy_timeout = 0;");
db.exec("PRAGMA journal_mode = WAL;");
try {
  db.exec("BEGIN IMMEDIATE");
  const end = Date.now() + holdMs;
  while (Date.now() < end) {}
  db.query(
    "INSERT INTO events (id, type, object_type, object_id, payload, trace_id, created_at) VALUES (?, 't', 'o', 'i', '{}', 'tr', datetime('now'))",
  ).run(id);
  db.exec("COMMIT");
  console.log("ok " + id);
  process.exit(0);
} catch (e) {
  console.error("locked " + id + ": " + (e instanceof Error ? e.message : String(e)));
  process.exit(2);
} finally {
  try { db.close(); } catch {}
}
`,
    );

    const a = Bun.spawn(["bun", worker, path, "evt-a", "500"], {
      stdout: "pipe",
      stderr: "pipe",
    });
    await Bun.sleep(30);
    const b = Bun.spawn(["bun", worker, path, "evt-b", "50"], {
      stdout: "pipe",
      stderr: "pipe",
    });
    const [codeA, codeB, errA, errB] = await Promise.all([
      a.exited,
      b.exited,
      new Response(a.stderr).text(),
      new Response(b.stderr).text(),
    ]);

    // At least one must fail under busy_timeout=0 while the other holds IMMEDIATE.
    const codes = [codeA, codeB];
    expect(codes.some((c) => c !== 0)).toBe(true);
    const locked = (errA + errB).toLowerCase();
    expect(locked.includes("locked") || locked.includes("busy")).toBe(true);
    console.log("G2 control: codes", codes, "stderr", errA + errB);

    rmSync(dir, { recursive: true, force: true });
  });
});
