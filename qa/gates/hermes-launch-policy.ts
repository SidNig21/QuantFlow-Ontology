/** R13 launcher policy: every Hermes seat receives exactly the app-owned toolsets. */
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const REPO_ROOT = resolve(import.meta.dir, "../..");
const LAUNCHER = join(REPO_ROOT, "collab-electron/cli/qf-hermes-launch.sh");
const TOOLSETS = "mcp-quantflow-collaboration,mcp-quantflow-ontology";

type Branch = {
  name: string;
  marker: string | null;
  role?: "critic";
};

const BRANCHES: readonly Branch[] = [
  { name: "mission", marker: "--quantflow-mission-oneshot" },
  { name: "critic-task", marker: "--quantflow-task-oneshot", role: "critic" },
  { name: "worker-task", marker: "--quantflow-task-oneshot" },
  { name: "fallback", marker: null },
];

function guestPath(path: string): string {
  if (process.platform !== "win32") return path;
  const match = /^([A-Za-z]):[\\/](.*)$/.exec(path);
  if (!match) throw new Error(`cannot map Windows path into WSL: ${path}`);
  return `/mnt/${match[1]!.toLowerCase()}/${match[2]!.replaceAll("\\", "/")}`;
}

function runGuest(args: readonly string[], env: NodeJS.ProcessEnv) {
  const command = process.platform === "win32" ? "wsl.exe" : "bash";
  const forwardedKeys = [
    "HOME",
    "QF_QUANTFLOW_HERMES_PROFILE_ROOT",
    "QF_AGENT_SESSION_ID",
    "QF_LAUNCH_READY_NONCE",
    "QF_CAPTURE_FILE",
    "QF_PEER_ROLE",
  ];
  const forwarded = process.platform === "win32"
    ? forwardedKeys.flatMap((key) => env[key] ? [`${key}=${env[key]}`] : [])
    : [];
  const commandArgs = process.platform === "win32"
    ? ["-e", "env", ...forwarded, "bash", ...args]
    : [...args];
  return spawnSync(command, commandArgs, {
    env,
    encoding: "utf8",
    windowsHide: true,
  });
}

function readGuestFile(path: string): string {
  if (process.platform !== "win32") return readFileSync(path, "utf8");
  const result = spawnSync("wsl.exe", ["bash", "-lc", `cat -- ${JSON.stringify(path)}`], {
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== 0) throw new Error(`cannot read launcher capture: ${result.stderr || result.stdout}`);
  return result.stdout;
}

function assertArgv(branch: string, argv: string[]): void {
  const toolsetIndexes = argv.flatMap((value, index) => value === "--toolsets" ? [index] : []);
  const tuiCount = argv.filter((value) => value === "--tui").length;
  if (toolsetIndexes.length !== 1 || argv[toolsetIndexes[0]! + 1] !== TOOLSETS) {
    throw new Error(`${branch}: expected one --toolsets ${TOOLSETS}, argv=${JSON.stringify(argv)}`);
  }
  if (tuiCount !== 1) {
    throw new Error(`${branch}: expected one metadata-supplied --tui, argv=${JSON.stringify(argv)}`);
  }
}

export function runHermesLaunchPolicyGate(): { ok: boolean } {
  if (!existsSync(LAUNCHER)) {
    console.error(`hermes-launch-policy: launcher missing: ${LAUNCHER}`);
    return { ok: false };
  }

  const windowsRoot = process.platform === "win32"
    ? mkdtempSync(join(tmpdir(), "qf-hermes-launch-policy-"))
    : null;
  const guestRoot = windowsRoot
    ? `/tmp/qf-hermes-launch-policy-${process.pid}-${Date.now()}`
    : mkdtempSync(join(tmpdir(), "qf-hermes-launch-policy-"));

  try {
    const guestLauncher = guestPath(LAUNCHER);
    const guestRootForShell = guestRoot;
    const init = process.platform === "win32"
      ? runGuest(["-lc", `mkdir -p ${JSON.stringify(guestRootForShell)} && printf '%s\\n' '#!/bin/sh' 'printf "%s\\n" "$@" > "$QF_CAPTURE_FILE"' > ${JSON.stringify(`${guestRootForShell}/fake-hermes`)} && chmod +x ${JSON.stringify(`${guestRootForShell}/fake-hermes`)}`], {})
      : (() => {
          mkdirForLinux(guestRootForShell);
          const fake = `${guestRootForShell}/fake-hermes`;
          writeFileSync(fake, "#!/bin/sh\nprintf '%s\\n' \"$@\" > \"$QF_CAPTURE_FILE\"\n", "utf8");
          chmodSync(fake, 0o755);
          return { status: 0, stdout: "", stderr: "" };
        })();
    if (init.status !== 0) throw new Error(`cannot create fake Hermes: ${init.stderr || init.stdout}`);

    for (const branch of BRANCHES) {
      const capture = `${guestRootForShell}/${branch.name}.argv`;
      const env: NodeJS.ProcessEnv = {
        ...process.env,
        HOME: guestRootForShell,
        QF_QUANTFLOW_HERMES_PROFILE_ROOT: `${guestRootForShell}/profiles`,
        QF_AGENT_SESSION_ID: `policy-${branch.name}`,
        QF_LAUNCH_READY_NONCE: `nonce-${branch.name}`,
        QF_CAPTURE_FILE: capture,
      };
      delete env.QF_PEER_ROLE;
      if (branch.role) env.QF_PEER_ROLE = branch.role;
      const args = [
        guestLauncher,
        `${guestRootForShell}/bridge.mjs`,
        `${guestRootForShell}/ontology.mjs`,
        `${guestRootForShell}/fake-hermes`,
        ...(branch.marker ? [branch.marker] : []),
        "--tui",
      ];
      const result = runGuest(args, env);
      if (result.status !== 0) {
        throw new Error(`${branch.name}: launcher exited ${result.status}: ${result.stderr || result.stdout}`);
      }
      const argv = readGuestFile(capture).split(/\r?\n/).filter(Boolean);
      assertArgv(branch.name, argv);
      console.log(`hermes-launch-policy: ${branch.name} argv=${JSON.stringify(argv)}`);
    }
    console.log("hermes-launch-policy: PASS");
    return { ok: true };
  } catch (error) {
    console.error(`hermes-launch-policy: ${error instanceof Error ? error.message : String(error)}`);
    return { ok: false };
  } finally {
    if (windowsRoot) {
      rmSync(windowsRoot, { recursive: true, force: true });
      spawnSync("wsl.exe", ["rm", "-rf", guestRoot], { windowsHide: true });
    } else {
      rmSync(guestRoot, { recursive: true, force: true });
    }
  }
}

function mkdirForLinux(path: string): void {
  // This path is a fresh, gate-owned temp directory and is removed in finally.
  const result = spawnSync("mkdir", ["-p", path], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`mkdir failed: ${result.stderr || result.stdout}`);
}

if (import.meta.main) {
  process.exit(runHermesLaunchPolicyGate().ok ? 0 : 1);
}
