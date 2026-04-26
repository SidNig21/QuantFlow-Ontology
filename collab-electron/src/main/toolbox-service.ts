import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { readFile, writeFile, rename, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { COLLAB_DIR } from "./paths";

const TOOLBOX_FILE = join(COLLAB_DIR, "toolbox.json");

export interface ToolboxEntry {
  id: string;
  name: string;
  kind: string;
  command?: string;
  cwd?: string;
  capabilities?: string[];
  tags?: string[];
  notes?: string;
  refs?: string[];
}

function normalizeStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length > 0 ? items : undefined;
}

function normalizeEntry(value: unknown, index: number): ToolboxEntry | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const name = typeof record.name === "string" ? record.name.trim() : "";
  if (!name) return null;
  const id = typeof record.id === "string" && record.id.trim()
    ? record.id.trim()
    : `tool-${index + 1}`;
  const kind = typeof record.kind === "string" && record.kind.trim()
    ? record.kind.trim()
    : "tool";
  return {
    id,
    name,
    kind,
    command: typeof record.command === "string" ? record.command : undefined,
    cwd: typeof record.cwd === "string" ? record.cwd : undefined,
    capabilities: normalizeStringArray(record.capabilities),
    tags: normalizeStringArray(record.tags),
    notes: typeof record.notes === "string" ? record.notes : undefined,
    refs: normalizeStringArray(record.refs),
  };
}

function normalizeEntries(value: unknown): ToolboxEntry[] {
  const source = Array.isArray(value)
    ? value
    : Array.isArray((value as { entries?: unknown })?.entries)
      ? (value as { entries: unknown[] }).entries
      : [];
  return source
    .map((entry, index) => normalizeEntry(entry, index))
    .filter((entry): entry is ToolboxEntry => Boolean(entry));
}

export async function listToolboxEntries(): Promise<{
  path: string;
  entries: ToolboxEntry[];
}> {
  try {
    const raw = await readFile(TOOLBOX_FILE, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    return {
      path: TOOLBOX_FILE,
      entries: normalizeEntries(parsed),
    };
  } catch {
    return { path: TOOLBOX_FILE, entries: [] };
  }
}

export async function findToolboxEntry(
  entryId: string,
): Promise<ToolboxEntry | null> {
  const { entries } = await listToolboxEntries();
  return entries.find((entry) => entry.id === entryId) ?? null;
}

export async function saveToolboxEntries(
  value: unknown,
): Promise<{ path: string; entries: ToolboxEntry[] }> {
  const entries = normalizeEntries(value);
  if (!existsSync(COLLAB_DIR)) {
    await mkdir(COLLAB_DIR, { recursive: true });
  }
  const tmp = join(tmpdir(), `toolbox-${randomUUID()}.json`);
  await writeFile(
    tmp,
    JSON.stringify({ version: 1, entries }, null, 2),
    "utf-8",
  );
  await rename(tmp, TOOLBOX_FILE);
  return { path: TOOLBOX_FILE, entries };
}
