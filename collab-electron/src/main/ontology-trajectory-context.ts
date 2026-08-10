export type OntologyTrajectoryIdentity = { sessionId: string; role: string };

/** Read markers are issued only for generated ontology reads, never actions. */
export function ontologyTrajectoryContext(
  identity: OntologyTrajectoryIdentity,
  toolName: string,
  issueReadReceipt: boolean,
) {
  return {
    trace_id: crypto.randomUUID(),
    span_id: crypto.randomUUID(),
    actor_session_id: identity.sessionId,
    ...(issueReadReceipt ? { ontology_read_tool: toolName } : {}),
  };
}
