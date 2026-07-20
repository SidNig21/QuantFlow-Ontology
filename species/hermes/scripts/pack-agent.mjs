#!/usr/bin/env node
/**
 * Bundle the Hermes ACP shim and pack agent-package/ for AgentOs.
 *
 * Also writes packed/hermes.meta.json with `launch` (WO-008c D1) — the
 * AgentOS toolchain strips unknown fields from the packed agentos-package.json,
 * so deploy-true launch routing reads this sibling meta (and/or species/launch.json).
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

// Deploy-true launch bit (toolchain drops top-level `launch` from packed JSON).
let launch = "host_acp";
try {
  if (existsSync(launchJson)) {
    const doc = JSON.parse(readFileSync(launchJson, "utf8"));
    if (doc.launch === "host_acp" || doc.launch === "agentos") launch = doc.launch;
  } else {
    const src = JSON.parse(
      readFileSync(join(agentDir, "agentos-package.json"), "utf8"),
    );
    if (src.launch === "host_acp" || src.launch === "agentos") launch = src.launch;
  }
} catch {
  /* keep default host_acp for hermes */
}
const meta = { launch, name: "hermes", package: "hermes.aospkg" };
writeFileSync(metaOut, `${JSON.stringify(meta, null, 2)}\n`);
console.log("pack-agent: wrote", metaOut, JSON.stringify(meta));

console.log("pack-agent: ready", aospkg);
