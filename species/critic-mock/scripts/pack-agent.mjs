#!/usr/bin/env node
/**
 * Bundle critic-mock ACP guest and pack for AgentOs / dock spawn.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const agentDir = join(root, "agent-package");
const distDir = join(agentDir, "dist");
const outDir = join(root, "packed");
const aospkg = join(outDir, "critic-mock.aospkg");
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
    join(agentDir, "src/acp-main.ts"),
    "--outfile",
    join(distDir, "acp-main.js"),
    "--target",
    "node",
    "--format",
    "esm",
  ],
  {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_PATH: join(root, "node_modules"),
    },
  },
);
if (bundle.status !== 0) process.exit(bundle.status ?? 1);

const pack = spawnSync(
  "node",
  [
    toolchain,
    "pack",
    agentDir,
    "--agent",
    "critic-mock-acp",
    "--out",
    join(outDir, "critic-mock.tar"),
  ],
  { cwd: root, stdio: "inherit" },
);
if (pack.status !== 0) process.exit(pack.status ?? 1);

if (!existsSync(aospkg)) {
  console.error("pack-agent: expected", aospkg);
  process.exit(1);
}

console.log("pack-agent: ready", aospkg);
