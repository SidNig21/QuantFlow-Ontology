/**
 * WO-006b/c: Kernel SQLite sole-writer + AgentOS sole-host under collab-electron/src.
 * - Only kernel.ts may import qf-kernel / sqlite / mention kernel.db
 * - Only agent-host.ts may import @rivet-dev/agentos*
 * - acp-agent.ts is a frozen exception for @agentclientprotocol (debt #14)
 * - WO-008a: species/hermes/host-acp-client.ts is the sole live ACP SDK home
 *   (scanned explicitly; collab-electron bridge must not import the SDK)
 * - No new ai / ToolLoopAgent imports anywhere in the app
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const REPO_ROOT = join(import.meta.dir, "../..");
const APP_SRC = join(REPO_ROOT, "collab-electron/src");

const KERNEL_ALLOWED = "collab-electron/src/main/kernel.ts";
const AGENTOS_ALLOWED = "collab-electron/src/main/agent-host.ts";
/** Frozen legacy Collaborator path — debt #14. No *new* SDK imports here. */
const ACP_FROZEN = "collab-electron/src/main/acp-agent.ts";
/**
 * WO-008a: sole live host ACP client (outside APP_SRC walk — scanned explicitly).
 * Thin Electron bridge may re-export but must not import the SDK itself.
 */
const HOST_ACP_CLIENT = "species/hermes/host-acp-client.ts";
const HOST_ACP_POLICY = "species/hermes/host-acp-policy.ts";
const HOST_ACP_BRIDGE = "collab-electron/src/main/host-acp-bridge.ts";

const KERNEL_PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: "qf-kernel", re: /qf-kernel/ },
  { name: "node:sqlite", re: /node:sqlite/ },
  { name: "bun:sqlite", re: /bun:sqlite/ },
  { name: "better-sqlite3", re: /better-sqlite3/ },
  { name: "kernel.db", re: /kernel\.db/ },
];

const AGENT_PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: "@rivet-dev/agentos", re: /@rivet-dev\/agentos/ },
  { name: "@agentclientprotocol", re: /@agentclientprotocol/ },
  { name: "ToolLoopAgent", re: /\bToolLoopAgent\b/ },
  { name: "from ai", re: /from\s+["']ai["']/ },
];

const CODE_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

const SKIP_DIR_NAMES = new Set([
  "node_modules",
  ".git",
  "dist",
  "out",
  "packed",
  "coverage",
]);

function walk(dir: string, out: string[]): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (SKIP_DIR_NAMES.has(name)) continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      walk(full, out);
      continue;
    }
    const ext = name.includes(".") ? `.${name.split(".").pop()}` : "";
    if (!CODE_EXT.has(ext)) continue;
    out.push(full);
  }
}

function scanAgentPatterns(
  rel: string,
  text: string,
  offenders: string[],
): void {
  for (const p of AGENT_PATTERNS) {
    if (!p.re.test(text)) continue;
    if (p.name === "@rivet-dev/agentos" && rel === AGENTOS_ALLOWED) continue;
    if (
      p.name === "@agentclientprotocol" &&
      (rel === ACP_FROZEN ||
        rel === HOST_ACP_CLIENT ||
        rel === HOST_ACP_POLICY)
    ) {
      continue;
    }
    offenders.push(`${rel} (${p.name})`);
    break;
  }
}

export function checkKernelSoleWriterApp(): {
  ok: boolean;
  offenders: string[];
} {
  const files: string[] = [];
  walk(APP_SRC, files);
  // WO-008a: real SDK import lives outside collab-electron/src — scan it.
  files.push(join(REPO_ROOT, HOST_ACP_CLIENT));
  files.push(join(REPO_ROOT, HOST_ACP_POLICY));
  const offenders: string[] = [];

  for (const full of files) {
    const rel = relative(REPO_ROOT, full).split("\\").join("/");
    let text: string;
    try {
      text = readFileSync(full, "utf8");
    } catch {
      continue;
    }

    if (rel !== KERNEL_ALLOWED) {
      for (const p of KERNEL_PATTERNS) {
        if (p.re.test(text)) {
          offenders.push(`${rel} (${p.name})`);
          break;
        }
      }
    }

    scanAgentPatterns(rel, text, offenders);
  }

  // Bridge must stay a re-export — no direct SDK import (gate hygiene).
  try {
    const bridgeText = readFileSync(join(REPO_ROOT, HOST_ACP_BRIDGE), "utf8");
    if (/@agentclientprotocol/.test(bridgeText)) {
      offenders.push(
        `${HOST_ACP_BRIDGE} (@agentclientprotocol — use species client)`,
      );
    }
  } catch {
    offenders.push(`${HOST_ACP_BRIDGE} (missing)`);
  }

  if (offenders.length > 0) {
    console.error("kernel-sole-writer-app FAIL — offenders:");
    for (const o of offenders) console.error(`  ${o}`);
  } else {
    console.log("kernel-sole-writer-app OK");
  }
  return { ok: offenders.length === 0, offenders };
}

if (import.meta.main) {
  const { ok } = checkKernelSoleWriterApp();
  process.exit(ok ? 0 : 1);
}
