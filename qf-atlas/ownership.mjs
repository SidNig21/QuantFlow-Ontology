// qf-atlas / ownership.mjs — who owns each architectural responsibility.
//
// Contract section F: "Duplicate ownership is larger than duplicate IPC registration.
// A second differently-named implementation for one responsibility must be visible."
//
// WHY THIS IS A SEPARATE ANALYZER. The duplicate detector already catches two handlers
// on one channel in one mode. It cannot catch the failure that actually happens in this
// repo: old code left alive beside new code, under a different name, on a different
// channel, doing the same job. Nothing in the map asked "who is supposed to own this,
// and does anyone else think they do?"
//
// POLICY, NOT TRUTH. The responsibility list below is an explicit architectural policy
// — the contract permits exactly that, and requires it not become a second truth store.
// It declares which jobs are canonical; it does not decide who implements them. Every
// implementer is discovered from AST facts.
//
// EVIDENCE STRENGTH, and this is the part that keeps it honest:
//
//   STRONG   two files mutate the same domain table, or register channels in the same
//            family, or dispatch the same governed action. Structural, from the AST.
//   WEAK     an exported function name matches the responsibility's verb pattern.
//            Name matching only.
//
// The contract forbids name matching from creating a high-confidence red on its own, so
// a responsibility with two claimants on WEAK evidence alone is reported `medium` /
// INVESTIGATE. `high` requires a shared strong signal.

/**
 * The canonical responsibilities. `verbs` are name patterns (weak evidence). `tables`
 * and `channels` are structural anchors (strong evidence).
 */
export const RESPONSIBILITIES = [
  { id: "domain-mutation", name: "Domain truth / mutation",
    // No verb pattern. `^(create|update|...)[A-Z]` matched 29 exported functions and
    // conveyed nothing: every module that builds anything exports a createX. Domain
    // mutation is owned by the derived write door, and a writer outside it is already a
    // persistence finding — duplicating it here would double-count the same defect.
    verbs: null, tables: null, channels: null,
    note: "owned by the derived write door; writers outside it surface as persistence findings, not here" },
  { id: "session-lifecycle", name: "Session lifecycle",
    verbs: /(start|stop|close|cancel|block|unblock|fail).*Session|Session.*(Start|Stop|Close|Cancel)/,
    tables: ["agent_session"], channels: /^qf:sessions?:/ },
  { id: "runtime-admission", name: "Runtime launch / admission",
    verbs: /(admit|launch|spawnSeat|startAgent|orchestrate).*(Session|Runtime|Tui|Species|Agent)/,
    tables: null, channels: /^qf:dock:/ },
  { id: "task-delivery", name: "Exact task delivery",
    verbs: /(deliver|assign|reassign|steer|redirect).*Task|Task.*(Deliver|Assign|Steer)/,
    tables: ["task"], channels: /^qf:tasks?:/ },
  { id: "tool-authorization", name: "Tool authorization",
    verbs: /(grant|authorize|permit|allow).*(Tool|Toolset|Permission)|toolPolicy/i,
    tables: null, channels: /permission/i },
  { id: "canvas-projection", name: "Canvas domain projection",
    verbs: /(project|render|compose).*(Canvas|Tile)|canvas.*Project/i,
    tables: null, channels: /^(qf:)?canvas[:.]/ },
  { id: "layout-persistence", name: "Layout / cache persistence",
    verbs: /(save|load|persist|restore).*(Layout|Viewport|Tile|Cache)/,
    tables: null, channels: /^(qf:)?(layout|viewport)/ },
  { id: "process-cleanup", name: "Process cleanup",
    // Narrowed to child-process teardown. `shutdown|dispose` alone made
    // analytics.ts a claimant against PTY teardown — different resources, no conflict.
    verbs: /(killAll|reap|terminateProcess|killProcess|stopWorker|killSession)/, tables: null, channels: null },
  { id: "review-publication", name: "Research review / publication",
    verbs: new RegExp("(^|[a-z])(Publish|Review|Critique|Grade|SecondOpinion)|^(publish|review|critique|grade|secondOpinion)[A-Z]"),
    tables: ["evaluation"], channels: /^qf:review:/ },
  { id: "artifact-storage", name: "Artifact storage",
    verbs: /(store|write|publish|resolve).*Artifact|Artifact.*(Store|Root|Path)/,
    tables: ["artifact"], channels: /^qf:artifacts?:/ },
];

/** Only product code can own a product responsibility. */
const isProduct = (p) =>
  p.startsWith("collab-electron/src/") || p.startsWith("packages/qf-kernel/src/");

/**
 * TRANSPORT IS NOT OWNERSHIP, and conflating them is what made the first run of this
 * analyzer useless. A preload that registers `qf:sessions:*` is forwarding; it does not
 * own session lifecycle. An `ipc-*.ts` module in main is the IPC surface: it routes a
 * channel to whoever does the work. Counting a registration as a claim reported
 * preload/universal.ts as a structural co-owner of session lifecycle AND tool
 * authorization, and ipc-kernel.ts as a co-owner of four separate responsibilities.
 *
 * A transport file can still be a genuine owner — but only by doing the work inline,
 * which shows up as its own SQL or its own declared implementation, never as a
 * registration.
 */
function isTransport(p) {
  if (p.startsWith("collab-electron/src/preload/")) return true;
  const base = p.slice(p.lastIndexOf("/") + 1);
  if (base === "ipc.ts" || (base.startsWith("ipc-") && base.endsWith(".ts"))) return true;
  return base === "canvas-rpc.ts";
}

export function detectOwnership({ astOf, domainTables, relOf = (x) => x }) {
  const claims = new Map();   // responsibility id -> Map(file -> {weak:[], strong:[]})
  for (const r of RESPONSIBILITIES) claims.set(r.id, new Map());

  const claim = (rid, file, kind, detail) => {
    const byFile = claims.get(rid);
    if (!byFile.has(file)) byFile.set(file, { weak: [], strong: [] });
    byFile.get(file)[kind].push(detail);
  };

  for (const [path, a] of astOf) {
    if (!isProduct(path) || /\.(test|spec)\./.test(path)) continue;
    for (const r of RESPONSIBILITIES) {
      // WEAK — an exported declaration whose name matches the responsibility's verbs.
      // Exported only: a private helper is an implementation detail, not a claim of
      // ownership, and counting private helpers turned every large file into a claimant.
      for (const fn of a.functions ?? [])
        if (fn.exported && r.verbs?.test(fn.name))
          claim(r.id, path, "weak", `exports ${fn.name}() at line ${fn.line}`);

      // STRONG — mutates a table the responsibility owns.
      if (r.tables)
        for (const s of a.sql ?? [])
          if (r.tables.includes(s.table) && domainTables.has(s.table))
            claim(r.id, path, "strong", `${s.verb} ${s.table} at line ${s.line}`);

      // STRONG — registers a channel in the responsibility's family AND is not a
      // transport module. A registration in transport is routing, not owning.
      if (r.channels && !isTransport(path))
        for (const c of a.ipc ?? [])
          if (r.channels.test(c.channel) && (c.method === "handle" || c.method === "on"))
            claim(r.id, path, "strong", `${c.surface}.${c.method}("${c.channel}") at line ${c.line}`);
    }
  }

  const findings = [];
  for (const r of RESPONSIBILITIES) {
    const byFile = claims.get(r.id);
    const owners = [...byFile.entries()].map(([file, ev]) => ({
      file, weak: ev.weak.slice(0, 3), strong: ev.strong.slice(0, 3),
      weight: ev.strong.length ? "strong" : "weak",
    }));
    const strongOwners = owners.filter((o) => o.weight === "strong");
    // A responsibility with no claimant at all is itself worth stating: either the job
    // is not implemented, or the policy's signals do not match how this repo names it.
    // Silence would read as "single clean owner", which is the opposite of the truth.
    // A responsibility with no signals is DELEGATED, not unclaimed: domain mutation is
    // adjudicated by the write-door analyzer, and re-reporting it here would double-count
    // the same defect under a second name.
    if (!r.verbs && !r.tables && !r.channels) continue;
    if (!owners.length) {
      findings.push({
        id: `ownership:${r.id}`, responsibility: r.id, name: r.name,
        status: "unclaimed", disposition: "INVESTIGATE", confidence: "low",
        evidenceLevel: "S", owners: [],
        why: "no product file matched this responsibility's signals — either it is not implemented, or the policy's patterns do not match how this repo names it",
      });
      continue;
    }
    if (owners.length === 1) continue;   // single owner: nothing to report

    // Two or more claimants. Confidence follows evidence strength, never count.
    const high = strongOwners.length > 1;
    findings.push({
      id: `ownership:${r.id}`, responsibility: r.id, name: r.name,
      status: "multiple-claimants",
      disposition: "INVESTIGATE",
      confidence: high ? "high" : "medium",
      evidenceLevel: "S",
      owners: owners.sort((a, b) => (b.strong.length - a.strong.length) || a.file.localeCompare(b.file)).slice(0, 8),
      ownerCount: owners.length,
      strongOwnerCount: strongOwners.length,
      why: high
        ? `${strongOwners.length} files carry STRUCTURAL evidence for one responsibility — they mutate the same table or own the same channel family, which is competing ownership rather than a shared helper`
        : `${owners.length} files export names matching this responsibility, but on NAME evidence only; the contract forbids name matching alone from producing a confirmed defect, so this needs a human read`,
      note: r.note ?? null,
    });
  }

  return {
    findings,
    responsibilities: RESPONSIBILITIES.map((r) => ({ id: r.id, name: r.name })),
    stats: {
      responsibilities: RESPONSIBILITIES.length,
      contested: findings.filter((f) => f.status === "multiple-claimants").length,
      highConfidence: findings.filter((f) => f.confidence === "high").length,
      unclaimed: findings.filter((f) => f.status === "unclaimed").length,
    },
    // path -> responsibility ids, so the coverage matrix can report ownership as
    // `indexed` for a file that actually carries a claim instead of `unsupported`.
    byFile: (() => {
      const m = new Map();
      for (const r of RESPONSIBILITIES)
        for (const file of claims.get(r.id).keys()) {
          if (!m.has(file)) m.set(file, []);
          m.get(file).push(r.id);
        }
      return m;
    })(),
  };
}
