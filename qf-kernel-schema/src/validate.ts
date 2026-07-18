import { transitions, type StatefulType } from "./transitions.ts";

export function canTransition(type: string, from: string, to: string): boolean {
  if (!(type in transitions)) return false;
  const table = transitions[type as StatefulType] as Record<string, readonly string[]>;
  const allowed = table[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

export function assertTransition(type: string, from: string, to: string): void {
  if (!canTransition(type, from, to)) {
    throw new Error(`Illegal transition for ${type}: ${from} → ${to}`);
  }
}
