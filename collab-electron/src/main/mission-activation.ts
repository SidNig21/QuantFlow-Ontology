export const MAX_MISSION_QUESTION_BYTES = 4_096;
export const MAX_MISSION_ACTIVATION_BYTES = 6_144;

export type MissionActivationMode = "research-director" | "orchestrator";

/** Build the sole PTY instruction allowed after launcher readiness. */
export function buildMissionActivationInstruction(
  missionId: string,
  question: string,
  mode: MissionActivationMode = "research-director",
): string {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(missionId)) {
    throw new Error("mission activation id is invalid");
  }
  if (Buffer.byteLength(question, "utf8") > MAX_MISSION_QUESTION_BYTES) {
    throw new Error(
      `mission question exceeds ${MAX_MISSION_QUESTION_BYTES} UTF-8 bytes`,
    );
  }
  const payload = JSON.stringify({
    contract: "qf.mission.activation.v1",
    mission_id: missionId,
    question,
    instruction: mode === "research-director"
      ? "Acknowledge the founder Mission. Use only QuantFlow MCP tools. Report missing data or Strategy/Technique coverage honestly. Plan future governed work with exact Kernel IDs, but do not recruit or assign a Task in this slice. Never place a bet or trade."
      : "Use only QuantFlow MCP tools. Hire the named worker, delegate this mission, and return a receipt.",
  }).replace(/[\u007f-\u009f]/g, (character) =>
    `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`
  );
  const instruction = `QUANTFLOW_MISSION ${payload}\r`;
  if (Buffer.byteLength(instruction, "utf8") > MAX_MISSION_ACTIVATION_BYTES) {
    throw new Error(
      `mission activation exceeds ${MAX_MISSION_ACTIVATION_BYTES} UTF-8 bytes`,
    );
  }
  return instruction;
}
