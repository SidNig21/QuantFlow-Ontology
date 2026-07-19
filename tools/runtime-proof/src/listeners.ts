/**
 * Enumerate TCP listening sockets via `ss -ltn`.
 * Used for P2: no additional listener after starting AgentOS.
 */
export type ListenSnapshot = {
  count: number;
  lines: string[];
};

export async function snapshotListeners(): Promise<ListenSnapshot> {
  const proc = Bun.spawn(["ss", "-ltn"], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const out = await new Response(proc.stdout).text();
  const code = await proc.exited;
  if (code !== 0) {
    const err = await new Response(proc.stderr).text();
    throw new Error(`ss -ltn failed (${code}): ${err}`);
  }
  const lines = out
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.includes("LISTEN"));
  return { count: lines.length, lines: lines.slice().sort() };
}

export function listenerDelta(before: ListenSnapshot, after: ListenSnapshot): string[] {
  const prior = new Set(before.lines);
  return after.lines.filter((l) => !prior.has(l));
}
