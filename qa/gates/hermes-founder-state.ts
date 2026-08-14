/**
 * R0 deliverable 10 — founder Hermes state is untouched by a seat launch.
 *
 * Photographs SHA-256 digests of ~/.hermes/config.yaml and ~/.hermes/auth.json
 * (WSL) before and after exercising qf-hermes-launch.sh. Digests only — this
 * gate never reads, prints, copies, or logs file contents.
 *
 * Falsification uses a scratch HOME under a temp directory, never the
 * founder's real ~/.hermes.
 *
 * CI reach (WO-g7): deliberately excluded from `bun qa/verify-release.ts` and
 * from CI. Requires a real WSL distro and fails closed without one; GitHub's
 * windows-latest runner ships none. Adding it turns the canonical door
 * permanently red (attempted 2026-08-04, reverted in 86eac5f). Run on a
 * founder machine: `bun qa/run.ts hermes-founder-state`.
 */
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
  appendFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const REPO_ROOT = join(import.meta.dir, "../..");
const WRAPPER = resolve(REPO_ROOT, "collab-electron/cli/qf-hermes-launch.sh");
const DISTRO = process.env.QF_WSL_DISTRO?.trim() || "Ubuntu";

type HermesDigests = {
  config: string | null;
  auth: string | null;
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function wslPath(path: string): string {
  return path
    .replace(/^([A-Za-z]):[\\/]/, (_, drive: string) => `/mnt/${drive.toLowerCase()}/`)
    .replaceAll("\\", "/");
}

function runWsl(args: string[]): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync("wsl.exe", ["-d", DISTRO, "--", ...args], {
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 4 * 1024 * 1024,
  });
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

/** Hash one path inside WSL. Returns null when the path is absent. Never logs bytes. */
function sha256Wsl(guestPath: string): string | null {
  const probe = runWsl(["test", "-f", guestPath]);
  if (probe.status !== 0) return null;
  const hashed = runWsl(["sha256sum", guestPath]);
  assert(hashed.status === 0, `sha256sum failed for ${guestPath}: ${hashed.stderr.trim()}`);
  const digest = hashed.stdout.trim().split(/\s+/)[0];
  assert(
    typeof digest === "string" && /^[0-9a-f]{64}$/i.test(digest),
    `sha256sum returned a non-digest for ${guestPath}`,
  );
  return digest.toLowerCase();
}

function photograph(homeGuest: string): HermesDigests {
  return {
    config: sha256Wsl(`${homeGuest}/.hermes/config.yaml`),
    auth: sha256Wsl(`${homeGuest}/.hermes/auth.json`),
  };
}

function digestsEqual(before: HermesDigests, after: HermesDigests): boolean {
  return before.config === after.config && before.auth === after.auth;
}

function formatDigests(label: string, digests: HermesDigests): string {
  return (
    `${label} config=${digests.config ?? "absent"} auth=${digests.auth ?? "absent"}`
  );
}

function makeNoopHermesCommand(root: string): string {
  const commandWin = join(root, "qf-founder-state-hermes.sh");
  writeFileSync(
    commandWin,
    "#!/bin/sh\nwhile [ \"$#\" -gt 0 ]; do\n  if [ \"$1\" = \"--toolsets\" ]; then shift; [ \"$#\" -gt 0 ] && shift; else shift; fi\ndone\nexit 0\n",
    "utf8",
  );
  const commandGuest = wslPath(commandWin);
  const chmod = runWsl(["chmod", "+x", commandGuest]);
  assert(chmod.status === 0, `could not make founder-state Hermes command executable: ${chmod.stderr.trim()}`);
  return commandGuest;
}

function launchSeat(homeGuest: string, profileRootGuest: string, seatId: string, commandGuest: string): void {
  assert(existsSync(WRAPPER), `launch wrapper missing: ${WRAPPER}`);
  const result = runWsl([
    "env",
    `HOME=${homeGuest}`,
    `QF_AGENT_SESSION_ID=${seatId}`,
    `QF_QUANTFLOW_HERMES_PROFILE_ROOT=${profileRootGuest}`,
    `QF_LAUNCH_READY_NONCE=founder-state-${seatId.replace(/[^a-zA-Z0-9_-]/g, "-")}`,
    "bash",
    wslPath(WRAPPER),
    "/tmp/qf-bridge-hermes-founder-state.mjs",
    "/tmp/qf-ontology-hermes-founder-state.mjs",
    commandGuest,
  ]);
  assert(
    result.status === 0,
    `seat launch wrapper failed (status=${result.status}): ${result.stderr.trim() || result.stdout.trim()}`,
  );
}

function prepareScratchHome(root: string): { homeWin: string; homeGuest: string } {
  const homeWin = join(root, "home");
  const hermes = join(homeWin, ".hermes");
  mkdirSync(hermes, { recursive: true });
  // Opaque fixtures — gate never logs these strings after write.
  writeFileSync(join(hermes, "config.yaml"), "model:\n  name: scratch-only\n");
  writeFileSync(join(hermes, "auth.json"), "{\"scratch\":true}\n");
  return { homeWin, homeGuest: wslPath(homeWin) };
}

function realWslHome(): string {
  const result = runWsl(["printenv", "HOME"]);
  assert(result.status === 0, `could not resolve WSL HOME: ${result.stderr.trim()}`);
  const home = result.stdout.trim();
  assert(home.startsWith("/"), `WSL HOME is not an absolute path`);
  return home;
}

/**
 * BAIT: photograph scratch, mutate scratch config on disk, photograph again.
 * The compare must go red. Never touches the founder's real ~/.hermes.
 */
function falsifyScratchMutation(): void {
  const root = mkdtempSync(join(tmpdir(), "qf-hermes-founder-state-bait-"));
  try {
    const { homeGuest } = prepareScratchHome(root);
    const before = photograph(homeGuest);
    assert(before.config && before.auth, "scratch hermes fixtures missing before bait");
    // Touch only the scratch copy.
    appendFileSync(join(root, "home", ".hermes", "config.yaml"), "# bait\n");
    const after = photograph(homeGuest);
    assert(!digestsEqual(before, after), "bait failed to change scratch digests");
    console.log("hermes-founder-state: FALSIFY RED scratch digest changed");
    console.log(`hermes-founder-state: ${formatDigests("bait-before", before)}`);
    console.log(`hermes-founder-state: ${formatDigests("bait-after", after)}`);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

/** Green on scratch: launch must leave scratch founder files byte-identical. */
function proveScratchLaunchUntouched(): void {
  const root = mkdtempSync(join(tmpdir(), "qf-hermes-founder-state-scratch-"));
  try {
    const { homeGuest } = prepareScratchHome(root);
    const commandGuest = makeNoopHermesCommand(root);
    const profileRoot = wslPath(join(root, "isolated-profile"));
    const before = photograph(homeGuest);
    assert(before.config && before.auth, "scratch hermes fixtures missing");
    launchSeat(homeGuest, profileRoot, "seat/founder-state-scratch", commandGuest);
    const after = photograph(homeGuest);
    assert(
      digestsEqual(before, after),
      `scratch launch mutated hermes digests (${formatDigests("before", before)} vs ${formatDigests("after", after)})`,
    );
    console.log("hermes-founder-state: FALSIFY GREEN scratch launch left digests unchanged");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

/** Green on real founder ~/.hermes: digests must match before vs after launch. */
function proveRealFounderUntouched(): void {
  const homeGuest = realWslHome();
  const before = photograph(homeGuest);
  assert(
    before.config !== null && before.auth !== null,
    "founder ~/.hermes/config.yaml and auth.json must both exist for this gate",
  );
  const root = mkdtempSync(join(tmpdir(), "qf-hermes-founder-state-real-"));
  try {
    const commandGuest = makeNoopHermesCommand(root);
    const profileRoot = wslPath(join(root, "isolated-profile"));
    launchSeat(homeGuest, profileRoot, "seat/founder-state-real", commandGuest);
    const after = photograph(homeGuest);
    assert(
      digestsEqual(before, after),
      `founder Hermes digests changed (${formatDigests("before", before)} vs ${formatDigests("after", after)})`,
    );
    console.log("hermes-founder-state: PASS real founder digests unchanged");
    console.log(`hermes-founder-state: ${formatDigests("founder", before)}`);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

export async function runHermesFounderStateGate(): Promise<{ ok: boolean }> {
  if (process.platform !== "win32") {
    console.error("hermes-founder-state: FAIL (native Windows + WSL is required)");
    return { ok: false };
  }
  const wslProbe = spawnSync("wsl.exe", ["-d", DISTRO, "--", "true"], {
    encoding: "utf8",
    windowsHide: true,
  });
  if (wslProbe.status !== 0) {
    console.error(
      `hermes-founder-state: FAIL (WSL distro "${DISTRO}" unavailable: ${(wslProbe.stderr ?? "").trim()})`,
    );
    return { ok: false };
  }

  try {
    falsifyScratchMutation();
    proveScratchLaunchUntouched();
    proveRealFounderUntouched();
    console.log("hermes-founder-state: PASS");
    return { ok: true };
  } catch (error) {
    console.error(
      `hermes-founder-state: FAIL ${error instanceof Error ? error.message : String(error)}`,
    );
    return { ok: false };
  }
}

if (import.meta.main) {
  const { ok } = await runHermesFounderStateGate();
  process.exit(ok ? 0 : 1);
}
