#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const launch = JSON.parse(readFileSync(join(root, "launch.json"), "utf8"));
const tools = JSON.parse(readFileSync(join(root, "tools-allowlist.json"), "utf8")).tools;
const packed = join(root, "packed");
mkdirSync(packed, { recursive: true });
writeFileSync(join(packed, "codex.aospkg"), "QuantFlow Codex native-TUI adapter\n");
writeFileSync(
  join(packed, "codex.meta.json"),
  `${JSON.stringify({ ...launch, package: "codex.aospkg", tools }, null, 2)}\n`,
);
