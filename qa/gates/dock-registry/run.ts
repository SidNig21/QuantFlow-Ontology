/**
 * WO-007 dock-registry gate (runs inside this package after bun install + pack).
 *
 * Falsify env flags (each must go red):
 *   QF_DOCK_REGISTRY_SKIP_REGISTER=1
 *   QF_DOCK_REGISTRY_LIST_FAKE=1
 *
 * Species-literal scan (d) is always on; bait a `qf-toolloop` string under
 * collab-electron/src/windows/ for the red/green pair outside this process.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { AgentOs } from "@rivet-dev/agentos-core";
import {
  AgentDefinitionExistsError,
  execute,
  listAgentDefinitions,
  openKernel,
  PackageRefUnresolvedError,
  resolveSpeciesPackage,
  type KernelDb,
  type TraceContext,
} from "qf-kernel";

const PKG = import.meta.dir;
const REPO = join(PKG, "../../..");
const WINDOWS = join(REPO, "collab-electron/src/windows");
const AOSPKG = join(PKG, "packed/qf-toolloop.aospkg");
const APP_ROOT = PKG;

const BAIT_A = "dock-registry-bait-a";
/** Second bait uses the package agent name so createSession(secondName) is real. */
const BAIT_B = "qf-toolloop";
const SPECIES_LITERAL = "qf-toolloop";

function trace(): TraceContext {
  return { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() };
}

function definitionsFromDb(db: KernelDb): Record<string, unknown>[] {
  if (process.env.QF_DOCK_REGISTRY_LIST_FAKE === "1") {
    return [];
  }
  return listAgentDefinitions(db);
}

function scanWindowsForSpeciesLiteral(): string[] {
  const hits: string[] = [];
  const skip = new Set(["node_modules", "dist", "out", ".git"]);

  function walk(dir: string): void {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const name of entries) {
      if (skip.has(name)) continue;
      const full = join(dir, name);
      let st;
      try {
        st = statSync(full);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        walk(full);
        continue;
      }
      let text: string;
      try {
        text = readFileSync(full, "utf8");
      } catch {
        continue;
      }
      if (text.includes(SPECIES_LITERAL)) {
        hits.push(relative(REPO, full).split("\\").join("/"));
      }
    }
  }

  walk(WINDOWS);
  return hits;
}

async function main(): Promise<number> {
  if (!existsSync(AOSPKG)) {
    console.error("dock-registry FAIL: missing", AOSPKG, "— run bun run pack-agent");
    return 1;
  }

  const skipRegister = process.env.QF_DOCK_REGISTRY_SKIP_REGISTER === "1";
  const listFake = process.env.QF_DOCK_REGISTRY_LIST_FAKE === "1";

  const db = openKernel(":memory:");

  // ── (a) register bait → appears in listAgentDefinitions ──
  if (!skipRegister) {
    execute(
      db,
      "register_agent_definition",
      {
        name: BAIT_A,
        role: "dock-registry-proof",
        package_ref: AOSPKG,
      },
      trace(),
    );
  }

  const listed = definitionsFromDb(db);
  const foundA = listed.some((r) => String(r.name ?? r.id) === BAIT_A);
  if (!foundA) {
    console.error(
      "dock-registry FAIL: bait species missing from listAgentDefinitions",
      { skipRegister, listFake, listed: listed.map((r) => r.name) },
    );
    return 1;
  }

  // ── (b) corrupt package_ref → PackageRefUnresolvedError → restore ──
  const priorRef = String(
    (db.query(`SELECT package_ref FROM agent_definition WHERE id = ?`).get(BAIT_A) as {
      package_ref: string;
    }).package_ref,
  );
  db.query(`UPDATE agent_definition SET package_ref = ? WHERE id = ?`).run(
    "/nonexistent/dock-registry-corrupt.aospkg",
    BAIT_A,
  );
  let threwUnresolved = false;
  try {
    resolveSpeciesPackage(db, BAIT_A, APP_ROOT);
  } catch (err) {
    if (err instanceof PackageRefUnresolvedError) threwUnresolved = true;
    else {
      console.error("dock-registry FAIL: corrupt ref threw wrong error", err);
      return 1;
    }
  }
  if (!threwUnresolved) {
    console.error("dock-registry FAIL: corrupt package_ref did not throw PackageRefUnresolvedError");
    return 1;
  }
  db.query(`UPDATE agent_definition SET package_ref = ? WHERE id = ?`).run(
    priorRef,
    BAIT_A,
  );
  const restored = resolveSpeciesPackage(db, BAIT_A, APP_ROOT);
  if (!existsSync(restored.packagePath)) {
    console.error("dock-registry FAIL: restore left package unresolved");
    return 1;
  }

  // ── (c) duplicate name → AgentDefinitionExistsError, row count 1 ──
  let threwExists = false;
  try {
    execute(
      db,
      "register_agent_definition",
      {
        name: BAIT_A,
        role: "duplicate",
        package_ref: AOSPKG,
      },
      trace(),
    );
  } catch (err) {
    if (err instanceof AgentDefinitionExistsError) threwExists = true;
    else {
      console.error("dock-registry FAIL: duplicate threw wrong error", err);
      return 1;
    }
  }
  if (!threwExists) {
    console.error("dock-registry FAIL: duplicate name did not throw AgentDefinitionExistsError");
    return 1;
  }
  const countA = (
    db.query(`SELECT COUNT(*) AS n FROM agent_definition WHERE id = ?`).get(BAIT_A) as {
      n: number;
    }
  ).n;
  if (countA !== 1) {
    console.error("dock-registry FAIL: expected row count 1 after duplicate, got", countA);
    return 1;
  }

  // ── (d) no species literal under collab-electron/src/windows/ ──
  const literalHits = scanWindowsForSpeciesLiteral();
  if (literalHits.length > 0) {
    console.error(
      "dock-registry FAIL: species literal in renderer source:",
      literalHits,
    );
    return 1;
  }

  // ── (e) second bait + linkSoftware + createSession (no host restart) ──
  // Host starts with BAIT_A's package (first). BAIT_B is registered as a new
  // definition after create; its package_ref is admitted via linkSoftware
  // without recreating the host. Same aospkg identity → remount may no-op;
  // createSession(secondName) still succeeds on the live host.
  const first = resolveSpeciesPackage(db, BAIT_A, APP_ROOT);
  const os = await AgentOs.create({
    defaultSoftware: false,
    software: [{ packagePath: first.packagePath }],
  });
  try {
    execute(
      db,
      "register_agent_definition",
      {
        name: BAIT_B,
        role: "dock-registry-admission",
        package_ref: AOSPKG,
      },
      trace(),
    );
    const second = resolveSpeciesPackage(db, BAIT_B, APP_ROOT);
    try {
      await os.linkSoftware({ packagePath: second.packagePath });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("already exists")) throw err;
    }
    const created = await os.createSession(BAIT_B);
    const sessionId = created.sessionId;
    if (!sessionId) {
      console.error("dock-registry FAIL: createSession returned no sessionId");
      return 1;
    }
    await os.destroySession(sessionId).catch(() => {});
  } finally {
    await os.dispose?.().catch(() => {});
  }

  if (skipRegister || listFake) {
    console.error("dock-registry FAIL: falsify flag still green (expected red)");
    return 1;
  }

  console.log("dock-registry OK");
  console.log(
    JSON.stringify({
      baitA: BAIT_A,
      baitB: BAIT_B,
      packagePath: restored.packagePath,
      literalHits: 0,
    }),
  );
  return 0;
}

process.exit(await main());
