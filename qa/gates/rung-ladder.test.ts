import { expect, test } from "bun:test";
import { closedPointerReasons } from "./rung-ladder.ts";

const closed = "# NEXT — CLOSED\n\nstatus: CLOSED\nactive-order: none\nbuilder-authority: CLOSED\nrouter-authority: CLOSED\n";

test("closed pointer admits no order and rejects conflicting authority", () => {
  expect(closedPointerReasons(closed)).toEqual([]);
  for (const mutant of [
    closed.replace("active-order: none", "active-order: WO-PROOF-A.md"),
    closed.replace("builder-authority: CLOSED", "builder-authority: OPEN"),
    closed.replace("router-authority: CLOSED", "router-authority: OPEN"),
    closed.replace("status: CLOSED", "status: OPEN"),
    closed + "active-order: WO-PROOF-A.md\n",
    closed.replace("# NEXT — CLOSED", "# NEXT — R18"),
  ]) expect(closedPointerReasons(mutant)?.length).toBeGreaterThan(0);
  expect(closedPointerReasons("# NEXT — R18\nactive-order: WO-R18.md\n")).toBeNull();
});
