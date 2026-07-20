/**
 * WO-008 / WO-008b deliverable 0 — fact-finding through the real admission path.
 * linkSoftware → createSession("hermes", { env }) — NEVER prompt Hermes.
 *
 * WO-008b: authorized host_dir mounts (hermes-agent + uv cpython) so the guest
 * can see HERMES_BIN. Mounts are narrowly scoped — not whole $HOME.
 *
 * Outcomes: A (handshake OK) · B (guest cannot reach host install) · C (protocol drift)
 * Exit codes: 0=A · 1=B · 2=C · 3=UNKNOWN · 4=preflight
 */
import { existsSync, readlinkSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  AgentOs,
  createHostDirBackend,
  type JsonRpcNotification,
  type MountConfig,
} from "@rivet-dev/agentos-core";

const HERE = dirname(fileURLToPath(import.meta.url));
const AOSPKG = join(HERE, "packed/hermes.aospkg");

/** Typed stderr prefix from acp-shim.ts — B requires this exact family. */
const SHIM_NOT_FOUND_PREFIX = "hermes-acp-shim: HERMES_BIN not found:";

/** Absolute Hermes executable — venv binary (no PATH / env-bash wrapper). */
const HERMES_BIN =
  process.env.HERMES_BIN ??
  join(homedir(), ".hermes/hermes-agent/venv/bin/hermes");
const HOME = process.env.HOME ?? homedir();

/**
 * Narrow RO mounts so guest can exec the venv hermes shebang.
 * - hermes-agent install (not ~/.hermes — auth.json stays off the guest)
 * - uv cpython real + symlink path (venv/bin/python → cpython-3.11 → 3.11.15)
 */
function hermesReachabilityMounts(): MountConfig[] {
  const hermesAgent = join(homedir(), ".hermes/hermes-agent");
  const mounts: MountConfig[] = [];
  if (existsSync(hermesAgent)) {
    mounts.push({
      path: hermesAgent,
      plugin: createHostDirBackend({ hostPath: hermesAgent, readOnly: true }),
      readOnly: true,
    });
  }
  try {
    const pyLink = readlinkSync(join(hermesAgent, "venv/bin/python"));
    const pyLinkRoot = dirname(dirname(pyLink));
    let pyRealRoot = pyLinkRoot;
    try {
      pyRealRoot = readlinkSync(pyLinkRoot);
    } catch {
      /* pyLinkRoot may already be the real directory */
    }
    if (existsSync(pyRealRoot)) {
      mounts.push({
        path: pyRealRoot,
        plugin: createHostDirBackend({ hostPath: pyRealRoot, readOnly: true }),
        readOnly: true,
      });
      if (pyLinkRoot !== pyRealRoot) {
        mounts.push({
          path: pyLinkRoot,
          plugin: createHostDirBackend({ hostPath: pyRealRoot, readOnly: true }),
          readOnly: true,
        });
      }
    }
  } catch (err) {
    console.error("d0-smoke: could not resolve uv python mounts", err);
  }
  return mounts;
}

function sessionIdFromNotification(
  event: JsonRpcNotification,
): string | null {
  if (event.method !== "session/update") return null;
  const params = event.params;
  if (!params || typeof params !== "object") return null;
  const sid = (params as { sessionId?: unknown }).sessionId;
  return typeof sid === "string" && sid.length > 0 ? sid : null;
}

/**
 * Positive classification only.
 * B = host binary exists ∧ createSession failed ∧ shim typed not-found in error text.
 * C = protocol-shape signatures (without the shim not-found evidence).
 * UNKNOWN = anything else — never claim B.
 */
function classifyCreateSessionFailure(
  err: unknown,
  hostBinaryExists: boolean,
): { outcome: "B" | "C" | "UNKNOWN"; exit: number } {
  const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  const shimNotFound = msg.includes(SHIM_NOT_FOUND_PREFIX);

  if (hostBinaryExists && shimNotFound) {
    return { outcome: "B", exit: 1 };
  }

  const lower = msg.toLowerCase();
  const protocolShape =
    (lower.includes("unsupported method") ||
      lower.includes("parse error") ||
      lower.includes("invalid request") ||
      lower.includes("protocol version") ||
      lower.includes("jsonrpc")) &&
    !shimNotFound;

  if (protocolShape) {
    return { outcome: "C", exit: 2 };
  }

  return { outcome: "UNKNOWN", exit: 3 };
}

async function main(): Promise<number> {
  console.log("d0-smoke: HERMES_BIN=", HERMES_BIN);
  console.log("d0-smoke: HOME=", HOME);
  console.log("d0-smoke: package=", AOSPKG);

  if (!existsSync(AOSPKG)) {
    console.error("d0-smoke: missing packed package — run bun run pack-agent");
    return 4;
  }
  const hostBinaryExists = existsSync(HERMES_BIN);
  if (!hostBinaryExists) {
    console.error("d0-smoke: HERMES_BIN not found on host:", HERMES_BIN);
    console.error(
      "OUTCOME UNKNOWN — cannot claim B without a host binary present for comparison",
    );
    return 3;
  }

  const mounts = hermesReachabilityMounts();
  console.log(
    "d0-smoke: mounts=",
    JSON.stringify(
      mounts.map((m) => ({
        path: m.path,
        plugin: "host_dir",
        readOnly: m.readOnly ?? true,
      })),
    ),
  );

  const env = {
    HERMES_BIN,
    HOME,
  };
  console.log("d0-smoke: createSession env keys=", Object.keys(env).join(","));
  console.log("d0-smoke: hostBinaryExists=", hostBinaryExists);

  let os: AgentOs | null = null;
  try {
    os = await AgentOs.create({
      defaultSoftware: false,
      software: [],
      mounts,
      onAgentStderr: (ev) => {
        const text =
          typeof ev === "string"
            ? ev
            : String(
                (ev as { data?: unknown })?.data ??
                  (ev as { message?: unknown })?.message ??
                  ev,
              );
        console.error("d0-smoke: agent stderr:", text.slice(0, 800));
      },
    });
    await os.linkSoftware({ packagePath: AOSPKG });
    console.log("d0-smoke: linkSoftware ok");

    const created = await os.createSession("hermes", { env });
    const session = created.sessionId;
    console.log(`d0-smoke: createSession returned session=${session}`);

    let guestMinted: string | null = null;
    const unsub = os.onSessionEvent(session, (event) => {
      const sid = sessionIdFromNotification(event);
      if (sid && !guestMinted) {
        guestMinted = sid;
        console.log(`d0-smoke: first session/update guestMinted=${sid}`);
      }
    });

    // Handshake-only window: never prompt. Wait briefly for ACP traffic.
    await Bun.sleep(2000);
    unsub();

    const listed = os.listSessions().map((s) => s.sessionId);
    console.log("d0-smoke: listSessions=", JSON.stringify(listed));

    if (!listed.includes(session)) {
      console.error(
        "OUTCOME UNKNOWN — createSession returned an id not in listSessions",
      );
      console.error("d0-smoke: session=", session, "listed=", listed);
      await os.destroySession(session).catch(() => {});
      return 3;
    }

    const acpId = guestMinted ?? session;
    console.log(`d0-smoke: session=${session} guestMinted=${acpId}`);
    if (session !== acpId) {
      console.error(
        `OUTCOME C — ID adoption failed session=${session} guestMinted=${acpId}`,
      );
      await os.destroySession(session).catch(() => {});
      return 2;
    }

    console.log(
      `OUTCOME A — ACP handshake ok session=${session} guestMinted=${acpId}`,
    );
    console.log(
      "d0-smoke: note — Hermes also has an internal session id (provenance); Kernel adopts ACP id only.",
    );

    await os.destroySession(session).catch(() => {});
    return 0;
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    const stack = err instanceof Error ? err.stack : "";
    console.error("d0-smoke: ERROR", msg);
    if (stack) console.error(stack);

    // createSession failed (we are in catch) — classify positively.
    const { outcome, exit } = classifyCreateSessionFailure(err, hostBinaryExists);
    if (outcome === "B") {
      console.error(
        "OUTCOME B — positive: hostBinaryExists ∧ createSession failed ∧ shim typed stderr",
      );
      console.error(`d0-smoke: matched prefix=${JSON.stringify(SHIM_NOT_FOUND_PREFIX)}`);
    } else if (outcome === "C") {
      console.error("OUTCOME C — protocol drift (unstable ACP vs SDK)");
    } else {
      console.error(
        "OUTCOME UNKNOWN — createSession failed without B or C evidence; do not claim B",
      );
    }
    return exit;
  } finally {
    if (os) await os.dispose?.().catch(() => {});
  }
}

process.exit(await main());
