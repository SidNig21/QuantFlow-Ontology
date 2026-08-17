// qf-atlas / lifetime.mjs — process lifetime as a second kind of wire.
//
// "Close does not kill the worker" will never look like a missing invoke, so IPC
// analysis alone can never find it. A lifetime wire runs spawn → reap:
//
//   spawn   a main module starts a process
//   reap    the app quit path stops it
//
// An unreaped spawner is an × on the close-app loop, the same way a missing
// handler is an × on an IPC loop. Mechanically true, and it regenerates.

const RE_SPAWN = /\b(?:spawn|spawnSync|execFile|execFileSync|fork)\s*\(/;
// A reap whose own name admits it might not happen. `shutdownSidecarIfIdle`
// states the condition out loud.
const RE_CONDITIONAL = /(?:IfIdle|IfNeeded|IfRunning|Maybe|Try|Opportunistic)/;

/** `import * as pty from "./pty"` and `import { a, b } from "./x"` in one file. */
function importBindings(text) {
  const byModule = new Map();                 // "./pty" -> Set(binding names)
  const ns = /import\s+\*\s+as\s+([A-Za-z_$][\w$]*)\s+from\s+["'](\.[^"']+)["']/g;
  const named = /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+["'](\.[^"']+)["']/g;
  let m;
  while ((m = ns.exec(text))) {
    if (!byModule.has(m[2])) byModule.set(m[2], new Set());
    byModule.get(m[2]).add(m[1]);
  }
  while ((m = named.exec(text))) {
    if (!byModule.has(m[2])) byModule.set(m[2], new Set());
    for (const part of m[1].split(",")) {
      const name = part.trim().split(/\s+as\s+/).pop().trim();
      if (name) byModule.get(m[2]).add(name);
    }
  }
  return byModule;
}

const modKey = (spec) => spec.replace(/^\.\//, "").replace(/\/index$/, "");

/**
 * @param spawners  [{path, spawns}] main-process files that start processes
 * @param bootFile  the file holding the app quit path (index.ts)
 */
export function lifetimeWires({ spawners, bootFile, read, relOf, decomment, bodyOf }) {
  const text = decomment(read(bootFile));
  const boot = relOf(bootFile);

  // the reap surface: everything the quit path calls
  const shutdownBody = bodyOf(text, "shutdownBackgroundServices");
  const reapCalls = [];
  const call = /(?:([A-Za-z_$][\w$]*)\s*\.\s*)?([A-Za-z_$][\w$]*)\s*\(/g;
  let c;
  while ((c = call.exec(shutdownBody))) reapCalls.push({ ns: c[1] ?? null, fn: c[2] });

  const imports = importBindings(text);
  const bindingsFor = (path) => {
    for (const [spec, names] of imports) {
      const key = modKey(spec);
      if (path.endsWith(`/${key}.ts`) || path.endsWith(`/${key}.tsx`) || path.endsWith(`/${key}/index.ts`)) return names;
    }
    return new Set();
  };

  const wires = [];
  for (const s of spawners) {
    const names = bindingsFor(s.path);
    const hits = reapCalls.filter((r) => (r.ns && names.has(r.ns)) || names.has(r.fn));
    const conditional = hits.filter((h) => RE_CONDITIONAL.test(h.fn));
    const unconditional = hits.filter((h) => !RE_CONDITIONAL.test(h.fn));

    // A module can hold two resources with different fates. pty.ts reaps its
    // PTYs unconditionally (killAllAndWait) but the sidecar only when idle
    // (shutdownSidecarIfIdle) — reporting that as plain "reaped" would bury the
    // exact defect the close-app loop is meant to expose.
    const status = !hits.length ? "unreaped"
      : conditional.length && unconditional.length ? "partial"
      : conditional.length ? "conditional" : "reaped";
    wires.push({
      kind: "lifetime",
      module: s.path,
      spawns: s.spawns,
      status,
      reapedBy: hits.map((h) => (h.ns ? `${h.ns}.${h.fn}()` : `${h.fn}()`)),
      breakAt: status === "reaped" ? null : "quit",
      why:
        status === "reaped"
          ? `The quit path stops this unconditionally.`
          : status === "partial"
            ? `Stopped by ${unconditional.map((h) => h.fn).join(", ")}, but ${conditional.map((h) => h.fn).join(", ")} is conditional — that resource survives a close while busy.`
          : status === "conditional"
            ? `The quit path calls ${conditional.map((h) => h.fn).join(", ")} — the name states the condition, so a busy worker survives close.`
            : `This module starts ${s.spawns} process${s.spawns > 1 ? "es" : ""} and the quit path never stops it. A closed seat can outlive the app.`,
      hops: [
        { layer: "spawn", present: true, detail: `${s.path} · ${s.spawns} spawn site${s.spawns > 1 ? "s" : ""}` },
        { layer: "quit", present: status === "reaped" || status === "partial", detail: hits.length ? hits.map((h) => (h.ns ? `${h.ns}.${h.fn}()` : `${h.fn}()`)).join(", ") : `${boot} never stops it` },
      ],
    });
  }
  wires.sort((a, b) => {
    const r = { unreaped: 0, conditional: 1, partial: 2, reaped: 3 };
    return r[a.status] - r[b.status] || b.spawns - a.spawns;
  });
  return wires;
}
