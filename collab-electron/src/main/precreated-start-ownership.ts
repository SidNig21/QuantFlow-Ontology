export type PrecreatedStartCaller = { sessionId: string; role: string };

export function assertPrecreatedStartOwnership(
  callerSessionId: string,
  targetSessionId: string,
  incomingDelegations: Array<{ from_id: string; to_id: string }>,
): void {
  const owned = incomingDelegations.filter((link) => link.to_id === targetSessionId);
  if (owned.length !== 1 || owned[0]!.from_id !== callerSessionId) {
    throw new Error(
      "precreated agent session must have exactly one delegates_to link from authenticated caller",
    );
  }
}

/** Preserve the authenticated caller across the async gateway/host boundary. */
export async function invokePrecreatedStart(
  caller: PrecreatedStartCaller,
  sessionId: unknown,
  start: (caller: PrecreatedStartCaller, sessionId: string) => Promise<unknown>,
): Promise<unknown> {
  if (typeof sessionId !== "string" || sessionId.length === 0) {
    throw new Error("start_agent_session requires session_id");
  }
  return await start(caller, sessionId);
}
