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

  const literal = (value) =>
    `[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${Buffer.from(value, "utf8").toString("base64")}'))`;

  // PowerShell COM is the reliable way to rewrite .lnk on Windows.
  const ps = `
$ErrorActionPreference = 'Stop'
$sh = New-Object -ComObject WScript.Shell
$shortcutPath = ${literal(shortcutPath)}
$targetPath = ${literal(exePath)}
$workingDirectory = ${literal(workingDirectory)}
$iconLocation = ${literal(`${exePath},0`)}
$description = ${literal(description)}
$lnk = $sh.CreateShortcut($shortcutPath)
$lnk.TargetPath = $targetPath
$lnk.WorkingDirectory = $workingDirectory
$lnk.IconLocation = $iconLocation
$lnk.Description = $description
$lnk.Save()
$saved = $sh.CreateShortcut($shortcutPath)
Write-Output 'qf-shortcut-v1'
Write-Output ([Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($saved.TargetPath)))
Write-Output ([Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($saved.WorkingDirectory)))
Write-Output ([Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($saved.IconLocation)))
`.trim();

  const encodedCommand = Buffer.from(ps, "utf16le").toString("base64");

  const result = spawnSync(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-WindowStyle", "Hidden", "-EncodedCommand", encodedCommand],
    { encoding: "utf8", windowsHide: true },
  );
  const output = String(result.stdout).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const marker = output.indexOf("qf-shortcut-v1");
  if (result.status !== 0 || marker < 0 || output.length < marker + 4) {
    return {
      ok: false,
      reason: (result.stderr || result.stdout || "shortcut write failed").trim(),
    };
  }
  const decoded = output.slice(marker + 1, marker + 4).map((value) => Buffer.from(value, "base64").toString("utf8"));
  const [savedTargetPath, savedWorkingDirectory, savedIconLocation] = decoded;
  if (savedTargetPath !== exePath || savedWorkingDirectory !== workingDirectory || savedIconLocation !== `${exePath},0`) {
    return {
      ok: false,
      reason: "shortcut read-back differs from the requested target, working directory, or icon",
    };
  }
  return {
    ok: true,
    shortcutPath,
    exePath: savedTargetPath,
    workingDirectory: savedWorkingDirectory,
    iconLocation: savedIconLocation,
    description,
  };
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
