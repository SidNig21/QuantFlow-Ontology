/**
 * Object-type registry drift detection (WO-K3).
 *
 * Pure comparison of declared schema object names against schema_meta rows and
 * sqlite_master tables. It never opens a database — callers supply the three
 * sets. Silence on mismatch is how debt #27 stayed invisible; this function is
 * the named check.
 */

export type RegistryDriftReport = {
  ok: true;
} | {
  ok: false;
  missing: string[];
  retired: string[];
  inconsistent: string[];
};

/** Infrastructure tables that are not ontology object types. */
const INFRA_TABLES = new Set([
  "events",
  "links",
  "schema_meta",
  "sqlite_sequence",
  // R15 durable governed-review support tables, not ontology object types.
  "qf_review_source_work",
  "qf_review_task",
  "qf_review_invocation",
  "qf_review_attempt",
  "qf_review_receipt",
  "qf_review_publication",
]);

function sortedUnique(names: Iterable<string>): string[] {
  return [...new Set(names)].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/**
 * Compare declared object types to on-disk registry facts.
 *
 * - missing: declared but absent from schema_meta
 * - retired: schema_meta object no longer declared
 * - inconsistent: meta/table disagreement either way (claimed without table, or
 *   non-infra table without an object meta claim)
 */
export function detectObjectTypeRegistryDrift(input: {
  declared: readonly string[];
  metaObjects: readonly string[];
  tables: readonly string[];
}): RegistryDriftReport {
  const declared = new Set(input.declared);
  const meta = new Set(input.metaObjects);
  const tables = new Set(input.tables);

  const missing = sortedUnique([...declared].filter((n) => !meta.has(n)));
  const retired = sortedUnique([...meta].filter((n) => !declared.has(n)));

  const inconsistent = new Set<string>();
  for (const name of meta) {
    if (!tables.has(name)) inconsistent.add(name);
  }
  for (const name of tables) {
    if (INFRA_TABLES.has(name)) continue;
    if (!meta.has(name)) inconsistent.add(name);
  }

  const inconsistentList = sortedUnique(inconsistent);
  if (
    missing.length === 0 &&
    retired.length === 0 &&
    inconsistentList.length === 0
  ) {
    return { ok: true };
  }
  return {
    ok: false,
    missing,
    retired,
    inconsistent: inconsistentList,
  };
}
