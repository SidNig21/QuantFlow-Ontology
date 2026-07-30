# WO-D2 — one Dock Catalog, one definition-driven launch path

**Status:** open — current after WO-D1 PASS  
**Depends on:** WO-D1 independently verified at `4617e06`  
**Builder:** Cursor CLI Composer 2.5, isolated worktree  
**Verifier:** independent cold worktree; never the builder

## Plain-language objective

Every agent button in the Dock must launch the exact profile it shows, through its packaged CLI
adapter, without a second hidden Hermes menu or a leaked child process.

## Measured starting state

Remeasured at WO-D1 candidate `4617e06`:

- The ordinary Dock already lists `agent_definition` rows, but sends `row.name` through
  `qf:sessions:spawn` (`collab-electron/src/windows/shell/src/dock.js:35-65`).
- A second Peer Seats catalogue still owns three Hermes profiles and argv arrays in
  `collab-electron/src/main/hermes-seats.ts`. Separate `qf:seats:list|spawn` IPC, preload methods,
  HTML, and renderer code bypass the ordinary Dock path.
- That bypass always admits definition `hermes` while separately overriding argv, so Orchestrator
  and Worker sessions both link to `hermes` rather than the profile the founder clicked
  (`collab-electron/src/main/ipc-kernel.ts:225-296`).
- WO-D1's `runtime_profile` has no production reader. Hermes adapter metadata contains only base
  `argv:["--tui"]`; the hidden seat table supplies `-p <profile>`.
- Boot registers only `qf-toolloop`. The shipped package contains Hermes package, metadata, launch,
  and allowlist bytes but no packaged profile defaults.
- Host runtime configuration is looked up by definition id. Multiple profile definitions would
  therefore miss the shared `speciesEnv.hermes` / adapter configuration.
- The legacy seat handler is also the sole caller of `registerSeatPty()` and
  `startPeerDelivery()`. Deleting it without moving that coupling would silently remove the only
  live peer-message projection.
- Native-TUI, host-ACP, and AgentOS admission all spawn before Kernel creation/start. A Kernel
  failure can currently leave a child or live-map entry behind.

These are measured defects and unfinished seams. D2 does not redesign the peer bus, grant tools,
or add another agent framework.

## Rulings

### R1 — three identities stay separate

Carry these names explicitly through the launch path:

- `definitionId`: Kernel `agent_definition.id`; the Dock button and `spawned_from` authority.
- `adapterId`: packaged runtime identity, read from package metadata (for example `hermes`). It owns
  binary/config/launch/allowlist resolution and is never inferred from a display label.
- `runtimeProfile`: nullable selector from the chosen Kernel row (for example `qf-worker`). It
  selects behavior inside the adapter and is never a path, env map, or credential source.

Do not keep calling all three `species`. The renderer supplies only `definitionId`; it may not
supply package refs, selectors, argv, env, adapter ids, roles, or labels.

Both shipped adapters must have explicit sibling metadata: Hermes (`name:"hermes"`, native TUI)
and qf-toolloop (`name:"qf-toolloop"`, AgentOS). Stage and inspect both metadata files. There is no
definition-id fallback in D2: missing or mismatched adapter metadata fails closed before process
start.

### R2 — profile selection is package-owned data

Extend the existing launch/packed metadata contract with:

```json
{
  "route": "native_tui",
  "name": "hermes",
  "argv": ["--tui"],
  "profile_argv": ["-p", "{runtime_profile}", "--tui"],
  "peer_delivery": {
    "mode": "pty_role",
    "runtime_profiles": ["qf-orchestrator", "qf-worker", "qf-worker-2"]
  }
}
```

`profile_argv` is an argv token array, never a shell string. It must contain exactly one complete
token equal to `{runtime_profile}`. No substring expansion, shell interpolation, repeated token,
empty token, or unknown placeholder is allowed. Null selector uses `argv`; non-null selector
requires and expands `profile_argv`. The generic host must not know Hermes's `-p` convention.

Resolve shared host adapter configuration from `adapterId`, not from each definition id. The exact
definition id still owns the Kernel session and label.

### R3 — packaged defaults initialize the Kernel; they are not a second registry

The exact source and shipped manifest paths are `species/hermes/dock-profiles.json` and
`tools/runtime-proof/dock-profiles.json`. Generic discovery accepts exactly
`{species,tools}/<one-directory>/dock-profiles.json`. Every manifest has this closed schema; unknown
keys at every level reject:

```json
{
  "schema_version": 1,
  "adapter": { "id": "hermes", "package": "packed/hermes.aospkg" },
  "profiles": [
    {
      "id": "hermes-orchestrator",
      "role": "orchestrator",
      "runtime_profile": "qf-orchestrator",
      "system_prompt_ref": null
    }
  ]
}
```

`schema_version` is exactly integer `1`. `adapter.id`, profile `id`, and `role` are trimmed non-empty
strings. `runtime_profile` and `system_prompt_ref` are either null or trimmed non-empty strings.
`profiles` is non-empty with unique ids. `adapter.package` is one normalized POSIX relative path:
no absolute path, empty/dot/dot-dot segment, backslash, glob, or URI. It resolves under the
manifest's adapter directory and must exist. The stored `package_ref` is derived as
`<species|tools>/<adapter-directory>/<adapter.package>` relative to app root; neither manifests nor
profiles may author a full `package_ref`.

Manifest `adapter.id` must equal sibling packed metadata `name`; the metadata and package must
exist. Qf-toolloop therefore gains explicit committed/packed metadata declaring
`name:"qf-toolloop"` and the AgentOS route, rather than relying on definition-id equality. Source
manifests and metadata inputs are staged into the real package and byte-compared by inspection.
Bootstrap registers missing definitions only through operator-only
`execute("register_agent_definition")`.

After bootstrap, Dock/list/launch code reads only Kernel rows. It must not consult, merge, or cache
the manifest. Existing same-id Kernel rows are never overwritten. An identical row is an idempotent
skip; a differing row is preserved and reported as a bootstrap conflict. A second boot produces no
new definition rows or registration events. Malformed manifests and packaged manifests whose
package or metadata bytes are missing fail loudly before the Dock claims readiness.

This is default input, like a package manifest, not durable truth. Do not add a bootstrap version
table, sidecar state, update action, delete action, or migration framework.

The exact initial default rows are:

| id/name | role | package_ref | runtime_profile | system_prompt_ref |
|---|---|---|---|---|
| `qf-toolloop` | `toolloop-proof` | `tools/runtime-proof/packed/qf-toolloop.aospkg` | `null` | `null` |
| `hermes-orchestrator` | `orchestrator` | `species/hermes/packed/hermes.aospkg` | `qf-orchestrator` | `null` |
| `hermes-worker` | `worker` | `species/hermes/packed/hermes.aospkg` | `qf-worker` | `null` |
| `hermes-worker-2` | `worker2` | `species/hermes/packed/hermes.aospkg` | `qf-worker-2` | `null` |

The definition name is also the v1 session label and Dock text; D2 does not add `display_name`.
Preserve all existing definitions, including a historical generic `hermes` row. Do not delete,
rewrite, hide, or guess upgrades for operator data.

### R4 — one Dock path must preserve live delivery

Delete the second catalogue, but preserve live delivery through a package-owned opt-in. Adapter
metadata may omit `peer_delivery` or declare exactly the object shown in R2: mode `pty_role` plus a
non-empty unique array of trimmed runtime-profile selectors. Only an opted-in native-TUI adapter
whose selected non-null `runtime_profile` appears in that array registers a PTY, interpreting the
selected Kernel definition's `role` as the peer role configured inside that runtime profile. Start
the existing delivery watcher idempotently. Qf-toolloop omits it. Historical generic Hermes with a
null selector still launches `hermes --tui` but never binds a peer role.

Preflight duplicate-role availability before starting a process. `registerSeatPty` must also reject
a second live PTY for an already-bound role instead of silently overwriting its destination. A race
or late rejection is a launch failure and uses R5 cleanup. PTY exit, cancel, and compensated failure
remove only the binding owned by that PTY. The gate proves an unflagged adapter and a flagged adapter
with a null/unlisted selector never register, and a duplicate role cannot reroute messages.

Do not infer from labels, make every native TUI peer-eligible, add a peer-role schema field, change
peer-bus storage/semantics, edit profile homes, or claim grants are enforced. The gate uses an
opted-in fake adapter and fake transport input, never the founder's transport database.

### R5 — touched launch paths clean up honestly

The new definition-driven native-TUI path must compensate around Kernel failure:

- If `create_agent_session` fails after the PTY starts, terminate the PTY and remove live/PTY
  mappings; no session, link, or event may exist.
- If `start_agent_session` fails after creation, terminate the PTY and record the durable session
  through `fail_agent_session` then `close_agent_session`; do not erase the creation receipt.
- Cleanup failure must be reported with the original failure, not swallowed as success.

Make the production native-TUI orchestration accept one dependency object with shipped defaults
for Kernel dispatch, PTY create/terminate, live-map set/delete, PTY-to-Kernel mapping set/delete,
and peer-role register/unregister. Production admission passes or defaults to the real
implementations; the gate passes faulting/capturing implementations to the same exported
orchestrator. Do not copy the orchestration into QA. Removing a production cleanup call must leave
an observed child or map entry and turn the gate red.

If any peer-role binding was created before a later failure, compensation unregisters exactly that
PTY's binding. After each injected create/start failure, immediately relaunch the same role and
require success; this is the stale-binding control, not merely a map-size assertion.

Remeasure the equivalent existing host-ACP and AgentOS orphan seams and record them in the report.
Fix them in D2 only if the implementation factors a genuinely shared compensation helper without
changing their launch semantics; otherwise route one immediate D2b order. A green D2 may not
overclaim those untouched paths.

## Deliverables

### D1 — definition-driven production contract

- Rename renderer/preload/IPC/admission launch input to `definitionId`; Dock sends `row.id`.
- Resolve the definition once, validate its package, adapter id, selector, launch mode, surface,
  allowlist, and host config through shared production modules.
- Carry the exact definition id to `create_agent_session` and the session label.
- AgentOS uses the packaged adapter id for `createSession`, not a differing profile id. Host ACP
  and native TUI resolve binary/config through adapter id.
- Deduplicate AgentOS software admission by normalized package path and adapter id. Four default
  definitions containing three shared Hermes refs must not pass duplicate software entries to
  `AgentOs.create` or repeat `linkSoftware`. Exercise startup resolution with all four defaults.
- Reject unknown definition ids and every renderer attempt to supply argv/env/package/adapter/
  selector/role/label before a process starts.

### D2 — adapter profile contract and packaged bootstrap

- Add strict parsing/expansion for `profile_argv` to the existing shared launch metadata module.
- Update Hermes committed launch metadata and pack output; do not create a Hermes-only host map.
- Add the exact closed-schema package-owned defaults for qf-toolloop and the three ruled Hermes
  profiles, plus explicit qf-toolloop adapter metadata.
- Replace `seedBootSpecies()` with one idempotent packaged-default bootstrap through `execute()`.
- Stage and inspect the manifest and profile-aware metadata in the real Linux package. Inspection
  byte-compares committed/generated source where applicable and fails when either is missing.

### D3 — remove the bypass, preserve collaboration

Delete:

- `collab-electron/src/main/hermes-seats.ts`;
- `qf:seats:list` and `qf:seats:spawn`;
- preload `listSeats` / `spawnSeat`;
- Peer Seats HTML, renderer branch, and obsolete seat-argv smoke.

Move `registerSeatPty` / `startPeerDelivery` to the opted-in generic native-TUI success path using
the resolved definition's ruled role; reject duplicate live roles. Keep `qf:a2a:*` harness IPC and
the peer-bus package otherwise unchanged.

### D4 — failure compensation

Implement and test R5 through the one injectable production orchestration boundary ruled above.
No copied QA orchestrator, raw SQL, process-name killing, broad PID scans, or deletion of operator
data.

### D5 — `dock-definition-launch` gate

Add one cold-safe root gate using production bootstrap, definition resolution, adapter expansion,
admission, cleanup, and Kernel reads. It must:

1. Bootstrap the exact four rows from package-owned manifests; bootstrap again with row/event
   counts unchanged.
2. Pre-seed one differing same-id row and prove bootstrap preserves it and reports a conflict.
3. Prove two definitions share the same Hermes package/adapter but expand distinct selectors.
4. Launch Orchestrator and Worker through a credential-free executable in a temporary HOME, with
   no real Hermes config, network, model, prompt, or credentials.
5. Capture exact argv (`-p qf-orchestrator --tui` / `-p qf-worker --tui`) and prove each session has
   exactly one `spawned_from` link to the selected definition.
6. Prove only a metadata-authorized non-null runtime profile registers the resolved role; unflagged,
   null, and unlisted profiles never bind; duplicate live roles reject without rerouting; and no
   founder transport DB is opened.
7. Prove unknown definitions and renderer override attempts create no process/session/link/event.
8. Inject create failure and start failure and prove the two R5 outcomes, including no surviving
   child/live/PTY/peer-role mapping, then relaunch the same role successfully after each failure.
9. AST/static-scan production renderer and IPC: Dock uses `row.id`; no `qf:seats`, `hermes-seats`,
   `dock-seats`, `listSeats`, or `spawnSeat` surface survives.
10. Exercise full startup resolution with all four defaults and prove shared packages/adapters are
    admitted once. Prove strict manifest path/unknown-key/traversal rejection and source metadata
    agreement. Real packaged-resource inventory belongs to verifier package closure below.

Use a temp fake executable that is actually spawned and reports argv/PID; do not replace production
resolution with a copied helper. The gate injects only the ruled production orchestration dependency
object and calls that exported production function directly.

### D6 — current documentation

Update the root `README.md`, `docs/demos/dock.md`, and Hermes/peer-bus docs where they currently
describe Peer Seats, species-name launch, old setup paths, or live delivery. State exactly what D2
proves and what still waits for grants/unscripted collaboration. Do not edit doctrine.

## Required falsification

The builder supplies four red → restore → green transcripts:

1. Ignore or remove `runtime_profile` expansion in the production adapter path: gate red on exact
   captured argv, then green.
2. Change the real Dock launch value from `row.id` to `row.name`: gate red naming file/line, then
   green. (`id = name` today, so a runtime equality assertion is not a valid bait.)
3. Restore one real `qf:seats:*` handler or Peer Seats element: sole-launch scan red, then green.
4. Disable native-TUI compensation after injected Kernel failure: gate red on the surviving
   child/live mapping, then green.

The verifier independently repeats all four. Canonical package closure additionally byte-compares
both manifests and both adapter metadata files, copies the real package, removes only one bootstrap
manifest, proves symmetric inventory, observes the named missing-file failure, and restores green.

## Acceptance

### Builder

```bash
cd collab-electron && bun test && bun run build
cd ..
bun qa/run.ts dock-definition-launch
bun qa/run.ts dock-profile-identity
bun qa/run.ts dock-registry
bun qa/run.ts agent-path
bun qa/run.ts repo-shape
bun qa/run.ts lockfile-committed
bun qa/run.ts kernel-sole-writer
bun qa/run.ts kernel-sole-writer-app
bun qa/run.ts no-canvas-domain-writes
bun qa/run.ts doc-action-surface
bun qa/run.ts one-skin
```

Run each focused gate once after the implementation batch, plus the four required baits. The builder
does not inspect a finished Linux package; that cold package proof belongs to the verifier. Do not
delete dependency trees or run the cold release verifier. Report and stop.

### Verifier

From a new detached worktree with no inherited dependencies or build output:

```bash
bun qa/verify-release.ts
```

Then independently repeat the four baits, the copied-package missing-bootstrap control, conflict/
idempotence proof, both failure injections, exact argv capture, role registration, and session
links before deciding PASS or REWORK.

## Out of scope

- Schema/golden/D1-upgrade changes or deletion/rewrite of existing definitions and sessions
- Profile-home discovery, creation, cloning, configuration, or credentials
- Per-profile QuantFlow tool grants, caller identity, approval policy, or unscripted WO-109 workflow
- Peer-bus protocol/storage repair, typed delegation, A2A choreography, or delivery redesign
- A universal CLI installer, marketplace, SDK/runtime replacement, or second live CLI adapter
- Product rename WO-N1, Bovada ingest, browser tiles, RL, betting, or trading
- Real model turns, API calls, prompts, or network access in acceptance

## Report back

1. One sentence a non-programmer can read.
2. Exact bootstrap rows and idempotence/conflict counts.
3. Definition id → adapter id → runtime profile → argv receipts for two shared-package profiles.
4. Exact session → definition links and equal/shared package proof.
5. Removed legacy product surfaces and static scan output.
6. Peer role → PTY registration receipt without founder transport access.
7. Create/start failure cleanup receipts, child ownership, and any routed D2b seam.
8. Real package manifest/metadata inventory and copied-package bait.
9. Focused/static gate outputs and four red→green transcripts.
10. Judgment: every silent choice, especially config fallback and untouched ACP/AgentOS cleanup.
