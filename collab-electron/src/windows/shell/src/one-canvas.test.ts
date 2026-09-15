import { expect, test } from "bun:test";
import { hasLiveDirectorSurface, oneCanvasSurfaceObjects, readyDirectorDefinitions, requireRevisionAdmission, requireSecondCriticAdmission } from "./one-canvas.js";
import { blockedReviewPresentation, contextualInspectReceipt, criticMaterialAttack, deriveResearchWorkflow, researchDecisionHistory } from "./research-workflow.js";

test("one Canvas exposes one purposeful investigation surface instead of Kernel-card inventory", () => {
  const mission = { type: "mission", id: "mission-1", fields: {} };
  const report = { type: "artifact", id: "report-1", fields: { kind: "report" } };
  const noisy = [
    { type: "hypothesis", id: "hypothesis-1", fields: {} },
    { type: "task", id: "task-1", fields: {} },
    { type: "run", id: "run-1", fields: {} },
    { type: "evaluation", id: "evaluation-1", fields: {} },
  ];
  expect(oneCanvasSurfaceObjects({ mission, currentReport: null, objects: [mission, ...noisy] })).toEqual([mission]);
  expect(oneCanvasSurfaceObjects({ mission, currentReport: report, objects: [mission, report, ...noisy] })).toEqual([report]);
});

test("cold open selects the exact Research Director instead of any orchestrator", () => {
  const director = {
    id: "hermes-research-director",
    role: "orchestrator",
    display_name: "Research Director",
    capability_groups: ["desk.orchestrate"],
  };
  const definitions = [
    {
      id: "hermes-orchestrator",
      role: "orchestrator",
      display_name: "Orchestrator",
      capability_groups: ["desk.orchestrate"],
    },
    director,
  ];

  expect(readyDirectorDefinitions(definitions)).toEqual([director]);
  expect(readyDirectorDefinitions([director, { ...director }])).toHaveLength(2);
  expect(readyDirectorDefinitions(definitions.filter((definition) => definition !== director))).toEqual([]);
});

test("the ready Director is retired only when its real participant surface exists", () => {
  expect(hasLiveDirectorSurface([{ ontologyType: "ready_director", ontologyId: "hermes-research-director" }])).toBe(false);
  expect(hasLiveDirectorSurface([{ sessionId: "worker-1", definitionId: "hermes-worker" }])).toBe(false);
  expect(hasLiveDirectorSurface([{ sessionId: "director-1", definitionId: "hermes-research-director" }])).toBe(true);
  expect(hasLiveDirectorSurface([{ sessionId: "director-1", definitionId: "hermes-research-director-copy" }])).toBe(false);
});

test("rendered shell has no alternate Canvas mode controls or persisted Canvas restoration", async () => {
  const html = await Bun.file(new URL("../index.html", import.meta.url)).text();
  const renderer = await Bun.file(new URL("./renderer.js", import.meta.url)).text();
  expect(html).toContain('id="canvas-watermark"');
  expect(html).toContain('id="canvas-watermark" aria-hidden="true"');
  expect(renderer).toContain("createFlowCubeWatermark");
  const watermark = await Bun.file(new URL("../../shared/flow-cube/flow-cube-watermark.js", import.meta.url)).text();
  expect(watermark).toContain('stage.setAttribute("focusable", "false")');
  expect(watermark).toContain('prefers-reduced-motion: reduce');
  expect(html).not.toMatch(/CURRENT_MISSION|FULL_LINEAGE|research-world-projection|data-dock-mode="HISTORY"/);
  expect(renderer).not.toMatch(/canvasLoadState|canvasSaveState|setInterval\(/);
  expect(renderer).not.toMatch(/createCableController|listConnections|createConnection|deleteConnection/);
  expect(renderer).toContain("createOneCanvasController");
  expect(renderer).toContain("!container?.hidden && container?.style?.display !== \"none\"");
	expect(renderer).toContain("if (sessionId && researchWorldController?.getLastRoot?.())");
	expect(renderer).toContain("window.requestAnimationFrame(() => tidyTilesToGrid())");
	expect(renderer).toContain('panelManager.initPrefs(prefNavWidth, "closed")');
	expect(renderer).toContain('channel === "market-decision-settled"');
	const oneCanvas = await Bun.file(new URL("./one-canvas.js", import.meta.url)).text();
	const researchWorkflow = await Bun.file(new URL("./research-workflow.js", import.meta.url)).text();
	const css = await Bun.file(new URL("./shell.css", import.meta.url)).text();
	expect(oneCanvas).toContain('dom.idSpan.textContent = "DIRECTOR"');
	expect(oneCanvas).toContain('summary.textContent = "Technical details"');
	expect(oneCanvas).toContain("analysisErrors.set(mission.id, message)");
	expect(oneCanvas).toContain('appendText(surface, "qf-investigation-surface__error", priorError)');
	expect(oneCanvas).toContain("runtimeFailed");
	expect(oneCanvas).toContain("retry_task_id");
	expect(oneCanvas).toContain('"Resume with current market"');
	expect(oneCanvas).toContain("Your saved evidence is intact; retry after service returns.");
	expect(researchWorkflow).toContain('state: "Publication blocked"');
	expect(oneCanvas).toContain('second.textContent = blocked.secondCriticInProgress ? "Second critic in progress" : "Second critic"');
	expect(oneCanvas).toContain('blocked.revisionInProgress ? "Revision in progress" : "Request revision"');
	expect(oneCanvas).toContain("Revision captures a newer exact Bovada observation, creates a new result, and sends it through independent review.");
	expect(renderer).toContain("requireSecondCriticAdmission(response)");
	expect(css).toContain('.canvas-tile[data-qf-surface-kind="investigation"] .tile-content-overlay');
	expect(css).toContain(".qf-investigation-surface__error");
});

test("an ok transport envelope still surfaces a Kernel second-Critic refusal as an error", () => {
  const refusal = {
    ok: true,
    result: {
      kind: "refused",
      receipt: { message: "No new independent Critic is available. Make an eligible Critic available, then try again." },
    },
  };
  expect(() => requireSecondCriticAdmission(refusal)).toThrow("No new independent Critic is available. Make an eligible Critic available, then try again.");
  const admission = { kind: "admitted", review_task_id: "review-2", critic_session_id: "critic-2" };
  expect(requireSecondCriticAdmission({ ok: true, result: admission })).toEqual(admission);
});

test("revision transport surfaces Kernel refusal and accepts one Run-backed assignment", () => {
  expect(() => requireRevisionAdmission({ ok: true, result: { kind: "refused", receipt: { message: "A revision is already in progress." } } })).toThrow("A revision is already in progress.");
  expect(requireRevisionAdmission({ ok: true, result: { kind: "admitted", review_task_id: "revision-1", run_id: "run-2" } })).toMatchObject({ review_task_id: "revision-1", run_id: "run-2" });
});

test("current report resolves only its exact hash-bound Task Run Artifact and Evaluation", () => {
  const source_work = { source_task_id: "task-z", hypothesis_id: "hyp-z", run_id: "run-z", result_artifact_id: "artifact-z", executor_session_id: "worker-z" };
  const objects = [
    { type: "mission", id: "mission-1", fields: {} },
    { type: "task", id: "task-a", fields: {} },
    { type: "task", id: "task-z", fields: {} },
    { type: "run", id: "run-a", fields: {} },
    { type: "run", id: "run-z", fields: {} },
    { type: "artifact", id: "artifact-a", fields: {} },
    { type: "artifact", id: "artifact-z", fields: {} },
    { type: "artifact", id: "report-z", fields: { kind: "report" } },
    { type: "evaluation", id: "eval-a", fields: { report_artifact_id: "report-a" } },
    { type: "evaluation", id: "eval-z", fields: { report_artifact_id: "report-z", source_work } },
    { type: "agent_session", id: "worker-z", fields: {} },
  ];
  const links = [
    { kind: "belongs_to", from_id: "task-z", to_id: "mission-1" },
    { kind: "gates", from_id: "eval-z", to_id: "report-z" },
  ];
  const workflow = deriveResearchWorkflow({ root: { type: "mission", id: "mission-1" }, current_report_id: "report-z", report_ids: ["report-z"], objects, links });
  expect([workflow.sourceTask?.id, workflow.run?.id, workflow.rawArtifact?.id, workflow.evaluation?.id]).toEqual(["task-z", "run-z", "artifact-z", "eval-z"]);
  const receipt = contextualInspectReceipt(workflow, workflow.currentReport);
  expect(receipt?.evaluation?.id).toBe("eval-z");
  expect(receipt?.source_work).toEqual(source_work);
  expect(receipt?.revisions).toEqual(["report-z"]);
});

test("a rejected fresh revision stays visible in history while the prior supported report remains current", () => {
  const originalWork = { source_task_id: "task-original", hypothesis_id: "hyp-1", run_id: "run-original", result_artifact_id: "result-original", executor_session_id: "worker-1" };
  const revisionWork = { source_task_id: "task-revision", hypothesis_id: "hyp-1", run_id: "run-revision", result_artifact_id: "result-revision", executor_session_id: "worker-2" };
  const objects = [
    { type: "mission", id: "mission-1", fields: {} },
    { type: "task", id: "task-original", fields: { status: "done" } },
    { type: "task", id: "task-revision", fields: { status: "done", review_kind: "revision", review_source_task_id: "task-original", review_created_at: "2026-09-14T02:00:00.000Z" } },
    { type: "run", id: "run-original", fields: { params: { quote_id: "quote-original" } } },
    { type: "run", id: "run-revision", fields: { params: { quote_id: "quote-revision" } } },
    { type: "quote", id: "quote-original", fields: { coverage: { observed_at: "2026-09-14T01:00:00.000Z" } } },
    { type: "quote", id: "quote-revision", fields: { coverage: { observed_at: "2026-09-14T02:00:00.000Z" } } },
    { type: "artifact", id: "result-original", fields: {} },
    { type: "artifact", id: "result-revision", fields: {} },
    { type: "artifact", id: "report-original", fields: { kind: "report" } },
    { type: "evaluation", id: "eval-original", fields: { verdict: "supports", report_artifact_id: "report-original", source_work: originalWork, rationale: "The original decision is supported." } },
    { type: "evaluation", id: "eval-revision", fields: { verdict: "rejects", source_work: revisionWork, rationale: "The newer quote does not support publication." } },
  ];
  const links = [
    { kind: "belongs_to", from_id: "task-original", to_id: "mission-1" },
    { kind: "belongs_to", from_id: "task-revision", to_id: "mission-1" },
    { kind: "gates", from_id: "eval-original", to_id: "report-original" },
  ];
  const workflow = deriveResearchWorkflow({ root: { type: "mission", id: "mission-1" }, current_report_id: "report-original", report_ids: ["report-original"], objects, links });
  expect(workflow.sourceTask?.id).toBe("task-revision");
  expect(workflow.evaluation?.id).toBe("eval-revision");
  expect(workflow.reportEvaluation?.id).toBe("eval-original");
  expect(workflow.currentReport?.id).toBe("report-original");
  expect(researchDecisionHistory(workflow)).toEqual([
    expect.objectContaining({ version: 1, quoteId: "quote-original", verdict: "supports", reportStatus: "Current report" }),
    expect.objectContaining({ version: 2, quoteId: "quote-revision", verdict: "rejects", reportStatus: "Publication blocked" }),
  ]);
});

test("active Critic remains part of the same investigation and its material attack is readable", () => {
  const objects = [
    { type: "mission", id: "mission-1", fields: {} },
    { type: "task", id: "task-source", fields: { status: "done" } },
    { type: "task", id: "task-review", fields: { status: "open", review_source_task_id: "task-source" } },
    { type: "agent_session", id: "critic-1", fields: { status: "running" } },
  ];
  const links = [
    { kind: "belongs_to", from_id: "task-source", to_id: "mission-1" },
    { kind: "belongs_to", from_id: "task-review", to_id: "mission-1" },
    { kind: "assigned_to", from_id: "task-review", to_id: "critic-1" },
  ];
  const active = deriveResearchWorkflow({ root: { type: "mission", id: "mission-1" }, objects, links });
  expect(active.sourceTask?.id).toBe("task-source");
  expect(active.reviewTask?.id).toBe("task-review");
  expect(active.critic?.id).toBe("critic-1");

  const findings = { type: "artifact", id: "findings-1", fields: { receipt: { preview: JSON.stringify([
    { code: "material_attack", message: "The submission probability is not established." },
  ]) } } };
  const settled = {
    evaluation: { fields: { findings_artifact_id: "findings-1" } },
    byId: new Map([["findings-1", findings]]),
    objects: [findings],
  };
  expect(criticMaterialAttack(settled)).toBe("The submission probability is not established.");
});

test("blocked publication keeps both exact Critic verdicts and strongest findings on the investigation surface", () => {
  const sourceWork = { source_task_id: "task-source", hypothesis_id: "hyp-1", run_id: "run-1", result_artifact_id: "artifact-1", executor_session_id: "worker-1" };
  const findings1 = { type: "artifact", id: "findings-1", fields: { receipt: { preview: JSON.stringify([{ code: "material_attack", message: "The first material attack remains unresolved." }]) } } };
  const findings2 = { type: "artifact", id: "findings-2", fields: { receipt: { preview: JSON.stringify([{ code: "evidence_gap", message: "The second Critic found a missing comparison." }]) } } };
  const objects = [
    { type: "mission", id: "mission-1", fields: {} },
    { type: "task", id: "task-source", fields: { status: "done" } },
    { type: "task", id: "review-1", fields: { status: "done", review_source_task_id: "task-source", review_kind: "review", review_created_at: "2026-09-14T01:00:00.000Z" } },
    { type: "task", id: "review-2", fields: { status: "done", review_source_task_id: "task-source", review_kind: "second_critic", review_triggering_evaluation_id: "eval-1", review_created_at: "2026-09-14T02:00:00.000Z" } },
    { type: "task", id: "review-3", fields: { status: "open", review_source_task_id: "task-source", review_kind: "second_critic", review_triggering_evaluation_id: "eval-2", review_created_at: "2026-09-14T03:00:00.000Z" } },
    { type: "evaluation", id: "eval-1", fields: { verdict: "rejects", review_task_id: "review-1", findings_artifact_id: "findings-1", source_work: sourceWork } },
    { type: "evaluation", id: "eval-2", fields: { verdict: "inconclusive", review_task_id: "review-2", findings_artifact_id: "findings-2", source_work: sourceWork } },
    findings1,
    findings2,
  ];
  const links = [
    { kind: "belongs_to", from_id: "task-source", to_id: "mission-1" },
  ];
  const workflow = deriveResearchWorkflow({ root: { type: "mission", id: "mission-1" }, current_report_id: null, objects, links });
  const blocked = blockedReviewPresentation(workflow);
  expect(workflow.sourceTask?.id).toBe("task-source");
  expect(workflow.reviewTask?.id).toBe("review-3");
  expect(workflow.evaluation?.id).toBe("eval-2");
  expect(blocked).toEqual({
    state: "Publication blocked",
    evaluations: [
      { index: 1, id: "eval-1", verdict: "rejects", attack: "The first material attack remains unresolved." },
      { index: 2, id: "eval-2", verdict: "inconclusive", attack: "The second Critic found a missing comparison." },
    ],
    reviewInProgress: true,
    revisionInProgress: false,
    secondCriticInProgress: true,
  });
  expect(contextualInspectReceipt(workflow, workflow.mission)?.evaluations.map((evaluation) => evaluation.id)).toEqual(["eval-1", "eval-2"]);
  expect(researchDecisionHistory(workflow).map((entry) => entry.verdict)).toEqual(["rejects", "inconclusive"]);
});
