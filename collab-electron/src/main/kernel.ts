/**
 * Sole app module that imports qf-kernel / opens SQLite.
 * All other main-process code goes through getKernelDb() / helpers here.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { dirname, join } from "node:path";
import {
  attachKernel,
  assertDurableOntologyReadReceipt,
  execute,
  getLinks,
  getObject,
  queryObjects,
  resolveArtifactRoot,
  resolveKernelPath,
  resolveSpeciesPackage as resolveSpeciesPackageRow,
  type ExecuteResultFor,
  type KernelDb,
  type GetLinksOptions,
  type LinkRow,
  type TraceContext,
  type TrustedExecutionContext,
} from "qf-kernel/portable";
import { schema } from "qf-kernel-schema";
import { readToolsForObject, type McpToolDefinition } from "qf-kernel-schema/mcp";
import { QF_APP_DIR } from "./paths";
import {
  projectTaskDelegations,
  type TaskDelegationProjection,
} from "./task-delegation-projection";
import { runAtomicResultCommit } from "./atomic-result-commit";

/** Node DatabaseSync adapter with savepoints for Kernel commands inside app transactions. */
export function wrapDatabaseSync(raw: DatabaseSync): KernelDb {
  let transactionDepth = 0;
  return {
    query(sql: string) {
      const stmt = raw.prepare(sql);
      return {
        run: (...params: unknown[]) => stmt.run(...params as Parameters<typeof stmt.run>),
        get: (...params: unknown[]) => stmt.get(...params as Parameters<typeof stmt.get>),
        all: (...params: unknown[]) => stmt.all(...params as Parameters<typeof stmt.all>),
      };
    },
    exec(sql: string) {
      return raw.exec(sql);
    },
    transaction<T>(fn: () => T): () => T {
      return () => {
        const depth = transactionDepth;
        const savepoint = `qf_nested_${depth}`;
        if (depth === 0) raw.exec("BEGIN IMMEDIATE");
        else raw.exec(`SAVEPOINT ${savepoint}`);
        transactionDepth += 1;
        try {
          const result = fn();
          if (depth === 0) raw.exec("COMMIT");
          else raw.exec(`RELEASE SAVEPOINT ${savepoint}`);
          return result;
        } catch (error) {
          if (depth === 0) raw.exec("ROLLBACK");
          else {
            raw.exec(`ROLLBACK TO SAVEPOINT ${savepoint}`);
            raw.exec(`RELEASE SAVEPOINT ${savepoint}`);
          }
          throw error;
        } finally {
          transactionDepth = depth;
        }
      };
    },
  };
}

let kernelDb: KernelDb | null = null;
let kernelPath: string | null = null;

export function openAppKernel(): KernelDb {
  if (kernelDb) return kernelDb;
  // App-local state (canvas, PTY, sockets) lives under QF_APP_DIR.
  // Kernel truth does not — see WO-K1 RULING 1.
  mkdirSync(QF_APP_DIR, { recursive: true });
  const resolved = resolveKernelPath();
  kernelPath = resolved.path;
  // D6: every agent spawn inherits this once the parent process carries it.
  process.env.QF_KERNEL_DB = resolved.path;
  // WO-K3: artifact bytes share the platform root; inject for MCP/child seats.
  process.env.QF_ARTIFACT_ROOT = resolveArtifactRoot().path;
  process.env.QF_PEER_BUS_DB ??= join(QF_APP_DIR, "peer-bus.db");
  const raw = new DatabaseSync(kernelPath);
  kernelDb = attachKernel(wrapDatabaseSync(raw), {
    path: resolved.path,
    provenance: resolved.provenance,
  });
  return kernelDb;
}

/** Resolved artifact store for publish paths (WO-K3). */
export function getArtifactRoot(): string {
  return resolveArtifactRoot().path;
}

export function getKernelDb(): KernelDb {
  if (!kernelDb) throw new Error("kernel not opened");
  return kernelDb;
}

export function getKernelPath(): string {
  if (!kernelPath) throw new Error("kernel not opened");
  return kernelPath;
}

const PEER_BUS_DDL = `
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  from_role TEXT,
  to_role TEXT,
  from_session_id TEXT,
  to_session_id TEXT,
  artifact_id TEXT,
  body TEXT,
  message_kind TEXT DEFAULT 'task',
  reply_to_artifact_id TEXT,
  created_at TEXT,
  delivered INTEGER DEFAULT 0,
  pushed_at TEXT
);`;

export type PeerBusMessage = {
  id: string;
  from_role: string;
  to_role: string;
  from_session_id: string | null;
  to_session_id: string | null;
  artifact_id: string | null;
  body: string;
  message_kind: "task" | "result";
  reply_to_artifact_id: string | null;
  created_at: string;
  delivered: number;
};

function openPeerBus(path: string): DatabaseSync {
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec(PEER_BUS_DDL);
  for (const ddl of [
    "ALTER TABLE messages ADD COLUMN from_session_id TEXT",
    "ALTER TABLE messages ADD COLUMN to_session_id TEXT",
    "ALTER TABLE messages ADD COLUMN message_kind TEXT DEFAULT 'task'",
    "ALTER TABLE messages ADD COLUMN reply_to_artifact_id TEXT",
  ]) {
    try {
      db.exec(ddl);
    } catch {
      // Existing column. SQLite has no ADD COLUMN IF NOT EXISTS.
    }
  }
  return db;
}

/** Notification-only peer transport. Kernel task/result truth already exists. */
export function peerBusNotify(
  path: string,
  input: {
    fromSessionId: string;
    fromRole: string;
    toSessionId: string;
    toRole: string;
    body: string;
    kind: "task" | "result";
    taskId: string;
    artifactId?: string;
  },
): { messageId: string; delivered: boolean } {
  const createdAt = new Date().toISOString();
  const notificationBody = JSON.stringify({
    contract: "qf.peer-notification.v1",
    task_id: input.taskId,
    body: input.body,
  });
  const messageId = crypto.randomUUID();
  const delivered = process.env.QF_PEER_DELIVERY !== "off";
  const db = openPeerBus(path);
  try {
    if (delivered) {
      db.prepare(
        `INSERT INTO messages
          (id, from_role, to_role, from_session_id, to_session_id, artifact_id,
           body, message_kind, reply_to_artifact_id, created_at, delivered)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      ).run(
        messageId,
        input.fromRole,
        input.toRole,
        input.fromSessionId,
        input.toSessionId,
        input.artifactId ?? null,
        notificationBody,
        input.kind,
        null,
        createdAt,
      );
    }
  } finally {
    db.close();
  }
  return { messageId, delivered };
}

export function peerBusReadInbox(
  path: string,
  sessionId: string,
): PeerBusMessage[] {
  const db = openPeerBus(path);
  try {
    const rows = db.prepare(
      `SELECT id, from_role, to_role, from_session_id, to_session_id, artifact_id,
              body, message_kind, reply_to_artifact_id, created_at, delivered
       FROM messages WHERE to_session_id = ? AND delivered = 0 ORDER BY created_at ASC`,
    ).all(sessionId) as PeerBusMessage[];
    for (const row of rows) {
      db.prepare(`UPDATE messages SET delivered = 1 WHERE id = ?`).run(row.id);
    }
    return rows;
  } finally {
    db.close();
  }
}

/** Publish the one canonical result trajectory under the root-owned handoff path. */
function publishCollaborationResult(input: {
  taskId: string;
  workerSessionId: string;
  workerRole: string;
  delegatorSessionId: string;
  delegatorRole: string;
  result: string;
  citedMarketIds: string[];
  readTrajectoryArtifactIds: string[];
}, executeCommand: typeof kernelExecute): { artifactId: string } {
  const createdAt = new Date().toISOString();
  const payload = JSON.stringify({
    contract: "qf.collaboration.v1",
    kind: "result",
    task_id: input.taskId,
    result: input.result,
    cited_market_ids: input.citedMarketIds,
    read_trajectory_artifact_ids: input.readTrajectoryArtifactIds,
    from_session_id: input.workerSessionId,
    from_role: input.workerRole,
    to_session_id: input.delegatorSessionId,
    to_role: input.delegatorRole,
    created_at: createdAt,
    nonce: crypto.randomUUID(),
  }, null, 2);
  const contentHash = createHash("sha256").update(payload).digest("hex");
  const artifactDir = join(getArtifactRoot(), "peer-handoffs");
  mkdirSync(artifactDir, { recursive: true });
  const storagePath = join(artifactDir, `${contentHash}.json`);
  writeFileSync(storagePath, payload, "utf8");
  const artifact = executeCommand(
    "publish_artifact",
    {
      kind: "trajectory",
      storage_ref: storagePath,
      path: storagePath,
      content_hash: contentHash,
      links: [
        { kind: "produces", from_id: input.workerSessionId },
        ...input.readTrajectoryArtifactIds.map((id) => ({
          kind: "derived_from",
          to_id: id,
        })),
      ],
    },
    {
      trace_id: crypto.randomUUID(),
      span_id: crypto.randomUUID(),
      actor_session_id: input.workerSessionId,
    },
  ) as { object_id: string };
  return { artifactId: artifact.object_id };
}

/** Result publication and task completion are one Kernel transaction. */
export function commitCollaborationResult(input: {
  taskId: string;
  workerSessionId: string;
  workerRole: string;
  delegatorSessionId: string;
  delegatorRole: string;
  result: string;
  citedMarketIds: string[];
  readTrajectoryArtifactIds: string[];
}): { artifactId: string; completion: unknown } {
  const context = {
    trace_id: crypto.randomUUID(),
    span_id: crypto.randomUUID(),
    actor_session_id: input.workerSessionId,
  };
  const rawExecute = <C extends string>(
    command: C,
    commandInput: Record<string, unknown>,
    trace: TrustedExecutionContext,
  ) => execute(getKernelDb(), command, commandInput, trace);
  const committed = runAtomicResultCommit(
    getKernelDb(),
    () => publishCollaborationResult(input, rawExecute),
    (published) => rawExecute(
      "complete_task",
      { task_id: input.taskId, result_artifact_id: published.artifactId },
      context,
    ),
  );
  notifyKernelEvents();
  return {
    artifactId: committed.published.artifactId,
    completion: committed.completion,
  };
}

/** App cite validation over a Kernel-issued, worker-owned market.read receipt. */
export function kernelReadMarketTrajectoryResult(
  artifactId: string,
  workerSessionId: string,
): unknown {
  assertDurableOntologyReadReceipt(getKernelDb(), artifactId, workerSessionId);
  const producerLinks = kernelGetLinks(artifactId, {
    kind: "produces",
  }).filter((link) => link.to_id === artifactId);
  if (
    producerLinks.length !== 1 ||
    producerLinks[0]!.from_id !== workerSessionId
  ) {
    throw new Error("read trajectory is not produced by the assigned worker");
  }
  const artifact = kernelGetObject("artifact", artifactId);
  if (!artifact || artifact.kind !== "trajectory") {
    throw new Error("read trajectory artifact is missing");
  }
  const payload = JSON.parse(readFileSync(String(artifact.storage_ref), "utf8")) as {
    contract?: unknown;
    tool?: unknown;
    result?: unknown;
  };
  if (
    payload.contract !== "qf.ontology.v1" ||
    typeof payload.tool !== "string" ||
    kernelCapabilityGroupForTool(payload.tool) !== "market.read"
  ) {
    throw new Error("read trajectory is not a market.read ontology receipt");
  }
  return payload.result;
}

/** Market ids are object ids from schema objects governed by market.read. */
export function kernelMarketObjectExists(id: string): boolean {
  return schema.objects
    .filter((object) => object.capabilityGroup === "market.read")
    .some((object) => kernelGetObject(object.name, id) !== null);
}

/** Read-only canvas projection from durable Kernel task and identity links. */
export function kernelListTaskDelegations(): TaskDelegationProjection[] {
  return projectTaskDelegations({
    listTasks: () => kernelQueryObjects("task", {}, null, 0, "asc"),
    linksFrom: (id, kind) => kernelGetLinks(id, { kind }).filter((link) => link.from_id === id),
    getObject: kernelGetObject,
  });
}

export function kernelExecute<C extends string>(
  command: C,
  input: Record<string, unknown>,
  trace: TrustedExecutionContext,
): ExecuteResultFor<C> {
  const result = execute(getKernelDb(), command, input, trace);
  notifyKernelEvents();
  return result;
}

/** Newest-first Kernel receipt log for the shell ledger (projection only). */
export function kernelListEvents(limit = 40): Array<{
  id: string;
  type: string;
  object_type: string;
  object_id: string;
  created_at: string;
}> {
  const n = Math.max(1, Math.min(200, Math.floor(limit)));
  return getKernelDb()
    .query(
      `SELECT id, type, object_type, object_id, created_at
       FROM events
       ORDER BY created_at DESC, id DESC
       LIMIT ?`,
    )
    .all(n) as Array<{
    id: string;
    type: string;
    object_type: string;
    object_id: string;
    created_at: string;
  }>;
}

type EventsListener = () => void;
const eventsListeners = new Set<EventsListener>();

export function onKernelEvents(listener: EventsListener): () => void {
  eventsListeners.add(listener);
  return () => {
    eventsListeners.delete(listener);
  };
}

function notifyKernelEvents(): void {
  for (const listener of eventsListeners) {
    try {
      listener();
    } catch {
      /* projection listeners must not break writes */
    }
  }
}

/** Unbounded artifact listing for IPC / boot logging (created_at DESC). */
export function kernelListArtifacts(): Record<string, unknown>[] {
  return queryObjects(getKernelDb(), "artifact", undefined, null);
}

export type ResearchLedgerEntry = {
  id: string;
  stage: "question" | "hypothesis" | "dataset" | "run" | "evaluation" | "report";
  title: string;
  status: string;
  detail: string;
  created_at: string;
};

function jsonRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}

/** Consumer projection of the durable research loop. Every row is re-read from Kernel truth. */
export function kernelListResearchLedger(limit = 30): ResearchLedgerEntry[] {
  const entries: ResearchLedgerEntry[] = [];
  for (const row of kernelQueryObjects("mission", {}, limit)) {
    entries.push({
      id: String(row.id), stage: "question", title: String(row.name), status: "submitted",
      detail: String(row.objective), created_at: String(row.created_at),
    });
  }
  for (const row of kernelQueryObjects("hypothesis", {}, limit)) {
    entries.push({
      id: String(row.id), stage: "hypothesis", title: String(row.claim), status: String(row.status),
      detail: String(row.success_criteria), created_at: String(row.created_at),
    });
  }
  for (const row of kernelQueryObjects("dataset", {}, limit)) {
    const coverage = jsonRecord(row.coverage);
    entries.push({
      id: String(row.id), stage: "dataset", title: String(row.kind), status: "sealed",
      detail: `${coverage.sample === true ? "sample · " : ""}${String(coverage.record_count ?? 0)} rows · as of ${String(row.as_of)}`,
      created_at: String(row.created_at),
    });
  }
  for (const row of kernelQueryObjects("run", {}, limit)) {
    const params = jsonRecord(row.params);
    entries.push({
      id: String(row.id), stage: "run", title: "Deterministic run", status: String(row.status),
      detail: String(params.execution_version ?? params.execution_contract ?? row.kind),
      created_at: String(row.created_at),
    });
  }
  for (const row of kernelQueryObjects("evaluation", {}, limit)) {
    const metrics = jsonRecord(row.metrics);
    entries.push({
      id: String(row.id), stage: "evaluation", title: "Independent critic", status: String(row.verdict),
      detail: `confidence ${String(row.confidence)} · ROI ${String(metrics.roi ?? "n/a")}`,
      created_at: String(row.created_at),
    });
  }
  for (const row of kernelQueryObjects("artifact", { kind: "report" }, limit)) {
    entries.push({
      id: String(row.id), stage: "report", title: "Gated research report", status: "published",
      detail: String(row.storage_ref), created_at: String(row.created_at),
    });
  }
  return entries
    .sort((left, right) => right.created_at.localeCompare(left.created_at))
    .slice(0, Math.max(1, Math.min(100, Math.floor(limit))));
}

/** Explicit onboarding sample: immutable, clearly labeled, and never live market truth. */
export function kernelEnsureSampleResearchDataset(
  options: { includeFutureRow?: boolean } = {},
): Record<string, unknown> {
  if (options.includeFutureRow) {
    throw new Error("register_dataset_version observation 2026-08-09T13:00:00.000Z is after as_of 2026-08-09T12:00:00.000Z");
  }
  const observations = [
    { observed_at: "2026-08-09T08:00:00.000Z", label: "sample-a", edge: 0.08, settlement: { outcome: "win", stake: "100", decimal_odds: "2.00", closing_decimal_odds: "1.80" } },
    { observed_at: "2026-08-09T09:00:00.000Z", label: "sample-b", edge: 0.05, settlement: { outcome: "loss", stake: "100", decimal_odds: "2.00", closing_decimal_odds: "1.90" } },
    { observed_at: "2026-08-09T10:00:00.000Z", label: "sample-c", edge: 0.03, settlement: { outcome: "push", stake: "100", decimal_odds: "1.95", closing_decimal_odds: "1.95" } },
  ];
  const payload = `${JSON.stringify({
    contract: "qf.dataset.v1",
    observations,
  }, null, 2)}\n`;
  const hash = createHash("sha256").update(payload).digest("hex");
  const directory = join(getArtifactRoot(), "onboarding");
  const path = join(directory, `${hash}.json`);
  mkdirSync(directory, { recursive: true });
  if (!existsSync(path)) writeFileSync(path, payload, { encoding: "utf8", flag: "wx" });
  const trace = { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() };
  const artifact = kernelExecute("publish_artifact", {
    kind: "result_set", path, storage_ref: path, content_hash: hash,
  }, trace) as { object_id: string };
  return kernelExecute("register_dataset_version", {
    kind: "results",
    artifact_id: artifact.object_id,
    content_hash: artifact.object_id,
    as_of: "2026-08-09T12:00:00.000Z",
    coverage: {
      sample: true,
      label: "QuantFlow guided research sample",
      deterministic_score_field: "edge",
    },
  }, { ...trace, span_id: crypto.randomUUID() }) as unknown as Record<string, unknown>;
}

/** Synthetic Hermes fixture: bounded market context for the app-owned read seam. */
export function kernelEnsureSyntheticMarketFixture(): Record<string, unknown> {
  const marketEventId = "event-hermes-synthetic";
  if (kernelMarketObjectExists(marketEventId)) {
    return { market_event_id: marketEventId, replayed: true };
  }
  const sourcePayload = `${JSON.stringify({ fixture: "wo-v2-2-hermes-market" })}\n`;
  const sourceHash = createHash("sha256").update(sourcePayload).digest("hex");
  const directory = join(getArtifactRoot(), "hermes-synthetic");
  const path = join(directory, `${sourceHash}.json`);
  mkdirSync(directory, { recursive: true });
  if (!existsSync(path)) writeFileSync(path, sourcePayload, { encoding: "utf8", flag: "wx" });
  const trace = { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() };
  const source = kernelExecute("publish_artifact", {
    kind: "result_set",
    path,
    storage_ref: path,
    content_hash: sourceHash,
  }, trace) as { object_id: string };
  kernelExecute("register_venue", {
    venue_id: "venue-hermes-synthetic",
    kind: "sportsbook",
    name: "Hermes synthetic venue",
    source_artifact_id: source.object_id,
    observed_at: "2026-08-09T11:00:00.000Z",
  }, { ...trace, span_id: crypto.randomUUID() });
  kernelExecute("schedule_market_event", {
    market_event_id: marketEventId,
    sport: "football",
    starts_at: "2026-08-11T18:00:00.000Z",
    competition: "Hermes Synthetic League",
    source_artifact_id: source.object_id,
    observed_at: "2026-08-09T11:00:00.000Z",
  }, { ...trace, span_id: crypto.randomUUID() });
  return { market_event_id: marketEventId, source_artifact_id: source.object_id, replayed: false };
}

export function kernelOpenHypothesisForQuestion(question: string, datasetId?: string): string {
  const result = kernelExecute("create_hypothesis", {
    claim: question,
    success_criteria:
      "Kernel-held evidence and, when a settled Dataset exists, deterministic metrics independently reviewed by a critic.",
    sources: datasetId ? [datasetId] : [],
  }, { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() }) as { object_id: string };
  return result.object_id;
}

const researchEvidenceByRunId = new Map<string, string>();

export function kernelRunGuidedResearch(
  executorSessionId: string,
  hypothesisId: string,
  evidenceArtifactId: string,
): {
  hypothesisId: string;
  runId: string;
  artifactId: string;
  metrics: Record<string, unknown>;
} | null {
  const hypothesis = kernelGetObject("hypothesis", hypothesisId);
  if (!hypothesis || String(hypothesis.status) !== "open") return null;
  let sources: unknown = [];
  try { sources = JSON.parse(String(hypothesis?.sources ?? "[]")); } catch { sources = []; }
  const datasetId = Array.isArray(sources)
    ? sources.find((source): source is string => typeof source === "string" && source.startsWith("dataset:"))
    : undefined;
  const dataset = datasetId ? kernelGetObject("dataset", datasetId) : null;
  if (dataset && typeof jsonRecord(dataset.coverage).deterministic_score_field !== "string") return null;
  if (!hypothesis || !dataset) return null;
  const scoreField = String(jsonRecord(dataset.coverage).deterministic_score_field);
  const run = kernelExecute("execute_deterministic_run", {
    run_id: `run-${crypto.randomUUID()}`,
    dataset_id: String(dataset.id),
    strategy_spec: {
      contract: "qf.strategy.v1", version: 1, stake_model: "flat", score_field: scoreField,
    },
    params: { limit: 1 },
  }, {
    trace_id: crypto.randomUUID(), span_id: crypto.randomUUID(), actor_session_id: executorSessionId,
  }) as { object_id: string; state: Record<string, unknown> };
  researchEvidenceByRunId.set(run.object_id, evidenceArtifactId);
  return {
    hypothesisId: String(hypothesis.id),
    runId: run.object_id,
    artifactId: String(run.state.result_artifact_id),
    metrics: jsonRecord(run.state.metrics),
  };
}

export function kernelFinalizeResearchEvaluation(evaluationId: string): {
  reportArtifactId: string | null;
  hypothesisId: string;
  status: string;
} {
  const evaluation = kernelGetObject("evaluation", evaluationId);
  if (!evaluation) throw new Error(`Evaluation not found: ${evaluationId}`);
  const lineage = kernelGetLinks(evaluationId, { kind: "evaluated_by" });
  const hypothesisId = lineage.find((link) =>
    link.to_id === evaluationId && kernelGetObject("hypothesis", link.from_id)
  )?.from_id;
  const runId = lineage.find((link) =>
    link.to_id === evaluationId && kernelGetObject("run", link.from_id)
  )?.from_id;
  if (!hypothesisId || !runId) throw new Error("Evaluation lacks exact hypothesis and Run lineage");
  const verdict = String(evaluation.verdict);
  const status = verdict === "supports" ? "supported" : verdict === "rejects" ? "rejected" : "inconclusive";
  kernelExecute("resolve_hypothesis", {
    hypothesis_id: hypothesisId, evaluation_id: evaluationId, status,
  }, { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() });
  if (verdict !== "supports") return { reportArtifactId: null, hypothesisId, status };

  const run = kernelGetObject("run", runId);
  const runParams = jsonRecord(run?.params);
  const resultArtifactId = typeof runParams.result_artifact_id === "string"
    ? runParams.result_artifact_id
    : null;
  const datasetArtifactId = typeof runParams.dataset_artifact_id === "string"
    ? runParams.dataset_artifact_id
    : null;
  const artifactReceipt = (artifactId: string | null): Record<string, unknown> | null => {
    if (!artifactId) return null;
    const artifact = kernelGetObject("artifact", artifactId);
    if (!artifact) return null;
    return {
      id: artifactId,
      content_hash: String(artifact.content_hash),
    };
  };
  const evidenceArtifactId = researchEvidenceByRunId.get(runId) ?? null;
  if (!evidenceArtifactId) throw new Error(`Run lacks exact worker evidence binding: ${runId}`);
  const marketReadTrajectoryArtifacts = kernelGetLinks(evidenceArtifactId, { kind: "derived_from" })
        .map((link) => artifactReceipt(link.to_id))
        .filter((value): value is Record<string, unknown> => value !== null);
  const payload = `${JSON.stringify({
    contract: "qf.research.report.v1",
    evaluation_id: evaluationId,
    hypothesis: kernelGetObject("hypothesis", hypothesisId),
    run,
    evaluation,
    evidence: {
      market_read_trajectory_artifacts: marketReadTrajectoryArtifacts,
      dataset_artifact: artifactReceipt(datasetArtifactId),
      result_artifact: artifactReceipt(resultArtifactId),
    },
  }, null, 2)}\n`;
  const hash = createHash("sha256").update(payload).digest("hex");
  const directory = join(getArtifactRoot(), "reports");
  const path = join(directory, `${hash}.json`);
  mkdirSync(directory, { recursive: true });
  if (!existsSync(path)) writeFileSync(path, payload, { encoding: "utf8", flag: "wx" });
  const report = kernelExecute("publish_artifact", {
    kind: "report", path, storage_ref: path, content_hash: hash, evaluation_id: evaluationId,
  }, { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() }) as { object_id: string };
  return { reportArtifactId: report.object_id, hypothesisId, status };
}

/** Unbounded agent_session listing for IPC / reconciliation (created_at DESC). */
export function kernelListAgentSessions(): Record<string, unknown>[] {
  return queryObjects(getKernelDb(), "agent_session", undefined, null);
}

/** Unbounded agent_definition listing for dock registry (created_at ASC). */
export function kernelListAgentDefinitions(): Record<string, unknown>[] {
  return queryObjects(
    getKernelDb(),
    "agent_definition",
    undefined,
    null,
    0,
    undefined,
    "asc",
  );
}

/** Generated ontology read-tool surface (names + schemas) from the live schema. */
export function kernelListOntologyReadTools(): McpToolDefinition[] {
  const tools: McpToolDefinition[] = [];
  for (const object of schema.objects) {
    tools.push(...readToolsForObject(object));
  }
  for (const action of schema.actions) {
    if (action.capabilityGroup) {
      tools.push({
        name: `qf_${action.name}`,
        description: action.description,
        inputSchema: { type: "object", properties: {}, additionalProperties: true },
      });
    }
  }
  return tools;
}

/** Capability group for a generated tool name, or null if untagged/unknown. */
export function kernelCapabilityGroupForTool(
  name: string,
): "market.read" | "desk.orchestrate" | "research.evaluate" | null {
  const read = kernelParseOntologyReadTool(name);
  if (read) {
    const object = schema.objects.find((entry) => entry.name === read.objectName);
    return object?.capabilityGroup ?? null;
  }
  const actionMatch = /^qf_(.+)$/.exec(name);
  if (!actionMatch) return null;
  const action = schema.actions.find((entry) => entry.name === actionMatch[1]);
  return action?.capabilityGroup ?? null;
}

/** Filter generated tools to those whose group is in the granted set. */
export function kernelListOntologyToolsForGroups(
  groups: ReadonlyArray<"market.read" | "desk.orchestrate" | "research.evaluate">,
): McpToolDefinition[] {
  const allowed = new Set(groups);
  return kernelListOntologyReadTools().filter((tool) => {
    const group = kernelCapabilityGroupForTool(tool.name);
    return group !== null && allowed.has(group);
  });
}

/** Resolve capability_groups JSON from the session's spawned_from definition. */
export function kernelCapabilityGroupsForSession(
  sessionId: string,
): Array<"market.read" | "desk.orchestrate" | "research.evaluate"> {
  const link = kernelGetLinks(sessionId, { kind: "spawned_from" })[0];
  if (!link?.to_id) return [];
  const definition = kernelGetObject("agent_definition", link.to_id);
  if (!definition) return [];
  const raw = definition.capability_groups;
  let parsed: unknown = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  const out: Array<"market.read" | "desk.orchestrate" | "research.evaluate"> = [];
  for (const group of parsed) {
    if (
      group === "market.read" ||
      group === "desk.orchestrate" ||
      group === "research.evaluate"
    ) out.push(group);
  }
  return out;
}

/** True when name is a generated read tool for a known schema object. */
export function kernelParseOntologyReadTool(
  name: string,
): { objectName: string; op: "get" | "query" | "links" } | null {
  const match = /^qf_(.+)_(get|query|links)$/.exec(name);
  if (!match) return null;
  const objectName = match[1]!;
  const op = match[2] as "get" | "query" | "links";
  if (!schema.objects.some((object) => object.name === objectName)) return null;
  return { objectName, op };
}

/** True when name is a generated action tool (`qf_<action>`). */
export function kernelParseOntologyActionTool(name: string): string | null {
  const match = /^qf_(.+)$/.exec(name);
  if (!match) return null;
  const actionName = match[1]!;
  if (kernelParseOntologyReadTool(name)) return null;
  if (!schema.actions.some((action) => action.name === actionName)) return null;
  return actionName;
}

/** Fetch one ontology row by type and id. */
export function kernelGetObject(
  type: string,
  id: string,
): Record<string, unknown> | null {
  return getObject(getKernelDb(), type, id);
}

/** List ontology rows with optional filters through the shared Kernel handle. */
export function kernelQueryObjects(
  type: string,
  filters?: Record<string, unknown>,
  limit: number | null | undefined = 100,
  offset = 0,
  order: "asc" | "desc" = "desc",
): Record<string, unknown>[] {
  return queryObjects(getKernelDb(), type, filters, limit, offset, undefined, order);
}

/** Read links touching one ontology object through the shared Kernel handle. */
export function kernelGetLinks(
  id: string,
  options?: GetLinksOptions,
): LinkRow[] {
  return getLinks(getKernelDb(), id, options);
}

/** Resolve species name → package path against the open Kernel. */
export function resolveSpeciesPackage(
  species: string,
  appRoot: string,
): { row: Record<string, unknown>; packagePath: string } {
  return resolveSpeciesPackageRow(getKernelDb(), species, appRoot);
}

export type { TraceContext, TrustedExecutionContext };
