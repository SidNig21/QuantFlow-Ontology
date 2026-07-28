-- Canary incomplete DB (WO-K3 RULING 3): schema_meta name only — no artifact table.
CREATE TABLE schema_meta (
  type_name TEXT PRIMARY KEY NOT NULL,
  kind TEXT NOT NULL,
  lifecycle TEXT NOT NULL CHECK (lifecycle IN ('experimental', 'active')),
  description TEXT NOT NULL
);

INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES
('artifact', 'object', 'experimental', 'Canary-only row — table absent to prove incomplete-init guard.');
