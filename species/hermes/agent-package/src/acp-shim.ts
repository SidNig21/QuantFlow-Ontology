#!/usr/bin/env node
/**
 * WO-008 / WO-008b Hermes ACP shim — pipes stdio to a host Hermes ACP server.
 *
 * Env (caller-supplied / manifest only; guest does not inherit host PATH/HOME):
 *   HERMES_BIN — absolute path to the hermes executable (required)
 *   HOME       — founder home so ~/.hermes resolves (required)
 *
 * No PATH lookup. No hardcoded home. Never prompts.
 *
 * AgentOS guest stdin/stdout are EventEmitter-like objects without `.pipe()`
 * (measured WO-008b D0). Bridge with on("data") / write instead.
 */
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { existsSync } from "node:fs";

const hermesBin = process.env.HERMES_BIN;
const home = process.env.HOME;

if (!hermesBin || hermesBin.length === 0) {
  console.error("hermes-acp-shim: HERMES_BIN is required (absolute path)");
  process.exit(1);
}
if (!hermesBin.startsWith("/")) {
  console.error(`hermes-acp-shim: HERMES_BIN must be absolute, got: ${hermesBin}`);
  process.exit(1);
}
if (!existsSync(hermesBin)) {
  console.error(`hermes-acp-shim: HERMES_BIN not found: ${hermesBin}`);
  process.exit(1);
}
if (!home || home.length === 0) {
  console.error("hermes-acp-shim: HOME is required (founder home for ~/.hermes)");
  process.exit(1);
}

type DataEmitter = {
  on: (event: string, cb: (...args: unknown[]) => void) => void;
  resume?: () => void;
};

type DataWriter = {
  write: (chunk: unknown) => unknown;
  end?: () => void;
};

/** Bridge AgentOS guest stdio ↔ child stdio without relying on stream.pipe(). */
function bridgeBytes(src: DataEmitter, dst: DataWriter, label: string): void {
  src.on("data", (chunk: unknown) => {
    try {
      dst.write(chunk);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`hermes-acp-shim: ${label} write failed: ${msg}`);
    }
  });
  src.on("end", () => {
    try {
      dst.end?.();
    } catch {
      /* ignore */
    }
  });
  src.on("error", (err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`hermes-acp-shim: ${label} error: ${msg}`);
  });
}

const child = spawn(hermesBin, ["acp"], {
  stdio: ["pipe", "pipe", "inherit"],
  env: {
    HERMES_BIN: hermesBin,
    HOME: home,
    // Minimal PATH so a shebang wrapper can find bash/env if HERMES_BIN is a script.
    PATH: process.env.PATH ?? "/usr/bin:/bin",
  },
}) as ChildProcessWithoutNullStreams;

if (!child.stdin || !child.stdout) {
  console.error("hermes-acp-shim: failed to open child stdio pipes");
  process.exit(1);
}

bridgeBytes(process.stdin as unknown as DataEmitter, child.stdin, "stdin→hermes");
bridgeBytes(child.stdout as unknown as DataEmitter, process.stdout as unknown as DataWriter, "hermes→stdout");

child.on("error", (err) => {
  console.error(`hermes-acp-shim: spawn failed: ${err.message}`);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});

(process.stdin as unknown as DataEmitter).resume?.();
