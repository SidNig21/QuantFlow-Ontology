/** Read one process table and derive only descendant AgentOS/tool-loop PIDs. */

const AGENT_CMDLINE = /acp-main|qf-toolloop/;

export type ProcessRecord = {
  pid: number;
  ppid: number;
  args: string;
  line: string;
};

export type ProcessSnap = {
  pids: number[];
  lines: string[];
  records: ProcessRecord[];
};

export function parseProcessTable(output: string): ProcessRecord[] {
  const records: ProcessRecord[] = [];
  for (const raw of output.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const match = /^(\d+)\s+(\d+)(?:\s+(.*))?$/.exec(line);
    if (!match) continue;
    const pid = Number(match[1]);
    const ppid = Number(match[2]);
    if (!Number.isInteger(pid) || !Number.isInteger(ppid)) continue;
    records.push({ pid, ppid, args: match[3] ?? "", line });
  }
  return records;
}

/** Return every recursive descendant, including grandchildren and deeper nodes. */
export function descendantPids(rootPid: number, records: readonly ProcessRecord[]): number[] {
  const children = new Map<number, number[]>();
  for (const record of records) {
    const siblings = children.get(record.ppid) ?? [];
    siblings.push(record.pid);
    children.set(record.ppid, siblings);
  }
  for (const siblings of children.values()) siblings.sort((a, b) => a - b);

  const visited = new Set<number>([rootPid]);
  const queue = [...(children.get(rootPid) ?? [])];
  const descendants: number[] = [];
  while (queue.length > 0) {
    const pid = queue.shift()!;
    if (visited.has(pid)) continue;
    visited.add(pid);
    descendants.push(pid);
    queue.push(...(children.get(pid) ?? []));
  }
  return descendants.sort((a, b) => a - b);
}

function toSnapshot(records: readonly ProcessRecord[]): ProcessSnap {
  const sorted = [...records].sort((a, b) => a.pid - b.pid);
  return {
    pids: sorted.map((record) => record.pid),
    lines: sorted.map((record) => record.line),
    records: sorted,
  };
}

/** Select only matching AgentOS/tool-loop descendants of the supplied root PID. */
export function selectAgentProcesses(
  records: readonly ProcessRecord[],
  rootPid: number,
): ProcessSnap {
  const descendants = new Set(descendantPids(rootPid, records));
  return toSnapshot(
    records.filter((record) => descendants.has(record.pid) && AGENT_CMDLINE.test(record.args)),
  );
}

export async function snapshotProcessTable(): Promise<ProcessRecord[]> {
  const proc = Bun.spawn(["ps", "-eo", "pid=,ppid=,args="], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const out = await new Response(proc.stdout).text();
  const code = await proc.exited;
  if (code !== 0) {
    const err = await new Response(proc.stderr).text();
    throw new Error(`ps failed (${code}): ${err}`);
  }
  return parseProcessTable(out);
}

export async function snapshotAgentProcesses(rootPid = process.pid): Promise<ProcessSnap> {
  return selectAgentProcesses(await snapshotProcessTable(), rootPid);
}

/** PIDs present after the baseline that were not present in the baseline. */
export function processDelta(before: ProcessSnap, after: ProcessSnap): number[] {
  const prior = new Set(before.pids);
  return after.pids.filter((pid) => !prior.has(pid));
}

/** Keep exact tracked PIDs that still exist, independent of their current parentage. */
export function survivingPids(
  trackedPids: readonly number[],
  current: readonly ProcessRecord[],
): number[] {
  const live = new Set(current.map((record) => record.pid));
  return trackedPids.filter((pid) => live.has(pid));
}
