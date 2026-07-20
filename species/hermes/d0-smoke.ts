/**
 * WO-008 deliverable 0 — fact-finding through the real admission path.
 * linkSoftware → createSession("hermes", { env }) — NEVER prompt Hermes.
 *
 * Outcomes: A (handshake OK) · B (guest cannot reach host install) · C (protocol drift)
 */
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { AgentOs, type JsonRpcNotification } from "@rivet-dev/agentos-core";

const HERE = dirname(fileURLToPath(import.meta.url));
const AOSPKG = join(HERE, "packed/hermes.aospkg");

/** Absolute Hermes executable — venv binary (no PATH / env-bash wrapper). */
const HERMES_BIN =
  process.env.HERMES_BIN ??
  join(homedir(), ".hermes/hermes-agent/venv/bin/hermes");
const HOME = process.env.HOME ?? homedir();

function sessionIdFromNotification(
  event: JsonRpcNotification,
): string | null {
  if (event.method !== "session/update") return null;
  const params = event.params;
  if (!params || typeof params !== "object") return null;
  const sid = (params as { sessionId?: unknown }).sessionId;
  return typeof sid === "string" && sid.length > 0 ? sid : null;
}

async function main(): Promise<number> {
  console.log("d0-smoke: HERMES_BIN=", HERMES_BIN);
  console.log("d0-smoke: HOME=", HOME);
  console.log("d0-smoke: package=", AOSPKG);

  if (!existsSync(AOSPKG)) {
    console.error("d0-smoke: missing packed package — run bun run pack-agent");
    return 1;
  }
  if (!existsSync(HERMES_BIN)) {
    console.error("d0-smoke: HERMES_BIN not found:", HERMES_BIN);
    return 1;
  }

  const env = {
    HERMES_BIN,
    HOME,
  };
  console.log("d0-smoke: createSession env keys=", Object.keys(env).join(","));

  let os: AgentOs | null = null;
  try {
    os = await AgentOs.create({
      defaultSoftware: false,
      software: [],
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

    // listSessions is also evidence of a live session
    const listed = os.listSessions().map((s) => s.sessionId);
    console.log("d0-smoke: listSessions=", JSON.stringify(listed));

    if (!listed.includes(session)) {
      console.error(
        "OUTCOME C or B: createSession id not in listSessions after handshake window",
      );
      console.error("d0-smoke: session=", session, "listed=", listed);
      await os.destroySession(session).catch(() => {});
      return 1;
    }

    // Prefer notification ACP id when present; otherwise createSession id is the ACP id.
    const acpId = guestMinted ?? session;
    console.log(
      `d0-smoke: session=${session} guestMinted=${acpId}`,
    );
    if (session !== acpId) {
      console.error(
        `OUTCOME C: ID adoption failed session=${session} guestMinted=${acpId}`,
      );
      await os.destroySession(session).catch(() => {});
      return 1;
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

    const lower = msg.toLowerCase();
    // Guest isolation / missing host binary is B even when ACP "initialize" is in the error text.
    if (
      lower.includes("hermes_bin not found") ||
      lower.includes("not found:") ||
      lower.includes("enoent") ||
      lower.includes("guest") ||
      lower.includes("cannot reach")
    ) {
      console.error(
        "OUTCOME B — guest space cannot reach host install (or spawn/handshake failed)",
      );
    } else if (
      lower.includes("protocol") ||
      lower.includes("jsonrpc") ||
      lower.includes("parse") ||
      lower.includes("unsupported") ||
      (lower.includes("initialize") && !lower.includes("not found"))
    ) {
      console.error("OUTCOME C — protocol drift (unstable ACP vs SDK)");
    } else {
      console.error(
        "OUTCOME B — guest space cannot reach host install (or spawn/handshake failed)",
      );
    }
    return 1;
  } finally {
    if (os) await os.dispose?.().catch(() => {});
  }
}

process.exit(await main());
