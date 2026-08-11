export type LivePeerIdentity = { sessionId: string; role: string };

export function resolveLivePeerRecipient(
  requestedRole: string,
  deps: {
    ptyIdsForRole: (role: string) => string[];
    kernelSessionForPty: (ptySessionId: string) => string | undefined;
    getSession: (sessionId: string) => Record<string, unknown> | null;
    identityForSession: (sessionId: string) => LivePeerIdentity;
  },
): LivePeerIdentity {
  const role = requestedRole.trim();
  if (!role) throw new Error("collaboration recipient role must be non-empty");
  const ptyIds = deps.ptyIdsForRole(role);
  if (ptyIds.length !== 1) {
    throw new Error(`collaboration requires exactly one live native PTY for role ${role}`);
  }
  const sessionId = deps.kernelSessionForPty(ptyIds[0]!);
  if (!sessionId) {
    throw new Error(`collaboration PTY is not owned by a Kernel native session for role ${role}`);
  }
  const session = deps.getSession(sessionId);
  if (!session || session.status !== "running") {
    throw new Error(`collaboration recipient Kernel session is not running for role ${role}`);
  }
  const identity = deps.identityForSession(sessionId);
  if (identity.role !== role) {
    throw new Error(`collaboration recipient role mismatch: requested=${role} actual=${identity.role}`);
  }
  return identity;
}
