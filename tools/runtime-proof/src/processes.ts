/**
 * Enumerate OS processes that look like the packed ACP agent (stdio child).
 * Used for P4 orphan assertion — leaked children are the real risk, not listeners.
 */

const AGENT_CMDLINE = /acp-main|qf-toolloop/;

export type ProcessSnap = {
  pids: number[];
  lines: string[];
};

/** Snapshot PIDs whose command line matches the packed ACP agent. */
export async function snapshotAgentProcesses(): Promise<ProcessSnap> {
  const proc = Bun.spawn(["ps", "-eo", "pid=,args="], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const out = await new Response(proc.stdout).text();
  const code = await proc.exited;
  if (code !== 0) {
    const err = await new Response(proc.stderr).text();
    throw new Error(`ps failed (${code}): ${err}`);
  }

  const lines: string[] = [];
  const pids: number[] = [];
  for (const raw of out.split("\n")) {
    const line = raw.trim();
    if (!line || !AGENT_CMDLINE.test(line)) continue;
    // Skip the pack/build helpers if any; keep runtime agent entrypoints.
    if (line.includes("pack-agent") || line.includes("agentos-toolchain")) continue;
    const m = /^(\d+)\s+(.*)$/.exec(line);
    if (!m) continue;
    const pid = Number(m[1]);
    if (!Number.isFinite(pid)) continue;
    pids.push(pid);
    lines.push(line);
  }
  pids.sort((a, b) => a - b);
  return { pids, lines };
}

/** PIDs present in `after` that were not in `before`. */
export function processDelta(before: ProcessSnap, after: ProcessSnap): number[] {
  const prior = new Set(before.pids);
  return after.pids.filter((p) => !prior.has(p));
}
