import { afterEach, describe, expect, test } from "bun:test";
import { rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  closeKernel,
  eventCount,
  execute,
  openKernel,
  type KernelDb,
} from "./index.ts";

const trace = { trace_id: "r10-trace", span_id: "r10-span" };
const files: string[] = [];
let db: KernelDb;

afterEach(() => {
  if (db) closeKernel(db);
  for (const file of files.splice(0)) rmSync(file, { force: true });
});

function publishDatasetArtifact(observations: Array<Record<string, unknown>>) {
  const bytes = new TextEncoder().encode(
    JSON.stringify({ contract: "qf.dataset.v1", observations }),
  );
  const path = join(tmpdir(), `qf-r10-${crypto.randomUUID()}.json`);
  writeFileSync(path, bytes);
  files.push(path);
  const artifact = execute(
    db,
    "publish_artifact",
    { kind: "result_set", bytes, storage_ref: path },
    trace,
  );
  return { artifact, path };
}

describe("R10 point-in-time Dataset integrity", () => {
  test("registers immutable bytes and computes the time fence", () => {
    db = openKernel(":memory:");
    const { artifact } = publishDatasetArtifact([
      { observed_at: "2026-08-09T10:00:00.000Z", value: 1 },
      { observed_at: "2026-08-09T11:00:00.000Z", value: 2 },
    ]);
    const input = {
      kind: "odds_history" as const,
      artifact_id: artifact.object_id,
      content_hash: artifact.object_id,
      as_of: "2026-08-09T12:00:00.000Z",
      coverage: { sport: "football" },
    };

    const dataset = execute(db, "register_dataset_version", input, trace);
    const afterFirst = eventCount(db);
    execute(db, "register_dataset_version", input, trace);

    expect(dataset.object_id).toBe(`dataset:${artifact.object_id}`);
    expect(eventCount(db)).toBe(afterFirst);
    expect(
      db.query(`SELECT to_id FROM links WHERE kind = 'derived_from' AND from_id = ?`).get(
        dataset.object_id,
      ),
    ).toEqual({ to_id: artifact.object_id });
    const row = db.query(`SELECT coverage FROM dataset WHERE id = ?`).get(dataset.object_id) as {
      coverage: string;
    };
    expect(JSON.parse(row.coverage)).toEqual({
      sport: "football",
      record_count: 2,
      max_observed_at: "2026-08-09T11:00:00.000Z",
    });
  });

  test("rejects a declared hash that is not the Artifact identity", () => {
    db = openKernel(":memory:");
    const { artifact } = publishDatasetArtifact([
      { observed_at: "2026-08-09T10:00:00.000Z" },
    ]);
    const before = eventCount(db);

    expect(() =>
      execute(
        db,
        "register_dataset_version",
        {
          kind: "odds_history",
          artifact_id: artifact.object_id,
          content_hash: "a".repeat(64),
          as_of: "2026-08-09T12:00:00.000Z",
          coverage: {},
        },
        trace,
      ),
    ).toThrow(/must match the immutable Artifact identity/);
    expect(eventCount(db)).toBe(before);
  });

  test("rejects observations after the declared as_of fence", () => {
    db = openKernel(":memory:");
    const { artifact } = publishDatasetArtifact([
      { observed_at: "2026-08-09T12:00:01.000Z" },
    ]);
    const before = eventCount(db);

    expect(() =>
      execute(
        db,
        "register_dataset_version",
        {
          kind: "odds_history",
          artifact_id: artifact.object_id,
          content_hash: artifact.object_id,
          as_of: "2026-08-09T12:00:00.000Z",
          coverage: {},
        },
        trace,
      ),
    ).toThrow(/is after as_of/);
    expect(eventCount(db)).toBe(before);
    expect(db.query(`SELECT COUNT(*) AS count FROM dataset`).get()).toEqual({ count: 0 });
  });

  test("rejects durable bytes changed after Artifact publication", () => {
    db = openKernel(":memory:");
    const { artifact, path } = publishDatasetArtifact([
      { observed_at: "2026-08-09T10:00:00.000Z" },
    ]);
    writeFileSync(path, "tampered");
    const before = eventCount(db);

    expect(() =>
      execute(
        db,
        "register_dataset_version",
        {
          kind: "odds_history",
          artifact_id: artifact.object_id,
          content_hash: artifact.object_id,
          as_of: "2026-08-09T12:00:00.000Z",
          coverage: {},
        },
        trace,
      ),
    ).toThrow(/durable Artifact bytes do not match/);
    expect(eventCount(db)).toBe(before);
  });
});
