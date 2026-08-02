#!/usr/bin/env bun
/**
 * WO-107 five-bait mutation gate. Each bait copies the production source,
 * changes one guarded behavior, proves the focused tests go red, then runs
 * those same tests against the restored source and proves green.
 */
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SOURCE_ROOT = import.meta.dir;
const PACKAGE_ROOT = join(SOURCE_ROOT, "..");

type Bait = {
  number: number;
  label: string;
  sourceFile: string;
  testFile: string;
  needle: string;
  replacement: string;
};

const BAITS: readonly Bait[] = [
  {
    number: 1,
    label: "caller credentials escape",
    sourceFile: "transport.ts",
    testFile: "parser.test.ts",
    needle: 'credentials: "omit",',
    replacement: 'credentials: "include",',
  },
  {
    number: 2,
    label: "Kernel publish before durable source",
    sourceFile: "runner.ts",
    testFile: "runner.test.ts",
    needle:
      "const durableFile = ensureArtifactFile(options.artifactRoot, artifactId, bytes);",
    replacement:
      "const durableFile = { path: finalPath, createdFinal: false };",
  },
  {
    number: 3,
    label: "removed pre-game selector predicate",
    sourceFile: "parser.ts",
    testFile: "parser.test.ts",
    needle: "event.live !== false ||",
    replacement: "false ||",
  },
  {
    number: 4,
    label: "reissued stable venue instead of read classification",
    sourceFile: "runner.ts",
    testFile: "runner.test.ts",
    needle:
      'const existing = access.getObject(options.db, "venue", VENUE_ID);\n  if (!existing) {',
    replacement:
      'const existing = access.getObject(options.db, "venue", VENUE_ID);\n  if (true) {',
  },
  {
    number: 5,
    label: "removed staging cleanup",
    sourceFile: "artifact-store.ts",
    testFile: "artifact-store.test.ts",
    needle: "removeFile(stagingPath);",
    replacement: "void stagingPath;",
  },
];

async function runTest(testPath: string, cwd: string): Promise<{
  code: number;
  output: string;
}> {
  const child = Bun.spawn(["bun", "test", testPath], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, NO_COLOR: "1" },
  });
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  return { code, output: stdout + stderr };
}

function mutateExactlyOnce(path: string, needle: string, replacement: string): void {
  const source = readFileSync(path, "utf8");
  const matches = source.split(needle).length - 1;
  if (matches !== 1) {
    throw new Error(`mutation needle count for ${path} was ${matches}, expected 1`);
  }
  writeFileSync(path, source.replace(needle, replacement));
}

async function runBait(bait: Bait): Promise<void> {
  const mutantRoot = mkdtempSync(join(tmpdir(), `qf-bovada-bait-${bait.number}-`));
  const mutantSource = join(mutantRoot, "src");
  try {
    cpSync(SOURCE_ROOT, mutantSource, { recursive: true });
    symlinkSync(join(PACKAGE_ROOT, "node_modules"), join(mutantRoot, "node_modules"));
    mutateExactlyOnce(
      join(mutantSource, bait.sourceFile),
      bait.needle,
      bait.replacement,
    );

    const red = await runTest(join(mutantSource, bait.testFile), mutantRoot);
    if (red.code === 0) {
      throw new Error(
        `BAIT ${bait.number} stayed green after mutation: ${bait.label}`,
      );
    }
    console.log(`BAIT ${bait.number} RED: ${bait.label} was detected`);

    const green = await runTest(join(SOURCE_ROOT, bait.testFile), PACKAGE_ROOT);
    if (green.code !== 0) {
      process.stdout.write(green.output);
      throw new Error(
        `BAIT ${bait.number} restore did not return green: ${bait.label}`,
      );
    }
    console.log(`BAIT ${bait.number} GREEN: exact production source restored`);
  } finally {
    rmSync(mutantRoot, { recursive: true, force: true });
  }
}

async function main(): Promise<void> {
  console.log("qf-bovada-football mutation gate: fixture-only, no network");
  for (const bait of BAITS) await runBait(bait);
  console.log("PASS bovada-football five-bait mutation gate");
}

main().catch((error: unknown) => {
  console.error(
    "FAIL bovada-football mutation gate:",
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});
