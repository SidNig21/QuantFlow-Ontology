/**
 * Sole app module that imports qf-kernel / opens SQLite.
 * All other main-process code goes through getKernelDb() / helpers here.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import { createRequire } from "node:module";
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
  type KernelPathProvenance,
  type KernelDb,
  type GetLinksOptions,
  type LinkRow,
  type TraceContext,
  type TrustedExecutionContext,
  type GovernedReviewAdmission,
  type GovernedToolReceiptInput,
  freezeSourceWork,
  governedReviewProjection,
  readGovernedPublicationForEvaluation,
  resolveGovernedWorkerEvidence,
  type SourceWork,
} from "qf-kernel/portable";
import { schema } from "qf-kernel-schema";
import {
  actionToolForAction,
  readToolsForObject,
  type McpToolDefinition,
} from "qf-kernel-schema/mcp";
import { QF_APP_DIR } from "./paths";
import {
  projectTaskDelegations,
  projectTaskAssignments,
  type TaskDelegationProjection,
  type TaskAssignmentProjection,
  type TaskHistoryFact,
} from "./task-delegation-projection";
import { runAtomicResultCommit } from "./atomic-result-commit";
import {
  getResearchWorldProjection,
  type ResearchWorldProjectionResult,
  type ResearchWorldRequest,
} from "./research-world-projection";

type DatabaseStatement = {
  run(...params: unknown[]): unknown;
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown;
  finalize?: () => void;
};

type DatabaseSyncLike = {
  prepare(sql: string): DatabaseStatement;
  exec(sql: string): unknown;
  close(throwOnError?: boolean): void;
};

type AppKernelAdapter = KernelDb & { closeStatements(): void };
type DiagnosticRecord = Record<string, unknown>;

const requireRuntimeModule = createRequire(import.meta.url);

const kernelModuleInstanceId = randomUUID();
const rawHandleIds = new WeakMap<object, number>();
const adapterIds = new WeakMap<object, number>();
let nextRawHandleId = 0;
let nextAdapterId = 0;
let kernelGeneration = 0;

function diagnosticEnabled(): boolean {
  return process.env.QF_HERMES_SYNTHETIC_TEST === "1";
}

function diagnosticReceiptPath(): string | null {
  if (!diagnosticEnabled()) return null;
  const path = process.env.QF_G10_PROJECTION_DIAGNOSTIC_RECEIPT;
  return path && path.length > 0 ? path : null;
}

function diagnosticValue(value: unknown): DiagnosticRecord {
  const runtimeType = value === null ? "null" : typeof value;
  return {
    runtime_type: runtimeType,
    json: JSON.stringify(value) ?? "undefined",
  };
}

function diagnosticObjectId(value: object, ids: WeakMap<object, number>): number {
  const existing = ids.get(value);
  if (existing !== undefined) return existing;
  const id = ids === rawHandleIds ? ++nextRawHandleId : ++nextAdapterId;
  ids.set(value, id);
  return id;
}

function diagnosticRows(raw: DatabaseSyncLike, sql: string): Array<DiagnosticRecord> {
  const statement = raw.prepare(sql);
  try {
    const rows = statement.all() as Array<Record<string, unknown>>;
    return rows.map((row) => Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key, diagnosticValue(value)]),
    ));
  } finally {
    statement.finalize?.();
  }
}

function diagnosticSourceRows(raw: DatabaseSyncLike): Array<DiagnosticRecord> {
  const statement = raw.prepare(
    "SELECT source_task_id, source_work FROM qf_review_source_work ORDER BY created_at ASC, source_task_id ASC",
  );
  try {
    const rows = statement.all() as Array<{ source_task_id?: unknown; source_work?: unknown }>;
    return rows.map((row) => {
      let parsed: Record<string, unknown> | null = null;
      if (typeof row.source_work === "string") {
        try {
          const value = JSON.parse(row.source_work) as unknown;
          if (value && typeof value === "object" && !Array.isArray(value)) parsed = value as Record<string, unknown>;
        } catch {
          // Keep the raw value in the receipt; parsing is not part of the product path.
        }
      }
      const fields = ["source_task_id", "hypothesis_id", "run_id", "result_artifact_id", "executor_session_id"] as const;
      const reconstructed = parsed
        ? fields.map((field) => String(parsed[field] ?? "")).join("\u0000")
        : null;
      return {
        source_task_id: diagnosticValue(row.source_task_id),
        source_work: diagnosticValue(row.source_work),
        source_work_fields: parsed
          ? Object.fromEntries(fields.map((field) => [field, diagnosticValue(parsed[field])]))
          : null,
        reconstructed_source_work_key: reconstructed === null ? null : diagnosticValue(reconstructed),
      };
    });
  } finally {
    statement.finalize?.();
  }
}

function diagnosticKernelHandleSnapshot(): DiagnosticRecord {
  const raw = kernelRaw;
  const adapter = kernelAdapter;
  let publicationRows: Array<DiagnosticRecord> = [];
  let sourceRows: Array<DiagnosticRecord> = [];
  const errors: Array<DiagnosticRecord> = [];
  if (raw) {
    try {
      publicationRows = diagnosticRows(raw, "SELECT source_work_key, report_artifact_id, authority_key, is_current FROM qf_review_publication ORDER BY created_at ASC, source_work_key ASC");
    } catch (error) {
      errors.push({ table: "qf_review_publication", error: diagnosticValue(error instanceof Error ? error.message : error) });
    }
    try {
      sourceRows = diagnosticSourceRows(raw);
    } catch (error) {
      errors.push({ table: "qf_review_source_work", error: diagnosticValue(error instanceof Error ? error.message : error) });
    }
  }
  return {
    module_instance_id: kernelModuleInstanceId,
    kernel_generation: kernelGeneration,
    validated_kernel_path: kernelPath,
    raw_handle: raw ? { id: diagnosticObjectId(raw as object, rawHandleIds), active: true } : { id: null, active: false },
    adapter: adapter ? { id: diagnosticObjectId(adapter as object, adapterIds), active: true } : { id: null, active: false },
    qf_review_publication: publicationRows,
    qf_research_source_work: sourceRows,
    errors,
  };
}

function appendProjectionDiagnostic(receipt: DiagnosticRecord): void {
  const path = diagnosticReceiptPath();
  if (!path) return;
  try {
    appendFileSync(path, `${JSON.stringify(receipt)}\n`, "utf8");
  } catch {
    // Diagnostics must never change the production projection result.
  }
}

function openDatabaseSync(path: string): DatabaseSyncLike {
  if (process.versions.bun) {
    const { Database } = requireRuntimeModule("bun:sqlite") as { Database: new (path: string) => DatabaseSyncLike };
    return new Database(path);
  }
  const { DatabaseSync } = requireRuntimeModule("node:sqlite") as { DatabaseSync: new (path: string) => DatabaseSyncLike };
  return new DatabaseSync(path);
}

/** Node DatabaseSync adapter with savepoints for Kernel commands inside app transactions. */
export function wrapDatabaseSync(raw: DatabaseSyncLike): KernelDb & { closeStatements(): void } {
  let transactionDepth = 0;
  const statements = new Set<DatabaseStatement>();
  const prepare = (sql: string): DatabaseStatement => {
    const statement = raw.prepare(sql);
    statements.add(statement);
    return statement;
  };
  return {
    query(sql: string) {
      const stmt = prepare(sql);
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
    closeStatements() {
      for (const statement of statements) statement.finalize?.();
      statements.clear();
    },
  };
}

let kernelDb: KernelDb | null = null;
let kernelPath: string | null = null;
let kernelProvenance: KernelPathProvenance | null = null;
let kernelRaw: DatabaseSyncLike | null = null;
let kernelAdapter: AppKernelAdapter | null = null;

function attachAppKernelAtPath(path: string, provenance: KernelPathProvenance): KernelDb {
  const raw = openDatabaseSync(path);
  const adapter = wrapDatabaseSync(raw);
  try {
    const attached = attachKernel(adapter, {
      path,
      provenance,
    });
    kernelRaw = raw;
    kernelAdapter = adapter;
    kernelDb = attached;
    kernelGeneration += 1;
    return attached;
  } catch (error) {
    try {
      adapter.closeStatements();
      raw.close(true);
    } catch {
      // Preserve the attach/open failure as the causal error.
    }
    throw error;
  }
}

function closeAppKernelHandle(raw: DatabaseSyncLike | null, adapter: (KernelDb & { closeStatements(): void }) | null): void {
  if (!raw) return;
  try {
    adapter?.closeStatements();
  } finally {
    raw.close(true);
  }
}

export function openAppKernel(): KernelDb {
  if (kernelDb) return kernelDb;
  // App-local state (canvas, PTY, sockets) lives under QF_APP_DIR.
  // Kernel truth does not — see WO-K1 RULING 1.
  mkdirSync(QF_APP_DIR, { recursive: true });
  if (!kernelPath || !kernelProvenance) {
    const resolved = resolveKernelPath();
    kernelPath = resolved.path;
    kernelProvenance = resolved.provenance;
  }
  const path = kernelPath;
  const provenance = kernelProvenance;
  if (!path || !provenance) throw new Error("kernel path is not initialized");
  // D6: every agent spawn inherits this once the parent process carries it.
  process.env.QF_KERNEL_DB = path;
  // WO-K3: artifact bytes share the platform root; inject for MCP/child seats.
  process.env.QF_ARTIFACT_ROOT = resolveArtifactRoot().path;
  process.env.QF_PEER_BUS_DB ??= join(QF_APP_DIR, "peer-bus.db");
  return attachAppKernelAtPath(path, provenance);
}

/** Reopen the app's validated Kernel path so Main reads the current durable state. */
export function refreshAppKernel(): KernelDb {
  if (!kernelPath || !kernelProvenance) return openAppKernel();
  const previousRaw = kernelRaw;
  const previousAdapter = kernelAdapter;
  kernelRaw = null;
  kernelAdapter = null;
  kernelDb = null;
  closeAppKernelHandle(previousRaw, previousAdapter);
  return attachAppKernelAtPath(kernelPath, kernelProvenance);
}

/** Close the app-owned raw SQLite handle exactly once. */
export function closeAppKernel(): void {
  const previousRaw = kernelRaw;
  const previousAdapter = kernelAdapter;
  kernelRaw = null;
  kernelAdapter = null;
  kernelDb = null;
  closeAppKernelHandle(previousRaw, previousAdapter);
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

/** Main-owned immutable research-world read; renderer and preload never open SQLite. */
export function kernelGetResearchWorldProjection(request: ResearchWorldRequest): ResearchWorldProjectionResult {
  const diagnostic = diagnosticReceiptPath() !== null;
  const invocationId = diagnostic ? randomUUID() : null;
  const beforeRefresh = diagnostic ? diagnosticKernelHandleSnapshot() : null;
  let afterRefresh: DiagnosticRecord | null = null;
  try {
    refreshAppKernel();
    afterRefresh = diagnostic ? diagnosticKernelHandleSnapshot() : null;
  } catch (error) {
    if (diagnostic) {
      appendProjectionDiagnostic({
        kind: "kernelGetResearchWorldProjection",
        invocation_id: invocationId,
        request,
        before_refresh: beforeRefresh,
        after_refresh: afterRefresh,
        refresh_error: diagnosticValue(error instanceof Error ? error.message : error),
      });
    }
    throw error;
  }
  const result = getResearchWorldProjection(getKernelDb(), request);
  if (diagnostic) {
    appendProjectionDiagnostic({
      kind: "kernelGetResearchWorldProjection",
      invocation_id: invocationId,
      request,
      before_refresh: beforeRefresh,
      after_refresh: afterRefresh,
      active_adapter_result: diagnosticValue(result),
    });
  }
  return result;
}

export function kernelListStrategyVersions(): Array<Record<string, unknown>> {
  const db = getKernelDb();
  const rows = db.query("SELECT id, spec_ref, version, stake_model FROM strategy ORDER BY version ASC, id ASC").all() as Array<Record<string, unknown>>;
  const result: Array<Record<string, unknown>> = [];
  for (const row of rows) {
    const artifact = db.query("SELECT storage_ref, content_hash FROM artifact WHERE id = ?").get(row.spec_ref) as { storage_ref: string; content_hash: string } | null;
    if (!artifact) continue;
    try {
      const spec = JSON.parse(readFileSync(artifact.storage_ref, "utf8")) as Record<string, unknown>;
      if (typeof spec.family !== "string" || typeof spec.probability_field !== "string") continue;
      result.push({ strategy_id: row.id, family: spec.family, version: row.version, content_hash: artifact.content_hash, stake_model: row.stake_model, score_field: spec.score_field, probability_field: spec.probability_field, label: `${spec.family} v${row.version} · ${String(row.id).slice(-8)}` });
    } catch { /* unavailable specs are intentionally not selectable */ }
  }
  return result.sort((a, b) => String(a.family).localeCompare(String(b.family)) || Number(a.version) - Number(b.version));
}

export type GuidedTechniqueDescriptor = {
  strategy_id: string;
  family: "guided-settled-results";
  version: 1;
  content_hash: string;
};

const GUIDED_TECHNIQUE_SPEC = {
  contract: "qf.strategy.v1",
  family: "guided-settled-results",
  version: 1,
  stake_model: "flat",
  score_field: "edge",
  probability_field: "/edge",
} as const;
const GUIDED_TECHNIQUE_RUN_ID = "run:guided-settled-results:v1:registration";

function guidedTechniqueRefusal(): never {
  throw new Error("TECHNIQUE COVERAGE REFUSED");
}

/**
 * Resolve the one named Technique used by the explicit guided sample action.
 * The selector is a projection; this helper is the only Main seam allowed to
 * register the guided Technique, and registration remains the Kernel action.
 */
export function kernelEnsureGuidedTechnique(datasetId: string): GuidedTechniqueDescriptor {
  if (typeof datasetId !== "string" || datasetId.trim() !== datasetId || datasetId.length === 0) {
    return guidedTechniqueRefusal();
  }
  const db = getKernelDb();
  const expectedBytes = new TextEncoder().encode(JSON.stringify(GUIDED_TECHNIQUE_SPEC));
  const expectedHash = createHash("sha256").update(expectedBytes).digest("hex");
  const expectedStrategyId = `strategy:${GUIDED_TECHNIQUE_SPEC.family}:v1:${expectedHash.slice(0, 16)}`;

  const matching: GuidedTechniqueDescriptor[] = [];
  const rows = db.query("SELECT id, spec_ref, version, stake_model FROM strategy").all() as Array<Record<string, unknown>>;
  for (const row of rows) {
    const artifact = db.query("SELECT id, kind, content_hash, storage_ref FROM artifact WHERE id = ?")
      .get(row.spec_ref) as { id?: string; kind?: string; content_hash?: string; storage_ref?: string } | null;
    if (!artifact?.storage_ref) continue;
    let spec: Record<string, unknown>;
    let bytes: Buffer;
    try {
      bytes = readFileSync(artifact.storage_ref);
      spec = JSON.parse(bytes.toString("utf8")) as Record<string, unknown>;
    } catch {
      // Unavailable bytes are only relevant when this row claims the guided
      // family; unrelated legacy rows remain listable as before.
      if (String(row.id).startsWith(`strategy:${GUIDED_TECHNIQUE_SPEC.family}:v1:`)) return guidedTechniqueRefusal();
      continue;
    }
    if (spec.family !== GUIDED_TECHNIQUE_SPEC.family || Number(spec.version) !== GUIDED_TECHNIQUE_SPEC.version) continue;
    const exact = JSON.stringify(spec) === JSON.stringify(GUIDED_TECHNIQUE_SPEC)
      && bytes.equals(Buffer.from(expectedBytes))
      && artifact.id === expectedHash
      && artifact.kind === "strategy_spec"
      && artifact.content_hash === expectedHash
      && row.id === expectedStrategyId
      && Number(row.version) === 1
      && row.stake_model === "flat";
    if (!exact) return guidedTechniqueRefusal();
    matching.push({ strategy_id: String(row.id), family: GUIDED_TECHNIQUE_SPEC.family, version: 1, content_hash: expectedHash });
  }
  if (matching.length > 1) return guidedTechniqueRefusal();

  const registrationRun = db.query("SELECT id FROM run WHERE id = ?").get(GUIDED_TECHNIQUE_RUN_ID) as { id?: string } | null;
  if (matching.length === 1) {
    if (!registrationRun) return guidedTechniqueRefusal();
    const uses = db.query("SELECT kind, to_id FROM links WHERE from_id = ? AND kind = 'uses' ORDER BY to_id")
      .all(GUIDED_TECHNIQUE_RUN_ID) as Array<{ kind: string; to_id: string }>;
    if (uses.length !== 2 || !uses.some((link) => link.to_id === datasetId) || !uses.some((link) => link.to_id === matching[0].strategy_id)) {
      return guidedTechniqueRefusal();
    }
    return matching[0];
  }
  if (registrationRun) return guidedTechniqueRefusal();

  kernelExecute("execute_deterministic_run", {
    run_id: GUIDED_TECHNIQUE_RUN_ID,
    dataset_id: datasetId,
    strategy_spec: GUIDED_TECHNIQUE_SPEC,
    params: { limit: 1 },
  }, { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() });

  const registered = kernelEnsureGuidedTechnique(datasetId);
  if (registered.content_hash !== expectedHash || registered.strategy_id !== expectedStrategyId) return guidedTechniqueRefusal();
  return registered;
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

function openPeerBus(path: string): DatabaseSyncLike {
  mkdirSync(dirname(path), { recursive: true });
  const db = openDatabaseSync(path);
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
  const resultFalsifier = process.env.QF_HERMES_SYNTHETIC_RESULT_FALSIFY;
  const suppressResult = input.kind === "result" &&
    (resultFalsifier === "missing-result-observation" || resultFalsifier === "worker-complete-is-result");
  const delivered = !suppressResult && process.env.QF_PEER_DELIVERY !== "off";
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
}, prepareCompletion?: (artifactId: string) => void): { artifactId: string; completion: unknown } {
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
    (published) => {
      prepareCompletion?.(published.artifactId);
      return rawExecute(
        "complete_task",
        { task_id: input.taskId, result_artifact_id: published.artifactId },
        context,
      );
    },
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

/** Read every task assignment state, including malformed cardinality. */
export function kernelListTaskAssignments(): TaskAssignmentProjection[] {
  return projectTaskAssignments({
    listTasks: () => kernelQueryObjects("task", {}, null, 0, "asc"),
    linksFrom: (id, kind) => kernelGetLinks(id, { kind }).filter((link) => link.from_id === id),
    getObject: kernelGetObject,
  });
}

export function kernelListTaskHistory(taskId: string): TaskHistoryFact[] {
  if (process.env.QF_FOUNDER_STEERING_FALSIFY === "ui_history_survived_with_kernel_history_removed") {
    historyReadCount += 1;
    if (historyReadCount > 1) return [];
  }
  const kinds = new Set([
    "task.clarified", "task.redirected", "task.steering_delivery", "task.steering_refused",
    "task.reassigned", "task.reassignment_delivery", "task.second_opinion_requested",
    "task.second_opinion_delivery", "task.cancelled", "task.cancel_outcome",
  ]);
  const rows = getKernelDb().query(
    "SELECT rowid AS sequence, id, type, object_id, payload FROM events ORDER BY rowid ASC, id ASC",
  ).all() as Array<{ sequence: number; id: string; type: string; object_id: string; payload: string }>;
  const facts: TaskHistoryFact[] = [];
  for (const row of rows) {
    if (!kinds.has(row.type)) continue;
    let payload: Record<string, unknown> = {};
    try {
      const parsed = JSON.parse(row.payload) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) payload = parsed as Record<string, unknown>;
    } catch { continue; }
    const rowTaskId = String(payload.task_id ?? payload.source_task_id ?? row.object_id);
    if (rowTaskId !== taskId && row.object_id !== taskId) continue;
    const accepted = row.type.endsWith("_refused") ? "refused" : row.type.endsWith("_delivery") || row.type === "task.cancel_outcome" ? payload.outcome ?? null : "accepted";
    facts.push({
      sequence: Number(row.sequence), event_id: row.id, kind: row.type, task_id: rowTaskId,
      mode: typeof payload.mode === "string" ? payload.mode : row.type === "task.second_opinion_requested" || row.type === "task.second_opinion_delivery" ? "second_opinion" : row.type === "task.reassigned" || row.type === "task.reassignment_delivery" ? "reassign" : null,
      text: typeof payload.instruction === "string" ? payload.instruction : typeof payload.new_description === "string" ? payload.new_description : typeof payload.message === "string" ? payload.message : null,
      outcome: typeof accepted === "string" ? accepted : null,
      target_session_id: typeof payload.target_session_id === "string" ? payload.target_session_id : typeof payload.assignee_session_id === "string" ? payload.assignee_session_id : typeof payload.critic_session_id === "string" ? payload.critic_session_id : null,
    });
  }
  return facts;
}

let historyReadCount = 0;

/** Task composition surface: fresh session identity plus assignment projection. */
export function kernelListTaskSurface(): {
  sessions: Record<string, unknown>[];
  assignments: TaskAssignmentProjection[];
} {
  const sessions = kernelListAgentSessions().map((session) => {
    const spawned = kernelGetLinks(String(session.id ?? ""), { kind: "spawned_from" })
      .filter((link) => link.from_id === session.id);
    const definition = spawned.length === 1
      ? kernelGetObject("agent_definition", spawned[0]!.to_id)
      : null;
    let capabilityGroups: unknown = definition?.capability_groups ?? [];
    if (typeof capabilityGroups === "string") {
      try {
        capabilityGroups = JSON.parse(capabilityGroups);
      } catch {
        capabilityGroups = [];
      }
    }
    return {
      ...session,
      definition_id: spawned.length === 1 ? spawned[0]!.to_id : null,
      role: definition?.role ?? null,
      display_name: definition?.display_name ?? null,
      runtime_profile: definition?.runtime_profile ?? null,
      capability_groups: Array.isArray(capabilityGroups) ? capabilityGroups : [],
    };
  });
  return {
    sessions,
    assignments: kernelListTaskAssignments().map((assignment) => {
      let reviewable = false;
      try {
        reviewable = Boolean(getKernelDb().query("SELECT 1 AS ok FROM qf_review_source_work WHERE source_task_id = ?").get(assignment.taskId));
      } catch { /* R15 support tables are created lazily by the Kernel seam. */ }
      return {
        ...assignment,
        history: kernelListTaskHistory(assignment.taskId),
        reviewable,
        reviewProjection: reviewable ? kernelGovernedReviewProjection(assignment.taskId) : null,
      };
    }),
  };
}

/** Close is a governed action; perform the read-only screen refusal before teardown. */
export function kernelAssertSessionMayClose(sessionId: string): void {
  const row = getKernelDb()
    .query(
      `SELECT 1 AS open_task
       FROM task
       JOIN links ON links.from_id = task.id AND links.kind = 'assigned_to'
       WHERE task.status = 'open' AND links.to_id = ?
       LIMIT 1`,
    )
    .get(sessionId) as { open_task: number } | null;
  if (row) {
    throw new Error("Reassign or cancel this task before closing the seat.");
  }
}

export function kernelExecute<C extends string>(
  command: C,
  input: Record<string, unknown>,
  trace: TrustedExecutionContext,
): ExecuteResultFor<C> {
  if (process.env.QF_R17_PLACEMENT_SPY === "1" && /place_wager|submit_wager|place_order|submit_order/i.test(command)) {
    const marker = process.env.QF_R17_PLACEMENT_SPY_PATH;
    if (marker) writeFileSync(marker, JSON.stringify({ command, input }), "utf8");
    throw new Error("R17 placement execution spy intercepted a forbidden action");
  }
  const result = execute(getKernelDb(), command, input, trace);
  notifyKernelEvents();
  return result;
}

export function kernelBindSourceWork(work: SourceWork): SourceWork {
  return kernelExecute("governed_review_task", { operation: "bind_source_work", source_work: work }, { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() }) as unknown as SourceWork;
}

export function kernelFreezeSourceWork(sourceTaskId: string): SourceWork {
  return freezeSourceWork(getKernelDb(), sourceTaskId);
}

export function kernelRequestGovernedReview(sourceTaskId: string, attemptId: string, criticSessionId: string | null) {
  return kernelExecute("governed_review_task", { operation: "admit", action_kind: "request_review", source_task_id: sourceTaskId, attempt_id: attemptId, critic_session_id: criticSessionId }, { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() }) as unknown as GovernedReviewAdmission;
}

export function kernelMarkGovernedDelivery(reviewTaskId: string, outcome: "delivered" | "failed"): void {
  kernelExecute("governed_review_task", { operation: "deliver", review_task_id: reviewTaskId, outcome }, { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() });
}

export type GovernedResearchContinuationInput = {
  source_task_id: string;
  hypothesis_id: string;
  run_id: string;
  result_artifact_id: string;
  executor_session_id: string;
  critic_session_id: string;
  attempt_id: string;
  deliver: (reviewTaskId: string, sourceWork: SourceWork) => Promise<void>;
};

export type GovernedResearchContinuationResult = {
  review_task_id: string;
  source_work: SourceWork;
  outcome: "delivered" | "failed";
};

/**
 * The one normal-result continuation seam for the governed research chain.
 * Delivery is deliberately the only callback: all Kernel boundaries remain
 * Main-owned and the caller cannot manufacture review truth.
 */
export async function kernelContinueGovernedResearchResult(
  input: GovernedResearchContinuationInput,
): Promise<GovernedResearchContinuationResult> {
  const sourceWork: SourceWork = {
    source_task_id: input.source_task_id,
    hypothesis_id: input.hypothesis_id,
    run_id: input.run_id,
    result_artifact_id: input.result_artifact_id,
    executor_session_id: input.executor_session_id,
  };
  if (
    Object.values(sourceWork).some((value) => value.length === 0) ||
    input.critic_session_id.length === 0 ||
    input.attempt_id.length === 0
  ) {
    throw new Error("governed research continuation requires non-empty identities");
  }

  const persistedSourceWork = (() => {
    try {
      return kernelFreezeSourceWork(sourceWork.source_task_id);
    } catch {
      kernelBindSourceWork(sourceWork);
      return sourceWork;
    }
  })();
  if (JSON.stringify(persistedSourceWork) !== JSON.stringify(sourceWork)) {
    throw new Error("governed research continuation does not match the frozen source work");
  }
  const admission = kernelRequestGovernedReview(
    sourceWork.source_task_id,
    input.attempt_id,
    input.critic_session_id,
  );
  if (
    admission.kind !== "admitted" ||
    typeof admission.review_task_id !== "string" ||
    admission.review_task_id.length === 0 ||
    !admission.source_work ||
    JSON.stringify(admission.source_work) !== JSON.stringify(persistedSourceWork) ||
    admission.critic_session_id !== input.critic_session_id
  ) {
    throw new Error("governed research review admission did not return the exact review Task and source work");
  }

  const frozenSourceWork = kernelFreezeSourceWork(sourceWork.source_task_id);
  let outcome: "delivered" | "failed" = "delivered";
  let deliveryFailed = false;
  let deliveryError: unknown;
  try {
    await input.deliver(admission.review_task_id, frozenSourceWork);
  } catch (error) {
    outcome = "failed";
    deliveryFailed = true;
    deliveryError = error;
  } finally {
    kernelMarkGovernedDelivery(admission.review_task_id, outcome);
  }
  if (deliveryFailed) throw deliveryError;
  return {
    review_task_id: admission.review_task_id,
    source_work: frozenSourceWork,
    outcome,
  };
}

export function kernelRecordGovernedToolReceipt(args: GovernedToolReceiptInput): void {
  kernelExecute("governed_review_task", { operation: "record_tool_receipt", ...args }, { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() });
}

export function kernelGovernedReviewContextForSession(sessionId: string): { taskId: string; sourceWork: SourceWork } | null {
  try {
    const row = getKernelDb().query("SELECT task_id, source_work FROM qf_review_task WHERE critic_session_id = ? AND lifecycle = 'running' ORDER BY created_at ASC LIMIT 1").get(sessionId) as { task_id: string; source_work: string } | null;
    if (!row) return null;
    return { taskId: row.task_id, sourceWork: JSON.parse(row.source_work) as SourceWork };
  } catch {
    return null;
  }
}

export function kernelGovernedReviewNextSequence(sessionId: string): number {
  try {
    const row = getKernelDb().query("SELECT COALESCE(MAX(broker_sequence), 0) + 1 AS next FROM qf_review_invocation WHERE session_id = ?").get(sessionId) as { next: number };
    return Number(row.next);
  } catch {
    return 1;
  }
}

export function kernelGovernedCriticProgress(
  sessionId: string,
  reviewTaskId: string,
): { lifecycle: string; qualifyingReadsComplete: boolean } | null {
  try {
    const row = getKernelDb().query(
      "SELECT lifecycle, source_work FROM qf_review_task WHERE task_id = ? AND critic_session_id = ?",
    ).get(reviewTaskId, sessionId) as { lifecycle: string; source_work: string } | null;
    if (!row) return null;
    const work = JSON.parse(row.source_work) as SourceWork;
    const receipts = getKernelDb().query(
      "SELECT tool_name, arguments FROM qf_review_invocation WHERE task_id = ? AND session_id = ? AND success = 1",
    ).all(reviewTaskId, sessionId) as Array<{ tool_name: string; arguments: string }>;
    const expected = [
      ["qf_hypothesis_get", JSON.stringify({ id: work.hypothesis_id })],
      ["qf_run_get", JSON.stringify({ id: work.run_id })],
      ["qf_artifact_get", JSON.stringify({ id: work.result_artifact_id })],
    ];
    return {
      lifecycle: row.lifecycle,
      qualifyingReadsComplete: expected.every(([tool, args]) =>
        receipts.some((receipt) => receipt.tool_name === tool && receipt.arguments === args)
      ),
    };
  } catch {
    return null;
  }
}

export function kernelFailGovernedCriticCompletion(
  reviewTaskId: string,
  reasonCode: string,
  message: string,
): void {
  kernelExecute("governed_review_task", {
    operation: "fail_completion",
    review_task_id: reviewTaskId,
    reason_code: reasonCode,
    message,
  }, { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() });
}

export function kernelRecordGovernedEvaluation(input: Record<string, unknown>, actorSessionId: string): Record<string, unknown> {
  return kernelExecute("record_evaluation", input, { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID(), actor_session_id: actorSessionId }).state;
}

export function kernelRequestRevision(work: SourceWork, evaluationId: string, attemptId: string) {
  return kernelExecute("governed_review_task", { operation: "admit", action_kind: "request_revision", source_task_id: work.source_task_id, source_work: work, triggering_evaluation_id: evaluationId, attempt_id: attemptId }, { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() }) as unknown as GovernedReviewAdmission;
}

export function kernelRequestSecondCritic(work: SourceWork, evaluationId: string, attemptId: string, criticSessionId: string | null) {
  return kernelExecute("governed_review_task", { operation: "admit", action_kind: "second_critic", source_task_id: work.source_task_id, source_work: work, triggering_evaluation_id: evaluationId, attempt_id: attemptId, critic_session_id: criticSessionId }, { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() }) as unknown as GovernedReviewAdmission;
}

export function kernelGovernedReviewProjection(sourceTaskId: string): Record<string, unknown> | null {
  return governedReviewProjection(getKernelDb(), sourceTaskId);
}

export function kernelGovernedAttemptExists(actionKind: string, sourceTaskId: string, attemptId: string): boolean {
  try {
    return Boolean(getKernelDb().query("SELECT 1 AS ok FROM qf_review_attempt WHERE action_kind = ? AND source_task_id = ? AND attempt_id = ?").get(actionKind, sourceTaskId, attemptId));
  } catch {
    return false;
  }
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

/** Read-only Kernel truth for the source-bound open review duplicate guard. */
export function kernelFindOpenSecondOpinion(sourceTaskId: string): string | null {
  const row = getKernelDb().query(
    `SELECT json_extract(events.payload, '$.review_task_id') AS review_task_id
     FROM events
     JOIN task ON task.id = json_extract(events.payload, '$.review_task_id')
     WHERE events.type = 'task.second_opinion_requested'
       AND json_extract(events.payload, '$.source_task_id') = ?
       AND task.status = 'open'
     ORDER BY events.rowid ASC
     LIMIT 1`,
  ).get(sourceTaskId) as { review_task_id?: unknown } | null;
  return typeof row?.review_task_id === "string" && row.review_task_id.length > 0
    ? row.review_task_id
    : null;
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

const SOURCE_WORK_KEYS = [
  "source_task_id",
  "hypothesis_id",
  "run_id",
  "result_artifact_id",
  "executor_session_id",
] as const;

function sameSourceWork(left: SourceWork, right: SourceWork): boolean {
  return SOURCE_WORK_KEYS.every((key) => left[key] === right[key]);
}

function readVisibleSourceWork(sourceTaskId: string): SourceWork | null {
  const db = getKernelDb();
  const table = db
    .query("SELECT 1 AS ok FROM sqlite_master WHERE type = 'table' AND name = 'qf_review_source_work'")
    .get() as { ok: number } | null;
  if (!table) return null;
  const rows = db
    .query("SELECT source_work FROM qf_review_source_work WHERE source_task_id = ?")
    .all(sourceTaskId) as Array<{ source_work: string }>;
  if (rows.length === 0) return null;
  if (rows.length !== 1) throw new Error("R16 fixture requires exactly one durable source-work binding");
  const parsed = jsonRecord(rows[0]!.source_work);
  const keys = Object.keys(parsed).sort();
  if (keys.join(",") !== [...SOURCE_WORK_KEYS].sort().join(",")) {
    throw new Error("R16 fixture durable source-work binding is malformed");
  }
  for (const key of SOURCE_WORK_KEYS) {
    if (typeof parsed[key] !== "string" || parsed[key].length === 0) {
      throw new Error("R16 fixture durable source-work binding is malformed");
    }
  }
  return {
    source_task_id: parsed.source_task_id as string,
    hypothesis_id: parsed.hypothesis_id as string,
    run_id: parsed.run_id as string,
    result_artifact_id: parsed.result_artifact_id as string,
    executor_session_id: parsed.executor_session_id as string,
  };
}

function visibleTaskCompletionPayload(payload: unknown): {
  taskId: string;
  runId: string;
  artifactId: string;
} | null {
  const event = jsonRecord(payload);
  const input = jsonRecord(event.input);
  if (
    typeof input.task_id !== "string" ||
    typeof input.run_id !== "string" ||
    typeof input.result_artifact_id !== "string"
  ) return null;
  return {
    taskId: input.task_id,
    runId: input.run_id,
    artifactId: input.result_artifact_id,
  };
}

/**
 * Read-only pre-admission proof for the visible-world fixture.
 * Review admission is not called until this exact worker/run/completion
 * lineage is present in Kernel truth.
 */
export function kernelAssertVisibleResearchWorldLineage(
  db: KernelDb,
  work: SourceWork,
  directorSessionId: string,
): void {
  const fail = (): never => {
    throw new Error("R16 fixture source Task completion/receipt lineage is not exact");
  };
  const binding = db
    .query("SELECT source_work FROM qf_review_source_work WHERE source_task_id = ?")
    .all(work.source_task_id) as Array<{ source_work: string }>;
  if (binding.length !== 1) fail();
  const persisted = jsonRecord(binding[0]!.source_work);
  if (
    Object.keys(persisted).sort().join(",") !== [...SOURCE_WORK_KEYS].sort().join(",") ||
    SOURCE_WORK_KEYS.some((key) => typeof persisted[key] !== "string") ||
    !sameSourceWork(persisted as SourceWork, work)
  ) fail();
  const task = db
    .query("SELECT status FROM task WHERE id = ?")
    .get(work.source_task_id) as { status: string } | null;
  if (!task || task.status !== "done") fail();

  const assignments = db
    .query("SELECT to_id FROM links WHERE from_id = ? AND kind = 'assigned_to'")
    .all(work.source_task_id) as Array<{ to_id: string }>;
  if (assignments.length !== 1 || assignments[0]!.to_id !== work.executor_session_id) fail();
  const delegatedBy = db
    .query("SELECT to_id FROM links WHERE from_id = ? AND kind = 'delegated_by'")
    .all(work.source_task_id) as Array<{ to_id: string }>;
  if (delegatedBy.length !== 1 || delegatedBy[0]!.to_id !== directorSessionId) fail();
  const delegation = db
    .query("SELECT from_id FROM links WHERE kind = 'delegates_to' AND from_id = ? AND to_id = ?")
    .all(directorSessionId, work.executor_session_id) as Array<{ from_id: string }>;
  if (delegation.length !== 1) fail();

  const run = db
    .query("SELECT status, params FROM run WHERE id = ?")
    .get(work.run_id) as { status: string; params: string } | null;
  if (!run || run.status !== "succeeded") fail();
  const runParams = jsonRecord(run.params);
  if (runParams.executor_session_id !== work.executor_session_id) fail();
  if (runParams.hypothesis_id !== work.hypothesis_id) fail();
  if (typeof runParams.result_artifact_id !== "string" || runParams.result_artifact_id === work.result_artifact_id) fail();
  const runResult = db
    .query("SELECT kind FROM artifact WHERE id = ?")
    .get(runParams.result_artifact_id) as { kind: string } | null;
  if (runResult?.kind !== "result_set") fail();
  const runOutputs = db
    .query("SELECT to_id FROM links WHERE kind = 'produces' AND from_id = ?")
    .all(work.run_id) as Array<{ to_id: string }>;
  if (runOutputs.length !== 1 || runOutputs[0]!.to_id !== runParams.result_artifact_id) fail();
  const testedHypotheses = db
    .query("SELECT to_id FROM links WHERE kind = 'tests' AND from_id = ?")
    .all(work.run_id) as Array<{ to_id: string }>;
  if (testedHypotheses.length !== 1 || testedHypotheses[0]!.to_id !== work.hypothesis_id) fail();

  const workerArtifact = db
    .query("SELECT kind, storage_ref FROM artifact WHERE id = ?")
    .get(work.result_artifact_id) as { kind: string; storage_ref: string } | null;
  if (workerArtifact?.kind !== "trajectory") fail();
  const workerProducers = db
    .query("SELECT from_id FROM links WHERE kind = 'produces' AND to_id = ?")
    .all(work.result_artifact_id) as Array<{ from_id: string }>;
  if (workerProducers.length !== 1 || workerProducers[0]!.from_id !== work.executor_session_id) fail();
  const workerTrajectory = jsonRecord(readFileSync(workerArtifact.storage_ref, "utf8"));
  if (workerTrajectory.task_id !== work.source_task_id || workerTrajectory.from_session_id !== work.executor_session_id) fail();

  const completionEvents = db
    .query(`SELECT payload FROM events
      WHERE type = 'task.completed' AND object_type = 'task' AND object_id = ?
      ORDER BY rowid ASC, id ASC`)
    .all(work.source_task_id) as Array<{ payload: string }>;
  if (completionEvents.length !== 1) fail();
  const completion = visibleTaskCompletionPayload(completionEvents[0]!.payload);
  if (
    !completion ||
    completion.taskId !== work.source_task_id ||
    completion.runId !== work.run_id ||
    completion.artifactId !== work.result_artifact_id
  ) fail();

  const readTrajectories = db
    .query("SELECT to_id FROM links WHERE from_id = ? AND kind = 'derived_from'")
    .all(work.result_artifact_id) as Array<{ to_id: string }>;
  if (readTrajectories.length === 0) fail();
  for (const row of readTrajectories) {
    try {
      assertDurableOntologyReadReceipt(db, row.to_id, work.executor_session_id);
    } catch {
      fail();
    }
  }
}

function seedVisibleWorkerReadReceipt(executorSessionId: string): string {
  kernelEnsureSyntheticMarketFixture();
  const venue = kernelGetObject("venue", "venue-hermes-synthetic") ?? { id: "venue-hermes-synthetic" };
  const bytes = new TextEncoder().encode(JSON.stringify({
    contract: "qf.ontology.v1",
    tool: "qf_venue_get",
    arguments: { id: venue.id },
    result: venue,
    session_id: executorSessionId,
    created_at: new Date().toISOString(),
    nonce: crypto.randomUUID(),
  }));
  const hash = createHash("sha256").update(bytes).digest("hex");
  const directory = join(getArtifactRoot(), "r16-visible-world");
  const path = join(directory, `${hash}.json`);
  mkdirSync(directory, { recursive: true });
  if (!existsSync(path)) writeFileSync(path, bytes, { flag: "wx" });
  const receipt = kernelExecute("publish_artifact", {
    kind: "trajectory",
    path,
    storage_ref: path,
    content_hash: hash,
    links: [{ kind: "produces", from_id: executorSessionId }],
  }, {
    trace_id: crypto.randomUUID(),
    span_id: crypto.randomUUID(),
    actor_session_id: executorSessionId,
    ontology_read_tool: "qf_venue_get",
  }) as { object_id: string };
  return receipt.object_id;
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

/** Synthetic R17 fixture: one point-in-time observation and two named techniques. */
export function kernelEnsureR17TechniqueFixture(): { dataset: Record<string, unknown>; strategies: Array<Record<string, unknown>>; missing_close_run_id: string } {
  kernelEnsureSyntheticMarketFixture();
  const bytes = new TextEncoder().encode(JSON.stringify({
    contract: "qf.dataset.v1",
    observations: [{ id: "selection-r17", observed_at: "2026-08-21T00:00:00.000Z", edge: 0.8, predicted_probability: 0.8 }],
  }));
  const hash = createHash("sha256").update(bytes).digest("hex");
  const directory = join(getArtifactRoot(), "r17-fixture");
  const path = join(directory, `${hash}.json`);
  mkdirSync(directory, { recursive: true });
  if (!existsSync(path)) writeFileSync(path, bytes, { encoding: "utf8", flag: "wx" });
  const trace = { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() };
  const source = kernelExecute("publish_artifact", { kind: "result_set", path, storage_ref: path, content_hash: hash }, trace) as { object_id: string };
  const dataset = kernelExecute("register_dataset_version", {
    kind: "results", artifact_id: source.object_id, content_hash: source.object_id,
    as_of: "2026-08-22T00:00:00.000Z", coverage: { deterministic_score_field: "edge" },
  }, { ...trace, span_id: crypto.randomUUID() }) as unknown as Record<string, unknown>;
  const strategies: Array<Record<string, unknown>> = [];
  for (const version of [1, 2]) {
    const run = kernelExecute("execute_deterministic_run", {
      run_id: `r17-fixture-v${version}`,
      dataset_id: String(dataset.object_id),
      strategy_spec: { contract: "qf.strategy.v1", family: "r17-technique", version, stake_model: "flat", score_field: "edge", probability_field: "/predicted_probability" },
      params: { limit: 1 },
    }, { ...trace, span_id: crypto.randomUUID() }) as { state: Record<string, unknown> };
    const strategyId = kernelGetLinks(`r17-fixture-v${version}`, { kind: "uses" }).find((link) => link.from_id === `r17-fixture-v${version}` && link.to_id.startsWith("strategy:"))?.to_id;
    if (strategyId) { const spec = getKernelDb().query("SELECT spec_ref FROM strategy WHERE id = ?").get(strategyId) as { spec_ref?: string } | null; const artifact = spec?.spec_ref ? getKernelDb().query("SELECT content_hash FROM artifact WHERE id = ?").get(spec.spec_ref) as { content_hash?: string } | null : null; strategies.push({ strategy_id: strategyId, version, result_artifact_id: run.state.result_artifact_id, content_hash: artifact?.content_hash ?? "" }); }
  }
  const strategyId = String(strategies.find((row) => Number(row.version) === 2)?.strategy_id ?? "");
  const missingClose = kernelExecute("execute_deterministic_run", {
    run_id: "r17-fixture-missing-close", dataset_id: String(dataset.object_id), strategy_id: strategyId, params: { limit: 1 },
  }, { ...trace, span_id: crypto.randomUUID() }) as { object_id: string };
  if (process.env.QF_R17_FALSIFY_STRATEGY_BYTES === "1") { const specRef = String((getKernelDb().query("SELECT spec_ref FROM strategy WHERE id = ?").get(strategyId) as { spec_ref?: string } | null)?.spec_ref ?? ""); const row = getKernelDb().query("SELECT storage_ref FROM artifact WHERE id = ?").get(specRef) as { storage_ref?: string } | null; if (row?.storage_ref) { const corrupted = readFileSync(row.storage_ref); corrupted[0] = corrupted[0] ^ 1; writeFileSync(row.storage_ref, corrupted); } } return { dataset, strategies, missing_close_run_id: missingClose.object_id };
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

/** R17 Director path: named Technique is mandatory and legacy strategy synthesis is unreachable. */
export function kernelRunR17DirectorResearch(
  executorSessionId: string,
  hypothesisId: string,
  evidenceArtifactId: string,
  strategyId: string,
): ReturnType<typeof kernelRunGuidedResearch> {
  if (typeof strategyId !== "string" || strategyId.trim() !== strategyId || strategyId.length === 0) {
    throw new Error("TECHNIQUE COVERAGE REFUSED");
  }
  return kernelRunGuidedResearch(executorSessionId, hypothesisId, evidenceArtifactId, strategyId);
}

export function kernelRunGuidedResearch(
  executorSessionId: string,
  hypothesisId: string,
  evidenceArtifactId: string,
  strategyId?: string,
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
    run_id: process.env.QF_R17_GATE === "1" ? "run-r17-gate" : `run-${crypto.randomUUID()}`,
    dataset_id: String(dataset.id),
    hypothesis_id: hypothesisId,
    ...(strategyId ? { strategy_id: strategyId } : { strategy_spec: {
      contract: "qf.strategy.v1", version: 1, stake_model: "flat", score_field: scoreField,
    } }),
    params: { limit: 1 },
  }, {
    trace_id: crypto.randomUUID(), span_id: crypto.randomUUID(), actor_session_id: executorSessionId,
  }) as { object_id: string; state: Record<string, unknown> };
  // The caller's worker trajectory is durably bound by complete_task. Keep this
  // argument for the established seam, but never retain it in process memory.
  void evidenceArtifactId;
  return {
    hypothesisId: String(hypothesis.id),
    runId: run.object_id,
    artifactId: String(run.state.result_artifact_id),
    metrics: jsonRecord(run.state.metrics),
  };
}

export function kernelFinalizeResearchEvaluation(evaluationId: string, database: KernelDb = getKernelDb()): {
  reportArtifactId: string | null;
  hypothesisId: string;
  status: string;
  authorityKey: string | null;
  evidenceArtifactId: string | null;
  current: boolean;
} {
  const readObject = (type: string, id: string) => getObject(database, type, id);
  const readLinks = (id: string, options?: GetLinksOptions) => getLinks(database, id, options);
  const evaluation = readObject("evaluation", evaluationId);
  if (!evaluation) throw new Error(`Evaluation not found: ${evaluationId}`);
  const lineage = readLinks(evaluationId, { kind: "evaluated_by" });
  const hypothesisId = lineage.find((link) =>
    link.to_id === evaluationId && readObject("hypothesis", link.from_id)
  )?.from_id;
  const runId = lineage.find((link) =>
    link.to_id === evaluationId && readObject("run", link.from_id)
  )?.from_id;
  if (!hypothesisId || !runId) throw new Error("Evaluation lacks exact hypothesis and Run lineage");
  const verdict = String(evaluation.verdict);
  const status = verdict === "supports" ? "supported" : verdict === "rejects" ? "rejected" : "inconclusive";
  const existingHypothesis = readObject("hypothesis", hypothesisId);
  if (existingHypothesis && String(existingHypothesis.status) === "open") {
    execute(database, "resolve_hypothesis", {
      hypothesis_id: hypothesisId, evaluation_id: evaluationId, status,
    }, { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() });
  } else if (!existingHypothesis || String(existingHypothesis.status) !== status) {
    throw new Error("Evaluation hypothesis resolution is not idempotently persisted");
  }
  if (verdict !== "supports") return { reportArtifactId: null, hypothesisId, status, authorityKey: null, evidenceArtifactId: null, current: false };

  let sourceWork: SourceWork;
  try {
    sourceWork = JSON.parse(String(evaluation.source_work)) as SourceWork;
  } catch {
    throw new Error(`Evaluation lacks exact source work: ${evaluationId}`);
  }
  const evidence = resolveGovernedWorkerEvidence(database, sourceWork);
  const publication = readGovernedPublicationForEvaluation(database, evaluationId);
  if (!publication) throw new Error(`Evaluation lacks persisted Report publication: ${evaluationId}`);
  const gates = database.query(
    "SELECT to_id FROM links WHERE kind = 'gates' AND from_id = ? ORDER BY created_at ASC, id ASC",
  ).all(evaluationId) as Array<{ to_id: string }>;
  if (gates.length !== 1 || gates[0]!.to_id !== publication.report_artifact_id || String(evaluation.publication_report_id ?? "") !== publication.report_artifact_id) {
    throw new Error(`Evaluation publication agreement is invalid: ${evaluationId}`);
  }
  return {
    reportArtifactId: publication.report_artifact_id,
    hypothesisId,
    status,
    authorityKey: publication.authority_key,
    evidenceArtifactId: evidence.artifactId,
    current: publication.is_current === 1,
  };
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
    if (action.capabilityGroup && action.internalOnly !== true && action.operatorOnly !== true) {
      tools.push(actionToolForAction(action));
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

/** Synthetic-test-only R16 fixture completion through the production Kernel seams. */
export function kernelSeedVisibleResearchWorld(input: {
  nonce: string;
  datasetId: string;
  taskId?: string;
  missionId: string;
  directorSessionId: string;
  taskTitle: string;
  taskDescription: string;
  hypothesisId: string;
  executorSessionId: string;
  criticSessionId: string;
  strategyId?: string;
  runId?: string;
}): Record<string, unknown> {
  const trace = () => ({ trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() });
  const persistedRun = input.runId ? kernelGetObject("run", input.runId) : null;
  const persistedRunParams = persistedRun ? jsonRecord(persistedRun.params) : {};
  const executorSessionId = String(persistedRunParams.executor_session_id ?? input.executorSessionId);
  for (const [sessionId, definitionId, label, actorSessionId] of [[input.directorSessionId, "hermes-research-director", "R17 fixture director", null], [executorSessionId, "hermes-worker", "R17 fixture executor", input.directorSessionId], [input.criticSessionId, "hermes-critic", "R17 fixture critic", input.directorSessionId]] as const) {
    if (!kernelGetObject("agent_session", sessionId)) {
      const sessionTrace = actorSessionId ? { ...trace(), actor_session_id: actorSessionId } : trace();
      kernelExecute("create_agent_session", { session_id: sessionId, agent_definition_id: definitionId, label }, sessionTrace);
      kernelExecute("start_agent_session", { session_id: sessionId }, trace());
    }
  }
  const createdTask = input.taskId ? null : kernelExecute("create_task", {
    task_id: `task-${input.nonce}`,
    title: input.taskTitle,
    description: input.taskDescription,
    assignee_session_id: executorSessionId,
  }, { ...trace(), actor_session_id: input.directorSessionId, mission_id: input.missionId }) as { object_id: string };
  const taskId = input.taskId ?? String(createdTask?.object_id ?? "");
  if (!taskId) throw new Error("R16 fixture Task creation did not return an id");
  const selectedStrategyId = process.env.QF_R17_FALSIFY_STRATEGY === "1"
    ? String(kernelListStrategyVersions().find((row) => Number(row.version) === 1)?.strategy_id ?? "")
    : input.strategyId;
  if (!kernelGetLinks(input.directorSessionId, { kind: "delegates_to" }).some((link) => link.to_id === executorSessionId)) {
    throw new Error("R16 fixture requires a Kernel-owned director-to-executor delegation link");
  }
  const existingRun = input.runId ? kernelGetObject("run", input.runId) : null;
  const existingParams = existingRun ? jsonRecord(existingRun.params) : {};
  const run = existingRun
    ? { object_id: input.runId!, state: { ...existingRun, result_artifact_id: existingParams.result_artifact_id } }
    : kernelExecute("execute_deterministic_run", {
      run_id: `run-${input.nonce}`,
      dataset_id: input.datasetId,
      hypothesis_id: input.hypothesisId,
      ...(selectedStrategyId ? { strategy_id: selectedStrategyId } : { strategy_spec: {
        contract: "qf.strategy.v1", version: 1, stake_model: "flat", score_field: "edge",
      } }),
      params: { limit: 2 },
    }, { ...trace(), actor_session_id: executorSessionId }) as { object_id: string; state: Record<string, unknown> };
  const resultArtifactId = String(run.state.result_artifact_id ?? "");
  if (!resultArtifactId) throw new Error("R16 fixture deterministic Run did not produce a result Artifact");
  const candidateWork: SourceWork = {
    source_task_id: taskId,
    hypothesis_id: input.hypothesisId,
    run_id: run.object_id,
    result_artifact_id: "pending-worker-trajectory",
    executor_session_id: executorSessionId,
  };
  const storedWork = readVisibleSourceWork(taskId);
  let work: SourceWork;
  if (storedWork) {
    if (
      storedWork.source_task_id !== candidateWork.source_task_id ||
      storedWork.hypothesis_id !== candidateWork.hypothesis_id ||
      storedWork.run_id !== candidateWork.run_id ||
      storedWork.executor_session_id !== candidateWork.executor_session_id
    ) {
      throw new Error("R16 fixture durable source-work binding does not match the exact Director-owned tuple");
    }
    work = kernelFreezeSourceWork(taskId);
  } else {
    const readArtifactId = seedVisibleWorkerReadReceipt(executorSessionId);
    const committed = commitCollaborationResult({
      taskId,
      workerSessionId: executorSessionId,
      workerRole: "worker",
      delegatorSessionId: input.directorSessionId,
      delegatorRole: "orchestrator",
      result: "The bounded visible-world worker trajectory is complete.",
      citedMarketIds: ["event-hermes-synthetic"],
      readTrajectoryArtifactIds: [readArtifactId],
    }, (workerArtifactId) => {
      kernelBindSourceWork({ ...candidateWork, result_artifact_id: workerArtifactId });
    });
    work = kernelFreezeSourceWork(taskId);
    if (work.result_artifact_id !== committed.artifactId) {
      throw new Error("R16 fixture worker trajectory did not remain the frozen source Artifact");
    }
  }
  kernelAssertVisibleResearchWorldLineage(getKernelDb(), work, input.directorSessionId);
  const attemptId = `r16-review-${input.nonce}`;
  const admitted = kernelRequestGovernedReview(taskId, attemptId, input.criticSessionId);
  if (admitted.kind !== "admitted" || !admitted.review_task_id) throw new Error("R16 fixture review admission did not produce a review Task");
  kernelMarkGovernedDelivery(admitted.review_task_id, "delivered");
  const reads = [
    ["qf_hypothesis_get", { id: input.hypothesisId }, 1],
    ["qf_run_get", { id: run.object_id }, 2],
    ["qf_artifact_get", { id: work.result_artifact_id }, 3],
  ] as const;
  for (const [toolName, args, sequence] of reads) {
    kernelRecordGovernedToolReceipt({
      invocation_id: `r16-${input.nonce}-${sequence}`,
      session_id: input.criticSessionId,
      task_id: admitted.review_task_id,
      tool_name: toolName,
      arguments: args,
      result: { id: args.id },
      broker_sequence: sequence,
    }, trace());
  }
  const evaluation = kernelRecordGovernedEvaluation({
    review_task_id: admitted.review_task_id,
    source_work: work,
    hypothesis_id: input.hypothesisId,
    run_id: run.object_id,
    artifact_id: work.result_artifact_id,
    verdict: "supports",
    rubric: { faithfulness: 0.9, answer_relevancy: 0.9, context_precision: 0.9, context_recall: 0.9 },
    confidence: 0.9,
    rationale: "The bounded deterministic fixture preserves the complete visible research lineage.",
    findings: [{ code: "R16-COMPLETE", severity: "info", message: "The fixture lineage is complete.", evidence_refs: [input.hypothesisId, run.object_id, work.result_artifact_id] }],
  }, input.criticSessionId);
  return {
    nonce: input.nonce,
    dataset_id: input.datasetId,
    task_id: taskId,
    hypothesis_id: input.hypothesisId,
    run_id: run.object_id,
    result_artifact_id: work.result_artifact_id,
    run_result_artifact_id: resultArtifactId,
    evaluation_id: String(evaluation.object_id ?? ""),
    review_task_id: admitted.review_task_id,
  };
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
