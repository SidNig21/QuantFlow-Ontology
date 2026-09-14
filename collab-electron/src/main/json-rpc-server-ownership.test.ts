import { expect, test } from "bun:test";
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createConnection } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

function waitForOutput(child: ChildProcess, marker: string): Promise<void> {
  return new Promise((resolve, reject) => {
    let output = "";
    const timer = setTimeout(() => reject(new Error(`child did not print ${marker}: ${output}`)), 10_000);
    const append = (chunk: Buffer) => {
      output += chunk.toString();
      if (!output.includes(marker)) return;
      clearTimeout(timer);
      resolve();
    };
    child.stdout?.on("data", append);
    child.stderr?.on("data", append);
    child.once("error", reject);
    child.once("exit", (code) => {
      if (!output.includes(marker)) {
        clearTimeout(timer);
        reject(new Error(`child exited ${String(code)} before ${marker}: ${output}`));
      }
    });
  });
}

function waitForExit(child: ChildProcess): Promise<number | null> {
  if (child.exitCode !== null) return Promise.resolve(child.exitCode);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("child did not exit")), 10_000);
    child.once("exit", (code) => {
      clearTimeout(timer);
      resolve(code);
    });
    child.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

function ping(endpoint: string): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const socket = createConnection(endpoint);
    let buffer = "";
    socket.setTimeout(10_000, () => socket.destroy(new Error("broker ping timed out")));
    socket.on("connect", () => socket.write(`${JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping", params: {} })}\n`));
    socket.on("data", (chunk) => {
      buffer += chunk.toString();
      const newline = buffer.indexOf("\n");
      if (newline < 0) return;
      socket.destroy();
      const response = JSON.parse(buffer.slice(0, newline));
      if (response.error) reject(new Error(response.error.message));
      else resolve(response.result);
    });
    socket.once("error", reject);
  });
}

test("a refused broker contender preserves the owning broker and breadcrumbs", async () => {
  const root = mkdtempSync(join(tmpdir(), "qf-rpc-owner-"));
  const bundleRoot = join(root, "bundle");
  const built = await Bun.build({
    entrypoints: [join(import.meta.dir, "json-rpc-server.ts")],
    outdir: bundleRoot,
    target: "node",
    format: "esm",
  });
  expect(built.success).toBe(true);
  const bundle = built.outputs[0]?.path;
  if (!bundle) throw new Error("JSON-RPC ownership test bundle is missing");

  const appRoot = join(root, "app-root");
  const appDir = join(appRoot, "profile");
  const env = { ...process.env, QF_APP_ROOT: appRoot, QF_APP_DIR: appDir };
  const moduleUrl = pathToFileURL(bundle).href;
  const ownerScript = `const m=await import(${JSON.stringify(moduleUrl)});m.registerMethod("ping",()=>({pong:true}));await m.startJsonRpcServer();console.log("OWNER_READY");process.stdin.once("data",()=>{m.stopJsonRpcServer();process.exit(0)});process.stdin.resume();`;
  const contenderScript = `const m=await import(${JSON.stringify(moduleUrl)});try{await m.startJsonRpcServer();m.stopJsonRpcServer();console.log("CONTENDER_UNEXPECTED");process.exit(2)}catch{m.stopJsonRpcServer();console.log("CONTENDER_REFUSED")}`;
  const owner = spawn("node", ["--input-type=module", "-e", ownerScript], {
    env,
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
  });
  let contender: ChildProcess | undefined;
  try {
    await waitForOutput(owner, "OWNER_READY");
    const breadcrumb = join(appRoot, "socket-path");
    expect(existsSync(breadcrumb)).toBe(true);
    const endpoint = readFileSync(breadcrumb, "utf8");

    contender = spawn("node", ["--input-type=module", "-e", contenderScript], {
      env,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    await waitForOutput(contender, "CONTENDER_REFUSED");
    expect(await waitForExit(contender)).toBe(0);
    expect(readFileSync(breadcrumb, "utf8")).toBe(endpoint);
    expect(await ping(endpoint)).toEqual({ pong: true });

    owner.stdin?.end("stop\n");
    expect(await waitForExit(owner)).toBe(0);
    expect(existsSync(breadcrumb)).toBe(false);
  } finally {
    for (const child of [contender, owner]) {
      if (!child) continue;
      if (child.exitCode === null && !child.killed) child.kill();
      await waitForExit(child).catch(() => null);
    }
    rmSync(root, { recursive: true, force: true });
  }
});
