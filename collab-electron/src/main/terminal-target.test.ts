import { describe, expect, test } from "bun:test";
import {
  classifyWslNativeTuiPrerequisites,
  resolveTerminalTarget,
  resolveWslNativeTuiLaunch,
} from "./terminal-target";

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

  test("classifies missing WSL distro without probing Hermes or credentials", () => {
    expect(classifyWslNativeTuiPrerequisites({
      platform: "win32",
      homeDir: "C:\\Users\\tester",
      terminalTarget: "wsl:auto",
      cwdHostPath: "C:\\Users\\tester",
      getDefaultWslDistro: () => null,
      resolveWslCommand: () => "wsl.exe",
    })).toEqual({
      code: "distro-unavailable",
      message:
        "Hermes unavailable: no WSL2/Ubuntu distro is installed or available. " +
        "Install Ubuntu in WSL2, make it the default distro, and retry.",
    });
  });

  test("classifies missing wsl.exe separately from a missing distro", () => {
    expect(classifyWslNativeTuiPrerequisites({
      platform: "win32",
      homeDir: "C:\\Users\\tester",
      terminalTarget: "wsl:Ubuntu",
      cwdHostPath: "C:\\Users\\tester",
      getDefaultWslDistro: () => "Ubuntu",
      resolveWslCommand: () => {
        throw new Error('host-acp: no executable found among ["wsl.exe"]');
      },
    })?.code).toBe("wsl-unavailable");
  });
});
