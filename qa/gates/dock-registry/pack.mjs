#!/usr/bin/env node
/**
 * Pack qf-toolloop into this package's packed/ using the repo's agent-package
 * sources (tools/runtime-proof/agent-package — in git) and this package's
 * agentos-toolchain (installed here, not free-riding on runtime-proof).
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "../../..");
const agentDir = join(repo, "tools/runtime-proof/agent-package");
const distDir = join(agentDir, "dist");
const outDir = join(here, "packed");
const aospkg = join(outDir, "qf-toolloop.aospkg");
const toolchain = join(
  here,
  "node_modules/@rivet-dev/agentos-toolchain/bin/agentos-toolchain.mjs",
);

if (!existsSync(agentDir)) {
  console.error("pack: missing agent-package at", agentDir);
  process.exit(1);
}
if (!existsSync(toolchain)) {
  console.error("pack: missing agentos-toolchain — run bun install in", here);
  process.exit(1);
}

rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });
mkdirSync(outDir, { recursive: true });

// Resolve guest deps from this package's node_modules (cold-safe).
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
    cwd: here,
    stdio: "inherit",
    env: {
      ...process.env,
      // Prefer this package's install over a missing agent-package/node_modules.
      NODE_PATH: join(here, "node_modules"),
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
    "qf-toolloop-acp",
    "--out",
    join(outDir, "qf-toolloop.tar"),
  ],
  { cwd: here, stdio: "inherit" },
);
if (pack.status !== 0) process.exit(pack.status ?? 1);

if (!existsSync(aospkg)) {
  console.error("pack: expected", aospkg);
  process.exit(1);
}
console.log("pack: ready", aospkg);
