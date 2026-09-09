import { afterAll, expect, test, mock } from "bun:test";
import { mkdtempSync, mkdirSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { runBovadaLiveMarketsCapture, BOVADA_UFC_URL } from "qf-bovada-football";
mock.module("electron", () => ({ BrowserWindow: { getAllWindows: () => [] } }));
import { openAppKernel, closeAppKernel, getKernelDb, kernelExecute, kernelGetObject, kernelGetLinks, kernelDecisionReadScope, kernelDecisionArtifactView, kernelDecisionModelReadView, kernelCompleteMarketAssessment, kernelBindSourceWork, commitCollaborationResult, kernelRequestGovernedReview, kernelMarkGovernedDelivery, kernelFinalizeResearchEvaluation, kernelGetResearchWorldProjection, kernelReadMarketTrajectoryResult } from "./kernel";
import { addOfficialEvidence } from "./evidence-computation";
import { createMarketDeskInvestigation } from "./market-desk";
import { createMarketFailureReceiver, recordMarketRuntimeFailure, assertMarketRetryTask } from "./market-runtime-failure";
import { recordMarketRuntimeReceipt } from "./market-runtime-receipt";
const { callOntologyReadTool, callOntologyTool, registerOntologyGatewayRpc } = await import("./ontology-gateway");

const root = mkdtempSync(join(tmpdir(), "qf-decision-test-"));
const saved = { db: process.env.QF_KERNEL_DB, artifacts: process.env.QF_ARTIFACT_ROOT };
process.env.QF_KERNEL_DB = join(root, "kernel.sqlite"); process.env.QF_ARTIFACT_ROOT = join(root, "artifacts"); mkdirSync(process.env.QF_ARTIFACT_ROOT);
const trace = (actor_session_id?: string, mission_id?: string) => ({ trace_id: crypto.randomUUID(), span_id: crypto.randomUUID(), ...(actor_session_id ? { actor_session_id } : {}), ...(mission_id ? { mission_id } : {}) });
afterAll(() => { closeAppKernel(); if (saved.db === undefined) delete process.env.QF_KERNEL_DB; else process.env.QF_KERNEL_DB = saved.db; if (saved.artifacts === undefined) delete process.env.QF_ARTIFACT_ROOT; else process.env.QF_ARTIFACT_ROOT = saved.artifacts; const target = resolve(root); if (!target.startsWith(resolve(tmpdir()) + "\\") || !target.includes("qf-decision-test-")) throw Error("unsafe cleanup"); rmSync(target, { recursive: true, force: true }); });
function response(url: string, text: string) { return { status: 200, url, redirected: false, headers: new Headers({ "content-type": "application/json" }), body: new ReadableStream<Uint8Array>({ start(c) { c.enqueue(new TextEncoder().encode(text)); c.close(); } }) }; }

test("synthetic provider-count gap → bounded evidence → Run → broker reads → worker Artifact; foreign reads and arbitrary probability refuse", async () => {
  openAppKernel();
  const now = new Date(); const cutoff = new Date(now.getTime() + 5 * 86400000);
  const competitors = [{ id: "fiorot", name: "Manon Fiorot", home: true }, { id: "grasso", name: "Alexa Grasso", home: false }];
  const period = { id: "bout", description: "Bout", main: true, live: false };
  const source = [{ path: [{ type: "SPORT", id: "MMA", description: "UFC/MMA" }, { type: "TOUR", id: "UFC", description: "UFC" }, { type: "LEAGUE", id: "league", description: "UFC Test" }], events: [{ id: "29195963", description: "Manon Fiorot vs Alexa Grasso", competitionId: "league", startTime: cutoff.getTime(), live: false, status: "U", numMarkets: 3, competitors, displayGroups: [{ id: "group", description: "Fight Odds", markets: [
    { id: "winner", description: "Fight Winner", key: "2W-12", status: "O", period, outcomes: competitors.map((row, index) => ({ id: `selection-${index}`, description: row.name, competitorId: row.id, status: "O", type: index ? "A" : "H", price: { american: index ? "+185" : "-225", decimal: index ? "2.85" : "1.444444", fractional: index ? "37/20" : "4/9" } })) },
    { id: "total", description: "Main Total Rounds Over/Under", key: "2W-OU", status: "O", period, outcomes: ["Over", "Under"].map((name, index) => ({ id: `total-${index}`, description: name, status: "O", type: index ? "U" : "O", price: { american: index ? "+300" : "-450", decimal: index ? "4" : "1.222222", fractional: index ? "3/1" : "2/9", handicap: "2.5" } })) },
  ] }] }] }];
  const capture = await runBovadaLiveMarketsCapture({ db: getKernelDb(), artifactRoot: process.env.QF_ARTIFACT_ROOT!, request: { sport: "ufc", competition: "ufc", market_class: "moneyline" }, provider_event_id: "29195963", requested_expression: { expression: "Alexa Grasso wins by submission", market_description: "Method of Victory", outcome_description: "Alexa Grasso by Submission" }, transport: async () => response(BOVADA_UFC_URL, JSON.stringify(source)), now: () => now, kernel: { execute: (_db, command, input, t) => kernelExecute(command, input, t), getObject: (_db, type, id) => kernelGetObject(type, id), getLinks: (_db, id, options) => kernelGetLinks(id, options) } });
  expect(capture.rows).toHaveLength(2);
  expect(capture.menu.requested_expression).toMatchObject({
    status: "availability_unknown",
    selection_ids: [],
    observed_at: now.toISOString(),
  });
  expect(capture.menu.completeness).toMatchObject({ status: "provider_reports_additional_markets", provider_reported_market_count: 3, returned_unique_market_count: 2 });
  expect(capture.menu.requested_expression.reason).toContain("not confirmed");
  const quoteId = capture.rows[0]!.quote_id;
  const mission = createMarketDeskInvestigation({ quote_id: quoteId, name: "Synthetic decision control", objective: "Test exact lineage" });
  const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(cutoff).replace(/^([A-Z][a-z]{2}) /, "$1. ");
  const evidence = await addOfficialEvidence({ mission_id: mission.mission_id, quote_id: quoteId, transport: async (url) => {
    const self = url.endsWith("manon-fiorot") ? "Manon Fiorot" : "Alexa Grasso", opponent = self === "Manon Fiorot" ? "Alexa Grasso" : "Manon Fiorot";
    return response(url, `<link rel="canonical" href="${url}"><meta property="og:title" content="${self} | UFC"><article class="c-card-event--athlete-fight"><h3>${self} vs ${opponent}</h3><div class="c-card-event--athlete-fight__date">${date}</div></article><div id="athlete-record"><article class="c-card-event--athlete-results"><div class="c-card-event--athlete-results__image win"><a href="${url}">${self}</a></div><a href="https://www.ufc.com/athlete/old-rival">Old Rival</a><div class="c-card-event--athlete-results__date">Aug. 1, 2026</div><a href="https://www.ufc.com/event/old">Old</a></article></div><footer></footer>`);
  } });
  for (const [id, role] of [["director", "orchestrator"], ["worker", "worker"]]) {
    kernelExecute("register_agent_definition", { name: `definition-${id}`, role, package_ref: `test:${id}`, capability_groups: ["market.read", "desk.orchestrate"] }, trace());
    kernelExecute("create_agent_session", { session_id: id, agent_definition_id: `definition-${id}` }, trace()); kernelExecute("start_agent_session", { session_id: id }, trace());
  }
  const hypothesis = kernelExecute("create_hypothesis", { claim: "Alexa Grasso wins by submission", success_criteria: "Test mechanism, abstain without probability" }, trace()) as { object_id: string };
  const suspendedSource = structuredClone(source);
  suspendedSource[0]!.events[0]!.displayGroups[0]!.markets[0]!.status = "S";
  await expect(runBovadaLiveMarketsCapture({ db: getKernelDb(), artifactRoot: process.env.QF_ARTIFACT_ROOT!, request: { sport: "ufc", competition: "ufc", market_class: "moneyline" }, provider_event_id: "29195963", requested_expression: { expression: "Alexa Grasso wins by submission", market_description: "Method of Victory", outcome_description: "Alexa Grasso by Submission" }, transport: async () => response(BOVADA_UFC_URL, JSON.stringify(suspendedSource)), now: () => new Date(now.getTime() + 1000), kernel: { execute: (_db, command, input, t) => kernelExecute(command, input, t), getObject: (_db, type, id) => kernelGetObject(type, id), getLinks: (_db, id, options) => kernelGetLinks(id, options) } })).rejects.toThrow("no future open UFC moneyline markets");
  expect(kernelGetObject("mission", mission.mission_id)).not.toBeNull();
  expect(kernelGetObject("hypothesis", hypothesis.object_id)).not.toBeNull();
  expect(kernelGetObject("artifact", capture.artifact_id)).not.toBeNull();
  const taskId = "decision-task";
  const genericRead = callOntologyReadTool({ sessionId: "worker", role: "worker" }, "qf_venue_get", { id: "venue-bovada" }).artifactId;
  expect(() => kernelReadMarketTrajectoryResult(genericRead, "worker")).not.toThrow();
  kernelExecute("create_task", { task_id: taskId, title: "Analyze Grasso", description: "Synthetic exact decision", assignee_session_id: "worker" }, trace("director", mission.mission_id));
  const run = kernelExecute("execute_deterministic_run", { run_id: "decision-run", dataset_id: evidence.dataset_id, mission_id: mission.mission_id, quote_id: quoteId, tool_id: "research-lab", hypothesis_id: hypothesis.object_id, calculation: { contract: "qf.calculation.v1", operation: "market_expression_comparison", version: 1, formula_version: 1, implementation_version: "qf-market-expression-comparison-v1" }, params: { task_id: taskId } }, trace("worker")) as { state: Record<string, unknown> };
  const scope = kernelDecisionReadScope("worker")!;
  const handlers = new Map<string, (params: unknown) => unknown>();
  registerOntologyGatewayRpc(
    (method, handler) => { handlers.set(method, handler as (params: unknown) => unknown); },
    () => ({ sessionId: "worker", role: "worker" }),
    async () => undefined,
  );
  const listed = handlers.get("qf.ontology.list_tools")!({ session_id: "worker", kernel_db: process.env.QF_KERNEL_DB }) as { tools: Array<{ name: string }> };
  expect(listed.tools.map((tool) => tool.name).sort()).toEqual([...new Set(scope.allowed.map((key) => key.slice(0, key.indexOf(":"))))].sort());
  expect(listed.tools.some((tool) => tool.name === "qf_dataset_get")).toBe(true);
  const inFlight = kernelGetResearchWorldProjection({ root_type: "mission", root_id: mission.mission_id });
  expect(inFlight.ok).toBe(true);
  if (!inFlight.ok) throw new Error("in-flight projection refused");
  for (const id of [mission.mission_id, taskId, "worker", "director", "decision-run", evidence.dataset_id, hypothesis.object_id, quoteId, String(run.state.result_artifact_id)]) {
    expect(inFlight.world.objects.some((object) => object.id === id)).toBe(true);
  }
  expect(inFlight.world.objects.find((object) => object.type === "mission")?.fields.state).toBe("research in progress");
  expect(inFlight.world.current_report_id).toBeNull();
  expect(inFlight.world.objects.some((object) => object.type === "evaluation")).toBe(false);
  const sourceArtifact = kernelGetObject("artifact", capture.artifact_id)!;
  expect(kernelDecisionArtifactView(capture.artifact_id, scope.run)).toEqual({ id: capture.artifact_id, content_hash: capture.artifact_id, content: source });
  const boundedPacket = kernelDecisionModelReadView("qf_artifact_get", String(run.state.result_artifact_id), scope.run, null) as Record<string, unknown>;
  expect(new TextEncoder().encode(JSON.stringify(boundedPacket)).byteLength).toBeLessThanOrEqual(16 * 1024);
  expect(boundedPacket.contract).toBe("qf.market.model-evidence.v1");
  const fullCalculation = (kernelDecisionArtifactView(String(run.state.result_artifact_id), scope.run) as { content: { comparisons: unknown[] } }).content;
  const compactRows = boundedPacket.offered_market_comparisons as Record<string, unknown>[];
  const comparisonContext = boundedPacket.comparison_context as Record<string, unknown>;
  expect(compactRows.map((row) => ({ ...comparisonContext, ...row }))).toEqual(fullCalculation.comparisons);
  expect(compactRows).toHaveLength(fullCalculation.comparisons.length);
  expect(comparisonContext).toHaveProperty("event_cutoff");
  expect(comparisonContext).not.toHaveProperty("raw_break_even");
  expect(compactRows.every((row) => typeof row.selection_id === "string" && typeof row.quote_id === "string")).toBe(true);
  expect(JSON.stringify(boundedPacket)).not.toContain(String(sourceArtifact.storage_ref));
  const manyFactsRun = structuredClone(scope.run);
  const manyFactsParams = JSON.parse(String(manyFactsRun.params));
  manyFactsParams.decision_context.evidence_facts = Array.from({ length: 13 }, (_, index) => ({ fact: `declared-${index}`, coverage: "official", exclusion: "none" }));
  manyFactsRun.params = JSON.stringify(manyFactsParams);
  const manyFactsPacket = kernelDecisionModelReadView("qf_artifact_get", String(run.state.result_artifact_id), manyFactsRun, null) as { official_evidence: unknown[]; exact_counts: { evidence_facts: number } };
  expect(manyFactsPacket.official_evidence).toHaveLength(13);
  expect(manyFactsPacket.exact_counts.evidence_facts).toBe(13);
  const oversizeRun = structuredClone(manyFactsRun); const oversizeParams = JSON.parse(String(oversizeRun.params));
  oversizeParams.decision_context.evidence_facts = Array.from({ length: 13 }, (_, index) => ({ fact: `declared-${index}-${"x".repeat(1400)}` })); oversizeRun.params = JSON.stringify(oversizeParams);
  expect(() => kernelDecisionModelReadView("qf_artifact_get", String(run.state.result_artifact_id), oversizeRun, null)).toThrow("exceeds the model-facing limit");
  const sourceBytes = readFileSync(String(sourceArtifact.storage_ref));
  try {
    writeFileSync(String(sourceArtifact.storage_ref), JSON.stringify(capture.menu));
    expect(() => kernelDecisionArtifactView(capture.artifact_id, scope.run)).toThrow("bytes changed");
  } finally { writeFileSync(String(sourceArtifact.storage_ref), sourceBytes); }
  expect(kernelDecisionArtifactView(capture.artifact_id, scope.run)).toEqual({ id: capture.artifact_id, content_hash: capture.artifact_id, content: source });
  const before = getKernelDb().query("SELECT count(*) AS n FROM events").get();
  expect(() => callOntologyReadTool({ sessionId: "worker", role: "worker" }, "qf_quote_get", { id: "foreign" })).toThrow("exact Hypothesis");
  expect(() => callOntologyReadTool({ sessionId: "worker", role: "worker" }, "qf_dataset_get", { id: "foreign" })).toThrow("exact Hypothesis");
  expect(() => callOntologyReadTool({ sessionId: "worker", role: "worker" }, "qf_dataset_query", {})).toThrow("exact Hypothesis");
  expect(() => callOntologyReadTool({ sessionId: "worker", role: "worker" }, "qf_dataset_get", { id: evidence.dataset_id, extra: true })).toThrow("exact Hypothesis");
  expect(getKernelDb().query("SELECT count(*) AS n FROM events").get()).toEqual(before);
  const receipts = scope.allowed.map((key) => { const colon = key.indexOf(":"); return callOntologyReadTool({ sessionId: "worker", role: "worker" }, key.slice(0, colon), { id: key.slice(colon + 1) }).artifactId; });
  for (const receipt of receipts) {
    expect(() => kernelReadMarketTrajectoryResult(receipt, "worker")).not.toThrow();
    expect(() => kernelReadMarketTrajectoryResult(receipt, "director")).toThrow("assigned worker");
  }
  expect(() => kernelReadMarketTrajectoryResult(genericRead, "worker")).toThrow("outside the exact decision context");
  expect(() => kernelReadMarketTrajectoryResult(capture.artifact_id, "worker")).toThrow("trajectory artifact");
  const receiptArtifact = kernelGetObject("artifact", receipts[0]!)!;
  const receiptBytes = readFileSync(String(receiptArtifact.storage_ref));
  try {
    writeFileSync(String(receiptArtifact.storage_ref), "{}");
    expect(() => kernelReadMarketTrajectoryResult(receipts[0]!, "worker")).toThrow("do not match artifact hash");
  } finally { writeFileSync(String(receiptArtifact.storage_ref), receiptBytes); }
  const artifact = kernelGetObject("artifact", String(run.state.result_artifact_id))!;
  const output = JSON.parse(readFileSync(String(artifact.storage_ref), "utf8")); const { selections, ...identity } = output.context;
  const decision = { contract: "qf.market.decision.v1", ...identity, comparisons: output.comparisons, research_assessment: "INSUFFICIENT_EVIDENCE", classification: "WATCH", selection_id: null, selection_reason: "Desired submission prop absent", change_condition: "Refresh if exact prop is offered and a supported probability method becomes available", rationale: "Official sparse facts cannot estimate the matchup", evidence_refs: identity.inputs.map((row: { id: string }) => row.id), limitations: "Synthetic control only", invalidation: "Refresh stale Quotes", provenance: { provider: "synthetic", model: "test", runtime: "test" } };
  const assessment = { contract: "qf.market.assessment.v1", research_assessment: "INSUFFICIENT_EVIDENCE", classification: "WATCH", selection_id: null, selection_reason: "The requested market is unavailable", change_condition: "Refresh when the exact market is posted", rationale: "The bounded evidence does not establish the claimed method", limitations: "Sparse official history", invalidation: "New market or evidence" };
  expect(() => kernelCompleteMarketAssessment(taskId, "worker", JSON.stringify(assessment))).toThrow("trusted runtime receipt");
  recordMarketRuntimeReceipt("worker", { provider: "test-provider", model: "test-model", runtime: "test-runtime", input_tokens: 10, output_tokens: 5, total_tokens: 15, latency_seconds: 1 });
  const completedAssessment = JSON.parse(kernelCompleteMarketAssessment(taskId, "worker", JSON.stringify(assessment)));
  expect(completedAssessment).toMatchObject({ contract: "qf.market.decision.v1", task_id: taskId, run_id: "decision-run", research_assessment: "INSUFFICIENT_EVIDENCE", classification: "WATCH" });
  expect(completedAssessment.evidence_refs).toEqual(identity.inputs.map((row: { id: string }) => row.id));
  expect(completedAssessment.provenance).toEqual({ provider: "test-provider", model: "test-model", runtime: "test-runtime" });
  expect(() => kernelCompleteMarketAssessment(taskId, "worker", JSON.stringify({ ...assessment, mission_id: "foreign" }))).toThrow("bounded judgment fields");
  const commit = (value: unknown, reads = receipts) => commitCollaborationResult({ taskId, workerSessionId: "worker", workerRole: "worker", delegatorSessionId: "director", delegatorRole: "orchestrator", result: JSON.stringify(value), citedMarketIds: capture.rows.map((row) => row.quote_id), readTrajectoryArtifactIds: reads }, (artifactId) => kernelBindSourceWork({ source_task_id: taskId, hypothesis_id: hypothesis.object_id, run_id: "decision-run", result_artifact_id: artifactId, executor_session_id: "worker" }));
  const arbitrary = structuredClone(decision); arbitrary.comparisons[0].probability = { low: 0.9, central: 0.95, high: 1 };
  expect(() => commit(arbitrary)).toThrow("probability method provenance");
  expect(kernelGetObject("task", taskId)?.status).toBe("open");
  expect(() => commit(decision, receipts.slice(1))).toThrow("complete exact input set");
  // Exercise the real assessment adapter, not a separately assembled full-decision fixture.
  const completed = commit(completedAssessment);
  expect(kernelGetObject("task", taskId)?.status).toBe("done");
  expect(kernelGetObject("artifact", completed.artifactId)?.kind).toBe("trajectory");
  kernelExecute("register_agent_definition", { name: "hermes-critic", role: "critic", package_ref: "species/hermes/packed/hermes.aospkg", runtime_profile: "default", capability_groups: ["research.evaluate"] }, trace());
  kernelExecute("create_agent_session", { session_id: "critic", agent_definition_id: "hermes-critic" }, trace()); kernelExecute("start_agent_session", { session_id: "critic" }, trace());
  const review = kernelRequestGovernedReview(taskId, "review-attempt", "critic");
  expect(review.kind).toBe("admitted");
  kernelMarkGovernedDelivery(review.review_task_id!, "delivered");
  const pendingReview = kernelGetResearchWorldProjection({ root_type: "task", root_id: taskId });
  expect(pendingReview.ok && pendingReview.world.objects.some((object) => object.id === review.review_task_id)).toBe(true);
  expect(pendingReview.ok && pendingReview.world.objects.some((object) => object.id === "critic")).toBe(true);
  expect(pendingReview.ok && pendingReview.world.objects.some((object) => object.type === "evaluation")).toBe(false);
  const critic = { sessionId: "critic", role: "critic" };
  for (const [tool, id] of [["qf_hypothesis_get", hypothesis.object_id], ["qf_run_get", "decision-run"], ["qf_artifact_get", completed.artifactId]]) callOntologyReadTool(critic, tool!, { id });
  const grade = await callOntologyTool(critic, "qf_record_evaluation", { hypothesis_id: hypothesis.object_id, run_id: "decision-run", artifact_id: completed.artifactId, verdict: "supports", confidence: 0.9, rationale: "The explicit WATCH is faithful to unavailable probability, not a claim the Hypothesis is true.", rubric: { faithfulness: 1, answer_relevancy: 1, context_precision: 1, context_recall: 1 }, findings: ["menu_coverage", "quote_freshness", "no_vig_scope", "submission_mechanism", "probability_provenance", "arithmetic", "best_expression", "material_attack"].map((code) => ({ code, severity: "info", message: `${code}: checked the exact synthetic Run; attempted unsupported probability was refused.`, evidence_refs: ["decision-run"] })) }, async () => null);
  const evaluationId = String((grade.result as { object_id: string }).object_id);
  const finalized = kernelFinalizeResearchEvaluation(evaluationId);
  expect(finalized.current).toBe(true); expect(finalized.status).toBe("open");
  expect(finalized.authorityKey).toContain("qf.market.authority.v1");
  const report = kernelGetObject("artifact", finalized.reportArtifactId!)!;
  const publishedDecision = JSON.parse(readFileSync(String(report.storage_ref), "utf8")).decision;
  expect(publishedDecision.classification).toBe("WATCH");
  expect(publishedDecision.selection_id).toBeNull();
  expect(publishedDecision.selection_reason).toBe(assessment.selection_reason);
  expect(publishedDecision.market_availability).toEqual(identity.market_availability);
  const projection = kernelGetResearchWorldProjection({ root_type: "mission", root_id: mission.mission_id });
  expect(projection.ok && projection.world.objects.some((row) => row.fields.market_decision)).toBe(true);
  closeAppKernel(); openAppKernel();
  expect(kernelGetObject("artifact", finalized.reportArtifactId!)?.kind).toBe("report");
  expect(kernelGetObject("evaluation", evaluationId)?.verdict).toBe("supports");
  expect(recordMarketRuntimeFailure("worker")).toBe(false);
  expect(() => assertMarketRetryTask(taskId, () => true)).toThrow("Retry refused");
  kernelExecute("create_task", { task_id: "interrupted-task", title: "Analyze Grasso retry control", description: "Preserve the unfinished task", assignee_session_id: "worker" }, trace("director", mission.mission_id));
  const runInput = { run_id: "interrupted-run", dataset_id: evidence.dataset_id, mission_id: mission.mission_id, quote_id: quoteId, tool_id: "research-lab", hypothesis_id: hypothesis.object_id, calculation: { contract: "qf.calculation.v1", operation: "market_expression_comparison", version: 1, formula_version: 1, implementation_version: "qf-market-expression-comparison-v1" }, params: { task_id: "interrupted-task" } };
  kernelExecute("execute_deterministic_run", runInput, trace("worker"));
  expect(() => assertMarketRetryTask("interrupted-task", () => true)).toThrow("Retry refused");
  let failures = 0;
  const receive = createMarketFailureReceiver("test-nonce", () => { if (recordMarketRuntimeFailure("worker")) failures++; });
  receive(Buffer.from("Upstream idle timeout exceeded\nQF_STREAM_FAILURE foreign\n"));
  expect(kernelGetObject("agent_session", "worker")?.status).toBe("running");
  const frame = "\nQF_STREAM_FAILURE test-nonce\n";
  receive(Buffer.from(frame.slice(0, 24))); receive(Buffer.from(frame.slice(24))); receive(Buffer.from(frame));
  expect(failures).toBe(1);
  expect(kernelGetObject("agent_session", "worker")?.status).toBe("failed");
  expect(kernelGetObject("task", "interrupted-task")?.status).toBe("open");
  expect(kernelGetObject("artifact", receipts[0]!)).not.toBeNull();
  expect(() => assertMarketRetryTask("interrupted-task", () => true)).toThrow("Retry refused");
  expect(() => assertMarketRetryTask("interrupted-task", () => false)).toThrow("original Research Director");
  expect(assertMarketRetryTask("interrupted-task", (id) => id === "director")).toBe("director");
  const failedWorld = kernelGetResearchWorldProjection({ root_type: "task", root_id: taskId });
  expect(failedWorld.ok && failedWorld.world.objects.find((object) => object.id === "worker")?.fields.failure_reason).toBe("provider_stream_interrupted");
  kernelExecute("create_agent_session", { session_id: "retry-worker", agent_definition_id: "definition-worker" }, trace());
  kernelExecute("start_agent_session", { session_id: "retry-worker" }, trace());
  expect(() => kernelExecute("reassign_task", { task_id: "interrupted-task", assignee_session_id: "retry-worker" }, trace("critic"))).toThrow("delegator");
  kernelExecute("reassign_task", { task_id: "interrupted-task", assignee_session_id: "retry-worker" }, trace("director"));
  kernelExecute("execute_deterministic_run", { ...runInput, run_id: "retry-run" }, trace("retry-worker"));
  expect(kernelDecisionReadScope("retry-worker")?.run.id).toBe("retry-run");
  expect(kernelDecisionReadScope("worker")).toBeNull();
  expect(kernelGetObject("run", "interrupted-run")).not.toBeNull();
  kernelExecute("execute_deterministic_run", { ...runInput, run_id: "ambiguous-retry-run" }, trace("retry-worker"));
  expect(() => kernelDecisionReadScope("retry-worker")).toThrow("ambiguous Run identity");
  kernelExecute("create_agent_session", { session_id: "other-failure", agent_definition_id: "definition-worker" }, trace());
  kernelExecute("start_agent_session", { session_id: "other-failure" }, trace());
  kernelExecute("create_task", { task_id: "other-failure-task", title: "Other failure control", description: "Not an authorized stream retry", assignee_session_id: "other-failure" }, trace("director", mission.mission_id));
  kernelExecute("fail_agent_session", { session_id: "other-failure", reason: "app_terminated" }, trace());
  expect(() => kernelExecute("reassign_task", { task_id: "other-failure-task", assignee_session_id: "retry-worker" }, trace("director"))).toThrow("not running");
});
