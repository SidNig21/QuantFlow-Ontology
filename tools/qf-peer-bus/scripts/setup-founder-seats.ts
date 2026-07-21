/**
 * Idempotent founder seat MCP rewrite + Kernel db init (peer-bus canvas PASS).
 *
 * Writes `mcp_servers.qf-peer-bus` into each profile's config.yaml directly
 * (Hermes `mcp add` is interactive / TTY-gated — not agent-safe).
 *
 *   bun run setup-seats
 *   bun run setup-seats -- --dry-run
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { closeKernel, openKernel } from "qf-kernel";

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = resolve(HERE, "..");
const REPO_ROOT = resolve(PKG_ROOT, "../..");
const SERVER_TS = join(PKG_ROOT, "src/server.ts");
const HOME = process.env.HOME ?? homedir();
const BUS_DIR = join(HOME, ".qf-peer-bus");
const KERNEL_DB = join(BUS_DIR, "kernel.db");
const PEER_BUS_DB = join(BUS_DIR, "peer-bus.db");

const PROFILES = [
  { profile: "qf-orchestrator", role: "orchestrator" },
  { profile: "qf-worker", role: "worker" },
  { profile: "qf-worker-2", role: "worker2" },
] as const;

function which(bin: string): string | null {
  const pathEnv = process.env.PATH ?? "";
  for (const dir of pathEnv.split(":")) {
    const cand = join(dir, bin);
    if (existsSync(cand)) return cand;
  }
  return null;
}

function mcpBlock(role: string, bunBin: string): string {
  return [
    "mcp_servers:",
    "  qf-peer-bus:",
    `    command: ${bunBin}`,
    "    args:",
    `      - ${SERVER_TS}`,
    "    env:",
    `      QF_PEER_ROLE: ${role}`,
    `      QF_KERNEL_DB: ${KERNEL_DB}`,
    `      QF_PEER_BUS_DB: ${PEER_BUS_DB}`,
    "    enabled: true",
    "",
  ].join("\n");
}

/** Upsert mcp_servers.qf-peer-bus in a Hermes profile config.yaml. */
function upsertMcpConfig(
  configPath: string,
  role: string,
  bunBin: string,
  dryRun: boolean,
): void {
  const text = readFileSync(configPath, "utf8");
  const block = mcpBlock(role, bunBin);

  let next: string;
  if (/^mcp_servers:\s*$/m.test(text) || /^mcp_servers:\n/m.test(text)) {
    // Replace entire mcp_servers: … section through next top-level key or EOF.
    next = text.replace(
      /^mcp_servers:\n(?:[ \t].*\n|\n)*/m,
      block,
    );
    if (next === text) {
      // Fallback: strip old qf-peer-bus subtree then prepend fresh block.
      const stripped = text.replace(
        /^mcp_servers:\n(?:[ \t].*\n|\n)*/m,
        "",
      );
      next = block + stripped;
    }
  } else {
    // Insert before Security comment block if present, else append.
    const security = text.indexOf("# ── Security");
    if (security >= 0) {
      next = text.slice(0, security) + block + text.slice(security);
    } else {
      next = text.replace(/\s*$/, "\n\n") + block;
    }
  }

  if (dryRun) {
    console.log(`# would write mcp_servers.qf-peer-bus → ${configPath}`);
    console.log(block);
    return;
  }
  writeFileSync(configPath, next);
  console.log(`setup-founder-seats: wrote ${configPath}`);
}

async function mcpTest(hermesBin: string, profile: string): Promise<boolean> {
  const proc = Bun.spawn(
    [hermesBin, "-p", profile, "mcp", "test", "qf-peer-bus"],
    { stdout: "pipe", stderr: "pipe" },
  );
  const [stdout, stderr, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  const out = `${stdout}\n${stderr}`;
  process.stdout.write(stdout);
  if (stderr.trim()) process.stderr.write(stderr);
  const ok =
    code === 0 &&
    !/not found/i.test(out) &&
    (/tool/i.test(out) || /ok|pass|success|connected/i.test(out));
  return ok;
}

async function main(): Promise<number> {
  const dryRun = process.argv.includes("--dry-run");
  console.log("setup-founder-seats: peer-bus canvas PASS");
  console.log(`setup-founder-seats: repo=${REPO_ROOT}`);
  console.log(`setup-founder-seats: server=${SERVER_TS}`);
  console.log(`setup-founder-seats: kernel=${KERNEL_DB}`);
  console.log(`setup-founder-seats: bus=${PEER_BUS_DB}`);
  if (dryRun) console.log("setup-founder-seats: DRY-RUN (no writes)");

  const bunBin = which("bun");
  if (!bunBin) {
    console.error("setup-founder-seats: bun not on PATH");
    return 2;
  }
  const hermesBin = which("hermes");
  if (!hermesBin) {
    console.error(
      "setup-founder-seats: hermes not on PATH — install Hermes, then re-run",
    );
    return 2;
  }
  if (!existsSync(SERVER_TS)) {
    console.error(`setup-founder-seats: missing server at ${SERVER_TS}`);
    return 2;
  }

  if (!dryRun) {
    mkdirSync(BUS_DIR, { recursive: true });
    const db = openKernel(KERNEL_DB);
    closeKernel(db);
    console.log("setup-founder-seats: Kernel schema ready at", KERNEL_DB);
  } else {
    console.log(`$ openKernel(${KERNEL_DB})`);
  }

  for (const { profile, role } of PROFILES) {
    const profileHome = join(HOME, ".hermes/profiles", profile);
    const configPath = join(profileHome, "config.yaml");
    if (!existsSync(configPath)) {
      console.error(
        `setup-founder-seats: missing profile config ${configPath}`,
      );
      console.error(
        "  Create once (founder): hermes profile create/clone → qf-orchestrator / qf-worker",
      );
      return 3;
    }
    upsertMcpConfig(configPath, role, bunBin, dryRun);
  }

  if (dryRun) {
    for (const { profile } of PROFILES) {
      console.log(`$ hermes -p ${profile} mcp test qf-peer-bus`);
    }
    console.log("setup-founder-seats: OK (dry-run)");
    return 0;
  }

  for (const { profile } of PROFILES) {
    console.log(`$ hermes -p ${profile} mcp test qf-peer-bus`);
    const ok = await mcpTest(hermesBin, profile);
    if (!ok) {
      console.error(`setup-founder-seats: mcp test failed for ${profile}`);
      return 1;
    }
  }

  console.log("setup-founder-seats: OK");
  console.log(
    "setup-founder-seats: next — open QuantFlow, Spawn Hermes Orchestrator + Worker, run founder canvas checklist",
  );
  return 0;
}

process.exit(await main());
