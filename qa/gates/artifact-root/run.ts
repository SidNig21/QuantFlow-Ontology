/**
 * WO-K3 — artifact root gate (G4 / D5).
 *
 * - resolveArtifactRoot default under temp HOME
 * - publish via execute with path under resolved root; storage_ref file exists
 * - agent-host production publish path must not reference legacy collaborator shelf
 */
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  closeKernel,
  contentHash,
  execute,
  openKernel,
  resolveArtifactRoot,
} from "qf-kernel";

const REPO_ROOT = join(import.meta.dir, "../../..");
const FIXTURE_ENV = "QF_KERNEL_SYNC_UNSAFE_FIXTURES_ONLY";
const TRACE = { trace_id: "k3-art-root", span_id: "k3-art-span" };

function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

function gateDefaultResolver(): string | null {
  const savedHome = process.env.HOME;
  const savedRoot = process.env.QF_ARTIFACT_ROOT;
  const home = mkdtempSync(join(tmpdir(), "qf-k3-art-home-"));
  process.env.HOME = home;
  delete process.env.QF_ARTIFACT_ROOT;

  try {
    const r = resolveArtifactRoot();
    if (r.provenance !== "default") {
      return `artifact-root: expected provenance=default, got ${r.provenance}`;
    }
    const expected = join(home, ".quantflow", "artifacts");
    if (r.path !== expected) {
      return `artifact-root: expected ${expected}, got ${r.path}`;
    }
    if (!existsSync(expected)) {
      return "artifact-root: default path was not created";
    }
    console.log("artifact-root G4 resolver: PASS");
    return null;
  } finally {
    if (savedHome === undefined) delete process.env.HOME;
    else process.env.HOME = savedHome;
    if (savedRoot === undefined) delete process.env.QF_ARTIFACT_ROOT;
    else process.env.QF_ARTIFACT_ROOT = savedRoot;
    rmSync(home, { recursive: true, force: true });
  }
}

function gatePublishUnderRoot(): string | null {
  const savedHome = process.env.HOME;
  const savedRoot = process.env.QF_ARTIFACT_ROOT;
  const home = mkdtempSync(join(tmpdir(), "qf-k3-art-pub-"));
  process.env.HOME = home;
  delete process.env.QF_ARTIFACT_ROOT;
  process.env[FIXTURE_ENV] = "1";

  try {
    const root = resolveArtifactRoot().path;
    const relName = "gate-report.md";
    const filePath = join(root, relName);
    const bytes = new TextEncoder().encode("k3 artifact-root gate publish body");
    writeFileSync(filePath, bytes);

    const db = openKernel(":memory:");
    const result = execute(
      db,
      "publish_artifact",
      {
        kind: "report",
        path: filePath,
        storage_ref: filePath,
        content_hash: contentHash(bytes),
      },
      TRACE,
    );
    closeKernel(db);

    const storageRef = String(result.state.storage_ref);
    if (!existsSync(storageRef)) {
      return `artifact-root: storage_ref missing on disk: ${storageRef}`;
    }
    if (!storageRef.startsWith(root)) {
      return `artifact-root: storage_ref outside resolved root: ${storageRef}`;
    }
    console.log("artifact-root D5 publish: PASS");
    return null;
  } finally {
    delete process.env[FIXTURE_ENV];
    if (savedHome === undefined) delete process.env.HOME;
    else process.env.HOME = savedHome;
    if (savedRoot === undefined) delete process.env.QF_ARTIFACT_ROOT;
    else process.env.QF_ARTIFACT_ROOT = savedRoot;
    rmSync(home, { recursive: true, force: true });
  }
}

function gateAgentHostGrep(): string | null {
  const src = readFileSync(
    join(REPO_ROOT, "collab-electron/src/main/agent-host.ts"),
    "utf8",
  );
  const stripped = stripComments(src);
  if (stripped.includes(".collaborator/agent-artifacts")) {
    return "artifact-root: agent-host still references .collaborator/agent-artifacts in production code";
  }
  if (!stripped.includes("getArtifactRoot")) {
    return "artifact-root: agent-host publish path must use getArtifactRoot()";
  }
  console.log("artifact-root G4 grep: PASS");
  return null;
}

async function main(): Promise<number> {
  for (const fn of [gateDefaultResolver, gatePublishUnderRoot, gateAgentHostGrep]) {
    const err = fn();
    if (err) {
      console.error(`artifact-root FAIL: ${err}`);
      return 1;
    }
  }
  console.log("artifact-root OK");
  return 0;
}

process.exit(await main());
