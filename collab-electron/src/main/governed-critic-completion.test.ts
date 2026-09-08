import { describe, expect, test } from "bun:test";
import {
  buildGovernedCriticCompletionInstruction,
  DECISION_CRITIC_FINDING_CODES,
  ensureGovernedCriticCompletion,
  governedDecisionCriticContract,
  hermesTerminalStatus,
} from "./governed-critic-completion.ts";

const work = {
  source_task_id: "task-1",
  hypothesis_id: "hypothesis-1",
  run_id: "run-1",
  result_artifact_id: "artifact-1",
  executor_session_id: "worker-1",
};

describe("governed critic completion", () => {
  test("uses the latest Hermes status instead of stale screen history", () => {
    expect(hermesTerminalStatus("ready | old\n(°ロ°) cogitating…")).toBe("busy");
    expect(hermesTerminalStatus("cogitating…\nready | kimi k3\n❯")).toBe("ready");
    expect(hermesTerminalStatus("no status here")).toBe("unknown");
  });

  test("completion correction carries the exact frozen work and full rubric contract", () => {
    const instruction = buildGovernedCriticCompletionInstruction("review-1", work, { decisionReview: true });
    expect(instruction.endsWith("\r")).toBe(true);
    expect(instruction).toContain('review_task_id=review-1');
    expect(instruction).toContain('"result_artifact_id":"artifact-1"');
    expect(instruction).toContain("faithfulness, answer_relevancy, context_precision, and context_recall");
    expect(instruction).toContain("do not repeat the reads");
    expect(instruction).toContain(DECISION_CRITIC_FINDING_CODES.join(", "));
    expect(instruction).toContain("The rubric judges whether the Artifact is faithful");
  });

  test("market decision contract gives the model the Kernel's exact repair target", () => {
    const instruction = governedDecisionCriticContract();
    for (const code of DECISION_CRITIC_FINDING_CODES) expect(instruction).toContain(code);
    expect(instruction).toContain("supports only when all four scores are at least 0.8");
    expect(instruction).toContain("rejects when any score is below 0.5");
  });

  test("nudges the same critic once after three reads and accepts the Evaluation", async () => {
    let lifecycle = "running";
    let capture = "ready | kimi k3\n❯";
    const submitted: string[] = [];
    const result = await ensureGovernedCriticCompletion("repair\r", {
      progress: () => ({ lifecycle, qualifyingReadsComplete: true }),
      capture: async () => capture,
      submit: async (instruction) => {
        submitted.push(instruction);
        capture = "cogitating…";
      },
      fail: () => { throw new Error("unexpected failure"); },
      sleep: async () => {
        if (submitted.length === 1) lifecycle = "completed";
      },
      now: () => 0,
    });
    expect(result).toBe("completed");
    expect(submitted).toEqual(["repair\r"]);
  });

  test("fails honestly after the corrected turn also returns without Evaluation", async () => {
    const captures = ["ready | kimi k3\n❯", "cogitating…", "ready | kimi k3\n❯"];
    const failures: string[] = [];
    const result = await ensureGovernedCriticCompletion("repair\r", {
      progress: () => ({ lifecycle: "running", qualifyingReadsComplete: true }),
      capture: async () => captures.shift() ?? "ready | kimi k3\n❯",
      submit: async () => {},
      fail: (code) => failures.push(code),
      sleep: async () => {},
      now: () => 0,
    });
    expect(result).toBe("failed");
    expect(failures).toEqual(["CRITIC_RETURNED_WITHOUT_EVALUATION"]);
  });
});
