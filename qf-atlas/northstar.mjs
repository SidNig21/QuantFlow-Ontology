// qf-atlas / northstar.mjs — the ratified product loop, with evidence kept apart.
//
// Contract section I. Replaces the eight authored "operator loops" with the current
// north star:
//
//   ASK  PLAN  RECRUIT  ASSIGN  WATCH  STEER  PUBLISH  REVIEW  REOPEN  LEARN  CLOSE
//
// AND THE RULE THAT MATTERS MORE THAN THE NAMES: four evidence tiers, reported
// SEPARATELY, never collapsed into one green.
//
//   STATIC   the wiring exists and reaches execute() on every channel in the loop
//   GATE     a focused QA gate covers this loop
//   RUNTIME  the loop was observed executing
//   FOUNDER  the founder has confirmed the loop does its job
//
// The old model produced a single colour per loop, and a green one was routinely read
// as "this product feature works". It never meant that. It meant the plumbing was
// connected. Collapsing four questions into one answer is how a statically connected
// loop with no test, no runtime observation and no human confirmation came to look
// finished.
//
// WHAT IS AUTHORED: loop names, which channels belong to a loop, and which gate is
// meant to cover it. That is product intent and cannot be derived from source.
// WHAT IS DERIVED: every status. Adding a channel does not change a loop's colour;
// breaking one does.
//
// UNPROVEN IS NOT A FAILURE. Runtime and founder evidence do not exist in this repo
// yet, so both tiers report `unproven` WITH THE REASON. That is the contract's
// invariant — unexplained undecided = 0, never unknown = 0.

export const NORTH_STAR = [
  { id: "ask", name: "ASK",
    blurb: "A founder question becomes a Mission and a Task for the Research Director.",
    channels: ["qf:research:submitQuestion"],
    gates: ["research-director-front-door", "windows-research-question", "hermes-research"] },

  { id: "plan", name: "PLAN",
    blurb: "The question is decomposed into Tasks the Kernel records.",
    channels: ["qf:tasks:create", "qf:execute"],
    gates: ["research-director-delegation", "kernel-task-delegation"] },

  { id: "recruit", name: "RECRUIT",
    blurb: "A team is composed from agent definitions — which runtimes are available and hired.",
    channels: ["qf:definitions:list"],
    gates: ["team-composition", "team-composition-ui", "windows-dock-hire", "dock-registry"] },

  { id: "assign", name: "ASSIGN",
    blurb: "A Task moves to a seat. The agent path notifies the seat; the human path is where delivery has failed before.",
    channels: ["qf:tasks:reassign", "qf:tasks:surface", "qf:handoffs:list"],
    gates: ["kernel-task-delegation", "agent-path"] },

  { id: "watch", name: "WATCH",
    blurb: "The operator can see work in flight: a PTY, then an agent session on top of it.",
    channels: ["pty:create", "agent:spawn", "qf:sessions:spawn", "qf:sessions:runTurn", "qf:sessions:list"],
    gates: ["observe-door", "windows-dock-species"] },

  { id: "steer", name: "STEER",
    blurb: "Interrupt or redirect work in flight without losing the record of it.",
    channels: ["qf:tasks:steer", "qf:tasks:cancel", "agent:cancel", "qf:sessions:cancel"],
    gates: ["founder-steering", "kernel-one-path"] },

  { id: "publish", name: "PUBLISH",
    blurb: "Work product lands in the governed artifact store.",
    channels: ["qf:artifacts:list"],
    gates: ["artifact-root", "publish-artifact-root"] },

  { id: "review", name: "REVIEW",
    blurb: "The governed critic path. R15 shipped on this, and R16 renders it.",
    channels: ["qf:review:request", "qf:review:projection", "qf:review:revision", "qf:review:secondCritic"],
    gates: ["governed-review"] },

  { id: "reopen", name: "REOPEN",
    blurb: "A settled Task is reopened for another pass, or a second opinion is requested.",
    channels: ["qf:tasks:secondOpinion"],
    gates: ["verb-retirement"] },

  { id: "learn", name: "LEARN",
    blurb: "Evaluations and events feed back so the next pass is better informed.",
    channels: ["qf:events:list", "qf:research:ledger"],
    gates: ["kernel-market-lineage"] },

  { id: "close", name: "CLOSE",
    blurb: "Sessions and processes end cleanly, and nothing keeps running after the app closes.",
    channels: ["qf:sessions:close", "pty:kill", "agent:kill"],
    gates: ["windows-cold-boot", "boot-reconcile"] },
];

/** Worst-first, so a loop is only as good as its weakest wire. */
const STATIC_RANK = { cheats: 0, dead: 1, unreached: 2, unused: 3, live: 4, missing: 0 };

export function buildNorthStar({ wires, lifetime, gateExists, runtimeEvidence, founderEvidence }) {
  const wireOf = new Map(wires.map((w) => [w.channel, w]));

  return NORTH_STAR.map((loop) => {
    // ── STATIC ────────────────────────────────────────────────────────────
    const members = loop.channels.map((channel) => {
      const w = wireOf.get(channel);
      if (!w) {
        return { channel, status: "missing", hop4: null,
          why: "this channel is not registered anywhere in main — the loop names a wire that does not exist" };
      }
      const cheats = w.hop4?.kind === "cheats";
      return {
        channel,
        status: cheats ? "cheats" : w.status,
        hop4: w.hop4?.kind ?? null,
        why: cheats
          ? "reaches SQL the hop-4 walker places outside execute()"
          : w.status !== "live" ? `breaks at ${w.breakAt}` : null,
      };
    });
    const worst = members.reduce((acc, m) =>
      Math.min(acc, STATIC_RANK[m.status] ?? 4), 4);
    const broken = members.filter((m) => m.status !== "live");
    const staticTier = {
      state: !members.length ? "unproven"
        : worst === 4 ? "connected"
        : worst === 0 ? "broken"
        : "degraded",
      detail: !members.length
        ? "no channels are authored for this loop"
        : `${members.length - broken.length}/${members.length} channels live`,
      broken: broken.map((b) => ({ channel: b.channel, status: b.status, why: b.why })),
    };

    // ── GATE ──────────────────────────────────────────────────────────────
    // What is derivable is whether a gate EXISTS that is meant to cover this loop.
    // Whether it passes is not knowable without running it, and the contract forbids
    // putting release verification in this loop, so the tier says `covered`, never
    // `passing`. Claiming a pass we did not observe would be the exact fake green
    // this separation exists to prevent.
    const present = loop.gates.filter((g) => gateExists(g));
    const gateTier = {
      state: !loop.gates.length ? "unproven"
        : present.length === loop.gates.length ? "covered"
        : present.length ? "partial"
        : "uncovered",
      detail: !loop.gates.length
        ? "no gate is nominated for this loop"
        : `${present.length}/${loop.gates.length} nominated gate(s) present: ${present.join(", ") || "none"}`,
      missing: loop.gates.filter((g) => !gateExists(g)),
      note: "gate PRESENCE only — this tier never claims a gate passed, because running it is out of scope for a <=60s check",
    };

    // ── RUNTIME ───────────────────────────────────────────────────────────
    const rt = runtimeEvidence?.get(loop.id);
    const runtimeTier = rt ?? {
      state: "unproven",
      detail: "no runtime trace exists in this repo; a channel-fire recorder would be needed, and by itself it could only veto a delete, never authorize one",
    };

    // ── FOUNDER ───────────────────────────────────────────────────────────
    const fe = founderEvidence?.get(loop.id);
    const founderTier = fe ?? {
      state: "unproven",
      detail: "no founder confirmation is recorded for this loop",
    };

    // Lifetime is a real part of CLOSE and nothing else.
    const unreaped = loop.id === "close"
      ? lifetime.filter((l) => l.status !== "reaped").map((l) => ({ module: l.module, status: l.status }))
      : [];

    return {
      id: loop.id, name: loop.name, blurb: loop.blurb,
      members,
      evidence: { static: staticTier, gate: gateTier, runtime: runtimeTier, founder: founderTier },
      // A single badge is provided for display ONLY, and it deliberately encodes the
      // tiers rather than averaging them: S static, G gate, R runtime, F founder.
      badge: [
        staticTier.state === "connected" ? "S" : "",
        gateTier.state === "covered" ? "G" : "",
        runtimeTier.state === "proven" ? "R" : "",
        founderTier.state === "proven" ? "F" : "",
      ].join("") || "-",
      unreaped,
    };
  });
}

export function northStarStats(loops) {
  const count = (tier, state) => loops.filter((l) => l.evidence[tier].state === state).length;
  return {
    loops: loops.length,
    staticConnected: count("static", "connected"),
    staticDegraded: count("static", "degraded"),
    staticBroken: count("static", "broken"),
    gateCovered: count("gate", "covered"),
    gatePartial: count("gate", "partial"),
    gateUncovered: count("gate", "uncovered"),
    runtimeProven: count("runtime", "proven"),
    founderProven: count("founder", "proven"),
    fullyProven: loops.filter((l) => l.badge === "SGRF").length,
  };
}
