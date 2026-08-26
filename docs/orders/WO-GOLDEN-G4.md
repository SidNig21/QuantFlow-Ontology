# WO-GOLDEN-G4 — Retire the AgentOS runtime fossil

status: **DRAFT — FRESH SEMANTIC READER REQUIRED**
order-type: Golden Baseline Phase 2 non-rung group
branch: `wo-golden-g2`
founder-approved-route: G4 — AgentOS runtime fossil
parent-group: G3 **CLOSED / ACCEPTED** at `01f3a3257d2cbd7e9d5e11219520013b957a6801`
r18-authority: **FROZEN**
main-authority: **NONE**
builder-authority: **NONE UNTIL READER YES/YES + NEXT.md ROTATION**

## Outcome and one meaning

G4 removes unsupported AgentOS guest-runtime execution and its QA-only toolchain from the current Windows product while preserving the package identity contract used by current Hermes and Claude native adapters.

After G4, a package marker may still use the `.aospkg` suffix. That suffix means a package reference plus sibling metadata; it does not imply AgentOS execution. Current supported runtime routes remain `native_tui` and `host_acp`. Metadata requesting retired route `agentos` is refused before session or Kernel mutation with one explicit unsupported-route diagnostic.

G4 adds no runtime, participant, Dock inventory, ontology type, or R18 behavior.

## Authority and sequence

This order receives one fresh semantic Reader answering exactly:

1. Can every acceptance gate actually fail on the defect it names?
2. Does every deliverable have exactly one meaning?

The Reader must adjudicate the supported-predecessor decision below from current source and accepted authority. `NEXT.md` is Reader-only. Only a later `YES/YES` rotation opens one Builder. The Builder and independent Verifier are separate tasks sharing this checkout.

## Supported predecessor-state decision to prove

The current Kernel persists `package_ref` and optional `runtime_profile`; it does not persist a runtime route. Route comes from package-owned sibling metadata.

The G4 starting census must prove all of the following without exposing private data:

- no current production Dock manifest or packaged production resource selects route `agentos`;
- no current canonical Kernel AgentDefinition/Profile resolves through installed production metadata to route `agentos`;
- supported Windows product state contains only currently staged Hermes/Claude package identities;
- no accepted R18–R25 route requires AgentOS guest execution.

If all four hold, G4 defines route `agentos` as unsupported retired metadata rather than supported compatibility. No migration invents a replacement runtime. Resolution fails closed before admission and names the retired route and package reference. Historical or external packages are not silently rewritten.

If any current supported predecessor resolves to route `agentos`, the Reader returns `NO`; the Builder may not remove compatibility until an explicit migration/retirement contract exists.

## Preserved current boundary

G4 may not remove or weaken:

- Hermes or Claude `.aospkg` markers, sibling metadata, launch descriptors, Dock profiles, prompts, or pack scripts;
- `package_ref` and `runtime_profile` Kernel schema or current resolution behavior;
- `native_tui` admission, PTY ownership, peer delivery, terminal tiles, cancellation, shutdown, or reopen behavior;
- `host_acp` behavior or packages; G5 owns their disposition;
- generic `runtime-kernel-admission` lifecycle and Kernel admission truth;
- current production staging, package inspection, Dock inventory, Hermes launch policy, or Windows application behavior;
- Claude identity (G6), broader protocol/dependency contraction (G7), Kernel/law repair (G8), Report authority (G9), Canvas coherence (G10), authority compression (G11), or Windows packaging hardening (G12).

## Authorized source disposition

After the starting census and Reader acceptance, the Builder may remove only AgentOS-owned behavior:

1. In `collab-electron/src/main/agent-host.ts`: AgentOS imports, native-Windows AgentOS guard, AgentOS singleton/link state, QA boot smoke, AgentOS package admission, fallback dispatch, prompt/stream/cancel/finalize branches, and AgentOS disposal.
2. In `collab-electron/src/main/runtime-adapter.ts`: route `agentos` acceptance while retaining fail-closed unknown/retired-route validation and both current routes.
3. The app direct dependency `@rivet-dev/agentos-core` and only its now-unreachable lock closure.
4. The literal `tools/runtime-proof/**` AgentOS fixture/toolchain package, including ignored/generated descendants, after a complete tracked/ignored manifest.
5. AgentOS-only `qf-toolloop` cases from `qa/gates/agent-path/**`, `qa/gates/dock-registry/**`, `qa/gates/dock-definition-launch/**`, and their package-local manifests/locks.
6. AgentOS-only QA staging/toolchain preparation and `qf-toolloop` resources in `collab-electron/scripts/package-lib/runtime-staging.ts` and direct consumers.
7. AgentOS-only app boot/import/disposal calls that become unreachable.

The Builder may not delete a shared file wholesale merely because it contains an AgentOS branch. A dependency leaves only when the post-edit direct and transitive consumer census proves no surviving current, compatibility, QA, package, or named-future consumer.

## Deliverable A — Frozen starting census

Create `docs/orders/evidence/golden-baseline/g4/BEFORE.md` and machine-readable manifests containing:

- clean `BUILD_BASE_SHA`, upstream identity, protected main, and process zero;
- every tracked and ignored path under `tools/runtime-proof`, with bytes and SHA-256;
- all AgentOS imports, route branches, package resources, QA references, dependency declarations, lock entries, docs/authority references, generated Atlas rows, and build output;
- current production Dock/staging resources and their route metadata;
- privacy-safe current Kernel definition/profile package-ref and resolved-route census;
- supported predecessor-state conclusion and exact refusal behavior;
- exact starting matrix, including every pre-existing red assigned to G8 or G12;
- Atlas clean-tree baseline and hashes.

Any unclassified production, package, compatibility, or future-rung AgentOS consumer stops G4.

## Deliverable B — Preserve generic lifecycle proof

G4 may delete AgentOS-specific proof subjects but not their current invariants.

Map each retained invariant to current native/shared proof before deletion:

- definition-backed admission creates one Kernel session and one runtime owner;
- second-session creation does not reuse or duplicate identity;
- cancellation/close leaves no descendant, listener, package, temp, or process residue;
- unknown session and unsupported route refuse without mutation;
- Artifact publication and Kernel lifecycle remain current where exercised by current runtime paths.

Prefer existing `runtime-kernel-admission`, native-TUI, Dock-definition, Hermes-launch, and governed-review tests. Add at most one small QA-only fixture if a current invariant otherwise loses its sole fail-capable proof. It may not implement a fake product runtime or preserve AgentOS terminology merely to keep an old gate green.

Retire the `runtime-proof` command from `qa/run.ts` only after the invariant map names its surviving proof for every accepted assertion.

## Deliverable C — Fail-closed retired-route proof

Add a focused gate or test that proves:

- `native_tui` metadata resolves unchanged;
- `host_acp` metadata resolves unchanged;
- metadata route `agentos` exits non-zero before any AgentSession, Task, Artifact, event, PTY, ACP handle, package link, or process is created;
- an arbitrary unknown route has the same pre-mutation refusal class but is not mislabeled as current;
- the diagnostic names the offending package reference and route.

The falsifier must demonstrate that accepting `agentos`, falling through to a default route, or mutating before refusal makes the proof red.

## Deliverable D — Package and Dock non-regression

Because G4 changes QA staging and app dependencies, run the bounded package/runtime matrix:

```powershell
bun qa/run.ts dock-production-inventory
bun qa/run.ts dock-definition-launch
bun qa/run.ts hermes-launch-policy
bun qa/run.ts package-closure
bun test collab-electron/src/main/runtime-adapter.test.ts collab-electron/src/main/precreated-native-tui.test.ts collab-electron/src/main/native-tui-orchestration.test.ts
bun --cwd collab-electron run typecheck
bun --cwd collab-electron run build
```

Run each existing fail-capable selector for any changed gate. A starting Windows/package red already assigned to G12 remains outside G4 only when exact pre/post non-regression is independently proved.

Do not run a full installer/release traversal solely for ceremony. If production package resources or package inspection semantics change beyond removing QA-only AgentOS staging, the Reader must say so and expand only the necessary bounded package proof before Builder authority.

## Deliverable E — Dependency and absence proof

Candidate evidence must prove:

- no tracked/ignored `tools/runtime-proof` descendant remains;
- no production source imports or dynamically resolves `@rivet-dev/agentos-core`;
- no current manifest/lock/build/package resource retains AgentOS solely for removed G4 behavior;
- no production Dock/staging route equals `agentos`;
- no AgentOS branch remains in app admission/turn/cancel/disposal;
- Hermes/Claude marker and metadata hashes remain exact unless their bytes are explicitly proven G4-owned (expected: unchanged);
- remaining `.aospkg` references all resolve through current package metadata and are not relabeled AgentOS;
- G5/G6/G7/G12 surfaces are unchanged except unavoidable lockfile contraction directly caused by the removed app dependency.

## Deliverable F — Atlas, receipts, and candidate

Precompute the Atlas clean-tree ordering before mutation. Commit product/QA/dependency changes, regenerate Atlas from a clean source candidate, then commit only generated/evidence outputs. Record product/config tree equivalence for any later evidence-only commit.

Run:

```powershell
bun qf-atlas/generate.mjs --check
node qf-atlas/falsify.mjs
bun qf-atlas/ratchet.mjs
git diff --check "$BUILD_BASE_SHA...HEAD"
git diff --check
```

The falsifier runs without `--receipt` during independent verification; the committed receipt remains Builder evidence and is compared by result name/pass meaning. Final candidate requires clean upstream identity, zero temp/bait/product/WSL processes, and one independent Verifier.

## Throughput and stops

Mechanical same-meaning selector, path, allowlist, teardown, generated-metadata, or receipt-format repairs use the ADR-0004 fast path. Any change to supported compatibility, route meaning, lifecycle assertion, package boundary, or what PASS means requires Reader adjudication.

The same semantic assertion failing twice after repair stops G4. No full G9, G5 Builder, `main` merge, or R18 work is authorized.
