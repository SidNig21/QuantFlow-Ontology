/**
 * Native-Windows release-floor tests.
 *
 * Keep this list shell-free: the Windows door must not depend on Bash, tmux,
 * WSL, or a Linux-only test harness. The packaged logger policy and package
 * receipt tests are deliberately part of this focused set.
 */
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dir, "..");

export const WINDOWS_FOCUSED_TESTS = [
  "collab-electron/src/main/logger-policy.test.ts",
  "collab-electron/src/main/app-root.test.ts",
  "collab-electron/src/main/cwd-fallback.test.ts",
  "collab-electron/src/main/dock-profiles.test.ts",
  "collab-electron/src/main/native-tui-orchestration.test.ts",
  "collab-electron/src/main/peer-role-registry.test.ts",
  "collab-electron/src/main/runtime-adapter.test.ts",
  "collab-electron/scripts/package-lib/extra-resources.test.ts",
  "collab-electron/scripts/package-lib/package-cleanup.test.ts",
  "collab-electron/scripts/package-lib/package-receipt.test.ts",
  "collab-electron/scripts/package-lib/shared-paths.test.ts",
  "collab-electron/scripts/package-lib/unit-wiring.test.ts",
  "qa/verify-release.test.ts",
] as const;

export const WINDOWS_NODE_TESTS = [
  "src/main/sidecar/client.test.ts",
  "src/main/sidecar/server.test.ts",
] as const;

if (import.meta.main) {
  if (process.platform !== "win32") {
    console.error(
      "windows-unit: FAIL (native Windows 11 is required; this is not a Linux/WSL compatibility suite)",
    );
    process.exit(1);
  }

  const child = Bun.spawn(
    [process.execPath, "test", ...WINDOWS_FOCUSED_TESTS],
    {
      cwd: REPO_ROOT,
      stdout: "inherit",
      stderr: "inherit",
    },
  );
  const code = await child.exited;
  if (code !== 0) {
    console.log("windows-unit: FAIL");
    process.exit(code);
  }

  const node = Bun.spawn(
    ["node", "--import", "tsx", "--test", ...WINDOWS_NODE_TESTS],
    {
      cwd: join(REPO_ROOT, "collab-electron"),
      stdout: "inherit",
      stderr: "inherit",
    },
  );
  const nodeCode = await node.exited;
  console.log(`windows-unit: ${nodeCode === 0 ? "PASS" : "FAIL"}`);
  process.exit(nodeCode);
}
