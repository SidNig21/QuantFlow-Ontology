import { describe, expect, test } from "bun:test";
import { compareIndependentManifest, measureCleanup, runGovernedReviewGate, runGovernedReviewLiveGate } from "./governed-review.ts";

describe("governed review gates", () => {
  test("parses and runs the focused proof", async () => {
    expect((await runGovernedReviewGate()).ok).toBe(true);
  });

  test("keeps live transport policy constrained", async () => {
    expect((await runGovernedReviewLiveGate()).ok).toBe(true);
  });

  test("compares the independent manifest and measures cleanup", () => {
    expect(compareIndependentManifest({ verdict: "supports", overall: 0.8 }, { verdict: "supports", overall: 0.8 })).toBe(true);
    expect(compareIndependentManifest({ verdict: "supports" }, { verdict: "rejects" })).toBe(false);
    const cleanup = measureCleanup(["C:\\this-root-does-not-exist-for-r15"]);
    expect(cleanup.residue_count).toBe(0);
    expect(cleanup.missing_roots).toHaveLength(1);
  });
});
