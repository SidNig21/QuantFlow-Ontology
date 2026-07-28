/**
 * WO-K1 G4 — one world end-to-end via seat-shaped MCP subprocess.
 *
 * Starts tools/qf-read-tools/src/server.ts over StdioClientTransport with an
 * explicitly constructed env that OMITs QF_KERNEL_DB, and HOME pointed at a
 * temp sandbox. Does NOT use harness envFor (that cannot delete a key).
 *
 * Receipts: child's D4 boot line (provenance=default + sandboxed path) and a
 * row written by the parent read back through a tool.
 */
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { closeKernel, execute, openKernel } from "qf-kernel";

const serverEntry = join(import.meta.dir, "../server.ts");

export async function runKernelOneWorldGate(): Promise<number> {
  const savedPin = process.env.QF_KERNEL_DB;
  const savedHome = process.env.HOME;
  delete process.env.QF_KERNEL_DB;

  const sandboxHome = mkdtempSync(join(tmpdir(), "qf-g4-home-"));
  mkdirSync(join(sandboxHome, ".quantflow"), { recursive: true });
  const dbPath = join(sandboxHome, ".quantflow", "kernel.db");

  process.env.HOME = sandboxHome;
  process.env.QF_KERNEL_SYNC_UNSAFE_FIXTURES_ONLY = "1";

  const writer = openKernel(dbPath, { create: true, provenance: "explicit" });
  const created = execute(
    writer,
    "create_hypothesis",
    {
      claim: "WO-K1 G4 shared world",
      success_criteria: "row readable via unpinned MCP seat",
    },
    { trace_id: "g4-trace", span_id: "g4-span" },
  );
  const hypId = created.object_id;
  closeKernel(writer);

  // Explicit omit — do not spread process.env. SDK merges defaults underneath.
  const childEnv: Record<string, string> = {
    HOME: sandboxHome,
    PATH: process.env.PATH ?? "/usr/bin:/bin",
    QF_KERNEL_SYNC_UNSAFE_FIXTURES_ONLY: "1",
  };

  let stderrText = "";
  const transport = new StdioClientTransport({
    command: "bun",
    args: [serverEntry],
    env: childEnv,
    stderr: "pipe",
  });
  const stderrStream = transport.stderr;
  if (stderrStream) {
    stderrStream.on("data", (chunk: Buffer) => {
      stderrText += chunk.toString("utf8");
    });
  }

  const client = new Client({ name: "kernel-one-world-g4", version: "0.1.0" });
  try {
    await client.connect(transport);
    await Bun.sleep(80);

    const result = await client.callTool({
      name: "qf_hypothesis_get",
      arguments: { id: hypId },
    });
    const text =
      "content" in result
        ? (result.content as Array<{ type: string; text?: string }>).find(
            (c) => c.type === "text",
          )?.text
        : undefined;
    if (!text || !text.includes(hypId)) {
      console.error("kernel-one-world G4 FAIL: read tool missed written row");
      console.error("  tool text:", text);
      console.error("  child stderr:", stderrText);
      return 1;
    }

    const boot = stderrText
      .split("\n")
      .find((l) => l.startsWith("kernel:"));
    if (!boot || !/provenance=default/.test(boot)) {
      console.error(
        "kernel-one-world G4 FAIL: child D4 boot missing provenance=default",
      );
      console.error("  child stderr:", stderrText);
      return 1;
    }
    if (!boot.includes(sandboxHome)) {
      console.error(
        "kernel-one-world G4 FAIL: child path not inside sandboxed HOME",
      );
      console.error("  boot:", boot);
      return 1;
    }
    if (/provenance=env/.test(boot)) {
      console.error("kernel-one-world G4 FAIL: pin leaked (provenance=env)");
      console.error("  boot:", boot);
      return 1;
    }

    console.log("kernel-one-world G4 PASS");
    console.log("  child D4 boot line:", boot);
    console.log("  row round-trip id:", hypId);
    return 0;
  } catch (err) {
    console.error("kernel-one-world G4 FAIL:", err);
    console.error("  child stderr:", stderrText);
    return 1;
  } finally {
    try {
      await client.close();
    } catch {
      /* ignore */
    }
    rmSync(sandboxHome, { recursive: true, force: true });
    if (savedPin !== undefined) process.env.QF_KERNEL_DB = savedPin;
    else delete process.env.QF_KERNEL_DB;
    if (savedHome !== undefined) process.env.HOME = savedHome;
    else delete process.env.HOME;
    delete process.env.QF_KERNEL_SYNC_UNSAFE_FIXTURES_ONLY;
  }
}

if (import.meta.main) {
  process.exit(await runKernelOneWorldGate());
}
