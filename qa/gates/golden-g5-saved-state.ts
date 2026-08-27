import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { tmpdir } from "node:os";

type SavedOptions = {
  extraFiles?: string[];
  missing?: Set<string>;
};

const repoRoot = join(import.meta.dir, "../..");

function repoRelative(path: string): string {
  return relative(repoRoot, path).replaceAll("\\", "/");
}

function readText(rel: string, options: SavedOptions): string | null {
  if (options.missing?.has(rel)) return null;
  const path = join(repoRoot, rel);
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf8");
}

function checkSavedState(options: SavedOptions = {}): string[] {
  const issues: string[] = [];
  const source: Array<[string, string | null]> = [
    ["collab-electron/src/main/config.ts", readText("collab-electron/src/main/config.ts", options)],
    ["collab-electron/src/main/index.ts", readText("collab-electron/src/main/index.ts", options)],
    ["collab-electron/src/main/canvas-persistence.ts", readText("collab-electron/src/main/canvas-persistence.ts", options)],
    ["collab-electron/src/windows/shell/src/canvas-state.js", readText("collab-electron/src/windows/shell/src/canvas-state.js", options)],
    ["collab-electron/src/windows/shell/src/tile-manager.js", readText("collab-electron/src/windows/shell/src/tile-manager.js", options)],
    ["collab-electron/src/windows/shell/src/renderer.js", readText("collab-electron/src/windows/shell/src/renderer.js", options)],
    ["collab-electron/src/windows/shell/index.html", readText("collab-electron/src/windows/shell/index.html", options)],
    ["collab-electron/src/windows/shell/src/dock.js", readText("collab-electron/src/windows/shell/src/dock.js", options)],
    ["collab-electron/src/main/pty.ts", readText("collab-electron/src/main/pty.ts", options)],
    ["collab-electron/src/main/host-native-tui.ts", readText("collab-electron/src/main/host-native-tui.ts", options)],
    ["collab-electron/src/main/ipc-knowledge.ts", readText("collab-electron/src/main/ipc-knowledge.ts", options)],
    ["collab-electron/src/windows/viewer/index.html", readText("collab-electron/src/windows/viewer/index.html", options)],
    ["collab-electron/src/windows/nav/index.html", readText("collab-electron/src/windows/nav/index.html", options)],
    ...(options.extraFiles ?? []).map((path) => [repoRelative(path), readFileSync(path, "utf8")] as [string, string]),
  ];

  for (const [rel, text] of source) {
    if (text === null) issues.push("saved-state source missing: " + rel);
  }

  const canvas = source.find(([rel]) => rel.endsWith("/canvas-state.js"))?.[1] ?? "";
  const manager = source.find(([rel]) => rel.endsWith("/tile-manager.js"))?.[1] ?? "";
  const renderer = source.find(([rel]) => rel.endsWith("/renderer.js"))?.[1] ?? "";
  const config = source.find(([rel]) => rel.endsWith("/config.ts"))?.[1] ?? "";
  const main = source.find(([rel]) => rel.endsWith("/index.ts"))?.[1] ?? "";
  const persistence = source.find(([rel]) => rel.endsWith("/canvas-persistence.ts"))?.[1] ?? "";
  const shell = source.find(([rel]) => rel.endsWith("/shell/index.html"))?.[1] ?? "";
  const dock = source.find(([rel]) => rel.endsWith("/dock.js"))?.[1] ?? "";
  const all = source.map(([, text]) => text ?? "").join("\n");

  const tileTypes = ["term", "note", "code", "image", "graph", "browser", "pdf", "artifact", "session", "research"];
  for (const type of tileTypes) {
    if (!new RegExp("(?:[\"']" + type + "[\"']|" + type + "\\s*:)").test(canvas)) {
      issues.push("saved tile predecessor not declared: " + type);
    }
  }

  const restoreBranches: Array<[string, RegExp]> = [
    ["term", /saved\.type\s*===\s*["']term["']/],
    ["graph", /saved\.type\s*===\s*["']graph["']/],
    ["artifact", /saved\.type\s*===\s*["']artifact["']/],
    ["session", /saved\.type\s*===\s*["']session["']/],
    ["browser", /saved\.type\s*===\s*["']browser["']/],
    ["research", /saved\.type\s*===\s*["']research["']/],
  ];
  for (const [type, pattern] of restoreBranches) {
    if (!pattern.test(manager)) issues.push("saved tile restore branch missing: " + type);
  }
  if (!/saved\.filePath/.test(manager) || !/inferTileType/.test(canvas + manager)) {
    issues.push("file-backed note/code/image/pdf restore path missing");
  }

  for (const field of ["x", "y", "width", "height", "isMaximized"]) {
    if (!new RegExp("\\b" + field + "\\b").test(config + main)) {
      issues.push("WindowState field missing: " + field);
    }
  }
  if (!/config\.window_state/.test(main) || !/saveWindowState/.test(main)) {
    issues.push("main WindowState save/restore path missing");
  }
  if (!/ptyDiscover/.test(renderer) || !/livePtyIds/.test(renderer) || !/restored/.test(manager)) {
    issues.push("live terminal PTY reconnect path missing");
  }
  if (!/Session stopped/.test(manager)) issues.push("stopped session tile disposition missing");
  if (!/panel-agent/.test(shell) || !/id="dock"/.test(shell) || !/singletonViewer/.test(renderer)) {
    issues.push("Files/viewer or Research Dock reachability missing");
  }
  if (!/nav:open-in-terminal/.test(all) || !/open-terminal/.test(all)) {
    issues.push("current Canvas terminal opener missing");
  }
  if (!/spawnTerminalWebview/.test(manager) || !/spawnSessionWebview/.test(manager)) {
    issues.push("current terminal/session tile consumers missing");
  }
  if (!/pty/i.test(source.find(([rel]) => rel.endsWith("/pty.ts"))?.[1] ?? "") ||
      !/native|pty/i.test(source.find(([rel]) => rel.endsWith("/host-native-tui.ts"))?.[1] ?? "")) {
    issues.push("PTY/native-TUI runtime consumer missing");
  }

  const obsolete = [
    /saved\.type\s*===\s*["'](?:agent-chat|terminal)["']/i,
    /restore(?:Legacy|Standalone|AgentChat)[A-Za-z]*/i,
    /agent-messages\.json/i,
  ];
  if (containsAny(all, obsolete)) {
    issues.push("obsolete saved record fallback or ACP cache migration is present");
  }

  return issues;
}

function containsAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function withFixture(kind: string, content: string, missing?: Set<string>): string[] {
  const dir = mkdtempSync(join(tmpdir(), "qf-g5-saved-" + kind + "-"));
  const file = join(dir, "fixture.ts");
  writeFileSync(file, content, "utf8");
  try {
    return checkSavedState({ extraFiles: [file], missing });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export function runGoldenG5SavedStateGate(): { ok: boolean } {
  const falsify = process.env.QF_G5_FALSIFY?.trim();
  if (falsify) {
    let issues: string[];
    if (falsify === "saved-state-loss") {
      issues = withFixture(falsify, "fixture", new Set(["collab-electron/src/windows/shell/src/canvas-state.js"]));
    } else if (falsify === "obsolete-fallback") {
      issues = withFixture(falsify, 'function restoreLegacySavedRecord(saved) { if (saved.type === "agent-chat") return fallbackTerminal(saved); }');
    } else {
      console.error("golden-g5-saved-state: unknown QF_G5_FALSIFY=" + falsify);
      return { ok: false };
    }
    if (issues.length === 0) {
      console.error("golden-g5-saved-state: FALSIFIER unexpectedly green: " + falsify);
      return { ok: false };
    }
    console.error("golden-g5-saved-state: FALSIFIER " + falsify + " detected: " + issues.join("; "));
    return { ok: false };
  }

  const issues = checkSavedState();
  if (issues.length > 0) {
    for (const issue of issues) console.error("golden-g5-saved-state: " + issue);
    return { ok: false };
  }
  console.log("golden-g5-saved-state: PASS");
  return { ok: true };
}
