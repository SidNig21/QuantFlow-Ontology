/**
 * Law E — three independent claims (WO-K2). Membership on one allowlist never
 * skips the others.
 *
 * SCOPE: this gate covers the repo OUTSIDE collab-electron/, which
 * kernel-sole-writer-app.ts governs. Between them every tree is covered exactly
 * once.
 *
 * Claims:
 *   1. Driver/SQL — bun:sqlite / better-sqlite3 / node:sqlite and domain
 *      DDL/DML (CREATE TABLE, INSERT INTO, UPDATE ... SET, DELETE FROM). Grep,
 *      not a parser: cannot catch dynamically-built SQL.
 *   2. Open — openKernel( / openAppKernel( call sites outside packages/qf-kernel/.
 *   3. Write — execute( call sites (comment-stripped) outside packages/qf-kernel/.
 *
 * Calling execute() from outside the package is the sanctioned write path; it
 * must appear on the write allowlist. What was false was the old docstring's
 * claim that only packages/qf-kernel may *open* SQLite — openKernel is the
 * front door and this gate must see it.
 *
 * Falsify (D6 — must flow through the same offender path; bare exit forbidden):
 *   QF_KERNEL_SOLE_WRITER_FALSIFY_OPEN=1
 *   QF_KERNEL_SOLE_WRITER_FALSIFY_WRITE=1
 */
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, relative } from "node:path";

const REPO_ROOT = join(import.meta.dir, "../..");

const DRIVER_SQL_PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: "bun:sqlite", re: /bun:sqlite/ },
  { name: "better-sqlite3", re: /better-sqlite3/ },
  { name: "node:sqlite", re: /node:sqlite/ },
  { name: "CREATE TABLE", re: /\bCREATE\s+TABLE\b/i },
  { name: "INSERT INTO", re: /\bINSERT\s+INTO\b/i },
  { name: "UPDATE ... SET", re: /\bUPDATE\s+[A-Za-z_][\w.]*\s+SET\b/i },
  { name: "DELETE FROM", re: /\bDELETE\s+FROM\b/i },
];

const OPEN_PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: "openKernel(", re: /\bopenKernel\s*\(/ },
  { name: "openAppKernel(", re: /\bopenAppKernel\s*\(/ },
];

const WRITE_PATTERN = { name: "execute-call", re: /\bexecute\s*\(/ };

/** Who may talk to SQLite / issue raw DDL/DML (driver/SQL claim only). */
const DRIVER_SQL_ALLOW = [
  "packages/qf-kernel/",
  "qf-kernel-schema/",
  "qa/gates/kernel-sole-writer.ts",
  "qa/gates/kernel-sole-writer-app.ts",
  // WO-PEER-BUS: transport inbox SQLite only — never Kernel DDL/DML.
  "tools/qf-peer-bus/src/bus.ts",
  "collab-electron/",
  "qa/gates/dock-registry/run.ts",
  // WO-D1: gate-only temporary Kernels exercise partial-schema rejection,
  // transactional rollback, and the one-time profile-identity upgrade.
  "qa/gates/dock-profile-identity/run.ts",
  // WO-D1: frozen pre-upgrade fixture seeding that execute() cannot express.
  "qa/fixtures/pre-d1-profile-identity/seed.sql",
  // WO-V1: fixture Kernel seeding that execute() cannot express —
  // forcing identical created_at (G4 tied-timestamp fixture; execute() always
  // stamps new Date().toISOString()) and reshuffling physical row order via
  // DELETE+INSERT (G4(c) stable-tiebreak proof; storage order is not a domain
  // operation). Links go through execute()'s links: envelope — not here.
  "qa/gates/vault-projection/fixture-seed.ts",
  // WO-K3: pinned prior-schema fixture SQL (RULING 4 strategy A) — gate-only.
  "qa/fixtures/kernel-drift/",
  "qa/gates/kernel-drift/run.ts",
  "qa/gates/artifact-root/run.ts",
  // WO-107b: gate-only historical fixtures, raw count oracle, and injected driver fault.
  "qa/gates/market-ingest/run.ts",
];

/**
 * Who may call openKernel / openAppKernel outside packages/qf-kernel/.
 * Adding an entry is a finding to report, not a quiet edit.
 */
const OPEN_ALLOW = [
  "collab-electron/",
  "tools/qf-read-tools/src/server.ts",
  "tools/qf-read-tools/src/harness.ts",
  "tools/qf-read-tools/src/gates/tool-discovery.ts",
  "tools/qf-read-tools/src/gates/action-transport.ts",
  "tools/qf-read-tools/src/gates/publish-artifact-root.ts",
  "tools/qf-read-tools/src/gates/kernel-one-world.ts",
  // WO-V1: read-only projector CLI + its fixture gate (open only; writes are
  // separately allowlisted for the gate below).
  "tools/qf-vault-projection/src/cli.ts",
  "tools/qf-vault-projection/src/gate.ts",
  "tools/qf-peer-bus/src/bus.ts",
  "tools/qf-peer-bus/src/harness.ts",
  "tools/qf-peer-bus/scripts/setup-founder-seats.ts",
  "species/hermes/register.ts",
  "species/hermes/host-admit-kernel.ts",
  "species/hermes/a2a-4tile-smoke.ts",
  "species/critic-mock/register.ts",
  "qa/gates/dock-registry/run.ts",
  // WO-D1: gate-only profile identity and frozen-upgrade proof.
  "qa/gates/dock-profile-identity/run.ts",
  "qa/gates/dock-definition-launch/run.ts",
  "qa/gates/boot-reconcile/run.ts",
  "qa/gates/agent-path/run.ts",
  "qa/gates/kernel-drift/run.ts",
  "qa/gates/artifact-root/run.ts",
  "qa/gates/market-ingest/run.ts",
  "qa/gates/kernel-sole-writer.ts",
  "qa/gates/kernel-sole-writer-app.ts",
];

/**
 * Who may call execute( outside packages/qf-kernel/ (after comment-strip).
 * packages/qf-kernel/ is always allowed for all claims via path prefix.
 */
const WRITE_ALLOW = [
  "tools/qf-read-tools/src/register.ts",
  "tools/qf-read-tools/src/harness.ts",
  "tools/qf-read-tools/src/gates/action-transport.ts",
  "tools/qf-read-tools/src/gates/kernel-one-world.ts",
  // WO-V1 gate seeds fixture Kernels through execute() (G1–G5); the projector
  // CLI itself never writes.
  "tools/qf-vault-projection/src/gate.ts",
  "tools/qf-peer-bus/src/bus.ts",
  "species/hermes/register.ts",
  "species/hermes/host-admit-kernel.ts",
  "species/hermes/a2a-4tile-smoke.ts",
  "species/critic-mock/register.ts",
  "qa/gates/dock-registry/run.ts",
  // WO-D1: gate-only setup and assertions use the sanctioned write boundary.
  "qa/gates/dock-profile-identity/run.ts",
  // WO-D2: gate-only definition bootstrap/session lineage fixtures.
  "qa/gates/dock-definition-launch/run.ts",
  "qa/gates/boot-reconcile/run.ts",
  "qa/gates/agent-path/run.ts",
  "qa/gates/kernel-drift/run.ts",
  "qa/gates/artifact-root/run.ts",
  "qa/gates/market-ingest/run.ts",
  "collab-electron/",
];

/** Production openers that must never pass { create: true } (G3b). */
const PRODUCTION_NO_CREATE = [
  "tools/qf-read-tools/src/server.ts",
  "tools/qf-peer-bus/src/bus.ts",
  "species/hermes/register.ts",
  "species/critic-mock/register.ts",
  // WO-V1 projector: readonly open only; never create a Kernel as a side effect.
  "tools/qf-vault-projection/src/cli.ts",
];

const CODE_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".sql"]);

const SKIP_DIR_NAMES = new Set([
  "node_modules",
  ".git",
  "dist",
  "out",
  "packed",
  "coverage",
  ".turbo",
]);

const FALSIFY_DIR = join(REPO_ROOT, "tools", "_qf-k2-sole-writer-bait");
const FALSIFY_OPEN_ENV = "QF_KERNEL_SOLE_WRITER_FALSIFY_OPEN";
const FALSIFY_WRITE_ENV = "QF_KERNEL_SOLE_WRITER_FALSIFY_WRITE";

function onAllowlist(rel: string, prefixes: string[]): boolean {
  if (rel.startsWith("packages/qf-kernel/")) return true;
  return prefixes.some((p) => rel === p || rel.startsWith(p));
}

/** Strip // line and /* block comments so docstrings do not force write allowlist. */
function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

function walk(dir: string, out: string[]): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (SKIP_DIR_NAMES.has(name)) continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      walk(full, out);
      continue;
    }
    const ext = name.includes(".") ? `.${name.split(".").pop()}` : "";
    if (!CODE_EXT.has(ext)) continue;
    out.push(full);
  }
}

type Offender = { rel: string; claim: "driver/sql" | "open" | "write" | "create-ban"; detail: string };

function plantFalsifyBaits(): string[] {
  const planted: string[] = [];
  const wantOpen = process.env[FALSIFY_OPEN_ENV] === "1";
  const wantWrite = process.env[FALSIFY_WRITE_ENV] === "1";
  if (!wantOpen && !wantWrite) return planted;

  mkdirSync(FALSIFY_DIR, { recursive: true });
  if (wantOpen) {
    const p = join(FALSIFY_DIR, "falsify-open.ts");
    writeFileSync(
      p,
      `// WO-K2 falsify bait — open claim only\nimport { openKernel } from "qf-kernel";\nopenKernel("/tmp/qf-k2-falsify-open.db");\n`,
    );
    planted.push(p);
  }
  if (wantWrite) {
    const p = join(FALSIFY_DIR, "falsify-write.ts");
    // Build without a literal `execute(` in *this* file (not on write allowlist).
    const call = "execute" + "(";
    writeFileSync(
      p,
      `// WO-K2 falsify bait — write claim only\nimport { execute } from "qf-kernel";\n${call}null as never, "noop", {}, { trace_id: "t", span_id: "s" });\n`,
    );
    planted.push(p);
  }
  return planted;
}

function removeFalsifyBaits(): void {
  try {
    rmSync(FALSIFY_DIR, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

function checkProductionCreateBan(offenders: Offender[]): void {
  const createRe = /create\s*:\s*true/;
  for (const rel of PRODUCTION_NO_CREATE) {
    const full = join(REPO_ROOT, rel);
    let text: string;
    try {
      text = readFileSync(full, "utf8");
    } catch {
      offenders.push({
        rel,
        claim: "create-ban",
        detail: "production opener path missing",
      });
      continue;
    }
    if (createRe.test(stripComments(text))) {
      offenders.push({
        rel,
        claim: "create-ban",
        detail: "create: true forbidden on production opener",
      });
    }
  }
}

export function checkKernelSoleWriter(): { ok: boolean; offenders: string[] } {
  plantFalsifyBaits();
  try {
    const files: string[] = [];
    walk(REPO_ROOT, files);
    const offenders: Offender[] = [];

    for (const full of files) {
      const rel = relative(REPO_ROOT, full).split("\\").join("/");
      let text: string;
      try {
        text = readFileSync(full, "utf8");
      } catch {
        continue;
      }

      // Claim 1 — driver/SQL (independent of open/write membership)
      if (!onAllowlist(rel, DRIVER_SQL_ALLOW)) {
        for (const p of DRIVER_SQL_PATTERNS) {
          if (p.re.test(text)) {
            offenders.push({ rel, claim: "driver/sql", detail: p.name });
            break;
          }
        }
      }

      // Claim 2 — open front door
      if (!onAllowlist(rel, OPEN_ALLOW)) {
        for (const p of OPEN_PATTERNS) {
          if (p.re.test(text)) {
            offenders.push({ rel, claim: "open", detail: p.name });
            break;
          }
        }
      }

      // Claim 3 — write path (comment-stripped)
      if (!onAllowlist(rel, WRITE_ALLOW)) {
        const stripped = stripComments(text);
        if (WRITE_PATTERN.re.test(stripped)) {
          offenders.push({ rel, claim: "write", detail: WRITE_PATTERN.name });
        }
      }
    }

    checkProductionCreateBan(offenders);

    if (offenders.length > 0) {
      console.error("kernel-sole-writer: Law E claim failure(s):");
      for (const o of offenders) {
        console.error(`  - [${o.claim}] ${o.rel} (${o.detail})`);
      }
      return {
        ok: false,
        offenders: offenders.map((o) => `[${o.claim}] ${o.rel} (${o.detail})`),
      };
    }
    return { ok: true, offenders: [] };
  } finally {
    // Always remove: mkdir only happens when planting, but a prior leaked
    // empty dir (pre-fix happy path) must not linger either.
    removeFalsifyBaits();
  }
}

if (import.meta.main) {
  const { ok } = checkKernelSoleWriter();
  process.exit(ok ? 0 : 1);
}
