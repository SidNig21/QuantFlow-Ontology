import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const root = mkdtempSync(join(tmpdir(), "qf-r13-consumer-"));
process.env.QF_APP_DIR = join(root, "app");
process.env.QF_APP_ROOT = root;
process.env.QF_KERNEL_DB = join(root, "kernel.db");
process.env.QF_ARTIFACT_ROOT = join(root, "artifacts");
mkdirSync(process.env.QF_ARTIFACT_ROOT, { recursive: true });

const kernel = await import("./kernel");
kernel.openAppKernel();

function session(id: string, definition: string, role: string, groups: string[]) {
  kernel.kernelExecute("register_agent_definition", {
    name: definition, role, package_ref: "sample", runtime_profile: "default",
    capability_groups: groups,
  }, { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() });
  kernel.kernelExecute("create_agent_session", {
    session_id: id, agent_definition_id: definition,
  }, { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() });
  kernel.kernelExecute("start_agent_session", { session_id: id }, {
    trace_id: crypto.randomUUID(), span_id: crypto.randomUUID(),
  });
}

session("executor", "test-orchestrator", "orchestrator", ["desk.orchestrate"]);
session("critic", "test-critic", "critic", ["research.evaluate"]);
const dataset = kernel.kernelEnsureSampleResearchDataset() as { object_id: string };
const hypothesisId = kernel.kernelOpenHypothesisForQuestion(
  "Did the highest guided-sample edge produce positive ROI?",
  dataset.object_id,
);
kernel.kernelExecute("create_mission", {
  mission_id: "mission-r13", name: "Founder question",
  objective: "Did the highest guided-sample edge produce positive ROI?",
}, { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() });
const run = kernel.kernelRunGuidedResearch("executor");
assert.equal(run?.hypothesisId, hypothesisId);
assert.equal(run?.metrics.roi, "1.000000");

const evaluation = kernel.kernelExecute("record_evaluation", {
  hypothesis_id: hypothesisId,
  run_id: run!.runId,
  artifact_id: run!.artifactId,
  verdict: "supports",
  confidence: 0.95,
  rationale: "The highest scored settled row has positive ROI.",
  findings: "Re-read the immutable result and verified the hand-defined metrics.",
}, {
  trace_id: crypto.randomUUID(), span_id: crypto.randomUUID(), actor_session_id: "critic",
}) as { object_id: string };
const final = kernel.kernelFinalizeResearchEvaluation(evaluation.object_id);
assert.equal(final.status, "supported");
assert.match(final.reportArtifactId ?? "", /^[a-f0-9]{64}$/);

const stages = new Set(kernel.kernelListResearchLedger().map((entry) => entry.stage));
assert.deepEqual(stages, new Set([
  "question", "hypothesis", "dataset", "run", "evaluation", "report",
]));
console.log("R13 consumer workflow: PASS (question → report, Kernel recovery projection complete)");
