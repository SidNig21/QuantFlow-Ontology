-- qf-kernel-schema generated upgrade: connection-actions
-- DO NOT EDIT â€” regenerate with `bun run generate`.

INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('create_connection', 'action', 'experimental', 'Create a typed canvas connection edge (kind data|control|view) between two port refs. It persists projection wiring only through the Kernel command path â€” never a second truth store or a self-loop.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('delete_connection', 'action', 'experimental', 'Delete a connection row by id and append connection.deleted. Hard delete only â€” the ontology has no tombstone field, and canvas persistence must never keep the edge.');
