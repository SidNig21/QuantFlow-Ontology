import { z } from "zod";
import { commands, creationCommands } from "./commands.ts";
import {
  defineAction,
  defineLink,
  defineObject,
  lintCommands,
  lintSchema,
  type Schema,
} from "./define.ts";
import { transitions } from "./transitions.ts";

const jsonObject = z.record(z.string(), z.unknown());
const jsonArray = z.array(jsonObject);

// ── Domain plane ────────────────────────────────────────────────────────────

export const competitor = defineObject({
  name: "competitor",
  description:
    "A participant that can be bet on — fighter, player, or team. One identity per real competitor; aliases stay as links, not duplicate rows.",
  lifecycle: "experimental",
  properties: z.object({
    kind: z
      .enum(["ufc_fighter", "tennis_player", "team"])
      .describe("Competitor species; a team's sport comes from the events it plays."),
    name: z.string().describe("Canonical display name used in markets and reports."),
    external_refs: jsonObject.describe(
      "Source-system IDs (Bovada participant id, dataset keys) for entity resolution.",
    ),
  }),
});

export const event = defineObject({
  name: "event",
  description:
    "A scheduled real-world contest (UFC bout, tennis match, football game). starts_at is the point-in-time fence for pre-event decisions.",
  lifecycle: "experimental",
  properties: z.object({
    sport: z
      .enum(["ufc", "tennis", "football"])
      .describe("Sport domain for this contest; drives prop vocabularies and coverage."),
    starts_at: z.iso
      .datetime()
      .describe("Scheduled start as ISO-8601 UTC; no post-start data may inform a pre-event ticket."),
    status: z
      .enum(["scheduled", "live", "settled", "void"])
      .describe("Contest state from schedule through settlement or void."),
    competition: z
      .string()
      .describe("Tournament or league context (UFC 320, Wimbledon R16, NFL Week 3)."),
  }),
});

export const market = defineObject({
  name: "market",
  description:
    "One bettable proposition on an event. Moneyline, spread, total, and prop are kinds of this single type — never separate object types.",
  lifecycle: "experimental",
  properties: z.object({
    kind: z
      .enum(["moneyline", "spread", "total", "prop"])
      .describe("Market family; props carry sport-specific structure in params."),
    params: jsonObject.describe(
      "Kind-specific parameters (lines, prop category/method/round, handicaps) as JSON.",
    ),
    sides: z
      .array(z.string())
      .describe('Named outcomes offered, e.g. ["Jones","Miocic"] or ["over","under"].'),
    correlation_group: z
      .string()
      .describe(
        "Shared key for same-event markets with dependent outcomes; null when independence is assumed.",
      )
      .nullable(),
  }),
});

export const odds_series = defineObject({
  name: "odds_series",
  description:
    "Recorded price history of one market at one book. Pointer object: data_ref points at hashed Parquet quote segments; the Kernel never stores tick rows.",
  lifecycle: "experimental",
  properties: z.object({
    book: z
      .enum(["bovada", "pinnacle"])
      .describe("Sportsbook source; Pinnacle series are the sharp CLV benchmark."),
    data_ref: z
      .string()
      .describe("Content hash plus path of the Parquet segment(s) holding timestamped quotes."),
    coverage: jsonObject.describe(
      "Sufficiency summary: first/last captured timestamps and quote count for agent judgment.",
    ),
  }),
});

export const result = defineObject({
  name: "result",
  description:
    "Settled truth of an event and the grading of its markets. Point-in-time fenced by settled_at.",
  lifecycle: "experimental",
  properties: z.object({
    outcome: jsonObject.describe(
      "Structured result (winner, score/method, per-market grading win|loss|push|void).",
    ),
    settled_at: z.iso
      .datetime()
      .describe("When truth became known (ISO-8601 UTC); also a point-in-time fence."),
  }),
});

// ── Research plane ──────────────────────────────────────────────────────────

export const hypothesis = defineObject({
  name: "hypothesis",
  description:
    "A falsifiable research claim that roots every lineage chain. Open one before datasets, tickets, or evaluations so work answers a named question.",
  lifecycle: "experimental",
  properties: z.object({
    claim: z
      .string()
      .describe("The statement under test in betting-research terms."),
    success_criteria: z
      .string()
      .describe("What evaluation outcome would support the claim (metrics, n, risk bounds)."),
    sources: z
      .array(z.string())
      .describe("Citations grounding the claim (arXiv IDs, papers, articles)."),
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

// ── Operations plane ────────────────────────────────────────────────────────

export const workspace = defineObject({
  name: "workspace",
  description:
    "One canvas of work — the spatial container for tiles, sessions, and connections in a research project.",
  lifecycle: "experimental",
  properties: z.object({
    name: z.string().describe("Short workspace name shown on the canvas."),
    title: z.string().describe("Human-readable title for the research workspace."),
  }),
});

export const agent_definition = defineObject({
  name: "agent_definition",
  description:
    "A spawnable agent species (Researcher, Ingestion-Collector, Backtester, Critic) — the template, not a live instance.",
  lifecycle: "experimental",
  properties: z.object({
    name: z.string().describe("Species name agents and operators use to request a spawn."),
    role: z
      .string()
      .describe("Role summary (researcher, critic, backtester, ingestion) for routing and prompts."),
    system_prompt_ref: z
      .string()
      .describe("Artifact or prompt id that defines this species' instructions.")
      .nullable(),
  }),
});

export const agent_session = defineObject({
  name: "agent_session",
  description:
    "One durable live agent instance (L1 ledger identity). Operational states only — never actor-internal THINKING/TOOL_CALLING.",
  lifecycle: "experimental",
  properties: z.object({
    status: z
      .enum(["starting", "running", "blocked", "cancelled", "failed", "closed"])
      .describe("Operational session state enforced by the transition table."),
    label: z
      .string()
      .describe("Optional operator-facing label for the live session.")
      .nullable(),
  }),
});

export const task = defineObject({
  name: "task",
  description:
    "A unit of assigned work on the canvas, routed to agent sessions via assigned_to / delegates_to links.",
  lifecycle: "experimental",
  properties: z.object({
    title: z.string().describe("Short task title for the operator and agents."),
    description: z.string().describe("What done looks like for this unit of work."),
  }),
});

export const tool = defineObject({
  name: "tool",
  description:
    "A capability exposed via MCP and generated from this schema — agents call tools; they do not invent ad-hoc side channels.",
  lifecycle: "experimental",
  properties: z.object({
    name: z.string().describe("Tool name as exposed to agents (typically qf_*)."),
    summary: z.string().describe("One-line summary of what the tool does for an agent reader."),
  }),
});

export const execution_environment = defineObject({
  name: "execution_environment",
  description:
    "Where a run executes: local process, local Python sidecar, or disposable Cloudflare sandbox.",
  lifecycle: "experimental",
  properties: z.object({
    kind: z
      .enum(["local_process", "local_python", "cloudflare_sandbox"])
      .describe("Execution substrate for runs linked via executes_in."),
    label: z.string().describe("Operator-facing label for this environment instance."),
  }),
});

export const connection = defineObject({
  name: "connection",
  description:
    "A typed cable between tiles on the canvas — projection wiring, never a second truth store.",
  lifecycle: "experimental",
  properties: z.object({
    kind: z.string().describe("Cable/connection kind (data, control, or view projection)."),
    from_ref: z.string().describe("Source tile or object id for this cable."),
    to_ref: z.string().describe("Target tile or object id for this cable."),
  }),
});

// ── Links ───────────────────────────────────────────────────────────────────

export const participates_in = defineLink({
  name: "participates_in",
  description: "Roster/matchup edge: which competitors take part in an event.",
  lifecycle: "experimental",
  from: competitor,
  to: event,
});

export const offered_on = defineLink({
  name: "offered_on",
  description: "Attaches a market to the event it is offered on for per-contest discovery.",
  lifecycle: "experimental",
  from: market,
  to: event,
});

export const quotes = defineLink({
  name: "quotes",
  description: "Price-history lookup: which market an odds_series records.",
  lifecycle: "experimental",
  from: odds_series,
  to: market,
});

export const settles = defineLink({
  name: "settles",
  description: "Truth attachment: which event a result settles.",
  lifecycle: "experimental",
  from: result,
  to: event,
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

export const assigned_to = defineLink({
  name: "assigned_to",
  description: "Work routing: which agent session owns a task.",
  lifecycle: "experimental",
  from: task,
  to: agent_session,
});

export const delegates_to = defineLink({
  name: "delegates_to",
  description: "Session-to-session delegation on the canvas.",
  lifecycle: "experimental",
  from: agent_session,
  to: agent_session,
});

// ── Actions (MCP command surface) ───────────────────────────────────────────

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

export const start_event = defineAction({
  name: "start_event",
  description: "Move a scheduled event to live (scheduled → live).",
  lifecycle: "experimental",
  input: z.object({
    event_id: z.string().describe("Event to start."),
  }),
});

export const settle_event = defineAction({
  name: "settle_event",
  description: "Settle a live event (live → settled).",
  lifecycle: "experimental",
  input: z.object({
    event_id: z.string().describe("Event to settle."),
  }),
});

export const void_event = defineAction({
  name: "void_event",
  description: "Void a scheduled event that will not be contested (scheduled → void).",
  lifecycle: "experimental",
  input: z.object({
    event_id: z.string().describe("Event to void."),
  }),
});

export const start_agent_session = defineAction({
  name: "start_agent_session",
  description: "Bring a starting agent session into running (starting → running).",
  lifecycle: "experimental",
  input: z.object({
    session_id: z.string().describe("Agent session id (guest-minted; adopted, never minted)."),
  }),
});

export const block_agent_session = defineAction({
  name: "block_agent_session",
  description: "Block a running agent session (running → blocked).",
  lifecycle: "experimental",
  input: z.object({
    session_id: z.string().describe("Agent session to block."),
  }),
});

export const unblock_agent_session = defineAction({
  name: "unblock_agent_session",
  description: "Return a blocked agent session to running (blocked → running).",
  lifecycle: "experimental",
  input: z.object({
    session_id: z.string().describe("Agent session to unblock."),
  }),
});

export const cancel_agent_session = defineAction({
  name: "cancel_agent_session",
  description: "Cancel a running or blocked agent session (→ cancelled).",
  lifecycle: "experimental",
  input: z.object({
    session_id: z.string().describe("Agent session to cancel."),
  }),
});

export const fail_agent_session = defineAction({
  name: "fail_agent_session",
  description: "Fail a running or blocked agent session (→ failed).",
  lifecycle: "experimental",
  input: z.object({
    session_id: z.string().describe("Agent session to fail."),
  }),
});

export const close_agent_session = defineAction({
  name: "close_agent_session",
  description: "Close a running, cancelled, or failed agent session (→ closed).",
  lifecycle: "experimental",
  input: z.object({
    session_id: z.string().describe("Agent session to close."),
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

export const request_approval = defineAction({
  name: "request_approval",
  description: "Request operator approval for a pending context item (L2 gate).",
  lifecycle: "experimental",
  input: z.object({
    subject_ref: z.string().describe("Id of the subject awaiting approval."),
    reason: z.string().describe("Why approval is required."),
  }),
});

export const approve = defineAction({
  name: "approve",
  description: "Approve a pending approval request.",
  lifecycle: "experimental",
  input: z.object({
    request_id: z.string().describe("Approval request id to approve."),
  }),
});

export const deny = defineAction({
  name: "deny",
  description: "Deny a pending approval request.",
  lifecycle: "experimental",
  input: z.object({
    request_id: z.string().describe("Approval request id to deny."),
    reason: z.string().describe("Optional denial reason.").optional(),
  }),
});

export const promote_type = defineAction({
  name: "promote_type",
  description: "Promote a schema type from experimental to active (schema governance action).",
  lifecycle: "experimental",
  input: z.object({
    type_name: z.string().describe("Object, link, or action name to promote."),
  }),
});

/** Full schema v0.2 in declaration order — generators must preserve this order. */
export const schema: Schema = {
  objects: [
    competitor,
    event,
    market,
    odds_series,
    result,
    hypothesis,
    strategy,
    ticket,
    dataset,
    run,
    artifact,
    evaluation,
    workspace,
    agent_definition,
    agent_session,
    task,
    tool,
    execution_environment,
    connection,
  ],
  links: [
    participates_in,
    offered_on,
    quotes,
    settles,
    tests,
    has_leg,
    uses,
    executes_in,
    produces,
    derived_from,
    evaluated_by,
    assigned_to,
    delegates_to,
  ],
  actions: [
    create_hypothesis,
    register_dataset_version,
    start_run,
    cancel_run,
    complete_run,
    fail_run,
    retry_run,
    close_run,
    grade_ticket,
    start_event,
    settle_event,
    void_event,
    start_agent_session,
    block_agent_session,
    unblock_agent_session,
    cancel_agent_session,
    fail_agent_session,
    close_agent_session,
    publish_artifact,
    record_evaluation,
    resolve_hypothesis,
    request_approval,
    approve,
    deny,
    promote_type,
  ],
};

lintSchema(schema, transitions);
lintCommands(schema, transitions, commands, creationCommands);
