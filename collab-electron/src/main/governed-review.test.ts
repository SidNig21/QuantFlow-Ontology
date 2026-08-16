import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { ontologyToolsForRole } from "./ontology-role-tools.ts";
import { setShuttingDown, shouldEmitPtySessionExit } from "./pty.ts";

describe("R15 production governed-review seams", () => {
  test("critic policy is exact and least privilege", () => {
    const tools = ontologyToolsForRole("critic", [
      { name: "qf_hypothesis_get" }, { name: "qf_run_get" }, { name: "qf_artifact_get" },
      { name: "qf_record_evaluation" }, { name: "qf_publish_artifact" }, { name: "qf_create_task" },
    ]);
    expect(tools.map((tool) => tool.name)).toEqual([
      "qf_hypothesis_get", "qf_run_get", "qf_artifact_get", "qf_record_evaluation",
    ]);
  });

  test("request review crosses preload and Main IPC, and block literals are order-owned", () => {
    const preload = readFileSync(new URL("../preload/shell.ts", import.meta.url), "utf8");
    const main = readFileSync(new URL("./ipc-kernel.ts", import.meta.url), "utf8");
    const gateway = readFileSync(new URL("./ontology-gateway.ts", import.meta.url), "utf8");
    const renderer = readFileSync(new URL("../windows/shell/src/renderer.js", import.meta.url), "utf8");
    expect(preload).toContain('ipcRenderer.invoke("qf:review:request"');
    expect(main).toContain('ipcMain.handle("qf:review:request"');
    expect(main).toContain("kernelFreezeSourceWork");
    expect(main).toContain("admitAndStartSession(\"hermes-critic\")");
    expect(gateway).toContain("kernelRecordGovernedToolReceipt");
    expect(renderer).toContain("window.shellApi.qf.requestReview");
    expect(gateway).toContain("qf_record_evaluation");
  });

  test("sidecar shutdown exit preserves the durable Task/session/link snapshot", () => {
    const before = {
      task: { id: "task-1", status: "cancelled" },
      session: { id: "session-1", status: "running" },
      links: [{ kind: "assigned_to", from_id: "task-1", to_id: "session-1" }],
    };
    const after = structuredClone(before);
    const applyPtyExit = () => {
      if (shouldEmitPtySessionExit()) after.session.status = "closed";
    };

    setShuttingDown(true);
    try {
      applyPtyExit();
      expect(after).toEqual(before);

      setShuttingDown(false);
      applyPtyExit();
      expect(after.session.status).toBe("closed");
    } finally {
      setShuttingDown(false);
    }
  });
});
