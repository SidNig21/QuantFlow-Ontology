import { expect, spyOn, test } from "bun:test";
import { runShutdownLifecycle } from "./shutdown-lifecycle";

test("runtime owner closes before PTY transport and shutdown reaches Kernel close", async () => {
  let transportOpen = true;
  const oldTransportFirst = async () => {
    transportOpen = false;
    if (!transportOpen) throw new Error("transport closed before agent teardown");
  };
  await expect(oldTransportFirst()).rejects.toThrow(
    "transport closed before agent teardown",
  );

  const calls: string[] = [];
  transportOpen = true;
  await runShutdownLifecycle({
    disposeAgentHost: async () => {
      expect(transportOpen).toBe(true);
      calls.push("agents");
    },
    killAllPtysAndWait: async () => calls.push("ptys"),
    shutdownPtySidecarIfIdle: async () => {
      transportOpen = false;
      calls.push("sidecar");
    },
    stopWatcher: () => calls.push("watcher"),
    stopGitReplay: () => calls.push("git-replay"),
    stopJsonRpcServer: () => calls.push("rpc"),
    stopImageWorker: () => calls.push("image"),
    closeKernel: () => calls.push("kernel"),
  });

  expect(calls).toEqual([
    "agents", "ptys", "sidecar", "watcher", "git-replay", "rpc", "image", "kernel",
  ]);
});

test("one cleanup failure cannot skip the remaining owned helpers or Kernel close", async () => {
  const steps = ["disposeAgentHost", "killAllPtysAndWait", "shutdownPtySidecarIfIdle", "stopWatcher", "stopGitReplay", "stopJsonRpcServer", "stopImageWorker", "closeKernel"] as const;
  const errors = spyOn(console, "error").mockImplementation(() => {});
  try {
    for (const failedStep of steps) {
      const calls: string[] = [];
      const cleanup = (step: string) => () => {
        calls.push(step);
        if (step === failedStep) throw new Error(`injected ${step} failure`);
      };
      await runShutdownLifecycle({
        disposeAgentHost: async () => cleanup("disposeAgentHost")(),
        killAllPtysAndWait: async () => cleanup("killAllPtysAndWait")(),
        shutdownPtySidecarIfIdle: async () => cleanup("shutdownPtySidecarIfIdle")(),
        stopWatcher: cleanup("stopWatcher"),
        stopGitReplay: cleanup("stopGitReplay"),
        stopJsonRpcServer: cleanup("stopJsonRpcServer"),
        stopImageWorker: cleanup("stopImageWorker"),
        closeKernel: cleanup("closeKernel"),
      });
      expect(calls).toEqual([...steps]);
      expect(errors.mock.calls.at(-1)?.[0]).toContain(failedStep);
    }
    expect(errors).toHaveBeenCalledTimes(steps.length);
  } finally {
    errors.mockRestore();
  }
});
