-- qf-kernel-schema generated upgrade: market-context
-- DO NOT EDIT — regenerate with `bun run generate`.

INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('register_venue', 'action', 'experimental', 'Register one trusted venue identity from an existing source Artifact. Operator-only provenance is required and retries must preserve the original venue rather than silently updating it.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('schedule_market_event', 'action', 'experimental', 'Schedule one trusted market event from an existing source Artifact. Operator-only provenance is required and creation always writes scheduled state without accepting a caller-supplied status.');
