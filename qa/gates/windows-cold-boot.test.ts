import { describe, expect, test } from "bun:test";
import {
  collectOwnedPids,
  ownedProcessRows,
  processOwnershipReceipt,
  type ProcessInfo,
} from "./windows-cold-boot.ts";

function process(
  pid: number,
  parentPid: number,
  name: string,
  executablePath = "C:\\Windows\\System32\\" + name,
  commandLine = name,
): ProcessInfo {
  return { pid, parentPid, name, executablePath, commandLine };
}

describe("windows-cold-boot process ownership", () => {
  test("claims only new descendants of the recorded launch root", () => {
    const packageRoot = "C:\\tmp\\qf-package";
    const before = [
      process(110, 1, "brave.exe"),
      process(111, 110, "claude.exe"),
      process(112, 110, "extension-host.exe"),
      process(113, 110, "conhost.exe"),
    ];
    const after = [
      ...before,
      process(200, 1, "QuantFlow.exe", `${packageRoot}\\QuantFlow.exe`),
      process(201, 200, "cmd.exe", "C:\\Windows\\System32\\cmd.exe"),
      // A new ambient process can share the package path without being part
      // of the launch tree; path/name matching must never claim it.
      process(202, 110, "brave.exe", `${packageRoot}\\brave.exe`),
    ];

    expect([...collectOwnedPids(before, after, 200, packageRoot)].sort((a, b) => a - b))
      .toEqual([200, 201]);
  });

  test("records a surviving gate-owned child for a deliberate red cleanup", () => {
    const before = [process(300, 1, "cmd.exe")];
    const after = [
      ...before,
      process(400, 1, "bun.exe", "C:\\Program Files\\Bun\\bun.exe"),
      process(401, 400, "qf-ownership-falsifier.exe"),
    ];

    const receipt = processOwnershipReceipt(before, after, 400);
    expect(receipt.rootPid).toBe(400);
    expect(receipt.pids).toEqual([400, 401]);
    expect(receipt.rows.find((row) => row.pid === 401)?.parentPid).toBe(400);
  });

  test("reports every live owned PID with its exact process identity", () => {
    const live = ownedProcessRows([
      process(500, 1, "bun.exe"),
      process(501, 500, "electron.exe"),
      process(600, 1, "unrelated.exe"),
    ], new Set([500, 501]));
    expect(live.map((row) => [row.pid, row.name])).toEqual([
      [500, "bun.exe"],
      [501, "electron.exe"],
    ]);
  });
});
