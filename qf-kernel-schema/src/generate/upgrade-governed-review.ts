/** Generate the R15 upgrade from the current governed-review schema. */
export function generateUpgradeGovernedReview(): string {
  return `-- qf-kernel-schema generated R15 upgrade
-- Adds strict review metadata without changing legacy evaluation meaning.

CREATE TABLE artifact__r15_upgrade (
  id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL,
  kind TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  storage_ref TEXT NOT NULL,
  CHECK (kind IN ('strategy_spec', 'code', 'result_set', 'report', 'trajectory', 'evaluation_findings'))
);
INSERT INTO artifact__r15_upgrade (id, created_at, kind, content_hash, storage_ref)
  SELECT id, created_at, kind, content_hash, storage_ref FROM artifact;
DROP TABLE artifact;
ALTER TABLE artifact__r15_upgrade RENAME TO artifact;

ALTER TABLE evaluation ADD COLUMN rubric TEXT;
ALTER TABLE evaluation ADD COLUMN overall REAL;
ALTER TABLE evaluation ADD COLUMN run_metrics TEXT;
ALTER TABLE evaluation ADD COLUMN findings_artifact_id TEXT;
ALTER TABLE evaluation ADD COLUMN broker_invocation_id TEXT;
ALTER TABLE evaluation ADD COLUMN review_task_id TEXT;
ALTER TABLE evaluation ADD COLUMN source_work TEXT;
ALTER TABLE evaluation ADD COLUMN publication_report_id TEXT;
ALTER TABLE evaluation ADD COLUMN block_reason TEXT;
`;
}
