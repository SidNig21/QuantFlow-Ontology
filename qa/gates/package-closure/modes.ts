/**
 * Pure package-closure mode resolution — dependency-free (RW1/RW6).
 */
export type PackageClosureMode =
  | { kind: "canonical"; runId: string }
  | { kind: "standalone" }
  | {
      kind: "bait";
      bait: "missing-hermes" | "missing-upgrade" | "dev-root" | "preflight-missing";
    };

export type ModeInputs = {
  releaseRunId: string | undefined;
  bait: string | undefined;
};

export function resolvePackageClosureMode(inputs: ModeInputs): PackageClosureMode {
  const bait = inputs.bait?.trim();
  if (bait) {
    if (bait === "missing-hermes" || bait === "missing-upgrade" || bait === "dev-root" || bait === "preflight-missing") {
      return { kind: "bait", bait };
    }
    throw new Error(`unknown package-closure bait: ${bait}`);
  }

  const runId = inputs.releaseRunId?.trim();
  if (runId) {
    return { kind: "canonical", runId };
  }

  return { kind: "standalone" };
}
