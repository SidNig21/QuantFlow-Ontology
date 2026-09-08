type Selection = { tileId: string; sessionId: string };

const selectedByRenderer = new Map<number, Selection>();

export type SelectedAgentAuthority = {
  isLive: (sessionId: string) => boolean;
  roleFor: (sessionId: string) => string | null;
};

/** Ephemeral Main-owned selection authority. It never survives process exit. */
export function selectAgentSurface(senderId: number, input: unknown, authority: SelectedAgentAuthority): void {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    selectedByRenderer.delete(senderId);
    return;
  }
  const row = input as Record<string, unknown>;
  const tileId = typeof row.tileId === "string" ? row.tileId.trim() : "";
  const sessionId = typeof row.sessionId === "string" ? row.sessionId.trim() : "";
  if (!tileId || !sessionId || !authority.isLive(sessionId) || authority.roleFor(sessionId) !== "orchestrator") {
    selectedByRenderer.delete(senderId);
    return;
  }
  selectedByRenderer.set(senderId, { tileId, sessionId });
}

export function selectedDirectorForTask(senderId: number, tileId: unknown, authority: SelectedAgentAuthority): string {
  const selected = selectedByRenderer.get(senderId);
  if (!selected || typeof tileId !== "string" || selected.tileId !== tileId.trim()) throw new Error("Create Task requires the currently selected Director tile");
  if (!authority.isLive(selected.sessionId) || authority.roleFor(selected.sessionId) !== "orchestrator") {
    selectedByRenderer.delete(senderId);
    throw new Error("Create Task requires a live selected Director");
  }
  return selected.sessionId;
}

export function clearSelectedAgentSurface(senderId: number): void {
  selectedByRenderer.delete(senderId);
}
