export type ResumeParticipant = { sessionId: string; requestOwned: boolean };

export type ResumeFailureState = {
  committed: boolean;
  dispatchAttempted: boolean;
  worker?: ResumeParticipant;
  coordinator?: ResumeParticipant;
};

export type ResumeFailureDependencies = {
  resultCommitted: () => boolean;
  coordinatorHasOtherOpenWork: (sessionId: string) => boolean;
  workerRunning: (sessionId: string) => boolean;
  failWorker: (sessionId: string, reason: "market_resume_setup_failed" | "market_resume_dispatch_failed") => void;
  stopParticipant: (sessionId: string, closeRow: boolean) => Promise<void>;
};

/** Apply the exact pre/post-handoff failure disposition without mutating the original Task before transfer. */
export async function handleMarketResumeFailure(state: ResumeFailureState, deps: ResumeFailureDependencies): Promise<unknown[]> {
  const failures: unknown[] = [];
  if (!state.committed) {
    if (state.worker?.requestOwned) await deps.stopParticipant(state.worker.sessionId, true).catch((error) => failures.push(error));
    if (state.coordinator?.requestOwned) await deps.stopParticipant(state.coordinator.sessionId, true).catch((error) => failures.push(error));
    return failures;
  }
  if (!state.worker || deps.resultCommitted()) return failures;
  if (deps.workerRunning(state.worker.sessionId)) {
    try { deps.failWorker(state.worker.sessionId, state.dispatchAttempted ? "market_resume_dispatch_failed" : "market_resume_setup_failed"); }
    catch (error) { failures.push(error); }
  }
  await deps.stopParticipant(state.worker.sessionId, false).catch((error) => failures.push(error));
  if (state.coordinator?.requestOwned && !deps.resultCommitted() && !deps.coordinatorHasOtherOpenWork(state.coordinator.sessionId)) {
    await deps.stopParticipant(state.coordinator.sessionId, true).catch((error) => failures.push(error));
  }
  return failures;
}
