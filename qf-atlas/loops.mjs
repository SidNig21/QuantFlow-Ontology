// qf-atlas / loops.mjs — the operator loops.
//
// 128 equal channels is a parts list. Nobody needs `dialog:open-image` to
// understand QuantFlow; they need the handful of jobs an operator actually does.
//
// WHAT IS AUTHORED HERE: the loop names and which channels belong to each. That
// is product intent and cannot be derived from source.
// WHAT IS DERIVED: every loop's health. A loop is only as good as its worst wire,
// and the wire statuses come from the code. Adding a channel to the app does not
// silently change a loop's colour; breaking one does.

export const LOOPS = [
  {
    id: "ask",
    name: "Ask a research question",
    blurb: "The front door. A founder question becomes a Mission and a Task for the Research Director.",
    channels: ["qf:research:submitQuestion"],
  },
  {
    id: "create-task",
    name: "Create a Task",
    blurb: "A Task is written to the Kernel and shown on the canvas.",
    channels: ["qf:tasks:create"],
  },
  {
    id: "assign",
    name: "Assign and reassign",
    blurb: "Move a Task to a seat. The agent path notifies the seat; the human path is where delivery has failed before.",
    channels: ["qf:tasks:reassign", "qf:tasks:secondOpinion"],
  },
  {
    id: "spawn-seat",
    name: "Spawn a seat",
    blurb: "Start a runtime the operator can watch: a PTY, then an agent session on top of it.",
    channels: ["pty:create", "agent:spawn", "qf:sessions:runTurn"],
  },
  {
    id: "steer",
    name: "Steer and cancel",
    blurb: "Interrupt work in flight without losing the record of it.",
    channels: ["qf:tasks:steer", "qf:tasks:cancel", "qf:sessions:cancel"],
  },
  {
    id: "review",
    name: "Review and publish",
    blurb: "The governed critic path. R15 shipped on this, and R16 renders it.",
    channels: ["qf:review:request", "qf:review:revision", "qf:review:secondCritic", "qf:review:projection"],
  },
  {
    id: "world",
    name: "Show the research world",
    blurb: "Everything R16 must reveal on the canvas: the ledger, the task surface, artifacts, events and cables.",
    channels: ["qf:research:ledger", "qf:tasks:surface", "qf:artifacts:list", "qf:events:list", "qf:connections:list", "qf:handoffs:list"],
  },
  {
    id: "close",
    name: "Close the app",
    blurb: "Quit must stop every worker it started. This loop is made of lifetime wires, not IPC.",
    channels: [],
    lifetime: true,
  },
];

const IPC_RANK = { dead: 0, cheats: 1, unreached: 2, unused: 3, live: 4 };
const LIFE_RANK = { unreaped: 0, conditional: 1, partial: 2, reaped: 3 };

export function buildLoops(wires, lifetime) {
  const byChannel = new Map(wires.map((w) => [w.channel, w]));

  return LOOPS.map((spec) => {
    const members = [];
    for (const ch of spec.channels) {
      const w = byChannel.get(ch);
      members.push(
        w
          ? { channel: ch, status: w.status, hop4: w.hop4?.kind ?? "unknown", hops: w.hops, breakAt: w.breakAt }
          // A named loop pointing at a channel that no longer exists is itself a
          // finding: either the loop was renamed or the feature was removed.
          : { channel: ch, status: "missing", hop4: "unknown", hops: [], breakAt: "channel not registered anywhere" },
      );
    }
    if (spec.lifetime) {
      for (const l of lifetime)
        members.push({
          channel: l.module.replace("collab-electron/src/main/", ""),
          status: l.status, hop4: "lifetime", hops: l.hops, breakAt: l.breakAt, why: l.why,
        });
    }

    const worst = members.reduce((acc, m) => {
      const rank = spec.lifetime ? (LIFE_RANK[m.status] ?? 0) : (IPC_RANK[m.status] ?? 0);
      return rank < acc.rank ? { rank, status: m.status } : acc;
    }, { rank: 99, status: "live" });

    const healthy = spec.lifetime ? worst.status === "reaped" : worst.status === "live";
    const broken = members.filter((m) =>
      spec.lifetime ? m.status !== "reaped" : m.status !== "live");

    return {
      ...spec,
      members,
      worst: worst.status,
      health: healthy ? "ok" : broken.length === members.length ? "broken" : "degraded",
      brokenCount: broken.length,
      total: members.length,
    };
  });
}
