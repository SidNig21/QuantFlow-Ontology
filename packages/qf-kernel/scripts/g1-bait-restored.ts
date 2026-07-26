/** G1 boundary-restored bait — run after parse restored in execute.ts */
import { ZodError } from "zod";
import { closeKernel, eventCount, execute, insertRun, openKernel } from "../src/index.ts";

const ctx = { trace_id: "g1-bait", span_id: "g1-bait-span" };
const db = openKernel(":memory:");
insertRun(db, { id: "run-bait", kind: "backtest" }, ctx);

const beforeEvents = eventCount(db);
const beforeStatus = (
  db.query(`SELECT status FROM run WHERE id = ?`).get("run-bait") as { status: string }
).status;
console.log(`BEFORE: event_count=${beforeEvents} run_status=${beforeStatus}`);

try {
  execute(
    db,
    "start_run",
    { run_id: "run-bait", __g1_bait_extra__: "lands_in_payload" },
    ctx,
  );
  console.log("UNEXPECTED: accepted with extra key after restore");
} catch (e) {
  if (e instanceof ZodError) {
    console.log(`REJECTED: ${JSON.stringify(e.issues)}`);
  } else {
    throw e;
  }
}

const afterEvents = eventCount(db);
const afterStatus = (
  db.query(`SELECT status FROM run WHERE id = ?`).get("run-bait") as { status: string }
).status;
console.log(`AFTER: event_count=${afterEvents} run_status=${afterStatus}`);

closeKernel(db);
