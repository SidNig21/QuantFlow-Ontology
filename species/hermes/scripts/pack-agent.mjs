#!/usr/bin/env node
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const launchPath = join(root, "launch.json");
const toolsPath = join(root, "tools-allowlist.json");
const packedDir = join(root, "packed");
const markerPath = join(packedDir, "hermes.aospkg");
const metadataPath = join(packedDir, "hermes.meta.json");
const marker = "QuantFlow Hermes native-TUI adapter\n";

function fail(message) {
  console.error(`pack-agent: ${message}`);
  process.exitCode = 1;
  throw new Error(message);
}

function readObject(path, label) {
  let value;
  try {
    value = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`${label} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be an object`);
  return value;
}

function requireString(value, label) {
  if (typeof value !== "string" || value.length === 0) fail(`${label} must be a non-empty string`);
  return value;
}

function requireStringArray(value, label) {
  if (!Array.isArray(value) || value.length === 0 || value.some((entry) => typeof entry !== "string" || entry.length === 0)) {
    fail(`${label} must be a non-empty string array`);
  }
  if (new Set(value).size !== value.length) fail(`${label} must not contain duplicates`);
  return value;
}

const launch = readObject(launchPath, "launch.json");
if (launch.route !== "native_tui") fail("launch.json route must be native_tui");
if (launch.name !== "hermes") fail("launch.json name must be hermes");
const command = requireString(launch.command, "launch.json command");
const terminalTarget = requireString(launch.terminal_target, "launch.json terminal_target");
const argv = requireStringArray(launch.argv, "launch.json argv");
if (!launch.peer_delivery || typeof launch.peer_delivery !== "object" || Array.isArray(launch.peer_delivery)) {
  fail("launch.json peer_delivery must be an object");
}
if (launch.peer_delivery.mode !== "pty_role") fail("launch.json peer_delivery.mode must be pty_role");
const runtimeProfiles = requireStringArray(
  launch.peer_delivery.runtime_profiles,
  "launch.json peer_delivery.runtime_profiles",
);

const toolsDocument = readObject(toolsPath, "tools-allowlist.json");
const tools = requireStringArray(toolsDocument.tools, "tools-allowlist.json tools");
const metadata = {
  route: launch.route,
  name: launch.name,
  command,
  terminal_target: terminalTarget,
  argv,
  peer_delivery: {
    mode: launch.peer_delivery.mode,
    runtime_profiles: runtimeProfiles,
  },
  package: "hermes.aospkg",
  tools,
};

mkdirSync(packedDir, { recursive: true });
writeFileSync(markerPath, marker, "utf8");
writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
console.log(`pack-agent: wrote ${markerPath} and ${metadataPath}`);
