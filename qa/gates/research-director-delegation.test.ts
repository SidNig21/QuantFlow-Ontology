import { expect, test } from "bun:test";
import {
  RESEARCH_DIRECTOR_DELEGATION_DEADLINE_MS,
  runResearchDirectorDelegationFocusedFalsifiers,
} from "./research-director-delegation";

test("Research Director delegation gate owns the 120 second deadline", () => {
  expect(RESEARCH_DIRECTOR_DELEGATION_DEADLINE_MS).toBe(120_000);
});

test("focused assignment and lineage falsifiers go red and restore green", () => {
  expect(() => runResearchDirectorDelegationFocusedFalsifiers()).not.toThrow();
});
