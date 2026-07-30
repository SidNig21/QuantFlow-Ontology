# WO-K3b — every production artifact writer uses the canonical shelf

**Status:** open — current after WO-D2b PASS; adversarial pre-build measurement incorporated  
**Depends on:** WO-K3 and WO-D2b PASS  
**Size:** one Cursor-sized storage-path correction; no A2A redesign

## Plain-language objective

QuantFlow has one remaining report writer using the old app folder; move its future files onto the
same durable artifact shelf as every other report before the product rename moves that old folder.

## Measured starting state

- `collab-electron/src/main/a2a-bus.ts` defaults A2A report bytes to
  `join(COLLAB_DIR, "a2a")`, then records that absolute path through `publish_artifact`.
- `qa/gates/artifact-root/run.ts` dynamically proves only `agent-artifact-writer.ts` and statically
  couples only `agent-host.ts`, so the K3 gate can pass while A2A bytes live outside
  `~/.quantflow/artifacts/`.
- Read-only inspection of the founder Kernel on 2026-07-29 returned `all_artifacts=0` and
  `old_refs=0`. That means no current founder row needs repair; it does not excuse the structural
  writer defect.

## Contract

### D0 — read-only operator-data preflight

Count artifact rows and `storage_ref` values beneath `~/.collaborator/` in the default Kernel using a
readonly connection. Record counts only. Never copy, rewrite, delete, or normalize an operator row
or byte. If old references exist on a different machine, report them for N1's deletion guard; this
order still fixes future writes.

### D1 — canonical A2A artifact path

1. The production A2A bus default is `<resolveArtifactRoot().path>/a2a`, reached through the same app
   `getArtifactRoot()` authority already injected into agent seats. It must not derive artifact bytes
   from `COLLAB_DIR`, `QF_APP_ROOT`, `QF_APP_DIR`, cwd, or a worktree id.
2. Preserve the existing explicit `artifactDir` test/embedding override and all A2A role, delivery,
   content, publish, and Kernel semantics. Do not migrate old files or redesign the bus.
3. If importing the Electron bus makes the gate impure, factor only the smallest production
   artifact-store helper needed by both the bus and gate. The gate must call that exact helper; a
   QA-only reimplementation of the path rule is a failure.

### D2 — make the K3 gate exhaustive over production publishers

Extend `artifact-root` so it:

1. Enumerates every non-test `publish_artifact` production callsite under
   `collab-electron/src/main`; the allowed set is the agent report path and A2A path. Any third
   ungoverned publisher is red.
2. Runs the exact production A2A storage helper under a temporary HOME / `QF_ARTIFACT_ROOT`, writes
   absent bytes, publishes into an in-memory Kernel, and proves the resulting `storage_ref` exists,
   is inside the resolved root, and hashes to the Kernel identity.
3. Statically couples `a2a-bus.ts` to that helper and rejects any production `COLLAB_DIR/a2a` or app-
   root fallback. Keep the existing agent-host proof intact.

### D3 — current documentation

Correct ROADMAP debt #29 from narrowly closed to closed only after both production writers are
covered. Do not rewrite historical evidence. The official README already states the canonical
artifact layout and needs no conceptual change for this correction.

## Required falsification

Both baits edit production and run `artifact-root` red → restore → green:

1. Route the real A2A default back to the app-local directory: red on the production coupling/path
   proof.
2. Add a third production `kernelExecute("publish_artifact", ...)` callsite outside the two governed
   writers: red on exhaustive enumeration.

## Acceptance

Builder, once after the complete batch:

```bash
cd collab-electron && ./scripts/test-unit.sh && bun run build
cd ..
bun qa/run.ts artifact-root
bun qa/run.ts kernel-sole-writer-app
```

Then the two baits. A separate verifier runs `bun qa/verify-release.ts` once from a fresh detached
worktree and independently repeats both baits.

## Out of scope

Existing artifact migration or deletion; Kernel/schema/golden changes; app/product rename; A2A
protocol, role, prompt, delivery, or UI changes; dependencies; credentials; model/network calls;
bets or trades.
