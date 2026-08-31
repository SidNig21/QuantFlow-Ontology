/**
 * App-owned ontology gateway — generated read + granted desk actions via Kernel.
 *
 * Seats never open SQLite. They call through MCP → JSON-RPC → these handlers,
 * which refuse any kernel_db that is not the app-owned path (same shape as
 * peer-bus foreign bus_db refusal).
 *
 * All Kernel I/O and schema tool discovery go through kernel.ts (sole-writer).
 */
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { registerMethod } from "./json-rpc-server";
import {
  getArtifactRoot,
  getKernelPath,
  kernelCapabilityGroupForTool,
  kernelCapabilityGroupsForSession,
  kernelExecute,
  kernelGetLinks,
  kernelGetObject,
  kernelListOntologyToolsForGroups,
  kernelParseOntologyActionTool,
  kernelParseOntologyReadTool,
  kernelQueryObjects,
  kernelGovernedReviewContextForSession,
  kernelGovernedReviewNextSequence,
  kernelRecordGovernedToolReceipt,
} from "./kernel";
import { notifySessionCanvasProjection } from "./session-canvas-projector";
import { invokePrecreatedStart } from "./precreated-start-ownership";
import { ontologyTrajectoryContext } from "./ontology-trajectory-context";
import { ontologyReadReceiptEligible } from "./ontology-read-dispatch";
import { ontologyToolsForRole } from "./ontology-role-tools";
import { artifactReceipt } from "./research-world-projection";

type RegisterMethod = typeof registerMethod;

export type OntologyCallerIdentity = {
  sessionId: string;
  role: string;
};

export type OntologyActionChange = {
  action: string;
  identity: OntologyCallerIdentity;
  input: Record<string, unknown>;
  result: unknown;
};

function requireAppOwnedKernelDb(kernelDb: unknown): void {
  if (typeof kernelDb !== "string" || kernelDb.length === 0) {
    throw new Error("ontology gateway requires kernel_db");
  }
  const owned = getKernelPath();
  if (kernelDb !== owned && kernelDb !== process.env.QF_KERNEL_DB) {
    throw new Error("ontology kernel db is not app-owned");
  }
}

function recordTrajectory(
  identity: OntologyCallerIdentity,
  toolName: string,
  args: Record<string, unknown>,
  result: unknown,
  issueReadReceipt = false,
): { artifactId: string } {
  const createdAt = new Date().toISOString();
  const payload = JSON.stringify(
    {
      contract: "qf.ontology.v1",
      tool: toolName,
      arguments: args,
      result,
      session_id: identity.sessionId,
      role: identity.role,
      created_at: createdAt,
      nonce: crypto.randomUUID(),
    },
    null,
    2,
  );
  const contentHash = createHash("sha256").update(payload).digest("hex");
  const artifactDir = join(getArtifactRoot(), "ontology-calls");
  mkdirSync(artifactDir, { recursive: true });
  const storagePath = join(artifactDir, `${contentHash}.json`);
  writeFileSync(storagePath, payload, "utf8");
  const artifact = kernelExecute(
    "publish_artifact",
    {
      kind: "trajectory",
      storage_ref: storagePath,
      path: storagePath,
      content_hash: contentHash,
      links: [{ kind: "produces", from_id: identity.sessionId }],
    },
    ontologyTrajectoryContext(identity, toolName, issueReadReceipt),
  ) as { object_id: string };
  return { artifactId: artifact.object_id };
}

function assertCapability(
  identity: OntologyCallerIdentity,
  toolName: string,
): void {
  const grants = kernelCapabilityGroupsForSession(identity.sessionId);
  const group = kernelCapabilityGroupForTool(toolName);
  if (!group || !grants.includes(group)) {
    throw new Error(
      `ontology capability grant denied: ${group ?? "untagged"} (tool=${toolName})`,
    );
  }
}

export function callOntologyReadTool(
  identity: OntologyCallerIdentity,
  toolName: string,
  args: Record<string, unknown>,
): { result: unknown; artifactId: string } {
  assertCapability(identity, toolName);
  const parsed = kernelParseOntologyReadTool(toolName);
  if (!parsed) {
    throw new Error(`Unknown ontology read tool: ${toolName}`);
  }
  let result: unknown;
  if (parsed.op === "get") {
    const id = args.id;
    if (typeof id !== "string" || id.length === 0) {
      throw new Error(`${toolName} requires id`);
    }
    result = kernelGetObject(parsed.objectName, id);
  } else if (parsed.op === "query") {
    const { limit, offset, order, ...filters } = args;
    result = kernelQueryObjects(
      parsed.objectName,
      filters,
      limit === null ? null : typeof limit === "number" ? limit : undefined,
      typeof offset === "number" ? offset : 0,
      order === "asc" || order === "desc" ? order : "desc",
    );
  } else {
    const id = args.id;
    if (typeof id !== "string" || id.length === 0) {
      throw new Error(`${toolName} requires id`);
    }
    const kind = typeof args.kind === "string" ? args.kind : undefined;
    const direction =
      args.direction === "from" || args.direction === "to" || args.direction === "both"
        ? args.direction
        : undefined;
    const links = kernelGetLinks(id, kind ? { kind } : undefined);
    result = direction === "from"
      ? links.filter((link) => link.from_id === id)
      : direction === "to"
        ? links.filter((link) => link.to_id === id)
        : links;
  }
  const governed = kernelGovernedReviewContextForSession(identity.sessionId);
  if (
    governed &&
    parsed.op === "get" &&
    parsed.objectName === "artifact" &&
    result &&
    typeof result === "object" &&
    !Array.isArray(result)
  ) {
    const row = result as Record<string, unknown>;
    result = {
      id: row.id,
      created_at: row.created_at,
      kind: row.kind,
      content_hash: row.content_hash,
      receipt: artifactReceipt(row),
    };
  }
  if (governed && (toolName === "qf_hypothesis_get" || toolName === "qf_run_get" || toolName === "qf_artifact_get")) {
    kernelRecordGovernedToolReceipt({
      invocation_id: crypto.randomUUID(), session_id: identity.sessionId, task_id: governed.taskId,
      tool_name: toolName, arguments: args, result,
      broker_sequence: kernelGovernedReviewNextSequence(identity.sessionId),
    });
  }
  const { artifactId } = recordTrajectory(
    identity,
    toolName,
    args,
    result,
    ontologyReadReceiptEligible(toolName, kernelCapabilityGroupForTool(toolName)),
  );
  return { result, artifactId };
}

const EXPOSED_ACTIONS = new Set([
  "create_hypothesis",
  "create_agent_session",
  "start_agent_session",
  "execute_deterministic_run",
  "record_evaluation",
]);

/** Granted desk actions plus generated reads. */
export async function callOntologyTool(
  identity: OntologyCallerIdentity,
  toolName: string,
  args: Record<string, unknown>,
  startPrecreatedSession?: (
    caller: OntologyCallerIdentity,
    sessionId: string,
  ) => Promise<unknown>,
  onAction?: (change: OntologyActionChange) => void,
): Promise<{ result: unknown; artifactId: string }> {
  const action = kernelParseOntologyActionTool(toolName);
  if (!action) {
    return callOntologyReadTool(identity, toolName, args);
  }
  if (!EXPOSED_ACTIONS.has(action)) {
    throw new Error(`ontology action not exposed through gateway: ${toolName}`);
  }
  assertCapability(identity, toolName);

  const input: Record<string, unknown> = { ...args };
  const governed = action === "record_evaluation" && identity.role === "critic"
    ? kernelGovernedReviewContextForSession(identity.sessionId)
    : null;
  const governedInvocationId = governed ? crypto.randomUUID() : null;
  if (governed && governedInvocationId) {
    input.review_task_id = governed.taskId;
    input.source_work = governed.sourceWork;
    input.broker_invocation_id = governedInvocationId;
    kernelRecordGovernedToolReceipt({
      invocation_id: governedInvocationId, session_id: identity.sessionId, task_id: governed.taskId,
      tool_name: "qf_record_evaluation", arguments: input, result: { status: "pending" }, success: false,
      broker_sequence: kernelGovernedReviewNextSequence(identity.sessionId),
    });
  }
  if (action === "create_agent_session") {
    if (typeof input.session_id !== "string" || input.session_id.length === 0) {
      input.session_id = `hire-${crypto.randomUUID()}`;
    }
  }

  const result = action === "start_agent_session"
    ? await (() => {
        if (!startPrecreatedSession) {
          throw new Error("ontology gateway precreated admission callback is missing");
        }
        return invokePrecreatedStart(
          identity,
          input.session_id,
          startPrecreatedSession,
        );
      })()
    : kernelExecute(action, input, {
        trace_id: crypto.randomUUID(),
        span_id: crypto.randomUUID(),
        actor_session_id: identity.sessionId,
      });
  notifySessionCanvasProjection();
  const { artifactId } = recordTrajectory(identity, toolName, input, result);
  onAction?.({ action, identity, input, result });
  return { result, artifactId };
}

/** Register JSON-RPC methods for the ontology gateway. */
export function registerOntologyGatewayRpc(
  register: RegisterMethod,
  requireLiveSeat: (
    capability: unknown,
    sessionId: unknown,
    claimedRole: unknown,
  ) => OntologyCallerIdentity,
  startPrecreatedSession: (
    caller: OntologyCallerIdentity,
    sessionId: string,
  ) => Promise<unknown>,
  onAction?: (change: OntologyActionChange) => void,
): void {
  register(
    "qf.ontology.list_tools",
    (params) => {
      if (!params || typeof params !== "object") {
        throw new Error("ontology list_tools requires params");
      }
      const input = params as Record<string, unknown>;
      const identity = requireLiveSeat(
        input.seat_capability,
        input.session_id,
        input.role,
      );
      requireAppOwnedKernelDb(input.kernel_db);
      const grants = kernelCapabilityGroupsForSession(String(input.session_id));
      return {
        tools: ontologyToolsForRole(
          identity.role,
          kernelListOntologyToolsForGroups(grants),
        ),
      };
    },
    { description: "List generated ontology read tools for an admitted seat." },
  );
  register(
    "qf.ontology.call_tool",
    async (params) => {
      if (!params || typeof params !== "object") {
        throw new Error("ontology call_tool requires params");
      }
      const input = params as Record<string, unknown>;
      const identity = requireLiveSeat(
        input.seat_capability,
        input.session_id,
        input.role,
      );
      requireAppOwnedKernelDb(input.kernel_db);
      const name = input.name;
      if (typeof name !== "string" || name.length === 0) {
        throw new Error("ontology call_tool requires name");
      }
      const args =
        input.arguments && typeof input.arguments === "object" && !Array.isArray(input.arguments)
          ? (input.arguments as Record<string, unknown>)
          : {};
      return await callOntologyTool(identity, name, args, startPrecreatedSession, onAction);
    },
    {
      description:
        "Invoke a generated ontology read or granted hire action against the app-owned Kernel; records a trajectory artifact.",
    },
  );
}
