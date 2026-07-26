/**
 * WO-105 G1 transcript harness — builder-run, not committed.
 * Run: cd packages/qf-kernel && bun run scripts/g1-transcript.ts
 */
import { ZodError } from "zod";
import {
  closeKernel,
  eventCount,
  execute,
  insertRun,
  openKernel,
  type KernelDb,
} from "../src/index.ts";

const ctx = { trace_id: "g1-trace", span_id: "g1-span" };

function rowCount(db: KernelDb, table: string): number {
  return (db.query(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;
}

function runState(db: KernelDb, id: string): string {
  return (db.query(`SELECT status FROM run WHERE id = ?`).get(id) as { status: string })
    .status;
}

function lastEventPayload(db: KernelDb): string {
  const row = db
    .query(`SELECT payload FROM events ORDER BY rowid DESC LIMIT 1`)
    .get() as { payload: string } | null;
  return row?.payload ?? "(none)";
}

function printCounts(label: string, db: KernelDb): void {
  console.log(
    `${label}: event_count=${eventCount(db)} run_rows=${rowCount(db, "run")} hypothesis_rows=${rowCount(db, "hypothesis")}`,
  );
}

function expectZodField(err: unknown, field: string): void {
  if (!(err instanceof ZodError)) {
    throw new Error(`expected ZodError, got ${String(err)}`);
  }
  const paths = err.issues.map((i) => i.path.join(".") || "(root)");
  if (!paths.some((p) => p === field || p.endsWith(field))) {
    throw new Error(`expected field ${field} in ${JSON.stringify(err.issues)}`);
  }
  console.log(`  error_names_field=${field} issues=${JSON.stringify(err.issues)}`);
}

console.log("=== G1 malformed: wrong type (transition start_run, run_id number) ===");
{
  const db = openKernel(":memory:");
  insertRun(db, { id: "run-wt", kind: "backtest" }, ctx);
  printCounts("before", db);
  try {
    execute(db, "start_run", { run_id: 123 as unknown as string }, ctx);
    console.log("UNEXPECTED: accepted wrong type");
  } catch (e) {
    expectZodField(e, "run_id");
  }
  printCounts("after", db);
  console.log(`  run_status_unchanged=${runState(db, "run-wt")}`);
  closeKernel(db);
}

console.log("\n=== G1 malformed: missing required field (creation create_hypothesis) ===");
{
  const db = openKernel(":memory:");
  printCounts("before", db);
  try {
    execute(db, "create_hypothesis", { claim: "test claim only" }, ctx);
    console.log("UNEXPECTED: accepted missing field");
  } catch (e) {
    expectZodField(e, "success_criteria");
  }
  printCounts("after", db);
  closeKernel(db);
}

console.log("\n=== G1 malformed: unknown extra key (transition start_run) ===");
{
  const db = openKernel(":memory:");
  insertRun(db, { id: "run-uk", kind: "analysis" }, ctx);
  printCounts("before", db);
  try {
    execute(
      db,
      "start_run",
      { run_id: "run-uk", __g1_unknown_extra__: "garbage" },
      ctx,
    );
    console.log("UNEXPECTED: accepted unknown key");
  } catch (e) {
    expectZodField(e, "(root)");
    if (e instanceof ZodError) {
      const keys = e.issues.flatMap((i) =>
        i.code === "unrecognized_keys" ? (i as { keys: string[] }).keys : [],
      );
      console.log(`  unrecognized_keys=${JSON.stringify(keys)}`);
    }
  }
  printCounts("after", db);
  console.log(`  run_status_unchanged=${runState(db, "run-uk")}`);
  closeKernel(db);
}

console.log("\n=== G1 well-formed: transition start_run accepted ===");
{
  const db = openKernel(":memory:");
  insertRun(db, { id: "run-ok", kind: "backtest" }, ctx);
  printCounts("before", db);
  const result = execute(db, "start_run", { run_id: "run-ok" }, ctx);
  printCounts("after", db);
  console.log(`  accepted: to=${result.to} event=${result.event}`);
  closeKernel(db);
}

console.log("\n=== G1 well-formed: creation create_hypothesis accepted ===");
{
  const db = openKernel(":memory:");
  printCounts("before", db);
  const result = execute(
    db,
    "create_hypothesis",
    {
      claim: "Home team wins",
      success_criteria: "ROI > 0 over 100 bets",
    },
    ctx,
  );
  printCounts("after", db);
  console.log(`  accepted: object_id=${result.object_id} event=${result.event}`);
  closeKernel(db);
}

console.log("\n=== G1 well-formed: creation with links envelope (extract before parse) ===");
{
  const db = openKernel(":memory:");
  const hyp = execute(
    db,
    "create_hypothesis",
    { claim: "c", success_criteria: "s" },
    ctx,
  );
  printCounts("before create_run+links", db);
  const result = execute(
    db,
    "create_run",
    {
      run_id: "run-links-1",
      kind: "backtest",
      links: [{ kind: "tests", to_id: hyp.object_id }],
    },
    { ...ctx, span_id: "g1-links" },
  );
  printCounts("after create_run+links", db);
  console.log(`  accepted: object_id=${result.object_id} event=${result.event}`);
  closeKernel(db);
}
