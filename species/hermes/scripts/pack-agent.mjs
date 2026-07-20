#!/usr/bin/env node
/**
 * Bundle the Hermes ACP shim and pack agent-package/ for AgentOs.
 *
 * Also writes packed/hermes.meta.json with desk `route` (WO-008d) — the
 * AgentOS toolchain strips unknown fields from the packed agentos-package.json,
 * so deploy-true routing reads this sibling meta (and/or species/launch.json).
 */
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const agentDir = join(root, "agent-package");
const distDir = join(agentDir, "dist");
const outDir = join(root, "packed");
const aospkg = join(outDir, "hermes.aospkg");
const metaOut = join(outDir, "hermes.meta.json");
const launchJson = join(root, "launch.json");
const toolsJson = join(root, "tools-allowlist.json");
const toolchain = join(
  root,
  "node_modules/@rivet-dev/agentos-toolchain/bin/agentos-toolchain.mjs",
);

rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });
mkdirSync(outDir, { recursive: true });

const bundle = spawnSync(
  "bun",
  [
    "build",
    join(agentDir, "src/acp-shim.ts"),
    "--outfile",
    join(distDir, "acp-shim.js"),
    "--target",
    "node",
    "--format",
    "esm",
  ],
  { cwd: root, stdio: "inherit" },
);
if (bundle.status !== 0) process.exit(bundle.status ?? 1);

const pack = spawnSync(
  "node",
  [
    toolchain,
    "pack",
    agentDir,
    "--agent",
    "hermes-acp-shim",
    "--out",
    join(outDir, "hermes.tar"),
  ],
  { cwd: root, stdio: "inherit" },
);
if (pack.status !== 0) process.exit(pack.status ?? 1);

if (!existsSync(aospkg)) {
  console.error("pack-agent: expected", aospkg);
  process.exit(1);
}

/** @type {"native_tui" | "host_acp" | "agentos"} */
let route = "native_tui";
/** @type {string[]} */
let argv = ["--tui"];
try {
  if (existsSync(launchJson)) {
    const doc = JSON.parse(readFileSync(launchJson, "utf8"));
    if (
      doc.route === "native_tui" ||
      doc.route === "host_acp" ||
      doc.route === "agentos"
    ) {
      route = doc.route;
    } else if (doc.surface === "native_tui") {
      route = "native_tui";
    } else if (doc.launch === "host_acp" || doc.launch === "agentos") {
      route = doc.launch;
    }
    if (Array.isArray(doc.argv)) {
      argv = doc.argv.filter((a) => typeof a === "string" && a.length > 0);
    }
  }
} catch {
  /* hermes pack default: native_tui + --tui */
}
if (route === "native_tui" && argv.length === 0) {
  console.error("pack-agent: native_tui requires non-empty argv in launch.json");
  process.exit(1);
}

let tools = [];
try {
  if (existsSync(toolsJson)) {
    const doc = JSON.parse(readFileSync(toolsJson, "utf8"));
    if (Array.isArray(doc.tools)) {
      tools = doc.tools.filter((t) => typeof t === "string");
    }
  }
} catch {
  /* optional */
}

const meta = {
  route,
  ...(route === "native_tui" ? { argv } : {}),
  name: "hermes",
  package: "hermes.aospkg",
  tools,
};
writeFileSync(metaOut, `${JSON.stringify(meta, null, 2)}\n`);
console.log("pack-agent: wrote", metaOut, JSON.stringify(meta));

console.log("pack-agent: ready", aospkg);
