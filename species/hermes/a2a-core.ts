/**
 * WO-008e shared A2A bus core (single protocol owner).
 * Electron and headless smoke supply thin adapters only.
 */
export type A2aRole =
  | "orchestrator"
  | "worker_a"
  | "worker_b"
  | "reviewer";

export type A2aHop = "fan_out" | "submission" | "talk_back";

/** How host surfaces a hop into a seat. Default for founder UX: display. */
export type DeliveryChannel = "display" | "stdin" | "both";

export type A2aSeat = {
  role: A2aRole;
  sessionId: string;
  /** Opaque handle for the delivery adapter (PTY id, inject path, …). */
  deliveryId: string;
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
  attr?: string;
};

export type PublishArtifactFn = (opts: {
  envelope: A2aEnvelope;
  /** Canonical relative/absolute path for storage_ref. */
  storagePath: string;
  bytes: Uint8Array;
}) => { artifactId: string };

export type DeliverFn = (opts: {
  seat: A2aSeat;
  text: string;
  channel: DeliveryChannel;
  envelope: A2aEnvelope;
}) => void;

export type A2aBusAdapters = {
  publishArtifact: PublishArtifactFn;
  deliver: DeliverFn;
  /** Directory for artifact JSON files (caller creates). */
  artifactDir: string;
  /** Default delivery channel (display-only unless overridden). */
  defaultChannel?: DeliveryChannel;
  /** Write artifact files (injected so tests can stub). */
  writeFile: (path: string, bytes: Uint8Array) => void;
  joinPath: (...parts: string[]) => string;
};

export type PublishAndDeliverOpts = {
  hop: A2aHop;
  fromRole: A2aRole;
  toRoles: A2aRole[];
  body: string;
  task?: string;
  attr?: string;
  dispatchId?: string;
  channel?: DeliveryChannel;
};

export type PublishAndDeliverResult = {
  artifactId: string;
  dispatchId: string;
  /** Roles that received host delivery (empty when delivery disabled). */
  deliveredRoles: A2aRole[];
  skippedRoles: A2aRole[];
  envelope: A2aEnvelope;
};

export function formatDelivery(env: A2aEnvelope): string {
  return (
    `\r\n\r\n── QF-A2A ${env.hop} dispatch=${env.dispatch_id}` +
    (env.attr ? ` attr=${env.attr}` : "") +
    ` ──\r\n` +
    `${env.body}\r\n` +
    `── end QF-A2A ──\r\n`
  );
}

/** Single canonical artifact filename shape (bus + smoke must match). */
export function artifactFilename(
  hop: A2aHop,
  dispatchId: string,
  attr?: string,
): string {
  return `${hop}-${dispatchId.slice(0, 8)}-${attr ?? "x"}.json`;
}

export function buildEnvelope(opts: {
  hop: A2aHop;
  dispatchId: string;
  from: A2aSeat;
  targets: A2aSeat[];
  toRoles: A2aRole[];
  body: string;
  task?: string;
  attr?: string;
}): A2aEnvelope {
  return {
    a2a: "1",
    hop: opts.hop,
    dispatch_id: opts.dispatchId,
    from_role: opts.from.role,
    to_roles: opts.toRoles,
    from_session: opts.from.sessionId,
    to_sessions: opts.targets.map((t) => t.sessionId),
    task: opts.task,
    body: opts.body,
    attr: opts.attr,
  };
}

export type A2aBus = {
  registerSeat: (seat: A2aSeat) => void;
  clearSeats: () => void;
  getSeat: (role: A2aRole) => A2aSeat | undefined;
  listSeats: () => A2aSeat[];
  setDeliveryEnabled: (on: boolean) => void;
  isDeliveryEnabled: () => boolean;
  publishAndDeliver: (opts: PublishAndDeliverOpts) => PublishAndDeliverResult;
};

/** Instance-scoped bus — no process-global seats/delivery flag. */
export function createA2aBus(adapters: A2aBusAdapters): A2aBus {
  const seats = new Map<A2aRole, A2aSeat>();
  let deliveryEnabled = true;
  const defaultChannel = adapters.defaultChannel ?? "display";

  return {
    registerSeat(seat) {
      seats.set(seat.role, seat);
    },
    clearSeats() {
      seats.clear();
    },
    getSeat(role) {
      return seats.get(role);
    },
    listSeats() {
      return [...seats.values()];
    },
    setDeliveryEnabled(on) {
      deliveryEnabled = on;
    },
    isDeliveryEnabled() {
      return deliveryEnabled;
    },
    publishAndDeliver(opts) {
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
      const envelope = buildEnvelope({
        hop: opts.hop,
        dispatchId,
        from,
        targets,
        toRoles: opts.toRoles,
        body: opts.body,
        task: opts.task,
        attr: opts.attr,
      });

      const storagePath = adapters.joinPath(
        adapters.artifactDir,
        artifactFilename(opts.hop, dispatchId, opts.attr),
      );
      const bytes = new TextEncoder().encode(
        `${JSON.stringify(envelope, null, 2)}\n`,
      );
      adapters.writeFile(storagePath, bytes);

      const { artifactId } = adapters.publishArtifact({
        envelope,
        storagePath,
        bytes,
      });

      const text = formatDelivery(envelope);
      const channel = opts.channel ?? defaultChannel;
      const deliveredRoles: A2aRole[] = [];
      const skippedRoles: A2aRole[] = [];

      if (!deliveryEnabled) {
        for (const t of targets) skippedRoles.push(t.role);
        return {
          artifactId,
          dispatchId,
          deliveredRoles,
          skippedRoles,
          envelope,
        };
      }

      for (const t of targets) {
        adapters.deliver({ seat: t, text, channel, envelope });
        deliveredRoles.push(t.role);
      }
      return {
        artifactId,
        dispatchId,
        deliveredRoles,
        skippedRoles,
        envelope,
      };
    },
  };
}

/** Simultaneity: one dispatch_id targeting N roles in one publishAndDeliver. */
export function assertFanOutSimultaneous(
  result: PublishAndDeliverResult,
  expectedRoles: A2aRole[],
): void {
  if (result.envelope.to_roles.length !== expectedRoles.length) {
    throw new Error(
      `a2a: fan-out expected ${expectedRoles.length} targets, got ${result.envelope.to_roles.length}`,
    );
  }
  for (const r of expectedRoles) {
    if (!result.envelope.to_roles.includes(r)) {
      throw new Error(`a2a: fan-out missing target ${r}`);
    }
    if (!result.deliveredRoles.includes(r)) {
      throw new Error(`a2a: fan-out did not deliver to ${r}`);
    }
  }
  if (result.deliveredRoles.length !== expectedRoles.length) {
    throw new Error(
      `a2a: fan-out delivered ${result.deliveredRoles.length}, expected ${expectedRoles.length}`,
    );
  }
}
