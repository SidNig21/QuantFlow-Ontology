/**
 * Register Hermes into a Kernel DB via the front door.
 *
 *   bun ./register.ts --db <absolute-path-to-kernel.db>
 *
 * Find the app DB (measured): ~/.collaborator/dev/worktree-<12hex>/kernel.db
 * e.g. ls ~/.collaborator/dev/worktree-*/kernel.db
 */
import { existsSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { closeKernel, execute, openKernel } from "qf-kernel";

const REPO_ROOT = join(import.meta.dir, "../..");
const PACKAGE_REF = "species/hermes/packed/hermes.aospkg";

function parseDbArg(argv: string[]): string {
  const i = argv.indexOf("--db");
  if (i < 0 || !argv[i + 1]) {
    console.error("register.ts: --db <path> is required");
    console.error(
      "Find the app DB: ls ~/.collaborator/dev/worktree-*/kernel.db",
    );
    process.exit(1);
  }
  const p = argv[i + 1]!;
  return isAbsolute(p) ? p : resolve(p);
}

const dbPath = parseDbArg(process.argv.slice(2));
if (!existsSync(dbPath)) {
  console.error(`register.ts: DB not found: ${dbPath}`);
  process.exit(1);
}

const packedAbs = join(REPO_ROOT, PACKAGE_REF);
if (!existsSync(packedAbs)) {
  console.error(
    `register.ts: packed package missing at ${packedAbs} — run bun run pack-agent`,
  );
  process.exit(1);
}

const db = openKernel(dbPath);
try {
  const result = execute(
    db,
    "register_agent_definition",
    {
      name: "hermes",
      role: "orchestrator",
      package_ref: PACKAGE_REF,
    },
    { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() },
  );
  console.log(
    `register.ts: ok id=${result.object_id} event=${result.event} package_ref=${PACKAGE_REF}`,
  );
} finally {
  closeKernel(db);
}
