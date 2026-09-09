export type ShutdownLifecycleDependencies = {
  disposeAgentHost: () => Promise<void>;
  killAllPtysAndWait: () => Promise<void>;
  shutdownPtySidecarIfIdle: () => Promise<void>;
  stopWatcher: () => void;
  stopGitReplay: () => void;
  stopJsonRpcServer: () => void;
  stopImageWorker: () => void;
  closeKernel: () => void;
};

/** Close runtime owners while their PTY transport is still available. */
export async function runShutdownLifecycle(
  dependencies: ShutdownLifecycleDependencies,
): Promise<void> {
  // Cleanup is ordered, but one failed owner must not strand every later helper.
  const steps = [
    "disposeAgentHost", "killAllPtysAndWait", "shutdownPtySidecarIfIdle",
    "stopWatcher", "stopGitReplay", "stopJsonRpcServer", "stopImageWorker", "closeKernel",
  ] as const;
  for (const step of steps) {
    try {
      await dependencies[step]();
    } catch (error) {
      console.error(`QuantFlow shutdown: ${step} failed; continuing remaining cleanup`, error);
    }
  }
}
