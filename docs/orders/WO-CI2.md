# WO-CI2 — The shipped app contains its required runtime files

status: open — adversarial pre-build read PASS; current after WO-K3 merge
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
