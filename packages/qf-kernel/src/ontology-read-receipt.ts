import { readFileSync } from "node:fs";
import { schema } from "qf-kernel-schema";
import type { KernelDb } from "./db.ts";
import { KernelError } from "./errors.ts";
import { contentHash } from "./hash.ts";

export type OntologyReadReceipt = {
  contract: "qf.ontology.v1";
  actor_session_id: string;
  tool: string;
};

const GENERATED_READ_TOOLS = new Set(
  schema.objects
    .filter((object) => object.capabilityGroup === "market.read")
    .flatMap((object) => [
      `qf_${object.name}_get`,
      `qf_${object.name}_query`,
      `qf_${object.name}_links`,
    ]),
);

function parsePayload(bytes: Uint8Array): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new KernelError("ontology read receipt bytes must be valid JSON");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new KernelError("ontology read receipt bytes must contain a JSON object");
  }
  return parsed as Record<string, unknown>;
}

/** Validate bytes against app-internal, token-bound read provenance. */
export function validateOntologyReadPublication(
  bytes: Uint8Array,
  actorSessionId: string | undefined,
  tool: string,
): OntologyReadReceipt {
  if (!actorSessionId) {
    throw new KernelError("ontology_read_tool requires trusted actor_session_id context");
  }
  if (!GENERATED_READ_TOOLS.has(tool)) {
    throw new KernelError(`ontology_read_tool is not a generated market.read tool: ${tool}`);
  }
  const payload = parsePayload(bytes);
  if (payload.contract !== "qf.ontology.v1") {
    throw new KernelError("ontology read receipt contract must be qf.ontology.v1");
  }
  if (payload.tool !== tool) {
    throw new KernelError("ontology read receipt tool does not match trusted context");
  }
  if (payload.session_id !== actorSessionId) {
    throw new KernelError("ontology read receipt session does not match trusted actor");
  }
  if (!Object.prototype.hasOwnProperty.call(payload, "result")) {
    throw new KernelError("ontology read receipt is missing result");
  }
  if (!payload.arguments || typeof payload.arguments !== "object" || Array.isArray(payload.arguments)) {
    throw new KernelError("ontology read receipt arguments must be an object");
  }
  if (typeof payload.created_at !== "string" || payload.created_at.length === 0) {
    throw new KernelError("ontology read receipt is missing created_at");
  }
  if (typeof payload.nonce !== "string" || payload.nonce.length === 0) {
    throw new KernelError("ontology read receipt is missing nonce");
  }
  return { contract: "qf.ontology.v1", actor_session_id: actorSessionId, tool };
}

/** Revalidate durable bytes, hash identity, and the Kernel-issued publication receipt. */
export function assertDurableOntologyReadReceipt(
  db: KernelDb,
  artifactId: string,
  actorSessionId: string,
): void {
  const artifact = db.query(
    `SELECT kind, content_hash, storage_ref FROM artifact WHERE id = ?`,
  ).get(artifactId) as
    | { kind: string; content_hash: string; storage_ref: string }
    | null;
  if (artifact?.kind !== "trajectory") {
    throw new KernelError("ontology read receipt must name a trajectory artifact");
  }

  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(readFileSync(artifact.storage_ref));
  } catch {
    throw new KernelError("ontology read receipt durable bytes are unavailable");
  }
  const computed = contentHash(bytes);
  if (computed !== artifactId || computed !== artifact.content_hash) {
    throw new KernelError("ontology read receipt durable bytes do not match artifact hash");
  }

  const events = db.query(
    `SELECT payload FROM events
      WHERE type = 'artifact.published' AND object_type = 'artifact' AND object_id = ?`,
  ).all(artifactId) as Array<{ payload: string }>;
  if (events.length !== 1) {
    throw new KernelError("ontology read artifact must have exactly one publication receipt");
  }
  let eventPayload: Record<string, unknown>;
  try {
    const parsed = JSON.parse(events[0]!.payload) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    eventPayload = parsed as Record<string, unknown>;
  } catch {
    throw new KernelError("ontology read publication receipt is malformed");
  }
  const marker = eventPayload.ontology_read_receipt;
  if (!marker || typeof marker !== "object" || Array.isArray(marker)) {
    throw new KernelError("trajectory lacks a Kernel-issued ontology read receipt");
  }
  const receipt = marker as Record<string, unknown>;
  if (
    receipt.contract !== "qf.ontology.v1" ||
    receipt.actor_session_id !== actorSessionId ||
    typeof receipt.tool !== "string"
  ) {
    throw new KernelError("ontology read publication receipt does not match assigned worker");
  }
  validateOntologyReadPublication(bytes, actorSessionId, receipt.tool);
}
