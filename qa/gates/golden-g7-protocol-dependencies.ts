import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

type JsonRecord = Record<string, any>;
type TextMap = Map<string, string>;
type LockMap = Map<string, JsonRecord>;

const repoRoot = join(import.meta.dir, "../..");
const G7_PARENT = "b422df42229bcd8c9510608ce60684e69b6021bd";

const MANIFESTS = [
  "collab-electron/package.json",
  "collab-electron/packages/components/package.json",
  "collab-electron/packages/shared/package.json",
  "collab-electron/packages/theme/package.json",
  "packages/qf-kernel/package.json",
  "qf-kernel-schema/package.json",
  "species/hermes/package.json",
  "species/hermes/agent-package/package.json",
  "tools/qf-bovada-football/package.json",
  "tools/qf-proof-agent/package.json",
  "tools/qf-read-tools/package.json",
  "tools/qf-vault-projection/package.json",
  "qa/fixtures/lifecycle-command/package.json",
  "qa/gates/artifact-root/package.json",
  "qa/gates/boot-reconcile/package.json",
  "qa/gates/bovada-football/package.json",
  "qa/gates/dock-definition-launch/package.json",
  "qa/gates/dock-profile-identity/package.json",
  "qa/gates/kernel-drift/package.json",
  "qa/gates/market-ingest/package.json",
] as const;

const LOCK_ROOTS = [
  "collab-electron/bun.lock",
  "packages/qf-kernel/bun.lock",
  "qf-kernel-schema/bun.lock",
  "species/hermes/bun.lock",
  "tools/qf-bovada-football/bun.lock",
  "tools/qf-read-tools/bun.lock",
  "tools/qf-vault-projection/bun.lock",
  "qa/fixtures/lifecycle-command/bun.lock",
  "qa/gates/artifact-root/bun.lock",
  "qa/gates/boot-reconcile/bun.lock",
  "qa/gates/bovada-football/bun.lock",
  "qa/gates/dock-definition-launch/bun.lock",
  "qa/gates/dock-profile-identity/bun.lock",
  "qa/gates/kernel-drift/bun.lock",
  "qa/gates/market-ingest/bun.lock",
] as const;

const REMOVED_DEPENDENCIES = new Map([
  ["collab-electron/package.json#devDependencies#app-builder-bin", "4.2.0"],
  ["collab-electron/package.json#devDependencies#class-variance-authority", "^0.7.1"],
  ["collab-electron/package.json#devDependencies#clsx", "2.1.1"],
  ["collab-electron/package.json#devDependencies#streamdown", "2.3.0"],
  ["collab-electron/package.json#devDependencies#tailwind-merge", "3.5.0"],
  ["collab-electron/package.json#devDependencies#use-stick-to-bottom", "1.1.3"],
]);

const REMOVED_LOCK_ENTRIES = new Set([
  "class-variance-authority",
  "hast-util-sanitize",
  "rehype-harden",
  "rehype-sanitize",
  "remend",
  "streamdown",
  "tailwind-merge",
  "use-stick-to-bottom",
  "builder-util/app-builder-bin",
  "streamdown/marked",
]);

const STATIC_FORWARD_CHANNELS = [
  "create-artifact-tile",
  "create-graph-tile",
  "create-term-tile",
  "file-renamed",
  "file-selected",
  "files-deleted",
  "folder-selected",
  "fs-changed",
  "handoffs-changed",
  "nav-drag-active",
  "open-browser-tile",
  "open-terminal",
  "replay:data",
  "sessions-changed",
  "wikilinks-updated",
  "workspace-added",
  "workspace-removed",
  "spawn-failed",
  "spawn-pending",
  "spawn-reconciled",
] as const;

const BOUNDARY_FILES = [
  "collab-electron/src/main/ipc.ts",
  "collab-electron/src/main/index.ts",
  "collab-electron/src/main/ipc-canvas.ts",
  "collab-electron/src/main/ipc-filesystem.ts",
  "collab-electron/src/main/ipc-kernel.ts",
  "collab-electron/src/main/ipc-knowledge.ts",
  "collab-electron/src/main/ipc-misc.ts",
  "collab-electron/src/main/ipc-workspace.ts",
  "collab-electron/src/main/connections-ipc.ts",
  "collab-electron/src/main/host-acp-permission.ts",
  "collab-electron/src/main/pty.ts",
  "collab-electron/src/preload/universal.ts",
  "collab-electron/src/preload/shell.ts",
  "collab-electron/packages/shared/src/window-api.d.ts",
  "collab-electron/src/windows/shell/src/renderer.js",
  "collab-electron/src/windows/shell/src/tile-manager.js",
  "collab-electron/src/windows/shell/src/canvas-rpc.js",
  "collab-electron/packages/components/src/WorkspaceGraph/WorkspaceGraph.tsx",
  "collab-electron/src/windows/session-tile/src/App.tsx",
  "collab-electron/src/main/package-resource-paths.ts",
  "collab-electron/src/main/dock-profiles.ts",
  "collab-electron/src/main/agent-host.ts",
  "collab-electron/src/main/host-native-tui.ts",
  "collab-electron/src/main/host-acp-bridge.ts",
  "collab-electron/src/main/host-acp-turn.ts",
  "species/hermes/register.ts",
  "species/hermes/host-admit-kernel.ts",
  "tools/qf-vault-projection/src/gate.ts",
] as const;

const REQUIRED_CURRENT: Array<[string, string[]]> = [
  ["collab-electron/src/preload/shell.ts", [
    'ipcRenderer.invoke("qf:research:submitQuestion"',
    'ipcRenderer.invoke("qf:sessions:spawn"',
    'ipcRenderer.invoke("qf:review:projection"',
    'ipcRenderer.invoke("qf:connections:deleteForTile"',
    'ipcRenderer.on("shell:loading-status"',
  ]],
  ["collab-electron/src/preload/universal.ts", [
    'ipcRenderer.invoke("qf:sessions:permissionDecision"',
    'ipcRenderer.send("pty:write"',
    'ipcRenderer.send("pty:send-raw-keys"',
    'ipcRenderer.invoke("workspace:remove-by-path"',
  ]],
  ["collab-electron/src/main/ipc-kernel.ts", [
    '"qf:research:submitQuestion"',
    '"qf:sessions:spawn"',
    '"qf:review:projection"',
  ]],
  ["collab-electron/src/main/connections-ipc.ts", ['"qf:connections:deleteForTile"']],
  ["collab-electron/src/main/host-acp-permission.ts", ['"qf:sessions:permissionDecision"']],
  ["collab-electron/src/main/index.ts", [
    'ipcMain.on(\n  "pty:write"',
    'ipcMain.on(\n  "pty:send-raw-keys"',
    "shell.openExternal(url)",
  ]],
  ["collab-electron/src/main/ipc-workspace.ts", ['"workspace:remove-by-path"']],
];

const SAVED_STATE_CONSUMERS: Array<[string, string]> = [
  ["collab-electron/src/windows/shell/src/tile-manager.js", "restoreCanvasState"],
  ["collab-electron/src/windows/shell/src/canvas-rpc.js", "canvasRpcResponse"],
  ["collab-electron/src/windows/session-tile/src/App.tsx", "permissionDecision"],
  ["collab-electron/src/main/pty.ts", "writeToSession"],
];

const RUNTIME_RESOURCES = [
  "species/hermes/dock-profiles.json",
  "species/hermes/launch.json",
  "species/hermes/packed/hermes.meta.json",
  "species/hermes/tools-allowlist.json",
  "species/hermes/packed/hermes.aospkg",
  "species/hermes/prompts/worker.md",
  "species/hermes/prompts/orchestrator.md",
  "species/hermes/prompts/research-director.md",
  "tools/qf-proof-agent/dock-profiles.json",
  "tools/qf-proof-agent/launch.json",
  "tools/qf-proof-agent/packed/qf-proof-agent.meta.json",
  "tools/qf-proof-agent/packed/qf-proof-agent.aospkg",
  "tools/qf-proof-agent/packed/qf-proof-agent.mjs",
] as const;

function parentText(relativePath: string): string {
  return execFileSync("git", ["show", `${G7_PARENT}:${relativePath}`], {
    cwd: repoRoot,
    encoding: "utf8",
  });
}

function parseBunJson(text: string): JsonRecord {
  return JSON.parse(text.replace(/,\s*([}\]])/g, "$1")) as JsonRecord;
}

function readLock(relativePath: string): JsonRecord {
  return parseBunJson(readFileSync(join(repoRoot, relativePath), "utf8"));
}

function readParentLock(relativePath: string): JsonRecord {
  return parseBunJson(parentText(relativePath));
}

function readBoundary(missing = new Set<string>()): TextMap {
  const files = new Map<string, string>();
  for (const relativePath of BOUNDARY_FILES) {
    if (!missing.has(relativePath)) {
      files.set(relativePath, readFileSync(join(repoRoot, relativePath), "utf8"));
    }
  }
  return files;
}

function cloneMap(input: TextMap): TextMap {
  return new Map(input);
}

function replaceAll(text: string, marker: string): string {
  return text.split(marker).join("__G7_BAIT_REMOVED__");
}

function replaceChannel(text: string, channel: string): string {
  const escaped = channel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(
    new RegExp(`(?<![A-Za-z0-9_-])${escaped}(?![A-Za-z0-9_-])`, "g"),
    "__G7_BAIT_REMOVED__",
  );
}

function hasChannel(text: string, channel: string): boolean {
  const escaped = channel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![A-Za-z0-9_-])${escaped}(?![A-Za-z0-9_-])`).test(text);
}

function issue(issues: string[], message: string): void {
  issues.push(message);
}

function checkLedger(issues: string[]): void {
  const ledgerPath = join(repoRoot, "docs/orders/evidence/golden-baseline/g7/CANDIDATE-LEDGER.tsv");
  const lines = readFileSync(ledgerPath, "utf8").split(/\r?\n/).filter(Boolean);
  if (lines.length !== 160) issue(issues, `literal ledger rows=${lines.length - 1}, expected=159`);
  const ids = new Set<string>();
  let protocol = 0;
  let dependency = 0;
  for (const line of lines.slice(1)) {
    const fields = line.split("\t");
    if (fields.length < 5) {
      issue(issues, `ledger row has ${fields.length} fields: ${line}`);
      continue;
    }
    if (ids.has(fields[0]!)) issue(issues, `duplicate ledger id=${fields[0]}`);
    ids.add(fields[0]!);
    if (fields[1] === "protocol") protocol++;
    if (fields[1] === "dependency") dependency++;
  }
  if (protocol !== 50) issue(issues, `protocol ledger rows=${protocol}, expected=50`);
  if (dependency !== 109) issue(issues, `dependency ledger rows=${dependency}, expected=109`);
}

type DependencyRow = { id: string; value: string };

function dependencyRows(manifestPath: string, manifest: JsonRecord): DependencyRow[] {
  const rows: DependencyRow[] = [];
  for (const section of ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"]) {
    for (const [name, value] of Object.entries(manifest[section] ?? {})) {
      rows.push({ id: `${manifestPath}#${section}#${name}`, value: String(value) });
    }
  }
  return rows;
}

function checkDependencyContract(issues: string[], manifestOverride?: string): void {
  const rows = new Map<string, string>();
  let total = 0;
  for (const manifestPath of MANIFESTS) {
    const text = manifestPath === "collab-electron/package.json" && manifestOverride !== undefined
      ? manifestOverride
      : readFileSync(join(repoRoot, manifestPath), "utf8");
    if (!existsSync(join(repoRoot, manifestPath)) && manifestOverride === undefined) {
      issue(issues, `manifest missing=${manifestPath}`);
      continue;
    }
    const parsed = JSON.parse(text) as JsonRecord;
    for (const row of dependencyRows(manifestPath, parsed)) {
      rows.set(row.id, row.value);
      total++;
    }
    if (manifestPath !== "collab-electron/package.json") {
      const before = JSON.parse(parentText(manifestPath)) as JsonRecord;
      if (JSON.stringify(parsed) !== JSON.stringify(before)) issue(issues, `unapproved manifest change=${manifestPath}`);
    }
  }

  const beforeRows = new Map<string, string>();
  for (const manifestPath of MANIFESTS) {
    const before = JSON.parse(parentText(manifestPath)) as JsonRecord;
    for (const row of dependencyRows(manifestPath, before)) beforeRows.set(row.id, row.value);
  }
  for (const [id, value] of beforeRows) {
    if (rows.get(id) === value) continue;
    if (REMOVED_DEPENDENCIES.get(id) !== value) issue(issues, `unexpected dependency delta=${id}`);
  }
  for (const [id] of rows) {
    if (!beforeRows.has(id) && !id.startsWith("collab-electron/package.json#")) {
      issue(issues, `unexpected dependency addition=${id}`);
    }
  }
  if (total !== 103) issue(issues, `post-candidate dependency rows=${total}, expected=103`);
  for (const [id] of REMOVED_DEPENDENCIES) {
    if (rows.has(id)) issue(issues, `removed dependency still declared=${id}`);
  }
  if (manifestOverride === undefined) {
    const collab = JSON.parse(readFileSync(join(repoRoot, "collab-electron/package.json"), "utf8")) as JsonRecord;
    if (collab.devDependencies?.d3 !== "7.9.0") issue(issues, "retained direct dependency d3 is missing or changed");
  }
}

function stable(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  return `{${Object.keys(value as JsonRecord).sort().map((key) => `${JSON.stringify(key)}:${stable((value as JsonRecord)[key])}`).join(",")}}`;
}

function checkLockContract(issues: string[], lockOverride?: LockMap): void {
  for (const lockPath of LOCK_ROOTS) {
    if (!existsSync(join(repoRoot, lockPath))) {
      issue(issues, `lock root missing=${lockPath}`);
      continue;
    }
    if (lockPath !== "collab-electron/bun.lock" && readFileSync(join(repoRoot, lockPath), "utf8") !== parentText(lockPath)) {
      issue(issues, `unapproved lock change=${lockPath}`);
    }
  }

  const before = readParentLock("collab-electron/bun.lock");
  const after = lockOverride?.get("collab-electron/bun.lock") ?? readLock("collab-electron/bun.lock");
  if (stable(before.workspaces?.[""]) === stable(after.workspaces?.[""])) {
    issue(issues, "collab importer did not contract");
  }
  for (const section of ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"]) {
    const beforeSection = before.workspaces?.[""]?.[section] ?? {};
    const afterSection = after.workspaces?.[""]?.[section] ?? {};
    for (const [name, value] of Object.entries(beforeSection)) {
      if (REMOVED_DEPENDENCIES.has(`collab-electron/package.json#${section}#${name}`)) {
        if (name in afterSection) issue(issues, `removed importer root still present=${name}`);
      } else if (stable(afterSection[name]) !== stable(value)) {
        issue(issues, `retained importer root changed=${section}#${name}`);
      }
    }
    for (const name of Object.keys(afterSection)) {
      if (!(name in beforeSection)) issue(issues, `unexpected importer root added=${section}#${name}`);
    }
  }

  const beforePackages = before.packages as JsonRecord;
  const afterPackages = after.packages as JsonRecord;
  const removed = Object.keys(beforePackages).filter((key) => !(key in afterPackages));
  const added = Object.keys(afterPackages).filter((key) => !(key in beforePackages));
  if (stable(removed.sort()) !== stable([...REMOVED_LOCK_ENTRIES].sort())) issue(issues, `lock removed closure=${removed.sort().join(",")}`);
  if (added.length > 0) issue(issues, `lock added entries=${added.join(",")}`);
  for (const key of Object.keys(beforePackages)) {
    if (!(key in afterPackages)) continue;
    if (key === "app-builder-bin") {
      if (afterPackages[key]?.[0] !== "app-builder-bin@5.0.0-alpha.12") issue(issues, "app-builder-bin did not resolve to retained transitive version");
      continue;
    }
    if (stable(beforePackages[key]) !== stable(afterPackages[key])) issue(issues, `unapproved lock tuple change=${key}`);
  }
  if (afterPackages["builder-util/app-builder-bin"] !== undefined) issue(issues, "removed nested app-builder-bin closure still present");
}

function checkRemovedProtocol(issues: string[], files: TextMap): void {
  const absent: Array<[string, RegExp]> = [
    ["collab-electron/src/preload/universal.ts", /agentSpawn|agentPrompt|agentCancel|agentKill|agentSaveMessages|"agent:(spawn|prompt|cancel|kill|save-messages)"/],
    ["collab-electron/src/preload/universal.ts", /"dialog:open-image"|"workspace:update-frontmatter"|"fs:count-files"|openImageDialog|updateFrontmatter|countFiles/],
    ["collab-electron/src/preload/universal.ts", /"dialog:open-folder"|openFolder/],
    ["collab-electron/src/preload/shell.ts", /openSettings|"settings:open"|workspaceRemove\b|"workspace:remove"(?!-by-path)|openExternal|getHomePath|"shell:open-external"/],
    ["collab-electron/packages/shared/src/window-api.d.ts", /countFiles|openImageDialog|updateFrontmatter|openFolder/],
    ["collab-electron/src/main/ipc-misc.ts", /"dialog:open-folder"|"dialog:open-image"|"shell:open-external"/],
    ["collab-electron/src/main/ipc-filesystem.ts", /"fs:count-files"|countTreeFiles/],
    ["collab-electron/src/main/ipc-workspace.ts", /"workspace:remove"(?!-by-path)|"workspace:update-frontmatter"|LEGACY_FM_FIELDS/],
    ["collab-electron/src/main/index.ts", /ipcMain\.handle\([\s\S]{0,80}"pty:(write|send-raw-keys)"|"settings:open"|"get-home-path"/],
  ];
  for (const [path, pattern] of absent) {
    if (pattern.test(files.get(path) ?? "")) issue(issues, `removed protocol residue=${path}:${pattern}`);
  }
}

function checkRequiredCurrent(issues: string[], files: TextMap): void {
  for (const [path, markers] of REQUIRED_CURRENT) {
    const text = files.get(path) ?? "";
    for (const marker of markers) if (!text.includes(marker)) issue(issues, `required current bridge missing=${path}:${marker}`);
  }
  for (const path of ["collab-electron/src/windows/shell/src/canvas-rpc.js", "collab-electron/packages/components/src/WorkspaceGraph/WorkspaceGraph.tsx"]) {
    if (!files.get(path)?.match(/browserEvaluate|browserInfo|browserScroll|browserWait|focusAgentSession/)) issue(issues, `routed G10 browser/canvas call missing=${path}`);
  }
}

function checkForward(issues: string[], files: TextMap): void {
  const ipc = files.get("collab-electron/src/main/ipc.ts") ?? "";
  const shell = files.get("collab-electron/src/preload/shell.ts") ?? "";
  const misc = files.get("collab-electron/src/main/ipc-misc.ts") ?? "";
  const renderer = files.get("collab-electron/src/windows/shell/src/renderer.js") ?? "";
  if (!/mainWindow\?\.webContents\.send\(\s*"shell:forward"\s*,\s*target\s*,\s*channel\s*,\s*\.\.\.args/s.test(ipc)) issue(issues, "shell:forward transport tuple missing");
  for (const marker of ["pendingForwards", 'ipcRenderer.on("shell:forward"', 'ipcRenderer.removeAllListeners("shell:forward")', 'ipcRenderer.on("shell:forward", handler)']) {
    if (!shell.includes(marker)) issue(issues, `shell:forward preload seam missing=${marker}`);
  }
  for (const channel of STATIC_FORWARD_CHANNELS) {
    if (![...files.values()].some((text) => hasChannel(text, channel))) issue(issues, `shell:forward static channel missing=${channel}`);
  }
  if (!misc.includes("agent:${event.kind}") || !renderer.includes('channel.startsWith("agent:")')) issue(issues, "shell:forward dynamic agent family missing");
  if (!misc.includes("viewer:${msg.workspacePath}")) issue(issues, "shell:forward dynamic viewer target missing");
}

function checkSavedState(issues: string[], files: TextMap): void {
  for (const [path, marker] of SAVED_STATE_CONSUMERS) {
    if (!files.get(path)?.includes(marker)) issue(issues, `saved-state consumer missing=${path}:${marker}`);
  }
}

function checkResources(issues: string[], missing = new Set<string>(), files = readBoundary()): void {
  for (const relativePath of RUNTIME_RESOURCES) {
    if (missing.has(relativePath) || !existsSync(join(repoRoot, relativePath))) issue(issues, `retained package resource missing=${relativePath}`);
  }
  const refs: Array<[string, string]> = [
    ["species/hermes/register.ts", "species/hermes/packed/hermes.aospkg"],
    ["species/hermes/dock-profiles.json", "packed/hermes.aospkg"],
    ["species/hermes/packed/hermes.meta.json", "hermes.aospkg"],
    ["tools/qf-proof-agent/dock-profiles.json", "packed/qf-proof-agent.aospkg"],
    ["tools/qf-proof-agent/packed/qf-proof-agent.meta.json", "qf-proof-agent.aospkg"],
    ["tools/qf-vault-projection/src/gate.ts", "tools/qf-proof-agent/packed/qf-proof-agent.aospkg"],
  ];
  for (const [path, marker] of refs) {
    if (!files.get(path)?.includes(marker) && !(existsSync(join(repoRoot, path)) && readFileSync(join(repoRoot, path), "utf8").includes(marker))) issue(issues, `package_ref identity missing=${path}:${marker}`);
  }
}

function checkAll(override?: { files?: TextMap; locks?: LockMap; missingResources?: Set<string>; manifest?: string }): string[] {
  const issues: string[] = [];
  checkLedger(issues);
  checkDependencyContract(issues, override?.manifest);
  checkLockContract(issues, override?.locks);
  const files = override?.files ?? readBoundary();
  checkRemovedProtocol(issues, files);
  checkRequiredCurrent(issues, files);
  checkForward(issues, files);
  checkSavedState(issues, files);
  checkResources(issues, override?.missingResources, files);
  return issues;
}

function falsifier(falsify: string): string[] | null {
  const files = readBoundary();
  if (falsify === "required-current-bridge") {
    files.set("collab-electron/src/preload/shell.ts", replaceAll(files.get("collab-electron/src/preload/shell.ts")!, 'ipcRenderer.invoke("qf:research:submitQuestion"'));
    return checkAll({ files });
  }
  if (falsify === "dynamic-forward-channel") {
    files.set("collab-electron/src/main/ipc-misc.ts", replaceAll(files.get("collab-electron/src/main/ipc-misc.ts")!, "agent:${event.kind}"));
    files.set("collab-electron/src/windows/shell/src/renderer.js", replaceAll(files.get("collab-electron/src/windows/shell/src/renderer.js")!, 'channel.startsWith("agent:")'));
    return checkAll({ files });
  }
  if (falsify === "live-pty-send-variant") {
    files.set("collab-electron/src/preload/universal.ts", replaceAll(files.get("collab-electron/src/preload/universal.ts")!, 'ipcRenderer.send("pty:send-raw-keys"'));
    return checkAll({ files });
  }
  if (falsify === "saved-state-consumer") return checkAll({ files: readBoundary(new Set([SAVED_STATE_CONSUMERS[0]![0]])) });
  if (falsify === "retained-direct-dependency") {
    const manifest = readFileSync(join(repoRoot, "collab-electron/package.json"), "utf8").replace('"d3": "7.9.0"', '"g7-bait-d3": "7.9.0"');
    return checkAll({ files, manifest });
  }
  if (falsify === "orphan-lock-closure") {
    const locks = new Map<string, JsonRecord>();
    const lock = readLock("collab-electron/bun.lock");
    lock.packages["g7-orphan"] = ["g7-orphan@1.0.0", "", {}, "g7-bait"];
    locks.set("collab-electron/bun.lock", lock);
    return checkAll({ files, locks });
  }
  if (falsify === "package-runtime-resource") return checkAll({ files, missingResources: new Set([RUNTIME_RESOURCES[0]!]) });
  if (falsify === "shell-forward:transport") {
    files.set("collab-electron/src/main/ipc.ts", replaceAll(files.get("collab-electron/src/main/ipc.ts")!, '"shell:forward"'));
    return checkAll({ files });
  }
  if (falsify.startsWith("shell-forward:")) {
    const channel = falsify.slice("shell-forward:".length);
    if (channel === "agent:${event.kind}") {
      files.set("collab-electron/src/main/ipc-misc.ts", replaceAll(files.get("collab-electron/src/main/ipc-misc.ts")!, "agent:${event.kind}"));
    } else if (channel === "viewer:${workspacePath}") {
      files.set("collab-electron/src/main/ipc-misc.ts", replaceAll(files.get("collab-electron/src/main/ipc-misc.ts")!, "viewer:${msg.workspacePath}"));
    } else if ((STATIC_FORWARD_CHANNELS as readonly string[]).includes(channel)) {
      for (const [path, text] of files) files.set(path, replaceChannel(text, channel));
    } else {
      return null;
    }
    return checkAll({ files });
  }
  return null;
}

export function runGoldenG7ProtocolDependenciesGate(): { ok: boolean } {
  const falsify = process.env.QF_G7_FALSIFY?.trim();
  if (falsify) {
    const issues = falsifier(falsify);
    if (issues === null) {
      console.error("golden-g7-protocol-dependencies: unknown QF_G7_FALSIFY=" + falsify);
      return { ok: false };
    }
    if (issues.length === 0) {
      console.error("golden-g7-protocol-dependencies: FALSIFIER unexpectedly green=" + falsify);
      return { ok: false };
    }
    console.error(`golden-g7-protocol-dependencies: FALSIFIER ${falsify} detected: ${issues.join("; ")}`);
    return { ok: false };
  }

  const issues = checkAll();
  if (issues.length > 0) {
    for (const item of issues) console.error("golden-g7-protocol-dependencies: " + item);
    return { ok: false };
  }
  console.log("golden-g7-protocol-dependencies: PASS manifests=20 dependencyRows=103 lockRoots=15 ledgerRows=159 staticForwardChannels=20 runtimeResources=13");
  return { ok: true };
}
