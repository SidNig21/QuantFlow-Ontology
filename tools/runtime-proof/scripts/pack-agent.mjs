#!/usr/bin/env node
/**
 * Bundle agent-package ACP entrypoint and pack it for AgentOs.create({ software }).
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const agentDir = join(root, "agent-package");
const distDir = join(agentDir, "dist");
const outDir = join(root, "packed");
const aospkg = join(outDir, "qf-toolloop.aospkg");

rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });
mkdirSync(outDir, { recursive: true });

const bundle = spawnSync(
  "bun",
  [
    "build",
    join(agentDir, "src/acp-main.ts"),
    "--outfile",
    join(distDir, "acp-main.js"),
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
    join(root, "node_modules/@rivet-dev/agentos-toolchain/bin/agentos-toolchain.mjs"),
    "pack",
    agentDir,
    "--agent",
    "qf-toolloop-acp",
    "--out",
    join(outDir, "qf-toolloop.tar"),
  ],
  { cwd: root, stdio: "inherit" },
);
if (pack.status !== 0) process.exit(pack.status ?? 1);

if (!existsSync(aospkg)) {
  console.error("pack-agent: expected", aospkg);
  process.exit(1);
}

console.log("pack-agent: ready", aospkg);
