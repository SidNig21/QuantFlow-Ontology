# WO-D1 — Every Dock profile has a Kernel identity

status: open — current after WO-CI2
assignee: builder
depends: WO-CI2
blocks: WO-D2 · WO-N1
kind: Agent Plane identity repair

## Objective

Make each Dock Catalog profile a distinct Kernel `agent_definition` and make every
new `agent_session` link to the exact definition that created it, while allowing many profiles to
share one runtime package and preserving the founder's existing Kernel during the schema upgrade.

## In plain terms

Researcher and Critic may both run through Hermes, but the app must remember which agent you launched
instead of recording both as merely “Hermes.”

## Measured failure

Re-measured on merged main `a783ab9` before this order was cut:

- `agent_definition` calls itself a runtime species and contains only `name`, `role`,
  `package_ref`, and `system_prompt_ref`
  (`qf-kernel-schema/src/ontology/agent.ts`).
- `create_agent_session` has no definition ID; its description and
  `packages/qf-kernel/src/insert.ts` use the presentation `label` as the species identity.
- No link connects `agent_session` to `agent_definition`.
- The Dock already lists ordinary definitions from Kernel rows, while a second hardcoded
  `hermes-seats.ts` catalogue launches three labels through the single definition `hermes`.

The shared-runtime seam already exists: `package_ref` resolves the executable package, and the
existing `dock-registry` gate proves two definitions may reference one package. Do not add another
runtime registry in this order.

## Rulings

### R1 — definition means profile; package means runtime

One `agent_definition` row is one founder-visible Dock profile. Its `package_ref` identifies the
reusable runtime/adapter package, so several definitions may carry the same value.

Add one nullable non-empty string property named `runtime_profile`. Stored rows always contain
either `null` or a non-empty string. Registration input may omit it and omission normalizes to
`null`; an explicit empty or whitespace-only string is rejected. It is the profile selector
passed later to the runtime adapter (for example a Hermes profile name); it is not a path to a
profile home and must never contain credentials or configuration bytes. Keep `system_prompt_ref`
as a reference. Do not add `runtime_definition`, a second package registry, argv arrays, env maps,
or vendor-specific fields.

Descriptions must say “profile,” not “species,” and meet the repository description register.

### R2 — session identity is a required relationship

Add one link:

```text
spawned_from: agent_session → agent_definition
```

`create_agent_session` requires `agent_definition_id`. Through the sole `execute()` path it
must:

1. reject a missing or unknown definition before writing anything;
2. create the session and exactly one `spawned_from` link atomically;
3. keep `label` presentation-only;
4. emit the normal creation receipt without placing identity inside labels or JSON sidecars.

No direct SQL writer is permitted. If either row or link fails, there is no session, link, or event
residue.

`spawned_from` is system-owned for session creation. If the generic caller-supplied `links`
envelope contains a `spawned_from` link, reject the whole command before writing anything; never
append a second identity link or silently deduplicate caller input.

Every production `create_agent_session` caller must pass the exact definition ID it already
resolved for admission. This order may make only that input-propagation edit in `agent-host.ts` and
`host-native-tui.ts`; it must not change argv, environment, runtime routing, seat selection, or
launch behavior.

This invariant begins at the successful D1 upgrade. Preserve all pre-D1 session rows and events,
but do not fabricate profile identity from their presentation labels. The pre-D1 schema did not
store a governed definition ID, so this upgrade performs no historical identity backfill; those
legacy sessions remain visibly unlinked. Every session created after the upgrade must have exactly
one identity link.

### R3 — profile registration is operator-only

`register_agent_definition` controls executable package references and profile selectors. Mark the
action `operatorOnly`, so it remains available to the founder/application bootstrap path but is
absent from the generated agent-served MCP surface.

Today schema lint incorrectly treats `operatorOnly` as equivalent to an `.observed` event. Change
that invariant in one direction only: every observation-coupled action must be `operatorOnly`, but
a non-observation governance action may also be `operatorOnly`. Preserve the existing rejection
for `.observed` without `operatorOnly`; add a fixture proving a non-observation operator-only
action is accepted. Do not rename the registration event or introduce a general ACL system.

### R4 — upgrade the existing Kernel; do not require a reset

The generated fresh-database migration is not an upgrade mechanism: `attachKernel()` skips it for
every completed Kernel. D1 therefore owns one narrow, data-preserving upgrade from the exact
pre-D1 schema shipped at the verified WO-CI2 merge.

- Add one pure generator at
  `qf-kernel-schema/src/generate/upgrade-agent-profile-identity.ts` and commit its output as
  `qf-kernel-schema/golden/upgrades/0001-agent-profile-identity.sql`. `bun run generate` must own
  that output and its byte-for-byte regeneration test. Reuse/export the canonical current-table
  SQL emitter where a table must be rebuilt; do not hand-edit the artifact or copy a second table
  definition into Kernel code.
- A writable `attachKernel()` detects the exact pre-D1 structure, applies the upgrade atomically,
  and then runs the existing registry-drift enforcement. A current D1 database is a no-op.
- The upgrade adds nullable `agent_definition.runtime_profile`, rebuilds the `links` constraint to
  include `spawned_from`, and synchronizes the affected `schema_meta` rows from generated schema
  authority. It preserves every definition, session, link, event, ID, timestamp, and payload.
- Structural detection, not a mutable JSON sidecar or operator-data reset, selects the upgrade.
  Unknown or partially-upgraded shapes throw a typed `KernelUpgradeShapeError` before mutation. A
  readonly attach never attempts the upgrade; it warns and makes
  `getKernelDrift()` return `{ ok: false, upgrade_required: "agent-profile-identity" }` without
  writing.
- Historical sessions lacking exact durable definition evidence remain unlinked and are reported
  as legacy unknowns. Do not guess from a presentation label, create a fake definition, delete the
  rows, or rewrite their events.
- The finished Linux package must contain both `golden/migration.sql` and the D1 upgrade inside its
  shipped `qf-kernel-schema` package. Extend the existing package inspector with the already locked
  `@electron/asar@3.4.1`, promoted to a direct dev dependency so the import is declared; do not
  change its version, add another package, or add a second package command.

This is a single compatibility step, not a general migration framework. Do not add a service,
dependency, schema-version truth store, or destructive recreate path.

## Deliverables

### D1 — schema and generated authority

Update the Agent Plane schema, action input, link, descriptions, tests, and regenerated `golden/`
artifacts. Generated output is produced only by `bun run generate`.

### D2 — atomic Kernel creation

Update the creation handler behind `execute()` to validate the definition and commit the session,
`spawned_from` link, and event in one transaction. Remove the label-as-species workaround from
live insert helpers and tests. Propagate `agent_definition_id` through every production session
creation caller without changing how that caller launches the runtime.

### D3 — existing-Kernel compatibility

Add the generated, byte-stable D1 upgrade and integrate it at the `attachKernel()` choke point.
Build a frozen pre-D1 fixture from the verified WO-CI2 schema shape, seed it with definitions,
sessions, every existing link kind, events, and one deliberately unresolvable legacy session, then
prove writable upgrade preserves those rows byte-for-byte except for the ruled schema/meta
additions. Prove a second attach is a no-op, readonly detection performs no writes, and an unknown
partial shape fails closed with the database file unchanged. Extend `package-closure` to require
both generated SQL artifacts in the finished app; its copied-package control removes only the D1
upgrade and must fail naming that missing artifact.

### D4 — `dock-profile-identity` gate

Add one root QA gate and wire it into `qa/run.ts`. In a temporary Kernel it must:

- register two definitions with different names and `runtime_profile` values but the same real
  credential-free qf-toolloop package reference;
- create one session from each and prove each session has exactly one link to the correct definition;
- prove presentation labels can be identical without collapsing identity;
- prove an unknown definition leaves session, link, and event counts unchanged;
- prove omitted `runtime_profile` stores `null`, while empty/whitespace input rejects with no row;
- prove a caller-supplied `spawned_from` link rejects with no session, link, or event residue;
- install a temporary SQLite trigger that aborts the production `spawned_from` insert, then prove
  `execute()` rolls back the session, identity link, and creation event together;
- upgrade the frozen pre-D1 fixture and prove all old rows survive, the old link kinds still write,
  and a new post-upgrade session receives exactly one correct `spawned_from` link;
- report the preserved unlinked legacy-session count rather than silently claiming it was mapped;
- derive its definition/session/link expectations from the schema rather than duplicating SQL table
  names in a second oracle;
- prove `qf_register_agent_definition` is generated but absent from the served agent action list.
- statically enumerate every production `create_agent_session` callsite and require the
  `agent_definition_id` field; then run the existing `agent-path` gate, updated to supply a real
  definition ID, as the Kernel lifecycle proof that a session still starts and closes.

Falsify the gate by suppressing the `spawned_from` write in the production creation path, observe a
non-zero gate exit naming the missing relationship, restore it, then observe green.

Falsify the production-callsite coupling by removing `agent_definition_id` from one real admission
callsite and observe `dock-profile-identity` red. Restore it, then observe both
`dock-profile-identity` and the independent `agent-path` lifecycle gate green. Do not claim that
`agent-path` imports the production Electron caller: it is a headless Kernel-path mirror.

Falsify upgrade coupling by disabling the D1 upgrade call inside writable `attachKernel()`, observe
the frozen pre-D1 compatibility control red, restore it, then observe upgrade plus second-attach
idempotence green.

## Acceptance

### Builder

```bash
cd qf-kernel-schema && bun test && bun run generate
cd ../packages/qf-kernel && bun test
cd ../.. && bun qa/run.ts dock-profile-identity
bun qa/run.ts agent-path
bun qa/run.ts repo-shape
bun qa/run.ts lockfile-committed
bun qa/run.ts kernel-sole-writer
bun qa/run.ts kernel-sole-writer-app
bun qa/run.ts no-canvas-domain-writes
bun qa/run.ts doc-action-surface
bun qa/run.ts one-skin
```

The builder supplies all three ruled red→green bait transcripts and the forced link-writer rollback
control, then stops. It does not run the cold release verifier or merge.

### Verifier

From a new detached worktree containing no inherited dependencies or build output:

```bash
bun qa/verify-release.ts
```

The verifier independently repeats the unknown-definition and caller-supplied-link no-residue
controls, the forced link-writer rollback control, the frozen pre-D1 upgrade/idempotence proof, and
all three baits before deciding PASS or REWORK. It also runs the missing-upgrade copied-package
control against the real unsigned Linux artifact before accepting the release proof.

## Out of scope

- Removing `hermes-seats.ts`, `qf:seats:*`, or the Peer Seats Dock section (WO-D2)
- A general-purpose migration runner or schema-version store beyond the one generated D1
  compatibility step
- Runtime launch templates, argv/env overrides, live Hermes turns, or additional CLI adapters
  (WO-D2); only the ruled definition-ID propagation through existing callers is allowed here
- Per-profile QuantFlow action grants or caller identity (before unscripted WO-109)
- Peer-bus delivery-cache repair, task/delegation semantics, Bovada ingest, product rename, MCP
  migration, browser tiles, RL, credentials, betting, or trading
- Any dependency addition except declaring the already locked `@electron/asar@3.4.1` inspection
  utility directly as ruled in R4

## Report back

1. One plain-language sentence.
2. Exact schema and generated-surface changes.
3. Two shared-runtime profiles and their exact session→definition links.
4. Unknown-definition counts before/after.
5. Operator-only served-surface evidence.
6. Existing-Kernel upgrade row counts/hashes, readonly/partial-shape results, and second-attach proof.
7. Missing-link, real link-writer rollback, production-callsite, and upgrade-coupling transcripts
   with exit statuses.
8. Static-gate results.
9. Judgment: every place the order was silent and what was chosen.
