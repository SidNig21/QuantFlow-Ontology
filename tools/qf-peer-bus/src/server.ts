#!/usr/bin/env bun
/**
 * qf-peer-bus MCP stdio server.
 *
 * One process = one peer role (from QF_PEER_ROLE). Wraps a single shared
 * PeerBus and exposes it as three MCP tools: list_peers, send_to_peer,
 * read_inbox. This is the "protocol server beside the TUI" from
 * WO-PEER-BUS — any MCP-speaking agent (Hermes, Claude Code, Codex, the
 * cold harness in src/harness.ts, ...) can connect to this over stdio and
 * collaborate with whichever peer is on the other end of the shared
 * peer-bus.db + kernel.db.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { PeerBus } from "./bus.ts";

const role = process.env.QF_PEER_ROLE;
if (!role) {
  console.error(
    "qf-peer-bus server: QF_PEER_ROLE env var is required (e.g. QF_PEER_ROLE=orchestrator)",
  );
  process.exit(1);
}

const bus = new PeerBus();

const server = new McpServer({ name: `qf-peer-bus-${role}`, version: "0.1.0" });

server.registerTool(
  "list_peers",
  {
    description:
      "List known peer roles on the qf-peer-bus: this agent's own role plus any roles " +
      "observed in bus traffic, unioned with the known baseline set (orchestrator, worker).",
  },
  async () => {
    const peers = new Set(bus.listPeers());
    peers.add(role);
    const list = [...peers].sort();
    return {
      content: [
        {
          type: "text" as const,
          text: `Known peers (this agent is "${role}"): ${list.join(", ")}\n${JSON.stringify(list)}`,
        },
      ],
    };
  },
);

server.registerTool(
  "send_to_peer",
  {
    description:
      "Send a message to another peer role over the qf-peer-bus. The message body is " +
      "recorded to the Kernel as an immutable, content-addressed trajectory artifact " +
      "(unconditionally), then enqueued for the recipient's inbox (unless delivery has " +
      "been disabled for this process via QF_PEER_DELIVERY=off).",
    inputSchema: {
      to: z.string().min(1).describe('Role name of the peer to send to (e.g. "worker").'),
      message: z.string().min(1).describe("The message body."),
    },
  },
  async ({ to, message }) => {
    const result = bus.send(role, to, message);
    const summary = result.delivered
      ? `Sent message ${result.messageId} from "${role}" to "${to}"; recorded as Kernel artifact ` +
        `${result.artifactId}; enqueued for delivery.`
      : `Sent message ${result.messageId} from "${role}" to "${to}"; recorded as Kernel artifact ` +
        `${result.artifactId}; delivery SUPPRESSED (QF_PEER_DELIVERY=off on this process) — ` +
        `the recipient's inbox will NOT see this message.`;
    return {
      content: [
        {
          type: "text" as const,
          text: `${summary}\n${JSON.stringify(result)}`,
        },
      ],
    };
  },
);

server.registerTool(
  "read_inbox",
  {
    description:
      "Read and drain this agent's inbox on the qf-peer-bus: returns undelivered messages " +
      "addressed to this role and marks them delivered. Each entry carries the Kernel " +
      "artifact id that recorded it, so provenance can be independently re-checked.",
  },
  async () => {
    const messages = bus.readInbox(role);
    const summary =
      messages.length === 0
        ? `Inbox empty for "${role}".`
        : `Inbox for "${role}": ${messages.length} message(s).`;
    return {
      content: [
        {
          type: "text" as const,
          text: `${summary}\n${JSON.stringify(messages)}`,
        },
      ],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
