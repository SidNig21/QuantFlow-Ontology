# Golden Baseline G4 — Builder receipts

Candidate product/config commit: `fd60b38`

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