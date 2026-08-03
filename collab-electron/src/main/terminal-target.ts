import { execFileSync } from "node:child_process";
import * as os from "node:os";
import { displayBasename, hostPathToGuestPath, parseWslUncPath } from "@collab/shared/path-utils";
import { type TerminalTarget } from "./config";

export interface TerminalTargetOption {
  id: TerminalTarget;
  label: string;
  isDefault?: boolean;
}

export interface ResolvedTerminalTarget {
  target: TerminalTarget;
  command: string;
  args: string[];
  displayName: string;
  cwd: string;
  cwdHostPath: string;
  cwdGuestPath?: string;
}

export type WslNativeTuiLaunch = {
  command: string;
  args: string[];
  target: `wsl:${string}`;
  cwd: string;
  cwdHostPath: string;
  cwdGuestPath?: string;
};

export type WslPrerequisiteDiagnostic = {
  code:
    | "windows-required"
    | "wsl-unavailable"
    | "distro-unavailable"
    | "wsl1-distro"
    | "hermes-unavailable";
  message: string;
};

/** Resolve a package-owned guest command through the existing Windows WSL PTY target. */
export function resolveWslNativeTuiLaunch(options: {
  terminalTarget: TerminalTarget;
  cwdHostPath: string;
  guestCommand: string;
  argv: string[];
  resolveWslCommand: (command: string) => string;
} & TerminalTargetResolutionDependencies): WslNativeTuiLaunch {
  const platform = options.platform ?? process.platform;
  if (platform !== "win32") {
    throw new Error("WSL native-TUI launch requires Windows");
  }
  if (!options.terminalTarget.startsWith("wsl:")) {
    throw new Error("WSL native-TUI launch requires terminal_target=wsl:<distro>");
  }
  const target = resolveTerminalTarget(
    options.terminalTarget,
    options.cwdHostPath,
    options,
  );
  if (!target.target.startsWith("wsl:")) {
    throw new Error("WSL native-TUI target did not resolve to WSL");
  }
  return {
    command: options.resolveWslCommand(target.command),
    // A direct `wsl.exe ... hermes` launch does not load the distro user's
    // login PATH, so user-installed CLIs such as ~/.local/bin/hermes vanish.
    // Pass argv positionally through a login shell; never interpolate it into
    // shell source.
    args: [
      ...target.args,
      "--exec",
      "/bin/bash",
      "-lc",
      'exec "$0" "$@"',
      options.guestCommand,
      ...options.argv,
    ],
    target: target.target,
    cwd: target.cwd,
    cwdHostPath: target.cwdHostPath,
    cwdGuestPath: target.cwdGuestPath,
  };
}

function withGuestPath(
  base: Omit<ResolvedTerminalTarget, "cwdGuestPath">,
  cwdGuestPath: string | null,
): ResolvedTerminalTarget {
  return cwdGuestPath
    ? { ...base, cwdGuestPath }
    : base;
}

interface WslDistro {
  name: string;
  isDefault: boolean;
  version: number | null;
}

export type TerminalTargetResolutionDependencies = {
  platform?: NodeJS.Platform;
  homeDir?: string;
  getDefaultWslDistro?: () => string | null;
  resolvePowerShellCommand?: () => string;
};

type WslGuestCommandProbe = (
  target: ResolvedTerminalTarget,
  guestCommand: string,
) => void;

// A stopped WSL2 distro can take longer than five seconds to cold-start even
// when the requested CLI is installed. Keep this bounded, but leave enough
// room for the first Dock readiness probe to report the real state.
export const WSL_GUEST_PROBE_TIMEOUT_MS = 15_000;

function probeWslGuestCommand(
  target: ResolvedTerminalTarget,
  guestCommand: string,
): void {
  execFileSync(
    target.command,
    [
      ...target.args,
      "--exec",
      "/bin/bash",
      "-lc",
      'command -v "$0" >/dev/null',
      guestCommand,
    ],
    {
      encoding: "utf8",
      stdio: "ignore",
      timeout: WSL_GUEST_PROBE_TIMEOUT_MS,
      windowsHide: true,
    },
  );
}

function getWslDistroVersion(distro: string): number | null {
  const entry = listWslDistributions().find((candidate) => candidate.name === distro);
  return entry?.version ?? null;
}

/**
 * Read-only pre-spawn classification for the Hermes WSL adapter. It checks
 * only Windows/WSL/distro availability; Hermes authentication is deliberately
 * left to the adapter launch so credentials are never inspected by QuantFlow.
 */
export function classifyWslNativeTuiPrerequisites(options: {
  platform?: NodeJS.Platform;
  homeDir: string;
  terminalTarget: TerminalTarget;
  cwdHostPath: string;
  getDefaultWslDistro?: () => string | null;
  resolveWslCommand?: (command: string) => string;
  getWslDistroVersion?: (distro: string) => number | null;
  guestCommand?: string;
  probeGuestCommand?: WslGuestCommandProbe;
}): WslPrerequisiteDiagnostic | null {
  const platform = options.platform ?? process.platform;
  if (platform !== "win32") {
    return {
      code: "windows-required",
      message: "Hermes unavailable: native Windows with WSL2 is required for this seat.",
    };
  }
  let probeStage: "wsl" | "distro" | "guest" = "wsl";
  try {
    const target = resolveTerminalTarget(options.terminalTarget, options.cwdHostPath, {
      platform,
      homeDir: options.homeDir,
      getDefaultWslDistro: options.getDefaultWslDistro,
    });
    if (!target.target.startsWith("wsl:")) return null;
    const resolvedCommand = options.resolveWslCommand
      ? options.resolveWslCommand(target.command)
      : target.command;
    const resolvedTarget = { ...target, command: resolvedCommand };
    probeStage = "distro";
    const distro = target.target.slice("wsl:".length);
    const version = (options.getWslDistroVersion ?? getWslDistroVersion)(distro);
    if (version === null) {
      return {
        code: "distro-unavailable",
        message:
          `Hermes unavailable: selected WSL distro "${distro}" is not installed. ` +
          "Install it or select an installed WSL2 distro, then retry.",
      };
    }
    if (version !== 2) {
      return {
        code: "wsl1-distro",
        message:
          `Hermes unavailable: selected distro "${distro}" is WSL1. ` +
          "Convert it to WSL2 and retry.",
      };
    }
    probeStage = "guest";
    (options.probeGuestCommand ?? probeWslGuestCommand)(
      resolvedTarget,
      options.guestCommand ?? "hermes",
    );
    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("installed distro")) {
      return {
        code: "distro-unavailable",
        message:
          "Hermes unavailable: no WSL2/Ubuntu distro is installed or available. " +
          "Install Ubuntu in WSL2, make it the default distro, and retry.",
      };
    }
    if (probeStage === "guest") {
      return {
        code: "hermes-unavailable",
        message:
          `Hermes unavailable: "${options.guestCommand ?? "hermes"}" is not installed ` +
          "in the selected WSL2 distro. Install Hermes in Ubuntu/WSL2, then retry.",
      };
    }
    return {
      code: "wsl-unavailable",
      message:
        "Hermes unavailable: WSL2 is not available on this Windows install. " +
        "Enable WSL2 and install Ubuntu, then retry.",
    };
  }
}

function commandExists(command: string): boolean {
  try {
    execFileSync(
      process.platform === "win32" ? "where.exe" : "which",
      [command],
      {
        encoding: "utf8",
        stdio: "ignore",
        timeout: 5000,
        windowsHide: true,
      },
    );
    return true;
  } catch {
    return false;
  }
}

function listWslDistributions(): WslDistro[] {
  if (process.platform !== "win32") return [];
  try {
    const output = execFileSync("wsl.exe", ["-l", "-v"], {
      encoding: "utf8",
      timeout: 5000,
      windowsHide: true,
    });
    return output
      .split(/\r?\n/)
      .map((line) => line.replace(/\u0000/g, "").trimEnd())
      .filter((line) => line && !/^windows subsystem/i.test(line))
      .filter((line) => !/^name\s+state\s+version$/i.test(line.trim()))
      .map((line) => {
        const isDefault = line.trimStart().startsWith("*");
        const clean = line.replace(/^\*\s*/, "").trim();
        const columns = clean.split(/\s{2,}/);
        const name = columns[0];
        const version = Number(columns.at(-1));
        return name
          ? { name, isDefault, version: Number.isInteger(version) ? version : null }
          : null;
      })
      .filter((value): value is WslDistro => value !== null);
  } catch {
    return [];
  }
}

export function getDefaultWslDistro(): string | null {
  const distros = listWslDistributions();
  return distros.find((d) => d.isDefault)?.name
    ?? distros[0]?.name
    ?? null;
}

export function listTerminalTargets(): TerminalTargetOption[] {
  if (process.platform !== "win32") {
    return [
      { id: "auto", label: "Automatic", isDefault: true },
      { id: "shell", label: "Login shell" },
    ];
  }

  const options: TerminalTargetOption[] = [
    { id: "auto", label: "Automatic", isDefault: true },
    { id: "powershell", label: "PowerShell" },
  ];
  for (const distro of listWslDistributions()) {
    options.push({
      id: `wsl:${distro.name}`,
      label: distro.isDefault
        ? `${distro.name} (WSL default)`
        : distro.name,
    });
  }
  return options;
}

function resolveWindowsAutoTarget(
  preferred: TerminalTarget,
  cwdHostPath: string,
  getDefaultDistro: () => string | null,
): TerminalTarget {
  const unc = parseWslUncPath(cwdHostPath);
  if (unc) {
    return `wsl:${unc.distro}`;
  }
  if (preferred !== "auto") {
    return preferred;
  }
  const defaultDistro = getDefaultDistro();
  return defaultDistro ? `wsl:${defaultDistro}` : "powershell";
}

function resolveShellPath(): string {
  if (process.platform === "darwin") {
    return process.env.SHELL || "/bin/zsh";
  }
  return process.env.SHELL || "/bin/bash";
}

function resolvePowerShellCommand(): string {
  return commandExists("pwsh.exe") ? "pwsh.exe" : "powershell.exe";
}

export function resolveTerminalTarget(
  preferredTarget: TerminalTarget,
  cwdHostPath?: string,
  dependencies: TerminalTargetResolutionDependencies = {},
): ResolvedTerminalTarget {
  const platform = dependencies.platform ?? process.platform;
  const homeDir = dependencies.homeDir ?? os.homedir();
  const initialCwd = cwdHostPath || homeDir;
  const getDefaultDistro = dependencies.getDefaultWslDistro ?? getDefaultWslDistro;
  const powerShellCommand = dependencies.resolvePowerShellCommand ?? resolvePowerShellCommand;

  if (platform === "win32") {
    const target = resolveWindowsAutoTarget(
      preferredTarget,
      initialCwd,
      getDefaultDistro,
    );

    if (target === "powershell") {
      const command = powerShellCommand();
      return {
        target,
        command,
        args: [],
        displayName: "PowerShell",
        cwd: initialCwd,
        cwdHostPath: initialCwd,
      };
    }

    if (target.startsWith("wsl:")) {
      const requestedDistro = target.slice(4);
      const distro = requestedDistro === "auto"
        ? getDefaultDistro()
        : requestedDistro;
      if (!distro) {
        throw new Error("WSL terminal target requires an installed distro");
      }
      const resolvedTarget = `wsl:${distro}` as const;
      const guestPath = hostPathToGuestPath(initialCwd, resolvedTarget);
      const args = ["-d", distro];
      if (guestPath) {
        args.push("--cd", guestPath);
      }
      return withGuestPath({
        target: resolvedTarget,
        command: "wsl.exe",
        args,
        displayName: distro || "WSL",
        cwd: homeDir,
        cwdHostPath: initialCwd,
      }, guestPath);
    }

    const command = powerShellCommand();
    return {
      target: "powershell",
      command,
      args: [],
      displayName: "PowerShell",
      cwd: initialCwd,
      cwdHostPath: initialCwd,
    };
  }

  const shellPath = resolveShellPath();
  return {
    target: "shell",
    command: shellPath,
    args: [],
    displayName: displayBasename(shellPath) || "shell",
    cwd: initialCwd,
    cwdHostPath: initialCwd,
  };
}
