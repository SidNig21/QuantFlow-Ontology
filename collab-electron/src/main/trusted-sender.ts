/**
 * Pure predicate for IPC sender checks (WO-006c).
 * Unit-tested with red/green falsification — keep free of Electron imports.
 */

export function isTrustedSender(
  senderId: number,
  knownIds: ReadonlySet<number>,
): boolean {
  return knownIds.has(senderId);
}
