import { describe, expect, test } from "bun:test";
import {
  PRODUCTION_RUNTIME_CONTROL_FILES,
  PRODUCTION_RUNTIME_RESOURCES,
  PRODUCTION_RUNTIME_FILES,
  QA_RUNTIME_CONTROL_FILES,
  QA_RUNTIME_RESOURCES,
  QA_RUNTIME_FILES,
  RUNTIME_FILES,
} from "./runtime-staging.ts";

function sorted(paths: readonly string[]): string[] {
  return [...paths].sort();
}

describe("runtime staging inventory", () => {
  test("normal production staging is exactly Hermes controls and resources", () => {
    expect(RUNTIME_FILES).toEqual(PRODUCTION_RUNTIME_FILES);
    expect(sorted(PRODUCTION_RUNTIME_CONTROL_FILES)).toEqual([
      "species/hermes/dock-profiles.json",
      "species/hermes/launch.json",
      "species/hermes/packed/hermes.meta.json",
      "species/hermes/tools-allowlist.json",
    ]);
    expect(sorted(PRODUCTION_RUNTIME_RESOURCES)).toEqual([
      "species/hermes/packed/hermes.aospkg",
      "species/hermes/prompts/critic.md",
      "species/hermes/prompts/research-director.md",
      "species/hermes/prompts/worker.md",
    ]);
    expect(sorted(PRODUCTION_RUNTIME_FILES)).toEqual(sorted([
      ...PRODUCTION_RUNTIME_CONTROL_FILES,
      ...PRODUCTION_RUNTIME_RESOURCES,
    ]));
    expect(PRODUCTION_RUNTIME_FILES.some((path) => path.startsWith("tools/"))).toBe(false);
    expect(PRODUCTION_RUNTIME_FILES.every((path) => path.startsWith("species/hermes/"))).toBe(true);
  });

  test("QA staging is exactly Hermes plus generic qf-proof controls and resources", () => {
    expect(sorted(QA_RUNTIME_CONTROL_FILES)).toEqual(sorted([
      "tools/qf-proof-agent/dock-profiles.json",
      "tools/qf-proof-agent/launch.json",
      "tools/qf-proof-agent/packed/qf-proof-agent.meta.json",
      "species/hermes/dock-profiles.json",
      "species/hermes/launch.json",
      "species/hermes/packed/hermes.meta.json",
      "species/hermes/tools-allowlist.json",
    ]));
    expect(sorted(QA_RUNTIME_RESOURCES)).toEqual(sorted([
      "tools/qf-proof-agent/packed/qf-proof-agent.aospkg",
      "tools/qf-proof-agent/packed/qf-proof-agent.mjs",
      ...PRODUCTION_RUNTIME_RESOURCES,
    ]));
    expect(sorted(QA_RUNTIME_FILES)).toEqual(sorted([
      ...QA_RUNTIME_CONTROL_FILES,
      ...QA_RUNTIME_RESOURCES,
    ]));
    expect(QA_RUNTIME_FILES.length).toBe(13);
    expect(QA_RUNTIME_FILES.some((path) => path.startsWith("species/claude-code/"))).toBe(false);
  });

  test("Hermes resource-loss falsifier is fail-capable", () => {
    if (process.env.QF_G6_FALSIFY !== "hermes-resource-loss") return;
    const bait = PRODUCTION_RUNTIME_RESOURCES.filter(
      (path) => path !== "species/hermes/packed/hermes.aospkg",
    );
    console.error("falsifier=hermes-resource-loss defect=retained Hermes package missing");
    expect(sorted(bait)).toEqual(sorted(PRODUCTION_RUNTIME_RESOURCES));
  });
});
