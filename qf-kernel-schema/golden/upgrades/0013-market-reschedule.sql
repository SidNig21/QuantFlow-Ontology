-- qf-kernel-schema generated upgrade: market-reschedule
-- DO NOT EDIT — regenerate with `bun run generate`.

INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('reschedule_market_event', 'action', 'experimental', 'A reschedule_market_event records a newer trusted pre-event cutoff for an existing scheduled market event. It may change only starts_at after the observation that established the current fence; sport, competition, provider identity, and lineage remain exact, while live or terminal events reject revision.');
