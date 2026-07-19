#!/usr/bin/env node
/**
 * ACP stdio agent for AgentOS (WO-004).
 * Carries the ACP session id adopted by AgentOS createSession, runs ToolLoopAgent
 * with a mock model (no API keys), writes a proof receipt for host-side P1 reads.
 */
import {
  AgentSideConnection,
  ndJsonStream,
  PROTOCOL_VERSION,
  type Agent,
  type AgentSideConnection as Conn,
  type CancelNotification,
  type InitializeRequest,
  type NewSessionRequest,
  type PromptRequest,
} from "@agentclientprotocol/sdk";
import { stepCountIs, tool, ToolLoopAgent } from "ai";
import { MockLanguageModelV3, simulateReadableStream } from "ai/test";
import { writeFileSync } from "node:fs";
import { z } from "zod";

const RECEIPT_PATH = "/tmp/qf-runtime-proof-receipt.json";

type SessionState = {
  sessionId: string;
  pending: AbortController | null;
};

const sessions = new Map<string, SessionState>();

function buildMockModel(slowChunkMs: number) {
  let call = 0;
  return new MockLanguageModelV3({
    doStream: async () => {
      call += 1;
      if (call === 1) {
        return {
          stream: simulateReadableStream({
            chunkDelayInMs: slowChunkMs,
            chunks: [
              { type: "text-start", id: "t1" },
              { type: "text-delta", id: "t1", delta: "Calling " },
              { type: "text-delta", id: "t1", delta: "echo_upper. " },
              { type: "text-end", id: "t1" },
              { type: "tool-input-start", id: "call_1", toolName: "echo_upper" },
              { type: "tool-input-delta", id: "call_1", delta: '{"text":"quantflow"}' },
              { type: "tool-input-end", id: "call_1" },
              {
                type: "tool-call",
                toolCallId: "call_1",
                toolName: "echo_upper",
                input: '{"text":"quantflow"}',
              },
              {
                type: "finish",
                finishReason: "tool-calls",
                usage: { inputTokens: 8, outputTokens: 8, totalTokens: 16 },
              },
            ],
          }),
        };
      }
      return {
        stream: simulateReadableStream({
          chunkDelayInMs: slowChunkMs,
          chunks: [
            { type: "text-start", id: "t2" },
            { type: "text-delta", id: "t2", delta: "Tool said QUANTFLOW." },
            { type: "text-end", id: "t2" },
            {
              type: "finish",
              finishReason: "stop",
              usage: { inputTokens: 8, outputTokens: 8, totalTokens: 16 },
            },
          ],
        }),
      };
    },
  });
}

const echoUpper = tool({
  description: "Return the input text uppercased.",
  inputSchema: z.object({ text: z.string() }),
  execute: async ({ text }) => text.toUpperCase(),
});

function writeReceipt(payload: Record<string, unknown>) {
  try {
    writeFileSync(RECEIPT_PATH, `${JSON.stringify(payload)}\n`, "utf8");
  } catch {
    // best-effort inside the guest
  }
}

class ToolLoopAcpAgent implements Agent {
  constructor(private readonly conn: Conn) {}

  async initialize(_params: InitializeRequest) {
    return {
      protocolVersion: PROTOCOL_VERSION,
      agentCapabilities: {
        loadSession: false,
      },
      agentInfo: {
        name: "qf-toolloop",
        version: "0.1.0",
      },
    };
  }

  async newSession(_params: NewSessionRequest) {
    const sessionId = crypto.randomUUID();
    sessions.set(sessionId, { sessionId, pending: null });
    writeReceipt({
      phase: "session_new",
      acpSessionId: sessionId,
      toolLoopSessionId: null,
    });
    return { sessionId };
  }

  async authenticate() {
    return {};
  }

  async prompt(params: PromptRequest) {
    const session = sessions.get(params.sessionId);
    if (!session) {
      throw new Error(`Unknown session ${params.sessionId}`);
    }
    session.pending?.abort();
    session.pending = new AbortController();
    const signal = session.pending.signal;

    // ACP carries params.sessionId — ToolLoopAgent must use this exact id (never mint another).
    const acpSessionId = params.sessionId;
    const slowChunkMs = Number(process.env.QF_PROOF_SLOW_CHUNK_MS ?? "40");

    const agent = new ToolLoopAgent({
      model: buildMockModel(slowChunkMs),
      tools: { echo_upper: echoUpper },
      stopWhen: stepCountIs(5),
    });

    let toolOutput: string | null = null;
    let text = "";
    let chunkCount = 0;

    try {
      // Session identity for the tool-loop turn is params.sessionId (written to receipt).
      const result = await agent.stream({
        prompt: extractPromptText(params),
        abortSignal: signal,
      });

      for await (const part of result.fullStream) {
        if (signal.aborted) break;
        if (part.type === "text-delta") {
          chunkCount += 1;
          await this.conn.sessionUpdate({
            sessionId: acpSessionId,
            update: {
              sessionUpdate: "agent_message_chunk",
              content: { type: "text", text: part.text },
            },
          });
        }
      }

      const toolResults = await result.toolResults;
      const first = toolResults[0];
      toolOutput =
        first && "output" in first && typeof first.output === "string" ? first.output : null;
      text = await result.text;

      writeReceipt({
        phase: signal.aborted ? "cancelled" : "prompt_done",
        acpSessionId,
        toolLoopSessionId: acpSessionId,
        toolOutput,
        text,
        chunkCount,
      });

      if (signal.aborted) {
        return { stopReason: "cancelled" as const };
      }
      return { stopReason: "end_turn" as const };
    } catch {
      writeReceipt({
        phase: "error",
        acpSessionId,
        toolLoopSessionId: acpSessionId,
      });
      if (signal.aborted) {
        return { stopReason: "cancelled" as const };
      }
      throw new Error("tool-loop prompt failed");
    } finally {
      session.pending = null;
    }
  }

  async cancel(params: CancelNotification) {
    sessions.get(params.sessionId)?.pending?.abort();
  }
}

function extractPromptText(params: PromptRequest): string {
  const blocks = params.prompt ?? [];
  const texts: string[] = [];
  for (const block of blocks) {
    if (block && typeof block === "object" && "type" in block && block.type === "text") {
      texts.push(String((block as { text?: string }).text ?? ""));
    }
  }
  return texts.join("") || "uppercase quantflow";
}

const output = new WritableStream<Uint8Array>({
  write(chunk) {
    return new Promise((resolve, reject) => {
      process.stdout.write(chunk, (err) => (err ? reject(err) : resolve()));
    });
  },
});

const input = new ReadableStream<Uint8Array>({
  start(controller) {
    process.stdin.on("data", (chunk: Buffer | string) => {
      controller.enqueue(chunk instanceof Uint8Array ? chunk : Buffer.from(chunk));
    });
    process.stdin.on("end", () => controller.close());
    process.stdin.on("error", (error) => controller.error(error));
  },
});

const stream = ndJsonStream(output, input);
new AgentSideConnection((conn) => new ToolLoopAcpAgent(conn), stream);
process.stdin.resume();
process.stdin.on("end", () => process.exit(0));
