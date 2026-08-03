import { describe, expect, test } from "bun:test";
import {
  PRODUCTION_RUNTIME_FILES,
  QA_RUNTIME_FILES,
  RUNTIME_FILES,
} from "./runtime-staging.ts";

describe("runtime staging inventory", () => {
  test("normal production staging contains Hermes only", () => {
    expect(RUNTIME_FILES).toEqual(PRODUCTION_RUNTIME_FILES);
    expect(RUNTIME_FILES.some((path) => path.startsWith("tools/"))).toBe(false);
    expect(RUNTIME_FILES.every((path) => path.startsWith("species/hermes/"))).toBe(true);
  });

  test("QA staging explicitly adds deterministic proof fixtures", () => {
    expect(QA_RUNTIME_FILES).toEqual(expect.arrayContaining([
      "tools/qf-proof-agent/dock-profiles.json",
      "tools/runtime-proof/dock-profiles.json",
      "species/hermes/dock-profiles.json",
    ]));
    expect(QA_RUNTIME_FILES.length).toBeGreaterThan(PRODUCTION_RUNTIME_FILES.length);
  });
});
