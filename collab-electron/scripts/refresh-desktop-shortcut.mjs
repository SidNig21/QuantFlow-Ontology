/**
 * Point the founder Desktop shortcut at this checkout's freshly packaged
 * win-unpacked QuantFlow.exe. Called at the end of package.mjs on Windows.
 *
 * Push alone does not rebuild the exe — packaging does. After
 * `bun run package:unsigned`, the Desktop link tracks this tree's dist/.
 *
 * Override path: QF_DESKTOP_SHORTCUT=C:\path\to\QuantFlow Ontology.lnk
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { normalizeWindowsPath } from "./local-bin.mjs";

const collabRoot = normalizeWindowsPath(
  process.env.QF_COLLAB_ROOT?.trim() || process.cwd(),
);
const exe = join(collabRoot, "dist", "win-unpacked", "QuantFlow.exe");
const workDir = join(collabRoot, "dist", "win-unpacked");

const shortcut =
  process.env.QF_DESKTOP_SHORTCUT?.trim() ||
  join(homedir(), "Desktop", "QuantFlow Ontology.lnk");

function gitDescribe(repoRoot) {
  const r = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  if (r.status === 0) return r.stdout.trim();
  return "unknown";
}

function packageVersion() {
  try {
    return JSON.parse(readFileSync(join(collabRoot, "package.json"), "utf8"))
      .version;
  } catch {
    return "?";
  }
}

export function refreshDesktopShortcut({
  exePath = exe,
  shortcutPath = shortcut,
  workingDirectory = workDir,
  repoRoot = join(collabRoot, ".."),
} = {}) {
  if (process.platform !== "win32") {
    return { ok: false, reason: "windows-only" };
  }
  if (!existsSync(exePath)) {
    return {
      ok: false,
      reason: `missing packaged exe: ${exePath} (run bun run package:unsigned first)`,
    };
  }

  const sha = gitDescribe(repoRoot);
  const version = packageVersion();
  const when = new Date().toISOString().slice(0, 19).replace("T", " ");
  const description = `QuantFlow Ontology ${version} @ ${sha} · packaged ${when}`;

  // PowerShell COM is the reliable way to rewrite .lnk on Windows.
  const ps = `
$ErrorActionPreference = 'Stop'
$sh = New-Object -ComObject WScript.Shell
$lnk = $sh.CreateShortcut(${JSON.stringify(shortcutPath)})
$lnk.TargetPath = ${JSON.stringify(exePath)}
$lnk.WorkingDirectory = ${JSON.stringify(workingDirectory)}
$lnk.IconLocation = ${JSON.stringify(`${exePath},0`)}
$lnk.Description = ${JSON.stringify(description)}
$lnk.Save()
Write-Output "ok"
`.trim();

  const result = spawnSync(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-Command", ps],
    { encoding: "utf8" },
  );
  if (result.status !== 0 || !String(result.stdout).includes("ok")) {
    return {
      ok: false,
      reason: (result.stderr || result.stdout || "shortcut write failed").trim(),
    };
  }
  return { ok: true, shortcutPath, exePath, description };
}

if (import.meta.main) {
  const out = refreshDesktopShortcut();
  if (!out.ok) {
    console.error(`refresh-desktop-shortcut: ${out.reason}`);
    process.exit(1);
  }
  console.log(`refresh-desktop-shortcut: ${out.shortcutPath}`);
  console.log(`  → ${out.exePath}`);
  console.log(`  ${out.description}`);
}
