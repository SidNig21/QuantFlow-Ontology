import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { assertResearchWorldContract, RESEARCH_WORLD_VISIBLE_DEADLINE_MS } from "./research-world-visible.ts";

const REPO_ROOT = join(import.meta.dir, "../..");

describe("research-world-visible gate contract", () => {
  test("keeps the live gate bounded and contract-complete without launching in the focused test", () => {
    expect(RESEARCH_WORLD_VISIBLE_DEADLINE_MS).toBe(60_000);
    expect(() => assertResearchWorldContract()).not.toThrow();
  });

  test("keeps fixture truth out of the renderer and exposes inspection attributes", () => {
    const renderer = readFileSync(join(REPO_ROOT, "collab-electron/src/windows/shell/src/research-world.js"), "utf8");
    const forbidden = new RegExp([
      ["bun", "sqlite"].join(":"),
      ["node", "sqlite"].join(":"),
      "better" + "-sqlite3",
      ["node", "fs"].join(":"),
    ].join("|"));
    expect(renderer).not.toMatch(forbidden);
    expect(renderer).toContain("qfWorldType");
    expect(renderer).toContain("qfWorldId");
    expect(renderer).toContain("qfWorldField");
  });
});
