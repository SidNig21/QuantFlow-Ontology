/** Two-frame launcher handshake consumed from raw PTY bytes. */
export type LauncherReadinessWaiter = {
  sessionId: string;
  push(data: Buffer): void;
  wait(): Promise<void>;
  cancel(): void;
};

/** Remove terminal-emulator control frames without removing ordinary text. */
function stripTerminalControls(line: string): string {
  let plain = "";
  for (let index = 0; index < line.length;) {
    if (line[index] !== "\u001b") {
      if (line[index] !== "\r") plain += line[index];
      index += 1;
      continue;
    }
    if (line[index + 1] === "[") {
      let end = index + 2;
      while (
        end < line.length &&
        !(line.charCodeAt(end) >= 0x40 && line.charCodeAt(end) <= 0x7e)
      ) end += 1;
      if (end >= line.length) return line;
      index = end + 1;
      continue;
    }
    if (line[index + 1] === "]") {
      const bell = line.indexOf("\u0007", index + 2);
      const terminator = line.indexOf("\u001b\\", index + 2);
      const end = bell >= 0 && (terminator < 0 || bell < terminator)
        ? bell + 1
        : terminator >= 0 ? terminator + 2 : -1;
      if (end < 0) return line;
      index = end;
      continue;
    }
    if (index + 1 >= line.length) return line;
    index += 2;
  }
  return plain;
}

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
    line = stripTerminalControls(line);
    // Windows ConPTY may render the launcher's blank line as an absolute
    // cursor-position escape instead of preserving the newline. After those
    // terminal controls are removed, the two exact receipts are adjacent.
    // Accept only that exact fused pair; surrounding vendor text still fails.
    if (line === `${ready}${commit}`) {
      if (readyCount !== 0) {
        finish(new Error("native-TUI launcher READY receipt was duplicated"));
      } else {
        readyCount = 1;
        finish();
      }
      return;
    }
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
