import { expect, test } from "bun:test";
import {
  bindResearchHypothesis,
  clearAllResearchHypotheses,
  clearResearchHypothesis,
  researchHypothesisForSession,
} from "./research-context";

test("binds one session and leaves an unbound session absent", () => {
  clearAllResearchHypotheses();
  bindResearchHypothesis("session-a", "hypothesis-a");
  expect(researchHypothesisForSession("session-a")).toBe("hypothesis-a");
  expect(researchHypothesisForSession("unbound")).toBeUndefined();
});

test("clearing one session does not clear another", () => {
  clearAllResearchHypotheses();
  bindResearchHypothesis("session-a", "hypothesis-a");
  bindResearchHypothesis("session-b", "hypothesis-b");
  clearResearchHypothesis("session-a");
  expect(researchHypothesisForSession("session-a")).toBeUndefined();
  expect(researchHypothesisForSession("session-b")).toBe("hypothesis-b");
});

test("rejects empty ids before mutating existing bindings", () => {
  clearAllResearchHypotheses();
  bindResearchHypothesis("session-a", "hypothesis-a");
  expect(() => bindResearchHypothesis("", "hypothesis-b")).toThrow(/session id/);
  expect(() => bindResearchHypothesis("session-b", "")).toThrow(/Hypothesis id/);
  expect(researchHypothesisForSession("session-a")).toBe("hypothesis-a");
  expect(researchHypothesisForSession("session-b")).toBeUndefined();
});

test("clear-all leaves every session unaddressable", () => {
  clearAllResearchHypotheses();
  bindResearchHypothesis("session-a", "hypothesis-a");
  bindResearchHypothesis("session-b", "hypothesis-b");
  clearAllResearchHypotheses();
  expect(researchHypothesisForSession("session-a")).toBeUndefined();
  expect(researchHypothesisForSession("session-b")).toBeUndefined();
});
