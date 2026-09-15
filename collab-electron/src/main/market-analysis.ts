import { admitAndStartSession, getDockDefinitionAvailability, hasLiveAgentSession, stopResumeParticipantRuntime, submitAgentSessionInstruction } from "./agent-host";
import { addOfficialEvidence, RESEARCH_LAB_TOOL_ID } from "./evidence-computation";
import { getKernelDb, kernelExecute, kernelGetLinks, kernelGetObject, kernelListAgentDefinitions, kernelListAgentSessions, kernelQueryObjects, kernelDecisionReadScope, kernelDecisionModelReadView, kernelSessionCoordinatesOtherOpenTask, kernelTaskHasFrozenSourceWork } from "./kernel";
import { assertMarketRetryTask } from "./market-runtime-failure";
import { captureBovadaMarketDesk, listBovadaMarketDeskRows, type MarketDeskRow } from "./market-desk";
import { selectEligibleDefinition } from "./participant-selection";
import { assertMarketInvestigationQuote, MARKET_EXPRESSION_COMPARISON_IMPLEMENTATION, MARKET_EXPRESSION_COMPARISON_OPERATION } from "qf-kernel/portable";
import type { BovadaRequestedExpression } from "qf-bovada-football";
import { handleMarketResumeFailure, type ResumeParticipant } from "./market-resume-failure";

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
type AcquiredParticipant = ResumeParticipant;
async function acquireParticipant(role: string, capability: string, onStarted?: Started): Promise<AcquiredParticipant> {
  const definitionId = eligibleDefinition(role, capability);
  const available = kernelListAgentSessions().filter((session) => session.status === "running" && hasLiveAgentSession(String(session.id)) && kernelGetLinks(String(session.id), { kind: "spawned_from" }).some((link) => link.to_id === definitionId) && !kernelGetLinks(String(session.id), { kind: "assigned_to" }).some((link) => kernelGetObject("task", link.from_id)?.status === "open") && (role !== "orchestrator" || !kernelSessionCoordinatesOtherOpenTask(String(session.id), "")));
  if (available.length > 1) throw new Error("Multiple idle participants match this role; close the extra seat before analyzing.");
  return available.length ? { sessionId: String(available[0]!.id), requestOwned: false } : { sessionId: (await admitAndStartSession(definitionId, { onStarted })).sessionId, requestOwned: true };
}
export async function acquireEligibleParticipant(role: string, capability: string, onStarted?: Started): Promise<string> {
  return (await acquireParticipant(role, capability, onStarted)).sessionId;
}

function jsonObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  try { const parsed = JSON.parse(String(value)); return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {}; } catch { return {}; }
}

function exactRequestedExpression(quoteId: string): { providerEventId: string; requested: BovadaRequestedExpression } {
  const coverage = jsonObject(kernelGetObject("quote", quoteId)?.coverage);
  const menu = jsonObject(coverage.market_menu);
  const request = jsonObject(menu.requested_expression);
  const providerEventId = String(coverage.provider_event_id ?? "");
  const expression = String(request.expression ?? "").trim();
  const marketDescription = String(request.market_description ?? "").trim();
  const outcomeDescription = String(request.outcome_description ?? "").trim();
  if (!providerEventId || !expression || !marketDescription || !outcomeDescription) throw new Error("The saved investigation has no exact targeted market expression.");
  return { providerEventId, requested: { expression, market_description: marketDescription, outcome_description: outcomeDescription } };
}

function exactCurrentContinuation(missionId: string, rows: MarketDeskRow[]): MarketDeskRow | null {
  const startingQuotes = kernelGetLinks(missionId, { kind: "investigates" }).filter((link) => link.from_id === missionId);
  if (startingQuotes.length !== 1) throw new Error("The saved investigation has ambiguous starting market lineage.");
  const startingQuoteId = startingQuotes[0]!.to_id;
  const matches = rows.filter((row) => row.current && row.quote_id !== startingQuoteId).filter((row) => {
    try { assertMarketInvestigationQuote(getKernelDb(), missionId, row.quote_id); return true; } catch { return false; }
  });
  if (matches.length > 1) throw new Error("The saved investigation has ambiguous current market observations.");
  return matches[0] ?? null;
}

async function resolveRunQuote(input: { mission_id: string; quote_id: string }, retry: boolean): Promise<MarketDeskRow> {
  if (!retry) {
    const row = listBovadaMarketDeskRows().find((candidate) => candidate.quote_id === input.quote_id);
    if (!row?.current || row.sport !== "ufc") throw new Error("Refresh Bovada and open the current UFC investigation.");
    assertMarketInvestigationQuote(getKernelDb(), input.mission_id, row.quote_id);
    return row;
  }
  let row = exactCurrentContinuation(input.mission_id, listBovadaMarketDeskRows());
  if (row) return row;
  const target = exactRequestedExpression(input.quote_id);
  const rows = await captureBovadaMarketDesk(
    { sport: "ufc", competition: "ufc", market_class: "moneyline" },
    { provider_event_id: target.providerEventId, requested_expression: target.requested },
  );
  row = exactCurrentContinuation(input.mission_id, rows);
  if (!row) throw new Error("Targeted capture did not return a fresh exact continuation of the saved investigation.");
  return row;
}

/** One operator action dispatches exact research; the existing result handoff admits the independent Critic. */
export async function analyzeMarketAndReview(input: { mission_id: string; quote_id: string; retry_task_id?: string }, onStarted?: Started): Promise<Record<string, unknown>> {
  if (active.has(input.mission_id)) throw new Error("Analysis is already starting for this investigation.");
  active.add(input.mission_id);
  let taskId: string | null = null;
  let director: string | undefined;
  let coordinator: AcquiredParticipant | undefined;
  let worker: AcquiredParticipant | undefined;
  let resumeCommitted = false;
  let dispatchAttempted = false;
  try {
    const existing = kernelGetLinks(input.mission_id, { kind: "belongs_to" }).filter((link) => link.to_id === input.mission_id).map((link) => kernelGetObject("task", link.from_id)).filter((task) => task?.status === "open");
    const retry = input.retry_task_id ? existing.find((task) => task!.id === input.retry_task_id) : null;
    if (input.retry_task_id && (!retry || existing.length !== 1)) throw new Error("The exact unfinished retry task is no longer available.");
    if (existing.length && !retry) throw new Error("This investigation already has research in progress. Inspect its participant or request a revision.");
    if (retry) assertMarketRetryTask(String(retry.id), hasLiveAgentSession);
    const quote = await resolveRunQuote(input, Boolean(retry));
    const runInput = { mission_id: input.mission_id, quote_id: quote.quote_id };
    const coverage = JSON.parse(String(kernelGetObject("quote", runInput.quote_id)?.coverage ?? "{}"));
    if (coverage.market_menu?.contract !== "qf.market.menu.v1") throw new Error("This observation predates complete-menu capture. Refresh Bovada and open its current investigation.");
    const requested = coverage.market_menu.requested_expression as Record<string, unknown> | undefined;
    if (!requested || typeof requested.expression !== "string" || !requested.expression.trim()) throw new Error("The investigation has no exact requested expression.");
    const availability = typeof requested.status === "string" ? requested.status : "availability_unknown";
    const evidence = await addOfficialEvidence(runInput);
    coordinator = await acquireParticipant("orchestrator", "desk.orchestrate", onStarted);
    director = coordinator.sessionId;
    worker = await acquireParticipant("worker", "market.read", onStarted);
    taskId = retry ? String(retry.id) : `task-${crypto.randomUUID()}`;
    const priorHypotheses = retry ? [...new Set(kernelQueryObjects("run", {}, null).filter((run) => {
      const params = jsonObject(run.params); const decision = jsonObject(params.decision_context); const call = jsonObject(params.params);
      return decision.task_id === taskId || call.task_id === taskId;
    }).map((run) => {
      const tested = kernelGetLinks(String(run.id), { kind: "tests" }).filter((link) => link.from_id === run.id);
      if (tested.length !== 1) throw new Error("A saved attempt has ambiguous Hypothesis lineage.");
      return tested[0]!.to_id;
    }))] : [];
    if (retry && priorHypotheses.length !== 1) throw new Error("The saved investigation has no single exact Hypothesis across its prior Runs.");
    const hypothesisId = priorHypotheses.length ? priorHypotheses[0]! : String((kernelExecute("create_hypothesis", { claim: requested.expression.trim(), success_criteria: "Test the requested mechanism against every offered expression and exact pre-event evidence. Abstain when probability is unavailable. Invalidate on event, source, or cutoff disagreement; refresh stale Quotes and newly offered expressions.", sources: [] }, trace(director)) as { object_id: string }).object_id);
    if (retry) {
      kernelExecute("resume_interrupted_market_task", { task_id: taskId, coordinator_session_id: director, assignee_session_id: worker.sessionId, attempt_id: crypto.randomUUID() }, trace(undefined, input.mission_id));
      resumeCommitted = true;
    } else kernelExecute("create_task", { task_id: taskId, title: `Analyze ${requested.expression.trim()}`, description: "Compare every exact offered selection against the requested Hypothesis. Use only the finite Run-bound evidence and publish one qf.market.decision.v1 interpretation for independent review.", assignee_session_id: worker.sessionId }, trace(director, input.mission_id));
    const runId = `analysis:${crypto.randomUUID()}`;
    const run = kernelExecute("execute_deterministic_run", { run_id: runId, dataset_id: evidence.dataset_id, mission_id: input.mission_id, quote_id: runInput.quote_id, tool_id: RESEARCH_LAB_TOOL_ID, hypothesis_id: hypothesisId, calculation: { contract: "qf.calculation.v1", operation: MARKET_EXPRESSION_COMPARISON_OPERATION, version: 1, formula_version: 1, implementation_version: MARKET_EXPRESSION_COMPARISON_IMPLEMENTATION }, params: { task_id: taskId } }, trace(worker.sessionId)) as { state: Record<string, unknown> };
    const scope = kernelDecisionReadScope(worker.sessionId);
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
    dispatchAttempted = true;
    await submitAgentSessionInstruction(worker.sessionId, `${instruction}\r`);
    return { ...input, quote_id: runInput.quote_id, starting_quote_id: input.quote_id, ...evidence, task_id: taskId, coordinator_session_id: director, worker_session_id: worker.sessionId, run_id: runId, state: "Research running; independent review follows its durable result." };
  } catch (error) {
    const teardownErrors = input.retry_task_id ? await handleMarketResumeFailure({ committed: resumeCommitted, dispatchAttempted, worker, coordinator }, {
      resultCommitted: () => Boolean(taskId && kernelTaskHasFrozenSourceWork(taskId)),
      coordinatorHasOtherOpenWork: (sessionId) => Boolean(taskId && kernelSessionCoordinatesOtherOpenTask(sessionId, taskId)),
      workerRunning: (sessionId) => kernelGetObject("agent_session", sessionId)?.status === "running",
      failWorker: (sessionId, reason) => { kernelExecute("fail_agent_session", { session_id: sessionId, reason }, trace()); },
      stopParticipant: stopResumeParticipantRuntime,
    }) : [];
    if (!input.retry_task_id && taskId && director && kernelGetObject("task", taskId)?.status === "open") kernelExecute("cancel_task", { task_id: taskId }, trace(director));
    if (teardownErrors.length) throw new AggregateError([error, ...teardownErrors], "Resume failed and one or more request-owned runtimes did not stop cleanly");
    throw error;
  } finally { active.delete(input.mission_id); }
}
