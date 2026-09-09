import { expect, test } from "bun:test";
import { selectEligibleDefinition } from "./participant-selection";

const current = {
  id: "hermes-research-director",
  role: "orchestrator",
  capability_groups: ["desk.orchestrate"],
};
const retired = {
  id: "hermes-orchestrator",
  role: "orchestrator",
  capability_groups: '["desk.orchestrate"]',
};

test("retired inventory cannot make current participant selection ambiguous", () => {
  expect(selectEligibleDefinition(
    [retired, current],
    "orchestrator",
    "desk.orchestrate",
    (definition) => definition.id !== "hermes-orchestrator",
  )).toBe("hermes-research-director");
});

test("two launchable participants remain an explicit routing decision", () => {
  expect(() => selectEligibleDefinition(
    [current, { ...current, id: "another-director" }],
    "orchestrator",
    "desk.orchestrate",
    () => true,
  )).toThrow("Exactly one admitted orchestrator participant with desk.orchestrate is required.");
});
