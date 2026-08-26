#!/usr/bin/env bun
/**
 * vault-projection gate — runs WO-V1 G1 through G5 plus REWORK ROUND 1
 * missing-type skip.
 *
 * Every projection uses a throwaway fixture vault and a temp Kernel.
 * Never points at ~/Vaults or ~/.collaborator.
 */
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  closeKernel,
  contentHash,
  execute,
  openKernel,
  seedExperimentalFixtureTable,
  type KernelDb,
} from "qf-kernel";
import { schema as productionSchema } from "qf-kernel-schema";
import {
  forceSessionCreatedAt,
  reversePhysicalSessionOrder,
  createIncompleteKernelFixture,
} from "../../../qa/gates/vault-projection/fixture-seed.ts";
import { schema as experimentalSchema } from "../fixtures/experimental-schema.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = join(HERE, "..");
const SRC_DIR = join(PKG_ROOT, "src");
const CLI = join(SRC_DIR, "cli.ts");
const PROJECT_TS = join(SRC_DIR, "project.ts");
/** Workspace-local temp root — /tmp is not writable in sandboxed seats. */
const FIXTURE_ROOT = join(PKG_ROOT, ".gate-fixtures");

function clearFixtureRoot(): void {
  rmSync(FIXTURE_ROOT, { recursive: true, force: true });
}

function fixtureTemp(prefix: string): string {
  mkdirSync(FIXTURE_ROOT, { recursive: true });
  return mkdtempSync(join(FIXTURE_ROOT, prefix));
}

function trace(): { trace_id: string; span_id: string } {
  return { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() };
}

function fail(msg: string): never {
  throw new Error(`vault-projection FAIL: ${msg}`);
}

function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function listFilesRecursive(root: string): string[] {
  const out: string[] = [];
  function walk(dir: string, rel: string): void {
    for (const name of readdirSync(dir).sort()) {
      const full = join(dir, name);
      const child = rel ? `${rel}/${name}` : name;
      if (statSync(full).isDirectory()) walk(full, child);
      else out.push(child);
    }
  }
  if (existsSync(root)) walk(root, "");
  return out;
}

function snapshotTree(root: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const rel of listFilesRecursive(root)) {
    map.set(rel, sha256File(join(root, rel)));
  }
  return map;
}

function treesEqual(a: Map<string, string>, b: Map<string, string>): boolean {
  if (a.size !== b.size) return false;
  for (const [k, v] of a) {
    if (b.get(k) !== v) return false;
  }
  return true;
}

function makeFixtureVault(): string {
  const root = fixtureTemp("vault-");
  writeFileSync(
    join(root, "README.md"),
    "# Fixture vault\n\nSynthetic. Not the founder vault.\n",
    "utf8",
  );
  mkdirSync(join(root, "_Doctrine"), { recursive: true });
  writeFileSync(
    join(root, "_Doctrine", "keep.md"),
    "doctrine must survive\n",
    "utf8",
  );
  mkdirSync(join(root, ".obsidian"), { recursive: true });
  writeFileSync(
    join(root, ".obsidian", "app.json"),
    '{"fixture":true}\n',
    "utf8",
  );
  return root;
}

function makeKernelDb(): { path: string; dir: string } {
  const dir = fixtureTemp("kernel-");
  const path = join(dir, "kernel.db");
  // WO-K2: file-backed create is opt-in.
  const db = openKernel(path, { create: true });
  closeKernel(db);
  return { path, dir };
}

function spawnEnv(
  base: Record<string, string | undefined>,
): Record<string, string | undefined> {
  const env: Record<string, string | undefined> = { ...process.env, ...base };
  for (const key of Object.keys(base)) {
    if (base[key] === undefined) delete env[key];
  }
  return env;
}

async function runProjectorAsync(opts: {
  kernelDb: string;
  vaultRoot: string;
  schemaModule?: string;
  extraEnv?: Record<string, string | undefined>;
}): Promise<{ code: number; stdout: string; stderr: string }> {
  const env = spawnEnv({
    QF_KERNEL_DB: opts.kernelDb,
    QF_VAULT_ROOT: opts.vaultRoot,
    QF_VAULT_SCHEMA_MODULE: opts.schemaModule,
    ...(opts.extraEnv ?? {}),
  });

  const proc = Bun.spawn(["bun", CLI], {
    cwd: PKG_ROOT,
    env,
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { code, stdout, stderr };
}

function publishArtifactFile(
  db: KernelDb,
  kind: "strategy_spec" | "code" | "result_set" | "report" | "trajectory",
  body: string,
  storagePath: string,
): string {
  writeFileSync(storagePath, body, "utf8");
  const bytes = new TextEncoder().encode(body);
  const hash = contentHash(bytes);
  execute(
    db,
    "publish_artifact",
    {
      kind,
      bytes,
      storage_ref: storagePath,
      content_hash: hash,
    },
    trace(),
  );
  return hash;
}

const FIXTURE_DEFINITION_ID = "vault-projection-fixture";

function ensureFixtureDefinition(db: KernelDb): void {
  const existing = db
    .query(`SELECT id FROM agent_definition WHERE id = ?`)
    .get(FIXTURE_DEFINITION_ID) as { id: string } | null;
  if (existing) return;
  execute(
    db,
    "register_agent_definition",
    {
      name: FIXTURE_DEFINITION_ID,
      role: "vault-projection-proof",
      package_ref: "tools/qf-proof-agent/packed/qf-proof-agent.aospkg",
    },
    trace(),
  );
}

function seedSession(db: KernelDb, id: string, createdAt?: string): void {
  ensureFixtureDefinition(db);
  execute(
    db,
    "create_agent_session",
    {
      session_id: id,
      agent_definition_id: FIXTURE_DEFINITION_ID,
      label: "fixture",
    },
    trace(),
  );
  if (createdAt) {
    // execute() cannot force ties — see qa/gates/vault-projection/fixture-seed.ts
    forceSessionCreatedAt(db, id, createdAt);
  }
}

// --- G1 static: no vault-state APIs in projection path ----------------

function assertNoVaultListingApis(): void {
  const shipping = [
    "project.ts",
    "cli.ts",
    "load-schema.ts",
    "env.ts",
  ];
  const forbidden =
    /\b(readdirSync|readdir|opendirSync|opendir|promises\.readdir)\b/;
  for (const name of shipping) {
    const src = readFileSync(join(SRC_DIR, name), "utf8");
    if (forbidden.test(src)) {
      fail(`G1(c): ${name} must not call directory-listing APIs`);
    }
  }

  // project.ts must not call exists/stat — only assert-*-root modules may.
  const projectSrc = readFileSync(PROJECT_TS, "utf8");
  if (
    /\b(existsSync|statSync|lstatSync|accessSync|exists|stat)\b/.test(
      projectSrc,
    )
  ) {
    fail(
      "G1(c): project.ts must not call exists/stat against the vault (or at all)",
    );
  }
  // project.ts must never readFile a vault path — only storage_ref (artifact store).
  // It may use readFileSync for artifact bytes; it must not join(vaultRoot, ...) into readFile.
  if (/readFileSync\s*\(\s*join\s*\(\s*vaultRoot/.test(projectSrc)) {
    fail("G1(c): project.ts must not readFile under vaultRoot");
  }
}

// --- Refusal behaviour (D1) -------------------------------------------

async function assertEnvRefusal(): Promise<void> {
  const { path: kernelPath, dir: kernelDir } = makeKernelDb();
  const vault = makeFixtureVault();

  const cases: Array<{
    label: string;
    env: Record<string, string | undefined>;
    expectName: string;
  }> = [
    {
      label: "QF_KERNEL_DB unset",
      env: { QF_KERNEL_DB: undefined, QF_VAULT_ROOT: vault },
      expectName: "QF_KERNEL_DB",
    },
    {
      label: "QF_KERNEL_DB empty",
      env: { QF_KERNEL_DB: "", QF_VAULT_ROOT: vault },
      expectName: "QF_KERNEL_DB",
    },
    {
      label: "QF_KERNEL_DB whitespace",
      env: { QF_KERNEL_DB: "   ", QF_VAULT_ROOT: vault },
      expectName: "QF_KERNEL_DB",
    },
    {
      label: "QF_KERNEL_DB missing file",
      env: {
        QF_KERNEL_DB: join(kernelDir, "no-such.db"),
        QF_VAULT_ROOT: vault,
      },
      expectName: "QF_KERNEL_DB",
    },
    {
      label: "QF_VAULT_ROOT unset",
      env: { QF_KERNEL_DB: kernelPath, QF_VAULT_ROOT: undefined },
      expectName: "QF_VAULT_ROOT",
    },
    {
      label: "QF_VAULT_ROOT empty",
      env: { QF_KERNEL_DB: kernelPath, QF_VAULT_ROOT: "" },
      expectName: "QF_VAULT_ROOT",
    },
    {
      label: "QF_VAULT_ROOT whitespace",
      env: { QF_KERNEL_DB: kernelPath, QF_VAULT_ROOT: "\t  " },
      expectName: "QF_VAULT_ROOT",
    },
    {
      label: "QF_VAULT_ROOT missing dir",
      env: {
        QF_KERNEL_DB: kernelPath,
        QF_VAULT_ROOT: join(vault, "no-such-dir"),
      },
      expectName: "QF_VAULT_ROOT",
    },
  ];

  for (const c of cases) {
    const proc = Bun.spawn(["bun", CLI], {
      cwd: PKG_ROOT,
      env: spawnEnv(c.env),
      stdout: "pipe",
      stderr: "pipe",
    });
    const [, stderr, code] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ]);
    if (code === 0) fail(`D1 refusal (${c.label}): expected non-zero exit`);
    if (!stderr.includes(c.expectName)) {
      fail(
        `D1 refusal (${c.label}): stderr must name ${c.expectName}, got: ${stderr}`,
      );
    }
  }

  // Missing README
  const noReadme = fixtureTemp("vault-noreadme-");
  const proc = Bun.spawn(["bun", CLI], {
    cwd: PKG_ROOT,
    env: spawnEnv({
      QF_KERNEL_DB: kernelPath,
      QF_VAULT_ROOT: noReadme,
    }),
    stdout: "pipe",
    stderr: "pipe",
  });
  const [, stderr, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  if (code === 0) fail("D1 refusal (missing README): expected non-zero exit");
  if (!stderr.includes("QF_VAULT_ROOT") || !stderr.includes("README.md")) {
    fail(`D1 refusal (missing README): bad stderr: ${stderr}`);
  }

  rmSync(kernelDir, { recursive: true, force: true });
  rmSync(vault, { recursive: true, force: true });
  rmSync(noReadme, { recursive: true, force: true });
}

// --- G1 one direction -------------------------------------------------

async function assertG1(): Promise<void> {
  assertNoVaultListingApis();

  const { path: kernelPath, dir: kernelDir } = makeKernelDb();
  const artifactStore = fixtureTemp("art-");
  const db = openKernel(kernelPath);
  ensureFixtureDefinition(db);
  const body = "# Synthetic report\n\nfixture body\n";
  const artPath = join(artifactStore, "report.md");
  const artId = publishArtifactFile(db, "report", body, artPath);
  // Link through execute()'s links: envelope — not a raw links-table write.
  execute(
    db,
    "create_agent_session",
    {
      session_id: "session-g1",
      agent_definition_id: FIXTURE_DEFINITION_ID,
      label: "fixture",
      links: [{ kind: "produces", to_id: artId }],
    },
    trace(),
  );
  closeKernel(db);

  const kernelHashBefore = sha256File(kernelPath);
  const vault = makeFixtureVault();
  const doctrineBefore = readFileSync(join(vault, "_Doctrine", "keep.md"));
  const readmeBefore = readFileSync(join(vault, "README.md"));
  const obsidianBefore = readFileSync(join(vault, ".obsidian", "app.json"));

  // Plant fabricated note in a projected folder (will be created then cleared on run)
  mkdirSync(join(vault, "artifact"), { recursive: true });
  writeFileSync(
    join(vault, "artifact", "planted-fake-id.md"),
    "planted — must be cleared\n",
    "utf8",
  );
  writeFileSync(
    join(vault, "_Doctrine", "planted-doctrine.md"),
    "doctrine plant — must survive\n",
    "utf8",
  );

  const run = await runProjectorAsync({ kernelDb: kernelPath, vaultRoot: vault });
  if (run.code !== 0) {
    fail(`G1 project failed: ${run.stderr || run.stdout}`);
  }

  if (sha256File(kernelPath) !== kernelHashBefore) {
    fail("G1(a): Kernel bytes changed after projection");
  }
  if (existsSync(join(vault, "artifact", "planted-fake-id.md"))) {
    fail("G1(a): planted file in projected folder survived (must be cleared)");
  }
  if (!existsSync(join(vault, "artifact", `${artId}.md`))) {
    fail("G1(a): expected projected artifact note missing");
  }
  if (!existsSync(join(vault, "_Doctrine", "planted-doctrine.md"))) {
    fail("G1(b): planted _Doctrine file was deleted");
  }
  if (
    sha256File(join(vault, "_Doctrine", "keep.md")) !==
    createHash("sha256").update(doctrineBefore).digest("hex")
  ) {
    fail("G1(b): _Doctrine/keep.md mutated");
  }
  if (
    sha256File(join(vault, "README.md")) !==
    createHash("sha256").update(readmeBefore).digest("hex")
  ) {
    fail("G3: README.md mutated");
  }
  if (
    sha256File(join(vault, ".obsidian", "app.json")) !==
    createHash("sha256").update(obsidianBefore).digest("hex")
  ) {
    fail("G3: .obsidian mutated");
  }

  rmSync(kernelDir, { recursive: true, force: true });
  rmSync(vault, { recursive: true, force: true });
  rmSync(artifactStore, { recursive: true, force: true });
}

// --- G2 hash gate -----------------------------------------------------

async function assertG2(): Promise<void> {
  const { path: kernelPath, dir: kernelDir } = makeKernelDb();
  const artifactStore = fixtureTemp("art-");
  const db = openKernel(kernelPath);
  const original = "# Untouched report\n\noriginal verified body\n";
  const artPath = join(artifactStore, "report.md");
  const artId = publishArtifactFile(db, "report", original, artPath);
  closeKernel(db);

  const vault = makeFixtureVault();

  // Assertion 1: untouched renders WITH body
  let run = await runProjectorAsync({ kernelDb: kernelPath, vaultRoot: vault });
  if (run.code !== 0) fail(`G2 assert1 project failed: ${run.stderr}`);
  let note = readFileSync(join(vault, "artifact", `${artId}.md`), "utf8");
  if (!note.includes("original verified body")) {
    fail(
      "G2 assertion 1: untouched artifact must render WITH its body (fail-closed killer)",
    );
  }
  if (note.includes("Hash mismatch") || note.includes("Missing file")) {
    fail("G2 assertion 1: untouched artifact must not report mismatch/missing");
  }

  // Assertion 2: edit → mismatch, no body
  writeFileSync(artPath, "# Tampered\n\nedited after publication\n", "utf8");
  run = await runProjectorAsync({ kernelDb: kernelPath, vaultRoot: vault });
  if (run.code !== 0) fail(`G2 assert2 project failed: ${run.stderr}`);
  note = readFileSync(join(vault, "artifact", `${artId}.md`), "utf8");
  if (note.includes("edited after publication")) {
    fail("G2 assertion 2: edited bytes must not render as body");
  }
  if (!note.includes("Hash mismatch")) {
    fail("G2 assertion 2: note must state hash mismatch");
  }
  if (!note.includes("published content_hash") || !note.includes("disk hash")) {
    fail("G2 assertion 2: note must show both hashes");
  }

  // Assertion 3: delete → missing
  rmSync(artPath, { force: true });
  run = await runProjectorAsync({ kernelDb: kernelPath, vaultRoot: vault });
  if (run.code !== 0) fail(`G2 assert3 project failed: ${run.stderr}`);
  note = readFileSync(join(vault, "artifact", `${artId}.md`), "utf8");
  if (note.includes("original verified body") || note.includes("edited after")) {
    fail("G2 assertion 3: missing file must not render a body");
  }
  if (!note.includes("Missing file")) {
    fail("G2 assertion 3: note must state missing file");
  }

  rmSync(kernelDir, { recursive: true, force: true });
  rmSync(vault, { recursive: true, force: true });
  rmSync(artifactStore, { recursive: true, force: true });
}

// --- G3 write scope (also covered in G1; explicit second-run check) ---

async function assertG3(): Promise<void> {
  const { path: kernelPath, dir: kernelDir } = makeKernelDb();
  const db = openKernel(kernelPath);
  seedSession(db, "session-g3");
  closeKernel(db);

  const vault = makeFixtureVault();
  const protectedPaths = [
    "README.md",
    "_Doctrine/keep.md",
    ".obsidian/app.json",
  ];
  const before = new Map(
    protectedPaths.map((p) => [p, sha256File(join(vault, p))]),
  );

  for (let i = 0; i < 2; i++) {
    const run = await runProjectorAsync({
      kernelDb: kernelPath,
      vaultRoot: vault,
    });
    if (run.code !== 0) fail(`G3 project failed: ${run.stderr}`);
  }

  for (const p of protectedPaths) {
    if (sha256File(join(vault, p)) !== before.get(p)) {
      fail(`G3: ${p} not byte-identical after two runs`);
    }
  }

  // Write scope is only owned type folders — a non-owned folder must survive.
  mkdirSync(join(vault, "OperatorNotes"), { recursive: true });
  writeFileSync(join(vault, "OperatorNotes", "x.md"), "operator\n", "utf8");
  const run = await runProjectorAsync({
    kernelDb: kernelPath,
    vaultRoot: vault,
  });
  if (run.code !== 0) fail(`G3 scope project failed: ${run.stderr}`);
  if (!existsSync(join(vault, "OperatorNotes", "x.md"))) {
    fail("G3: projector deleted a non-owned folder (write scope too wide)");
  }

  rmSync(kernelDir, { recursive: true, force: true });
  rmSync(vault, { recursive: true, force: true });
}

// --- G4 idempotence + >100 + tied created_at ---------------------------

async function assertG4(): Promise<void> {
  const { path: kernelPath, dir: kernelDir } = makeKernelDb();
  const artifactStore = fixtureTemp("art-");
  const db = openKernel(kernelPath);

  const tiedAt = "2026-07-26T12:00:00.000Z";
  const SEED = 105;
  for (let i = 0; i < SEED; i++) {
    const id = `g4-sess-${String(i).padStart(4, "0")}`;
    seedSession(db, id, tiedAt);
  }

  // Also seed a few with distinct timestamps for variety
  seedSession(db, "g4-early", "2026-07-01T00:00:00.000Z");
  seedSession(db, "g4-late", "2026-07-30T00:00:00.000Z");

  const reportBody = "# G4 report\n";
  publishArtifactFile(
    db,
    "report",
    reportBody,
    join(artifactStore, "g4-report.md"),
  );
  closeKernel(db);

  const vault = makeFixtureVault();
  const run1 = await runProjectorAsync({
    kernelDb: kernelPath,
    vaultRoot: vault,
  });
  if (run1.code !== 0) fail(`G4 run1 failed: ${run1.stderr}`);

  const snap1 = snapshotTree(join(vault, "agent_session"));
  if (snap1.size !== SEED + 2) {
    fail(
      `G4: expected ${SEED + 2} session notes, got ${snap1.size} (truncation?)`,
    );
  }

  // Copy projected tree for byte compare
  const copyDir = fixtureTemp("vault-copy-");
  for (const type of productionSchema.objects.map((o) => o.name)) {
    const src = join(vault, type);
    if (existsSync(src)) cpSync(src, join(copyDir, type), { recursive: true });
  }
  const snapFull1 = snapshotTree(copyDir);

  const run2 = await runProjectorAsync({
    kernelDb: kernelPath,
    vaultRoot: vault,
  });
  if (run2.code !== 0) fail(`G4 run2 failed: ${run2.stderr}`);
  const snapFull2 = snapshotTree(
    // compare owned folders only
    (() => {
      const d = fixtureTemp("vault-copy2-");
      for (const type of productionSchema.objects.map((o) => o.name)) {
        const src = join(vault, type);
        if (existsSync(src)) cpSync(src, join(d, type), { recursive: true });
      }
      return d;
    })(),
  );

  if (!treesEqual(snapFull1, snapFull2)) {
    fail("G4: second run produced a diff (not idempotent)");
  }

  // Stable tiebreak: note contents for tied sessions must be deterministic.
  // Reshuffle physical order of created_at-equal rows — projector output must
  // be unchanged. Raw SQL lives in qa/…/fixture-seed.ts (cannot use execute()).
  const db2 = openKernel(kernelPath);
  const tiedIds = Array.from({ length: SEED }, (_, i) =>
    `g4-sess-${String(i).padStart(4, "0")}`,
  );
  reversePhysicalSessionOrder(db2, tiedIds);
  closeKernel(db2);

  const run3 = await runProjectorAsync({
    kernelDb: kernelPath,
    vaultRoot: vault,
  });
  if (run3.code !== 0) fail(`G4 run3 (reorder) failed: ${run3.stderr}`);
  const snapFull3 = snapshotTree(
    (() => {
      const d = fixtureTemp("vault-copy3-");
      for (const type of productionSchema.objects.map((o) => o.name)) {
        const src = join(vault, type);
        if (existsSync(src)) cpSync(src, join(d, type), { recursive: true });
      }
      return d;
    })(),
  );
  if (!treesEqual(snapFull1, snapFull3)) {
    fail("G4(c): reordering tied created_at rows changed output");
  }

  // Static: project.ts must pass limit null
  const projectSrc = readFileSync(PROJECT_TS, "utf8");
  if (
    !/queryObjects\s*\(\s*db\s*,\s*typeName\s*,\s*undefined\s*,\s*null/.test(
      projectSrc,
    )
  ) {
    fail("G4: project.ts must call queryObjects(..., undefined, null)");
  }

  rmSync(kernelDir, { recursive: true, force: true });
  rmSync(vault, { recursive: true, force: true });
  rmSync(artifactStore, { recursive: true, force: true });
  rmSync(copyDir, { recursive: true, force: true });
}

// --- G5 schema-driven -------------------------------------------------

async function assertG5(): Promise<void> {
  const { path: kernelPath, dir: kernelDir } = makeKernelDb();
  const db = openKernel(kernelPath);
  seedExperimentalFixtureTable(db);
  seedSession(db, "session-g5");
  closeKernel(db);

  const vault = makeFixtureVault();
  const schemaModule = join(PKG_ROOT, "fixtures/experimental-schema.ts");

  // Without fixture schema — no experimental folder
  let run = await runProjectorAsync({
    kernelDb: kernelPath,
    vaultRoot: vault,
  });
  if (run.code !== 0) fail(`G5 baseline project failed: ${run.stderr}`);
  if (existsSync(join(vault, "experimental"))) {
    fail("G5: experimental folder must not appear without fixture schema");
  }

  // With fixture schema — folder appears populated, no projector edit
  run = await runProjectorAsync({
    kernelDb: kernelPath,
    vaultRoot: vault,
    schemaModule,
  });
  if (run.code !== 0) fail(`G5 fixture project failed: ${run.stderr}`);
  if (!existsSync(join(vault, "experimental"))) {
    fail("G5: fixture schema must produce experimental/ folder");
  }
  const notes = readdirSync(join(vault, "experimental"));
  if (notes.length === 0) {
    fail("G5: experimental/ folder must be populated");
  }
  // Confirm schema module actually includes experimental (sanity)
  if (!experimentalSchema.objects.some((o) => o.name === "experimental")) {
    fail("G5: fixture schema missing experimental object");
  }

  // Static: projector iterates schema.objects, not a hand list of type names
  const projectSrc = readFileSync(PROJECT_TS, "utf8");
  if (!/schema\.objects/.test(projectSrc)) {
    fail("G5: project.ts must iterate schema.objects");
  }
  // Hand-list bait target: a frozen array of type name string literals as the
  // iteration source would fail the fixture. Ensure we don't have one.
  if (
    /const\s+TYPES\s*=\s*\[[^\]]*["']artifact["'][^\]]*["']agent_session["']/.test(
      projectSrc,
    )
  ) {
    fail("G5: project.ts appears to hand-list object types");
  }

  rmSync(kernelDir, { recursive: true, force: true });
  rmSync(vault, { recursive: true, force: true });
}

/**
 * REWORK ROUND 1 — missing-type skip as robustness.
 * Fixture DB is built from subset DDL in fixture-seed.ts, not from the live
 * golden/migration.sql, so the gate cannot inherit schema/database agreement.
 */
async function assertMissingTypeSkip(): Promise<void> {
  const dir = fixtureTemp("incomplete-");
  const kernelPath = join(dir, "kernel.db");
  createIncompleteKernelFixture(kernelPath);

  // Confirm the fixture is incomplete relative to the production schema.
  const db = openKernel(kernelPath, { readonly: true });
  const present = new Set(
    (
      db
        .query(`SELECT name FROM sqlite_master WHERE type = 'table'`)
        .all() as Array<{ name: string }>
    ).map((r) => r.name),
  );
  closeKernel(db);

  const declared = productionSchema.objects.map((o) => o.name);
  const expectedMissing = declared.filter((n) => !present.has(n));
  if (expectedMissing.length === 0) {
    fail(
      "missing-type: fixture must lack at least one declared type table (built from subset DDL, not live migration)",
    );
  }
  if (!present.has("artifact") || !present.has("agent_session")) {
    fail("missing-type: fixture must still carry artifact and agent_session");
  }

  const vault = makeFixtureVault();
  const run = await runProjectorAsync({
    kernelDb: kernelPath,
    vaultRoot: vault,
  });
  if (run.code !== 0) {
    fail(`missing-type: projector must complete on incomplete DB: ${run.stderr}`);
  }

  // Projects types that exist
  if (!existsSync(join(vault, "artifact"))) {
    fail("missing-type: expected artifact/ folder for present table");
  }
  if (!existsSync(join(vault, "agent_session"))) {
    fail("missing-type: expected agent_session/ folder for present table");
  }
  // Does not create folders for missing types
  for (const name of expectedMissing) {
    if (existsSync(join(vault, name))) {
      fail(`missing-type: must not project folder for missing table ${name}`);
    }
  }

  // Run summary names every skipped type
  for (const name of expectedMissing) {
    if (!run.stdout.includes(name)) {
      fail(
        `missing-type: run summary must name skipped type ${name}; stdout was:\n${run.stdout}`,
      );
    }
  }
  if (!/Skipped declared types \(\d+\)/.test(run.stdout)) {
    fail("missing-type: run summary must report skipped declared types");
  }

  // Static: project.ts must query sqlite_master and skip, never drop readonly
  const projectSrc = readFileSync(PROJECT_TS, "utf8");
  if (!/sqlite_master/.test(projectSrc)) {
    fail("missing-type: project.ts must query sqlite_master for present tables");
  }
  if (!/typesSkipped/.test(projectSrc)) {
    fail("missing-type: project.ts must record typesSkipped");
  }
  const cliSrc = readFileSync(join(SRC_DIR, "cli.ts"), "utf8");
  if (!/readonly:\s*true/.test(cliSrc)) {
    fail("missing-type: cli must keep openKernel(..., { readonly: true })");
  }

  rmSync(dir, { recursive: true, force: true });
  rmSync(vault, { recursive: true, force: true });
}

// --- main -------------------------------------------------------------

async function main(): Promise<void> {
  clearFixtureRoot();
  try {
    console.log("vault-projection: D1 env refusal…");
    await assertEnvRefusal();
    console.log("vault-projection: G1…");
    await assertG1();
    console.log("vault-projection: G2…");
    await assertG2();
    console.log("vault-projection: G3…");
    await assertG3();
    console.log("vault-projection: G4…");
    await assertG4();
    console.log("vault-projection: G5…");
    await assertG5();
    console.log("vault-projection: missing-type skip…");
    await assertMissingTypeSkip();
    console.log("vault-projection OK");
  } finally {
    clearFixtureRoot();
  }
}

if (import.meta.main) {
  try {
    await main();
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

export { main as runVaultProjectionGate };
