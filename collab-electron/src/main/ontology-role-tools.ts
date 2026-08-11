const FOCUSED_ROLE_TOOLS: Record<string, ReadonlySet<string>> = {
  orchestrator: new Set([
    "qf_agent_definition_query",
    "qf_create_agent_session",
    "qf_start_agent_session",
  ]),
  critic: new Set([
    "qf_hypothesis_get",
    "qf_run_get",
    "qf_artifact_get",
    "qf_record_evaluation",
  ]),
};

export function ontologyToolsForRole<T extends { name: string }>(
  role: string,
  tools: T[],
): T[] {
  const allowed = FOCUSED_ROLE_TOOLS[role];
  return allowed ? tools.filter((tool) => allowed.has(tool.name)) : tools;
}
