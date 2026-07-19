/**
 * Debt #0 — doc↔code action-surface gate.
 * Asserts §Actions in docs/ONTOLOGY_SCHEMA.md equals schema.ts actions.
 * Parses only the Actions list paragraph (stops before blockquotes / next heading).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { schema } from "../../qf-kernel-schema/src/schema.ts";

const REPO_ROOT = join(import.meta.dir, "../..");

/** Action names listed under ## Actions, excluding the deprecation note blockquote. */
export function docActionNames(markdown: string): string[] {
  const start = markdown.indexOf("## Actions");
  if (start < 0) {
    throw new Error("doc-action-surface: ## Actions heading not found");
  }
  const rest = markdown.slice(start);
  // Stop at the deprecation blockquote (or next ##), not inside §Actions prose notes.
  const bq = rest.search(/\n>/);
  const nextH = rest.search(/\n## /);
  let end = rest.length;
  if (bq >= 0) end = Math.min(end, bq);
  if (nextH > 0) end = Math.min(end, nextH);
  const section = rest.slice(0, end);
  const names = [...section.matchAll(/`([a-z][a-z0-9_]*)`/g)].map((m) => m[1]!);
  return [...new Set(names)].sort();
}

export function checkDocActionSurface(): {
  ok: boolean;
  onlyDoc: string[];
  onlyCode: string[];
} {
  const md = readFileSync(join(REPO_ROOT, "docs/ONTOLOGY_SCHEMA.md"), "utf8");
  const docNames = docActionNames(md);
  const codeNames = schema.actions.map((a) => a.name).sort();
  const docSet = new Set(docNames);
  const codeSet = new Set(codeNames);
  const onlyDoc = docNames.filter((n) => !codeSet.has(n));
  const onlyCode = codeNames.filter((n) => !docSet.has(n));
  const ok = onlyDoc.length === 0 && onlyCode.length === 0;
  if (!ok) {
    console.error("doc-action-surface: action lists disagree");
    if (onlyDoc.length > 0) {
      console.error(`  in doc but not code: ${onlyDoc.join(", ")}`);
    }
    if (onlyCode.length > 0) {
      console.error(`  in code but not doc: ${onlyCode.join(", ")}`);
    }
  }
  return { ok, onlyDoc, onlyCode };
}

if (import.meta.main) {
  const { ok } = checkDocActionSurface();
  process.exit(ok ? 0 : 1);
}
