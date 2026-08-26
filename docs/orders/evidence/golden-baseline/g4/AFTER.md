# Golden Baseline G4 — Builder receipts

Candidate product/config commit: `2f7ea77ebf3671e25a6c556b7afcd1c355877efe` (prior G4 product commit: `fd60b38`)

The product/config tree is the first commit. Atlas and evidence are committed
after it so the Atlas falsifier can run on a clean product tree.

## Focused matrix

PASS:

- `bun qa/run.ts golden-g4-retired-route`
- `bun qa/run.ts dock-production-inventory`
- `bun qa/run.ts dock-definition-launch`
- `bun qa/run.ts hermes-launch-policy`
- `bun qa/run.ts typecheck` — PASS typecheck (the frozen G12 Windows red did not reproduce)
- `bun test collab-electron/src/main/runtime-adapter.test.ts collab-electron/src/main/precreated-native-tui.test.ts collab-electron/src/main/native-tui-orchestration.test.ts` — 16 pass, 0 fail
- `bun run --cwd collab-electron build` — production build exit 0
- `bun qf-atlas/generate.mjs --check`
- `node qf-atlas/falsify.mjs` — 24 falsifiers pass
- `bun qf-atlas/ratchet.mjs` — HARD RED 0; unexplained coverage 0

The literal matrix spelling `bun --cwd collab-electron run build` printed Bun
usage with exit 0 on this Bun version; the supported equivalent above executed
the complete build and passed. Package-closure completed the staged build and
inspection, then remained red at its pre-existing Windows-owned boundary:
`package:verify: linux-only verification package command`.

## G4 result

- Production staging retains Hermes and Claude resources.
- QA staging retains qf-proof-agent, production resources, and Claude QA.
- Every staged profile package reference is enumerated and resolved through its
  package metadata; unsupported `agentos` and arbitrary routes fail closed.
- `golden-g4-retired-route` observed three retained `native_tui` references,
  rejected `agentos` and `golden-g4-unknown`, and recorded zero pre-dispatch
  callbacks for either rejection.
- Hermes package/metadata and Claude package/metadata identities are retained;
  the stale Claude launch-only argv field was removed to match its generated
  profile_argv metadata.
- The exact `tools/runtime-proof` tree was removed after the frozen census of
  28,317 descendants, 17 tracked descendants, and 1,021,108,550 bytes.

The independent Verifier must re-run the focused matrix, compare result names
and PASS meaning, verify upstream equality and a clean tree, and self-accept
the candidate. The Builder does not self-accept G4.

## Mechanical same-meaning repairs

- The frozen Windows Dock launch invocation/path falsifier was red before repair; the focused `dock-definition-launch` falsifier is green after adding the existing isolated Bun install arguments and exact disposable home path, with the retained lifecycle assertions unchanged.
- The generated Claude launch metadata had a stale launch-only argv field; removing that field makes the generated profile metadata and source agree, and the package/Dock focused non-regression remains green.
- The Windows equivalent Hermes package-identity path falsifier was red on the duplicated suffix; the focused Dock gate is green after the suffix-only path repair, with package identity semantics unchanged.
## Semantic repair from prior Verifier FAIL

The independent Verifier failed candidate 564af3c096ac7ef64c39dfb3cfa19bc7964812a4 because startPrecreatedNativeTuiSession called the stale native_tui-only assertion after metadata resolution and before the production dispatcher. Retired agentos and arbitrary routes therefore produced the wrong generic refusal boundary instead of the exact dispatcher error.

Fresh Reader task 01a03fab-e8e3-7b62-bb2a-d728cbed87a3 returned YES/YES for this one semantic repair.

Repair proof:

- Removed only the stale precreated route import and call from agent-host.ts; all authenticated caller, starting-session, spawned_from, definition, delegates_to ownership, metadata resolution, and existingSessionId handoff checks remain.
- Deleted the now-authority-bearing precreated-native-tui.ts helper.
- Production-path tests exercise agentos and golden-g4-unknown through startPrecreatedNativeTuiSession and assert exact UnsupportedRuntimeRouteError name, code, message, route, and packageRef fields with zero Kernel mutations and zero native_tui or host_acp callbacks.
- The G4 gate now requires one dispatcher in admitAndStartSession and rejects any precreated route, mutation, or runtime-callback boundary before that handoff; its exact route probes remain green.

Changed-surface receipt: 18 tests passed, 0 failed, 73 expectations. G4 retired-route gate passed. Atlas falsification passed 98/98; Atlas is current at 417 files, 126 channels, and 13 strip candidates.

The G12-owned Windows package-closure red remains unchanged from the prior candidate; no package, Dock, route compatibility, or retained lifecycle semantics were changed by this repair.

## Final independent Verifier close result

Final independent Verifier task 01a03fc3-6f33-7c51-a6f4-a1c92111310c returned semantic PASS and clean-close FAIL only because the typecheck had generated qa/fixtures/lifecycle-command/node_modules and the checked-in G4 receipt counts/header were stale.

The Router removed exactly qa/fixtures/lifecycle-command/node_modules and confirmed the prior candidate 62f97a31d1983632ad890fcc3768278c133a36f8 was clean. This evidence-only correction records that cleanup and receipt repair; it does not change product/config/source/tests/gates.

Independent Verifier semantic rerun: 16 pass, 0 fail, 68 expectations for the production-path focused command. The Builder combined changed-surface run remains separately recorded as 18 pass, 0 fail, 73 expectations and is not presented as the same command.

Final cleanup receipt: exact generated directory removed; git status --porcelain 0; untracked rows 0; residue rows 0; relevant product/temp/WSL process rows 0. The inherited G12 package-closure red is unchanged.

Candidate lineage: repaired product/config commit 2f7ea77ebf3671e25a6c556b7afcd1c355877efe, prior verified candidate 62f97a31d1983632ad890fcc3768278c133a36f8, then this evidence-only close correction.
