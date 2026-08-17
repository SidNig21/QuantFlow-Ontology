// qf-atlas / coverage-matrix.mjs — per-analyzer coverage for every file.
//
// Contract section H: "No file may silently disappear." A file absent from a
// specific analysis cannot look green.
//
// The old coverage model answered ONE question — could the SQL indexer read this
// file — and answered it for 164 of 427 files, reporting the other 263 as
// `out-of-scope`. Everything else was invisible: nothing recorded whether a file's
// imports were resolved, whether its IPC was read, whether its process lifetime was
// examined, or whether anyone had asked who owns it. Silence looked identical to
// clean.
//
// STATES, and the difference between them is the entire point:
//   indexed         the analyzer read this file and resolved what it found
//   partial         read, but some facts could not be resolved — reason required
//   dynamic         the fact exists but is computed at runtime — reason required
//   unsupported     this analyzer cannot answer for this file — reason required
//   not-applicable  the question does not apply here (no SQL in a CSS-only module)
//
// `unsupported` and `partial` without a reason are a bug, not a state. The invariant
// is UNEXPLAINED UNDECIDED = 0, never UNKNOWN = 0 — forcing unknowns to zero would
// only buy fake certainty.

// reach BELONGS HERE. It was written into the same cell object but left out of this
// list, so `worst` was computed without it and 59 files reported `indexed` while their
// reachability had never been evaluated. A file absent from an analysis cannot look green.
const ANALYZERS = ["imports", "ipcRequest", "ipcPush", "persistence", "lifetime", "packaging", "ownership", "reach"];

/** Which analyzers even apply to a file, from its location in the tree. */
function applicability(path) {
  const main = path.startsWith("collab-electron/src/main/");
  const preload = path.startsWith("collab-electron/src/preload/");
  const renderer = path.startsWith("collab-electron/src/windows/")
    || path.startsWith("collab-electron/packages/");
  const kernel = path.startsWith("packages/qf-kernel/") || path.startsWith("tools/");
  const schema = path.startsWith("qf-kernel-schema/");
  const qa = path.startsWith("qa/");
  const species = path.startsWith("species/");
  const product = main || preload || renderer || kernel;
  return { main, preload, renderer, kernel, schema, qa, species, product };
}

/**
 * @param files    every scanned repo-relative path
 * @param astOf    path -> ast.mjs facts
 * @param reachOf  path -> reach verdict, or undefined when the file has no row
 * @param lifetimeOf path -> lifetime row
 * @param buildIncluded  path -> true when the build declares or bundles it
 */
export function coverageMatrix({ files, astOf, reachOf, lifetimeOf, buildIncluded, ownershipOf }) {
  const rows = files.map((path) => {
    const a = astOf.get(path);
    const app = applicability(path);
    const cell = {};
    const reasons = {};
    const set = (k, state, why) => { cell[k] = state; if (why) reasons[k] = why; };

    // ── imports ────────────────────────────────────────────────────────────
    if (!a) set("imports", "unsupported", "file was not handed to the parser");
    else if (a.coverage.imports !== "indexed")
      set("imports", a.coverage.imports, a.coverage.reason ?? "parser reported incomplete facts");
    else {
      const dyn = a.unresolved.filter((u) => /import/i.test(u.what));
      if (dyn.length) set("imports", "dynamic",
        `${dyn.length} import specifier(s) computed at runtime (line ${dyn.map((d) => d.line).join(", ")})`);
      else set("imports", "indexed");
    }
    // Reachability is a separate claim from parsing: a file can be parsed and still
    // have no reach verdict if it sits outside the product row scope.
    if (!reachOf.has(path))
      set("reach", "unsupported",
        app.qa || app.species || path.startsWith("collab-electron/cli/")
          || path.startsWith("collab-electron/scripts/") || app.schema
          ? "outside the product row scope: this tree is an import ANCHOR, so its own reachability is not evaluated"
          : "no reach row was produced for this path");
    else set("reach", "indexed");

    // ── IPC, both directions ───────────────────────────────────────────────
    const ipcApplies = app.main || app.preload || app.renderer;
    if (!ipcApplies) {
      set("ipcRequest", "not-applicable", "not a main, preload or renderer module");
      set("ipcPush", "not-applicable", "not a main, preload or renderer module");
    } else {
      const unresolvedIpc = (a?.unresolved ?? []).filter((u) => /channel/i.test(u.what));
      const state = unresolvedIpc.length ? "dynamic" : "indexed";
      const why = unresolvedIpc.length
        ? `${unresolvedIpc.length} channel name(s) built from a variable or template (line ${unresolvedIpc.map((u) => u.line).join(", ")})`
        : null;
      set("ipcRequest", state, why);
      // The push direction is a DIFFERENT measurement. This used to assign the identical
      // state and reason to both cells, so the model reported two dimensions and had made
      // one. A file with no push traffic is not "indexed" for push — it is not-applicable.
      const pushSites = (a?.ipc ?? []).filter((x) =>
        x.surface === "webContents" || (x.surface === "ipcRenderer" && (x.method === "on" || x.method === "once")));
      const pushDynamic = (a?.unresolved ?? []).filter((u) => /webContents|ipcRenderer.on/i.test(u.what));
      if (!pushSites.length && !pushDynamic.length)
        set("ipcPush", "not-applicable", "no webContents.send and no ipcRenderer.on in this file");
      else if (pushDynamic.length)
        set("ipcPush", "dynamic",
          `${pushDynamic.length} push channel name(s) built from a variable or template`);
      else set("ipcPush", "indexed");
    }

    // ── persistence / governance ───────────────────────────────────────────
    const sql = a?.sql ?? [];
    if (!sql.length) set("persistence", "not-applicable", "no SQL DML or DDL in this file");
    else {
      const orphan = sql.filter((s) => !s.enclosing);
      const interpolated = sql.filter((s) => s.interpolated);
      if (orphan.length)
        set("persistence", "partial",
          `${orphan.length} of ${sql.length} SQL site(s) are not inside a named function, so no call path can be traced`);
      else if (interpolated.length)
        set("persistence", "partial",
          `${interpolated.length} of ${sql.length} SQL site(s) are template literals; the table name may be computed`);
      else set("persistence", "indexed");
    }

    // ── lifetime ───────────────────────────────────────────────────────────
    const spawnsLive = (a?.spawns ?? []).filter((s) => s.longLived);
    if (!spawnsLive.length) set("lifetime", "not-applicable", "starts no long-lived child process");
    else if (lifetimeOf.has(path)) set("lifetime", "indexed");
    else set("lifetime", "partial",
      `${spawnsLive.length} long-lived spawn(s) found by the parser but no reap analysis was produced for this file`);

    // ── packaging ──────────────────────────────────────────────────────────
    if (buildIncluded.has(path)) set("packaging", "indexed");
    else if (app.qa || path.includes(".test.")) set("packaging", "not-applicable", "test or QA code does not ship");
    else set("packaging", "unsupported",
      "the build config does not name this file and packaging manifests are not yet parsed, so ship status is unproven");

    // ── ownership ──────────────────────────────────────────────────────────
    if (ownershipOf && ownershipOf.has(path)) set("ownership", "indexed");
    else if (!app.product) set("ownership", "not-applicable", "responsibility ownership is evaluated for product code only");
    else set("ownership", "unsupported",
      "no architectural responsibility is claimed for this file by the ownership policy");

    const states = ANALYZERS.map((k) => cell[k]).filter(Boolean);
    const worst = states.includes("unsupported") ? "unsupported"
      : states.includes("partial") ? "partial"
      : states.includes("dynamic") ? "dynamic"
      : states.every((s) => s === "not-applicable") ? "not-applicable"
      : "indexed";

    // Every non-clean cell must carry a reason. This assertion is the mechanism
    // behind "unexplained undecided = 0": it makes an unexplained gap impossible to
    // produce rather than merely discouraged.
    const unexplained = Object.entries(cell)
      .filter(([k, v]) => v !== "indexed" && v !== "not-applicable" && !reasons[k])
      .map(([k]) => k);

    return { path, worst, ...cell, reasons, unexplained };
  });

  const tally = {};
  for (const k of [...ANALYZERS, "reach"]) {
    tally[k] = {};
    for (const r of rows) if (r[k]) tally[k][r[k]] = (tally[k][r[k]] ?? 0) + 1;
  }
  const unexplained = rows.filter((r) => r.unexplained.length);

  return {
    rows, tally, analyzers: ANALYZERS,
    files: rows.length,
    unexplained: unexplained.map((r) => ({ path: r.path, cells: r.unexplained })),
  };
}
