export type SecondOpinionAdmission =
  | { kind: "already_open"; reviewTaskId: string }
  | { kind: "critic"; criticSessionId: string };

/** Check Kernel truth before invoking any critic admission side effect. */
export async function resolveSecondOpinionAdmission(
  readOpenReviewTask: () => string | null | Promise<string | null>,
  recruitOrReuseCritic: () => string | Promise<string>,
): Promise<SecondOpinionAdmission> {
  const reviewTaskId = await readOpenReviewTask();
  if (reviewTaskId) return { kind: "already_open", reviewTaskId };
  return { kind: "critic", criticSessionId: await recruitOrReuseCritic() };
}
