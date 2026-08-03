import { describe, expect, test } from "bun:test";
import {
  classifyWslNativeTuiPrerequisites,
  resolveTerminalTarget,
  resolveWslNativeTuiLaunch,
  WSL_GUEST_PROBE_TIMEOUT_MS,
} from "./terminal-target";

test("WSL guest probe allows a bounded cold-start window", () => {
  expect(WSL_GUEST_PROBE_TIMEOUT_MS).toBe(15_000);
});

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

  test("classifies an explicitly selected but missing distro", () => {
    expect(classifyWslNativeTuiPrerequisites({
      platform: "win32",
      homeDir: "C:\\Users\\tester",
      terminalTarget: "wsl:Ubuntu",
      cwdHostPath: "C:\\Users\\tester",
      getDefaultWslDistro: () => "Ubuntu",
      getWslDistroVersion: () => null,
      resolveWslCommand: () => "wsl.exe",
    })).toEqual({
      code: "distro-unavailable",
      message:
        'Hermes unavailable: selected WSL distro "Ubuntu" is not installed. ' +
        "Install it or select an installed WSL2 distro, then retry.",
    });
  });

  test("classifies WSL1 before Hermes launch", () => {
    expect(classifyWslNativeTuiPrerequisites({
      platform: "win32",
      homeDir: "C:\\Users\\tester",
      terminalTarget: "wsl:Ubuntu",
      cwdHostPath: "C:\\Users\\tester",
      getDefaultWslDistro: () => "Ubuntu",
      getWslDistroVersion: () => 1,
      resolveWslCommand: () => "wsl.exe",
    })?.code).toBe("wsl1-distro");
  });

  test("classifies missing Hermes inside the selected WSL2 distro", () => {
    expect(classifyWslNativeTuiPrerequisites({
      platform: "win32",
      homeDir: "C:\\Users\\tester",
      terminalTarget: "wsl:Ubuntu",
      cwdHostPath: "C:\\Users\\tester",
      getDefaultWslDistro: () => "Ubuntu",
      getWslDistroVersion: () => 2,
      resolveWslCommand: () => "wsl.exe",
      guestCommand: "hermes",
      probeGuestCommand: () => {
        throw new Error("command not found");
      },
    })?.code).toBe("hermes-unavailable");
  });

  test("keeps missing wsl.exe distinct when Hermes is the guest command", () => {
    expect(classifyWslNativeTuiPrerequisites({
      platform: "win32",
      homeDir: "C:\\Users\\tester",
      terminalTarget: "wsl:Ubuntu",
      cwdHostPath: "C:\\Users\\tester",
      getDefaultWslDistro: () => "Ubuntu",
      getWslDistroVersion: () => 2,
      guestCommand: "hermes",
      resolveWslCommand: () => {
        throw new Error("wsl.exe not found");
      },
      probeGuestCommand: () => {
        throw new Error("must not probe guest");
      },
    })?.code).toBe("wsl-unavailable");
  });
});
