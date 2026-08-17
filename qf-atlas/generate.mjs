// qf-atlas / generate.mjs
//
//   bun qf-atlas/generate.mjs            regenerate atlas.json + atlas.html
//   bun qf-atlas/generate.mjs --check    fail if the committed map is stale
//
// The map is a generated projection of the code, in the same spirit as
// qf-kernel-schema/golden/. Nobody hand-edits atlas.html. If the code moves and
// the map does not, --check goes red.

import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { walk, fileFacts, extractWires, stripCandidates, violations, gitMeta, REPO, rel, read } from "./extract.mjs";
import { addFourthHop, decomment, bodyOf } from "./hop4.mjs";
import { lifetimeWires } from "./lifetime.mjs";
import { buildLoops } from "./loops.mjs";

const OUT = join(REPO, "qf-atlas");

// ─── which files belong to which floor ───────────────────────────────────────
const LAYERS = [
  { id: 5, name: "QA · governance",            y: 0, roots: ["qa/"] },
  { id: 4, name: "Renderer · surfaces",        y: 1, roots: ["collab-electron/src/windows/", "collab-electron/packages/", "collab-electron/src/preload/"] },
  { id: 3, name: "Species · runtimes",         y: 2, roots: ["species/"] },
  { id: 2, name: "Main process",               y: 3, roots: ["collab-electron/src/main/", "collab-electron/cli/", "collab-electron/scripts/"] },
  { id: 1, name: "Schema · generated contract", y: 4, roots: ["qf-kernel-schema/"] },
  { id: 0, name: "Kernel truth",               y: 5, roots: ["packages/qf-kernel/", "tools/"] },
];
const layerOf = (p) => LAYERS.find((l) => l.roots.some((r) => p.startsWith(r)))?.id ?? null;

/** Family key: files that share a directory and a name prefix are one subsystem.
 *  This is what absorbs newly added files without anyone editing the map. */
function familyOf(path) {
  const parts = path.split("/");
  const file = parts.pop().replace(/\.(ts|tsx|js|jsx|mjs|cjs)$/, "");
  const dir = parts.join("/");
  const nested = dir.match(/\/(sidecar|updater|shell|generate|ontology|gates)$/);
  if (nested) return { dir, key: `${dir}`, label: `${nested[1]}/` };
  const stem = file.split("-")[0];
  return { dir, key: `${dir}::${stem}`, label: stem };
}

const files = walk(REPO).map((f) => rel(f)).filter((f) => layerOf(f) !== null);
const facts = fileFacts(files.map((f) => join(REPO, f)));
const factOf = new Map(facts.map((f) => [f.path, f]));

const mainFiles     = files.filter((f) => f.startsWith("collab-electron/src/main/")).map((f) => join(REPO, f));
const preloadFiles  = files.filter((f) => f.startsWith("collab-electron/src/preload/")).map((f) => join(REPO, f));
const rendererFiles = files.filter((f) => f.startsWith("collab-electron/src/windows/") || f.startsWith("collab-electron/packages/")).map((f) => join(REPO, f));

const { wires, bridges, bridgeMethodCount, usedMethodCount } = extractWires(mainFiles, preloadFiles, rendererFiles);
// hop 4 — main -> Kernel. Runs before strip/status so "cheats" is visible everywhere.
const indexFiles = files
  .filter((f) => f.startsWith("collab-electron/src/main/") || f.startsWith("packages/qf-kernel/") || f.startsWith("tools/"))
  .map((f) => join(REPO, f));
const hop4Stats = addFourthHop(wires, mainFiles, indexFiles, read, rel);

// Lifetime wires: spawn -> reap. Close-kill can never look like a missing invoke.
const spawners = facts
  .filter((f) => f.path.startsWith("collab-electron/src/main/") && f.spawnsLive > 0)
  .map((f) => ({ path: f.path, spawns: f.spawnsLive }));
const lifetime = lifetimeWires({
  spawners,
  bootFile: join(REPO, "collab-electron/src/main/index.ts"),
  read, relOf: rel, decomment, bodyOf,
});
const strip = stripCandidates(wires, facts);
const breaches = violations(facts);

// ─── build nodes ─────────────────────────────────────────────────────────────
const groups = new Map();
for (const path of files) {
  const L = layerOf(path);
  const { key, label } = familyOf(path);
  const id = `${L}:${key}`;
  if (!groups.has(id)) groups.set(id, { id, layer: L, label, files: [] });
  groups.get(id).files.push(factOf.get(path));
}

// A family that is one small file is noise on the map; fold it into the floor's
// residue node so it is still counted and still clickable.
const nodes = [];
const residue = new Map();
for (const g of groups.values()) {
  const kb = g.files.reduce((s, f) => s + f.kb, 0);
  if (g.files.length === 1 && kb < 7) {
    if (!residue.has(g.layer)) residue.set(g.layer, { id: `${g.layer}:residue`, layer: g.layer, label: "small modules", files: [] });
    residue.get(g.layer).files.push(...g.files);
  } else nodes.push(g);
}
for (const r of residue.values()) if (r.files.length) { r.label = `${r.files.length} small modules`; nodes.push(r); }

for (const n of nodes) {
  n.kb      = +n.files.reduce((s, f) => s + f.kb, 0).toFixed(1);
  n.spawns  = n.files.reduce((s, f) => s + f.spawns, 0);
  n.writes  = n.files.reduce((s, f) => s + f.writes, 0);
  n.dml     = n.files.reduce((s, f) => s + f.dml, 0);
  n.executes= n.files.reduce((s, f) => s + f.executes, 0);
  n.name    = n.label.endsWith("/") ? n.label : `${n.label}*`;
  if (n.files.length === 1) {
    // `qa/gates/<name>/run.ts` ×5 all rendered as "run.ts"; an ambiguous label
    // makes the map useless for pointing at a thing. Qualify generic basenames.
    const seg = n.files[0].path.split("/");
    const base = seg.pop();
    n.name = /^(run|index|entry|main|mod)\.\w+$/.test(base) ? `${seg.pop()}/${base}` : base;
  }
  n.files.sort((a, b) => b.kb - a.kb);
}

// Names must be unique or the map cannot be used to point at a thing. Qualify
// collisions with as much of the directory path as it takes to separate them.
for (let depth = 1; depth <= 4; depth++) {
  const seen = new Map();
  for (const n of nodes) (seen.get(n.name) ?? seen.set(n.name, []).get(n.name)).push(n);
  const clashes = [...seen.values()].filter((g) => g.length > 1);
  if (!clashes.length) break;
  for (const group of clashes)
    for (const n of group) {
      const dir = n.files[0].path.split("/").slice(0, -1);
      const q = dir.slice(-depth).join("/");
      n.name = `${q}/${n.name.split("/").pop()}`;
    }
}

// which node owns a given file — used to anchor wires to blocks
const nodeOfFile = new Map();
for (const n of nodes) for (const f of n.files) nodeOfFile.set(f.path, n.id);

// attach strip candidates + wires to their node
for (const n of nodes) { n.strip = []; n.wires = []; n.breaches = []; }
const byId = new Map(nodes.map((n) => [n.id, n]));
for (const s of strip) {
  const path = s.where.split(":")[0];
  const nid = nodeOfFile.get(path);
  if (nid) byId.get(nid).strip.push(s);
}
for (const b of breaches) {
  const nid = nodeOfFile.get(b.where);
  if (nid) byId.get(nid).breaches.push(b);
}
for (const w of wires) {
  const anchor = w.registeredAt?.file ?? w.calledAt?.file;
  const nid = anchor ? nodeOfFile.get(anchor) : null;
  if (nid) byId.get(nid).wires.push(w.channel);
}

// node status is derived, never assigned by hand
for (const n of nodes) {
  const broken = n.breaches.some((b) => b.scope === "product") || n.strip.some((s) => s.kind === "dead-wire");
  const stale  = n.strip.length > 0;
  n.status = broken ? "alert" : stale ? "warn" : n.executes > 0 ? "ice" : "ok";
}

// ─── layout: concentric rings per floor, biggest at the centre. deterministic.
// Ring capacity follows circumference, so a floor with 40 subsystems spreads out
// instead of piling into one unreadable knot. Each floor reports its own extent
// so the drawn plane always contains its blocks.
const SPACING = 1.32;
const layerExtent = {};
for (const L of LAYERS) {
  const mine = nodes.filter((n) => n.layer === L.id).sort((a, b) => b.kb - a.kb);
  let i = 0, ring = 0, maxR = 0;
  while (i < mine.length) {
    if (ring === 0) { mine[i].x = 0; mine[i].z = 0; i++; ring = 1; continue; }
    const radius = ring * SPACING;
    const capacity = Math.max(1, Math.floor((2 * Math.PI * radius) / SPACING));
    const take = Math.min(capacity, mine.length - i);
    for (let k = 0; k < take; k++, i++) {
      const a = (k / take) * Math.PI * 2 + ring * 0.7;
      mine[i].x = +(Math.cos(a) * radius).toFixed(2);
      mine[i].z = +(Math.sin(a) * radius).toFixed(2);
    }
    maxR = radius;
    ring++;
  }
  layerExtent[L.id] = +(maxR + 1.1).toFixed(2);
}

const loops = buildLoops(wires, lifetime);

// ─── model ───────────────────────────────────────────────────────────────────
const counts = {
  live:      wires.filter((w) => w.status === "live").length,
  unreached: wires.filter((w) => w.status === "unreached").length,
  unused:    wires.filter((w) => w.status === "unused").length,
  dead:      wires.filter((w) => w.status === "dead").length,
};
const model = {
  meta: {
    ...gitMeta(),
    generatedAt: new Date().toISOString().slice(0, 10),
    filesScanned: files.length,
    note: "Generated projection of the code. Not Kernel truth, not the running app.",
  },
  stats: {
    ...counts,
    channels: wires.length,
    bridges, bridgeMethods: bridgeMethodCount, bridgeMethodsUsed: usedMethodCount,
    stripCandidates: strip.length,
    violations: breaches.filter((b) => b.scope === "product").length,
    violationsQa: breaches.filter((b) => b.scope === "qa").length,
    nodes: nodes.length,
    loopsBroken: loops.filter((l) => l.health !== "ok").length,
    loopsTotal: loops.length,
    unreaped: lifetime.filter((l) => l.status === "unreaped").length,
    conditionalReap: lifetime.filter((l) => l.status === "conditional").length,
  },
  layers: LAYERS.map(({ id, name, y }) => ({ id, name, y, extent: layerExtent[id] })),
  nodes: nodes.map((n) => ({
    id: n.id, layer: n.layer, name: n.name, kb: n.kb, x: n.x, z: n.z, status: n.status,
    spawns: n.spawns, writes: n.writes, dml: n.dml, executes: n.executes,
    files: n.files, strip: n.strip, breaches: n.breaches, wires: n.wires,
  })),
  loops,
  wires,
  lifetime,
  strip,
  violations: breaches,
};

// Staleness must track the CODE, not the commit. The map records the commit it
// was generated from, so comparing raw text would report stale immediately after
// every commit — including the commit that adds the map. The fingerprint covers
// the substantive model only, with volatile identity fields excluded.
const { commit: _c, generatedAt: _g, branch: _b, ...stableMeta } = model.meta;
const fingerprint = createHash("sha256")
  .update(JSON.stringify({ ...model, meta: stableMeta }))
  .digest("hex")
  .slice(0, 16);
model.meta.fingerprint = fingerprint;

mkdirSync(OUT, { recursive: true });
const json = JSON.stringify(model, null, 2);
const { renderHtml } = await import("./render.mjs");
const { renderMarkdown } = await import("./markdown.mjs");
const html = renderHtml(model);
const md = renderMarkdown(model);

if (process.argv.includes("--check")) {
  const p = join(OUT, "atlas.json");
  const committed = existsSync(p) ? JSON.parse(readFileSync(p, "utf8")).meta?.fingerprint : null;
  const stale = committed !== fingerprint
    ? [`atlas.json fingerprint ${committed ?? "missing"} != ${fingerprint}`] : [];
  if (stale.length) {
    console.error(`qf-atlas: STALE — ${stale.join(", ")}`);
    console.error("The map is a projection. Run: bun qf-atlas/generate.mjs");
    process.exit(1);
  }
  console.log(`qf-atlas: current — ${files.length} files, ${wires.length} channels, ${strip.length} strip candidates`);
  process.exit(0);
}

writeFileSync(join(OUT, "atlas.json"), json);
writeFileSync(join(OUT, "atlas.html"), html);
writeFileSync(join(OUT, "ATLAS.md"), md);
console.log(`qf-atlas: wrote atlas.json + atlas.html + ATLAS.md`);
console.log(`  ${files.length} files · ${nodes.length} subsystems · ${wires.length} IPC channels`);
console.log(`  wires: ${counts.live} live · ${counts.unreached} unreached · ${counts.unused} unused · ${counts.dead} DEAD`);
console.log(`  loops: ${loops.filter(l=>l.health==="ok").length}/${loops.length} healthy · ${loops.filter(l=>l.health!=="ok").map(l=>l.name).join(", ")}`);
console.log(`  ${strip.length} strip candidates · ${breaches.filter(b=>b.scope==="product").length} product write-door violations (+${breaches.filter(b=>b.scope==="qa").length} qa)`);
