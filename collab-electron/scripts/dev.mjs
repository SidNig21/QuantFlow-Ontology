import { writeFileSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { join } from "node:path";

function normalizeWindowsPath(path) {
  if (process.platform !== "win32") return path;
  if (path.startsWith("\\\\?\\UNC\\")) {
    return `\\\\${path.slice("\\\\?\\UNC\\".length)}`;
  }
  if (path.startsWith("\\\\?\\")) {
    return path.slice("\\\\?\\".length);
  }
  return path;
}

const repoDir = normalizeWindowsPath(process.cwd());

function findDescendantElectronPid(rootPid) {
  if (process.platform === "win32") {
    const command = [
      `$root = ${rootPid}`,
      "$processes = @(Get-CimInstance Win32_Process | Select-Object Name,ProcessId,ParentProcessId)",
      "$ids = @($root)",
      "$changed = $true",
      "while ($changed) {",
      "  $changed = $false",
      "  foreach ($item in $processes) {",
      "    if (($ids -contains [int]$item.ParentProcessId) -and -not ($ids -contains [int]$item.ProcessId)) {",
      "      $ids += [int]$item.ProcessId",
      "      $changed = $true",
      "    }",
      "  }",
      "}",
      "$processes | Where-Object { $_.Name -eq 'electron.exe' -and $ids -contains [int]$_.ProcessId } | Select-Object -First 1 -ExpandProperty ProcessId",
    ].join("; ");
    const result = spawnSync(
      "powershell.exe",
      ["-NoProfile", "-Command", command],
      { encoding: "utf8", windowsHide: true },
    );
    const pid = Number(result.stdout?.trim());
    return Number.isInteger(pid) && pid > 0 ? pid : null;
  }
  const result = spawnSync("ps", ["-eo", "pid=,ppid=,comm="], { encoding: "utf8" });
  const rows = (result.stdout ?? "").trim().split(/\r?\n/).map((line) => {
    const match = line.trim().match(/^(\d+)\s+(\d+)\s+(.+)$/);
    return match ? { pid: Number(match[1]), ppid: Number(match[2]), name: match[3] } : null;
  }).filter(Boolean);
  const ids = new Set([rootPid]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const row of rows) {
      if (row && ids.has(row.ppid) && !ids.has(row.pid)) {
        ids.add(row.pid);
        changed = true;
      }
    }
  }
  return rows.find((row) => row && ids.has(row.pid) && row.name.includes("electron"))?.pid ?? null;
}

function exposeElectronPid(child) {
  const pidFile = process.env.QF_DEV_ELECTRON_PID_FILE?.trim();
  if (!pidFile || child.pid === undefined) return;
  const timer = setInterval(() => {
    const electronPid = findDescendantElectronPid(child.pid);
    if (!electronPid) return;
    writeFileSync(pidFile, `${electronPid}\n`, "utf8");
    clearInterval(timer);
  }, 100);
  child.once("exit", () => clearInterval(timer));
}

const child = process.platform === "win32"
  ? spawn(
      "powershell.exe",
      [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        join(repoDir, "scripts", "dev.ps1"),
      ],
      {
        stdio: "inherit",
        cwd: repoDir,
        env: {
          ...process.env,
          QF_DEV_WORKTREE_ROOT: repoDir,
        },
      },
    )
  : spawn(process.execPath, ["x", "electron-vite", "dev"], {
      stdio: "inherit",
      cwd: repoDir,
      env: {
        ...process.env,
        QF_DEV_WORKTREE_ROOT: repoDir,
      },
    });

exposeElectronPid(child);

const forwardSignal = (signal) => {
  if (!child.killed) {
    child.kill(signal);
  }
};

process.on("SIGINT", forwardSignal);
process.on("SIGTERM", forwardSignal);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
