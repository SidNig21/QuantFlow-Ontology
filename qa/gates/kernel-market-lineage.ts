/**
 * R6 — market answer lineage validity (assert cited ids exist; empty/fabricated fail).
 * Lineage uses derived_from to prior artifacts (schema); market object ids are cited in payload
 * and must match seeded Kernel rows that were notionally read.
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  closeKernel,
  bindSourceWork,
  contentHash,
  execute,
  getLinks,
  getObject,
  openKernel,
  recordGovernedToolReceipt,
  requestGovernedReview,
} from "qf-kernel";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function trace() {
  return { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() };
}

function createSession(
  db: ReturnType<typeof openKernel>,
  id: string,
  role: string,
  capabilityGroups: string[],
): void {
  const definitionName = role === "critic" ? "hermes-critic" : `${id}-definition`;
  execute(
    db,
    "register_agent_definition",
    {
      name: definitionName,
      role,
      package_ref: "species/hermes/packed/hermes.aospkg",
      runtime_profile: "default",
      system_prompt_ref: `prompts/${role}.md`,
      capability_groups: capabilityGroups,
    },
    trace(),
  );
  execute(
    db,
    "create_agent_session",
    { session_id: id, agent_definition_id: definitionName, label: id },
    trace(),
  );
  execute(db, "start_agent_session", { session_id: id }, trace());
}

function assertValidAnswer(
  db: ReturnType<typeof openKernel>,
  artifactId: string,
  seededMarketIds: Set<string>,
  readArtifactIds: Set<string>,
): void {
  const lineage = getLinks(db, artifactId, { kind: "derived_from" });
  if (lineage.length === 0) throw new Error("empty lineage");
  for (const link of lineage) {
    const id = link.to_id;
    if (typeof id !== "string" || !readArtifactIds.has(id)) {
      throw new Error(`fabricated or unread lineage target: ${id}`);
    }
    if (!getObject(db, "artifact", id)) {
      throw new Error(`lineage target missing: ${id}`);
    }
  }
  const artifact = getObject(db, "artifact", artifactId);
  assert(artifact, "answer artifact missing");
  const storage = String(artifact.storage_ref ?? "");
  const body = JSON.parse(readFileSync(storage, "utf8")) as { cites?: string[] };
  const cites = Array.isArray(body.cites) ? body.cites : [];
  if (cites.length === 0) throw new Error("empty cites");
  for (const cite of cites) {
    if (!seededMarketIds.has(cite)) throw new Error(`fabricated cite: ${cite}`);
    if (!getObject(db, "venue", cite)) throw new Error(`cited market id missing: ${cite}`);
  }
}

export async function runKernelMarketLineageGateBody(): Promise<{ ok: boolean }> {
  const temp = mkdtempSync(join(tmpdir(), "qf-market-lineage-"));
  const dbPath = join(temp, "kernel.db");
  const artifactRoot = join(temp, "artifacts");
  const previousArtifactRoot = process.env.QF_ARTIFACT_ROOT;
  try {
    mkdirSync(artifactRoot, { recursive: true });
    process.env.QF_ARTIFACT_ROOT = artifactRoot;
    const db = openKernel(dbPath, { create: true });

    const sourcePath = join(artifactRoot, "seed-source.json");
    const sourceBytes = Buffer.from(JSON.stringify({ seed: true }));
    writeFileSync(sourcePath, sourceBytes);
    const source = execute(
      db,
      "publish_artifact",
      {
        kind: "result_set",
        storage_ref: sourcePath,
        path: sourcePath,
        content_hash: contentHash(new Uint8Array(sourceBytes)),
      },
      trace(),
    ) as { object_id: string };

    execute(
      db,
      "register_venue",
      {
        venue_id: "venue-r6",
        kind: "sportsbook",
        name: "R6 Venue",
        source_artifact_id: source.object_id,
        observed_at: "2026-08-03T12:00:00.000Z",
      },
      trace(),
    );

    // Trajectory of a market read (stand-in for gateway trajectory artifact).
    const readPath = join(artifactRoot, "read-trajectory.json");
    const readBytes = Buffer.from(JSON.stringify({
      contract: "qf.ontology.v1",
      tool: "qf_venue_get",
      arguments: { id: "venue-r6" },
      result: { id: "venue-r6" },
      session_id: "executor-r12",
      role: "worker",
      created_at: "2026-08-30T00:00:00.000Z",
      nonce: "r12-market-lineage-read",
    }));
    writeFileSync(readPath, readBytes);
    const readArt = execute(
      db,
      "publish_artifact",
      {
        kind: "trajectory",
        storage_ref: readPath,
        path: readPath,
        content_hash: contentHash(new Uint8Array(readBytes)),
      },
      trace(),
    ) as { object_id: string };

    const seeded = new Set(["venue-r6"]);
    const readArts = new Set([readArt.object_id]);

    // Build the accepted R12 lineage through Kernel actions: an executor runs a
    // deterministic result, and a separate running critic records the Evaluation.
    createSession(db, "executor-r12", "orchestrator", ["desk.orchestrate"]);
    createSession(db, "critic-r12", "critic", ["research.evaluate"]);
    const mission = execute(db, "create_mission", {
      mission_id: "mission-r12-market-lineage",
      name: "R12 market lineage",
      objective: "Validate the exact deterministic market-lineage result.",
    }, trace()) as { object_id: string };
    const workerReadBytes = new TextEncoder().encode(JSON.stringify({
      contract: "qf.ontology.v1",
      tool: "qf_venue_get",
      arguments: { id: "venue-r6" },
      result: { id: "venue-r6" },
      session_id: "executor-r12",
      role: "worker",
      created_at: "2026-08-30T00:00:01.000Z",
      nonce: "r12-market-lineage-worker-read",
    }));
    const workerReadPath = join(artifactRoot, "worker-read.json");
    writeFileSync(workerReadPath, workerReadBytes);
    const workerRead = execute(db, "publish_artifact", {
      kind: "trajectory",
      bytes: workerReadBytes,
      storage_ref: workerReadPath,
      links: [{ kind: "produces", from_id: "executor-r12" }],
    }, {
      ...trace(),
      actor_session_id: "executor-r12",
      ontology_read_tool: "qf_venue_get",
    } as never) as { object_id: string };
    const hypothesis = execute(
      db,
      "create_hypothesis",
      {
        claim: "The seeded market strategy has positive return.",
        success_criteria:
          "The deterministic metrics are positive and an independent critic supports them.",
      },
      trace(),
    ) as { object_id: string };
    const datasetBytes = new TextEncoder().encode(
      JSON.stringify({
        contract: "qf.dataset.v1",
        observations: [
          {
            id: "settled-win-r12-market-lineage",
            observed_at: "2026-08-09T10:00:00.000Z",
            edge: 1,
            settlement: {
              outcome: "win",
              stake: "100.000000",
              decimal_odds: "2.000000",
              closing_decimal_odds: "1.600000",
            },
          },
        ],
      }),
    );
    const datasetPath = join(artifactRoot, "dataset.json");
    writeFileSync(datasetPath, datasetBytes);
    const datasetArtifact = execute(
      db,
      "publish_artifact",
      { kind: "result_set", bytes: datasetBytes, storage_ref: datasetPath },
      trace(),
    ) as { object_id: string };
    const dataset = execute(
      db,
      "register_dataset_version",
      {
        kind: "results",
        artifact_id: datasetArtifact.object_id,
        content_hash: datasetArtifact.object_id,
        as_of: "2026-08-09T11:00:00.000Z",
        coverage: { fixture: "r12-market-lineage" },
      },
      trace(),
    ) as { object_id: string };
    const deterministicRun = execute(
      db,
      "execute_deterministic_run",
      {
        run_id: "run-r12-market-lineage",
        dataset_id: dataset.object_id,
        hypothesis_id: hypothesis.object_id,
        strategy_spec: {
          contract: "qf.strategy.v1",
          version: 1,
          stake_model: "flat",
          score_field: "edge",
        },
        params: { limit: 1 },
      },
      { ...trace(), actor_session_id: "executor-r12" },
    ) as { object_id: string; state: Record<string, unknown> };
    const resultArtifactId = deterministicRun.state.result_artifact_id;
    assert(
      typeof resultArtifactId === "string",
      "deterministic run did not return a result artifact",
    );
    const workerResultBytes = new TextEncoder().encode(JSON.stringify({
      contract: "qf.collaboration.v1",
      kind: "result",
      task_id: "task-r12-market-lineage",
      from_session_id: "executor-r12",
      result_artifact_id: resultArtifactId,
    }));
    const workerResultPath = join(artifactRoot, "worker-result.json");
    writeFileSync(workerResultPath, workerResultBytes);
    const workerResult = execute(db, "publish_artifact", {
      kind: "trajectory",
      bytes: workerResultBytes,
      storage_ref: workerResultPath,
      links: [
        { kind: "produces", from_id: "executor-r12" },
        { kind: "derived_from", to_id: workerRead.object_id },
      ],
    }, { ...trace(), actor_session_id: "executor-r12" }) as { object_id: string };
    const sourceTask = execute(db, "create_task", {
      task_id: "task-r12-market-lineage",
      title: "Review the deterministic market-lineage result",
      description: "Bind the exact run result to an independent governed review.",
      assignee_session_id: "executor-r12",
    }, {
      ...trace(),
      actor_session_id: "executor-r12",
      mission_id: mission.object_id,
    }) as { object_id: string };
    const sourceWork = {
      source_task_id: sourceTask.object_id,
      hypothesis_id: hypothesis.object_id,
      run_id: deterministicRun.object_id,
      result_artifact_id: workerResult.object_id,
      executor_session_id: "executor-r12",
    };
    bindSourceWork(db, sourceWork, trace());
    execute(db, "complete_task", {
      task_id: sourceTask.object_id,
      result_artifact_id: workerResult.object_id,
    }, { ...trace(), actor_session_id: "executor-r12" });
    const admission = requestGovernedReview(
      db,
      sourceTask.object_id,
      "r12-market-lineage-attempt",
      "critic-r12",
      trace(),
    );
    assert(admission.kind === "admitted", `review admission refused: ${JSON.stringify(admission)}`);
    const reviewTaskId = String(admission.review_task_id);
    execute(db, "governed_review_task", {
      operation: "deliver",
      review_task_id: reviewTaskId,
      outcome: "delivered",
    }, trace());
    const receipts = [
      ["qf_hypothesis_get", { id: hypothesis.object_id }],
      ["qf_run_get", { id: deterministicRun.object_id }],
      ["qf_artifact_get", { id: workerResult.object_id }],
      ["qf_record_evaluation", { verdict: "supports" }],
    ] as const;
    for (const [index, [toolName, args]] of receipts.entries()) {
      recordGovernedToolReceipt(db, {
        invocation_id: `r12-market-lineage-receipt-${index + 1}`,
        session_id: "critic-r12",
        task_id: reviewTaskId,
        tool_name: toolName,
        arguments: args,
        result: { ok: true },
        broker_sequence: index + 1,
      }, trace());
    }
    const evaluation = execute(
      db,
      "record_evaluation",
      {
        hypothesis_id: hypothesis.object_id,
        run_id: deterministicRun.object_id,
        artifact_id: workerResult.object_id,
        review_task_id: reviewTaskId,
        source_work: sourceWork,
        broker_invocation_id: "r12-market-lineage-receipt-4",
        verdict: "supports",
        rubric: {
          faithfulness: 0.9,
          answer_relevancy: 0.9,
          context_precision: 0.9,
          context_recall: 0.9,
        },
        confidence: 0.9,
        rationale: "The recorded metrics and market lineage support the fixture claim.",
        findings: [{
          code: "R12_MARKET_LINEAGE",
          severity: "info",
          message: "Verified the deterministic result bytes, metric definitions, and positive ROI.",
          evidence_refs: [workerResult.object_id],
        }],
      },
      { ...trace(), actor_session_id: "critic-r12" },
    ) as { object_id: string };
    const evaluationId = evaluation.object_id;
    assert(
      (getObject(db, "evaluation", evaluationId) as { verdict?: string } | null)?.verdict ===
        "supports",
      "record_evaluation did not create a supporting Evaluation",
    );

    // Empty lineage → red
    const emptyPath = join(artifactRoot, "empty.json");
    const emptyBytes = Buffer.from(JSON.stringify({ cites: ["venue-r6"] }));
    writeFileSync(emptyPath, emptyBytes);
    const empty = execute(
      db,
      "publish_artifact",
      {
        kind: "report",
        storage_ref: emptyPath,
        path: emptyPath,
        content_hash: contentHash(new Uint8Array(emptyBytes)),
        evaluation_id: evaluationId,
      },
      trace(),
    ) as { object_id: string };
    let emptyBait = "";
    try {
      assertValidAnswer(db, empty.object_id, seeded, readArts);
    } catch (error) {
      emptyBait = error instanceof Error ? error.message : String(error);
    }
    assert(emptyBait.includes("empty lineage"), `empty bait: ${emptyBait}`);
    console.log("kernel-market-lineage: FALSIFY RED empty lineage");

    // Fabricated cite → red
    const fakePath = join(artifactRoot, "fake.json");
    const fakeBytes = Buffer.from(JSON.stringify({ cites: ["fabricated-venue"] }));
    writeFileSync(fakePath, fakeBytes);
    const fake = execute(
      db,
      "publish_artifact",
      {
        kind: "report",
        storage_ref: fakePath,
        path: fakePath,
        content_hash: contentHash(new Uint8Array(fakeBytes)),
        links: [{ kind: "derived_from", to_id: readArt.object_id }],
        evaluation_id: evaluationId,
      },
      trace(),
    ) as { object_id: string };
    let fakeBait = "";
    try {
      assertValidAnswer(db, fake.object_id, seeded, readArts);
    } catch (error) {
      fakeBait = error instanceof Error ? error.message : String(error);
    }
    assert(fakeBait.includes("fabricated"), `fake bait: ${fakeBait}`);
    console.log("kernel-market-lineage: FALSIFY RED fabricated cite");

    // Green — distinct payload bytes from baits
    const answerPath = join(artifactRoot, "answer.json");
    const answerBytes = Buffer.from(
      JSON.stringify({ cites: ["venue-r6"], note: "lineage-green" }),
    );
    writeFileSync(answerPath, answerBytes);
    const answer = execute(
      db,
      "publish_artifact",
      {
        kind: "report",
        storage_ref: answerPath,
        path: answerPath,
        content_hash: contentHash(new Uint8Array(answerBytes)),
        links: [{ kind: "derived_from", to_id: readArt.object_id }],
        evaluation_id: evaluationId,
      },
      trace(),
    ) as { object_id: string };
    assertValidAnswer(db, answer.object_id, seeded, readArts);
    const gates = getLinks(db, answer.object_id, { kind: "gates" });
    assert(
      gates.length === 1 && gates[0]!.from_id === evaluationId,
      "report gate does not point to the returned Evaluation",
    );

    closeKernel(db);
    console.log("kernel-market-lineage: PASS");
    return { ok: true };
  } catch (error) {
    console.error(
      `kernel-market-lineage: FAIL ${error instanceof Error ? error.message : String(error)}`,
    );
    return { ok: false };
  } finally {
    if (previousArtifactRoot === undefined) delete process.env.QF_ARTIFACT_ROOT;
    else process.env.QF_ARTIFACT_ROOT = previousArtifactRoot;
    try {
      rmSync(temp, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}

if (import.meta.main) {
  const { ok } = await runKernelMarketLineageGateBody();
  process.exit(ok ? 0 : 1);
}
