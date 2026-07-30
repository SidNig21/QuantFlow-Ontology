#!/usr/bin/env bun
/**
 * WO-106b acceptance gate — G1 (hole closed), G2 (inside-root publish), G3 (fail closed).
 */
import {
  mkdtempSync,
  mkdirSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { CompatibilityCallToolResult } from "@modelcontextprotocol/sdk/types.js";
import {
  closeKernel,
  contentHash,
  eventCount,
  openKernel,
  type KernelDb,
} from "qf-kernel";
import { schema as productionSchema } from "qf-kernel-schema";
import type { Schema } from "qf-kernel-schema/define";
import { isActionServedToAgents } from "qf-kernel-schema/mcp";

const workDir = mkdtempSync(join(tmpdir(), "qf-publish-artifact-root-"));
/** WO-K3: shape like production — Kernel + artifacts under ~/.quantflow/. */
const fakeHome = join(workDir, "home");
const quantflowDir = join(fakeHome, ".quantflow");
const artifactRootPath = join(quantflowDir, "artifacts");
const kernelDbPath = join(quantflowDir, "kernel.db");
mkdirSync(artifactRootPath, { recursive: true });
const serverEntry = join(import.meta.dir, "..", "server.ts");

/** Action tool names from schema.actions — mirrors registerActionTools / discovery filtering. */
function expectedActionToolNames(schema: Schema, includePublishArtifact: boolean): Set<string> {
  return new Set(
    schema.actions
      .filter(isActionServedToAgents)
      .filter((a) => includePublishArtifact || a.name !== "publish_artifact")
      .map((a) => `qf_${a.name}`),
  );
}

/** Pick action tools out of a tools/list name list by schema membership, not name suffix. */
function actionToolsFromListed(names: Iterable<string>, schema: Schema): Set<string> {
  const allActions = new Set(
    schema.actions
      .filter(isActionServedToAgents)
      .map((a) => `qf_${a.name}`),
  );
  return new Set([...names].filter((n) => allActions.has(n)));
}

function assertActionToolSetEqual(
  actual: Set<string>,
  expected: Set<string>,
  label: string,
): void {
  const missing = [...expected].filter((n) => !actual.has(n)).sort();
  const extra = [...actual].filter((n) => !expected.has(n)).sort();
  if (missing.length === 0 && extra.length === 0) return;
  throw new Error(
    `G3: ${label} action tool set mismatch — missing [${missing.join(", ")}], extra [${extra.join(", ")}]`,
  );
}

function envFor(overrides: Record<string, string>): Record<string, string> {
  const base: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (v !== undefined) base[k] = v;
  }
  return {
    ...base,
    HOME: fakeHome,
    ...overrides,
  };
}

async function makeClient(extraEnv: Record<string, string> = {}): Promise<Client> {
  const transport = new StdioClientTransport({
    command: "bun",
    args: [serverEntry],
    env: envFor({
      QF_KERNEL_DB: kernelDbPath,
      QF_ARTIFACT_ROOT: artifactRootPath,
      ...extraEnv,
    }),
  });
  const client = new Client({ name: "qf-publish-artifact-root-gate", version: "0.1.0" });
  await client.connect(transport);
  return client;
}

function toolText(result: CompatibilityCallToolResult): string {
  if ("toolResult" in result) {
    throw new Error("tool returned toolResult instead of content blocks");
  }
  const text = result.content.find((c) => c.type === "text")?.text;
  if (!text) throw new Error("tool returned no text");
  return text;
}

function artifactRowCount(db: KernelDb): number {
  return (db.query(`SELECT COUNT(*) AS n FROM artifact`).get() as { n: number }).n;
}

function artifactHashes(db: KernelDb): Set<string> {
  const rows = db.query(`SELECT content_hash FROM artifact`).all() as Array<{
    content_hash: string;
  }>;
  return new Set(rows.map((r) => r.content_hash));
}

async function assertRejectedOutsideRoot(
  client: Client,
  label: string,
  path: string,
): Promise<void> {
  const dbBefore = openKernel(kernelDbPath, { readonly: true });
  const eventsBefore = eventCount(dbBefore);
  const rowsBefore = artifactRowCount(dbBefore);
  closeKernel(dbBefore);

  const result = await client.callTool({
    name: "qf_publish_artifact",
    arguments: {
      kind: "report",
      storage_ref: `gate-${label}`,
      path,
    },
  });
  console.log(`G1_${label}_result=${JSON.stringify(result)}`);

  if (!result.isError) {
    throw new Error(`G1 ${label}: path outside root should be rejected`);
  }
  const text = toolText(result);
  if (!text.includes("rejected") && !text.includes("outside")) {
    throw new Error(`G1 ${label}: expected rejection message, got ${text}`);
  }

  const dbAfter = openKernel(kernelDbPath, { readonly: true });
  const eventsAfter = eventCount(dbAfter);
  const rowsAfter = artifactRowCount(dbAfter);
  closeKernel(dbAfter);

  console.log(`G1_${label}_events_before_after=${eventsBefore} ${eventsAfter}`);
  console.log(`G1_${label}_rows_before_after=${rowsBefore} ${rowsAfter}`);
  if (eventsAfter !== eventsBefore) {
    throw new Error(`G1 ${label}: rejection wrote events`);
  }
  if (rowsAfter !== rowsBefore) {
    throw new Error(`G1 ${label}: rejection wrote artifact rows`);
  }
}

async function gateG1(): Promise<void> {
  console.log("\n=== G1 hole closed ===");

  const canaryOutside = join(workDir, "canary-outside.txt");
  writeFileSync(canaryOutside, "qf-106b-canary-outside");

  const traversalTarget = join(workDir, "traversal-target.txt");
  writeFileSync(traversalTarget, "qf-106b-traversal-target");

  const symlinkName = "escape-link";
  const symlinkPath = join(artifactRootPath, symlinkName);
  try {
    symlinkSync(canaryOutside, symlinkPath);
  } catch {
    symlinkSync(canaryOutside, symlinkPath, "file");
  }

  const siblingDir = `${artifactRootPath}-evil`;
  mkdirSync(siblingDir, { recursive: true });
  const siblingFile = join(siblingDir, "x");
  writeFileSync(siblingFile, "qf-106b-prefix-sibling");

  const client = await makeClient();

  await assertRejectedOutsideRoot(client, "absolute_outside", canaryOutside);
  await assertRejectedOutsideRoot(
    client,
    "dotdot_traversal",
    join(artifactRootPath, "..", "traversal-target.txt"),
  );
  await assertRejectedOutsideRoot(client, "symlink_escape", symlinkPath);
  await assertRejectedOutsideRoot(client, "prefix_sibling", siblingFile);

  await client.close();
}

async function gateG2(): Promise<void> {
  console.log("\n=== G2 inside-root publish ===");

  const insideFile = join(artifactRootPath, "inside-report.md");
  const bytes = new TextEncoder().encode("qf-106b-inside-root-publish");
  writeFileSync(insideFile, bytes);
  const expectedHash = contentHash(bytes);

  const client = await makeClient();
  const result = await client.callTool({
    name: "qf_publish_artifact",
    arguments: {
      kind: "report",
      storage_ref: "gate-inside-root",
      path: insideFile,
    },
  });
  console.log(`G2_publish_result=${JSON.stringify(result)}`);
  if (result.isError) {
    throw new Error(`G2: inside-root publish failed: ${toolText(result)}`);
  }

  const payload = JSON.parse(toolText(result)) as { object_id: string; state: { content_hash: string } };
  console.log(`G2_content_hash=${payload.state.content_hash}`);
  console.log(`G2_expected_hash=${expectedHash}`);
  if (payload.state.content_hash !== expectedHash) {
    throw new Error("G2: published content_hash does not match file bytes");
  }

  await client.close();
}

async function gateG3(): Promise<void> {
  console.log("\n=== G3 fail closed ===");

  const canary = join(workDir, "g3-canary.txt");
  writeFileSync(canary, "qf-106b-g3-canary");
  const canaryHash = contentHash(new TextEncoder().encode("qf-106b-g3-canary"));

  const dbBefore = openKernel(kernelDbPath, { readonly: true });
  const eventsBefore = eventCount(dbBefore);
  const rowsBefore = artifactRowCount(dbBefore);
  const hashesBefore = artifactHashes(dbBefore);
  closeKernel(dbBefore);

  const transport = new StdioClientTransport({
    command: "bun",
    args: [serverEntry],
    env: envFor({ QF_KERNEL_DB: kernelDbPath }),
  });
  const client = new Client({ name: "qf-publish-artifact-root-g3", version: "0.1.0" });
  await client.connect(transport);

  const listed = await client.listTools();
  const expectedWithoutRoot = expectedActionToolNames(productionSchema, false);
  const actionTools = actionToolsFromListed(
    listed.tools.map((t) => t.name),
    productionSchema,
  );
  console.log(`G3_total_tools=${listed.tools.length}`);
  console.log(`G3_action_tools=${actionTools.size}`);
  console.log(`G3_action_tool_names=${JSON.stringify([...actionTools].sort())}`);
  console.log(`G3_publish_present=${listed.tools.some((t) => t.name === "qf_publish_artifact")}`);

  if (listed.tools.some((t) => t.name === "qf_publish_artifact")) {
    throw new Error("G3: qf_publish_artifact must be absent from tools/list without QF_ARTIFACT_ROOT");
  }
  assertActionToolSetEqual(actionTools, expectedWithoutRoot, "without root");

  const call = await client.callTool({
    name: "qf_publish_artifact",
    arguments: {
      kind: "report",
      storage_ref: "g3-canary",
      path: canary,
    },
  });
  console.log(`G3_call_result=${JSON.stringify(call)}`);
  if (!call.isError) {
    throw new Error("G3: callTool on unconfigured server should fail");
  }

  const dbAfter = openKernel(kernelDbPath, { readonly: true });
  const eventsAfter = eventCount(dbAfter);
  const rowsAfter = artifactRowCount(dbAfter);
  const hashesAfter = artifactHashes(dbAfter);
  closeKernel(dbAfter);

  console.log(`G3_events_before_after=${eventsBefore} ${eventsAfter}`);
  console.log(`G3_rows_before_after=${rowsBefore} ${rowsAfter}`);
  console.log(`G3_canary_hash_present=${hashesAfter.has(canaryHash)}`);

  if (eventsAfter !== eventsBefore) {
    throw new Error("G3: unconfigured callTool wrote events");
  }
  if (rowsAfter !== rowsBefore) {
    throw new Error("G3: unconfigured callTool wrote artifact rows");
  }
  if (hashesAfter.has(canaryHash)) {
    throw new Error("G3: canary content hash appeared in artifact table");
  }

  const clientWithRoot = await makeClient();
  const listedWithRoot = await clientWithRoot.listTools();
  const expectedWithRoot = expectedActionToolNames(productionSchema, true);
  const actionToolsWithRoot = actionToolsFromListed(
    listedWithRoot.tools.map((t) => t.name),
    productionSchema,
  );
  console.log(`G3_with_root_action_tools=${actionToolsWithRoot.size}`);
  if (!listedWithRoot.tools.some((t) => t.name === "qf_publish_artifact")) {
    throw new Error("G3: qf_publish_artifact must be present when QF_ARTIFACT_ROOT is configured");
  }
  assertActionToolSetEqual(actionToolsWithRoot, expectedWithRoot, "with root");
  await clientWithRoot.close();
  await client.close();
}

async function measureServedActionCounts(): Promise<void> {
  console.log("\n=== served action counts ===");
  const expectedWithRoot = expectedActionToolNames(productionSchema, true);
  const expectedWithoutRoot = expectedActionToolNames(productionSchema, false);

  const clientWithRoot = await makeClient();
  const withRoot = await clientWithRoot.listTools();
  const actionsWithRoot = actionToolsFromListed(
    withRoot.tools.map((t) => t.name),
    productionSchema,
  );
  await clientWithRoot.close();

  const transport = new StdioClientTransport({
    command: "bun",
    args: [serverEntry],
    env: envFor({ QF_KERNEL_DB: kernelDbPath }),
  });
  const clientNoRoot = new Client({ name: "qf-publish-artifact-root-count", version: "0.1.0" });
  await clientNoRoot.connect(transport);
  const withoutRoot = await clientNoRoot.listTools();
  const actionsWithoutRoot = actionToolsFromListed(
    withoutRoot.tools.map((t) => t.name),
    productionSchema,
  );
  await clientNoRoot.close();

  console.log(`served_action_count_with_root=${actionsWithRoot.size}`);
  console.log(`served_action_count_without_root=${actionsWithoutRoot.size}`);
  assertActionToolSetEqual(actionsWithRoot, expectedWithRoot, "with root");
  assertActionToolSetEqual(actionsWithoutRoot, expectedWithoutRoot, "without root");
}

export async function runPublishArtifactRootGate(): Promise<void> {
  const db = openKernel(kernelDbPath, { create: true });
  closeKernel(db);

  await gateG1();
  await gateG2();
  await gateG3();
  await measureServedActionCounts();
  console.log("publish-artifact-root PASS");
}

if (import.meta.main) {
  runPublishArtifactRootGate().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
