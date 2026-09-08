import { expect, test } from "bun:test";
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
