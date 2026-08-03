import { describe, expect, test } from "bun:test";
import { resolveTerminalTarget, resolveWslNativeTuiLaunch } from "./terminal-target";

describe("WSL terminal targets", () => {
  test("resolves an injected default distro without consulting the host Hermes path", () => {
    const result = resolveWslNativeTuiLaunch({
      platform: "win32",
      homeDir: "C:\\Users\\tester",
      terminalTarget: "wsl:auto",
      cwdHostPath: "C:\\Users\\tester\\workspace",
      guestCommand: "hermes",
      argv: ["--tui"],
      getDefaultWslDistro: () => "Ubuntu",
      resolvePowerShellCommand: () => "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
      resolveWslCommand: () => "C:\\Windows\\System32\\wsl.exe",
    });

    expect(result.target).toBe("wsl:Ubuntu");
    expect(result.command).toBe("C:\\Windows\\System32\\wsl.exe");
    expect(result.args).toEqual([
      "-d",
      "Ubuntu",
      "--cd",
      "/mnt/c/Users/tester/workspace",
      "--exec",
      "/bin/bash",
      "-lc",
      'exec "$0" "$@"',
      "hermes",
      "--tui",
    ]);
    expect(result.cwdGuestPath).toBe("/mnt/c/Users/tester/workspace");
  });

  test("fails honestly when wsl:auto has no installed distro", () => {
    expect(() => resolveTerminalTarget("wsl:auto", "C:\\Users\\tester", {
      platform: "win32",
      homeDir: "C:\\Users\\tester",
      getDefaultWslDistro: () => null,
      resolvePowerShellCommand: () => "powershell.exe",
    })).toThrow("WSL terminal target requires an installed distro");
  });
});
