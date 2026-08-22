import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { EVENTS_DDL } from "./db.ts";
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
const REPO_ROOT = join(import.meta.dir, "../../..");
const PRE_D1_SQL = join(
  REPO_ROOT,
  "qf-kernel-schema/compat/pre-d1-profile-identity.sql",
);
const POST_COMPOSITION_UPGRADES = [
  "0001-agent-profile-identity.sql",
  "0002-market-ingest.sql",
  "0003-market-context.sql",
  "0004-capability-grants.sql",
  "0005-task-status.sql",
  "0006-connection-actions.sql",
  "0007-task-delegation.sql",
  "0008-deterministic-execution.sql",
  "0009-independent-critic.sql",
  "0010-task-composition.sql",
] as const;
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

type Retained0010Shape = "display_name" | "cancelled";

function createR10FixtureWithOnly0010Shape(
  retainedShape: Retained0010Shape,
): Database {
  const raw = new Database(":memory:");
  raw.exec(readFileSync(migrationSqlPath(), "utf8").toString());
  raw.query(
    `DELETE FROM schema_meta WHERE type_name IN ('performed_by', 'reassign_task', 'cancel_task')`,
  ).run();
  raw.query(
    `UPDATE schema_meta SET description = ? WHERE type_name = 'record_evaluation'`,
  ).run("Record a structured evaluation verdict with metrics against a hypothesis lineage.");
  const linksSql = (raw
    .query(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'links'`)
    .get() as { sql: string }).sql
    .replace("CREATE TABLE links", "CREATE TABLE links_previous")
    .replace(/,\s*'performed_by'/, "");
  raw.exec(linksSql);
  raw.exec(
    `INSERT INTO links_previous SELECT * FROM links;
     DROP TABLE links;
     ALTER TABLE links_previous RENAME TO links;`,
  );
  if (retainedShape === "display_name") {
    raw.exec(
      `CREATE TABLE task__historical (
         id TEXT PRIMARY KEY NOT NULL,
         created_at TEXT NOT NULL,
         title TEXT NOT NULL,
         description TEXT NOT NULL,
         status TEXT NOT NULL,
         CHECK (status IN ('open', 'done'))
       );
       INSERT INTO task__historical (id, created_at, title, description, status)
         SELECT id, created_at, title, description, status FROM task;
       DROP TABLE task;
       ALTER TABLE task__historical RENAME TO task;`,
    );
  } else {
    raw.exec(
      `CREATE TABLE agent_definition__historical (
         id TEXT PRIMARY KEY NOT NULL,
         created_at TEXT NOT NULL,
         name TEXT NOT NULL,
         role TEXT NOT NULL,
         package_ref TEXT NOT NULL,
         system_prompt_ref TEXT,
         runtime_profile TEXT,
         capability_groups TEXT NOT NULL
       );
       INSERT INTO agent_definition__historical (
         id, created_at, name, role, package_ref, system_prompt_ref,
         runtime_profile, capability_groups
       ) SELECT id, created_at, name, role, package_ref, system_prompt_ref,
         runtime_profile, capability_groups FROM agent_definition;
       DROP TABLE agent_definition;
       ALTER TABLE agent_definition__historical RENAME TO agent_definition;`,
    );
  }
  return raw;
}

function createPinnedPostCompositionPredecessor(): Database {
  const raw = new Database(":memory:");
  raw.exec(readFileSync(PRE_D1_SQL, "utf8"));
  for (const upgrade of POST_COMPOSITION_UPGRADES) {
    raw.exec(
      readFileSync(join(REPO_ROOT, "qf-kernel-schema/golden/upgrades", upgrade), "utf8"),
    );
  }
  raw.exec(EVENTS_DDL);
  raw.exec(`
    INSERT INTO artifact (id, created_at, kind, content_hash, storage_ref)
    VALUES ('upgrade-artifact', '2026-08-22T00:00:00.000Z', 'result_set', 'upgrade-hash', 'memory://upgrade-artifact');
    INSERT INTO task (id, created_at, title, description, status)
    VALUES ('upgrade-task', '2026-08-22T00:00:00.000Z', 'Upgrade task', 'Preserve this task', 'open');
    INSERT INTO links (id, kind, from_id, to_id, created_at)
    VALUES ('upgrade-link', 'produces', 'upgrade-run', 'upgrade-artifact', '2026-08-22T00:00:00.000Z');
    INSERT INTO events (id, type, object_type, object_id, payload, trace_id, created_at)
    VALUES ('upgrade-event', 'artifact.published', 'artifact', 'upgrade-artifact', '{"preserve":true}', 'upgrade-trace', '2026-08-22T00:00:00.000Z');
  `);
  return raw;
}

function fileSha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
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
      `DELETE FROM schema_meta WHERE type_name IN ('performed_by', 'reassign_task', 'cancel_task')`,
    ).run();
    raw.query(
      `UPDATE schema_meta SET description = ? WHERE type_name = 'record_evaluation'`,
    ).run("Record a structured evaluation verdict with metrics against a hypothesis lineage.");
    const linksSql = (raw
      .query(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'links'`)
      .get() as { sql: string }).sql
      .replace("CREATE TABLE links", "CREATE TABLE links_previous")
      .replace(/,\s*'performed_by'/, "");
    raw.exec(linksSql);
    raw.exec(
      `INSERT INTO links_previous SELECT * FROM links;
       DROP TABLE links;
       ALTER TABLE links_previous RENAME TO links;`,
    );
    raw.exec(
      `CREATE TABLE agent_definition__historical (
         id TEXT PRIMARY KEY NOT NULL,
         created_at TEXT NOT NULL,
         name TEXT NOT NULL,
         role TEXT NOT NULL,
         package_ref TEXT NOT NULL,
         system_prompt_ref TEXT,
         runtime_profile TEXT,
         capability_groups TEXT NOT NULL
       );
       INSERT INTO agent_definition__historical (
         id, created_at, name, role, package_ref, system_prompt_ref,
         runtime_profile, capability_groups
       ) SELECT id, created_at, name, role, package_ref, system_prompt_ref,
         runtime_profile, capability_groups FROM agent_definition;
       DROP TABLE agent_definition;
       ALTER TABLE agent_definition__historical RENAME TO agent_definition;
       CREATE TABLE task__historical (
         id TEXT PRIMARY KEY NOT NULL,
         created_at TEXT NOT NULL,
         title TEXT NOT NULL,
         description TEXT NOT NULL,
         status TEXT NOT NULL,
         CHECK (status IN ('open', 'done'))
       );
       INSERT INTO task__historical (id, created_at, title, description, status)
         SELECT id, created_at, title, description, status FROM task;
       DROP TABLE task;
       ALTER TABLE task__historical RENAME TO task;`,
    );
    expect(classifyKernelShape(raw as unknown as KernelDb)).toBe(
      "deterministic_execution",
    );
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
    expect(
      upgraded.query(`SELECT kind FROM schema_meta WHERE type_name = ?`).get("performed_by"),
    ).toEqual({ kind: "link" });
    raw.close();
  });

  test("upgrades the pinned post-composition predecessor and preserves receipts", () => {
    const raw = createPinnedPostCompositionPredecessor();
    try {
      expect(classifyKernelShape(raw as unknown as KernelDb)).toBe("task_steering");
      const before = {
        artifacts: (raw.query("SELECT COUNT(*) AS n FROM artifact").get() as { n: number }).n,
        tasks: (raw.query("SELECT COUNT(*) AS n FROM task").get() as { n: number }).n,
        links: (raw.query("SELECT COUNT(*) AS n FROM links").get() as { n: number }).n,
        events: eventCount(raw as unknown as KernelDb),
      };

      const upgraded = attachKernel(raw as unknown as KernelDb);

      expect(classifyKernelShape(upgraded)).toBe("current");
      expect((upgraded.query("SELECT COUNT(*) AS n FROM artifact").get() as { n: number }).n).toBeGreaterThanOrEqual(before.artifacts);
      expect((upgraded.query("SELECT COUNT(*) AS n FROM task").get() as { n: number }).n).toBeGreaterThanOrEqual(before.tasks);
      expect((upgraded.query("SELECT COUNT(*) AS n FROM links").get() as { n: number }).n).toBeGreaterThanOrEqual(before.links);
      expect(eventCount(upgraded)).toBeGreaterThanOrEqual(before.events);
      expect(
        upgraded.query("SELECT id, content_hash FROM artifact WHERE id = 'upgrade-artifact'").get(),
      ).toEqual({ id: "upgrade-artifact", content_hash: "upgrade-hash" });
      expect(
        upgraded.query("SELECT id, title, description, status FROM task WHERE id = 'upgrade-task'").get(),
      ).toEqual({ id: "upgrade-task", title: "Upgrade task", description: "Preserve this task", status: "open" });
      expect(
        upgraded.query("SELECT id, kind, from_id, to_id FROM links WHERE id = 'upgrade-link'").get(),
      ).toEqual({ id: "upgrade-link", kind: "produces", from_id: "upgrade-run", to_id: "upgrade-artifact" });
      expect(
        upgraded.query("SELECT id, payload, trace_id FROM events WHERE id = 'upgrade-event'").get(),
      ).toEqual({ id: "upgrade-event", payload: '{"preserve":true}', trace_id: "upgrade-trace" });
    } finally {
      raw.close();
    }
  });

  test("rejects one extra or missing governed predecessor shape without mutation", () => {
    const cases = [
      {
        name: "extra",
        mutate: (raw: Database) => raw.exec(
          "INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('belongs_to', 'link', 'experimental', 'extra');",
        ),
      },
      {
        name: "missing",
        mutate: (raw: Database) => raw.exec(
          "DELETE FROM schema_meta WHERE type_name = 'delegated_by';",
        ),
      },
    ] as const;

    for (const { name, mutate } of cases) {
      const dir = mkdtempSync(join(tmpdir(), `qf-r16-${name}-`));
      const path = join(dir, "kernel.db");
      const seeded = new Database(path);
      try {
        seeded.exec(readFileSync(PRE_D1_SQL, "utf8"));
        for (const upgrade of POST_COMPOSITION_UPGRADES) {
          seeded.exec(
            readFileSync(join(REPO_ROOT, "qf-kernel-schema/golden/upgrades", upgrade), "utf8"),
          );
        }
        seeded.exec(EVENTS_DDL);
        mutate(seeded);
      } finally {
        seeded.close();
      }

      const before = fileSha256(path);
      const rejected = new Database(path);
      try {
        expect(classifyKernelShape(rejected as unknown as KernelDb)).toBe("partial");
        expect(() => attachKernel(rejected as unknown as KernelDb)).toThrow(
          /database shape is not an exact supported predecessor or current authority/,
        );
      } finally {
        rejected.close();
      }
      expect(fileSha256(path), `${name} partial rejection mutated the database`).toBe(before);
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("classifies a fixture retaining only the 0010 display_name shape as partial", () => {
    const raw = createR10FixtureWithOnly0010Shape("display_name");
    try {
      expect(classifyKernelShape(raw as unknown as KernelDb)).toBe("partial");
    } finally {
      raw.close();
    }
  });

  test("classifies a fixture retaining only the 0010 cancelled status as partial", () => {
    const raw = createR10FixtureWithOnly0010Shape("cancelled");
    try {
      expect(classifyKernelShape(raw as unknown as KernelDb)).toBe("partial");
    } finally {
      raw.close();
    }
  });
});
