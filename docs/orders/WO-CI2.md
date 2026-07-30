# WO-CI2 — The shipped app contains its required runtime files

status: rewrite required — the clean rebuild also exhausted two verification rounds
assignee: builder
depends: WO-K3 — independently verified at `b0b7bc5`; merged 2026-07-29
blocks: WO-N1 · Dock profile/runtime unification
kind: off-ladder release repair

## Objective

Make the canonical verifier package the Linux application and prove that every runtime file the
current shipped UI depends on is closed over by packaged resources, not only by a source checkout.
This is a package-closure order: it does not claim that a runtime has a Kernel profile or can finish
a live turn.

## In plain terms

The code compiles, but the installable app leaves out agent packages used by its current Dock paths.
After this order, deleting a required runtime file from the package makes the release check fail
before the founder ever installs it.

**If it goes wrong:** a green build can still produce an AppImage without the bytes needed by its
boot agent or Hermes path, or Electron Builder can silently skip a declared resource and exit zero.

---

## Measured failure — re-derive before editing

Measured from detached verified K3 commit `f525c3d` on Linux, 2026-07-29:

```bash
cd collab-electron
node ./scripts/run-local-bin.mjs electron-builder \
  --dir --linux --x64 --config.npmRebuild=false --publish never
```

The command exited **0**, produced `dist/linux-unpacked`, and printed:

```text
file source doesn't exist .../collab-electron/vendor/tmux/tmux
file source doesn't exist .../collab-electron/vendor/tmux/lib
```

The package contained `resources/app.asar`, terminfo, `tmux.conf`, the CLI, and the canvas skill.
It did **not** contain these paths:

```text
resources/tools/runtime-proof/packed/qf-toolloop.aospkg
resources/species/hermes/packed/hermes.aospkg
resources/species/hermes/packed/hermes.meta.json
resources/species/hermes/launch.json
resources/species/hermes/tools-allowlist.json
```

Real resolver probe, using the packaged `resources/` directory as `appRoot`:

```text
REJECTED qf-toolloop PackageRefUnresolvedError
  .../resources/tools/runtime-proof/packed/qf-toolloop.aospkg
REJECTED hermes PackageRefUnresolvedError
  .../resources/species/hermes/packed/hermes.aospkg
```

Why the canonical verifier missed it:

- `qa/verify-release.ts` runs install → units → `bun run build` → QA; it never packages.
- `collab-electron/package.json` packages `out/` and selected `extraResources`; no runtime pack is
  included.
- `tools/runtime-proof/packed/` and `species/hermes/packed/` are ignored generated output.
- `agent-host.ts` nevertheless boot-seeds
  `tools/runtime-proof/packed/qf-toolloop.aospkg` into the Kernel.

The package's asar does contain third-party AgentOS dependency packages under `node_modules`, but
those are not either QuantFlow runtime reference above and do not satisfy this order.

---

## RULING 1 — build is not package; package joins the canonical verifier

Add a `package` stage after `build` and before `qa` in `qa/verify-release.ts`. On Linux it creates an
**unsigned directory package** (`dist/linux-unpacked` or an equivalent deterministic directory),
never an AppImage and never a release upload. It must:

1. require no credentials or signing material;
2. use the repository-pinned Electron/Electron Builder versions;
3. prepare runtime assets itself from the nested frozen-lockfile packages it needs;
4. fail if a required input or packaged output is absent;
5. leave source files untouched (generated build/package output may remain ignored).

The stage may download the public pinned Electron runtime on a cold machine. It must never load
`.env.local`, publish, sign, or call `scripts/upload-to-github.cjs`.

Every run starts by removing only its own ignored unsigned-package output and ignored runtime
staging tree. The verifier creates an unpredictable run id and passes it to the package and QA
stages. Capture that same Electron Builder child's unfiltered stdout and stderr in an ignored log.
After it exits successfully, the package command writes an ignored receipt beside the unsigned
package containing the run id, absolute package root, absolute log path, and log SHA-256. QA accepts
an existing package only when the receipt matches the current run id and the named non-empty log
still matches its hash. The receipt and log are ephemeral build evidence, never application truth
and never a Kernel substitute.

**Do not reuse `scripts/package.mjs` unchanged:** it reads `.env.local`, builds platform release
targets, restores native modules, and can upload. Add a small verification-only entry point whose
contract is exactly the five points above.

## RULING 2 — preserve existing references in this repair

This order repairs packaging, not the Dock ontology. Keep these existing relative references:

```text
tools/runtime-proof/packed/qf-toolloop.aospkg
species/hermes/packed/hermes.aospkg
```

Prepare and stage the following tree under the packaged `process.resourcesPath`, preserving those
relative paths:

```text
tools/runtime-proof/packed/qf-toolloop.aospkg
species/hermes/packed/hermes.aospkg
species/hermes/packed/hermes.meta.json
species/hermes/launch.json
species/hermes/tools-allowlist.json
```

Use the existing package scripts and lockfiles; do not hand-author `.aospkg` or packed metadata.
The staging script must start clean inside its own ignored staging directory so stale output cannot
make a missing pack step green.

`appRoot()` must return the repository root in development and `process.resourcesPath` in a packaged
Electron process. Make this decision injectable/pure enough to test without launching a GUI; never
infer packaged state from a directory name.

## RULING 3 — a declared resource may not disappear with a warning

Electron Builder currently treats missing `extraResources.from` paths as warnings and exits zero.
Add a package-input preflight that fails before Electron Builder when an input active for the current
platform is absent.

The preflight and Electron Builder must consume the same `build` configuration from
`collab-electron/package.json`; do not maintain a second handwritten list of active FileSets.
Resolve top-level `build.extraResources` followed by `build.linux.extraResources`, including the
generated runtime staging entry. This order accepts only the current explicit `{ from, to }`
FileSet shape with no macros or filters; preflight hard-fails if a future configuration adds a
string, macro, filter, or other unsupported shape instead of guessing.

This merge order and the missing-source behavior are measured from the installed pinned
`app-builder-lib@26.8.1`: `out/fileMatcher.js#getFileMatchers` adds `config[name]` and then
`customBuildOptions[name]`, while `copyFiles` logs `file source doesn't exist` and returns. The
builder must preserve a focused regression for both behaviors rather than infer a different SDK
surface.

The vendored tmux entries are macOS/Homebrew artifacts (`vendor-tmux.sh` uses `brew`, `otool`,
`install_name_tool`, and `codesign`). They are not Linux runtime inputs. Move both declarations,
unchanged, from top-level `build.extraResources` to `build.mac.extraResources`; they remain active
for macOS and are absent on Linux. Do **not** add or download a Linux tmux dependency in this order;
the Linux default terminal backend is the packaged PTY sidecar. The Linux verification package must
contain every resource it declares and print no `file source doesn't exist` warning.

## RULING 4 — test the artifact, not the staging directory

The gate reads only the finished unpacked package after Electron Builder exits. It must not accept
the source `packed/` or staging tree as evidence.

For both `qf-toolloop` and `hermes`, call the production `resolvePackageRef()` against the actual
packaged resources root and require success. Resolve Hermes' packed metadata, committed launch
document, and tool allowlist through the production path rules and require them at the same paths
the packaged host will use.

Be exact about the claim: `resolvePackageRef()` proves byte closure, not admission or launch. A
fresh packaged Kernel currently boot-seeds only `qf-toolloop`; Hermes registration and heterogeneous
profile launch belong to the next Dock order. This gate must call itself `package-closure` in output
and must not print that Hermes launched.

The gate reports each checked absolute packaged path and its byte size. A zero-byte placeholder is
failure.

For every active Linux FileSet, expand the source matcher to concrete files using the pinned
Builder's FileSet rules, derive each destination path, and require every concrete packaged output.
The existence of a destination directory alone is never evidence that its contents were copied.

---

## Deliverables

### D1 — verification-only package command

Add one command under `collab-electron/scripts/` and one package script (name it clearly, e.g.
`package:verify`). It prepares runtime assets, preflights active inputs, and creates an unsigned
Linux directory package. It never reads credentials, signs, uploads, or builds an AppImage.

It hard-fails unless `process.platform === "linux"`, then invokes the repository-pinned local
Electron Builder exactly as:

```text
electron-builder --dir --linux --x64 --config.npmRebuild=false --publish never
```

No globally installed Builder, configured AppImage target, host-architecture inference, or alternate
platform is accepted by this order.

### D2 — deterministic runtime preparation

Use frozen nested installs and the existing pack scripts for:

- `tools/runtime-proof`
- `species/hermes`

Copy only the five ruled runtime files into a clean ignored staging tree. Missing source output,
failed pack, wrong metadata route, or empty bytes is fatal.

### D3 — packaged root resolver

Make the app's species/package resolution use `process.resourcesPath` when packaged and the repo
root in development. Unit-test both branches with injected inputs.

### D4 — package resource configuration

Include the staged tree without changing the two existing Kernel `package_ref` strings. Move the two
vendored tmux FileSets unchanged into `build.mac.extraResources`, so they remain active on macOS and
are absent on Linux. Do not broaden `extraResources` to copy whole source trees, `node_modules`,
credentials, profile homes, or operator data.

### D5 — `package-closure` QA gate

Add a cold-safe gate and wire it into `qa/run.ts`. It verifies the finished Linux directory package:

- both production runtime refs resolve through `resolvePackageRef()`;
- Hermes meta/launch/allowlist exist and are non-empty;
- every concrete output expanded from every active declared Linux FileSet exists and is non-empty;
- the receipt's same-process Builder log exists, is non-empty, matches its recorded SHA-256, and
  contains no `file source doesn't exist`;
- evidence paths are inside `dist/linux-unpacked/resources` (or the chosen output), never source or
  staging directories.

The canonical verifier gives every child stage one run id. Its package stage writes the matching
receipt, so `bun qa/run.ts --all` reuses that exact output and does not package a second time. When
`bun qa/run.ts --all` is invoked directly with no release run id, this gate creates a new id, invokes
`package:verify` once, and inspects the output it just produced. A missing, stale, mismatched, or
out-of-root receipt is a named failure; no package is never green.

### D6 — canonical verifier coupling

Add `package` to the typed stage union and `RELEASE_STAGES`. Extend verifier unit coverage so deleting
that stage or placing it after QA is red. Generate one release run id per verifier invocation and
pass it to every stage without accepting an operator-supplied value as proof.

Update the deliberately independent stage oracle in `qa/gates/release-verifier.ts` to require
install → unit → build → package → QA. Its runner-behavior bait must make the package executor return
a distinct non-zero code, prove that exact code is propagated, and prove QA never runs afterward.

### D7 — bait controls

Provide real falsification hooks in production preparation/inspection code:

- copy the finished package to a bait directory and remove its Hermes `.aospkg` → inspector red
  naming the unresolved Hermes reference;
- inspect that bait against the development repo root instead of packaged resources → red naming
  the root escape;
- add one missing active Linux extra resource to an in-memory/test configuration → preflight red
  before Electron Builder.

Restore all three and show green. A bare flag that exits 1 is forbidden.

---

## Acceptance gates

### Builder-run

1. Relevant unit tests for package-root selection and verifier stage order.
2. `bun run package:verify` from `collab-electron`.
3. Inspect the resulting package with the production resolver.
4. D7 red → green transcripts for all three baits.
5. Static gates required by `PROTOCOL.md`.

The builder does not delete shared dependencies and does not claim the cold full verifier.

### Verifier-run

In a fresh detached worktree at the submitted commit:

```bash
bun qa/verify-release.ts
```

Expected stage order:

```text
install → unit → build → package → qa → PASS release-verification
```

The verifier independently reruns one missing-runtime bait against a temporary copy of the submitted
package, then reruns green against the untouched real package.

---

## BINDING REWRITE — 2026-07-29

This section supersedes any earlier sentence that permits a different behavior. The first candidate
`a5779a5` and its rework through `a11565b` are rejected and must not merge. Protocol stopped patching
after two failed verification rounds; this rebuild starts from merged `main` on a fresh branch.

### Why the rewrite is necessary

The package bytes can be present while the proof remains dishonest. In the rejected implementation,
all three planted failures printed a red-looking message but returned exit `0`; direct cold QA still
needed a manually prebuilt `out/`; and a bad same-run receipt could be replaced by a second package
instead of failing. Those are gate-definition defects, not ordinary missing assertions.

### RW1 — command modes are explicit and mutually exclusive

There are exactly three modes:

1. **Canonical release mode:** `qa/verify-release.ts` creates one unpredictable run id. Its package
   stage builds exactly once and writes that run's receipt. Its QA stage must reuse that exact
   package with zero install, build, or package calls. A missing, stale, malformed, hash-mismatched,
   or out-of-root receipt is a named non-zero failure; QA must never repair it by packaging again.
2. **Standalone QA mode:** no release run id is supplied. The `package-closure` gate creates a new
   unpredictable run id on every ordinary green invocation, performs the frozen
   `collab-electron` install, production build, and `package:verify` exactly once, then validates and
   inspects that new output. It never reuses a receipt from an earlier ordinary invocation.
3. **Bait inspection mode:** `missing-hermes` and `dev-root` may reuse the existing validated package
   only to avoid an unrelated rebuild. They must not rewrite it. `preflight-missing` mutates only the
   in-memory active Linux configuration and must stop before Builder.

Implement the mode decision through an exported pure function or injected executor so unit tests can
prove call counts. Production tests must show:

- canonical valid receipt: install `0`, build `0`, package `0`, inspect `1`;
- canonical missing/invalid/stale/out-of-root receipt: non-zero named failure and install `0`, build
  `0`, package `0`, inspect `0`;
- standalone ordinary run: fresh run id and install `1`, build `1`, package `1`, inspect `1`, even
  when an old receipt is already present;
- `missing-hermes` and `dev-root` bait modes: install `0`, build `0`, package `0`, inspect `1`;
- `preflight-missing` bait mode: collab install `0`, production build `0`, Builder/package `0`,
  inspect `0`, preflight `1`;
- no path derived from receipt content is used before exact path validation.

`package:verify` accepts the canonical run id when supplied. When invoked directly without one, it
creates and prints its own unpredictable run id so the literal builder command below is valid. It
does not read an operator-supplied environment value as proof of a prior run.

### RW2 — bait red means process failure

The real gate command must exit non-zero for each planted defect. Catching the expected exception and
returning `0` is forbidden. The bait may add/remove/copy the real artifact and may improve the error
message, but the failure must escape to `qa/run.ts` as `FAIL package-closure`.

Required transcripts, including shell exit status:

```text
QF_PACKAGE_CLOSURE_BAIT=missing-hermes bun qa/run.ts package-closure  # non-zero
QF_PACKAGE_CLOSURE_BAIT=dev-root bun qa/run.ts package-closure        # non-zero
QF_PACKAGE_CLOSURE_BAIT=preflight-missing bun qa/run.ts package-closure # non-zero
bun qa/run.ts package-closure                                         # zero, PASS
```

The missing-Hermes bait must enter the same full inspector as green, against a temporary copy of the
finished package. The dev-root bait must enter that inspector with the development root. The
preflight bait must enter the same preflight function used immediately before Builder. Unknown bait
values fail non-zero by name.

### RW3 — one shared production path law

The gate may not reimplement Hermes metadata, launch, or allowlist path derivation. Extract the pure
path helpers used by the packaged host into one shared main-process module (or export the existing
pure helpers without importing Electron/Kernel state), then make both production resolution and the
gate call those same helpers. Required shared rules are:

- packed sibling metadata from a `.aospkg` reference;
- committed `species|tools/<name>/launch.json`;
- committed `species|tools/<name>/tools-allowlist.json`.

A unit bait changes one shared rule input and proves production and package inspection derive the
same path. Add a static dependency assertion proving both production and the gate import that one
shared module, then inject/substitute the shared helper in a unit test and prove both consumers move
together. Parallel local copies, textually-identical duplicate functions, and a hardcoded allowlist
path are rejected.

### RW4 — configuration parsing fails closed

`build.extraResources` and `build.linux.extraResources` may be absent or arrays. If present with any
other type, parsing fails. Each active entry must be an object with exactly two own keys, `from` and
`to`, both non-empty strings. Strings, arrays-as-entries, macros, filters, and every additional or
unknown key fail. A macro means a Builder expansion token inside either value, including `${arch}`;
reject any `${...}` token in both `from` and `to`. Focused tests cover top-level and Linux-specific
non-array values, empty values, `filter`, an arbitrary third key, and `${arch}` in each field.

### RW5 — exact builder and verifier commands

Builder evidence runs, in this order:

```bash
cd collab-electron
bun install --frozen-lockfile
./scripts/test-unit.sh
bun run build
bun run package:verify
```

The direct `package:verify` command above must succeed without the builder inventing an environment
variable. The verifier, not the builder, creates **two different pristine detached worktrees**. In
the first, with no prior install/build/package command, it runs:

```bash
bun qa/run.ts package-closure
```

Only after that worktree reaches `PASS`, the verifier creates a second pristine detached worktree
from the same submitted commit and runs:

```bash
bun qa/verify-release.ts
```

Both commands must reach their final `PASS` without inheriting a prior command's `node_modules`,
`out/`, package, receipt, or staging tree. The verifier then runs one non-zero bait against a
temporary copy of the first worktree's submitted package and restores green there.

### Verification round 1 — REJECTED (`a5779a5`)

- cold standalone gate could not resolve the pinned `electron-builder` package;
- receipt-selected package and log paths were not bound to canonical output;
- `package:verify` did not check required emitted files before writing a receipt;
- release-stage deletion coverage tested a local array rather than the oracle;
- all three bait commands converted the planted failure to exit `0`;
- the literal ordered `bun run package:verify` failed without an undocumented environment variable;
- Hermes auxiliary paths were duplicated instead of using production rules;
- FileSet parsing accepted unsupported shapes.

### Verification round 2 — REJECTED (`4eae3e7`, evidence-only follow-up `a11565b`)

- direct cold QA still required a manual `bun run build` before it could pass;
- an ordinary no-run-id invocation reused an old receipt instead of creating a new run;
- canonical invalid receipts were treated as cache misses and silently repackaged, masking tampering
  and violating the single-package rule;
- bait commands still exited `0` after observing the intended failure;
- exact FileSet shape rejection and shared production auxiliary path rules remained incomplete.

No verification PASS exists for either candidate.

---

## SECOND BINDING REWRITE — 2026-07-29

This section supersedes the first clean-rebuild implementation at `599a7b1` and its rework at
`5c49f6a`. Neither commit may merge. The implementation branch is closed after two failed
verification rounds; the next builder starts again from merged `main` with this complete order and
must not cherry-pick implementation code from either rejected candidate.

### In plain terms

The new checker still crashes before it can install what it needs, so it cannot prove that a fresh
checkout produces a working shipped app.

### Clean rebuild verification round 1 — REJECTED (`599a7b1`)

In a pristine detached worktree, the literal first verifier command:

```bash
bun qa/run.ts package-closure
```

exited `1` before the standalone install and printed:

```text
Cannot find module 'qf-kernel/portable'
```

Inspection also found that the gate mutated process-global run-id state, derived its supposed
independent release oracle from production construction, allowed receipt validation and inspection
to collapse into one call, and did not bind every inspected path and FileSet output to the packaged
resource root. The candidate therefore did not establish the rewritten contract.

### Clean rebuild verification round 2 — REJECTED (`5c49f6a`)

The rework moved the heavy import behind the top-level gate launcher but still executed
`loadInspectModules()` before `executePackageClosureMode()` could call the standalone install.
From a second pristine detached worktree at the submitted commit:

```bash
bun qa/run.ts package-closure
```

again exited `1` before any install, build, or package process and printed:

```text
error: Cannot find module 'qf-kernel/portable' from
'.../collab-electron/scripts/package-lib/package-inspect.ts'
```

The added `qa/cold-import.test.ts` did not run the package-closure gate; it ran only
`qa/run.ts --list`. It also renamed the shared `collab-electron/node_modules` directory during
the test. That is not cold package proof and violates the protocol boundary against disturbing
shared dependencies.

### RW6 — the standalone installer must precede every collab dependency import

The cold boundary is behavioral, not merely a dynamic-import style rule:

1. Resolving the mode and constructing the standalone executor must load only Bun/Node built-ins and
   dependency-free QA modules.
2. In standalone ordinary mode, the first operation in the parent gate that can touch
   `collab-electron/node_modules` is `bun install --frozen-lockfile`.
3. Only after that install exits `0` may the parent gate import `package-inspect.ts`,
   `package-receipt.ts`, `preflight.ts`, `extra-resources.ts`, or any module that imports
   `qf-kernel/portable` or another dependency resolved from `collab-electron/node_modules`.
4. The production sequence is exactly:
   `install → build → package subprocess → parent loads inspection modules → validate receipt →
   parent inspects`.
5. An injected install exit `73` returns `73` from `executePackageClosureMode()`. The public
   `bun qa/run.ts package-closure` command may normalize any failed gate to process exit `1`, but
   no later import, build, package, validation, or inspection occurs.

The `package:verify` child is explicitly allowed to statically import and use those package-library
modules: it launches only after the standalone install and must retain its own post-Builder output
inspection before writing the receipt. The ruled lazy-loader boundary applies to the parent
`package-closure` gate, whose premature import caused both pristine failures. It does not remove
the package child's defense-in-depth inspection.

Construct the production executors around a lazy, memoized inspection-module loader. Creating the
executors must not invoke that loader. Receipt validation, inspection, and the preflight bait may
request it only at their ruled point in the selected mode. Canonical release mode remains valid
because the earlier canonical `install` stage has already completed; it still performs zero second
installs, builds, or packages.

Add a dependency-free unit test with an injected loader and process executors. It must prove the
exact standalone trace above, prove the loader is uncalled when install fails, and prove no heavy
module path is resolved during mode selection or executor construction. A static source search by
itself is not sufficient.

This test is acceptance, not an orphan file. Put it under
`qa/gates/package-closure/` and extend `collab-electron/scripts/test-unit.sh` to execute the root
`qa/**/*.test.ts` suite after its existing collab suites. Add an automatically-discovered test
under `collab-electron/scripts/package-lib/` that removes the root-QA invocation from an in-memory
copy of the unit script and proves the coverage assertion red, then restores it green. Therefore the
literal builder and canonical `unit` command in RW5 execute the lazy-loader test in CI.

### RW7 — cold evidence may not disturb or borrow shared dependencies

Delete `qa/cold-import.test.ts` and do not replace it with another simulated-cold test. The
automatically-discovered package-library wiring test must assert that this exact rejected path is
absent; falsify that assertion with an in-memory tracked-path fixture containing it, then restore
green. A `qa/run.ts --list` subprocess proves only registry loading and must never be reported as
a cold package-closure pass.

The protocol already forbids a builder from renaming, moving, deleting, hiding, or borrowing an
installed `node_modules` directory. RW7 adds no test that simulates a cold checkout and therefore
creates no sanctioned dependency-mutation mechanism to police. The only accepted full cold proof is
the pristine-worktree command below; the behavioral injected-loader test proves ordering but is not
a substitute for that run.

The only acceptance evidence for the full cold boundary remains RW5: the verifier creates a new
detached worktree containing no `node_modules`, `out`, staging tree, receipt, or package and runs
`bun qa/run.ts package-closure` as its first build-related command. The transcript must show the
frozen install beginning before any package-inspection module is loaded and must end
`PASS package-closure`.

---

## Out of scope

- Universal Dock/profile schema or removal of `hermes-seats.ts`
- Peer-bus routing, stale-message reconciliation, or profile configuration
- MCP `2026-07-28` migration
- WO-N1 product rename or app-data migration
- AppImage creation, signing, publishing, release upload, or credentials
- Changing existing `package_ref` strings or adopting a new runtime package format
- Bundling entire repository/source/package directories as a shortcut
- Installing or vendoring Linux tmux
- Registering Hermes in the Kernel or claiming a live Hermes/Codex/Claude turn; byte closure is the
  prerequisite, and the next Dock profile/runtime order owns that proof

## Report back

1. One plain-language sentence.
2. Exact packaged resource tree and byte sizes for the five runtime files.
3. Production resolver output for both runtime refs.
4. Active Linux `extraResources` preflight table.
5. Three D7 red→green transcripts.
6. Package command exit and stage-order unit evidence.
7. Static-gate results.
8. Judgment paragraph: every place the order was silent and what was chosen.
