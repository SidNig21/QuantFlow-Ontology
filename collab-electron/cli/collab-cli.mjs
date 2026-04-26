#!/usr/bin/env node
import { createConnection } from "node:net";
import { readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { homedir } from "node:os";

const VERSION = "0.2.0";
const GRID = 20;
const COLLAB_DIR = join(homedir(), ".collaborator");
const SOCKET_FILE = join(COLLAB_DIR, "socket-path");
const CURRENT_TILE_ID = process.env.COLLAB_TILE_ID || null;
const INVOKED_AS = basename(process.argv[1] || "collaborator").replace(
  /\.(cmd|ps1)$/i,
  "",
);
const CLI_NAME = INVOKED_AS === "collab-canvas" ? "collab-canvas" : "collaborator";

function die(msg, code = 1) {
  process.stderr.write(`error: ${msg}\n`);
  process.exit(code);
}

function readSocketPath() {
  let raw;
  try {
    raw = readFileSync(SOCKET_FILE, "utf-8").trim();
  } catch {
    die("collaborator is not running (no socket-path file)", 2);
  }
  return raw;
}

function rpcCall(method, params = {}) {
  return new Promise((res, rej) => {
    const socketPath = readSocketPath();
    const payload =
      JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) + "\n";

    const sock = createConnection(socketPath);
    let buf = "";

    const timer = setTimeout(() => {
      sock.destroy();
      rej(Object.assign(new Error("timeout"), { code: "TIMEOUT" }));
    }, 10_000);

    sock.on("connect", () => sock.write(payload));

    sock.on("data", (chunk) => {
      buf += chunk.toString();
      const nl = buf.indexOf("\n");
      if (nl === -1) return;
      clearTimeout(timer);
      sock.destroy();
      let resp;
      try {
        resp = JSON.parse(buf.slice(0, nl));
      } catch {
        rej(new Error("invalid response from collaborator"));
        return;
      }
      if (resp.error) {
        rej(
          Object.assign(
            new Error(resp.error.message ?? "unknown error"),
            {
              code: resp.error.code,
              data: resp.error.data,
            },
          ),
        );
      } else {
        res(resp.result);
      }
    });

    sock.on("error", (err) => {
      clearTimeout(timer);
      rej(err);
    });
  });
}

function pretty(obj) {
  return JSON.stringify(obj, null, 2);
}

function tilesToGrid(result) {
  for (const t of result.tiles ?? []) {
    if (t.position) {
      t.position.x = Math.floor(t.position.x / GRID);
      t.position.y = Math.floor(t.position.y / GRID);
    }
    if (t.size) {
      t.size.width = Math.floor(t.size.width / GRID);
      t.size.height = Math.floor(t.size.height / GRID);
    }
  }
  return result;
}

function parsePos(s) {
  const [xs, ys] = s.split(",");
  const x = Number(xs);
  const y = Number(ys);
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0) {
    die(`invalid position: ${s}`);
  }
  return { x, y };
}

function parseSize(s) {
  const [ws, hs] = s.split(",");
  const w = Number(ws);
  const h = Number(hs);
  if (!Number.isInteger(w) || !Number.isInteger(h) || w < 0 || h < 0) {
    die(`invalid size: ${s}`);
  }
  return { w, h };
}

function parseFlags(args, known) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    const token = args[i];
    if (!token.startsWith("--")) {
      positional.push(token);
      continue;
    }
    if (!known.has(token)) {
      die(`unknown option: ${token}`);
    }
    const next = args[i + 1];
    if (!next || next.startsWith("--")) {
      die(`${token} requires a value`);
    }
    flags[token.slice(2)] = next;
    i += 1;
  }
  return { flags, positional };
}

async function getSnapshot() {
  return rpcCall("canvas.snapshot");
}

function getTileLabel(tile) {
  return tile.label || tile.userTitle || tile.autoTitle || tile.id;
}

function requireTileContext(explicitTileId) {
  const tileId = explicitTileId || CURRENT_TILE_ID;
  if (!tileId) {
    die("no acting tile id available; pass --tile/--from or run inside a Collaborator terminal tile");
  }
  return tileId;
}

function exactTileMatches(snapshot, ref, allowedIds = null) {
  const candidates = snapshot.tiles.filter((tile) => {
    if (allowedIds && !allowedIds.has(tile.id)) return false;
    return tile.id === ref || getTileLabel(tile) === ref;
  });
  if (candidates.length === 1) return candidates[0];
  if (candidates.length > 1) {
    die(
      `AMBIGUOUS_NAME: ${ref}\n${candidates
        .map((tile) => `- ${tile.id} (${getTileLabel(tile)})`)
        .join("\n")}`,
    );
  }
  return null;
}

function resolveConnectedEndpoint(snapshot, actorTileId, ref, endpointKind) {
  const actorTile = snapshot.tiles.find((tile) => tile.id === actorTileId);
  if (!actorTile) {
    die(`TILE_NOT_FOUND: ${actorTileId}`);
  }
  const candidates = snapshot.connections
    .filter((connection) =>
      connection.active
      && connection.endpointKind === endpointKind
      && (connection.sourceId === actorTileId || connection.targetId === actorTileId)
    )
    .map((connection) => {
      const resourceTileId = connection.sourceId === actorTileId
        ? connection.targetId
        : connection.sourceId;
      const resourceTile = snapshot.tiles.find((tile) => tile.id === resourceTileId);
      return resourceTile ? { connection, resourceTile } : null;
    })
    .filter(Boolean);

  if (candidates.length === 0) {
    die(`no connected ${endpointKind} resources found for ${actorTileId}`);
  }

  if (!ref) {
    if (candidates.length === 1) return candidates[0];
    die(
      `AMBIGUOUS_NAME: multiple connected ${endpointKind} resources\n${candidates
        .map(({ resourceTile, connection }) =>
          `- ${resourceTile.id} (${getTileLabel(resourceTile)}) via ${connection.id}`)
        .join("\n")}`,
    );
  }

  const exact = candidates.filter(
    ({ resourceTile }) =>
      resourceTile.id === ref || getTileLabel(resourceTile) === ref,
  );
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) {
    die(
      `AMBIGUOUS_NAME: ${ref}\n${exact
        .map(({ resourceTile, connection }) =>
          `- ${resourceTile.id} (${getTileLabel(resourceTile)}) via ${connection.id}`)
        .join("\n")}`,
    );
  }

  die(`TILE_NOT_FOUND: ${ref}`);
}

function resolveAgentPeer(snapshot, actorTileId, peerRef) {
  const actorTile = snapshot.tiles.find((tile) => tile.id === actorTileId);
  if (!actorTile) {
    die(`TILE_NOT_FOUND: ${actorTileId}`);
  }

  const candidates = snapshot.connections
    .filter((connection) =>
      connection.active
      && connection.transport === "agent-channel"
      && connection.endpointKind === "agent"
      && (connection.sourceId === actorTileId || connection.targetId === actorTileId)
    )
    .map((connection) => {
      const peerTileId = connection.sourceId === actorTileId
        ? connection.targetId
        : connection.sourceId;
      const peerTile = snapshot.tiles.find((tile) => tile.id === peerTileId);
      return peerTile ? { connection, peerTile } : null;
    })
    .filter(Boolean);

  if (candidates.length === 0) {
    die(`no connected agent peers found for ${actorTileId}`);
  }

  if (!peerRef) {
    if (candidates.length === 1) return candidates[0];
    die(
      `AMBIGUOUS_NAME: multiple connected peers\n${candidates
        .map(({ peerTile, connection }) =>
          `- ${peerTile.id} (${getTileLabel(peerTile)}) via ${connection.id}`)
        .join("\n")}`,
    );
  }

  const exact = candidates.filter(
    ({ peerTile }) =>
      peerTile.id === peerRef || getTileLabel(peerTile) === peerRef,
  );
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) {
    die(
      `AMBIGUOUS_NAME: ${peerRef}\n${exact
        .map(({ peerTile, connection }) =>
          `- ${peerTile.id} (${getTileLabel(peerTile)}) via ${connection.id}`)
        .join("\n")}`,
    );
  }

  die(`TILE_NOT_FOUND: ${peerRef}`);
}

async function cmdTileList() {
  const result = await rpcCall("canvas.tileList");
  console.log(pretty(tilesToGrid(result)));
}

async function cmdTileCreate(args) {
  if (args.length === 0) {
    die("tile create requires a type (term, note, code, image, graph)");
  }
  const tileType = args.shift();
  const valid = ["term", "note", "code", "image", "graph"];
  if (!valid.includes(tileType)) {
    die(`unknown tile type: ${tileType} (expected: ${valid.join(", ")})`);
  }

  const params = { tileType };
  while (args.length > 0) {
    const flag = args.shift();
    switch (flag) {
      case "--file":
        params.filePath = resolve(args.shift());
        break;
      case "--pos": {
        const { x, y } = parsePos(args.shift());
        params.position = { x: x * GRID, y: y * GRID };
        break;
      }
      case "--size": {
        const { w, h } = parseSize(args.shift());
        params.size = { width: w * GRID, height: h * GRID };
        break;
      }
      default:
        die(`unknown option: ${flag}`);
    }
  }

  const result = await rpcCall("canvas.tileCreate", params);
  console.log(result.tileId);
}

async function cmdTileRm(args) {
  if (args.length === 0) die("tile rm requires a tile id");
  const tileId = args[0];
  await rpcCall("canvas.tileRemove", { tileId });
  console.log(`removed ${tileId}`);
}

async function cmdTileMove(args) {
  if (args.length === 0) die("tile move requires a tile id");
  const tileId = args.shift();
  let pos = null;

  while (args.length > 0) {
    const flag = args.shift();
    if (flag === "--pos") {
      pos = parsePos(args.shift());
    } else {
      die(`unknown option: ${flag}`);
    }
  }
  if (!pos) die("tile move requires --pos x,y");

  await rpcCall("canvas.tileMove", {
    tileId,
    position: { x: pos.x * GRID, y: pos.y * GRID },
  });
  console.log(`moved ${tileId} to ${pos.x},${pos.y}`);
}

async function cmdTileResize(args) {
  if (args.length === 0) die("tile resize requires a tile id");
  const tileId = args.shift();
  let size = null;

  while (args.length > 0) {
    const flag = args.shift();
    if (flag === "--size") {
      size = parseSize(args.shift());
    } else {
      die(`unknown option: ${flag}`);
    }
  }
  if (!size) die("tile resize requires --size w,h");

  await rpcCall("canvas.tileResize", {
    tileId,
    size: { width: size.w * GRID, height: size.h * GRID },
  });
  console.log(`resized ${tileId} to ${size.w},${size.h}`);
}

async function cmdTileFocus(args) {
  if (args.length === 0) die("tile focus requires at least one tile id");
  await rpcCall("canvas.tileFocus", { tileIds: args });
  console.log(`focused ${args.join(" ")}`);
}

async function cmdTerminalWrite(args) {
  if (args.length < 2) die("terminal write requires <id> <input>");
  const tileId = args[0];
  const input = args.slice(1).join(" ");
  await rpcCall("canvas.terminalWrite", { tileId, input });
  console.log(`wrote to ${tileId}`);
}

async function cmdTerminalRead(args) {
  if (args.length === 0) die("terminal read requires a tile id");
  const tileId = args.shift();
  let lines = 50;

  while (args.length > 0) {
    const flag = args.shift();
    if (flag === "--lines") {
      lines = Number(args.shift());
      if (!Number.isInteger(lines) || lines <= 0) {
        die("--lines must be a positive integer");
      }
    } else {
      die(`unknown option: ${flag}`);
    }
  }

  const result = await rpcCall("canvas.terminalRead", { tileId, lines });
  console.log(pretty(result));
}

async function cmdPeersList(args) {
  const { flags } = parseFlags(args, new Set(["--tile"]));
  const snapshot = await getSnapshot();
  const tileId = flags.tile || CURRENT_TILE_ID;
  if (!tileId) {
    const peers = snapshot.tiles
      .filter((tile) => tile.type === "term")
      .map((tile) => ({
        tileId: tile.id,
        label: getTileLabel(tile),
        terminalHealth: tile.terminalHealth || "offline",
      }));
    console.log(pretty({ peers }));
    return;
  }

  const peers = snapshot.connections
    .filter((connection) =>
      connection.active
      && connection.transport === "agent-channel"
      && connection.endpointKind === "agent"
      && (connection.sourceId === tileId || connection.targetId === tileId)
    )
    .map((connection) => {
      const peerTileId = connection.sourceId === tileId
        ? connection.targetId
        : connection.sourceId;
      const peerTile = snapshot.tiles.find((tile) => tile.id === peerTileId);
      return peerTile
        ? {
            connectionId: connection.id,
            peerTileId,
            label: getTileLabel(peerTile),
            terminalHealth: peerTile.terminalHealth || "offline",
            pendingCount: connection.pendingCount ?? 0,
            lastThreadPreview: connection.lastThreadPreview ?? null,
          }
        : null;
    })
    .filter(Boolean);
  console.log(pretty({ tileId, peers }));
}

async function cmdChannelAsk(args) {
  const { flags, positional } = parseFlags(
    args,
    new Set(["--from", "--request-id"]),
  );
  if (positional.length < 2) {
    die("channel ask requires <peer> <message>");
  }
  const fromTileId = requireTileContext(flags.from);
  const peerRef = positional.shift();
  const message = positional.join(" ").trim();
  const snapshot = await getSnapshot();
  const { connection, peerTile } = resolveAgentPeer(
    snapshot,
    fromTileId,
    peerRef,
  );
  const result = await rpcCall("canvas.channelSend", {
    connectionId: connection.id,
    fromTileId,
    toTileId: peerTile.id,
    body: message,
    clientRequestId: flags["request-id"],
  });
  console.log(pretty({
    connectionId: connection.id,
    peerTileId: peerTile.id,
    ...result,
  }));
}

async function cmdChannelReply(args) {
  const { flags, positional } = parseFlags(args, new Set(["--from"]));
  if (positional.length < 2) {
    die("channel reply requires <thread-id> <message>");
  }
  const fromTileId = requireTileContext(flags.from);
  const threadId = positional.shift();
  const message = positional.join(" ").trim();
  const result = await rpcCall("canvas.channelReply", {
    threadId,
    fromTileId,
    body: message,
  });
  console.log(pretty(result));
}

async function cmdChannelWait(args) {
  const { flags, positional } = parseFlags(args, new Set(["--timeout"]));
  if (positional.length !== 1) {
    die("channel wait requires <thread-id>");
  }
  const threadId = positional[0];
  const timeoutMs = flags.timeout ? Number(flags.timeout) : undefined;
  if (timeoutMs != null && (!Number.isInteger(timeoutMs) || timeoutMs <= 0)) {
    die("--timeout must be a positive integer");
  }
  const result = await rpcCall("canvas.channelWait", { threadId, timeoutMs });
  console.log(pretty(result));
}

async function cmdChannelInbox(args) {
  const { flags } = parseFlags(args, new Set(["--tile"]));
  const tileId = requireTileContext(flags.tile);
  const result = await rpcCall("canvas.channelInbox", { tileId });
  console.log(pretty(result));
}

async function cmdChannelThreads(args) {
  const { flags } = parseFlags(args, new Set(["--tile", "--connection"]));
  const result = await rpcCall("canvas.channelThreadList", {
    tileId: flags.tile,
    connectionId: flags.connection,
  });
  console.log(pretty(result));
}

async function cmdAgentStatus(args) {
  const { flags, positional } = parseFlags(args, new Set(["--tile"]));
  if (positional.length !== 1) {
    die("agent status requires one of: idle, working, blocked, done");
  }
  const status = positional[0];
  if (!["idle", "working", "blocked", "done"].includes(status)) {
    die(`invalid agent status: ${status}`);
  }
  const tileId = requireTileContext(flags.tile);
  const result = await rpcCall("canvas.agentStatusReport", { tileId, status });
  console.log(pretty(result));
}

async function cmdNoteRead(args) {
  const { flags, positional } = parseFlags(args, new Set(["--from"]));
  const fromTileId = requireTileContext(flags.from);
  const resourceRef = positional[0];
  const snapshot = await getSnapshot();
  const { connection } = resolveConnectedEndpoint(
    snapshot,
    fromTileId,
    resourceRef,
    "note",
  );
  const result = await rpcCall("canvas.noteResourceRead", {
    connectionId: connection.id,
    actorTileId: fromTileId,
  });
  console.log(result.body);
}

async function cmdNoteWrite(args) {
  const { flags, positional } = parseFlags(args, new Set(["--from"]));
  if (positional.length < 2) {
    die("note write requires <resource> <content>");
  }
  const fromTileId = requireTileContext(flags.from);
  const resourceRef = positional.shift();
  const body = positional.join(" ");
  const snapshot = await getSnapshot();
  const { connection } = resolveConnectedEndpoint(
    snapshot,
    fromTileId,
    resourceRef,
    "note",
  );
  const result = await rpcCall("canvas.noteResourceWrite", {
    connectionId: connection.id,
    actorTileId: fromTileId,
    body,
  });
  console.log(pretty(result));
}

async function cmdNoteAppend(args) {
  const { flags, positional } = parseFlags(args, new Set(["--from"]));
  if (positional.length < 2) {
    die("note append requires <resource> <content>");
  }
  const fromTileId = requireTileContext(flags.from);
  const resourceRef = positional.shift();
  const body = positional.join(" ");
  const snapshot = await getSnapshot();
  const { connection } = resolveConnectedEndpoint(
    snapshot,
    fromTileId,
    resourceRef,
    "note",
  );
  const result = await rpcCall("canvas.noteResourceAppend", {
    connectionId: connection.id,
    actorTileId: fromTileId,
    body,
  });
  console.log(pretty(result));
}

async function cmdBrowserInfo(args) {
  const { flags, positional } = parseFlags(args, new Set(["--from"]));
  const fromTileId = requireTileContext(flags.from);
  const resourceRef = positional[0];
  const snapshot = await getSnapshot();
  const { connection } = resolveConnectedEndpoint(
    snapshot,
    fromTileId,
    resourceRef,
    "browser",
  );
  const result = await rpcCall("canvas.browserInfo", {
    connectionId: connection.id,
    actorTileId: fromTileId,
  });
  console.log(pretty(result));
}

async function cmdBrowserNavigate(args) {
  const { flags, positional } = parseFlags(args, new Set(["--from"]));
  if (positional.length < 2) {
    die("browser navigate requires <resource> <url>");
  }
  const fromTileId = requireTileContext(flags.from);
  const resourceRef = positional.shift();
  const url = positional.join(" ");
  const snapshot = await getSnapshot();
  const { connection } = resolveConnectedEndpoint(
    snapshot,
    fromTileId,
    resourceRef,
    "browser",
  );
  const result = await rpcCall("canvas.browserNavigate", {
    connectionId: connection.id,
    actorTileId: fromTileId,
    url,
  });
  console.log(pretty(result));
}

async function cmdBrowserSnapshot(args) {
  const { flags, positional } = parseFlags(args, new Set(["--from", "--out"]));
  const fromTileId = requireTileContext(flags.from);
  const resourceRef = positional[0];
  const snapshot = await getSnapshot();
  const { connection } = resolveConnectedEndpoint(
    snapshot,
    fromTileId,
    resourceRef,
    "browser",
  );
  const result = await rpcCall("canvas.browserSnapshot", {
    connectionId: connection.id,
    actorTileId: fromTileId,
  });
  if (flags.out) {
    const outPath = resolve(flags.out);
    const base64 = result.dataUrl.replace(/^data:image\/png;base64,/, "");
    writeFileSync(outPath, Buffer.from(base64, "base64"));
    console.log(pretty({
      tileId: result.tileId,
      url: result.url,
      title: result.title,
      path: outPath,
    }));
    return;
  }
  console.log(pretty(result));
}

function usage() {
  console.log(`${CLI_NAME} — control Collaborator from the command line

USAGE
  ${CLI_NAME} <command> [options]

PRIMARY COMMANDS
  peers list [--tile ID]                           List connected peers for a terminal tile
  channel ask [--from ID] [--request-id ID] <peer> <message>
                                                   Send a semantic request to a connected peer
  channel reply [--from ID] <thread-id> <message> Reply to a semantic request thread
  channel wait [--timeout MS] <thread-id>         Wait for a semantic thread to finish
  channel inbox [--tile ID]                       List pending semantic requests
  channel threads [--tile ID] [--connection ID]   List semantic threads
  agent status [--tile ID] <status>               Report agent status (idle/working/blocked/done)

RESOURCE COMMANDS
  note read [--from ID] <resource>
  note write [--from ID] <resource> <content>
  note append [--from ID] <resource> <content>
  browser info [--from ID] <resource>
  browser navigate [--from ID] <resource> <url>
  browser snapshot [--from ID] [--out FILE] <resource>

CANVAS COMPATIBILITY COMMANDS
  tile list
  tile create <type> [--file PATH] [--pos x,y] [--size w,h]
  tile rm <id>
  tile move <id> --pos x,y
  tile resize <id> --size w,h
  tile focus <id> [<id>...]
  terminal write <id> <input>
  terminal read <id> [--lines N]

NOTES
  - Exact tile IDs or exact display labels are accepted. Ambiguity fails closed.
  - When running inside a Collaborator terminal tile, ${CLI_NAME} uses COLLAB_TILE_ID automatically.
  - collab-canvas remains a compatibility alias; collaborator is the preferred command.

VERSION
  ${CLI_NAME} v${VERSION}`);
  process.exit(0);
}

const argv = process.argv.slice(2);
if (argv.length === 0) usage();

try {
  const cmd = argv[0];
  switch (cmd) {
    case "help":
    case "--help":
    case "-h":
      usage();
      break;
    case "--version":
    case "-v":
      console.log(`${CLI_NAME} v${VERSION}`);
      break;
    case "peers": {
      if (argv[1] !== "list") die("peers requires the subcommand: list");
      await cmdPeersList(argv.slice(2));
      break;
    }
    case "channel": {
      const sub = argv[1];
      const rest = argv.slice(2);
      switch (sub) {
        case "ask":
          await cmdChannelAsk(rest);
          break;
        case "reply":
          await cmdChannelReply(rest);
          break;
        case "wait":
          await cmdChannelWait(rest);
          break;
        case "inbox":
          await cmdChannelInbox(rest);
          break;
        case "threads":
          await cmdChannelThreads(rest);
          break;
        default:
          die("channel requires a subcommand: ask, reply, wait, inbox, threads");
      }
      break;
    }
    case "agent": {
      if (argv[1] !== "status") die("agent requires the subcommand: status");
      await cmdAgentStatus(argv.slice(2));
      break;
    }
    case "note": {
      const sub = argv[1];
      const rest = argv.slice(2);
      switch (sub) {
        case "read":
          await cmdNoteRead(rest);
          break;
        case "write":
          await cmdNoteWrite(rest);
          break;
        case "append":
          await cmdNoteAppend(rest);
          break;
        default:
          die("note requires a subcommand: read, write, append");
      }
      break;
    }
    case "browser": {
      const sub = argv[1];
      const rest = argv.slice(2);
      switch (sub) {
        case "info":
          await cmdBrowserInfo(rest);
          break;
        case "navigate":
          await cmdBrowserNavigate(rest);
          break;
        case "snapshot":
          await cmdBrowserSnapshot(rest);
          break;
        default:
          die("browser requires a subcommand: info, navigate, snapshot");
      }
      break;
    }
    case "tile": {
      const sub = argv[1];
      const rest = argv.slice(2);
      switch (sub) {
        case "list":
          await cmdTileList();
          break;
        case "create":
          await cmdTileCreate(rest);
          break;
        case "rm":
          await cmdTileRm(rest);
          break;
        case "move":
          await cmdTileMove(rest);
          break;
        case "resize":
          await cmdTileResize(rest);
          break;
        case "focus":
          await cmdTileFocus(rest);
          break;
        default:
          die("tile requires a subcommand: list, create, rm, move, resize, focus");
      }
      break;
    }
    case "terminal": {
      const sub = argv[1];
      const rest = argv.slice(2);
      switch (sub) {
        case "write":
          await cmdTerminalWrite(rest);
          break;
        case "read":
          await cmdTerminalRead(rest);
          break;
        default:
          die("terminal requires a subcommand: write, read");
      }
      break;
    }
    default:
      die(`unknown command: ${cmd} (try: ${CLI_NAME} --help)`);
  }
} catch (err) {
  const prefix = err.code ? `${err.code}: ` : "";
  die(`${prefix}${err.message}`);
}
