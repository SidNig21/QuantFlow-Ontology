-- qf-kernel-schema generated upgrade: task-steering
-- DO NOT EDIT — regenerate with `bun run generate`.

DELETE FROM schema_meta WHERE type_name IN ('clarify_task', 'redirect_task', 'record_task_steering_delivery', 'record_task_steering_refusal', 'record_task_cancel_outcome', 'request_second_opinion');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('clarify_task', 'action', 'experimental', 'Append bounded founder context to an open Director-delegated Task without changing its durable description.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('redirect_task', 'action', 'experimental', 'Replace an open Director-delegated Task description while retaining the previous description in the receipt log.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('record_task_steering_delivery', 'action', 'experimental', 'Record the host delivery outcome for one accepted Task steering event, deriving all identity fields from that event.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('record_task_steering_refusal', 'action', 'experimental', 'Record one refused founder Task action with its canonical reason and derived founder-visible message.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('record_task_cancel_outcome', 'action', 'experimental', 'Record the one host outcome after an accepted Task cancellation, deriving the target from the cancellation event.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('request_second_opinion', 'action', 'experimental', 'Create exactly one open review Task assigned to a captured production Critic session for the original open Task.');
