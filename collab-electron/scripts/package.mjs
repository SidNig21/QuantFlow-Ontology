import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { normalizeWindowsPath, resolvePackageBin } from "./local-bin.mjs";

const args = process.argv.slice(2);
const builderArgs = ["--publish", "never"];
const env = { ...process.env };
const cwd = normalizeWindowsPath(process.cwd());
const PACKAGING_DEADLINE_MS = 10 * 60 * 1000;
const packagingDeadline = Date.now() + PACKAGING_DEADLINE_MS;

function packageBuildInputs() {
  let commitSha;
  try {
    commitSha = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd,
      encoding: "utf8",
    }).trim();
  } catch (error) {
    console.error(`package: cannot resolve git rev-parse HEAD: ${String(error)}`);
    process.exit(1);
  }
  if (!/^[0-9a-f]{40}$/.test(commitSha)) {
    console.error(`package: git rev-parse HEAD was not a full 40-character SHA: ${commitSha}`);
    process.exit(1);
  }

  const status = spawnSync(
    "git",
    ["status", "--porcelain=v1", "--untracked-files=all"],
    { cwd, encoding: "utf8", windowsHide: true },
  );
  if (status.status !== 0) {
    console.error(`package: cannot inspect checkout status: ${status.stderr || status.stdout}`);
    process.exit(1);
  }
  if (status.stdout.trim()) {
    console.error("package: refusing to package a dirty checkout");
    console.error(status.stdout.trim());
    process.exit(1);
  }

  const packagedAt = new Date().toISOString();
  return { commitSha, packagedAt };
}

const buildInputs = packageBuildInputs();
env.QF_BUILD_COMMIT_SHA = buildInputs.commitSha;
env.QF_BUILD_TIMESTAMP = buildInputs.packagedAt;

// Load .env.local (same approach as notarize.cjs) so GH_TOKEN and other
// credentials are available without requiring a manual export.
const envLocalPath = join(cwd, ".env.local");
if (existsSync(envLocalPath)) {
  for (const line of readFileSync(envLocalPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (key && rest.length > 0 && !(key.trim() in env)) {
      env[key.trim()] = rest.join("=").trim().replace(/^["']|["']$/g, "");
    }
  }
}

// The renderer build (~7 700 modules) exceeds the default V8 heap limit.
if (!env.NODE_OPTIONS?.includes("--max-old-space-size")) {
  env.NODE_OPTIONS = `${env.NODE_OPTIONS ?? ""} --max-old-space-size=8192`.trim();
}

const shouldPublish = args.includes("--publish");

// Windows packages need the same deploy-true Dock runtime resources as the
// Linux verification package. Stage them before electron-builder reads the
// platform-specific extraResources list.
if (process.platform === "win32") {
  const { prepareRuntimeStaging } = await import(
    "./package-lib/runtime-staging.ts",
  );
  prepareRuntimeStaging({
    stagingRoot: join(cwd, ".package-staging"),
    repoRoot: join(cwd, ".."),
  }, { qaMode: env.QF_DOCK_QA_MODE === "1" });
}

// Never use electron-builder's publisher — it fails when the release type
// (draft vs pre-release) doesn't match.  We upload via upload-to-github.cjs
// on all platforms instead.

if (args.includes("--no-sign")) {
  env.CSC_IDENTITY_AUTO_DISCOVERY = "false";
  env.SKIP_NOTARIZE = "true";
  builderArgs.push("-c.mac.identity=null");
  builderArgs.push("-c.win.signAndEditExecutable=false");

  for (const key of [
    "CSC_LINK",
    "CSC_KEY_PASSWORD",
    "CSC_NAME",
    "WIN_CSC_LINK",
    "WIN_CSC_KEY_PASSWORD",
  ]) {
    delete env[key];
  }
}

function assertTimeRemaining(phase) {
  const remaining = packagingDeadline - Date.now();
  if (remaining <= 0) {
    console.error(
      `package: phase=${phase} failed: packaging deadline exhausted after ${PACKAGING_DEADLINE_MS}ms`,
    );
    process.exit(1);
  }
  return remaining;
}

function run(phase, command, commandArgs, extraEnv = env) {
  const result = spawnSync(
    command,
    commandArgs,
    {
      stdio: "inherit",
      cwd,
      env: extraEnv,
      timeout: assertTimeRemaining(phase),
      killSignal: "SIGTERM",
      windowsHide: true,
    },
  );
  if (result.error) {
    const timeout = result.error.code === "ETIMEDOUT";
    console.error(
      `package: phase=${phase} failed: ${timeout ? "timed out" : result.error.message}; ` +
        `last active phase=${phase}; cause=${result.error.message}`,
    );
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`package: phase=${phase} failed with exit ${result.status}; last active phase=${phase}`);
    process.exit(result.status ?? 1);
  }
}

function detectMismatchedToolchain(expectedName, packageName = expectedName) {
  const expected = resolvePackageBin(cwd, packageName, expectedName);
  const opposite = join(
    cwd,
    "node_modules",
    ".bin",
    process.platform === "win32" ? expectedName : `${expectedName}.exe`,
  );

  if (existsSync(expected)) {
    return expected;
  }

  if (existsSync(opposite)) {
    console.error(
      `Detected ${process.platform === "win32" ? "non-Windows" : "Windows"}-installed tooling in a ${process.platform} packaging environment.`,
    );
    console.error(
      "Run `bun run clean:deep` and reinstall dependencies in a native checkout for this OS before packaging.",
    );
    process.exit(1);
  }

  console.error(`Missing local binary: ${expected}`);
  console.error("Run `bun install` in this checkout before packaging.");
  process.exit(1);
}

// On Windows, skip electron-builder's native module rebuild and use the N-API
// prebuilds that ship with node-pty instead. Compiling from source fails on
// Windows because winpty's GetCommitHash.bat is missing from the npm tarball.
// On macOS, let electron-builder rebuild from source against Electron headers
// so node-pty is ABI-compatible with Electron (prebuilds are compiled against
// vanilla Node.js and cause posix_spawnp failures under Electron).
if (process.platform === "win32") {
  builderArgs.push("-c.npmRebuild=false");
  // Use an afterPack hook to install the correct-arch prebuilds into the
  // staged app directory.  We cannot copy them into the live node_modules
  // because the persistent PTY sidecar keeps conpty.node locked (EBUSY).
  builderArgs.push("-c.afterPack=scripts/after-pack-pty.cjs");
}

// electron-builder's legacy Linux AppImage helper writes progress logs to
// stdout on first download, which breaks the JSON channel it expects to parse.
// Force the newer toolset to keep packaging stable on Linux.
if (process.platform === "linux") {
  builderArgs.push("-c.toolsets.appimage=1.0.2");
}

function targetArchitectures() {
  const arches = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--arch" && args[i + 1]) {
      arches.push(...args[i + 1].split(","));
      i++;
    }
  }
  if (arches.length > 0) return arches;

  const pkg = JSON.parse(readFileSync(join(cwd, "package.json"), "utf8"));
  const key = { win32: "win", darwin: "mac", linux: "linux" }[process.platform];
  const targets = pkg.build?.[key]?.target;
  if (Array.isArray(targets)) {
    const configuredArches = targets.flatMap((target) => {
      if (!target?.arch) return [];
      return Array.isArray(target.arch) ? target.arch : [target.arch];
    });
    if (configuredArches.length > 0) {
      return [...new Set(configuredArches)];
    }
  }

  return [process.arch];
}


const electronVite = detectMismatchedToolchain("electron-vite");
const electronBuilder = detectMismatchedToolchain("electron-builder");
const builtArches = targetArchitectures();

// Vite build is arch-independent — run once.
run("renderer build", process.execPath, [electronVite, "build"]);

// Package all target architectures in a single electron-builder run.
// The arch list in package.json's build.<platform>.target already tells
// electron-builder which architectures to produce, so passing --<arch>
// per-invocation just causes redundant full builds + notarizations.
run("electron-builder NSIS package", process.execPath, [electronBuilder, ...builderArgs]);

if (process.platform === "win32") {
  const dist = join(cwd, "dist");
  const packageManifest = JSON.parse(readFileSync(join(cwd, "package.json"), "utf8"));
  const productName = packageManifest.build?.productName ?? "QuantFlow";
  const version = packageManifest.version;
  const installerName = `${productName} Setup ${version}.exe`;
  const candidates = [
    join(dist, "win-unpacked", "QuantFlow.exe"),
    ...readdirSync(dist)
      .filter((name) => name.endsWith(".exe"))
      .map((name) => join(dist, name)),
  ].filter((path) => existsSync(path));
  const installerCandidates = candidates.filter((path) => basename(path) === installerName);
  if (installerCandidates.length !== 1) {
    console.error(
      `package: phase=release metadata failed: expected exactly one NSIS installer ${installerName}, ` +
        `found ${JSON.stringify(installerCandidates)}`,
    );
    process.exit(1);
  }
  const artifacts = candidates.map((path) => {
    const quotedPath = path.replaceAll("'", "''");
    const check = spawnSync(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command",
        `(Get-AuthenticodeSignature -LiteralPath '${quotedPath}').Status.ToString()`],
      { encoding: "utf8", windowsHide: true },
    );
    return {
      path,
      authenticode: check.status === 0 ? check.stdout.trim() : "Unknown",
    };
  });
  const releaseStatus = {
    contract: "qf.windows.release-status.v1",
    package: {
      name: packageManifest.name,
      productName,
      version,
    },
    build: {
      commit_sha: buildInputs.commitSha,
      packaged_at: buildInputs.packagedAt,
    },
    installer: {
      name: installerName,
      path: installerCandidates[0],
      authenticode: artifacts.find((artifact) => artifact.path === installerCandidates[0])?.authenticode,
    },
    artifacts,
  };
  writeFileSync(
    join(dist, "RELEASE-STATUS.json"),
    `${JSON.stringify(releaseStatus, null, 2)}\n`,
    "utf8",
  );
  for (const artifact of artifacts) {
    console.log(`• Windows signing state: ${artifact.authenticode} · ${artifact.path}`);
  }
}

// electron-builder's npmRebuild rewrites node-pty's native binary in-place
// for the last target architecture. On a cross-compile (e.g. x64 pass on an
// arm64 Mac) this leaves the wrong ABI in node_modules, breaking `bun run dev`.
// Rebuild for the host arch to restore a working dev environment.
if (process.platform !== "win32") {
  console.log("• Restoring node-pty for host architecture…");
  run(
    "restore node-pty",
    join(cwd, "node_modules", ".bin", "electron-rebuild"),
    ["-f", "-w", "node-pty"],
  );
}

// Use upload-to-github.cjs instead of electron-builder's publisher to avoid
// type-mismatch errors when the release already exists (e.g. one platform
// created it as a pre-release and another tries to publish as draft).
if (shouldPublish) {
  const uploadArgs = [join(cwd, "scripts", "upload-to-github.cjs")];
  // Forward --arch so the upload script only publishes the built architectures.
  uploadArgs.push("--arch", builtArches.join(","));
  run("publish upload", process.execPath, uploadArgs);
}

// Keep the founder Desktop shortcut aimed at this checkout's win-unpacked exe
// so a double-click never reopens a stale L1/acceptance install after package.
if (process.platform === "win32") {
  const { refreshDesktopShortcut } = await import(
    "./refresh-desktop-shortcut.mjs"
  );
  const refreshed = refreshDesktopShortcut({
    exePath: join(cwd, "dist", "win-unpacked", "QuantFlow.exe"),
    workingDirectory: join(cwd, "dist", "win-unpacked"),
    repoRoot: join(cwd, ".."),
  });
  if (refreshed.ok) {
    console.log(`• Desktop shortcut → ${refreshed.exePath}`);
    console.log(`  ${refreshed.description}`);
  } else {
    console.warn(`• Desktop shortcut not updated: ${refreshed.reason}`);
  }
}
