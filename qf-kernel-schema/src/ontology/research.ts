import { z } from "zod";
import { defineAction, defineLink, defineObject } from "../define.ts";
import { agent_session, execution_environment, tool } from "./agent.ts";
import { instrument } from "./market.ts";

const jsonObject = z.record(z.string(), z.unknown());
const jsonArray = z.array(jsonObject);

// ── Research plane ──────────────────────────────────────────────────────────

export const mission = defineObject({
  name: "mission",
  description:
    "A mission is the standing research intent for a desk or workspace. It governs which hypotheses belong together so agents preserve one coherent question stream.",
  lifecycle: "experimental",
  properties: z.object({
    name: z
      .string()
      .describe(
        "Operator-facing mission label. Keep this stable across revisions so lineage queries stay anchored to one intent.",
      ),
    objective: z
      .string()
      .describe(
        "The decision goal this mission serves. It must be concrete enough for an agent to reject work that is out of charter.",
      ),
  }),
});

export const hypothesis = defineObject({
  name: "hypothesis",
  description:
    "A hypothesis is a falsifiable claim about market behavior. It governs lineage by defining the question that runs, evaluations, and reports must answer.",
  lifecycle: "experimental",
  properties: z.object({
    claim: z
      .string()
      .describe(
        "The claim being tested in domain language. Phrase it so a supporting or rejecting verdict is objectively distinguishable.",
      ),
    success_criteria: z
      .string()
      .describe(
        "The evidence bar for support. This defines the gate so confidence alone cannot silently override the research contract.",
      ),
    sources: z
      .array(z.string())
      .describe(
        "Citations that justify the claim's priors. Treat this as provenance for why the claim exists, not as proof that it is true.",
      ),
    status: z
      .enum(["open", "supported", "rejected", "inconclusive"])
      .describe(
        "Current lifecycle state for the claim. Only evaluation-backed resolution should move it away from open.",
      ),
  }),
});

export const policy = defineObject({
  name: "policy",
  description:
    "A policy is a versioned decision strategy intended for training or recommendation experiments. It governs promotion by requiring explicit lineage to the artifact that defines the policy.",
  lifecycle: "experimental",
  properties: z.object({
    kind: z
      .enum(["prompt_playbook", "trained_weights"])
      .describe(
        "Which implementation track the policy uses. This keeps playbook-level and model-weight policies comparable without splitting object types.",
      ),
    spec_ref: z
      .string()
      .describe(
        "Artifact id that defines the policy behavior. Every policy revision must point to immutable bytes so evaluations can be reproduced.",
      ),
  }),
});

export const environment = defineObject({
  name: "environment",
  description:
    "An environment is the bounded world a policy is trained or evaluated against. It governs comparability by declaring the data and reward contract a run assumes.",
  lifecycle: "experimental",
  properties: z.object({
    kind: z
      .enum(["offline_replay", "paper_market", "live_shadow"])
      .describe(
        "Execution context used for training/evaluation. Agents must not compare outcomes across kinds without an explicit normalization rule.",
      ),
    contract_ref: z
      .string()
      .describe(
        "Artifact id describing observations, actions, and reward semantics. Keep this immutable so results remain interpretable after schema evolution.",
      ),
  }),
});

export const strategy = defineObject({
  name: "strategy",
  description:
    "A strategy is a versioned betting decision recipe under evaluation. It governs execution by separating durable identity here from executable content in artifacts.",
  lifecycle: "experimental",
  properties: z.object({
    spec_ref: z
      .string()
      .describe(
        "Artifact id whose content defines the strategy logic. This reference is the canonical source of behavior for replay and audit.",
      ),
    version: z
      .number()
      .describe(
        "Monotonic strategy revision number. New revisions must become new objects linked by derived_from instead of in-place edits.",
      ),
    stake_model: z
      .enum(["flat", "fractional_kelly", "custom"])
      .describe(
        "Position sizing approach the strategy assumes. Use custom only when the sizing function is encoded in the referenced artifact.",
      ),
  }),
});

export const ticket = defineObject({
  name: "ticket",
  description:
    "A ticket is one wager record, whether strategy-proposed before placement or operator-supplied after placement. It governs grading lineage by preserving selection-time terms and settlement facts in one object.",
  lifecycle: "experimental",
  properties: z.object({
    origin: z
      .enum(["strategy_proposed", "operator_supplied"])
      .describe(
        "How this ticket entered the system. Strategy-proposed rows express planned intent, while operator-supplied rows are venue facts that must preserve external provenance exactly.",
      ),
    kind: z
      .enum(["single", "parlay"])
      .describe(
        "Whether the wager has one leg or multiple legs. Treat single as a first-class ticket, not a separate type.",
      ),
    external_ref: z
      .string()
      .describe(
        "Venue-issued ticket reference for this wager. Use it as the idempotency key so re-importing the same operator-supplied slip updates one row instead of duplicating it.",
      ),
    placed_at: z.iso
      .datetime()
      .describe(
        "Timestamp when the wager was placed in ISO-8601 UTC. This is required input for CLV because selection-time price must be compared to market state at placement.",
      ),
    legs: jsonArray.describe(
      "Structured per-leg selections and timestamps. Each leg entry must retain selection-time price so CLV and drift can be recomputed.",
    ),
    combined_price: z
      .number()
      .describe(
        "Aggregate ticket price at selection. Keep the source price so downstream evaluation does not infer payout assumptions.",
      ),
    stake: z
      .number()
      .describe(
        "Amount risked on the wager. Store the actual stake for operator-supplied slips and the proposed stake for strategy-origin tickets without changing field semantics.",
      ),
    payout: z
      .number()
      .describe(
        "Realized return from settlement, distinct from stake and combined_price assumptions. Keep it null while grade is pending and set it once the venue-grade is known.",
      )
      .nullable(),
    correlation_note: z
      .string()
      .describe(
        "Declared dependence assumptions among legs. Same-event legs should reference known correlation groups to avoid false independence.",
      ),
    grade: z
      .enum(["pending", "win", "loss", "push", "void"])
      .describe(
        "Settlement outcome for the ticket. It stays pending until settled truth is available from result lineage.",
      ),
  }),
});

export const dataset = defineObject({
  name: "dataset",
  description:
    "A dataset is a versioned, point-in-time-fenced snapshot consumed by runs. It governs replay by binding every run to immutable bytes and an as-of boundary.",
  lifecycle: "experimental",
  properties: z.object({
    kind: z
      .enum(["odds_history", "results", "features", "mixed"])
      .describe(
        "Primary data family captured by this snapshot. Mixed should only be used when cross-family coupling is deliberate and documented.",
      ),
    content_hash: z
      .string()
      .describe(
        "Hash over the underlying bytes for this snapshot. Equal hashes mean byte-identical data and therefore equivalent replay input.",
      ),
    as_of: z.iso
      .datetime()
      .describe(
        "Latest timestamp allowed in this snapshot (ISO-8601 UTC). Agents must treat it as a leakage boundary for pre-event decisions.",
      ),
    coverage: jsonObject.describe(
      "Machine-readable coverage summary (sports, range, counts). This is a sufficiency hint and must never override missing raw lineage.",
    ),
  }),
});

export const run = defineObject({
  name: "run",
  description:
    "A run is the canonical execution record for ingest, feature build, backtest, analysis, or training work. It governs ontology shape by encoding mode in kind instead of creating subtype objects.",
  lifecycle: "experimental",
  properties: z.object({
    kind: z
      .enum(["ingestion", "feature_build", "backtest", "analysis", "training"])
      .describe(
        "Execution mode for this run. Add new modes here rather than cloning the run type per pipeline step.",
      ),
    status: z
      .enum(["queued", "running", "succeeded", "failed", "cancelled"])
      .describe(
        "Operational lifecycle state of execution. Never store actor-internal thinking/tool-calling states in this field.",
      ),
    params: jsonObject.describe(
      "Full invocation arguments captured at launch. This is the reproducibility contract for re-run and audit.",
    ),
    trace_id: z
      .string()
      .describe(
        "Root span identifier for this run in tracing systems. Keep it stable across child spans so causality can be reconstructed.",
      ),
  }),
});

export const artifact = defineObject({
  name: "artifact",
  description:
    "An artifact is an immutable, content-addressed output produced by a run or session. Reports remain an artifact kind and must never be split into a separate object type.",
  lifecycle: "experimental",
  properties: z.object({
    kind: z
      .enum(["strategy_spec", "code", "result_set", "report", "trajectory"])
      .describe(
        "Artifact family discriminator. Trajectory and report entries should contain distilled outputs, never raw transcript dumps.",
      ),
    content_hash: z
      .string()
      .describe(
        "Hash of the durable bytes referenced by this artifact. This is the canonical identity for dedupe and provenance checks.",
      ),
    storage_ref: z
      .string()
      .describe(
        "Durable location that stores the referenced bytes. Publication should occur before ephemeral sandboxes can be reclaimed.",
      ),
  }),
});

export const evaluation = defineObject({
  name: "evaluation",
  description:
    "An evaluation is a structured verdict on whether evidence supports a hypothesis. It governs publication and resolution decisions by separating verdict semantics from confidence scoring.",
  lifecycle: "experimental",
  properties: z.object({
    metrics: jsonObject.describe(
      "Typed metric payload used to justify the verdict. Include enough detail for replayed judging without reconstructing hidden intermediate state.",
    ),
    critic_findings_ref: z
      .string()
      .describe(
        "Artifact id containing critic findings considered in this judgment. Leave null only when no critic pass was available for this evaluation.",
      )
      .nullable(),
    verdict: z
      .enum(["supports", "rejects", "inconclusive"])
      .describe(
        "Disposition of the evidence against the hypothesis. This field carries gating semantics; confidence does not override it.",
      ),
    confidence: z
      .number()
      .describe(
        "Confidence score for the selected verdict on a 0-1 scale. Use it for prioritization and review, not as a substitute for verdict semantics.",
      ),
    rationale: z
      .string()
      .describe(
        "Human- and agent-readable explanation for the verdict. It should name the decisive evidence rather than restating the metric payload.",
      ),
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
  description: "Which instruments a ticket bets; enables correlation traversal.",
  lifecycle: "experimental",
  from: ticket,
  to: instrument,
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

export const gates = defineLink({
  name: "gates",
  description:
    "Publication authorization: which evaluation approved an artifact for release. Ends evaluation's sink status so WO-110 can read the gating fact.",
  lifecycle: "experimental",
  from: evaluation,
  to: artifact,
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

export const create_run = defineAction({
  name: "create_run",
  description:
    "Enqueue a new run in queued status with full invocation params. Rejectable when params are invalid.",
  lifecycle: "experimental",
  input: z.object({
    run_id: z.string().describe("Id for the new run row (caller-supplied, adopted)."),
    kind: z
      .enum(["ingestion", "feature_build", "backtest", "analysis", "training"])
      .describe("Execution mode for this run."),
    params: jsonObject
      .describe("Full invocation arguments captured at launch.")
      .optional(),
    trace_id: z
      .string()
      .describe("Root span id; defaults to ctx.trace_id when omitted.")
      .optional(),
  }),
});

export const create_mission = defineAction({
  name: "create_mission",
  description: "Register a standing research mission with name and objective.",
  lifecycle: "experimental",
  input: z.object({
    mission_id: z
      .string()
      .describe("Optional id; Kernel mints a UUID when omitted.")
      .optional(),
    name: z.string().describe("Operator-facing mission label."),
    objective: z.string().describe("Decision goal this mission serves."),
  }),
});

export const create_ticket = defineAction({
  name: "create_ticket",
  description:
    "Record a strategy-proposed ticket starting pending. Does not accept a grade; use observe_ticket for externally observed slips.",
  lifecycle: "experimental",
  input: z.object({
    kind: z.enum(["single", "parlay"]).describe("Single or parlay wager."),
    external_ref: z.string().describe("Venue-issued idempotency key."),
    placed_at: z.iso.datetime().describe("Placement timestamp (ISO-8601 UTC)."),
    legs: jsonArray.describe("Per-leg selections with selection-time prices."),
    combined_price: z.number().describe("Aggregate price at selection."),
    stake: z.number().describe("Amount risked."),
    payout: z.number().describe("Realized return when settled.").nullable().optional(),
    correlation_note: z.string().describe("Declared leg dependence assumptions."),
  }),
});

export const observe_ticket = defineAction({
  name: "observe_ticket",
  description:
    "Ingest an externally observed ticket at its settlement grade. Writes an observation event, never a synthetic transition.",
  lifecycle: "experimental",
  operatorOnly: true,
  input: z.object({
    kind: z.enum(["single", "parlay"]).describe("Single or parlay wager."),
    external_ref: z.string().describe("Venue-issued idempotency key."),
    placed_at: z.iso.datetime().describe("Placement timestamp (ISO-8601 UTC)."),
    legs: jsonArray.describe("Per-leg selections with selection-time prices."),
    combined_price: z.number().describe("Aggregate price at selection."),
    stake: z.number().describe("Amount risked."),
    payout: z.number().describe("Realized return when settled.").nullable().optional(),
    correlation_note: z.string().describe("Declared leg dependence assumptions."),
    grade: z
      .enum(["pending", "win", "loss", "push", "void"])
      .describe("Observed settlement grade at ingestion; terminal grades allowed."),
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
    hypothesis_id: z
      .string()
      .describe("Hypothesis this evaluation answers (lineage; also writable as tests link).")
      .optional(),
    run_id: z
      .string()
      .describe("Run evaluated (lineage; also writable as evaluated_by link).")
      .optional(),
    artifact_id: z
      .string()
      .describe("Artifact evaluated (lineage; also writable as evaluated_by link).")
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
