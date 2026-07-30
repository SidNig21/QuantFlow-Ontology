-- Frozen pre-D1 profile-identity seed (WO-D1 D3).
-- Applied after qf-kernel-schema/compat/pre-d1-profile-identity.sql on a temp db.

INSERT INTO agent_definition (id, created_at, name, role, package_ref, system_prompt_ref)
VALUES
  ('researcher-pre', '2026-07-20T00:00:00.000Z', 'researcher-pre', 'researcher', 'tools/runtime-proof/packed/qf-toolloop.aospkg', NULL),
  ('critic-pre', '2026-07-20T00:00:01.000Z', 'critic-pre', 'critic', 'tools/runtime-proof/packed/qf-toolloop.aospkg', NULL);

INSERT INTO agent_session (id, created_at, status, label)
VALUES
  ('legacy-linked-session', '2026-07-20T00:00:10.000Z', 'closed', 'researcher-pre'),
  ('legacy-unlinked-session', '2026-07-20T00:00:11.000Z', 'closed', 'unknown-label');

INSERT INTO links (id, kind, from_id, to_id, created_at)
VALUES
  ('link-spawned-legacy', 'assigned_to', 'legacy-task-1', 'legacy-linked-session', '2026-07-20T00:00:12.000Z'),
  ('link-delegates', 'delegates_to', 'legacy-linked-session', 'legacy-unlinked-session', '2026-07-20T00:00:13.000Z'),
  ('link-participates', 'participates_in', 'comp-pre-1', 'event-pre-1', '2026-07-20T00:00:14.000Z'),
  ('link-offered', 'offered_on', 'inst-pre-1', 'event-pre-1', '2026-07-20T00:00:15.000Z'),
  ('link-quotes', 'quotes', 'quote-pre-1', 'inst-pre-1', '2026-07-20T00:00:16.000Z'),
  ('link-lists', 'lists', 'venue-pre-1', 'inst-pre-1', '2026-07-20T00:00:17.000Z'),
  ('link-settles', 'settles', 'result-pre-1', 'event-pre-1', '2026-07-20T00:00:18.000Z'),
  ('link-tests', 'tests', 'run-pre-1', 'hyp-pre-1', '2026-07-20T00:00:19.000Z'),
  ('link-has-leg', 'has_leg', 'ticket-pre-1', 'inst-pre-1', '2026-07-20T00:00:20.000Z'),
  ('link-uses', 'uses', 'run-pre-1', 'ds-pre-1', '2026-07-20T00:00:21.000Z'),
  ('link-exec', 'executes_in', 'run-pre-1', 'env-pre-1', '2026-07-20T00:00:22.000Z'),
  ('link-produces', 'produces', 'run-pre-1', 'art-pre-1', '2026-07-20T00:00:23.000Z'),
  ('link-derived', 'derived_from', 'ds-pre-2', 'ds-pre-1', '2026-07-20T00:00:24.000Z'),
  ('link-eval', 'evaluated_by', 'art-pre-1', 'eval-pre-1', '2026-07-20T00:00:25.000Z'),
  ('link-gates', 'gates', 'eval-pre-1', 'art-pre-2', '2026-07-20T00:00:26.000Z');

INSERT INTO events (id, type, object_type, object_id, payload, trace_id, created_at)
VALUES
  ('evt-def-1', 'agent_definition.registered', 'agent_definition', 'researcher-pre', '{"command":"register_agent_definition"}', 'trace-pre-1', '2026-07-20T00:00:30.000Z'),
  ('evt-sess-1', 'agent_session.created', 'agent_session', 'legacy-linked-session', '{"status":"starting"}', 'trace-pre-1', '2026-07-20T00:00:31.000Z'),
  ('evt-sess-2', 'agent_session.created', 'agent_session', 'legacy-unlinked-session', '{"status":"starting"}', 'trace-pre-1', '2026-07-20T00:00:32.000Z');

-- Minimal ontology rows referenced by links above (ids only — content irrelevant to upgrade proof).
INSERT INTO competitor (id, created_at, kind, name, external_refs) VALUES ('comp-pre-1', '2026-07-20T00:00:00.000Z', 'team', 'Team A', '[]');
INSERT INTO market_event (id, created_at, sport, starts_at, status, competition) VALUES ('event-pre-1', '2026-07-20T00:00:00.000Z', 'ufc', '2026-07-25T00:00:00.000Z', 'scheduled', 'UFC');
INSERT INTO instrument (id, created_at, kind, params, sides, correlation_group) VALUES ('inst-pre-1', '2026-07-20T00:00:00.000Z', 'moneyline', '{}', '[]', NULL);
INSERT INTO quote (id, created_at, book, data_ref, coverage) VALUES ('quote-pre-1', '2026-07-20T00:00:00.000Z', 'bovada', 'hash', '{}');
INSERT INTO venue (id, created_at, kind, name) VALUES ('venue-pre-1', '2026-07-20T00:00:00.000Z', 'sportsbook', 'Bovada');
INSERT INTO result (id, created_at, outcome, settled_at) VALUES ('result-pre-1', '2026-07-20T00:00:00.000Z', '{}', '2026-07-26T00:00:00.000Z');
INSERT INTO hypothesis (id, created_at, claim, success_criteria, sources, status) VALUES ('hyp-pre-1', '2026-07-20T00:00:00.000Z', 'c', 's', '[]', 'open');
INSERT INTO dataset (id, created_at, kind, content_hash, as_of, coverage) VALUES ('ds-pre-1', '2026-07-20T00:00:00.000Z', 'mixed', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', '2026-07-20T00:00:00.000Z', '{}');
INSERT INTO dataset (id, created_at, kind, content_hash, as_of, coverage) VALUES ('ds-pre-2', '2026-07-20T00:00:00.000Z', 'mixed', 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', '2026-07-20T00:00:00.000Z', '{}');
INSERT INTO run (id, created_at, kind, status, params, trace_id) VALUES ('run-pre-1', '2026-07-20T00:00:00.000Z', 'backtest', 'queued', '{}', 'trace-pre-1');
INSERT INTO artifact (id, created_at, kind, content_hash, storage_ref) VALUES ('art-pre-1', '2026-07-20T00:00:00.000Z', 'report', 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc', 'file:///tmp/a');
INSERT INTO artifact (id, created_at, kind, content_hash, storage_ref) VALUES ('art-pre-2', '2026-07-20T00:00:00.000Z', 'report', 'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd', 'file:///tmp/b');
INSERT INTO evaluation (id, created_at, metrics, critic_findings_ref, verdict, confidence, rationale) VALUES ('eval-pre-1', '2026-07-20T00:00:00.000Z', '{}', NULL, 'inconclusive', 0.5, 'seed');
INSERT INTO ticket (id, created_at, origin, kind, external_ref, placed_at, legs, combined_price, stake, payout, correlation_note, grade) VALUES ('ticket-pre-1', '2026-07-20T00:00:00.000Z', 'strategy_proposed', 'single', 'ext-1', '2026-07-20T00:00:00.000Z', '[]', 1.9, 10, NULL, '', 'pending');
INSERT INTO task (id, created_at, title, description) VALUES ('legacy-task-1', '2026-07-20T00:00:00.000Z', 'seed', 'seed');
INSERT INTO execution_environment (id, created_at, kind, label) VALUES ('env-pre-1', '2026-07-20T00:00:00.000Z', 'local_process', 'local');
