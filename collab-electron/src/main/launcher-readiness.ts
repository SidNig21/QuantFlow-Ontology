/** Two-frame launcher handshake consumed from raw PTY bytes. */
export type LauncherReadinessWaiter = {
  sessionId: string;
  push(data: Buffer): void;
  wait(): Promise<void>;
  cancel(): void;
};

export function createLauncherReadinessWaiter(
  sessionId: string,
  nonce: string,
  timeoutMs = 10_000,
): LauncherReadinessWaiter {
  const ready = `QF_LAUNCH_READY ${nonce}`;
  const commit = `QF_LAUNCH_COMMIT ${nonce}`;
  let buffered = "";
  let readyCount = 0;
  let settled = false;
  let resolveWait!: () => void;
  let rejectWait!: (error: Error) => void;
  const waited = new Promise<void>((resolve, reject) => {
    resolveWait = resolve;
    rejectWait = reject;
  });
  const timer = setTimeout(() => {
    finish(new Error("native-TUI launcher readiness handshake timed out"));
  }, timeoutMs);

  function finish(error?: Error): void {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    if (error) rejectWait(error);
    else resolveWait();
  }

  function inspectLine(line: string): void {
    if (line === ready) {
      readyCount += 1;
      if (readyCount !== 1) {
        finish(new Error("native-TUI launcher READY receipt was duplicated"));
      }
      return;
    }
    if (line === commit) {
      if (readyCount !== 1) {
        finish(new Error("native-TUI launcher COMMIT arrived without exactly one READY"));
      } else {
        finish();
      }
      return;
    }
    if (line.startsWith("QF_LAUNCH_READY") || line.startsWith("QF_LAUNCH_COMMIT")) {
      finish(new Error("native-TUI launcher readiness handshake mismatched or malformed"));
    }
  }

  return {
    sessionId,
    push(data) {
      if (settled) return;
      buffered += data.toString("utf8");
      let newline = buffered.indexOf("\n");
      while (!settled && newline >= 0) {
        const line = buffered.slice(0, newline).replace(/\r$/, "");
        buffered = buffered.slice(newline + 1);
        inspectLine(line);
        newline = buffered.indexOf("\n");
      }
    },
    wait: () => waited,
    cancel() {
      // The owning admission already has a stronger failure to report.
      if (!settled) finish();
    },
  };
}
