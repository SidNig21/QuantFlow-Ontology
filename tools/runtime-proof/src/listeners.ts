/** Enumerate TCP listeners and attribute them to explicit owner PIDs. */

export type ListenerOwnerMetadata = "ownerless" | "valid" | "malformed";

export type ParsedListener = {
  line: string;
  pids: number[];
  ownerMetadata: ListenerOwnerMetadata;
};

export type ListenSnapshot = {
  count: number;
  lines: string[];
};

const USERS_RE = /users:\((.*)\)\s*$/;
const PID_RE = /pid=([^,\s)]+)/g;

/** Parse one `ss -H -ltnp` LISTEN line without guessing ownership. */
export function parseListenerLine(raw: string): ParsedListener | null {
  const line = raw.trim();
  if (!line || !/\bLISTEN\b/.test(line)) return null;

  const usersStart = line.indexOf("users:");
  if (usersStart < 0) {
    return { line, pids: [], ownerMetadata: "ownerless" };
  }

  const users = USERS_RE.exec(line.slice(usersStart));
  if (!users) {
    return { line, pids: [], ownerMetadata: "malformed" };
  }

  const tokens = [...(users[1] ?? "").matchAll(PID_RE)];
  if (tokens.length === 0) {
    return { line, pids: [], ownerMetadata: "malformed" };
  }

  const pids = tokens.map((token) => Number(token[1]));
  if (pids.some((pid) => !Number.isInteger(pid) || pid <= 0)) {
    return { line, pids: [], ownerMetadata: "malformed" };
  }

  return {
    line,
    pids: [...new Set(pids)].sort((a, b) => a - b),
    ownerMetadata: "valid",
  };
}

export function parseListenerOutput(output: string): ParsedListener[] {
  return output
    .split("\n")
    .map((line) => parseListenerLine(line))
    .filter((line): line is ParsedListener => line !== null);
}

export function isOwnedListener(
  listener: ParsedListener,
  ownerPids: ReadonlySet<number> | Iterable<number>,
): boolean {
  if (listener.ownerMetadata !== "valid") return false;
  const owners = ownerPids instanceof Set ? ownerPids : new Set(ownerPids);
  return listener.pids.some((pid) => owners.has(pid));
}

export async function snapshotListeners(
  ownerPids: ReadonlySet<number> | Iterable<number>,
): Promise<ListenSnapshot> {
  const proc = Bun.spawn(["ss", "-H", "-ltnp"], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const out = await new Response(proc.stdout).text();
  const code = await proc.exited;
  if (code !== 0) {
    const err = await new Response(proc.stderr).text();
    throw new Error(`ss -H -ltnp failed (${code}): ${err}`);
  }

  const owners = ownerPids instanceof Set ? ownerPids : new Set(ownerPids);
  const lines = parseListenerOutput(out)
    .filter((listener) => isOwnedListener(listener, owners))
    .map((listener) => listener.line)
    .sort();
  return { count: lines.length, lines };
}

export function listenerDelta(before: ListenSnapshot, after: ListenSnapshot): string[] {
  const prior = new Set(before.lines);
  return after.lines.filter((line) => !prior.has(line));
}
