/**
 * Shared host-bridged ACP client (WO-008c D2 / WO-008a).
 * Used by Electron agent-host, d0-smoke, and host-admit-kernel.
 *
 * Spawns a host ACP stdio agent (e.g. `hermes acp`), initialize + session/new.
 * Deny-by-default permissions; optional founder bridge + per-species allowlist.
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
import {
  denyPermissionResponse,
  gateToolPermission,
  type PermissionDecision,
} from "./host-acp-policy.ts";

export type {
  PermissionDecision,
} from "./host-acp-policy.ts";
export {
  denyPermissionResponse,
  extractToolKey,
  gateToolPermission,
  isToolAllowed,
  permissionResponseForDecision,
} from "./host-acp-policy.ts";

export type HostAcpHooks = {
  /** Called for each agent_message_chunk text fragment. */
  onChunk?: (text: string) => void;
  /**
   * Founder permission bridge. Invoked only after allowlist admits the tool.
   * Must resolve; callers should apply timeout → deny.
   */
  onPermission?: (
    params: RequestPermissionRequest,
  ) => Promise<RequestPermissionResponse>;
  /** Per-species tool keys (empty = deny all tools that request permission). */
  toolAllowlist: Set<string>;
  /** Default 30s — used when onPermission is set and raceWithTimeout wraps it. */
  permissionTimeoutMs: number;
};

export type HostAcpHandle = {
  sessionId: string;
  proc: ChildProcess;
  connection: ClientSideConnection;
  /** Absolute command that was spawned (paths only). */
  command: string;
  /** Mutable hooks — set allowlist/bridge after admit; wire onChunk before prompt. */
  hooks: HostAcpHooks;
};

export type HostAcpAdmitOpts = {
  /** Absolute path to the ACP-speaking binary (e.g. hermes). */
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  clientName?: string;
  /** Initial tool allowlist (default empty → deny all tool permissions). */
  toolAllowlist?: Iterable<string>;
  onPermission?: HostAcpHooks["onPermission"];
  permissionTimeoutMs?: number;
};

function chunkTextFromUpdate(params: SessionNotification): string | null {
  const update = params.update as {
    sessionUpdate?: string;
    content?: { text?: string };
  } | null;
  if (!update || update.sessionUpdate !== "agent_message_chunk") return null;
  const text = update.content?.text;
  return typeof text === "string" ? text : null;
}

function createHostAcpClient(hooks: HostAcpHooks): Client {
  return {
    async sessionUpdate(params: SessionNotification): Promise<void> {
      const chunk = chunkTextFromUpdate(params);
      if (chunk) hooks.onChunk?.(chunk);
    },
    async requestPermission(
      params: RequestPermissionRequest,
    ): Promise<RequestPermissionResponse> {
      const gated = gateToolPermission(params, hooks.toolAllowlist);
      if (!gated.allowed) {
        console.log(
          `host-acp: tool denied by allowlist tool=${gated.toolKey}`,
        );
        return gated.response;
      }
      if (!hooks.onPermission) {
        console.log(
          `host-acp: tool allowlisted but no permission bridge — deny tool=${gated.toolKey}`,
        );
        return denyPermissionResponse(params);
      }
      // Timeout → deny lives in the founder bridge (single waiter; no double-race).
      try {
        return await hooks.onPermission(params);
      } catch (err) {
        console.log(
          `host-acp: permission bridge error → deny tool=${gated.toolKey}`,
          err instanceof Error ? err.message : err,
        );
        return denyPermissionResponse(params);
      }
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

  const hooks: HostAcpHooks = {
    toolAllowlist: new Set(
      [...(opts.toolAllowlist ?? [])].map((t) => t.toLowerCase()),
    ),
    onPermission: opts.onPermission,
    permissionTimeoutMs: opts.permissionTimeoutMs ?? 30_000,
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
    () => createHostAcpClient(hooks),
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
    return { sessionId, proc, connection, command, hooks };
  } catch (err) {
    await tearDownHostAcp({
      sessionId: "",
      proc,
      connection,
      command,
      hooks,
    }).catch(() => {});
    if (exitError) throw exitError;
    throw err;
  }
}

/** Prompt an admitted host ACP session; stream chunks via hooks.onChunk. */
export async function promptHostAcp(
  handle: HostAcpHandle,
  promptText: string,
): Promise<{ stopReason: string; text: string }> {
  let text = "";
  const prev = handle.hooks.onChunk;
  handle.hooks.onChunk = (chunk) => {
    text += chunk;
    prev?.(chunk);
  };
  try {
    const result = await handle.connection.prompt({
      sessionId: handle.sessionId,
      prompt: [{ type: "text", text: promptText }],
    });
    return {
      stopReason: result.stopReason ?? "end_turn",
      text,
    };
  } finally {
    handle.hooks.onChunk = prev;
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
