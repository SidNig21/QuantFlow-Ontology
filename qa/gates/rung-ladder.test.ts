import { expect, test } from "bun:test";
import { closedPointerReasons, postGoldenPointerReasons } from "./rung-ladder.ts";

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

const open = "# NEXT — W1-01 LIVE MARKET DESK\n\nstatus: OPEN\nactive-order: docs/orders/active/WO-W1-01.md\nbuilder-authority: OPEN\nrouter-authority: OPEN\n";
const openOrder = "# WO-W1-01\n\nstatus: OPEN — independently read\n";

test("post-Golden pointer admits one active non-rung order and rejects false authority", () => {
  expect(postGoldenPointerReasons(open, openOrder)).toEqual([]);
  for (const [mutant, order] of [
    [open.replace("builder-authority: OPEN", "builder-authority: CLOSED"), openOrder],
    [open.replace("active-order: docs/orders/active/WO-W1-01.md", "active-order: docs/history/orders/WO-W1-01.md"), openOrder],
    [open + "active-order: docs/orders/active/WO-W1-02.md\n", openOrder],
    [open.replace("# NEXT — W1-01 LIVE MARKET DESK", "# NEXT — R18"), openOrder],
    [open, null],
    [open, openOrder.replace("status: OPEN", "status: CLOSED")],
  ] as const) expect(postGoldenPointerReasons(mutant, order)?.length).toBeGreaterThan(0);
});
