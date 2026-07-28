/**
 * Pinned prior Kernel object-type snapshot (WO-K3 RULING 4 strategy A).
 *
 * This module documents the declared side for gate G1 only — never import live
 * qf-kernel-schema for the dirty fixture side. Pair with migration.sql in this
 * directory to build a known-old on-disk registry.
 */
export const PRIOR_OBJECT_TYPES = [
  "artifact",
  "agent_session",
  "run",
] as const;

export type PriorObjectType = (typeof PRIOR_OBJECT_TYPES)[number];
