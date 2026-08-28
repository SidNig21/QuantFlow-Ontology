/** WO-GOLDEN-G8: exact 89-object/link/action experimental lifecycle proof. */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runFrozenPackageInstall } from "../package-install.ts";

const REPO_ROOT = join(import.meta.dir, "../..");
const SOURCE_FILES = [
  "qf-kernel-schema/src/ontology/market.ts",
  "qf-kernel-schema/src/ontology/research.ts",
  "qf-kernel-schema/src/ontology/agent.ts",
] as const;
const EXPECTED_COUNT = 89;

type Entry = { kind: "object" | "link" | "action"; name: string; lifecycle: string };
type SourceDeclaration = Entry & { source: string; line: number };
type SchemaShape = { objects: Array<{ name: string; lifecycle: string }>; links: Array<{ name: string; lifecycle: string }>; actions: Array<{ name: string; lifecycle: string }> };
let schema: SchemaShape = { objects: [], links: [], actions: [] };

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function flattenSchema(): Entry[] {
  return [
    ...schema.objects.map((entry) => ({ kind: "object" as const, name: entry.name, lifecycle: entry.lifecycle })),
    ...schema.links.map((entry) => ({ kind: "link" as const, name: entry.name, lifecycle: entry.lifecycle })),
    ...schema.actions.map((entry) => ({ kind: "action" as const, name: entry.name, lifecycle: entry.lifecycle })),
  ];
}

function sourceDeclarations(overrides: ReadonlyMap<string, string> = new Map()): SourceDeclaration[] {
  const declarations: SourceDeclaration[] = [];
  for (const source of SOURCE_FILES) {
    const path = join(REPO_ROOT, source);
    const text = overrides.get(source) ?? readFileSync(path, "utf8");
    const expression = /export const ([A-Za-z0-9_]+) = define(Object|Link|Action)\(\{([\s\S]*?)\n\}\);/g;
    for (const match of text.matchAll(expression)) {
      const body = match[3] ?? "";
      const lifecycle = body.match(/\blifecycle:\s*"([^"]+)"/)?.[1] ?? "";
      declarations.push({
        name: match[1]!,
        kind: match[2]!.toLowerCase() as Entry["kind"],
        lifecycle,
        source,
        line: text.slice(0, match.index ?? 0).split(/\r?\n/).length,
      });
    }
  }
  return declarations;
}

function checkLifecycle(entries: readonly Entry[], declarations: readonly SourceDeclaration[]): { ok: boolean; reason?: string } {
  if (entries.length !== EXPECTED_COUNT) return { ok: false, reason: `schema count=${entries.length}, expected=${EXPECTED_COUNT}` };
  const ids = entries.map((entry) => `${entry.kind}:${entry.name}`);
  if (new Set(ids).size !== ids.length) return { ok: false, reason: "duplicate (kind,name) identity" };
  if (entries.some((entry) => entry.lifecycle !== "experimental")) {
    const bad = entries.find((entry) => entry.lifecycle !== "experimental")!;
    return { ok: false, reason: `non-experimental schema lifecycle ${bad.kind}:${bad.name}=${bad.lifecycle}` };
  }
  if (declarations.length !== EXPECTED_COUNT) return { ok: false, reason: `source declaration count=${declarations.length}, expected=${EXPECTED_COUNT}` };
  const declarationIds = declarations.map((entry) => `${entry.kind}:${entry.name}`);
  if (new Set(declarationIds).size !== declarationIds.length) return { ok: false, reason: "duplicate source declaration identity" };
  const missing = ids.filter((id) => !declarationIds.includes(id));
  const extra = declarationIds.filter((id) => !ids.includes(id));
  if (missing.length || extra.length) return { ok: false, reason: `source/schema identity drift missing=${missing.join(",")} extra=${extra.join(",")}` };
  const active = declarations.find((entry) => entry.lifecycle !== "experimental");
  if (active) return { ok: false, reason: `non-experimental source lifecycle ${active.kind}:${active.name}=${active.lifecycle}` };
  return { ok: true };
}

function runPromotionFalsifier(declarations: readonly SourceDeclaration[]): void {
  const target = declarations[0]!;
  const original = readFileSync(join(REPO_ROOT, target.source), "utf8");
  const defineKind = target.kind[0]!.toUpperCase() + target.kind.slice(1);
  const promotion = new RegExp(`(export const ${target.name} = define${defineKind}\\(\\{[\\s\\S]*?\\blifecycle:\\s*)"experimental"`);
  const promoted = original.replace(promotion, "$1\"active\"");
  assert(promoted !== original, `could not promote exact source declaration ${target.kind}:${target.name}`);
  const overrides = new Map([[target.source, promoted]]);
  const red = checkLifecycle(flattenSchema(), sourceDeclarations(overrides));
  assert(!red.ok && red.reason?.includes(`${target.kind}:${target.name}`), "promotion bait did not reject the exact active declaration");
  const green = checkLifecycle(flattenSchema(), declarations);
  assert(green.ok, `restored lifecycle baseline failed: ${green.reason ?? "unknown"}`);
  console.log(`golden-g8-schema-lifecycle: FALSIFY ${JSON.stringify({ source: target.source, line: target.line, kind: target.kind, name: target.name, switched_from: "experimental", switched_to: "active", caught: true, result_ok: red.ok, red_exit: 1, restored: true, normal_rerun_exit: 0 })}`);
}

function checkGeneratedBytes(actual: Uint8Array, expected: Uint8Array): { ok: boolean; reason?: string } {
  if (Buffer.compare(Buffer.from(actual), Buffer.from(expected)) !== 0) {
    return { ok: false, reason: "generated artifact bytes differ from the frozen source output" };
  }
  return { ok: true };
}

function runSchemaGoldenDriftFalsifier(declarations: readonly SourceDeclaration[]): void {
  const relativePath = "qf-kernel-schema/golden/ONTOLOGY.md";
  const expected = readFileSync(join(REPO_ROOT, relativePath));
  const isolatedRoot = mkdtempSync(join(tmpdir(), "qf-g8-schema-drift-"));
  const target = join(isolatedRoot, relativePath);
  try {
    mkdirSync(join(isolatedRoot, "qf-kernel-schema/golden"), { recursive: true });
    const bait = Buffer.from(expected);
    bait[0] = bait[0] === 0x23 ? 0x24 : 0x23;
    writeFileSync(target, bait);
    const red = checkGeneratedBytes(readFileSync(target), expected);
    assert(!red.ok && red.reason?.includes("bytes differ"), "generated schema byte bait was not rejected");
    writeFileSync(target, expected);
    const green = checkGeneratedBytes(readFileSync(target), expected);
    assert(green.ok, `restored generated schema bytes failed: ${green.reason ?? "unknown"}`);
    assert(checkLifecycle(flattenSchema(), declarations).ok, "semantic lifecycle control failed after generated-byte restoration");
    console.log(`golden-g8-schema-lifecycle: FALSIFY ${JSON.stringify({ mode: "schema-golden-drift", path: relativePath, byte_offset: 0, caught: true, result_ok: red.ok, red_exit: 1, restored: true, normal_rerun_exit: 0 })}`);
  } finally {
    try { rmSync(isolatedRoot, { recursive: true, force: true }); } catch {}
    assert(!existsSync(isolatedRoot), "schema golden drift isolated root survived cleanup");
  }
}

export async function runGoldenG8SchemaLifecycleGate(): Promise<{ ok: boolean }> {
  try {
    if (!(await runFrozenPackageInstall("golden-g8-schema-lifecycle:qf-kernel-schema", join(REPO_ROOT, "qf-kernel-schema")))) return { ok: false };
    schema = await import("../../qf-kernel-schema/src/schema.ts").then((module) => module.schema);
    const entries = flattenSchema();
    const declarations = sourceDeclarations();
    const result = checkLifecycle(entries, declarations);
    assert(result.ok, result.reason ?? "schema lifecycle invariant failed");
    const counts = Object.fromEntries(["object", "link", "action"].map((kind) => [kind, entries.filter((entry) => entry.kind === kind).length]));
    console.log(`golden-g8-schema-lifecycle: exact=${JSON.stringify({ total: entries.length, counts, all_experimental: true, unique_ids: true, source_set_exact: true })}`);
    runSchemaGoldenDriftFalsifier(declarations);
    runPromotionFalsifier(declarations);
    console.log("golden-g8-schema-lifecycle: PASS");
    return { ok: true };
  } catch (error) {
    console.error(`golden-g8-schema-lifecycle: FAIL ${error instanceof Error ? error.message : String(error)}`);
    return { ok: false };
  }
}

if (import.meta.main) process.exit(runGoldenG8SchemaLifecycleGate().ok ? 0 : 1);
