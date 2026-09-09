import { expect, test } from "bun:test";
import { hasLiveDirectorSurface, oneCanvasSurfaceObjects, readyDirectorDefinitions } from "./one-canvas.js";
import { contextualInspectReceipt, criticMaterialAttack, deriveResearchWorkflow } from "./research-workflow.js";

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
  expect(html).toContain('aria-hidden="true" focusable="false"');
  expect(renderer).not.toContain("createFlowCubeWatermark");
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
	const css = await Bun.file(new URL("./shell.css", import.meta.url)).text();
	expect(oneCanvas).toContain('dom.idSpan.textContent = "DIRECTOR"');
	expect(oneCanvas).toContain('summary.textContent = "Technical details"');
	expect(oneCanvas).toContain("analysisErrors.set(mission.id, message)");
	expect(oneCanvas).toContain('appendText(surface, "qf-investigation-surface__error", priorError)');
	expect(oneCanvas).toContain("runtimeFailed");
	expect(oneCanvas).toContain("retry_task_id");
	expect(oneCanvas).toContain("Your saved evidence is intact; retry after service returns.");
	expect(css).toContain('.canvas-tile[data-qf-surface-kind="investigation"] .tile-content-overlay');
	expect(css).toContain(".qf-investigation-surface__error");
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
