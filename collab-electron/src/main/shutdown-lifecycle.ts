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
  await dependencies.disposeAgentHost();
  await dependencies.killAllPtysAndWait();
  await dependencies.shutdownPtySidecarIfIdle();
  dependencies.stopWatcher();
  dependencies.stopGitReplay();
  dependencies.stopJsonRpcServer();
  dependencies.stopImageWorker();
  dependencies.closeKernel();
}
