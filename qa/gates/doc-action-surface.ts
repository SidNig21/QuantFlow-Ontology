/**
 * Keep the checked-in generated action surface synchronized with the source
 * schema.  The historical hand-written action document was retired; this
 * gate protects the live generated documentation and served tool manifest
 * against stale checked-in outputs.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { schema } from "../../qf-kernel-schema/src/schema.ts";

const REPO_ROOT = join(import.meta.dir, "../..");

function sorted(values: Iterable<string>): string[] {
  return [...new Set(values)].sort();
}

export function checkDocActionSurface(): { ok: boolean; errors: string[] } {
  const expectedActions = sorted(
    schema.actions
      .filter((action) => action.internalOnly !== true)
      .map((action) => `qf_${action.name}`),
  );
  const tools = JSON.parse(
    readFileSync(join(REPO_ROOT, "qf-kernel-schema/golden/tools.json"), "utf8"),
  ) as Array<{ name?: unknown }>;
  const actualActions = sorted(
    tools
      .map((tool) => tool.name)
      .filter(
        (name): name is string =>
          typeof name === "string" && name.startsWith("qf_") &&
          schema.actions.some((action) => name === `qf_${action.name}`),
      ),
  );

  const errors: string[] = [];
  const missing = expectedActions.filter((name) => !actualActions.includes(name));
  const extra = actualActions.filter((name) => !expectedActions.includes(name));
  if (missing.length > 0) errors.push(`missing generated actions: ${missing.join(", ")}`);
  if (extra.length > 0) errors.push(`extra generated actions: ${extra.join(", ")}`);

  const ontology = readFileSync(
    join(REPO_ROOT, "qf-kernel-schema/golden/ONTOLOGY.md"),
    "utf8",
  );
  const missingDocs = schema.actions
    .map((action) => action.name)
    .filter((name) => !ontology.includes(`### \`${name}\``));
  if (missingDocs.length > 0) errors.push(`missing generated docs: ${missingDocs.join(", ")}`);

  return { ok: errors.length === 0, errors };
}

if (import.meta.main) {
  const result = checkDocActionSurface();
  if (!result.ok) {
    for (const error of result.errors) console.error(`doc-action-surface: ${error}`);
    process.exit(1);
  }
  console.log("doc-action-surface OK");
}
