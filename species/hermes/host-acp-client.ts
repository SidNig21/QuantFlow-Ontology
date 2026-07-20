/**
 * Shared host-bridged ACP client (WO-008c D2).
 * Used by Electron agent-host, d0-smoke, and host-admit-kernel.
 *
 * Spawns a host ACP stdio agent (e.g. `hermes acp`), initialize + session/new,
 * never prompts. Deny-by-default on permission requests (WO-008a owns the UI).
 */
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { Readable, Writable } from "node:stream";
import {
  ClientSideConnection,
  ndJsonStream,
  type Client,
  type RequestPermissionRequest,
  type RequestPermissionResponse,
  type SessionNotification,
} from "@agentclientprotocol/sdk";

export type HostAcpHandle = {
  sessionId: string;
  proc: ChildProcess;
  connection: ClientSideConnection;
  /** Absolute command that was spawned (paths only). */
  command: string;
};

export type HostAcpAdmitOpts = {
  /** Absolute path to the ACP-speaking binary (e.g. hermes). */
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  clientName?: string;
};

function denyByDefaultClient(): Client {
  return {
    async sessionUpdate(_params: SessionNotification): Promise<void> {
      // Handshake-only: ignore chunks if any arrive without a prompt.
    },
    async requestPermission(
      params: RequestPermissionRequest,
    ): Promise<RequestPermissionResponse> {
      const reject = params.options.find(
        (o) => o.kind === "reject_once" || o.kind === "reject_always",
      );
      if (reject) {
        return {
          outcome: { outcome: "selected", optionId: reject.optionId },
        };
      }
      return { outcome: { outcome: "cancelled" } };
    },
  };
}

/** Resolve a host ACP binary: prefer absolute path; must exist. */
export function resolveHostAcpCommand(
  preferred: string | undefined,
  fallbacks: string[] = [],
): string {
  const candidates = [preferred, ...fallbacks].filter(
    (p): p is string => typeof p === "string" && p.length > 0,
  );
  for (const c of candidates) {
    if (c.startsWith("/") && existsSync(c)) return c;
  }
  throw new Error(
    `host-acp: no executable found among ${JSON.stringify(candidates)}`,
  );
}

/**
 * Spawn host ACP agent, initialize, session/new. Sends no prompt.
 */
export async function admitHostAcp(
  opts: HostAcpAdmitOpts,
): Promise<HostAcpHandle> {
  const command = opts.command;
  if (!command.startsWith("/") || !existsSync(command)) {
    throw new Error(`host-acp: command missing or not absolute: ${command}`);
  }
  const args = opts.args ?? ["acp"];
  const cwd = opts.cwd ?? homedir();
  const env: NodeJS.ProcessEnv = {
    PATH: process.env.PATH ?? "/usr/bin:/bin",
    HOME: opts.env?.HOME ?? process.env.HOME ?? homedir(),
    ...opts.env,
  };

  console.log(
    `host-acp: spawn command=${command} args=${JSON.stringify(args)} cwd=${cwd}`,
  );

  const proc = spawn(command, args, {
    stdio: ["pipe", "pipe", "inherit"],
    cwd,
    env,
  });

  if (!proc.stdin || !proc.stdout) {
    proc.kill();
    throw new Error("host-acp: failed to open child stdio pipes");
  }

  const input = Writable.toWeb(proc.stdin) as WritableStream<Uint8Array>;
  const output = Readable.toWeb(proc.stdout) as ReadableStream<Uint8Array>;
  const stream = ndJsonStream(input, output);

  let exitError: Error | null = null;
  proc.on("error", (err) => {
    exitError = err;
  });
  proc.on("exit", (code, signal) => {
    if (code && code !== 0) {
      exitError = new Error(
        `host-acp: process exited code=${code} signal=${signal ?? ""}`,
      );
    }
  });

  const connection = new ClientSideConnection(
    () => denyByDefaultClient(),
    stream,
  );

  try {
    await connection.initialize({
      protocolVersion: 1,
      clientCapabilities: {
        fs: { readTextFile: false, writeTextFile: false },
      },
      clientInfo: {
        name: opts.clientName ?? "quantflow-host-acp",
        title: "QuantFlow Host ACP",
        version: "0.1.0",
      },
    });
    const session = await connection.newSession({
      cwd,
      mcpServers: [],
    });
    const sessionId = session.sessionId;
    if (!sessionId || typeof sessionId !== "string") {
      throw new Error("host-acp: newSession returned no sessionId");
    }
    console.log(`host-acp: handshake ok session=${sessionId} (no prompt)`);
    return { sessionId, proc, connection, command };
  } catch (err) {
    await tearDownHostAcp({
      sessionId: "",
      proc,
      connection,
      command,
    }).catch(() => {});
    if (exitError) throw exitError;
    throw err;
  }
}

export async function cancelHostAcp(handle: HostAcpHandle): Promise<void> {
  try {
    await handle.connection.cancel({ sessionId: handle.sessionId });
  } catch {
    /* ignore — still kill */
  }
  await tearDownHostAcp(handle);
}

export async function tearDownHostAcp(handle: HostAcpHandle): Promise<void> {
  const { proc } = handle;
  if (!proc.killed && proc.exitCode === null) {
    proc.kill("SIGTERM");
    await new Promise<void>((resolve) => {
      const t = setTimeout(() => {
        if (!proc.killed && proc.exitCode === null) proc.kill("SIGKILL");
        resolve();
      }, 2000);
      proc.once("exit", () => {
        clearTimeout(t);
        resolve();
      });
    });
  }
}
