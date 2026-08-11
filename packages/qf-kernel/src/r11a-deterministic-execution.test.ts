import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  closeKernel,
  attachKernel,
  classifyKernelShape,
  eventCount,
  execute,
  migrationSqlPath,
  openKernel,
  type KernelDb,
} from "./index.ts";

const trace = { trace_id: "r11a-trace", span_id: "r11a-span" };
const priorArtifactRoot = process.env.QF_ARTIFACT_ROOT;
let db: KernelDb | undefined;
let artifactRoot: string | undefined;

afterEach(() => {
  if (db) closeKernel(db);
  db = undefined;
  if (artifactRoot) rmSync(artifactRoot, { recursive: true, force: true });
  artifactRoot = undefined;
  if (priorArtifactRoot === undefined) delete process.env.QF_ARTIFACT_ROOT;
  else process.env.QF_ARTIFACT_ROOT = priorArtifactRoot;
});

function createDataset(): string {
  artifactRoot = mkdtempSync(join(tmpdir(), "qf-r11a-"));
  process.env.QF_ARTIFACT_ROOT = artifactRoot;
  db = openKernel(":memory:");
  const bytes = new TextEncoder().encode(
    JSON.stringify({
      contract: "qf.dataset.v1",
      observations: [
        { id: "a", observed_at: "2026-08-09T09:00:00.000Z", edge: 0.03 },
        { id: "b", observed_at: "2026-08-09T10:00:00.000Z", edge: 0.08 },
        { id: "c", observed_at: "2026-08-09T11:00:00.000Z", edge: 0.05 },
      ],
    }),
  );
  const path = join(artifactRoot, "dataset.json");
  writeFileSync(path, bytes);
  const artifact = execute(
    db,
    "publish_artifact",
    { kind: "result_set", bytes, storage_ref: path },
    trace,
  );
  const dataset = execute(
    db,
    "register_dataset_version",
    {
      kind: "features",
      artifact_id: artifact.object_id,
      content_hash: artifact.object_id,
      as_of: "2026-08-09T12:00:00.000Z",
      coverage: { fixture: "r11a-hand-check" },
    },
    trace,
  );
  return dataset.object_id;
}

function executeRun(
  runId: string,
  datasetId: string,
  params: { limit: number; minimum_score?: number },
  repeatOfRunId?: string,
) {
  return execute(
    db!,
    "execute_deterministic_run",
    {
      run_id: runId,
      dataset_id: datasetId,
      strategy_spec: {
        contract: "qf.strategy.v1",
        version: 1,
        stake_model: "flat",
        score_field: "edge",
      },
      params,
      ...(repeatOfRunId ? { repeat_of_run_id: repeatOfRunId } : {}),
    },
    trace,
  );
}

describe("R11a deterministic local execution", () => {
  test("repeats exact inputs byte-for-byte with complete Kernel provenance", () => {
    const datasetId = createDataset();
    const first = executeRun("run-r11a-a", datasetId, { limit: 2 });
    const repeated = executeRun(
      "run-r11a-b",
      datasetId,
      { limit: 2 },
      "run-r11a-a",
    );
    const changed = executeRun("run-r11a-c", datasetId, { limit: 1 });

    expect(first.to).toBe("succeeded");
    expect(repeated.to).toBe("succeeded");
    expect(repeated.state.result_artifact_id).toBe(first.state.result_artifact_id);
    expect(changed.state.result_artifact_id).not.toBe(first.state.result_artifact_id);

    const resultArtifactId = String(first.state.result_artifact_id);
    const resultRow = db!
      .query(`SELECT storage_ref FROM artifact WHERE id = ?`)
      .get(resultArtifactId) as { storage_ref: string };
    const resultBytes = readFileSync(resultRow.storage_ref);
    const payload = JSON.parse(resultBytes.toString("utf8")) as {
      contract: string;
      execution_version: string;
      selected: Array<{ id: string }>;
      eligible_count: number;
    };
    expect(payload).toMatchObject({
      contract: "qf.execution.result.v1",
      execution_version: "qf-deterministic-v1",
      eligible_count: 3,
    });
    expect(payload.selected.map((row) => row.id)).toEqual(["b", "c"]);

    for (const runId of ["run-r11a-a", "run-r11a-b"]) {
      const links = db!
        .query(
          `SELECT kind, to_id FROM links WHERE from_id = ? ORDER BY kind, to_id`,
        )
        .all(runId) as Array<{ kind: string; to_id: string }>;
      expect(links.map((link) => link.kind)).toEqual([
        "executes_in",
        "produces",
        "uses",
        "uses",
      ]);
      expect(links).toContainEqual({ kind: "uses", to_id: datasetId });
      expect(links).toContainEqual({ kind: "produces", to_id: resultArtifactId });
      expect(links).toContainEqual({
        kind: "executes_in",
        to_id: "execution_environment:qf-deterministic-v1",
      });
    }

    expect(
      db!.query(`SELECT status, kind FROM run WHERE id = ?`).get("run-r11a-a"),
    ).toEqual({ status: "succeeded", kind: "backtest" });
    expect(
      db!
        .query(`SELECT COUNT(*) AS count FROM artifact WHERE id = ?`)
        .get(resultArtifactId),
    ).toEqual({ count: 1 });
  });

  test("rejects false repeat claims and changed durable result bytes", () => {
    const datasetId = createDataset();
    const first = executeRun("run-r11a-a", datasetId, { limit: 2 });
    const beforeMismatch = eventCount(db!);

    expect(() =>
      executeRun("run-r11a-mismatch", datasetId, { limit: 1 }, "run-r11a-a"),
    ).toThrow(/input manifest differs/);
    expect(eventCount(db!)).toBe(beforeMismatch);
    expect(
      db!.query(`SELECT COUNT(*) AS count FROM run WHERE id = ?`).get(
        "run-r11a-mismatch",
      ),
    ).toEqual({ count: 0 });

    const resultArtifactId = String(first.state.result_artifact_id);
    const resultRow = db!
      .query(`SELECT storage_ref FROM artifact WHERE id = ?`)
      .get(resultArtifactId) as { storage_ref: string };
    const original = readFileSync(resultRow.storage_ref);
    writeFileSync(resultRow.storage_ref, "tampered");
    const beforeTamper = eventCount(db!);

    expect(() =>
      executeRun("run-r11a-tampered", datasetId, { limit: 2 }, "run-r11a-a"),
    ).toThrow(/bytes changed after publication/);
    expect(eventCount(db!)).toBe(beforeTamper);
    expect(
      db!.query(`SELECT COUNT(*) AS count FROM run WHERE id = ?`).get(
        "run-r11a-tampered",
      ),
    ).toEqual({ count: 0 });
    writeFileSync(resultRow.storage_ref, original);
  });

  test("upgrades an existing R10 database in place", () => {
    const raw = new Database(":memory:");
    raw.exec(readFileSync(migrationSqlPath(), "utf8").toString());
    raw.query(
      `DELETE FROM schema_meta WHERE type_name = 'execute_deterministic_run'`,
    ).run();
    expect(classifyKernelShape(raw as unknown as KernelDb)).toBe("task_delegation");

    const upgraded = attachKernel(raw as unknown as KernelDb);
    expect(classifyKernelShape(upgraded)).toBe("current");
    expect(
      upgraded
        .query(`SELECT kind FROM schema_meta WHERE type_name = ?`)
        .get("execute_deterministic_run"),
    ).toEqual({ kind: "action" });
    raw.close();
  });
});
