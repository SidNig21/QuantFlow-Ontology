/**
 * WO-K3 — artifact root gate (G4 / D5).
 *
 * - resolveArtifactRoot default under temp HOME
 * - production helper writes an absent file, then execute publishes the same bytes
 * - agent-host is statically coupled to that helper and the resolved root
 */
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join, relative, sep } from "node:path";
import {
  closeKernel,
  contentHash,
  execute,
  openKernel,
  queryObjects,
  resolveArtifactRoot,
} from "qf-kernel";
import { buildArtifactRootInstallPlan } from "../artifact-root.ts";
import { writeAgentReportArtifact } from "../../../collab-electron/src/main/agent-artifact-writer.ts";

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

function gateEnvNotDirectory(): string | null {
  const savedRoot = process.env.QF_ARTIFACT_ROOT;
  const dir = mkdtempSync(join(tmpdir(), "qf-k3-art-notdir-"));
  const filePath = join(dir, "not-a-directory");
  const bytes = Buffer.from("k3-art-root-gate-canary");
  writeFileSync(filePath, bytes);

  process.env.QF_ARTIFACT_ROOT = filePath;

  try {
    try {
      const r = resolveArtifactRoot();
      return `artifact-root: accepted non-directory QF_ARTIFACT_ROOT: ${r.path}`;
    } catch (error) {
      const message = String(error);
      if (!message.includes("QF_ARTIFACT_ROOT is not a directory")) {
        return `artifact-root: expected non-directory rejection, got: ${message}`;
      }
    }

    if (!readFileSync(filePath).equals(bytes)) {
      return "artifact-root: non-directory canary file bytes changed";
    }

    console.log("artifact-root G4 env not-directory: PASS");
    return null;
  } finally {
    if (savedRoot === undefined) delete process.env.QF_ARTIFACT_ROOT;
    else process.env.QF_ARTIFACT_ROOT = savedRoot;
    rmSync(dir, { recursive: true, force: true });
  }
}

function gatePublishUnderRoot(): string | null {
  const savedHome = process.env.HOME;
  const savedRoot = process.env.QF_ARTIFACT_ROOT;
  const savedFixture = process.env[FIXTURE_ENV];
  const home = mkdtempSync(join(tmpdir(), "qf-k3-art-pub-"));
  process.env.HOME = home;
  delete process.env.QF_ARTIFACT_ROOT;
  process.env[FIXTURE_ENV] = "1";

  const db = openKernel(":memory:");
  try {
    const root = resolveArtifactRoot().path;
    const sessionId = "gate-report";
    const expectedPath = join(root, `${sessionId}.md`);
    if (existsSync(expectedPath)) {
      return `artifact-root: accepted production path existed before writer call: ${expectedPath}`;
    }

    const falsify = process.env.QF_ARTIFACT_ROOT_FALSIFY;
    if (
      falsify !== undefined &&
      falsify !== "writer" &&
      falsify !== "skip-directory"
    ) {
      return `artifact-root: unknown QF_ARTIFACT_ROOT_FALSIFY=${falsify}`;
    }

    let artifact: ReturnType<typeof writeAgentReportArtifact>;
    try {
      artifact = writeAgentReportArtifact({
        sessionId,
        text: "k3 artifact-root production writer body",
        artifactRoot: () => resolveArtifactRoot().path,
        publish: (input) => execute(db, "publish_artifact", input, TRACE),
        ...(falsify === "writer"
          ? { fileWriter: () => {} }
          : {}),
      });
    } catch (error) {
      return `artifact-root: production writer did not create publishable bytes: ${String(error)}`;
    }

    if (!existsSync(artifact.path)) {
      return `artifact-root: production writer left no file: ${artifact.path}`;
    }
    if (artifact.path !== expectedPath) {
      return `artifact-root: production writer path mismatch: ${artifact.path}`;
    }

    const rows = queryObjects(db, "artifact", undefined, null);
    if (rows.length !== 1) {
      return `artifact-root: expected one artifact row, got ${rows.length}`;
    }

    const diskBytes = readFileSync(artifact.path);
    const expectedHash = contentHash(diskBytes);
    const row = rows[0]!;
    if (row.id !== artifact.artifactId || row.content_hash !== expectedHash) {
      return "artifact-root: production bytes and Kernel identity/hash disagree";
    }

    const storageRef = String(row.storage_ref);
    if (!existsSync(storageRef)) {
      return `artifact-root: storage_ref missing on disk: ${storageRef}`;
    }
    const relativePath = relative(realpathSync(root), realpathSync(storageRef));
    if (
      isAbsolute(relativePath) ||
      relativePath === ".." ||
      relativePath.startsWith(`..${sep}`)
    ) {
      return `artifact-root: storage_ref outside resolved root: ${storageRef}`;
    }

    for (const candidate of rows) {
      const candidateRef = String(candidate.storage_ref);
      const candidateRelative = relative(
        realpathSync(root),
        realpathSync(candidateRef),
      );
      if (
        isAbsolute(candidateRelative) ||
        candidateRelative === ".." ||
        candidateRelative.startsWith(`..${sep}`)
      ) {
        return `artifact-root: artifact row points outside resolved root: ${candidateRef}`;
      }
    }

    if (contentHash(artifact.bytes) !== expectedHash) {
      return "artifact-root: helper-returned bytes differ from bytes on disk";
    }

    console.log("artifact-root D5 production writer: PASS");
    return null;
  } finally {
    closeKernel(db);
    if (savedFixture === undefined) delete process.env[FIXTURE_ENV];
    else process.env[FIXTURE_ENV] = savedFixture;
    if (savedHome === undefined) delete process.env.HOME;
    else process.env.HOME = savedHome;
    if (savedRoot === undefined) delete process.env.QF_ARTIFACT_ROOT;
    else process.env.QF_ARTIFACT_ROOT = savedRoot;
    rmSync(home, { recursive: true, force: true });
  }
}

function gateAgentHostCoupling(): string | null {
  const src = readFileSync(
    join(REPO_ROOT, "collab-electron/src/main/agent-host.ts"),
    "utf8",
  );
  const stripped = stripComments(src);
  if (stripped.includes(".collaborator/agent-artifacts")) {
    return "artifact-root: agent-host still references .collaborator/agent-artifacts in production code";
  }
  if (
    !/import\s*\{\s*writeAgentReportArtifact\s*\}\s*from\s*["']\.\/agent-artifact-writer["']/.test(
      stripped,
    )
  ) {
    return "artifact-root: agent-host must import the production artifact writer";
  }
  if (!stripped.includes("writeAgentReportArtifact({")) {
    return "artifact-root: agent-host must call the production artifact writer";
  }
  if (!stripped.includes("artifactRoot: getArtifactRoot")) {
    return "artifact-root: agent-host must give the production writer getArtifactRoot";
  }
  if (/\bwriteFile(?:Sync)?\s*\(/.test(stripped)) {
    return "artifact-root: agent-host must not keep a second artifact byte-writer";
  }
  console.log("artifact-root G4 production coupling: PASS");
  return null;
}

function assertInstallPlan(): string | null {
  const built = buildArtifactRootInstallPlan();
  if (!built.ok) {
    return built.error;
  }

  const expectedNames = ["qf-kernel", "artifact-root"] as const;
  const expectedCwds = [
    join(REPO_ROOT, "packages/qf-kernel"),
    join(REPO_ROOT, "qa/gates/artifact-root"),
  ] as const;

  for (const name of expectedNames) {
    if (!built.entries.some((entry) => entry.name === name)) {
      return `artifact-root: missing install plan entry: ${name}`;
    }
  }
  if (built.entries.length !== expectedNames.length) {
    return `artifact-root: install plan must contain exactly ${expectedNames.join(" then ")}`;
  }
  for (let i = 0; i < expectedNames.length; i += 1) {
    if (built.entries[i]!.name !== expectedNames[i]) {
      return `artifact-root: install plan order must be ${expectedNames.join(" then ")}`;
    }
    if (built.entries[i]!.cwd !== expectedCwds[i]) {
      return `artifact-root: install plan ${expectedNames[i]} cwd must be ${expectedCwds[i]}`;
    }
  }
  return null;
}

async function main(): Promise<number> {
  const planError = assertInstallPlan();
  if (planError) {
    console.error(`artifact-root FAIL: ${planError}`);
    return 1;
  }

  for (const fn of [
    gateDefaultResolver,
    gateEnvNotDirectory,
    gatePublishUnderRoot,
    gateAgentHostCoupling,
  ]) {
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
