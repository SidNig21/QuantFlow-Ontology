import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { tmpdir } from "node:os";

type ScanOptions = {
  extraFiles?: string[];
  missing?: Set<string>;
};

const repoRoot = join(import.meta.dir, "../..");

function repoRelative(path: string): string {
  return relative(repoRoot, path).replaceAll("\\", "/");
}

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "out" || entry.name === "dist") continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(path));
    else files.push(path);
  }
  return files;
}

function productionFiles(): string[] {
  const files = [
    ...walk(join(repoRoot, "collab-electron", "src")),
    ...walk(join(repoRoot, "collab-electron", "packages")),
    join(repoRoot, "collab-electron", "electron.vite.config.ts"),
    join(repoRoot, "collab-electron", "package.json"),
    join(repoRoot, "collab-electron", "bun.lock"),
  ];
  return [...new Set(files)].filter((path) => existsSync(path));
}

function readProduction(options: ScanOptions): Map<string, string> {
  const result = new Map<string, string>();
  const files = [...productionFiles(), ...(options.extraFiles ?? [])];
  for (const path of [...new Set(files)]) {
    const rel = repoRelative(path);
    if (options.missing?.has(rel)) continue;
    result.set(rel, readFileSync(path, "utf8"));
  }
  return result;
}

function containsAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function scanConsumerCensus(options: ScanOptions = {}): string[] {
  const issues: string[] = [];
  const texts = readProduction(options);
  const forbidden: Array<[string, RegExp[]]> = [
    ["stale Agent Chat source/build/view reference", [
      /agent-chat/i,
      /agentChat/,
      /acp-agent/i,
      /registerAgentIpc/,
    ]],
    ["stale standalone Terminal source/build/view reference", [
      /src\/windows\/terminal(?:[/"'\\])/i,
      /getRendererURL\(["']terminal["']\)/,
    ]],
    ["stale standalone-Terminal protocol closure", [
      /viewer:run-in-terminal/,
      /agent:focus-session/,
      /ptyForegroundProcess/,
      /["'](?:cd-to|run-in-terminal|focus-tab)["']/,
    ]],
    ["removed Electron ACP/Agent Chat dependency", [
      /@agentclientprotocol\/claude-agent-acp/,
      /@agentclientprotocol\/sdk/,
      /@assistant-ui/,
      /lucide-react/,
    ]],
    ["legacy ACP cache reference", [/agent-messages\.json/]],
  ];

  for (const [name, patterns] of forbidden) {
    for (const [path, text] of texts) {
      if (containsAny(text, patterns)) issues.push(name + " in " + path);
    }
  }

  const removedPaths = [


    "collab-electron/src/main/acp-agent.ts",
    "collab-electron/src/main/acp-agent.test.ts",
    "collab-electron/src/main/acp-fs-root.ts",
    "collab-electron/src/main/acp-fs-root.test.ts",
    "qa/gates/acp-fs-confine.ts",
  ];
  for (const rel of removedPaths) {
    if (existsSync(join(repoRoot, rel))) issues.push("removed path still exists: " + rel);
  }

  const requiredFiles = [
    "collab-electron/src/windows/terminal-tile/src/App.tsx",
    "collab-electron/src/windows/session-tile/src/App.tsx",
    "collab-electron/src/windows/viewer/index.html",
    "collab-electron/src/windows/nav/index.html",
    "collab-electron/src/windows/shell/index.html",
    "collab-electron/src/windows/shell/src/dock.js",
    "collab-electron/src/windows/shell/src/tile-manager.js",
    "collab-electron/src/main/pty.ts",
    "collab-electron/src/main/host-native-tui.ts",
    "collab-electron/src/main/host-acp-bridge.ts",
    "collab-electron/src/main/host-acp-permission.ts",
    "collab-electron/src/main/host-acp-turn.ts",
    "species/hermes/host-acp-client.ts",
    "species/hermes/host-acp-policy.ts",
    "species/hermes/host-admit-kernel.ts",
    "species/hermes/launch.json",
    "species/hermes/agent-package/agentos-package.json",
  ];
  for (const rel of requiredFiles) {
    if (!options.missing?.has(rel) && !existsSync(join(repoRoot, rel))) {
      issues.push("protected current file missing: " + rel);
    }
  }

  const requiredText: Array<[string, string, RegExp]> = [
    ["collab-electron/src/main/host-acp-bridge.ts", "host-ACP command resolver", /resolveHostAcpCommand/],
    ["collab-electron/src/main/host-native-tui.ts", "native-TUI host-ACP consumer", /resolveHostAcpCommand/],
    ["collab-electron/src/main/ipc-knowledge.ts", "current Canvas terminal opener", /nav:open-in-terminal[\s\S]*open-terminal/],
    ["collab-electron/src/windows/shell/src/tile-manager.js", "terminal-tile/session-tile restore", /spawnTerminalWebview[\s\S]*restoreCanvasState[\s\S]*spawnSessionWebview/],
    ["collab-electron/src/windows/shell/index.html", "Research Dock", /id="dock"[\s\S]*Research Dock/],
    ["collab-electron/src/main/pty.ts", "PTY runtime", /export|pty/],
    ["collab-electron/src/main/host-native-tui.ts", "native TUI runtime", /native|PTY|pty/i],
    ["collab-electron/package.json", "QuantFlow package identity", /com\.quantflow\.ontology[\s\S]*"productName":\s*"QuantFlow"/],
    ["species/hermes/agent-package/agentos-package.json", "host-ACP package profile", /agentos|host[_-]acp/i],
  ];
  for (const [rel, label, pattern] of requiredText) {
    if (options.missing?.has(rel)) {
      issues.push("protected consumer deleted: " + label + " (" + rel + ")");
      continue;
    }
    const text = texts.get(rel) ?? (existsSync(join(repoRoot, rel)) ? readFileSync(join(repoRoot, rel), "utf8") : "");
    if (!pattern.test(text)) issues.push("protected consumer missing: " + label + " (" + rel + ")");
  }

  return issues;
}

function withFixture(kind: string, content: string, options: Omit<ScanOptions, "extraFiles"> = {}): string[] {
  const dir = mkdtempSync(join(tmpdir(), "qf-g5-consumer-" + kind + "-"));
  const file = join(dir, "fixture.ts");
  writeFileSync(file, content, "utf8");
  try {
    return scanConsumerCensus({ ...options, extraFiles: [file] });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export function runGoldenG5ConsumerCensusGate(): { ok: boolean } {
  const falsify = process.env.QF_G5_FALSIFY?.trim();
  if (falsify) {
    let issues: string[];
    if (falsify === "stale-opener") {
      issues = withFixture(falsify, 'const stale = getRendererURL("agent-chat");');
    } else if (falsify === "protected-consumer") {
      issues = withFixture(falsify, "fixture", {
        missing: new Set(["collab-electron/src/windows/terminal-tile/src/App.tsx"]),
      });
    } else if (falsify === "host-acp") {
      issues = withFixture(falsify, "fixture", {
        missing: new Set(["collab-electron/src/main/host-acp-permission.ts"]),
      });
    } else if (falsify === "dependency-closure") {
      issues = withFixture(falsify, 'import "@assistant-ui/react";');
    } else {
      console.error("golden-g5-consumer-census: unknown QF_G5_FALSIFY=" + falsify);
      return { ok: false };
    }
    if (issues.length === 0) {
      console.error("golden-g5-consumer-census: FALSIFIER unexpectedly green: " + falsify);
      return { ok: false };
    }
    console.error("golden-g5-consumer-census: FALSIFIER " + falsify + " detected: " + issues.join("; "));
    return { ok: false };
  }

  const issues = scanConsumerCensus();
  if (issues.length > 0) {
    for (const issue of issues) console.error("golden-g5-consumer-census: " + issue);
    return { ok: false };
  }
  console.log("golden-g5-consumer-census: PASS");
  return { ok: true };
}
