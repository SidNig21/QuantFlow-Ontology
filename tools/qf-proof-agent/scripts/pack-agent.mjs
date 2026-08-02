#!/usr/bin/env node
import {
  copyFileSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "src/qf-proof-agent.mjs");
const outDir = join(root, "packed");
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
copyFileSync(source, join(outDir, "qf-proof-agent.mjs"));
writeFileSync(
  join(outDir, "qf-proof-agent.aospkg"),
  "QuantFlow deterministic proof agent package\n",
  "utf8",
);
writeFileSync(
  join(outDir, "qf-proof-agent.meta.json"),
  `${JSON.stringify({
    route: "native_tui",
    name: "qf-proof-agent",
    command: "node",
    entrypoint: "qf-proof-agent.mjs",
    profile_argv: ["--profile", "{runtime_profile}"],
    package: "qf-proof-agent.aospkg",
    tools: [],
  }, null, 2)}\n`,
  "utf8",
);
console.log("pack-agent: ready qf-proof-agent");
