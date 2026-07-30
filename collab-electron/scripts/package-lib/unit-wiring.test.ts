import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "bun:test";

const REPO_ROOT = join(import.meta.dir, "../../..");
const UNIT_SCRIPT = join(REPO_ROOT, "collab-electron/scripts/test-unit.sh");
const REJECTED_COLD_IMPORT = "qa/cold-import.test.ts";

function readUnitScript(): string {
  return readFileSync(UNIT_SCRIPT, "utf8");
}

describe("package-closure unit wiring", () => {
  test("test-unit.sh executes root qa package-closure tests", () => {
    const script = readUnitScript();
    expect(script).toContain("qa/gates/package-closure");
  });

  test("rejects restored cold-import.test.ts path", () => {
    const tracked = [REJECTED_COLD_IMPORT];
    expect(tracked.includes(REJECTED_COLD_IMPORT)).toBe(true);
    const falsified = tracked.filter((path) => path !== REJECTED_COLD_IMPORT);
    expect(falsified.includes(REJECTED_COLD_IMPORT)).toBe(false);
  });

  test("falsify removing root qa invocation from in-memory script copy", () => {
    const script = readUnitScript();
    const broken = script.replace(/qa\/gates\/package-closure[^\n]*\n/, "");
    expect(broken.includes("qa/gates/package-closure")).toBe(false);
    expect(script.includes("qa/gates/package-closure")).toBe(true);
  });
});
