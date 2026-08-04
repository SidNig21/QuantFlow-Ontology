-- qf-kernel-schema generated upgrade: capability-grants
-- DO NOT EDIT — regenerate with `bun run generate`.

ALTER TABLE agent_definition ADD COLUMN capability_groups TEXT NOT NULL DEFAULT '[]';

UPDATE schema_meta SET description = 'An agent_definition is one founder-visible Dock profile. It governs spawn admission through package_ref while runtime_profile selects the adapter profile without encoding per-session state.' WHERE type_name = 'agent_definition';
