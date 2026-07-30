/**
 * WO-106 G5 — boot reconciliation must close every acted-on session, even
 * when more than 100 rows exist.
 *
 * Models collab-electron/src/main/agent-host.ts reconcileStaleSessions().
 * The gate cannot import agent-host (Electron + AgentOS at module scope).
 * Coupling: static assertion that production lists via kernelListAgentSessions()
 * with limit null; behavioral test mirrors the same reconcile branches.
 *
 * Falsify:
 *   QF_BOOT_RECONCILE_DEFAULT_LIMIT=1 — gate model uses default limit (100)
 *   Edit kernel.ts kernelListAgentSessions: null → 100 — production path broken
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  execute,
  openKernel,
  queryObjects,
  type KernelDb,
  type TraceContext,
} from "qf-kernel";

const SEED_COUNT = 105;
const BOOT_DEFINITION_ID = "g5-boot-reconcile";
const ACTED_ON = new Set([
  "starting",
  "running",
  "blocked",
  "cancelled",
  "failed",
]);

function trace(): TraceContext {
  return { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() };
}

const REPO_ROOT = join(import.meta.dir, "../../..");

function extractExportFunctionBody(
  src: string,
  name: string,
): string | null {
  const sig = new RegExp(`export function ${name}\\([^)]*\\)[^{]*\\{`);
  const m = sig.exec(src);
  if (!m) return null;
  let depth = 1;
  let i = m.index + m[0].length;
  const start = i;
  while (i < src.length && depth > 0) {
    const ch = src[i];
    if (ch === "{") depth += 1;
    else if (ch === "}") depth -= 1;
    i += 1;
  }
  return depth === 0 ? src.slice(start, i - 1) : null;
}

/**
 * Bind the gate to the real boot path without importing agent-host.
 * Fails if reconcileStaleSessions stops calling kernelListAgentSessions,
 * or if that helper stops passing limit null.
 */
function assertProductionBootPathCoupling(): string | null {
  const agentHost = readFileSync(
    join(REPO_ROOT, "collab-electron/src/main/agent-host.ts"),
    "utf8",
  );
  const kernel = readFileSync(
    join(REPO_ROOT, "collab-electron/src/main/kernel.ts"),
    "utf8",
  );

  const reconcileBody = extractExportFunctionBody(
    agentHost,
    "reconcileStaleSessions",
  );
  if (
    !reconcileBody ||
    !/\bkernelListAgentSessions\s*\(\s*\)/.test(reconcileBody)
  ) {
    return "agent-host.ts reconcileStaleSessions must list via kernelListAgentSessions()";
  }

  const listBody = extractExportFunctionBody(kernel, "kernelListAgentSessions");
  if (
    !listBody ||
    !/queryObjects\s*\(\s*getKernelDb\(\)\s*,\s*["']agent_session["']\s*,\s*undefined\s*,\s*null\s*\)/.test(
      listBody,
    )
  ) {
    return "kernel.ts kernelListAgentSessions must pass limit null for agent_session";
  }

  return null;
}

/**
 * Mirror of agent-host.ts reconcileStaleSessions (lines 262–287).
 * `listLimit`: null = unbounded (production); 100 = G5 bait (documented default).
 */
function reconcileStaleSessions(db: KernelDb, listLimit: number | null): void {
  const rows = queryObjects(db, "agent_session", undefined, listLimit);
  for (const row of rows) {
    const id = String(row.id);
    const status = String(row.status);
    const t = trace();
    if (status === "starting" || status === "running" || status === "blocked") {
      execute(
        db,
        "fail_agent_session",
        { session_id: id, reason: "app_terminated" },
        t,
      );
      execute(
        db,
        "close_agent_session",
        { session_id: id },
        { ...t, span_id: crypto.randomUUID() },
      );
    } else if (status === "cancelled" || status === "failed") {
      execute(db, "close_agent_session", { session_id: id }, t);
    }
  }
}

function seedActedOnSessions(db: KernelDb): string[] {
  const ids: string[] = [];
  const cycle = [
    "starting",
    "running",
    "blocked",
    "cancelled",
    "failed",
  ] as const;

  for (let i = 0; i < SEED_COUNT; i++) {
    const id = `g5-seed-${String(i).padStart(4, "0")}`;
    const status = cycle[i % cycle.length];
    const t = trace();

    execute(
      db,
      "create_agent_session",
      {
        session_id: id,
        agent_definition_id: BOOT_DEFINITION_ID,
        label: "g5-boot-reconcile",
      },
      t,
    );

    if (status !== "starting") {
      execute(db, "start_agent_session", { session_id: id }, trace());
    }
    if (status === "blocked") {
      execute(db, "block_agent_session", { session_id: id }, trace());
    } else if (status === "cancelled") {
      execute(db, "cancel_agent_session", { session_id: id }, trace());
    } else if (status === "failed") {
      execute(
        db,
        "fail_agent_session",
        { session_id: id, reason: "g5_seed" },
        trace(),
      );
    }

    ids.push(id);
  }

  return ids;
}

function countActedOnOpen(db: KernelDb, seededIds: Set<string>): number {
  const rows = queryObjects(db, "agent_session", undefined, null);
  let open = 0;
  for (const row of rows) {
    const id = String(row.id);
    if (!seededIds.has(id)) continue;
    const status = String(row.status);
    if (ACTED_ON.has(status)) open += 1;
  }
  return open;
}

async function main(): Promise<number> {
  const couplingError = assertProductionBootPathCoupling();
  if (couplingError) {
    console.error(`boot-reconcile FAIL: ${couplingError}`);
    return 1;
  }

  const useDefaultLimit = process.env.QF_BOOT_RECONCILE_DEFAULT_LIMIT === "1";
  const listLimit: number | null = useDefaultLimit ? 100 : null;

  const db = openKernel(":memory:");
  execute(
    db,
    "register_agent_definition",
    {
      name: BOOT_DEFINITION_ID,
      role: "boot-reconcile-proof",
      package_ref: "tools/runtime-proof/packed/qf-toolloop.aospkg",
    },
    trace(),
  );
  const seededIds = new Set(seedActedOnSessions(db));

  const before = countActedOnOpen(db, seededIds);
  if (before !== SEED_COUNT) {
    console.error(
      "boot-reconcile FAIL: seed did not produce expected acted-on count",
      { before, expected: SEED_COUNT },
    );
    return 1;
  }

  reconcileStaleSessions(db, listLimit);

  const after = countActedOnOpen(db, seededIds);
  if (after !== 0) {
    console.error(
      "boot-reconcile FAIL: reconcile left acted-on sessions open",
      { after, listLimit },
    );
    return 1;
  }

  if (useDefaultLimit) {
    console.error(
      "boot-reconcile FAIL: default limit bait still green (expected red)",
    );
    return 1;
  }

  console.log("boot-reconcile OK");
  console.log(
    JSON.stringify({
      seeded: SEED_COUNT,
      actedOnBefore: before,
      actedOnAfter: after,
      listLimit: null,
    }),
  );
  return 0;
}

process.exit(await main());
