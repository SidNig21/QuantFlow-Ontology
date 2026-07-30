-- qf-kernel-schema generated upgrade: agent-profile-identity
-- DO NOT EDIT — regenerate with `bun run generate`.

ALTER TABLE agent_definition ADD COLUMN runtime_profile TEXT;

-- Typed directed edges between ontology objects.
CREATE TABLE links_d1_upgrade (
  -- Primary key for this link instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- Link kind (schema link name), e.g. offered_on.
  kind TEXT NOT NULL CHECK (kind IN ('participates_in', 'offered_on', 'quotes', 'lists', 'settles', 'tests', 'has_leg', 'uses', 'executes_in', 'produces', 'derived_from', 'evaluated_by', 'gates', 'assigned_to', 'delegates_to', 'spawned_from')),
  -- Source object id.
  from_id TEXT NOT NULL,
  -- Target object id.
  to_id TEXT NOT NULL,
  -- ISO-8601 UTC timestamp when the link was created.
  created_at TEXT NOT NULL
);
INSERT INTO links_d1_upgrade (id, kind, from_id, to_id, created_at) SELECT id, kind, from_id, to_id, created_at FROM links;
DROP TABLE links;
ALTER TABLE links_d1_upgrade RENAME TO links;

UPDATE schema_meta SET description = 'An agent_definition is one founder-visible Dock profile. It governs spawn admission through package_ref while runtime_profile selects the adapter profile without encoding per-session state.' WHERE type_name = 'agent_definition';
INSERT OR REPLACE INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('spawned_from', 'link', 'experimental', 'Session identity: which agent_definition profile created this agent_session.');
UPDATE schema_meta SET description = 'Create an agent_session by adopting a guest-minted session_id (Kernel never mints). Requires agent_definition_id and atomically links spawned_from; label is presentation-only.' WHERE type_name = 'create_agent_session';
UPDATE schema_meta SET description = 'Register a Dock profile in the Kernel registry (id = name). Duplicate names are rejected; operator-only because it controls package_ref and runtime_profile.' WHERE type_name = 'register_agent_definition';
