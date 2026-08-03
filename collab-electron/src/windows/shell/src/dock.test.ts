import { describe, expect, test } from "bun:test";
import { visibleDockDefinitions } from "./dock.js";

describe("production Dock inventory", () => {
  const definitions = [
    { id: "hermes-worker", name: "Hermes worker", package_ref: "species/hermes/packed/hermes.aospkg" },
    { id: "qf-toolloop", name: "QF ToolLoop", package_ref: "tools/runtime-proof/packed/qf-toolloop.aospkg" },
    { id: "qf-proof-orchestrator", name: "Proof orchestrator", package_ref: "tools/qf-proof-agent/packed/qf-proof-agent.aospkg" },
    { id: "qf-proof-worker", name: "Proof worker", package_ref: "tools/qf-proof-agent/packed/qf-proof-agent.aospkg" },
  ];

  test("hides deterministic proof fixtures by default", () => {
    expect(visibleDockDefinitions(definitions).map((row) => row.id)).toEqual([
      "hermes-worker",
    ]);
  });

  test("requires explicit QA mode to show proof fixtures", () => {
    expect(visibleDockDefinitions(definitions, { qaMode: true }).map((row) => row.id)).toEqual([
      "hermes-worker",
      "qf-toolloop",
      "qf-proof-orchestrator",
      "qf-proof-worker",
    ]);
  });
});
