/**
 * Process-local admission binding for Research Director delegation.
 * The durable belongs_to edge remains Kernel truth; this map only proves that
 * a currently admitted Director may create new work for the reopened Mission.
 */
const missionByDirectorSession = new Map<string, string>();

export function bindMissionToDirectorSession(missionId: string, sessionId: string): void {
  if (!missionId || !sessionId) throw new Error("Mission admission binding requires mission and session ids");
  missionByDirectorSession.set(sessionId, missionId);
}

export function missionForDirectorSession(sessionId: string): string | undefined {
  return missionByDirectorSession.get(sessionId);
}

export function clearMissionForDirectorSession(sessionId: string): void {
  missionByDirectorSession.delete(sessionId);
}

export function clearMissionContext(): void {
  missionByDirectorSession.clear();
}
