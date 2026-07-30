import { readFileSync } from "node:fs";
import { creationCommands, type CreationCommand } from "qf-kernel-schema/commands";
import type { KernelDb } from "./db.ts";
import {
  AgentDefinitionExistsError,
  ArtifactMetadataConflictError,
  ContentHashMismatchError,
  KernelError,
  SpawnedFromLinkRejectedError,
  UnknownAgentDefinitionError,
} from "./errors.ts";
import { appendEvent } from "./events.ts";
import type { ExecuteResult } from "./execute.ts";
import { contentHash } from "./hash.ts";
import {
  lineageFieldsToLinks,
  type LinkSpec,
  writeLinks,
} from "./links.ts";
import type { TraceContext } from "./trace.ts";
import {
  observationEvent,
  rejectSuppliedInitialState,
  requireObservedGrade,
  TICKET_ORIGIN,
} from "./creation-policy.ts";

const TICKET_GRADES = ["pending", "win", "loss", "push", "void"] as const;

function resolveBytes(input: Record<string, unknown>): Uint8Array {
  if (input.bytes instanceof Uint8Array) return input.bytes;
  if (typeof input.path === "string" && input.path.length > 0) {
    return new Uint8Array(readFileSync(input.path));
  }
  throw new KernelError('publish_artifact requires "bytes" (Uint8Array) or "path"');
}

const ARTIFACT_KINDS = new Set([
  "strategy_spec",
  "code",
  "result_set",
  "report",
  "trajectory",
]);

type CreationHandler = (
  db: KernelDb,
  cmd: CreationCommand,
  input: Record<string, unknown>,
  trace: TraceContext,
  links: LinkSpec[],
) => ExecuteResult;

function creationResult(
  cmd: CreationCommand,
  id: string,
  event: string,
  state: Record<string, unknown>,
  to = "exists",
): ExecuteResult {
  return {
    object_type: cmd.object_type,
    object_id: id,
    from: "(none)",
    to,
    event,
    state,
  };
}

function commitCreation(
  db: KernelDb,
  opts: {
    object_type: string;
    object_id: string;
    event: string;
    payload: Record<string, unknown>;
    trace: TraceContext;
    links: readonly LinkSpec[];
    insert: () => void;
  },
): Record<string, unknown> {
  const tx = db.transaction(() => {
    opts.insert();
    writeLinks(db, opts.object_type, opts.object_id, opts.links);
    appendEvent(db, {
      type: opts.event,
      object_type: opts.object_type,
      object_id: opts.object_id,
      payload: { ...opts.payload, span_id: opts.trace.span_id },
      trace_id: opts.trace.trace_id,
    });
    return db.query(`SELECT * FROM ${opts.object_type} WHERE id = ?`).get(opts.object_id) as Record<
      string,
      unknown
    >;
  });
  return tx();
}

function publishArtifact(
  db: KernelDb,
  cmd: CreationCommand,
  input: Record<string, unknown>,
  trace: TraceContext,
  links: LinkSpec[],
): ExecuteResult {
  const kind = input.kind;
  if (typeof kind !== "string" || !ARTIFACT_KINDS.has(kind)) {
    throw new KernelError(
      'publish_artifact requires kind in strategy_spec|code|result_set|report|trajectory',
    );
  }
  const storage_ref = input.storage_ref;
  if (typeof storage_ref !== "string" || storage_ref.length === 0) {
    throw new KernelError('publish_artifact requires non-empty "storage_ref"');
  }

  const bytes = resolveBytes(input);
  const computed = contentHash(bytes);
  if (typeof input.content_hash === "string" && input.content_hash.length > 0) {
    if (input.content_hash !== computed) {
      throw new ContentHashMismatchError(input.content_hash, computed);
    }
  }

  const id = computed;
  const existing = db.query(`SELECT * FROM artifact WHERE id = ?`).get(id) as
    | Record<string, unknown>
    | null;
  if (existing) {
    if (String(existing.kind) !== kind) {
      throw new ArtifactMetadataConflictError("kind", String(existing.kind), kind);
    }
    if (String(existing.storage_ref) !== storage_ref) {
      throw new ArtifactMetadataConflictError(
        "storage_ref",
        String(existing.storage_ref),
        storage_ref,
      );
    }
    return creationResult(cmd, id, cmd.event, existing);
  }

  const state = commitCreation(db, {
    object_type: cmd.object_type,
    object_id: id,
    event: cmd.event,
    trace,
    links,
    payload: {
      command: cmd.action,
      kind,
      content_hash: computed,
      storage_ref,
    },
    insert: () => {
      const created_at = new Date().toISOString();
      db.query(
        `INSERT INTO artifact (id, created_at, kind, content_hash, storage_ref)
         VALUES (?, ?, ?, ?, ?)`,
      ).run(id, created_at, kind, computed, storage_ref);
    },
  });
  return creationResult(cmd, id, cmd.event, state);
}

function registerAgentDefinition(
  db: KernelDb,
  cmd: CreationCommand,
  input: Record<string, unknown>,
  trace: TraceContext,
  links: LinkSpec[],
): ExecuteResult {
  const name = input.name;
  if (typeof name !== "string" || name.length === 0) {
    throw new KernelError('register_agent_definition requires non-empty "name"');
  }
  const role = input.role;
  if (typeof role !== "string" || role.length === 0) {
    throw new KernelError('register_agent_definition requires non-empty "role"');
  }
  const package_ref = input.package_ref;
  if (typeof package_ref !== "string" || package_ref.length === 0) {
    throw new KernelError('register_agent_definition requires non-empty "package_ref"');
  }
  let runtime_profile: string | null = null;
  if (input.runtime_profile !== undefined && input.runtime_profile !== null) {
    if (typeof input.runtime_profile !== "string") {
      throw new KernelError(
        'register_agent_definition "runtime_profile" must be a string or null',
      );
    }
    const trimmed = input.runtime_profile.trim();
    if (trimmed.length === 0) {
      throw new KernelError(
        'register_agent_definition "runtime_profile" must be non-empty when supplied',
      );
    }
    runtime_profile = trimmed;
  }
  let system_prompt_ref: string | null = null;
  if (input.system_prompt_ref !== undefined && input.system_prompt_ref !== null) {
    if (typeof input.system_prompt_ref !== "string") {
      throw new KernelError(
        'register_agent_definition "system_prompt_ref" must be a string or null',
      );
    }
    system_prompt_ref = input.system_prompt_ref;
  }

  const id = name;
  const existing = db.query(`SELECT * FROM agent_definition WHERE id = ?`).get(id) as
    | Record<string, unknown>
    | null;
  if (existing) {
    throw new AgentDefinitionExistsError(name);
  }

  const state = commitCreation(db, {
    object_type: cmd.object_type,
    object_id: id,
    event: cmd.event,
    trace,
    links,
    payload: {
      command: cmd.action,
      name,
      role,
      package_ref,
      runtime_profile,
      system_prompt_ref,
    },
    insert: () => {
      const created_at = new Date().toISOString();
      db.query(
        `INSERT INTO agent_definition (id, created_at, name, role, package_ref, runtime_profile, system_prompt_ref)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).run(id, created_at, name, role, package_ref, runtime_profile, system_prompt_ref);
    },
  });
  return creationResult(cmd, id, cmd.event, state);
}

function createAgentSession(
  db: KernelDb,
  cmd: CreationCommand,
  input: Record<string, unknown>,
  trace: TraceContext,
  links: LinkSpec[],
): ExecuteResult {
  const session_id = input.session_id;
  if (typeof session_id !== "string" || session_id.length === 0) {
    throw new KernelError(
      'create_agent_session requires non-empty "session_id" (guest-minted, adopted)',
    );
  }
  const agent_definition_id = input.agent_definition_id;
  if (typeof agent_definition_id !== "string" || agent_definition_id.length === 0) {
    throw new KernelError('create_agent_session requires non-empty "agent_definition_id"');
  }
  let label: string | null = null;
  if (input.label !== undefined && input.label !== null) {
    if (typeof input.label !== "string") {
      throw new KernelError('create_agent_session "label" must be a string or null');
    }
    label = input.label;
  }

  for (const spec of links) {
    if (spec.kind === "spawned_from") {
      throw new SpawnedFromLinkRejectedError();
    }
  }

  const definition = db
    .query(`SELECT id FROM agent_definition WHERE id = ?`)
    .get(agent_definition_id) as { id: string } | null;
  if (!definition) {
    throw new UnknownAgentDefinitionError(agent_definition_id);
  }

  const identityLinks: LinkSpec[] = [
    ...links,
    { kind: "spawned_from", to_id: agent_definition_id },
  ];

  const state = commitCreation(db, {
    object_type: cmd.object_type,
    object_id: session_id,
    event: cmd.event,
    trace,
    links: identityLinks,
    payload: {
      command: cmd.action,
      status: "starting",
      label,
      agent_definition_id,
    },
    insert: () => {
      const created_at = new Date().toISOString();
      db.query(
        `INSERT INTO agent_session (id, created_at, status, label)
         VALUES (?, ?, ?, ?)`,
      ).run(session_id, created_at, "starting", label);
    },
  });
  return creationResult(cmd, session_id, cmd.event, state, "starting");
}

function createHypothesis(
  db: KernelDb,
  cmd: CreationCommand,
  input: Record<string, unknown>,
  trace: TraceContext,
  links: LinkSpec[],
): ExecuteResult {
  const claim = input.claim;
  if (typeof claim !== "string" || claim.length === 0) {
    throw new KernelError('create_hypothesis requires non-empty "claim"');
  }
  const success_criteria = input.success_criteria;
  if (typeof success_criteria !== "string" || success_criteria.length === 0) {
    throw new KernelError('create_hypothesis requires non-empty "success_criteria"');
  }
  const sources =
    input.sources === undefined
      ? []
      : Array.isArray(input.sources)
        ? input.sources.map(String)
        : (() => {
            throw new KernelError('create_hypothesis "sources" must be an array of strings');
          })();

  const id = crypto.randomUUID();
  const state = commitCreation(db, {
    object_type: cmd.object_type,
    object_id: id,
    event: cmd.event,
    trace,
    links,
    payload: { command: cmd.action, claim, success_criteria, sources, status: "open" },
    insert: () => {
      const created_at = new Date().toISOString();
      db.query(
        `INSERT INTO hypothesis (id, created_at, claim, success_criteria, sources, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(id, created_at, claim, success_criteria, JSON.stringify(sources), "open");
    },
  });
  return creationResult(cmd, id, cmd.event, state, "open");
}

function registerDatasetVersion(
  db: KernelDb,
  cmd: CreationCommand,
  input: Record<string, unknown>,
  trace: TraceContext,
  links: LinkSpec[],
): ExecuteResult {
  const kind = input.kind;
  if (
    kind !== "odds_history" &&
    kind !== "results" &&
    kind !== "features" &&
    kind !== "mixed"
  ) {
    throw new KernelError(
      'register_dataset_version requires kind in odds_history|results|features|mixed',
    );
  }
  const content_hash = input.content_hash;
  if (typeof content_hash !== "string" || content_hash.length === 0) {
    throw new KernelError('register_dataset_version requires non-empty "content_hash"');
  }
  const as_of = input.as_of;
  if (typeof as_of !== "string" || as_of.length === 0) {
    throw new KernelError('register_dataset_version requires "as_of" ISO datetime');
  }
  const coverage = input.coverage;
  if (!coverage || typeof coverage !== "object" || Array.isArray(coverage)) {
    throw new KernelError('register_dataset_version requires object "coverage"');
  }

  const id = content_hash;
  const existing = db.query(`SELECT * FROM dataset WHERE id = ?`).get(id) as
    | Record<string, unknown>
    | null;
  if (existing) {
    return creationResult(cmd, id, cmd.event, existing);
  }

  const state = commitCreation(db, {
    object_type: cmd.object_type,
    object_id: id,
    event: cmd.event,
    trace,
    links,
    payload: { command: cmd.action, kind, content_hash, as_of, coverage },
    insert: () => {
      const created_at = new Date().toISOString();
      db.query(
        `INSERT INTO dataset (id, created_at, kind, content_hash, as_of, coverage)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(id, created_at, kind, content_hash, as_of, JSON.stringify(coverage));
    },
  });
  return creationResult(cmd, id, cmd.event, state);
}

function createRun(
  db: KernelDb,
  cmd: CreationCommand,
  input: Record<string, unknown>,
  trace: TraceContext,
  links: LinkSpec[],
): ExecuteResult {
  const run_id = input.run_id;
  if (typeof run_id !== "string" || run_id.length === 0) {
    throw new KernelError('create_run requires non-empty "run_id"');
  }
  const kind = input.kind;
  if (
    kind !== "ingestion" &&
    kind !== "feature_build" &&
    kind !== "backtest" &&
    kind !== "analysis" &&
    kind !== "training"
  ) {
    throw new KernelError(
      'create_run requires kind in ingestion|feature_build|backtest|analysis|training',
    );
  }
  const params =
    input.params === undefined
      ? {}
      : typeof input.params === "object" && input.params !== null && !Array.isArray(input.params)
        ? (input.params as Record<string, unknown>)
        : (() => {
            throw new KernelError('create_run "params" must be an object');
          })();
  const runTrace =
    typeof input.trace_id === "string" && input.trace_id.length > 0
      ? input.trace_id
      : trace.trace_id;

  rejectSuppliedInitialState(input, "status", cmd.action);

  const existing = db.query(`SELECT * FROM run WHERE id = ?`).get(run_id) as
    | Record<string, unknown>
    | null;
  if (existing) {
    throw new KernelError(`run "${run_id}" already exists`);
  }

  const state = commitCreation(db, {
    object_type: cmd.object_type,
    object_id: run_id,
    event: cmd.event,
    trace,
    links,
    payload: { command: cmd.action, kind, status: "queued", params, trace_id: runTrace },
    insert: () => {
      const created_at = new Date().toISOString();
      db.query(
        `INSERT INTO run (id, created_at, kind, status, params, trace_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(run_id, created_at, kind, "queued", JSON.stringify(params), runTrace);
    },
  });
  return creationResult(cmd, run_id, cmd.event, state, "queued");
}

function recordEvaluation(
  db: KernelDb,
  cmd: CreationCommand,
  input: Record<string, unknown>,
  trace: TraceContext,
  links: LinkSpec[],
): ExecuteResult {
  const metrics = input.metrics;
  if (!metrics || typeof metrics !== "object" || Array.isArray(metrics)) {
    throw new KernelError('record_evaluation requires object "metrics"');
  }
  const verdict = input.verdict;
  if (verdict !== "supports" && verdict !== "rejects" && verdict !== "inconclusive") {
    throw new KernelError('record_evaluation requires verdict supports|rejects|inconclusive');
  }
  const confidence = input.confidence;
  if (typeof confidence !== "number") {
    throw new KernelError('record_evaluation requires numeric "confidence"');
  }
  const rationale = input.rationale;
  if (typeof rationale !== "string" || rationale.length === 0) {
    throw new KernelError('record_evaluation requires non-empty "rationale"');
  }
  let critic_findings_ref: string | null = null;
  if (input.critic_findings_ref !== undefined && input.critic_findings_ref !== null) {
    if (typeof input.critic_findings_ref !== "string") {
      throw new KernelError('record_evaluation "critic_findings_ref" must be string or null');
    }
    critic_findings_ref = input.critic_findings_ref;
  }

  const mergedLinks = [...lineageFieldsToLinks(input), ...links];
  const id = crypto.randomUUID();
  const state = commitCreation(db, {
    object_type: cmd.object_type,
    object_id: id,
    event: cmd.event,
    trace,
    links: mergedLinks,
    payload: {
      command: cmd.action,
      metrics,
      verdict,
      confidence,
      rationale,
      critic_findings_ref,
      hypothesis_id: input.hypothesis_id ?? null,
      run_id: input.run_id ?? null,
      artifact_id: input.artifact_id ?? null,
    },
    insert: () => {
      const created_at = new Date().toISOString();
      db.query(
        `INSERT INTO evaluation (id, created_at, metrics, critic_findings_ref, verdict, confidence, rationale)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        id,
        created_at,
        JSON.stringify(metrics),
        critic_findings_ref,
        verdict,
        confidence,
        rationale,
      );
    },
  });
  return creationResult(cmd, id, cmd.event, state);
}

function createMission(
  db: KernelDb,
  cmd: CreationCommand,
  input: Record<string, unknown>,
  trace: TraceContext,
  links: LinkSpec[],
): ExecuteResult {
  const name = input.name;
  if (typeof name !== "string" || name.length === 0) {
    throw new KernelError('create_mission requires non-empty "name"');
  }
  const objective = input.objective;
  if (typeof objective !== "string" || objective.length === 0) {
    throw new KernelError('create_mission requires non-empty "objective"');
  }
  const id =
    typeof input.mission_id === "string" && input.mission_id.length > 0
      ? input.mission_id
      : crypto.randomUUID();

  const existing = db.query(`SELECT * FROM mission WHERE id = ?`).get(id) as
    | Record<string, unknown>
    | null;
  if (existing) {
    throw new KernelError(`mission "${id}" already exists`);
  }

  const state = commitCreation(db, {
    object_type: cmd.object_type,
    object_id: id,
    event: cmd.event,
    trace,
    links,
    payload: { command: cmd.action, name, objective },
    insert: () => {
      const created_at = new Date().toISOString();
      db.query(`INSERT INTO mission (id, created_at, name, objective) VALUES (?, ?, ?, ?)`).run(
        id,
        created_at,
        name,
        objective,
      );
    },
  });
  return creationResult(cmd, id, cmd.event, state);
}

function parseTicketFields(
  input: Record<string, unknown>,
  action: string,
): {
  kind: "single" | "parlay";
  external_ref: string;
  placed_at: string;
  legs: unknown[];
  combined_price: number;
  stake: number;
  payout: number | null;
  correlation_note: string;
} {
  rejectSuppliedInitialState(input, "origin", action);
  const kind = input.kind;
  if (kind !== "single" && kind !== "parlay") {
    throw new KernelError(`${action} requires kind single|parlay`);
  }
  const external_ref = input.external_ref;
  if (typeof external_ref !== "string" || external_ref.length === 0) {
    throw new KernelError(`${action} requires non-empty "external_ref"`);
  }
  const placed_at = input.placed_at;
  if (typeof placed_at !== "string" || placed_at.length === 0) {
    throw new KernelError(`${action} requires "placed_at" ISO datetime`);
  }
  if (!Array.isArray(input.legs)) {
    throw new KernelError(`${action} requires array "legs"`);
  }
  const combined_price = input.combined_price;
  if (typeof combined_price !== "number") {
    throw new KernelError(`${action} requires numeric "combined_price"`);
  }
  const stake = input.stake;
  if (typeof stake !== "number") {
    throw new KernelError(`${action} requires numeric "stake"`);
  }
  const correlation_note = input.correlation_note;
  if (typeof correlation_note !== "string") {
    throw new KernelError(`${action} requires string "correlation_note"`);
  }
  let payout: number | null = null;
  if (input.payout !== undefined && input.payout !== null) {
    if (typeof input.payout !== "number") {
      throw new KernelError(`${action} "payout" must be number or null`);
    }
    payout = input.payout;
  }
  return {
    kind,
    external_ref,
    placed_at,
    legs: input.legs,
    combined_price,
    stake,
    payout,
    correlation_note,
  };
}

function insertTicketRow(
  db: KernelDb,
  opts: {
    id: string;
    origin: "strategy_proposed" | "operator_supplied";
    kind: "single" | "parlay";
    external_ref: string;
    placed_at: string;
    legs: unknown[];
    combined_price: number;
    stake: number;
    payout: number | null;
    correlation_note: string;
    grade: string;
  },
): void {
  const created_at = new Date().toISOString();
  db.query(
    `INSERT INTO ticket (id, created_at, origin, kind, external_ref, placed_at, legs, combined_price, stake, payout, correlation_note, grade)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    opts.id,
    created_at,
    opts.origin,
    opts.kind,
    opts.external_ref,
    opts.placed_at,
    JSON.stringify(opts.legs),
    opts.combined_price,
    opts.stake,
    opts.payout,
    opts.correlation_note,
    opts.grade,
  );
}

function createTicket(
  db: KernelDb,
  cmd: CreationCommand,
  input: Record<string, unknown>,
  trace: TraceContext,
  links: LinkSpec[],
): ExecuteResult {
  rejectSuppliedInitialState(input, "grade", cmd.action);
  const fields = parseTicketFields(input, cmd.action);
  const grade = "pending";
  const origin = TICKET_ORIGIN.system;

  const id = fields.external_ref;
  const state = commitCreation(db, {
    object_type: cmd.object_type,
    object_id: id,
    event: cmd.event,
    trace,
    links,
    payload: {
      command: cmd.action,
      origin,
      ...fields,
      grade,
    },
    insert: () => {
      insertTicketRow(db, { id, origin, ...fields, grade });
    },
  });
  return creationResult(cmd, id, cmd.event, state, grade);
}

function observeTicket(
  db: KernelDb,
  cmd: CreationCommand,
  input: Record<string, unknown>,
  trace: TraceContext,
  links: LinkSpec[],
): ExecuteResult {
  const fields = parseTicketFields(input, cmd.action);
  const grade = requireObservedGrade(input, cmd.action, TICKET_GRADES);
  const origin = TICKET_ORIGIN.observed;
  const eventType = observationEvent(cmd.object_type);

  const id = fields.external_ref;
  const state = commitCreation(db, {
    object_type: cmd.object_type,
    object_id: id,
    event: eventType,
    trace,
    links,
    payload: {
      command: cmd.action,
      origin,
      ...fields,
      grade,
      observation: true,
    },
    insert: () => {
      insertTicketRow(db, { id, origin, ...fields, grade });
    },
  });
  return creationResult(cmd, id, eventType, state, grade);
}

/** Single dispatch table — catalog actions must have a handler here. */
export const creationHandlers: Readonly<Record<string, CreationHandler>> = {
  publish_artifact: publishArtifact,
  create_agent_session: createAgentSession,
  register_agent_definition: registerAgentDefinition,
  create_hypothesis: createHypothesis,
  register_dataset_version: registerDatasetVersion,
  create_run: createRun,
  record_evaluation: recordEvaluation,
  create_mission: createMission,
  create_ticket: createTicket,
  observe_ticket: observeTicket,
};

/** Every creationCommands entry must have a handler (D3 join). */
export function assertCreationHandlersComplete(
  catalog: readonly CreationCommand[] = creationCommands,
  handlers: Readonly<Record<string, CreationHandler>> = creationHandlers,
): void {
  for (const cmd of catalog) {
    if (typeof handlers[cmd.action] !== "function") {
      throw new Error(`Creation command "${cmd.action}" has no handler`);
    }
  }
}

/** Dispatch a creation command via the one dispatch table. */
export function executeCreation(
  db: KernelDb,
  cmd: CreationCommand,
  input: Record<string, unknown>,
  trace: TraceContext,
  links: LinkSpec[] = [],
): ExecuteResult {
  const handler = creationHandlers[cmd.action];
  if (!handler) {
    throw new KernelError(`No creation handler for action "${cmd.action}"`);
  }
  return handler(db, cmd, input, trace, links);
}
