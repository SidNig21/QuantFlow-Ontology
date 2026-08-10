export type PrecreatedStartCaller = { sessionId: string; role: string };

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
