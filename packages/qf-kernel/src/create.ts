import { readFileSync } from "node:fs";
import { creationCommands, type CreationCommand } from "qf-kernel-schema/commands";
import type { KernelDb } from "./db.ts";
import {
  AgentSessionIdentityLinkRejectedError,
  AgentDefinitionExistsError,
  ArtifactMetadataConflictError,
  ContentHashMismatchError,
  DelegatesToLinkRejectedError,
  KernelError,
  SpawnedFromLinkRejectedError,
  TaskCreationEnvelopeRejectedError,
  UnknownAgentDefinitionError,
  UnknownAssigneeSessionError,
} from "./errors.ts";
import { appendEvent } from "./events.ts";
import type { ContextExecuteResult, ObjectExecuteResult } from "./results.ts";
import { contentHash } from "./hash.ts";
import {
  lineageFieldsToLinks,
  type CreationEnvelopePresence,
  type LinkSpec,
  writeLinks,
} from "./links.ts";
import { registerVenue, scheduleMarketEvent } from "./market-context.ts";
import type { TraceContext, TrustedExecutionContext } from "./trace.ts";
import {
  assertDurableOntologyReadReceipt,
  validateOntologyReadPublication,
} from "./ontology-read-receipt.ts";
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
  trace: TrustedExecutionContext,
  links: LinkSpec[],
  envelope?: CreationEnvelopePresence,
) => ObjectExecuteResult | ContextExecuteResult;

function creationResult(
  cmd: CreationCommand,
  id: string,
  event: string,
  state: Record<string, unknown>,
  to = "exists",
): ObjectExecuteResult {
  return {
    kind: "object",
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
  trace: TrustedExecutionContext,
  links: LinkSpec[],
): ObjectExecuteResult {
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

  let effectiveLinks = links;
  if (kind === "report") {
    if (links.some((link) => link.kind === "gates")) {
      throw new KernelError(
        "publish_artifact report gate is Kernel-owned; supply evaluation_id instead of a gates link",
      );
    }
    const evaluationId = input.evaluation_id;
    if (typeof evaluationId !== "string" || evaluationId.length === 0) {
      throw new KernelError("publish_artifact report requires evaluation_id");
    }
    const evaluation = db
      .query(`SELECT verdict FROM evaluation WHERE id = ?`)
      .get(evaluationId) as { verdict: string } | null;
    if (evaluation?.verdict !== "supports") {
      throw new KernelError(
        "publish_artifact report requires an Evaluation with verdict supports",
      );
    }
    const hypotheses = db
      .query(
        `SELECT links.from_id
           FROM links
           JOIN hypothesis ON hypothesis.id = links.from_id
          WHERE links.kind = 'evaluated_by' AND links.to_id = ?`,
      )
      .all(evaluationId) as Array<{ from_id: string }>;
    if (hypotheses.length !== 1) {
      throw new KernelError(
        "publish_artifact report requires an Evaluation tied to exactly one hypothesis",
      );
    }
    effectiveLinks = [...links, { kind: "gates", from_id: evaluationId }];
  } else if (input.evaluation_id !== undefined) {
    throw new KernelError("publish_artifact evaluation_id is valid only for kind report");
  }

  const bytes = resolveBytes(input);
  const computed = contentHash(bytes);
  if (typeof input.content_hash === "string" && input.content_hash.length > 0) {
    if (input.content_hash !== computed) {
      throw new ContentHashMismatchError(input.content_hash, computed);
    }
  }

  const ontologyReadReceipt = trace.ontology_read_tool
    ? validateOntologyReadPublication(bytes, trace.actor_session_id, trace.ontology_read_tool)
    : undefined;
  if (ontologyReadReceipt) {
    const producerLinks = effectiveLinks.filter((link) => link.kind === "produces");
    if (
      effectiveLinks.length !== 1 ||
      producerLinks.length !== 1 ||
      producerLinks[0]!.from_id !== ontologyReadReceipt.actor_session_id
    ) {
      throw new KernelError(
        "ontology read publication requires exactly one produces link from trusted actor",
      );
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
    if (ontologyReadReceipt) {
      assertDurableOntologyReadReceipt(db, id, ontologyReadReceipt.actor_session_id);
    }
    if (kind === "report") {
      const existingGates = db
        .query(`SELECT from_id FROM links WHERE kind = 'gates' AND to_id = ?`)
        .all(id) as Array<{ from_id: string }>;
      if (
        existingGates.length !== 1 ||
        existingGates[0]!.from_id !== input.evaluation_id
      ) {
        throw new KernelError(
          "publish_artifact report already exists without the requested Evaluation gate",
        );
      }
    }
    return creationResult(cmd, id, cmd.event, existing);
  }

  const state = commitCreation(db, {
    object_type: cmd.object_type,
    object_id: id,
    event: cmd.event,
    trace,
    links: effectiveLinks,
    payload: {
      command: cmd.action,
      kind,
      content_hash: computed,
      storage_ref,
      ...(ontologyReadReceipt ? { ontology_read_receipt: ontologyReadReceipt } : {}),
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
): ObjectExecuteResult {
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
  let capability_groups: string[] = [];
  if (input.capability_groups !== undefined && input.capability_groups !== null) {
    if (!Array.isArray(input.capability_groups)) {
      throw new KernelError(
        'register_agent_definition "capability_groups" must be an array',
      );
    }
    for (const group of input.capability_groups) {
      if (group !== "market.read" && group !== "desk.orchestrate") {
        throw new KernelError(
          'register_agent_definition "capability_groups" entries must be market.read or desk.orchestrate',
        );
      }
      capability_groups.push(group);
    }
  }
  const capability_groups_json = JSON.stringify(capability_groups);

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
      capability_groups,
    },
    insert: () => {
      const created_at = new Date().toISOString();
      db.query(
        `INSERT INTO agent_definition (id, created_at, name, role, package_ref, runtime_profile, system_prompt_ref, capability_groups)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        id,
        created_at,
        name,
        role,
        package_ref,
        runtime_profile,
        system_prompt_ref,
        capability_groups_json,
      );
    },
  });
  return creationResult(cmd, id, cmd.event, state);
}

function createAgentSession(
  db: KernelDb,
  cmd: CreationCommand,
  input: Record<string, unknown>,
  trace: TrustedExecutionContext,
  links: LinkSpec[],
): ObjectExecuteResult {
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
    if (spec.kind === "delegates_to") {
      throw new DelegatesToLinkRejectedError();
    }
    if (["assigned_to", "delegated_by", "produces"].includes(spec.kind)) {
      throw new AgentSessionIdentityLinkRejectedError(spec.kind);
    }
  }

  const definition = db
    .query(`SELECT id FROM agent_definition WHERE id = ?`)
    .get(agent_definition_id) as { id: string } | null;
  if (!definition) {
    throw new UnknownAgentDefinitionError(agent_definition_id);
  }

  const delegator_session_id = trace.actor_session_id;
  if (delegator_session_id) {
    const delegator = db
      .query(`SELECT id FROM agent_session WHERE id = ?`)
      .get(delegator_session_id) as { id: string } | null;
    if (!delegator) {
      throw new KernelError(`unknown trusted actor_session_id: ${delegator_session_id}`);
    }
  }

  const identityLinks: LinkSpec[] = [
    ...links,
    { kind: "spawned_from", to_id: agent_definition_id },
    ...(delegator_session_id
      ? [{ kind: "delegates_to", from_id: delegator_session_id }]
      : []),
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
      ...(delegator_session_id ? { delegator_session_id } : {}),
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

function createTask(
  db: KernelDb,
  cmd: CreationCommand,
  input: Record<string, unknown>,
  trace: TrustedExecutionContext,
  links: LinkSpec[],
  envelope: CreationEnvelopePresence = { links: links.length > 0, bytes: false },
): ObjectExecuteResult {
  const task_id = input.task_id;
  if (typeof task_id !== "string" || task_id.length === 0) {
    throw new KernelError(
      'create_task requires non-empty "task_id" (guest-minted, adopted)',
    );
  }
  const title = input.title;
  if (typeof title !== "string" || title.length === 0) {
    throw new KernelError('create_task requires non-empty "title"');
  }
  const description = input.description;
  if (typeof description !== "string" || description.length === 0) {
    throw new KernelError('create_task requires non-empty "description"');
  }
  const assignee_session_id = input.assignee_session_id;
  if (typeof assignee_session_id !== "string" || assignee_session_id.length === 0) {
    throw new KernelError('create_task requires non-empty "assignee_session_id"');
  }

  if (links.length > 0) {
    throw new TaskCreationEnvelopeRejectedError("links");
  }
  if (envelope.bytes) {
    throw new TaskCreationEnvelopeRejectedError("bytes");
  }

  const delegator_session_id = trace.actor_session_id;
  if (!delegator_session_id) {
    throw new KernelError("create_task requires trusted actor_session_id context");
  }

  const session = db
    .query(`SELECT id FROM agent_session WHERE id = ?`)
    .get(assignee_session_id) as { id: string } | null;
  if (!session) {
    throw new UnknownAssigneeSessionError(assignee_session_id);
  }
  const delegator = db
    .query(`SELECT id FROM agent_session WHERE id = ?`)
    .get(delegator_session_id) as { id: string } | null;
  if (!delegator) {
    throw new KernelError(`unknown trusted actor_session_id: ${delegator_session_id}`);
  }

  const identityLinks: LinkSpec[] = [
    { kind: "delegated_by", to_id: delegator_session_id },
    { kind: "assigned_to", to_id: assignee_session_id },
  ];

  const state = commitCreation(db, {
    object_type: cmd.object_type,
    object_id: task_id,
    event: cmd.event,
    trace,
    links: identityLinks,
    payload: {
      command: cmd.action,
      status: "open",
      title,
      description,
      delegator_session_id,
      assignee_session_id,
    },
    insert: () => {
      const created_at = new Date().toISOString();
      db.query(
        `INSERT INTO task (id, created_at, title, description, status)
         VALUES (?, ?, ?, ?, ?)`,
      ).run(task_id, created_at, title, description, "open");
    },
  });
  return creationResult(cmd, task_id, cmd.event, state, "open");
}

const CONNECTION_KINDS = new Set(["data", "control", "view"]);
const PORT_REF_RE = /^[^:]+:[nesw]$/;

function parseConnectionTile(portRef: string): string {
  const colon = portRef.lastIndexOf(":");
  return colon === -1 ? portRef : portRef.slice(0, colon);
}

function createConnection(
  db: KernelDb,
  cmd: CreationCommand,
  input: Record<string, unknown>,
  trace: TrustedExecutionContext,
  links: LinkSpec[],
): ObjectExecuteResult {
  const connection_id = input.connection_id;
  if (typeof connection_id !== "string" || connection_id.length === 0) {
    throw new KernelError(
      'create_connection requires non-empty "connection_id" (guest-minted, adopted)',
    );
  }
  const kind = input.kind;
  if (typeof kind !== "string" || !CONNECTION_KINDS.has(kind)) {
    throw new KernelError(
      'create_connection requires kind in data|control|view',
    );
  }
  const from_ref = input.from_ref;
  if (typeof from_ref !== "string" || !PORT_REF_RE.test(from_ref)) {
    throw new KernelError(
      'create_connection requires from_ref as tileId:side with side in n|e|s|w',
    );
  }
  const to_ref = input.to_ref;
  if (typeof to_ref !== "string" || !PORT_REF_RE.test(to_ref)) {
    throw new KernelError(
      'create_connection requires to_ref as tileId:side with side in n|e|s|w',
    );
  }
  if (parseConnectionTile(from_ref) === parseConnectionTile(to_ref)) {
    throw new KernelError(
      "create_connection rejects self-loops (from and to must name different tiles)",
    );
  }

  const existingId = db
    .query(
      `SELECT id FROM connection WHERE from_ref = ? AND to_ref = ? AND kind = ?`,
    )
    .get(from_ref, to_ref, kind) as { id: string } | null;
  if (existingId) {
    throw new KernelError(
      `create_connection rejects duplicate from/to/kind (existing ${existingId.id})`,
    );
  }

  const state = commitCreation(db, {
    object_type: cmd.object_type,
    object_id: connection_id,
    event: cmd.event,
    trace,
    links,
    payload: {
      command: cmd.action,
      kind,
      from_ref,
      to_ref,
    },
    insert: () => {
      const created_at = new Date().toISOString();
      db.query(
        `INSERT INTO connection (id, created_at, kind, from_ref, to_ref)
         VALUES (?, ?, ?, ?, ?)`,
      ).run(connection_id, created_at, kind, from_ref, to_ref);
    },
  });
  return creationResult(cmd, connection_id, cmd.event, state, "exists");
}

function deleteConnection(
  db: KernelDb,
  cmd: CreationCommand,
  input: Record<string, unknown>,
  trace: TraceContext,
  _links: LinkSpec[],
): ObjectExecuteResult {
  const connection_id = input.connection_id;
  if (typeof connection_id !== "string" || connection_id.length === 0) {
    throw new KernelError(
      'delete_connection requires non-empty "connection_id"',
    );
  }

  const prior = db
    .query(`SELECT * FROM connection WHERE id = ?`)
    .get(connection_id) as Record<string, unknown> | null;
  if (!prior) {
    throw new KernelError(`delete_connection: unknown connection_id ${connection_id}`);
  }

  const tx = db.transaction(() => {
    db.query(`DELETE FROM connection WHERE id = ?`).run(connection_id);
    appendEvent(db, {
      type: cmd.event,
      object_type: cmd.object_type,
      object_id: connection_id,
      payload: {
        command: cmd.action,
        kind: prior.kind,
        from_ref: prior.from_ref,
        to_ref: prior.to_ref,
        span_id: trace.span_id,
      },
      trace_id: trace.trace_id,
    });
  });
  tx();

  return {
    kind: "object",
    object_type: cmd.object_type,
    object_id: connection_id,
    from: "exists",
    to: "(none)",
    event: cmd.event,
    state: {},
  };
}

function createHypothesis(
  db: KernelDb,
  cmd: CreationCommand,
  input: Record<string, unknown>,
  trace: TraceContext,
  links: LinkSpec[],
): ObjectExecuteResult {
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
): ObjectExecuteResult {
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
  const artifact_id = input.artifact_id;
  if (typeof artifact_id !== "string" || artifact_id.length === 0) {
    throw new KernelError('register_dataset_version requires non-empty "artifact_id"');
  }
  const as_of = input.as_of;
  if (typeof as_of !== "string" || as_of.length === 0) {
    throw new KernelError('register_dataset_version requires "as_of" ISO datetime');
  }
  const coverage = input.coverage;
  if (!coverage || typeof coverage !== "object" || Array.isArray(coverage)) {
    throw new KernelError('register_dataset_version requires object "coverage"');
  }
  if (links.some((link) => link.kind === "derived_from")) {
    throw new KernelError(
      "register_dataset_version artifact lineage is Kernel-owned; supply artifact_id",
    );
  }

  const artifact = db
    .query(`SELECT kind, content_hash, storage_ref FROM artifact WHERE id = ?`)
    .get(artifact_id) as
    | { kind: string; content_hash: string; storage_ref: string }
    | null;
  if (artifact?.kind !== "result_set") {
    throw new KernelError(
      "register_dataset_version artifact_id must name an existing result_set Artifact",
    );
  }
  if (artifact_id !== content_hash || artifact.content_hash !== content_hash) {
    throw new KernelError(
      "register_dataset_version content_hash must match the immutable Artifact identity",
    );
  }

  let bytes: Uint8Array;
  try {
    const storage = artifact.storage_ref.startsWith("file:")
      ? new URL(artifact.storage_ref)
      : artifact.storage_ref;
    bytes = new Uint8Array(readFileSync(storage));
  } catch {
    throw new KernelError("register_dataset_version Artifact bytes are unavailable");
  }
  if (contentHash(bytes) !== content_hash) {
    throw new KernelError(
      "register_dataset_version durable Artifact bytes do not match content_hash",
    );
  }

  let payload: Record<string, unknown>;
  try {
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    payload = parsed as Record<string, unknown>;
  } catch {
    throw new KernelError("register_dataset_version Artifact must contain qf.dataset.v1 JSON");
  }
  if (payload.contract !== "qf.dataset.v1" || !Array.isArray(payload.observations)) {
    throw new KernelError("register_dataset_version Artifact must contain qf.dataset.v1 observations");
  }
  const asOfMs = Date.parse(as_of);
  let maxObservedMs = Number.NEGATIVE_INFINITY;
  let maxObservedAt: string | null = null;
  for (const observation of payload.observations) {
    if (!observation || typeof observation !== "object" || Array.isArray(observation)) {
      throw new KernelError("register_dataset_version observations must be objects");
    }
    const observedAt = (observation as Record<string, unknown>).observed_at;
    const observedMs = typeof observedAt === "string" ? Date.parse(observedAt) : Number.NaN;
    if (!Number.isFinite(observedMs)) {
      throw new KernelError(
        "register_dataset_version every observation requires ISO observed_at",
      );
    }
    if (observedMs > asOfMs) {
      throw new KernelError(
        `register_dataset_version observation ${observedAt} is after as_of ${as_of}`,
      );
    }
    if (observedMs > maxObservedMs) {
      maxObservedMs = observedMs;
      maxObservedAt = observedAt as string;
    }
  }
  const verifiedCoverage = {
    ...(coverage as Record<string, unknown>),
    record_count: payload.observations.length,
    max_observed_at: maxObservedAt,
  };
  const effectiveLinks = [...links, { kind: "derived_from", to_id: artifact_id }];

  const id = `dataset:${content_hash}`;
  const existing = db.query(`SELECT * FROM dataset WHERE id = ?`).get(id) as
    | Record<string, unknown>
    | null;
  if (existing) {
    if (
      existing.kind !== kind ||
      existing.as_of !== as_of ||
      existing.coverage !== JSON.stringify(verifiedCoverage)
    ) {
      throw new KernelError(
        "register_dataset_version immutable Dataset already exists with different metadata",
      );
    }
    const lineage = db
      .query(`SELECT to_id FROM links WHERE kind = 'derived_from' AND from_id = ?`)
      .all(id) as Array<{ to_id: string }>;
    if (lineage.length !== 1 || lineage[0]!.to_id !== artifact_id) {
      throw new KernelError(
        "register_dataset_version existing Dataset lacks exact Artifact lineage",
      );
    }
    return creationResult(cmd, id, cmd.event, existing);
  }

  const state = commitCreation(db, {
    object_type: cmd.object_type,
    object_id: id,
    event: cmd.event,
    trace,
    links: effectiveLinks,
    payload: {
      command: cmd.action,
      kind,
      content_hash,
      as_of,
      coverage: verifiedCoverage,
      artifact_id,
    },
    insert: () => {
      const created_at = new Date().toISOString();
      db.query(
        `INSERT INTO dataset (id, created_at, kind, content_hash, as_of, coverage)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(id, created_at, kind, content_hash, as_of, JSON.stringify(verifiedCoverage));
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
): ObjectExecuteResult {
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
): ObjectExecuteResult {
  if (links.some((link) => link.kind === "evaluated_by")) {
    throw new KernelError(
      "record_evaluation lineage is Kernel-owned; use hypothesis_id, run_id, or artifact_id",
    );
  }
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
): ObjectExecuteResult {
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
): ObjectExecuteResult {
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
): ObjectExecuteResult {
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
  create_task: createTask,
  create_connection: createConnection,
  delete_connection: deleteConnection,
  register_agent_definition: registerAgentDefinition,
  create_hypothesis: createHypothesis,
  register_dataset_version: registerDatasetVersion,
  create_run: createRun,
  record_evaluation: recordEvaluation,
  create_mission: createMission,
  create_ticket: createTicket,
  observe_ticket: observeTicket,
  register_venue: registerVenue,
  schedule_market_event: scheduleMarketEvent,
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
  trace: TrustedExecutionContext,
  links: LinkSpec[] = [],
  envelope: CreationEnvelopePresence = { links: links.length > 0, bytes: false },
): ObjectExecuteResult | ContextExecuteResult {
  const handler = creationHandlers[cmd.action];
  if (!handler) {
    throw new KernelError(`No creation handler for action "${cmd.action}"`);
  }
  return handler(db, cmd, input, trace, links, envelope);
}
