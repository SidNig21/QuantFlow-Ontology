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
const source = join(root, "src/claude-code.mjs");
const outDir = join(root, "packed");
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
copyFileSync(source, join(outDir, "claude-code.mjs"));
writeFileSync(
  join(outDir, "claude-code.aospkg"),
  "QuantFlow Claude Code adapter package\n",
  "utf8",
);
writeFileSync(
  join(outDir, "claude-code.meta.json"),
  `${JSON.stringify({
    route: "native_tui",
    name: "claude-code",
    command: "node",
    entrypoint: "claude-code.mjs",
    profile_argv: ["--profile", "{runtime_profile}"],
    package: "claude-code.aospkg",
    tools: [],
  }, null, 2)}\n`,
  "utf8",
);
console.log("pack-agent: ready claude-code");
