/** G1 boundary-disabled bait — run while parse is commented out in execute.ts */
import { closeKernel, eventCount, execute, insertRun, openKernel } from "../src/index.ts";

const ctx = { trace_id: "g1-bait", span_id: "g1-bait-span" };
const db = openKernel(":memory:");
insertRun(db, { id: "run-bait", kind: "backtest" }, ctx);

const beforeEvents = eventCount(db);
const beforeStatus = (
  db.query(`SELECT status FROM run WHERE id = ?`).get("run-bait") as { status: string }
).status;
console.log(`BEFORE: event_count=${beforeEvents} run_status=${beforeStatus}`);

const result = execute(
  db,
  "start_run",
  { run_id: "run-bait", __g1_bait_extra__: "lands_in_payload" },
  ctx,
);

const afterEvents = eventCount(db);
const afterStatus = (
  db.query(`SELECT status FROM run WHERE id = ?`).get("run-bait") as { status: string }
).status;
const payload = (
  db.query(`SELECT payload FROM events ORDER BY rowid DESC LIMIT 1`).get() as {
    payload: string;
  }
).payload;

console.log(`AFTER: event_count=${afterEvents} run_status=${afterStatus}`);
console.log(`accepted_to=${result.to} event=${result.event}`);
console.log(`last_event_payload=${payload}`);
console.log(
  `bait_key_in_payload=${payload.includes("__g1_bait_extra__") && payload.includes("lands_in_payload")}`,
);

closeKernel(db);
