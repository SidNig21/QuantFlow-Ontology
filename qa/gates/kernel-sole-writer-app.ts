/**
 * WO-006b/c: Kernel SQLite sole-writer + AgentOS sole-host under collab-electron/src.
 * - Only kernel.ts may import qf-kernel / sqlite / mention the Kernel db filename
 * - No production app source may import the retired @rivet-dev/agentos* runtime
 * - acp-agent.ts is a frozen exception for @agentclientprotocol (debt #14)
 * - WO-008a: species/hermes/host-acp-client.ts is the sole live ACP SDK home
 *   (scanned explicitly; collab-electron bridge must not import the SDK)
 * - No new ai / ToolLoopAgent imports anywhere in the app
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const REPO_ROOT = join(import.meta.dir, "../..");
const APP_SRC = join(REPO_ROOT, "collab-electron/src");

const KERNEL_ALLOWED = new Set([
  "collab-electron/src/main/kernel.ts",
  "collab-electron/src/main/research-world.test.ts",
  // Focused Kernel-dispatch regression tests import the public Kernel surface
  // directly; they do not add an app runtime writer.
  "collab-electron/src/main/task-steering.test.ts",
  // These are isolated fixture/oracle tests and add no application runtime writer.
  "collab-electron/src/main/governed-review.test.ts",
  "collab-electron/src/main/native-tui-orchestration.test.ts",
  "collab-electron/src/main/ontology-gateway.test.ts",
  "collab-electron/src/main/precreated-native-tui.test.ts",
]);
/**
 * peer-delivery.ts reads the TRANSPORT db (peer-bus.db) via node:sqlite to push
 * peer messages into recipient TUIs. Exempt ONLY from the node:sqlite pattern —
 * still flagged if it ever references the Kernel db or imports the Kernel pkg.
 */
const TRANSPORT_SQLITE_ALLOWED = new Set([
  "collab-electron/src/main/peer-delivery.ts",
  "collab-electron/src/main/peer-delivery.test.ts",
]);
const AGENT_HOST = "collab-electron/src/main/agent-host.ts";
const PEER_DELIVERY_TEST = "collab-electron/src/main/peer-delivery.test.ts";
const KERNEL_SOLE_WRITER_FALSIFIER = process.env.QF_G5_KERNEL_SOLE_WRITER_FALSIFY ?? "";
const KERNEL_SOLE_WRITER_FALSIFIERS = new Set([
  "agent-host-node-sqlite",
  "peer-delivery-test-qf-kernel",
  "peer-delivery-test-kernel-db",
]);

function sourceWithKernelSoleWriterFalsifier(rel: string, text: string): string {
  if (KERNEL_SOLE_WRITER_FALSIFIER === "agent-host-node-sqlite" && rel === AGENT_HOST) {
    return `${text}\nimport { DatabaseSync } from "node:sqlite";\n`;
  }
  if (KERNEL_SOLE_WRITER_FALSIFIER === "peer-delivery-test-qf-kernel" && rel === PEER_DELIVERY_TEST) {
    return `${text}\nimport "qf-kernel";\n`;
  }
  if (KERNEL_SOLE_WRITER_FALSIFIER === "peer-delivery-test-kernel-db" && rel === PEER_DELIVERY_TEST) {
    return `${text}\nconst forbiddenTransportPath = ["kernel", "db"].join(".");\n`;
  }
  return text;
}
/** Frozen legacy Collaborator path — debt #14. No *new* SDK imports here. */
const ACP_FROZEN = "collab-electron/src/main/acp-agent.ts";
/**
 * The frozen path's own falsification test (WO-WIN, commit 4b7545a): it proves a
 * permission request cannot silently select an allow option. Its only SDK
 * reference is `import type { RequestPermissionRequest }` — a type-only import,
 * erased at compile time, so it adds no runtime SDK dependency. This scan is a
 * grep and cannot distinguish `import type` from a value import. Refusing the
 * exception would mean the frozen legacy surface could not be tested at all,
 * which is the opposite of what debt #14 wants while it stays frozen.
 */
const ACP_FROZEN_TEST = "collab-electron/src/main/acp-agent.test.ts";
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
  { name: "kernel-db-filename", re: /kernel\.db/ },
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
    if (
      p.name === "@agentclientprotocol" &&
      (rel === ACP_FROZEN ||
        rel === ACP_FROZEN_TEST ||
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
  if (KERNEL_SOLE_WRITER_FALSIFIER && !KERNEL_SOLE_WRITER_FALSIFIERS.has(KERNEL_SOLE_WRITER_FALSIFIER)) {
    offenders.push(`unknown kernel-sole-writer falsifier: ${KERNEL_SOLE_WRITER_FALSIFIER}`);
  }

  for (const full of files) {
    const rel = relative(REPO_ROOT, full).split("\\").join("/");
    let text: string;
    try {
      text = readFileSync(full, "utf8");
    } catch {
      continue;
    }
    const scanText = sourceWithKernelSoleWriterFalsifier(rel, text);

    if (!KERNEL_ALLOWED.has(rel)) {
      for (const p of KERNEL_PATTERNS) {
        if (p.re.test(scanText)) {
          // Transport reader may match node:sqlite only; Kernel filename / qf-kernel
          // still bite so it can never quietly touch domain truth.
          if (TRANSPORT_SQLITE_ALLOWED.has(rel) && p.name === "node:sqlite") {
            continue;
          }
          offenders.push(`${rel} (${p.name})`);
          break;
        }
      }
    }

    scanAgentPatterns(rel, scanText, offenders);
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
