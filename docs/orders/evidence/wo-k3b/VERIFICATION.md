# WO-K3b — independent verification · 2026-07-30

**In plain terms:** Both ways the app publishes reports now use one durable QuantFlow shelf, and
the guard fails if either writer escapes it or a third writer appears.

**Verdict:** PASS

**Exact candidate:** `1203ff21210986a0d260b8fcc7ab29529e0b5b91`

**Implementation:** `97a275a`

**Verifier worktree:** fresh detached checkout at `/tmp/qf-k3b-verify-1203ff2`; no dependency or
build output existed before the canonical verifier started.

## Cold shipped-form proof

The canonical release verifier was run exactly once, with no preinstall:

```text
$ bun qa/verify-release.ts
release: runId=8a089d45-04e8-4237-a8e2-38f4022f0484
...
package:verify: PASS
...
artifact-root K3b A2A production writer: PASS
artifact-root K3b A2A production coupling: PASS
artifact-root K3b governed publishers: PASS (a2a-bus.ts, agent-host.ts)
artifact-root OK
PASS  artifact-root
...
PASS  release-verification
exit 0
```

The same run performed the frozen Electron install, **311 passing unit tests**, production
main/preload/renderer build, real unsigned Linux package inspection, package closure controls,
and the complete QA board. It did not rely on builder-installed dependencies.

## Independent contract re-derivation

The candidate scope relative to its verified WO-D2b base `ab9a59e` is four files: the new pure A2A
store, its production bus wiring, the expanded `artifact-root` gate, and builder evidence. No schema,
dependency, A2A role/delivery, prompt, model, network, or migration surface changed.

Production inspection re-derived the storage path rather than accepting the gate's claim:

```text
a2a-bus.ts
  artifactRoot: getArtifactRoot
  publish: kernelExecute("publish_artifact", ...)

kernel.ts
  getArtifactRoot() -> resolveArtifactRoot().path

a2a-artifact-store.ts
  default -> join(artifactRoot(), "a2a")
  explicit override -> artifactDir (artifactRoot is not consulted)
```

The A2A core still writes the envelope bytes through the injected writer before publishing the
same `storagePath`; the production store sends that exact path as both `path` and `storage_ref`.
The Kernel remains the sole durable writer.

An independent recursive search of non-test production sources under
`collab-electron/src/main` found exactly two literal `publish_artifact` dispatches:

```text
collab-electron/src/main/a2a-bus.ts:60
collab-electron/src/main/agent-host.ts:643-644
```

The generic renderer IPC door remains governed separately by `QF_EXECUTE_ALLOWLIST`; it is not an
artifact byte writer. No third production report writer was found.

The explicit override was exercised independently with a default resolver that throws if called:

```text
override_bypasses_default=true dir=.../qf-k3b-override-.../explicit
```

The override directory was created and the throwing default was never consulted.

## Read-only founder-data preflight

The live default Kernel was queried with `sqlite3 -readonly`; no row or artifact byte was changed:

```text
/home/sidnig21/.quantflow/kernel.db 258048 bytes
all_artifacts=0
old_refs=0
```

There is no current founder artifact row requiring migration or deletion.

## Independent production falsification

### Bait 1 — restore the old app-local A2A default

Production `a2a-bus.ts` was changed to import `COLLAB_DIR` and give the real store
`() => COLLAB_DIR`, restoring the former `<COLLAB_DIR>/a2a` behavior.

```text
$ bun qa/run.ts artifact-root
artifact-root K3b A2A production writer: PASS
artifact-root G4 production coupling: PASS
artifact-root FAIL: artifact-root: a2a-bus must give the production store getArtifactRoot
FAIL  artifact-root
exit 1
```

After restoring the exact candidate source:

```text
artifact-root K3b A2A production coupling: PASS
artifact-root K3b governed publishers: PASS (a2a-bus.ts, agent-host.ts)
artifact-root OK
PASS  artifact-root
exit 0
```

### Bait 2 — add a third production publisher

A temporary production file dispatched a third literal
`kernelExecute("publish_artifact", ...)` outside both governed writers.

```text
$ bun qa/run.ts artifact-root
artifact-root FAIL: artifact-root: production publish_artifact callsites must be exactly
a2a-bus.ts, agent-host.ts; got a2a-bus.ts, agent-host.ts, k3b-third-publisher-bait.ts
FAIL  artifact-root
exit 1
```

After deleting only the temporary bait file:

```text
artifact-root K3b governed publishers: PASS (a2a-bus.ts, agent-host.ts)
artifact-root OK
PASS  artifact-root
exit 0
```

The worktree returned to zero tracked production changes after both restores.

## Judgment and limits

I accepted the small store extraction because the production bus and the dynamic gate call the same
helper, while Electron/PTy delivery remains outside it. The exhaustive check intentionally governs
direct literal production publishers; the renderer's variable-command IPC surface is a distinct,
existing trust boundary guarded by its allowlist and was not redesigned in this order.

One non-blocking evidence discrepancy was measured: `git diff --check ab9a59e..1203ff2` reports the
Markdown hard-break spaces after the builder evidence's candidate-branch line, despite the builder
report saying `git diff --check` was clean. It does not affect production behavior or any gate, and
no production source has whitespace damage.
