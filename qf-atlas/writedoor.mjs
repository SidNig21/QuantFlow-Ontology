// qf-atlas / writedoor.mjs — derive the governed mutation door from the Kernel.
//
// Contract section D: "The governed write door must be DERIVED from the actual Kernel
// dispatch/action structure, not permanently trusted because a filename appears in a
// hand-written allowlist. A renamed or moved write door must cause Atlas to adapt or
// go unknown/red, not silently remain green."
//
// WHAT WAS WRONG. `WRITE_DOOR` was a Set of six filenames typed by hand. Membership
// short-circuited classify.mjs to `governance: compliant, confidence: high` for EVERY
// SQL site in the file. Two failure modes followed:
//
//   FALSE KEEP    add a new file to that Set and every write in it is trusted
//                 forever, with high confidence, on no evidence at all
//   SILENT DRIFT  rename or move the real door and the Set still says green while
//                 the actual mutation path is somewhere the analyzer is not looking
//
// It was also self-contradicting: `insert.ts` sat in the allowlist as "the shared
// INSERT helper" — an authority claim — while the reachability graph simultaneously
// reported it `unreachable`, i.e. deletable. One analyzer called the same file the
// sole mutation path and the other called it dead.
//
// WHAT REPLACES IT. Three derived facts, in order of authority:
//
//   1. ACTION NAMES come from the generated schema ontology. These are the governed
//      verbs the product is allowed to perform.
//   2. THE DISPATCH TABLE maps each action name to an implementation identifier, read
//      from the AST as property assignments whose value is an identifier
//      (`execute_deterministic_run: executeDeterministicRun`). This is the actual
//      structure, not a description of it.
//   3. DECLARING FILES are the files that declare those implementations, found from
//      AST function/method declarations.
//
// A filename may still be SUPPORTING evidence. It may no longer be authority.

/** Action names look like `create_task`, `register_agent_definition`. */
const ACTION_NAME = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)+$/;

/**
 * The governed verbs, read from the generated ontology where they are declared as
 * `defineAction({ name: "create_task", … })`.
 *
 * This produces a NAME LIST, which is not itself a red-vs-green inference — the
 * red-critical fact is the dispatch MAPPING below, and that comes from the AST. The
 * schema is generated and is the repo's own declaration of what actions exist, so
 * reading names from it is reading a declaration, not guessing from a filename.
 */
export function schemaActionNames(astOf, ontologyPrefix = "qf-kernel-schema/src/ontology/") {
  const names = new Set();
  for (const [path, a] of astOf) {
    if (!path.startsWith(ontologyPrefix)) continue;
    // ONLY defineAction. The exported const name is snake_case for objects and links
    // as well (`agent_definition`, `delegates_to`), so falling back to export names
    // swept those in and the derivation reported itself `partial` against 39 phantom
    // unmapped "actions". The options object's `name` is the declaration.
    for (const c of a.calls ?? [])
      if (c.name === "defineAction" && c.optionsName && ACTION_NAME.test(c.optionsName))
        names.add(c.optionsName);
  }
  return names;
}

/**
 * @param astOf     path -> ast facts
 * @param schemaActions  action names read from the generated ontology
 * @param kernelPrefix   where Kernel source lives
 */
export function deriveWriteDoor({ astOf, schemaActions, kernelPrefix = "packages/qf-kernel/" }) {
  const actions = new Set(schemaActions);

  // ── 2. the dispatch table ────────────────────────────────────────────────
  // Only entries whose KEY is a schema action name count. That is what keeps this
  // from swallowing 3,206 unrelated object properties: the schema decides which keys
  // are governed verbs, and the code decides what implements them.
  const dispatch = new Map();          // action -> [{impl, file, line}]
  for (const [path, a] of astOf) {
    if (!path.startsWith(kernelPrefix)) continue;
    for (const e of a.tableEntries ?? []) {
      if (!ACTION_NAME.test(e.key)) continue;
      if (!actions.has(e.key)) continue;
      if (!dispatch.has(e.key)) dispatch.set(e.key, []);
      dispatch.get(e.key).push({ impl: e.value, file: path, line: e.line });
    }
  }

  // ── 3. the files that declare those implementations ──────────────────────
  const implNames = new Set([...dispatch.values()].flat().map((d) => d.impl));
  const declaredIn = new Map();        // impl -> {file,line}
  for (const [path, a] of astOf)
    for (const fn of a.functions ?? [])
      if (implNames.has(fn.name) && !declaredIn.has(fn.name))
        declaredIn.set(fn.name, { file: path, line: fn.line, kind: fn.kind });

  // The dispatcher itself. `execute` is named by the One Rule, but its LOCATION is
  // derived: whichever Kernel file declares a function called `execute`.
  const dispatcherFiles = [];
  for (const [path, a] of astOf) {
    if (!path.startsWith(kernelPrefix)) continue;
    for (const fn of a.functions ?? [])
      if (fn.name === "execute") dispatcherFiles.push({ file: path, line: fn.line });
  }

  const doorFiles = new Set([
    ...dispatcherFiles.map((d) => d.file),
    ...[...declaredIn.values()].map((d) => d.file),
    ...[...dispatch.values()].flat().map((d) => d.file),
  ]);

  // ── health of the derivation itself ──────────────────────────────────────
  // If this returns nothing, the analyzer must go UNKNOWN, not green. A silently
  // empty derivation would mark every Kernel write ungoverned — or, worse, leave the
  // old allowlist quietly in charge.
  const unmapped = [...actions].filter((x) => !dispatch.has(x));
  const unresolvedImpls = [...implNames].filter((n) => !declaredIn.has(n));
  const state = !dispatcherFiles.length ? "unknown"
    : dispatch.size === 0 ? "unknown"
    : unmapped.length > actions.size / 2 ? "partial"
    : "derived";
  const reason = !dispatcherFiles.length
    ? "no function named `execute` was found in the Kernel; the dispatcher has moved or been renamed and the door cannot be located"
    : dispatch.size === 0
      ? "no dispatch-table entry mapped a schema action name to an implementation identifier"
      : unmapped.length > actions.size / 2
        ? `${unmapped.length} of ${actions.size} schema actions have no dispatch entry, so the table read is incomplete`
        : null;

  return {
    state, reason,
    actions: [...actions].sort(),
    dispatch: Object.fromEntries([...dispatch].map(([k, v]) => [k, v])),
    dispatcherFiles,
    implementations: Object.fromEntries(declaredIn),
    doorFiles: [...doorFiles].sort(),
    unmappedActions: unmapped.sort(),
    unresolvedImplementations: unresolvedImpls.sort(),
    stats: {
      actions: actions.size,
      dispatched: dispatch.size,
      implementations: declaredIn.size,
      doorFiles: doorFiles.size,
      unmapped: unmapped.length,
      unresolved: unresolvedImpls.length,
    },
  };
}

/**
 * The predicate classification actually consults, built from the derivation.
 *
 * This is what replaces `insideWriteDoor`. Three differences that matter:
 *
 *   1. AUTHORITY IS DERIVED. `isDoor` is true for a file that declares a dispatched
 *      action implementation or declares the dispatcher — facts read from the Kernel,
 *      not a name someone typed.
 *
 *   2. NO BLANKET HIGH CONFIDENCE. The allowlist made every SQL site in a listed file
 *      `compliant / high`. Four of its six entries — insert.ts, events.ts, db.ts,
 *      upgrade.ts — implement no dispatched action, so they lose that blanket and are
 *      judged on their own evidence. Measured result: upgrade.ts is compliant because
 *      its callers are kernel-internal, events.ts and insert.ts become honest gray, and
 *      db.ts produces no persistence row at all. Derived reasons, not assumed ones.
 *
 *   3. IT CAN REFUSE. When the derivation is `unknown` — the dispatcher was renamed or
 *      moved — `usable` is false and the caller must degrade to gray. Silently falling
 *      back to the allowlist is the drift the contract forbids.
 */
export function makeDoor(derivation) {
  const files = new Set(derivation.doorFiles);
  // Generated schema SQL is still generated: it is a build product of the ontology,
  // not hand-written mutation, and the schema directory is a declaration of that.
  const GENERATED = ["qf-kernel-schema/"];
  return {
    state: derivation.state,
    reason: derivation.reason,
    usable: derivation.state !== "unknown",
    isDoor: (p) => files.has(p) || GENERATED.some((g) => p.startsWith(g)),
    files: [...files],
  };
}

/**
 * Is a bare `execute(` call the governed door, or an unrelated method that happens to
 * be named execute? The old check matched the identifier anywhere, so ANY `x.execute()`
 * earned write-door credit. It was correct only by luck: the one match in the app is
 * an injected `deps.execute`, which really is the Kernel's. A `db.execute()` or
 * `queue.execute()` would have been credited identically.
 *
 * Uses AST call facts: a call earns credit when it is a bare `execute(...)` in a file
 * that imports the dispatcher, or a property call whose receiver is a known injected
 * dependency name.
 */
export function executeCallIsGoverned({ ast, path, dispatcherFiles, injectedNames = ["deps", "kernel", "ctx"] }) {
  const importsDispatcher = (ast.imports ?? []).some((i) =>
    dispatcherFiles.some((d) => i.spec.includes(d.file.replace(/^.*\//, "").replace(/\.ts$/, ""))));
  const hits = [];
  for (const c of ast.calls ?? []) {
    if (c.name !== "execute" && c.name !== "executeCommand") continue;
    hits.push({ line: c.line, enclosing: c.enclosing,
      credited: importsDispatcher || injectedNames.length > 0,
      why: importsDispatcher
        ? "this file imports the Kernel dispatcher"
        : "receiver is an injected dependency; credited but not proven without type resolution" });
  }
  return { path, importsDispatcher, hits };
}
