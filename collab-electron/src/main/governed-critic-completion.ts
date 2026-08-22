type SourceWork = {
  source_task_id: string;
  hypothesis_id: string;
  run_id: string;
  result_artifact_id: string;
  executor_session_id: string;
};

export type GovernedCriticProgress = {
  lifecycle: string;
  qualifyingReadsComplete: boolean;
};

export type GovernedCriticCompletionResult =
  | "completed"
  | "failed"
  | "stopped";

type CompletionDeps = {
  progress: () => GovernedCriticProgress | null;
  capture: () => Promise<string>;
  submit: (instruction: string) => Promise<void>;
  fail: (reasonCode: string, message: string) => void;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
  pollMs?: number;
  deadlineMs?: number;
};

const BUSY_LABELS = [
  "summoning hermes",
  "forging session",
  "cogitating",
  "ruminating",
  "brainstorming",
] as const;

/** Read Hermes' latest status label from its owned PTY transcript. */
export function hermesTerminalStatus(output: string): "ready" | "busy" | "unknown" {
  const lower = output.toLowerCase();
  const readyAt = lower.lastIndexOf("ready ");
  let busyAt = -1;
  for (const label of BUSY_LABELS) busyAt = Math.max(busyAt, lower.lastIndexOf(label));
  if (readyAt < 0 && busyAt < 0) return "unknown";
  return readyAt > busyAt ? "ready" : "busy";
}

export function buildGovernedCriticCompletionInstruction(
  reviewTaskId: string,
  sourceWork: SourceWork,
): string {
  return [
    "QUANTFLOW_REVIEW_COMPLETION",
    `review_task_id=${reviewTaskId}`,
    `source_work=${JSON.stringify(sourceWork)}`,
    "Your prior turn completed the three required reads but returned without writing the Evaluation. Complete the same independent review now; do not repeat the reads and do not write terminal prose.",
    "Call qf_record_evaluation exactly once with hypothesis_id, run_id, and artifact_id from source_work; rubric containing exactly faithfulness, answer_relevancy, context_precision, and context_recall as numbers from 0 through 1; a verdict matching the rubric (supports when all four are at least 0.8, rejects when any is below 0.5, otherwise inconclusive); numeric confidence from 0 through 1; a non-empty rationale; and a non-empty ordered findings array.",
    "Each finding must contain exactly code, severity, message, and evidence_refs. Severity is info, warning, or error. Evidence refs may name only the exact Hypothesis, Run, result Artifact, source Task, or executor in source_work. QuantFlow binds the review Task and frozen source_work itself.",
    "The review is incomplete until qf_record_evaluation succeeds and returns its Evaluation receipt.",
  ].join("\n") + "\r";
}

/**
 * One bounded same-seat completion correction. A second completed turn without
 * an Evaluation fails the review honestly instead of leaving a zombie Task.
 */
export async function ensureGovernedCriticCompletion(
  instruction: string,
  deps: CompletionDeps,
): Promise<GovernedCriticCompletionResult> {
  const sleep = deps.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const now = deps.now ?? Date.now;
  const pollMs = deps.pollMs ?? 500;
  const deadlineAt = now() + (deps.deadlineMs ?? 10 * 60_000);
  let correctionSubmitted = false;
  let sawCorrectedTurnBusy = false;

  while (now() < deadlineAt) {
    const progress = deps.progress();
    if (!progress) return "stopped";
    if (progress.lifecycle === "completed") return "completed";
    if (progress.lifecycle !== "running") return "failed";

    const status = hermesTerminalStatus(await deps.capture());
    if (!correctionSubmitted) {
      if (progress.qualifyingReadsComplete && status === "ready") {
        await deps.submit(instruction);
        correctionSubmitted = true;
      }
    } else if (status === "busy") {
      sawCorrectedTurnBusy = true;
    } else if (sawCorrectedTurnBusy && status === "ready") {
      deps.fail(
        "CRITIC_RETURNED_WITHOUT_EVALUATION",
        "The independent critic completed the required reads and one bounded completion correction but returned without recording an Evaluation.",
      );
      return "failed";
    }
    await sleep(pollMs);
  }

  deps.fail(
    "CRITIC_COMPLETION_TIMEOUT",
    "The independent critic did not record an Evaluation within the bounded completion window.",
  );
  return "failed";
}
