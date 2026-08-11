import { afterEach, expect, test } from "bun:test";
import { join } from "node:path";
import * as pty from "node-pty";
import { createLauncherReadinessWaiter } from "./launcher-readiness";

const processes: pty.IPty[] = [];

afterEach(() => {
  for (const process of processes.splice(0)) {
    try { process.kill(); } catch { /* already exited */ }
  }
});

test("packaged proof adapter handshake survives a real Windows PTY", async () => {
  if (process.platform !== "win32") return;
  const node = Bun.which("node");
  expect(node).toBeTruthy();
  const repoRoot = join(import.meta.dir, "../../..");
  const nonce = "pty-proof-nonce";
  const waiter = createLauncherReadinessWaiter("pty-proof-session", nonce, 5_000);
  const child = pty.spawn(
    node!,
    [join(repoRoot, "tools/qf-proof-agent/packed/qf-proof-agent.mjs")],
    {
      name: "xterm-256color",
      cols: 80,
      rows: 24,
      cwd: repoRoot,
      env: {
        ...process.env,
        QF_PEER_ROLE: "orchestrator",
        QF_AGENT_SESSION_ID: "pty-proof-session",
        QF_LAUNCH_READY_NONCE: nonce,
        QF_COLLABORATION_MCP_PATH: join(repoRoot, "collab-electron/cli/qf-collaboration-mcp.mjs"),
        QF_ONTOLOGY_MCP_PATH: join(repoRoot, "collab-electron/cli/qf-ontology-mcp.mjs"),
      },
      encoding: null,
    },
  );
  processes.push(child);
  let output = "";
  child.onData((data) => {
    const bytes = Buffer.isBuffer(data) ? data : Buffer.from(data);
    output += bytes.toString("utf8");
    waiter.push(bytes);
  });
  try {
    await waiter.wait();
  } catch (error) {
    throw new Error(`handshake output=${JSON.stringify(output)}`, { cause: error });
  }
}, 10_000);
