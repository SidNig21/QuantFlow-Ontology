import { z } from "zod";
import { defineAction, defineLink, defineObject } from "../define.ts";
import { agent_session, execution_environment, tool } from "./agent.ts";
import { market } from "./market.ts";

const jsonObject = z.record(z.string(), z.unknown());
const jsonArray = z.array(jsonObject);

// ── Research plane ──────────────────────────────────────────────────────────

export const hypothesis = defineObject({
  name: "hypothesis",
  description:
    "A falsifiable research claim that roots every lineage chain. Open one before datasets, tickets, or evaluations so work answers a named question.",
  lifecycle: "experimental",
  properties: z.object({
    claim: z.string().describe("The statement under test in betting-research terms."),
    success_criteria: z
      .string()
      .describe("What evaluation outcome would support the claim (metrics, n, risk bounds)."),
    sources: z.array(z.string()).describe("Citations grounding the claim (arXiv IDs, papers, articles)."),
    status: z
      .enum(["open", "supported", "rejected", "inconclusive"])
      .describe("Claim lifecycle; only evaluation-backed resolution leaves open."),
  }),
});

export const strategy = defineObject({
  name: "strategy",
  description:
    "A versioned, parameterized betting rule set under test. Identity lives here; the code/rules content lives in a linked artifact.",
  lifecycle: "experimental",
  properties: z.object({
    spec_ref: z
      .string()
      .describe("Artifact id whose content defines this strategy's rules/code."),
    version: z
      .number()
      .describe("Monotonic version number; new versions are new objects derived_from the old."),
    stake_model: z
      .enum(["flat", "fractional_kelly", "custom"])
      .describe("How positions are sized in backtests."),
  }),
});

export const ticket = defineObject({
  name: "ticket",
  description:
    "The atomic proposed wager — single or parlay. Strategies emit tickets; backtests grade them; evaluations aggregate them. A one-leg bet is still a ticket.",
  lifecycle: "experimental",
  properties: z.object({
    kind: z.enum(["single", "parlay"]).describe("Whether this wager is one leg or a multi-leg parlay."),
    legs: jsonArray.describe(
      "Structured legs: market ref + side + price-at-selection + captured_at as JSON objects.",
    ),
    combined_price: z.number().describe("Total odds for the ticket as offered or computed."),
    stake: z.number().describe("Simulated stake under the strategy stake model."),
    correlation_note: z
      .string()
      .describe(
        "Declared dependence among legs (same-event legs must reference correlation_group keys).",
      ),
    grade: z
      .enum(["pending", "win", "loss", "push", "void"])
      .describe("Settlement grade once results land; pending until then."),
  }),
});

export const dataset = defineObject({
  name: "dataset",
  description:
    "A versioned, content-hashed, point-in-time-correct data snapshot. Identical content_hash means identical bytes.",
  lifecycle: "experimental",
  properties: z.object({
    kind: z
      .enum(["odds_history", "results", "features", "mixed"])
      .describe("What kind of research data this snapshot holds."),
    content_hash: z
      .string()
      .describe("Hash over the underlying Parquet set; byte-identical data shares this hash."),
    as_of: z.iso
      .datetime()
      .describe("Point-in-time boundary this dataset respects (ISO-8601 UTC)."),
    coverage: jsonObject.describe(
      "Agent-readable sufficiency: sports, date range, event count.",
    ),
  }),
});

export const run = defineObject({
  name: "run",
  description:
    "One canonical execution type — ingestion, feature build, backtest, or analysis via kind. Never clone types per pipeline step.",
  lifecycle: "experimental",
  properties: z.object({
    kind: z
      .enum(["ingestion", "feature_build", "backtest", "analysis"])
      .describe("Which execution pipeline this run performs."),
    status: z
      .enum(["queued", "running", "succeeded", "failed", "cancelled"])
      .describe("Operational run state; actor-internal THINKING/TOOL_CALLING are never stored here."),
    params: jsonObject.describe("Full invocation parameters — the reproducibility contract."),
    trace_id: z.string().describe("Root of this run's span tree in the trace layer (L5)."),
  }),
});

export const artifact = defineObject({
  name: "artifact",
  description:
    "An immutable, content-addressed published output (strategy_spec, code, result_set, report, trajectory). Reports are artifacts, not a separate type.",
  lifecycle: "experimental",
  properties: z.object({
    kind: z
      .enum(["strategy_spec", "code", "result_set", "report", "trajectory"])
      .describe("Artifact family; trajectory/report must be distilled, never raw transcripts."),
    content_hash: z.string().describe("Content hash of the durable bytes."),
    storage_ref: z
      .string()
      .describe("Durable location of the bytes (exported before any sandbox dies)."),
  }),
});

export const evaluation = defineObject({
  name: "evaluation",
  description:
    "Structured verdict on an artifact/run against a hypothesis. Parlay-aware metrics: per-leg edge and bankroll survival, not raw win rate.",
  lifecycle: "experimental",
  properties: z.object({
    metrics: jsonObject.describe(
      "Typed metric set: per-leg CLV/hit/price-beat, per-ticket ROI, Monte Carlo bankroll, OOS consistency.",
    ),
    critic_findings_ref: z
      .string()
      .describe("Artifact id of triaged Critic findings weighed in this verdict.")
      .nullable(),
    verdict: z
      .enum(["supports", "rejects", "inconclusive"])
      .describe("Overall evaluation verdict relative to the hypothesis."),
    confidence: z.number().describe("Confidence in the verdict on a 0–1 scale."),
    rationale: z.string().describe("Human/agent-readable rationale for the verdict."),
  }),
});

export const tests = defineLink({
  name: "tests",
  description: "Why this run or strategy exists — it tests a named hypothesis.",
  lifecycle: "experimental",
  from: [run, strategy],
  to: hypothesis,
});

export const has_leg = defineLink({
  name: "has_leg",
  description: "Which markets a ticket bets; enables correlation traversal.",
  lifecycle: "experimental",
  from: ticket,
  to: market,
});

export const uses = defineLink({
  name: "uses",
  description: "Full input manifest for a run: datasets, strategies, and tools consumed.",
  lifecycle: "experimental",
  from: run,
  to: [dataset, strategy, tool],
});

export const executes_in = defineLink({
  name: "executes_in",
  description: "Where computation for a run happened.",
  lifecycle: "experimental",
  from: run,
  to: execution_environment,
});

export const produces = defineLink({
  name: "produces",
  description: "Output provenance: datasets or artifacts produced by a run or agent session.",
  lifecycle: "experimental",
  from: [run, agent_session],
  to: [dataset, artifact],
});

export const derived_from = defineLink({
  name: "derived_from",
  description: "Version and transformation lineage among datasets, artifacts, and strategies.",
  lifecycle: "experimental",
  from: [dataset, artifact, strategy],
  to: [dataset, artifact, strategy],
});

export const evaluated_by = defineLink({
  name: "evaluated_by",
  description: "Verdict attachment: which evaluation judged an artifact or run.",
  lifecycle: "experimental",
  from: [artifact, run],
  to: evaluation,
});

export const create_hypothesis = defineAction({
  name: "create_hypothesis",
  description:
    "Open a new research hypothesis with claim, success criteria, and optional sources.",
  lifecycle: "experimental",
  input: z.object({
    claim: z.string().describe("The falsifiable claim to register."),
    success_criteria: z.string().describe("How an evaluation would support this claim."),
    sources: z.array(z.string()).describe("Optional citations grounding the claim.").optional(),
  }),
});

export const register_dataset_version = defineAction({
  name: "register_dataset_version",
  description: "Register a new content-hashed, point-in-time dataset version in the Kernel.",
  lifecycle: "experimental",
  input: z.object({
    kind: z
      .enum(["odds_history", "results", "features", "mixed"])
      .describe("Dataset kind being registered."),
    content_hash: z.string().describe("Hash of the underlying Parquet set."),
    as_of: z.iso.datetime().describe("Point-in-time boundary for this version."),
    coverage: jsonObject.describe("Sufficiency summary for agents."),
  }),
});

export const start_run = defineAction({
  name: "start_run",
  description: "Start a queued run (queued → running). Rejectable if the transition is illegal.",
  lifecycle: "experimental",
  input: z.object({
    run_id: z.string().describe("Id of the queued run to start."),
  }),
});

export const cancel_run = defineAction({
  name: "cancel_run",
  description: "Cancel a running run (running → cancelled).",
  lifecycle: "experimental",
  input: z.object({
    run_id: z.string().describe("Id of the running run to cancel."),
  }),
});

export const complete_run = defineAction({
  name: "complete_run",
  description: "Mark a running run as succeeded (running → succeeded).",
  lifecycle: "experimental",
  input: z.object({
    run_id: z.string().describe("Id of the running run to complete."),
  }),
});

export const fail_run = defineAction({
  name: "fail_run",
  description: "Mark a running run as failed (running → failed).",
  lifecycle: "experimental",
  input: z.object({
    run_id: z.string().describe("Id of the running run that failed."),
  }),
});

export const retry_run = defineAction({
  name: "retry_run",
  description:
    "Request another attempt after failure/cancellation by creating a new queued run derived_from the prior (terminals do not reopen).",
  lifecycle: "experimental",
  input: z.object({
    run_id: z.string().describe("Id of the failed or cancelled run to retry from."),
  }),
});

export const close_run = defineAction({
  name: "close_run",
  description:
    "Operator close/ack for a terminal run (no status change — succeeded/failed/cancelled are already terminal).",
  lifecycle: "experimental",
  input: z.object({
    run_id: z.string().describe("Id of the terminal run to close/ack."),
  }),
});

export const grade_ticket = defineAction({
  name: "grade_ticket",
  description: "Grade a pending ticket to win|loss|push|void after result settlement.",
  lifecycle: "experimental",
  input: z.object({
    ticket_id: z.string().describe("Ticket to grade."),
    grade: z.enum(["win", "loss", "push", "void"]).describe("Settlement grade to write."),
  }),
});

export const publish_artifact = defineAction({
  name: "publish_artifact",
  description: "Publish an immutable content-addressed artifact (must land before sandbox death).",
  lifecycle: "experimental",
  input: z.object({
    kind: z
      .enum(["strategy_spec", "code", "result_set", "report", "trajectory"])
      .describe("Artifact kind to publish."),
    content_hash: z.string().describe("Content hash of the bytes."),
    storage_ref: z.string().describe("Durable storage location."),
  }),
});

export const record_evaluation = defineAction({
  name: "record_evaluation",
  description: "Record a structured evaluation verdict with metrics against a hypothesis lineage.",
  lifecycle: "experimental",
  input: z.object({
    metrics: jsonObject.describe("Metric set for this evaluation."),
    verdict: z
      .enum(["supports", "rejects", "inconclusive"])
      .describe("Verdict relative to the hypothesis."),
    confidence: z.number().describe("Confidence in the verdict (0–1)."),
    rationale: z.string().describe("Rationale text."),
    critic_findings_ref: z
      .string()
      .describe("Optional Critic findings artifact id.")
      .optional(),
  }),
});

export const resolve_hypothesis = defineAction({
  name: "resolve_hypothesis",
  description:
    "Resolve an open hypothesis to supported|rejected|inconclusive; evaluation-gated at the Kernel.",
  lifecycle: "experimental",
  input: z.object({
    hypothesis_id: z.string().describe("Hypothesis to resolve."),
    status: z
      .enum(["supported", "rejected", "inconclusive"])
      .describe("Resolved status to write."),
  }),
});
