-- qf-kernel-schema generated upgrade: market-ingest
-- DO NOT EDIT — regenerate with `bun run generate`.

INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('ingest_market_batch', 'action', 'experimental', 'Ingest one provenance-bound batch of instrument and quote rows through the trusted market pipeline. The Kernel must validate the whole batch and commit its rows, derived quote links, and evidence events atomically.');
