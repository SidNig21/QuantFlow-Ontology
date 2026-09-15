import { afterAll, expect, test, mock } from "bun:test";
import { mkdtempSync, mkdirSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { runBovadaLiveMarketsCapture, BOVADA_UFC_URL } from "qf-bovada-football";
import { assertMarketInvestigationQuote } from "qf-kernel/portable";
mock.module("electron", () => ({ BrowserWindow: { getAllWindows: () => [] } }));
import { openAppKernel, closeAppKernel, getKernelDb, kernelExecute, kernelGetObject, kernelGetLinks, kernelDecisionReadScope, kernelDecisionArtifactView, kernelDecisionModelReadView, kernelMarketReviewArtifactView, kernelCompleteMarketAssessment, kernelBindSourceWork, commitCollaborationResult, kernelRequestGovernedReview, kernelMarkGovernedDelivery, kernelFinalizeResearchEvaluation, kernelGetResearchWorldProjection, kernelReadMarketTrajectoryResult, kernelSessionCoordinatesOtherOpenTask, kernelSessionFailureReason } from "./kernel";
import { addOfficialEvidence } from "./evidence-computation";
import { createMarketDeskInvestigation } from "./market-desk";
import { createMarketFailureReceiver, recordMarketRuntimeFailure, assertMarketRetryTask } from "./market-runtime-failure";
import { recordMarketRuntimeReceipt } from "./market-runtime-receipt";
import { handleMarketResumeFailure } from "./market-resume-failure";
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
  // Match the expanded live menu shape: 18 markets and 77 selections, not only
  // the original four-outcome entrance. Every outcome must reach the worker.
  const event = source[0]!.events[0]!;
  for (let market = 0; market < 16; market++) {
    event.displayGroups[0]!.markets.push({
      id: `finish-${market}`, description: `Synthetic finish market ${market}`, key: "MW-ML", status: "O", period,
      outcomes: Array.from({ length: market === 15 ? 13 : 4 }, (_, outcome) => ({
        id: `finish-${market}-${outcome}`, description: `Synthetic finish expression ${market}-${outcome}`, status: "O", type: "N",
        price: { american: "+400", decimal: "5", fractional: "4/1" },
      })),
    });
  }
  event.numMarkets = 19;
  const capture = await runBovadaLiveMarketsCapture({ db: getKernelDb(), artifactRoot: process.env.QF_ARTIFACT_ROOT!, request: { sport: "ufc", competition: "ufc", market_class: "moneyline" }, provider_event_id: "29195963", requested_expression: { expression: "Alexa Grasso wins by submission", market_description: "Method of Victory", outcome_description: "Alexa Grasso by Submission" }, transport: async () => response(BOVADA_UFC_URL, JSON.stringify(source)), now: () => now, kernel: { execute: (_db, command, input, t) => kernelExecute(command, input, t), getObject: (_db, type, id) => kernelGetObject(type, id), getLinks: (_db, id, options) => kernelGetLinks(id, options) } });
  expect(capture.rows).toHaveLength(18);
  expect(capture.menu.requested_expression).toMatchObject({
    status: "availability_unknown",
    selection_ids: [],
    observed_at: now.toISOString(),
  });
  expect(capture.menu.completeness).toMatchObject({ status: "provider_reports_additional_markets", provider_reported_market_count: 19, returned_unique_market_count: 18 });
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
  expect(boundedPacket.contract).toBe("qf.market.model-evidence.v2");
  const fullCalculation = (kernelDecisionArtifactView(String(run.state.result_artifact_id), scope.run) as { content: { comparisons: unknown[] } }).content;
  expect(fullCalculation.comparisons).toHaveLength(77);
  expect(boundedPacket.exact_counts).toMatchObject({ comparisons: 77 });
  expect(boundedPacket.market_availability).toEqual(capture.menu.requested_expression && JSON.parse(String(scope.run.params)).decision_context.market_availability);
  const manifest = boundedPacket.comparison_manifest as Array<{ quote_id: string; comparison_indices: number[] }>;
  expect(manifest).toHaveLength(18);
  const indices = manifest.flatMap((entry) => entry.comparison_indices);
  expect([...indices].sort((a, b) => a - b)).toEqual(Array.from({ length: 77 }, (_, index) => index));
  expect(new Set(indices).size).toBe(77);
  const reconstructed: unknown[] = [];
  for (const entry of manifest) {
    // The immutable Run projection must ignore a different current Quote value.
    const packet = kernelDecisionModelReadView("qf_quote_get", entry.quote_id, scope.run, { id: entry.quote_id, as_of: "foreign", coverage: { provider_event_id: "foreign" } }) as { contract: string; result_artifact_id: string; comparison_indices: number[]; comparison_context: Record<string, unknown>; offered_market_comparisons: Record<string, unknown>[] };
    expect(Buffer.byteLength(JSON.stringify(packet))).toBeLessThanOrEqual(16 * 1024);
    expect(packet.contract).toBe("qf.market.model-quote.v1");
    expect(packet.result_artifact_id).toBe(run.state.result_artifact_id);
    expect(packet.comparison_indices).toEqual(entry.comparison_indices);
    expect(packet.offered_market_comparisons).toHaveLength(entry.comparison_indices.length);
    expect(packet.comparison_context).toHaveProperty("event_cutoff");
    expect(packet.comparison_context).not.toHaveProperty("raw_break_even");
    packet.offered_market_comparisons.forEach((row, index) => { reconstructed[packet.comparison_indices[index]!] = { ...packet.comparison_context, ...row }; });
  }
  expect(reconstructed).toEqual(fullCalculation.comparisons);
  expect(() => kernelDecisionModelReadView("qf_quote_get", "foreign", scope.run, null)).toThrow("outside the exact comparison set");
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
  const largeComparison = structuredClone(fullCalculation);
  (largeComparison.comparisons[0] as Record<string, unknown>).label = "x".repeat(20_000);
  const largeBytes = JSON.stringify(largeComparison);
  const largeHash = createHash("sha256").update(largeBytes).digest("hex");
  const largePath = join(process.env.QF_ARTIFACT_ROOT!, "oversized-quote.json");
  writeFileSync(largePath, largeBytes);
  kernelExecute("publish_artifact", { kind: "trajectory", path: largePath, storage_ref: largePath, content_hash: largeHash }, trace());
  const largeRun = { ...scope.run, params: JSON.stringify({ ...JSON.parse(String(scope.run.params)), result_artifact_id: largeHash }) };
  // The shared packet can fit while one complete Quote cannot: both must be preflighted.
  expect(() => kernelDecisionModelReadView("qf_artifact_get", largeHash, largeRun, null)).not.toThrow();
  expect(() => kernelDecisionModelReadView("qf_quote_get", manifest[0]!.quote_id, largeRun, null)).toThrow("exceeds the model-facing limit");
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
  expect(() => commit(decision, receipts.slice(0, -1))).toThrow("complete exact input set");
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
  const reviewArtifact = kernelGetObject("artifact", completed.artifactId)!;
  const reviewBytes = readFileSync(String(reviewArtifact.storage_ref));
  expect(reviewBytes.byteLength).toBeGreaterThan(65_536);
  const readsBefore = getKernelDb().query("SELECT count(*) AS n FROM events").get();
  try {
    writeFileSync(String(reviewArtifact.storage_ref), "{}");
    expect(() => callOntologyReadTool(critic, "qf_artifact_get", { id: completed.artifactId })).toThrow("bytes changed");
    expect(getKernelDb().query("SELECT count(*) AS n FROM events").get()).toEqual(readsBefore);
  } finally { writeFileSync(String(reviewArtifact.storage_ref), reviewBytes); }
  const oversizedTrajectory = JSON.parse(reviewBytes.toString("utf8"));
  oversizedTrajectory.result = JSON.stringify({ ...completedAssessment, rationale: "x".repeat(65_536) });
  const oversizedBytes = JSON.stringify(oversizedTrajectory);
  const oversizedHash = createHash("sha256").update(oversizedBytes).digest("hex");
  const oversizedPath = join(root, "oversized-review.json");
  writeFileSync(oversizedPath, oversizedBytes);
  kernelExecute("publish_artifact", { kind: "trajectory", storage_ref: oversizedPath, path: oversizedPath, content_hash: oversizedHash, links: [] }, trace());
  expect(() => kernelMarketReviewArtifactView(kernelGetObject("artifact", oversizedHash)!, { source_task_id: taskId, hypothesis_id: hypothesis.object_id, run_id: "decision-run", result_artifact_id: oversizedHash, executor_session_id: "worker" })).toThrow("Complete review evidence exceeds");
  for (const [tool, id] of [["qf_hypothesis_get", hypothesis.object_id], ["qf_run_get", "decision-run"], ["qf_artifact_get", completed.artifactId]]) {
    const read = callOntologyReadTool(critic, tool!, { id });
    if (tool === "qf_artifact_get") {
      const result = read.result as { content_hash: string; receipt: { comparison_context: Record<string, unknown>; content: { result: { comparisons: Record<string, unknown>[] } } } };
      expect(result.content_hash).toBe(completed.artifactId);
      const reviewDecision = result.receipt.content.result;
      expect({ ...reviewDecision, comparisons: reviewDecision.comparisons.map((row) => ({ ...result.receipt.comparison_context, ...row })) }).toEqual(completedAssessment);
      expect(result.receipt.content.result.comparisons).toHaveLength(77);
      expect(new TextEncoder().encode(JSON.stringify(result)).byteLength).toBeLessThanOrEqual(65_536);
    }
  }
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
  expect(() => assertMarketRetryTask(taskId, () => true)).toThrow("Resume refused");
  kernelExecute("create_task", { task_id: "interrupted-task", title: "Analyze Grasso retry control", description: "Preserve the unfinished task", assignee_session_id: "worker" }, trace("director", mission.mission_id));
  const runInput = { run_id: "interrupted-run", dataset_id: evidence.dataset_id, mission_id: mission.mission_id, quote_id: quoteId, tool_id: "research-lab", hypothesis_id: hypothesis.object_id, calculation: { contract: "qf.calculation.v1", operation: "market_expression_comparison", version: 1, formula_version: 1, implementation_version: "qf-market-expression-comparison-v1" }, params: { task_id: "interrupted-task" } };
  kernelExecute("execute_deterministic_run", runInput, trace("worker"));
  expect(() => assertMarketRetryTask("interrupted-task", () => true)).toThrow("Resume refused");
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
  expect(() => assertMarketRetryTask("interrupted-task", () => true)).toThrow("Resume refused");
  expect(assertMarketRetryTask("interrupted-task", () => false)).toBe("worker");
  const failedWorld = kernelGetResearchWorldProjection({ root_type: "task", root_id: taskId });
  expect(failedWorld.ok && failedWorld.world.objects.find((object) => object.id === "worker")?.fields.failure_reason).toBe("provider_stream_interrupted");
  kernelExecute("create_agent_session", { session_id: "retry-worker", agent_definition_id: "definition-worker" }, trace());
  kernelExecute("start_agent_session", { session_id: "retry-worker" }, trace());
  expect(() => kernelExecute("resume_interrupted_market_task", { task_id: "interrupted-task", coordinator_session_id: "director", assignee_session_id: "retry-worker", attempt_id: "forged-resume" }, trace("critic"))).toThrow("operator-only");
  kernelExecute("resume_interrupted_market_task", { task_id: "interrupted-task", coordinator_session_id: "director", assignee_session_id: "retry-worker", attempt_id: "accepted-resume" }, trace());
  expect(kernelGetLinks("interrupted-task", { kind: "delegated_by" }).map((link) => link.to_id)).toEqual(["director"]);
  expect(kernelGetLinks("interrupted-task", { kind: "coordinated_by" }).map((link) => link.to_id)).toEqual(["director"]);
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
  expect(assertMarketRetryTask("other-failure-task", () => false)).toBe("other-failure");
  expect(() => kernelExecute("resume_interrupted_market_task", { task_id: "other-failure-task", coordinator_session_id: "director", assignee_session_id: "retry-worker", attempt_id: "busy-worker" }, trace())).toThrow("already owns open work");

  kernelExecute("create_agent_session", { session_id: "failed-resume-worker", agent_definition_id: "definition-worker" }, trace());
  kernelExecute("start_agent_session", { session_id: "failed-resume-worker" }, trace());
  kernelExecute("resume_interrupted_market_task", { task_id: "other-failure-task", coordinator_session_id: "director", assignee_session_id: "failed-resume-worker", attempt_id: "failed-dispatch" }, trace());
  kernelExecute("execute_deterministic_run", { ...runInput, run_id: "failed-resume-run", params: { task_id: "other-failure-task" } }, trace("failed-resume-worker"));
  const stopped: string[] = [];
  await handleMarketResumeFailure({ committed: true, dispatchAttempted: true, worker: { sessionId: "failed-resume-worker", requestOwned: false }, coordinator: { sessionId: "director", requestOwned: true } }, {
    resultCommitted: () => false,
    coordinatorHasOtherOpenWork: (sessionId) => kernelSessionCoordinatesOtherOpenTask(sessionId, "other-failure-task"),
    workerRunning: (sessionId) => kernelGetObject("agent_session", sessionId)?.status === "running",
    failWorker: (sessionId, reason) => { kernelExecute("fail_agent_session", { session_id: sessionId, reason }, trace()); },
    stopParticipant: async (sessionId) => { stopped.push(sessionId); },
  });
  expect(kernelSessionFailureReason("failed-resume-worker")).toBe("market_resume_dispatch_failed");
  expect(kernelGetObject("task", "other-failure-task")?.status).toBe("open");
  expect(stopped).toEqual(["failed-resume-worker"]);
  kernelExecute("create_agent_session", { session_id: "recovered-resume-worker", agent_definition_id: "definition-worker" }, trace());
  kernelExecute("start_agent_session", { session_id: "recovered-resume-worker" }, trace());
  kernelExecute("resume_interrupted_market_task", { task_id: "other-failure-task", coordinator_session_id: "director", assignee_session_id: "recovered-resume-worker", attempt_id: "recovered-dispatch" }, trace());
  kernelExecute("execute_deterministic_run", { ...runInput, run_id: "recovered-resume-run", params: { task_id: "other-failure-task" } }, trace("recovered-resume-worker"));
  expect(kernelDecisionReadScope("recovered-resume-worker")?.run.id).toBe("recovered-resume-run");
  expect(kernelGetObject("run", "failed-resume-run")).not.toBeNull();
  const resumedWorld = kernelGetResearchWorldProjection({ root_type: "task", root_id: "other-failure-task" });
  expect(resumedWorld.ok).toBe(true);
  if (!resumedWorld.ok) throw new Error("resumed projection refused");
  expect(resumedWorld.world.current_attempt_run_id).toBe("recovered-resume-run");
  expect(resumedWorld.world.objects.find((row) => row.id === "other-failure-task")?.fields).toMatchObject({
    original_delegator_session_id: "director",
    current_coordinator_session_id: "director",
  });
  expect(resumedWorld.world.objects.map((row) => row.id)).toEqual(expect.arrayContaining(["failed-resume-worker", "recovered-resume-worker", "failed-resume-run", "recovered-resume-run"]));

  const changedOdds = structuredClone(source);
  changedOdds[0]!.events[0]!.displayGroups[0]!.markets[0]!.outcomes[0]!.price.american = "-210";
  changedOdds[0]!.events[0]!.displayGroups[0]!.markets[0]!.outcomes[0]!.price.decimal = "1.47619";
  const recapture = async (requestedExpression: string, millis: number) => runBovadaLiveMarketsCapture({ db: getKernelDb(), artifactRoot: process.env.QF_ARTIFACT_ROOT!, request: { sport: "ufc", competition: "ufc", market_class: "moneyline" }, provider_event_id: "29195963", requested_expression: { expression: requestedExpression, market_description: "Method of Victory", outcome_description: "Alexa Grasso by Submission" }, transport: async () => response(BOVADA_UFC_URL, JSON.stringify(changedOdds)), now: () => new Date(now.getTime() + millis), kernel: { execute: (_db, command, input, t) => kernelExecute(command, input, t), getObject: (_db, type, id) => kernelGetObject(type, id), getLinks: (_db, id, options) => kernelGetLinks(id, options) } });
  const changed = await recapture("Alexa Grasso wins by submission", 2_000);
  const changedQuote = changed.rows.find((row) => row.provider_market_id === "winner")!.quote_id;
  expect(() => assertMarketInvestigationQuote(getKernelDb(), mission.mission_id, changedQuote, { now: now.getTime() + 2_000 })).not.toThrow();
  const foreign = await recapture("Manon Fiorot wins by submission", 3_000);
  const foreignQuote = foreign.rows.find((row) => row.provider_market_id === "winner")!.quote_id;
  expect(() => assertMarketInvestigationQuote(getKernelDb(), mission.mission_id, foreignQuote, { now: now.getTime() + 3_000 })).toThrow("original requested expression");
});
