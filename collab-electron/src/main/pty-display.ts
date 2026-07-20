/**
 * Scoped PTY → webContents viewer tracking + display push (WO-008e rework D3).
 * Kept out of pty.ts so A2A does not grow the 1k+ PTY module further.
 */
import type { WebContents } from "electron";

type ForwardFn = (
  sessionId: string,
  senderWebContentsId: number | undefined,
  data: Buffer,
) => void;

let forward: ForwardFn | null = null;
let getWc: (() => typeof import("electron").webContents | null) | null = null;

const sessionViewers = new Map<string, number>();

/** Wire once from pty.ts (avoids circular imports of forwardPtyData). */
export function bindPtyDisplay(opts: {
  forwardPtyData: ForwardFn;
  getWebContents: () => typeof import("electron").webContents | null;
}): void {
  forward = opts.forwardPtyData;
  getWc = opts.getWebContents;
}

export function rememberPtyViewer(
  sessionId: string,
  senderWebContentsId: number | undefined,
): void {
  if (senderWebContentsId != null) {
    sessionViewers.set(sessionId, senderWebContentsId);
  }
}

export function forgetPtyViewer(sessionId: string): void {
  sessionViewers.delete(sessionId);
}

export function clearAllPtyViewers(): void {
  sessionViewers.clear();
}

export function getPtyViewer(sessionId: string): number | undefined {
  return sessionViewers.get(sessionId);
}

/**
 * Push bytes to the attached term tile only. Fail closed if no viewer —
 * never broadcast to all webContents.
 */
export function displayOnSession(sessionId: string, data: string): boolean {
  const viewer = sessionViewers.get(sessionId);
  if (viewer == null) {
    console.warn(
      `pty-display: no viewer for session=${sessionId} — display skipped (fail closed)`,
    );
    return false;
  }
  const wcApi = getWc?.();
  if (!wcApi) return false;
  let sender: WebContents | undefined;
  try {
    sender = wcApi.fromId(viewer);
  } catch {
    forgetPtyViewer(sessionId);
    return false;
  }
  if (!sender || sender.isDestroyed()) {
    forgetPtyViewer(sessionId);
    console.warn(
      `pty-display: stale viewer for session=${sessionId} — display skipped`,
    );
    return false;
  }
  if (!forward) return false;
  forward(sessionId, viewer, Buffer.from(data, "utf8"));
  return true;
}
