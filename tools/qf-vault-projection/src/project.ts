/**
 * Kernel → Obsidian vault projection (one direction, hash-verified).
 *
 * Vault operations are exactly: clear each owned type folder, then write notes.
 * Vault ops are clear-owned-folders then write notes only. Projected folders are never listed or probed; vault content is never an input.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  contentHash,
  getLinks,
  queryObjects,
  type KernelDb,
  type LinkRow,
} from "qf-kernel";
import type { Schema } from "qf-kernel-schema/define";

const INLINE_ARTIFACT_KINDS = new Set(["report", "strategy_spec"]);

function yamlScalar(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : JSON.stringify(String(value));
  if (typeof value === "string") return JSON.stringify(value);
  return JSON.stringify(JSON.stringify(value));
}

function resolveStoragePath(storageRef: string): string {
  if (storageRef.startsWith("file:")) {
    return fileURLToPath(storageRef);
  }
  return storageRef;
}

function sortRows(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return [...rows].sort((a, b) => {
    const ca = String(a.created_at ?? "");
    const cb = String(b.created_at ?? "");
    if (ca < cb) return -1;
    if (ca > cb) return 1;
    const ia = String(a.id ?? "");
    const ib = String(b.id ?? "");
    if (ia < ib) return -1;
    if (ia > ib) return 1;
    return 0;
  });
}

function sortLinks(links: LinkRow[]): LinkRow[] {
  return [...links].sort((a, b) => {
    if (a.kind < b.kind) return -1;
    if (a.kind > b.kind) return 1;
    if (a.created_at < b.created_at) return -1;
    if (a.created_at > b.created_at) return 1;
    if (a.id < b.id) return -1;
    if (a.id > b.id) return 1;
    return 0;
  });
}

function frontmatter(row: Record<string, unknown>): string {
  const keys = Object.keys(row).sort();
  const lines = ["---"];
  for (const key of keys) {
    lines.push(`${key}: ${yamlScalar(row[key])}`);
  }
  lines.push("---");
  return lines.join("\n");
}

function renderLinks(objectId: string, links: LinkRow[]): string {
  if (links.length === 0) return "";
  const lines = ["", "## Links", ""];
  for (const link of sortLinks(links)) {
    const other = link.from_id === objectId ? link.to_id : link.from_id;
    lines.push(`- ${link.kind}: [[${other}]]`);
  }
  return lines.join("\n");
}

/**
 * Hash-verify artifact bytes at storage_ref against the Kernel content_hash column.
 * Never compares id to content_hash; never hashes anything but file bytes.
 */
function renderArtifactBody(row: Record<string, unknown>): string {
  const storageRef = String(row.storage_ref ?? "");
  const publishedHash = String(row.content_hash ?? "");
  const kind = String(row.kind ?? "");

  if (!storageRef) {
    return [
      "",
      "## Content",
      "",
      "**Missing file:** storage_ref is empty; nothing to verify.",
      "",
    ].join("\n");
  }

  const path = resolveStoragePath(storageRef);
  let bytes: Uint8Array;
  try {
    const buf = readFileSync(path);
    bytes = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  } catch {
    return [
      "",
      "## Content",
      "",
      `**Missing file:** the file at \`${storageRef}\` is gone.`,
      "",
    ].join("\n");
  }

  const diskHash = contentHash(bytes);
  if (diskHash !== publishedHash) {
    return [
      "",
      "## Content",
      "",
      "**Hash mismatch:** the file on disk no longer matches the published artifact.",
      `- published content_hash: \`${publishedHash}\``,
      `- disk hash: \`${diskHash}\``,
      "",
    ].join("\n");
  }

  if (INLINE_ARTIFACT_KINDS.has(kind)) {
    const text = new TextDecoder().decode(bytes);
    return ["", "## Content", "", text, ""].join("\n");
  }

  return [
    "",
    "## Content",
    "",
    `Verified bytes at \`${storageRef}\`.`,
    "",
  ].join("\n");
}

function renderNote(
  typeName: string,
  row: Record<string, unknown>,
  links: LinkRow[],
): string {
  const id = String(row.id);
  const parts = [frontmatter(row), renderLinks(id, links)];
  if (typeName === "artifact") {
    parts.push(renderArtifactBody(row));
  }
  // Deterministic trailing newline
  let body = parts.join("\n");
  if (!body.endsWith("\n")) body += "\n";
  return body;
}

/** Clear every owned type folder (schema-driven), then write notes from the Kernel. */
export function projectVault(
  db: KernelDb,
  vaultRoot: string,
  schema: Schema,
): { notesWritten: number; typesProjected: string[] } {
  const ownedFolders = schema.objects.map((o) => o.name);

  // Clear owned folders without listing vault state: rm by known type names only.
  for (const typeName of ownedFolders) {
    rmSync(join(vaultRoot, typeName), { recursive: true, force: true });
  }

  let notesWritten = 0;
  const typesProjected: string[] = [];

  for (const object of schema.objects) {
    const typeName = object.name;
    // limit: null is mandatory — default 100 would silently truncate.
    const rows = sortRows(queryObjects(db, typeName, undefined, null, 0, schema));
    if (rows.length === 0) continue;

    const dir = join(vaultRoot, typeName);
    mkdirSync(dir, { recursive: true });
    typesProjected.push(typeName);

    for (const row of rows) {
      const id = String(row.id);
      const links = getLinks(db, id);
      const note = renderNote(typeName, row, links);
      writeFileSync(join(dir, `${id}.md`), note, "utf8");
      notesWritten += 1;
    }
  }

  return { notesWritten, typesProjected };
}
