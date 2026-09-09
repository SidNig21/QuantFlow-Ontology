import { expect, test } from "bun:test";
import { decisionComparisonRows, validateMarketDecision, type DecisionContext } from "./market-decision.ts";

function context(probability = false): DecisionContext {
  return { evidence_facts: [], mission_id: "mission", task_id: "task", worker_session_id: "worker", hypothesis_id: "hypothesis", hypothesis: "Alexa Grasso wins by submission", dataset_id: "dataset", run_id: "run", inputs: [{ id: "evidence", hash: "a".repeat(64) }], method: { id: "synthetic-test-method", version: "1", hash: "b".repeat(64), probability_producing: probability }, market_availability: { expression: "Alexa Grasso wins by submission", market_description: "Method of Victory", outcome_description: "Alexa Grasso by Submission", status: "offered", selection_ids: ["one"], reason: "Synthetic offered control", observed_at: "2026-09-06T00:00:00Z", completeness: "complete", provider_reported_market_count: 1, returned_unique_market_count: 1 }, selections: [
    { quote_id: "quote", instrument_id: "instrument", selection_id: "one", market_id: "market", label: "One", decimal_price: 3, observed_at: "2026-09-06T00:00:00Z", event_cutoff: "2026-09-12T00:00:00Z", complete_exclusive_set: true, probability: probability ? { low: 0.4, central: 0.5, high: 0.6 } : { unavailable: "No probability model" } },
    { quote_id: "quote", instrument_id: "instrument", selection_id: "two", market_id: "market", label: "Two", decimal_price: 1.5, observed_at: "2026-09-06T00:00:00Z", event_cutoff: "2026-09-12T00:00:00Z", complete_exclusive_set: true, probability: probability ? { low: 0.4, central: 0.5, high: 0.6 } : { unavailable: "No probability model" } },
  ] };
}
function decision(c: DecisionContext, classification = "WATCH"): any {
  const { selections, ...identity } = c;
  return { contract: "qf.market.decision.v1", ...identity, comparisons: decisionComparisonRows(c), research_assessment: classification === "CANDIDATE" ? "SUPPORTED" : "INSUFFICIENT_EVIDENCE", classification, selection_id: classification === "CANDIDATE" ? "one" : null, selection_reason: "No valid expression without a method", change_condition: "Refresh when submission is offered and a defensible probability method exists", rationale: "Sparse evidence cannot estimate a matchup probability", evidence_refs: ["evidence"], limitations: "Synthetic unit control, never live evidence", invalidation: "Refresh expired quote", provenance: { provider: "synthetic", model: "synthetic", runtime: "test" } };
}
test("synthetic WATCH, PASS and method-backed CANDIDATE controls", () => {
  for (const classification of ["WATCH", "PASS", "CANDIDATE"]) { const c = context(classification === "CANDIDATE"); expect(validateMarketDecision(decision(c, classification), c).classification).toBe(classification); }
});
test("omission, arithmetic, unsupported probabilities, foreign ids and contradictory candidate all fail", () => {
  const c = context();
  for (const mutate of [
    (d: any) => d.comparisons.pop(), (d: any) => d.comparisons.reverse(), (d: any) => d.comparisons[0].raw_break_even = 0.99,
    (d: any) => d.comparisons[0].probability = { low: 0.8, central: 0.9, high: 1 }, (d: any) => d.dataset_id = "foreign",
    (d: any) => d.evidence_refs = ["foreign"], (d: any) => d.classification = "CANDIDATE", (d: any) => d.change_condition = "",
    (d: any) => d.comparisons[0].observed_at = "stale", (d: any) => d.comparisons[0].minimum_decimal_price = 2,
  ]) { const d = decision(c); mutate(d); expect(() => validateMarketDecision(d, c)).toThrow(); }
  expect(validateMarketDecision(decision(c), c).classification).toBe("WATCH");
});

test("unconfirmed requested market forces WATCH and blocks a selected wager or CANDIDATE", () => {
  const c = context(true);
  c.market_availability = { ...c.market_availability, status: "availability_unknown", selection_ids: [], completeness: "provider_reports_additional_markets", provider_reported_market_count: 3, returned_unique_market_count: 2 };
  const watch = decision(c, "WATCH");
  expect(validateMarketDecision(watch, c).classification).toBe("WATCH");
  expect(() => validateMarketDecision({ ...watch, classification: "PASS" }, c)).toThrow("requires WATCH");
  expect(() => validateMarketDecision({ ...watch, classification: "CANDIDATE", selection_id: "one", research_assessment: "SUPPORTED" }, c)).toThrow("requires WATCH");
});
test("coherent probability totals, range ordering, best expression and exclusive no-vig have failing controls", () => {
  const c = context(true); const wrongBest = decision(c, "CANDIDATE"); wrongBest.selection_id = "two"; expect(() => validateMarketDecision(wrongBest, c)).toThrow("greatest positive");
  const incoherent = context(true); incoherent.selections[1]!.probability = { low: 0.5, central: 0.6, high: 0.7 }; expect(() => validateMarketDecision(decision(incoherent), incoherent)).toThrow("coherent total");
  const unordered = context(true); unordered.selections[0]!.probability = { low: 0.8, central: 0.5, high: 0.6 }; expect(() => validateMarketDecision(decision(unordered), unordered)).toThrow("range");
  const nonexclusive = context(); nonexclusive.selections[0]!.complete_exclusive_set = false; const bad = decision(nonexclusive); bad.comparisons[0].no_vig = 0.5; expect(() => validateMarketDecision(bad, nonexclusive)).toThrow("no-vig");
  expect(validateMarketDecision(decision(nonexclusive), nonexclusive).classification).toBe("WATCH");
});
