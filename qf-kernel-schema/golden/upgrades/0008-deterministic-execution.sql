-- qf-kernel-schema generated upgrade: deterministic-execution
-- DO NOT EDIT — regenerate with `bun run generate`.

DELETE FROM schema_meta WHERE type_name = 'execute_deterministic_run';
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('execute_deterministic_run', 'action', 'experimental', 'Execute one canonical strategy specification against one immutable Dataset. The Kernel owns the execution version, result bytes, content hash, and complete uses/executes_in/produces lineage; a claimed repeat is rejected unless its manifest and result hash match.');
