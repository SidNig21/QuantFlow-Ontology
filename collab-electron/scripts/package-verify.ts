#!/usr/bin/env bun
/**
 * Verification-only unsigned Linux directory package command (WO-CI2 D1).
 * Never reads credentials, signs, uploads, or builds an AppImage.
 */
import { createWriteStream } from "node:fs";
import { mkdirSync, rmSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadLinuxFileSets } from "./package-lib/extra-resources.ts";
import { preflightLinuxExtraResources } from "./package-lib/preflight.ts";
import {
  createReceiptFromLog,
  writePackageReceipt,
} from "./package-lib/package-receipt.ts";
import { prepareRuntimeStaging, RUNTIME_FILES } from "./package-lib/runtime-staging.ts";
import { inspectPackagedResources } from "./package-lib/package-inspect.ts";
import { createPackageRunId } from "./package-lib/run-id.ts";

const collabRoot = resolve(join(fileURLToPath(import.meta.url), "..", ".."));
const repoRoot = resolve(join(collabRoot, ".."));
const stagingRoot = join(collabRoot, ".package-staging");
const verifyDir = join(collabRoot, ".package-verify");
const distDir = join(collabRoot, "dist");
const packageRoot = join(distDir, "linux-unpacked");
const resourcesRoot = join(packageRoot, "resources");
const logPath = join(verifyDir, "electron-builder.log");

function fail(message: string): never {
  console.error(`package:verify: ${message}`);
  process.exit(1);
}

if (process.platform !== "linux") {
  fail("linux-only verification package command");
}

const runId = process.env.QF_RELEASE_RUN_ID?.trim() || createPackageRunId();
console.log(`package:verify: runId=${runId}`);

rmSync(distDir, { recursive: true, force: true });
rmSync(stagingRoot, { recursive: true, force: true });
rmSync(verifyDir, { recursive: true, force: true });
mkdirSync(verifyDir, { recursive: true });

prepareRuntimeStaging({ stagingRoot, repoRoot });

const fileSets = loadLinuxFileSets(collabRoot);
const preflight = preflightLinuxExtraResources(collabRoot, fileSets);
if (!preflight.ok) {
  fail(preflight.reason);
}

const logStream = createWriteStream(logPath, { flags: "w" });
const child = Bun.spawn(
  [
    process.execPath,
    join(collabRoot, "scripts/run-local-bin.mjs"),
    "electron-builder",
    "--dir",
    "--linux",
    "--x64",
    "--config.npmRebuild=false",
    "--publish",
    "never",
  ],
  {
    cwd: collabRoot,
    stdout: "pipe",
    stderr: "pipe",
    env: process.env,
  },
);

async function pipe(stream: ReadableStream<Uint8Array>, label: "stdout" | "stderr") {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value);
    process[label].write(text);
    logStream.write(text);
  }
}

await Promise.all([pipe(child.stdout, "stdout"), pipe(child.stderr, "stderr")]);
const builderCode = await child.exited;
logStream.end();
await Bun.sleep(50);

if (builderCode !== 0) {
  fail(`electron-builder exited ${builderCode}`);
}

if (!statSync(logPath).size) {
  fail("electron-builder log is empty");
}

const inspect = inspectPackagedResources(resourcesRoot, collabRoot, fileSets);
if (!inspect.ok) {
  fail(inspect.reason);
}

for (const rel of RUNTIME_FILES) {
  const abs = join(resourcesRoot, rel);
  if (!statSync(abs).size) {
    fail(`required runtime file empty after package: ${abs}`);
  }
}

const receipt = createReceiptFromLog(runId, packageRoot, logPath);
writePackageReceipt(packageRoot, receipt);

console.log("package:verify: PASS");
for (const entry of inspect.checkedPaths) {
  console.log(`package:verify: checked ${entry.path} (${entry.bytes} bytes)`);
}
