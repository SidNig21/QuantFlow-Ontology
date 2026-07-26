import { KernelError } from "./errors.ts";

/**
 * System-produced vs externally-observed creation — derived from which verb is
 * invoked, never accepted as caller input. A second ingested type adopts the
 * same helpers without copying per-handler bodies.
 */
export type CreationProvenance = "system" | "observed";

/** Row-level origin written for ticket objects — keyed by provenance, not input. */
export const TICKET_ORIGIN: Record<
  CreationProvenance,
  "strategy_proposed" | "operator_supplied"
> = {
  system: "strategy_proposed",
  observed: "operator_supplied",
};

/**
 * System-produced creates reject caller-supplied initial state — never coerce.
 * Used by create_run (status) and create_ticket (grade).
 */
export function rejectSuppliedInitialState(
  input: Record<string, unknown>,
  field: string,
  action: string,
): void {
  if (
    Object.prototype.hasOwnProperty.call(input, field) &&
    input[field] !== undefined &&
    input[field] !== null
  ) {
    throw new KernelError(`${action} does not accept "${field}"`);
  }
}

/** Observed creates require an explicit grade (terminal grades allowed). */
export function requireObservedGrade(
  input: Record<string, unknown>,
  action: string,
  allowed: readonly string[],
): string {
  const grade = input.grade;
  if (grade === undefined || grade === null) {
    throw new KernelError(`${action} requires "grade"`);
  }
  const value = String(grade);
  if (!allowed.includes(value)) {
    throw new KernelError(
      `${action} grade must be ${allowed.join("|")}`,
    );
  }
  return value;
}

/** Event type for an observed row — observation, never a synthetic transition. */
export function observationEvent(objectType: string): string {
  return `${objectType}.observed`;
}
