#!/usr/bin/env bun
/**
 * qf-peer-bus cold proof.
 *
 * No credentials, no live model calls: two independent MCP *client*
 * processes (this file spawns two real subprocesses running src/server.ts,
 * one per role) exchange messages over a real stdio MCP transport, sharing
 * one peer-bus.db (transport state) and one kernel.db (domain truth).
 *
 * Sequence:
 *   1. orchestrator --send_to_peer--> worker            (TASK)
 *   2. worker       --read_inbox-->   sees the TASK
 *   3. worker       --send_to_peer--> orchestrator      (RESULT)
 *   4. orchestrator --read_inbox-->   sees the RESULT
 *   5. re-open kernel.db fresh, independently of both servers, and assert
 *      both message bodies exist as trajectory artifacts whose stored
 *      content_hash equals contentHash(bytes) of the body.
 *   6. Falsification: relaunch with QF_PEER_DELIVERY=off on the sending
 *      process -> the artifact still lands in the Kernel but the recipient's
 *      inbox stays empty (RED). Restore -> it delivers again (GREEN).
 *
 * Exits non-zero on any failed assertion. No mocks: real subprocess stdio
 * MCP transport, real qf-kernel execute() calls.
 */
import { randomUUID } from "node:crypto";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { closeKernel, contentHash, openKernel, type KernelDb } from "qf-kernel";
import type { PeerMessage } from "./bus.ts";

// ---------------------------------------------------------------------------
// Fresh, isolated working directory for this run's two db files.
// ---------------------------------------------------------------------------
const workDir = mkdtempSync(join(tmpdir(), "qf-peer-bus-harness-"));
const kernelDbPath = join(workDir, "kernel.db");
const busDbPath = join(workDir, "peer-bus.db");
const serverEntry = join(import.meta.dir, "server.ts");

console.log(`[harness] work dir: ${workDir}`);
console.log(`[harness] kernel db: ${kernelDbPath}`);
console.log(`[harness] bus db:    ${busDbPath}`);

let failures = 0;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    failures += 1;
    console.error(`ASSERTION FAILED: ${message}`);
  } else {
    console.log(`  ok — ${message}`);
  }
}

function fatal(message: string): never {
  console.error(`FATAL: ${message}`);
  process.exitCode = 1;
  throw new Error(message);
}

/** Full parent env, as strings only, plus this call's overrides. */
function envFor(overrides: Record<string, string>): Record<string, string> {
  const base: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (v !== undefined) base[k] = v;
  }
  return { ...base, ...overrides };
}

type ToolTextResult = { content: Array<{ type: string; text: string }> };

/** Every tool response here ends its text block with one JSON line. */
function parseToolJson<T>(raw: unknown): T {
  const result = raw as ToolTextResult;
  const block = result.content?.find((c) => c.type === "text");
  if (!block?.text) fatal("tool result carried no text content block");
  const lines = block.text.trim().split("\n");
  const lastLine = lines[lines.length - 1] ?? "";
  return JSON.parse(lastLine) as T;
}

type SendJson = { artifactId: string; messageId: string; delivered: boolean };

/** Spawn a fresh qf-peer-bus MCP server subprocess for `role` and connect a client to it. */
async function makeClient(role: string, extraEnv: Record<string, string> = {}): Promise<Client> {
  const transport = new StdioClientTransport({
    command: "bun",
    args: [serverEntry],
    env: envFor({
      QF_PEER_ROLE: role,
      QF_KERNEL_DB: kernelDbPath,
      QF_PEER_BUS_DB: busDbPath,
      ...extraEnv,
    }),
  });
  const client = new Client({ name: `qf-peer-bus-harness-${role}`, version: "0.1.0" });
  await client.connect(transport);
  return client;
}

/** Spawn a role client, run `fn`, then always close the client (kills the subprocess). */
async function withClient<T>(
  role: string,
  extraEnv: Record<string, string>,
  fn: (client: Client) => Promise<T>,
): Promise<T> {
  const client = await makeClient(role, extraEnv);
  try {
    return await fn(client);
  } finally {
    await client.close();
  }
}

async function callTool(
  client: Client,
  name: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  return client.callTool({ name, arguments: args });
}

async function main(): Promise<void> {
  const runId = randomUUID();
  const taskBody = `TASK-${runId}: summarize the plan`;
  const resultBody = `RESULT-${runId}: done`;

  // -------------------------------------------------------------------
  // Round trip: two long-lived clients for this phase, one per role.
  // -------------------------------------------------------------------
  console.log("\n=== round trip ===");
  const orchestrator = await makeClient("orchestrator");
  const worker = await makeClient("worker");

  let taskArtifactId = "";
  let resultArtifactId = "";

  try {
    const sendTask = parseToolJson<SendJson>(
      await callTool(orchestrator, "send_to_peer", { to: "worker", message: taskBody }),
    );
    assert(sendTask.delivered === true, "orchestrator->worker send reports delivered:true");
    taskArtifactId = sendTask.artifactId;

    const workerInbox = parseToolJson<PeerMessage[]>(
      await callTool(worker, "read_inbox", {}),
    );
    assert(
      workerInbox.some((m) => m.body === taskBody && m.artifact_id === taskArtifactId),
      "worker inbox contains the TASK message with matching artifact id",
    );

    const sendResult = parseToolJson<SendJson>(
      await callTool(worker, "send_to_peer", { to: "orchestrator", message: resultBody }),
    );
    assert(sendResult.delivered === true, "worker->orchestrator send reports delivered:true");
    resultArtifactId = sendResult.artifactId;

    const orchestratorInbox = parseToolJson<PeerMessage[]>(
      await callTool(orchestrator, "read_inbox", {}),
    );
    assert(
      orchestratorInbox.some(
        (m) => m.body === resultBody && m.artifact_id === resultArtifactId,
      ),
      "orchestrator inbox contains the RESULT message with matching artifact id",
    );
  } finally {
    await orchestrator.close();
    await worker.close();
  }

  // -------------------------------------------------------------------
  // Independent re-query: open kernel.db fresh (a *third* handle, not
  // either server's) and assert both artifacts are really there, with
  // Kernel-computed content hashes matching the message bytes.
  // -------------------------------------------------------------------
  console.log("\n=== independent Kernel re-query ===");
  let freshKernel: KernelDb = openKernel(kernelDbPath);
  try {
    const rows = freshKernel
      .query(`SELECT id, kind, content_hash, storage_ref FROM artifact ORDER BY created_at ASC`)
      .all() as Array<{ id: string; kind: string; content_hash: string; storage_ref: string }>;

    const taskHash = contentHash(new TextEncoder().encode(taskBody));
    const resultHash = contentHash(new TextEncoder().encode(resultBody));

    const taskRow = rows.find((r) => r.id === taskArtifactId);
    const resultRow = rows.find((r) => r.id === resultArtifactId);

    assert(rows.length === 2, `kernel.db has exactly 2 artifacts at this point (found ${rows.length})`);
    assert(!!taskRow, "TASK artifact row exists in kernel.db");
    assert(taskRow?.kind === "trajectory", "TASK artifact kind === trajectory");
    assert(taskRow?.content_hash === taskHash, "TASK artifact content_hash === contentHash(taskBody bytes)");
    assert(taskRow?.id === taskHash, "TASK artifact id === contentHash(taskBody bytes) (id IS the hash)");
    assert(!!resultRow, "RESULT artifact row exists in kernel.db");
    assert(resultRow?.kind === "trajectory", "RESULT artifact kind === trajectory");
    assert(
      resultRow?.content_hash === resultHash,
      "RESULT artifact content_hash === contentHash(resultBody bytes)",
    );
    assert(resultRow?.id === resultHash, "RESULT artifact id === contentHash(resultBody bytes) (id IS the hash)");

    if (failures > 0) fatal(`${failures} assertion(s) failed during round-trip verification`);

    console.log(
      `\nROUND-TRIP OK — task artifact ${taskArtifactId} · result artifact ${resultArtifactId}`,
    );
  } finally {
    closeKernel(freshKernel);
  }

  // -------------------------------------------------------------------
  // Falsification. QF_PEER_DELIVERY=off is checked inside PeerBus#send()
  // in whichever process actually calls it — i.e. the *sender's* server
  // process, since that's the process that decides whether to insert the
  // inbox row. To reproduce "orchestrator sends, worker's inbox stays
  // empty", the flag goes on the orchestrator's relaunched server (the
  // one executing send_to_peer for this leg); the Kernel write is
  // unconditional either way, which is exactly what's being falsified —
  // the bus's delivery guarantee, never the Kernel's record.
  // -------------------------------------------------------------------
  console.log("\n=== falsification: QF_PEER_DELIVERY ===");
  const redBody = `FALSIFY-${runId}: red probe (delivery off)`;
  const greenBody = `FALSIFY-${runId}: green probe (delivery restored)`;

  const redSend = await withClient("orchestrator", { QF_PEER_DELIVERY: "off" }, (client) =>
    callTool(client, "send_to_peer", { to: "worker", message: redBody }).then((r) =>
      parseToolJson<SendJson>(r),
    ),
  );
  assert(redSend.delivered === false, "send with QF_PEER_DELIVERY=off reports delivered:false");

  const redInbox = await withClient("worker", {}, (client) =>
    callTool(client, "read_inbox", {}).then((r) => parseToolJson<PeerMessage[]>(r)),
  );
  assert(
    !redInbox.some((m) => m.body === redBody),
    "worker inbox does NOT contain the delivery-suppressed message",
  );
  if (failures > 0) fatal(`${failures} assertion(s) failed during falsify-RED`);
  console.log("FALSIFY RED: delivery off → inbox empty ✓");

  const greenSend = await withClient("orchestrator", {}, (client) =>
    callTool(client, "send_to_peer", { to: "worker", message: greenBody }).then((r) =>
      parseToolJson<SendJson>(r),
    ),
  );
  assert(greenSend.delivered === true, "send with QF_PEER_DELIVERY restored reports delivered:true");

  const greenInbox = await withClient("worker", {}, (client) =>
    callTool(client, "read_inbox", {}).then((r) => parseToolJson<PeerMessage[]>(r)),
  );
  assert(
    greenInbox.some((m) => m.body === greenBody),
    "worker inbox DOES contain the message once delivery is restored",
  );
  if (failures > 0) fatal(`${failures} assertion(s) failed during falsify-GREEN`);
  console.log("FALSIFY GREEN: delivery on → delivered ✓");

  // -------------------------------------------------------------------
  // Final proof that the falsified send was still Kernel-recorded: the
  // suppressed message's artifact exists even though it was never
  // delivered. This is the load-bearing claim of the whole order — the
  // Kernel is the domain-truth writer, the bus is just routing.
  // -------------------------------------------------------------------
  const finalKernel = openKernel(kernelDbPath);
  try {
    const redHash = contentHash(new TextEncoder().encode(redBody));
    const row = finalKernel
      .query(`SELECT id, kind, content_hash FROM artifact WHERE id = ?`)
      .get(redHash) as { id: string; kind: string; content_hash: string } | null;
    assert(
      !!row && row.kind === "trajectory" && row.content_hash === redHash,
      "the delivery-suppressed message was still recorded to the Kernel as a trajectory artifact",
    );
    const allRows = finalKernel.query(`SELECT id FROM artifact`).all() as Array<{ id: string }>;
    assert(
      allRows.length === 4,
      `kernel.db has exactly 4 artifacts by end of run (task, result, red, green) — found ${allRows.length}`,
    );
    if (failures > 0) fatal(`${failures} assertion(s) failed during final Kernel check`);
    console.log(
      `\nKernel recorded the delivery-suppressed message anyway: artifact ${row?.id} ` +
        `(kind=trajectory) — the bus suppressed routing, the Kernel did not suppress the record.`,
    );
  } finally {
    closeKernel(finalKernel);
  }

  console.log("\nAll assertions passed. Exiting 0.");
}

main()
  .then(() => {
    process.exitCode = failures > 0 ? 1 : 0;
    if (failures === 0) {
      console.log(`\n[harness] db files left on disk for inspection: ${workDir}`);
    }
  })
  .catch((err) => {
    console.error("\nharness failed:", err instanceof Error ? err.message : err);
    console.error(`[harness] db files left on disk for post-mortem: ${workDir}`);
    process.exitCode = 1;
  });
