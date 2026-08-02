#!/usr/bin/env node
/**
 * Bundle agent-package ACP entrypoint and pack it for AgentOs.create({ software }).
 */
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  rmSync,
  existsSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const agentDir = join(root, "agent-package");
const distDir = join(agentDir, "dist");
const outDir = join(root, "packed");
const aospkg = join(outDir, "qf-toolloop.aospkg");
const metaOut = join(outDir, "qf-toolloop.meta.json");
const launchJson = join(root, "launch.json");

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

const toolchain = process.env.QF_AGENTOS_TOOLCHAIN_BIN ?? join(
  root,
  "node_modules/@rivet-dev/agentos-toolchain/bin/agentos-toolchain.mjs",
);
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
  { cwd: root, stdio: "inherit" },
);
if (pack.status !== 0) process.exit(pack.status ?? 1);

if (!existsSync(aospkg)) {
  console.error("pack-agent: expected", aospkg);
  process.exit(1);
}

if (!existsSync(launchJson)) {
  console.error("pack-agent: expected", launchJson);
  process.exit(1);
}
const launch = JSON.parse(readFileSync(launchJson, "utf8"));
if (launch.route !== "agentos" || launch.name !== "qf-toolloop") {
  console.error("pack-agent: launch.json must declare qf-toolloop on agentos");
  process.exit(1);
}
const meta = {
  route: launch.route,
  name: launch.name,
  package: "qf-toolloop.aospkg",
};
writeFileSync(metaOut, `${JSON.stringify(meta, null, 2)}\n`);
console.log("pack-agent: wrote", metaOut, JSON.stringify(meta));

console.log("pack-agent: ready", aospkg);
