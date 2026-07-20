/**
 * WO-008e — Kernel-mediated A2A bus (no schema column / no create_task).
 *
 * Fan-out / submissions / talk-back are `publish_artifact` reports whose JSON
 * names roles + session ids. Host delivery into term tiles is writeToSession
 * (disable for side-channel falsify).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { COLLAB_DIR } from "./paths";
import { kernelExecute, type TraceContext } from "./kernel";
import { displayOnSession, writeToSession } from "./pty";

export type A2aRole =
  | "orchestrator"
  | "worker_a"
  | "worker_b"
  | "reviewer";

export type A2aHop = "fan_out" | "submission" | "talk_back";

export type A2aSeat = {
  role: A2aRole;
  sessionId: string;
  ptySessionId: string;
};

export type A2aEnvelope = {
  a2a: "1";
  hop: A2aHop;
  dispatch_id: string;
  from_role: A2aRole;
  to_roles: A2aRole[];
  from_session: string;
  to_sessions: string[];
  task?: string;
  body: string;
  /** Distinguish Worker A vs B on fan-in. */
  attr?: string;
};

let deliveryEnabled = true;
const seats = new Map<A2aRole, A2aSeat>();

export function setA2aDeliveryEnabled(on: boolean): void {
  deliveryEnabled = on;
  console.log(`a2a-bus: deliveryEnabled=${on}`);
}

export function isA2aDeliveryEnabled(): boolean {
  return deliveryEnabled;
}

export function clearA2aSeats(): void {
  seats.clear();
}

export function registerA2aSeat(seat: A2aSeat): void {
  seats.set(seat.role, seat);
  console.log(
    `a2a-bus: seat role=${seat.role} session=${seat.sessionId} pty=${seat.ptySessionId}`,
  );
}

export function getA2aSeat(role: A2aRole): A2aSeat | undefined {
  return seats.get(role);
}

export function listA2aSeats(): A2aSeat[] {
  return [...seats.values()];
}

function newTrace(): TraceContext {
  return {
    trace_id: crypto.randomUUID(),
    span_id: crypto.randomUUID(),
  };
}

function formatDelivery(env: A2aEnvelope): string {
  return (
    `\r\n\r\n── QF-A2A ${env.hop} dispatch=${env.dispatch_id}` +
    (env.attr ? ` attr=${env.attr}` : "") +
    ` ──\r\n` +
    `${env.body}\r\n` +
    `── end QF-A2A ──\r\n`
  );
}

/**
 * One Kernel publish + host delivery to each target seat.
 * Fan-out uses a single call with two to_roles (simultaneous dispatch).
 */
export function publishAndDeliver(opts: {
  hop: A2aHop;
  fromRole: A2aRole;
  toRoles: A2aRole[];
  body: string;
  task?: string;
  attr?: string;
  /** Reuse for submissions/talk-back under the same fan-out. */
  dispatchId?: string;
}): {
  artifactId: string;
  dispatchId: string;
  deliveredAt: Record<string, string>;
  skipped: string[];
} {
  const from = seats.get(opts.fromRole);
  if (!from) {
    throw new Error(`a2a-bus: missing seat ${opts.fromRole}`);
  }
  const targets: A2aSeat[] = [];
  for (const role of opts.toRoles) {
    const s = seats.get(role);
    if (!s) throw new Error(`a2a-bus: missing seat ${role}`);
    targets.push(s);
  }

  const dispatchId = opts.dispatchId ?? crypto.randomUUID();
  const envelope: A2aEnvelope = {
    a2a: "1",
    hop: opts.hop,
    dispatch_id: dispatchId,
    from_role: opts.fromRole,
    to_roles: opts.toRoles,
    from_session: from.sessionId,
    to_sessions: targets.map((t) => t.sessionId),
    task: opts.task,
    body: opts.body,
    attr: opts.attr,
  };

  const dir = join(COLLAB_DIR, "a2a");
  mkdirSync(dir, { recursive: true });
  const path = join(
    dir,
    `${opts.hop}-${dispatchId.slice(0, 8)}-${opts.attr ?? "x"}.json`,
  );
  const bytes = Buffer.from(JSON.stringify(envelope, null, 2), "utf8");
  writeFileSync(path, bytes);

  const pub = kernelExecute(
    "publish_artifact",
    {
      kind: "report",
      path,
      storage_ref: path,
    },
    newTrace(),
  );
  const artifactId = String(pub.object_id);

  const deliveredAt: Record<string, string> = {};
  const skipped: string[] = [];
  const text = formatDelivery(envelope);

  if (!deliveryEnabled) {
    for (const t of targets) skipped.push(t.role);
    console.log(
      `a2a-bus: ${opts.hop} artifact=${artifactId} dispatch=${dispatchId} DELIVERY OFF — silent`,
    );
    return { artifactId, dispatchId, deliveredAt, skipped };
  }

  for (const t of targets) {
    const at = new Date().toISOString();
    // Visible in term tile (host adapter). Also feed stdin for agents that care.
    displayOnSession(t.ptySessionId, text);
    writeToSession(t.ptySessionId, text);
    deliveredAt[t.role] = at;
  }
  console.log(
    `a2a-bus: ${opts.hop} artifact=${artifactId} dispatch=${dispatchId}` +
      ` delivered=${JSON.stringify(deliveredAt)}`,
  );
  return { artifactId, dispatchId, deliveredAt, skipped };
}
