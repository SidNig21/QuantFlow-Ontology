import { admitAndStartSession, getDockDefinitionAvailability, hasLiveAgentSession, submitAgentSessionInstruction } from "./agent-host";
import { addOfficialEvidence, RESEARCH_LAB_TOOL_ID } from "./evidence-computation";
import { kernelExecute, kernelGetLinks, kernelGetObject, kernelListAgentDefinitions, kernelListAgentSessions, kernelQueryObjects, kernelDecisionReadScope, kernelDecisionModelReadView } from "./kernel";
import { assertMarketRetryTask } from "./market-runtime-failure";
import { listBovadaMarketDeskRows } from "./market-desk";
import { selectEligibleDefinition } from "./participant-selection";
import { MARKET_EXPRESSION_COMPARISON_IMPLEMENTATION, MARKET_EXPRESSION_COMPARISON_OPERATION } from "qf-kernel/portable";

const active = new Set<string>();
const trace = (actor_session_id?: string, mission_id?: string) => ({ trace_id: crypto.randomUUID(), span_id: crypto.randomUUID(), ...(actor_session_id ? { actor_session_id } : {}), ...(mission_id ? { mission_id } : {}) });
type Started = NonNullable<Parameters<typeof admitAndStartSession>[1]>["onStarted"];
export function eligibleDefinition(role: string, capability: string): string {
  return selectEligibleDefinition(
    kernelListAgentDefinitions(),
    role,
    capability,
    (definition) => getDockDefinitionAvailability(definition).available,
  );
}
export async function acquireEligibleParticipant(role: string, capability: string, onStarted?: Started): Promise<string> {
  const definitionId = eligibleDefinition(role, capability);
  const available = kernelListAgentSessions().filter((session) => session.status === "running" && hasLiveAgentSession(String(session.id)) && kernelGetLinks(String(session.id), { kind: "spawned_from" }).some((link) => link.to_id === definitionId) && !kernelGetLinks(String(session.id), { kind: "assigned_to" }).some((link) => kernelGetObject("task", link.from_id)?.status === "open"));
  if (available.length > 1) throw new Error("Multiple idle participants match this role; close the extra seat before analyzing.");
  return available.length ? String(available[0]!.id) : (await admitAndStartSession(definitionId, { onStarted })).sessionId;
}

/** One operator action dispatches exact research; the existing result handoff admits the independent Critic. */
export async function analyzeMarketAndReview(input: { mission_id: string; quote_id: string; retry_task_id?: string }, onStarted?: Started): Promise<Record<string, unknown>> {
  if (active.has(input.mission_id)) throw new Error("Analysis is already starting for this investigation.");
  active.add(input.mission_id);
  let taskId: string | null = null;
  let director: string | undefined;
  try {
    const quote = listBovadaMarketDeskRows().find((row) => row.quote_id === input.quote_id);
    if (!quote?.current || quote.sport !== "ufc") throw new Error("Refresh Bovada and open the current UFC investigation.");
    const coverage = JSON.parse(String(kernelGetObject("quote", input.quote_id)?.coverage ?? "{}"));
    if (coverage.market_menu?.contract !== "qf.market.menu.v1") throw new Error("This observation predates complete-menu capture. Refresh Bovada and open its current investigation.");
    const requested = coverage.market_menu.requested_expression as Record<string, unknown> | undefined;
    if (!requested || typeof requested.expression !== "string" || !requested.expression.trim()) throw new Error("The investigation has no exact requested expression.");
    const availability = typeof requested.status === "string" ? requested.status : "availability_unknown";
    const existing = kernelGetLinks(input.mission_id, { kind: "belongs_to" }).filter((link) => link.to_id === input.mission_id).map((link) => kernelGetObject("task", link.from_id)).filter((task) => task?.status === "open");
    const retry = input.retry_task_id ? existing.find((task) => task!.id === input.retry_task_id) : null;
    if (input.retry_task_id && (!retry || existing.length !== 1)) throw new Error("The exact unfinished retry task is no longer available.");
    if (existing.length && !retry) throw new Error("This investigation already has research in progress. Inspect its participant or request a revision.");
    if (retry) {
      director = assertMarketRetryTask(String(retry.id), hasLiveAgentSession);
    }
    const evidence = await addOfficialEvidence(input);
    director ??= await acquireEligibleParticipant("orchestrator", "desk.orchestrate", onStarted);
    const worker = await acquireEligibleParticipant("worker", "market.read", onStarted);
    const hypotheses = kernelQueryObjects("run", {}, null).map((run) => { try { const p = JSON.parse(String(run.params)); return p.mission_id === input.mission_id ? p.decision_context?.hypothesis_id : null; } catch { return null; } }).filter(Boolean);
    const priorIds = [...new Set(hypotheses)];
    if (priorIds.length > 1) throw new Error("Investigation Hypothesis identity is ambiguous.");
    const hypothesisId = priorIds.length ? String(priorIds[0]) : String((kernelExecute("create_hypothesis", { claim: requested.expression.trim(), success_criteria: "Test the requested mechanism against every offered expression and exact pre-event evidence. Abstain when probability is unavailable. Invalidate on event, source, or cutoff disagreement; refresh stale Quotes and newly offered expressions.", sources: [] }, trace(director)) as { object_id: string }).object_id);
    taskId = retry ? String(retry.id) : `task-${crypto.randomUUID()}`;
    if (retry) kernelExecute("reassign_task", { task_id: taskId, assignee_session_id: worker }, trace(director));
    else kernelExecute("create_task", { task_id: taskId, title: `Analyze ${requested.expression.trim()}`, description: "Compare every exact offered selection against the requested Hypothesis. Use only the finite Run-bound evidence and publish one qf.market.decision.v1 interpretation for independent review.", assignee_session_id: worker }, trace(director, input.mission_id));
    const runId = `analysis:${crypto.randomUUID()}`;
    const run = kernelExecute("execute_deterministic_run", { run_id: runId, dataset_id: evidence.dataset_id, mission_id: input.mission_id, quote_id: input.quote_id, tool_id: RESEARCH_LAB_TOOL_ID, hypothesis_id: hypothesisId, calculation: { contract: "qf.calculation.v1", operation: MARKET_EXPRESSION_COMPARISON_OPERATION, version: 1, formula_version: 1, implementation_version: MARKET_EXPRESSION_COMPARISON_IMPLEMENTATION }, params: { task_id: taskId } }, trace(worker)) as { state: Record<string, unknown> };
    const scope = kernelDecisionReadScope(worker);
    if (!scope) throw new Error("Research input scope did not persist.");
    kernelDecisionModelReadView("qf_artifact_get", String(run.state.result_artifact_id), scope.run, null);
    for (const key of scope.allowed.filter((entry) => entry.startsWith("qf_quote_get:"))) {
      kernelDecisionModelReadView("qf_quote_get", key.slice("qf_quote_get:".length), scope.run, null);
    }
    const instruction = [
      `You are the Market Researcher assigned Task ${taskId}.`,
      `Read each of these exact generated ontology tools once, passing only its id: ${JSON.stringify(scope.allowed)}. Preserve every returned read Artifact id. No other reads or actions are authorized.`,
      `The calculation result Artifact ${String(run.state.result_artifact_id)} contains shared context, exact official evidence, market availability, and the complete ordered comparison_manifest. Each required qf_quote_get returns all deterministic comparisons for that exact Quote with their global comparison_indices. Combine each row with its comparison_context and assess every offered expression; do not invent a probability or skip a market. QuantFlow copies the exact numeric comparisons into the stored decision. Do not reproduce those tables or raw inputs in your judgment fields; explain the material evidence, counterevidence, uncertainty, and conclusion concisely.`,
      `The exact Kernel-held requested-market status is ${JSON.stringify(availability)}. If it is selection_unavailable or availability_unknown, classification must be WATCH with selection_id null while research_assessment separately states whether the evidence supports, challenges, or cannot resolve the claim.`,
      'Call collaboration send_result once with the exact task_id, every Quote id as cited_market_ids, and every read receipt as read_trajectory_artifact_ids. The result string is only your bounded judgment JSON with exactly: contract="qf.market.assessment.v1"; research_assessment="SUPPORTED", "CHALLENGED", "INCONCLUSIVE", or "INSUFFICIENT_EVIDENCE"; classification="CANDIDATE", "WATCH", or "PASS"; selection_id (or null); and nonempty selection_reason, change_condition, rationale, limitations, invalidation. QuantFlow supplies immutable identities, comparisons, evidence references, and runtime metadata. Analyze the requested mechanism, counterevidence, source limits, every offered expression, and availability. Never recruit or delegate. If the first send_result is refused, make only the stated correction and try once more; after a second refusal, stop and report the failure. No stake, wagering, arbitrary confidence, or fabricated facts. This is research advice only.',
    ].join("\n");
    await submitAgentSessionInstruction(worker, `${instruction}\r`);
    return { ...input, ...evidence, task_id: taskId, worker_session_id: worker, run_id: runId, state: "Research running; independent review follows its durable result." };
  } catch (error) {
    if (!input.retry_task_id && taskId && director && kernelGetObject("task", taskId)?.status === "open") kernelExecute("cancel_task", { task_id: taskId }, trace(director));
    throw error;
  } finally { active.delete(input.mission_id); }
}
