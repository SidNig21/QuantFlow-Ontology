# G1 before receipt

- ORDER_CANDIDATE_SHA: `f0992b6`
- BUILD_BASE_SHA: `57fc4ff711848bbb7f668f608e7478d407dc14f4`
- HEAD at preflight: `57fc4ff711848bbb7f668f608e7478d407dc14f4`
- `f0992b6` ancestor check: exit 0
- Initial `git status --porcelain=v1 --untracked-files=all`: empty (captured before evidence additions)
- All target absolute paths begin with `C:\Users\rybow\QuantFlow-Ontology\`.

## Required preflight receipt

Log: `logs/01-preflight.log`
Log SHA-256: `1A82FFED5859FC50C9CFAB7FEE0690C16ACD18F42957A9224FCC72EA7D1A4688`
The log records `HEAD == BUILD_BASE_SHA`, status count `0`, the exact tracked denominator, all 17 target bytes and SHA-256 values, all three ignore rules, and `PRODUCT_PROCESSES=[]`.

## Tracked denominator

`git ls-files 'collab-electron/.package-staging-test/**'` returned exactly these 14 rows:

```text
collab-electron/.package-staging-test/species/hermes/dock-profiles.json
collab-electron/.package-staging-test/species/hermes/launch.json
collab-electron/.package-staging-test/species/hermes/packed/hermes.aospkg
collab-electron/.package-staging-test/species/hermes/packed/hermes.meta.json
collab-electron/.package-staging-test/species/hermes/tools-allowlist.json
collab-electron/.package-staging-test/tools/qf-proof-agent/dock-profiles.json
collab-electron/.package-staging-test/tools/qf-proof-agent/launch.json
collab-electron/.package-staging-test/tools/qf-proof-agent/packed/qf-proof-agent.aospkg
collab-electron/.package-staging-test/tools/qf-proof-agent/packed/qf-proof-agent.meta.json
collab-electron/.package-staging-test/tools/qf-proof-agent/packed/qf-proof-agent.mjs
collab-electron/.package-staging-test/tools/runtime-proof/dock-profiles.json
collab-electron/.package-staging-test/tools/runtime-proof/launch.json
collab-electron/.package-staging-test/tools/runtime-proof/packed/qf-toolloop.aospkg
collab-electron/.package-staging-test/tools/runtime-proof/packed/qf-toolloop.meta.json
```

## Target bytes and SHA-256

| Target | Bytes | SHA-256 |
|---|---:|---|
| `collab-electron/.package-staging-test/species/hermes/dock-profiles.json` | 729 | `EE738B213FCB57260B2DC05F2D64A14DB90745C5598B48476EED98CBCDC33152` |
| `collab-electron/.package-staging-test/species/hermes/launch.json` | 211 | `DB349C1C2B294464A135254AD9060876139D857C9BBE5695E5BB267EA97EDFD2` |
| `collab-electron/.package-staging-test/species/hermes/packed/hermes.aospkg` | 23217 | `72DF9FC47735F5E65190D6EF2BBACB03D9C24B9406D8D51F83E7DD9F8BCD8D95` |
| `collab-electron/.package-staging-test/species/hermes/packed/hermes.meta.json` | 501 | `E0D866E733AFE6E16F866D2FDC48D2866C6947169B91BE4DDE5F1F949DF25F8C` |
| `collab-electron/.package-staging-test/species/hermes/tools-allowlist.json` | 243 | `742F2F72166A06924BE05747C6537F16A48883B390404948B26A0853F51EDAE1` |
| `collab-electron/.package-staging-test/tools/qf-proof-agent/dock-profiles.json` | 575 | `3866BDD388A64FE20A755A16289847CD124E709076E460DF064EA96EFA7805F9` |
| `collab-electron/.package-staging-test/tools/qf-proof-agent/launch.json` | 169 | `2F2934F4C3745B7423465F3B3EC8292AA915810E527DB38AC9CA0F159BFF275E` |
| `collab-electron/.package-staging-test/tools/qf-proof-agent/packed/qf-proof-agent.aospkg` | 44 | `12DF151804E5A3F402D6C553DBACC0DFA610992FE0881301480EF62887FE15AF` |
| `collab-electron/.package-staging-test/tools/qf-proof-agent/packed/qf-proof-agent.meta.json` | 234 | `A5050269B71E2626261E010E6B7CF802F8F06A1965B3F2A87BC05AA97ACC1402` |
| `collab-electron/.package-staging-test/tools/qf-proof-agent/packed/qf-proof-agent.mjs` | 3453 | `38C75FFACA66AC2AB40AC633FCCEAF140834E10419976940021CE0062D71182D` |
| `collab-electron/.package-staging-test/tools/runtime-proof/dock-profiles.json` | 300 | `AAA4CDE80C24275C7C12FED3D2A21EA0D966E5FFE72D5A5D27D50EA57F698661` |
| `collab-electron/.package-staging-test/tools/runtime-proof/launch.json` | 50 | `67D21A710620BE94EBECE6981EBE3409CD97184C6358E1A52F79F8C9AF386BE1` |
| `collab-electron/.package-staging-test/tools/runtime-proof/packed/qf-toolloop.aospkg` | 22707147 | `A41C91A4C0E27776BBA630995A513B823A3B28BBFAD707FCFE89AB8C6E642AC6` |
| `collab-electron/.package-staging-test/tools/runtime-proof/packed/qf-toolloop.meta.json` | 85 | `8F3BA524895014496656A93A0CF216F6DB7C3B7F012DE6FF00F2467D96551C97` |
| `docs/goals/atlas-delete-authority/goal.md` | 12732 | `0C77F43A0ECB9170553A34AABA3A19AC29AD6F22F5CBAB92EC9BC9DCC37FCC77` |
| `docs/goals/atlas-delete-authority/state.yaml` | 5144 | `55C968B26B8D92AAB76B2E7035E3B4CCD5D586929142D358B4EE4E255ADC4A9B` |
| `qf-atlas/atlas-diff.json` | 679 | `1C59F23B02346B40EF65FC33F881D5739BA9EC2973CE44C7F282243038DF810C` |
| **Total** | **22736186** | — |
```

## Ignore rules

The exact `git check-ignore -v -- <literal>` result for each ignored target was:

```text
.gitignore:10:docs/*	docs/goals/atlas-delete-authority/goal.md
.gitignore:10:docs/*	docs/goals/atlas-delete-authority/state.yaml
.gitignore:68:qf-atlas/atlas-diff.json	qf-atlas/atlas-diff.json
```

## Consumer search

Log: `logs/02-consumer-search.log`
Log SHA-256: `6B07989A65C1C11D2F8FF2927A55667FAC44C10D482F073A4026FF0807DC4693`

The exact `git grep` search returned these historical evidence mentions. Each is classified as `falsifier` because it records Atlas generation/falsifier output; none is a live consumer, constructed target path, or `.package-staging-test` match:

```text
falsifier | docs/orders/evidence/r16/BUILD-REPORT.md:425:wrote qf-atlas/atlas-diff.json
falsifier | docs/orders/evidence/r16/BUILD-REPORT.md:430:generated projections committed with the candidate. `atlas-diff.json` is
falsifier | docs/orders/evidence/r16/BUILD-REPORT.md:662:wrote qf-atlas/atlas-diff.json
falsifier | docs/orders/evidence/r16/BUILD-REPORT.md:822:wrote qf-atlas/atlas-diff.json
falsifier | docs/orders/evidence/r16/BUILD-REPORT.md:827:added. atlas-diff.json is ignored and was not staged.
falsifier | docs/orders/evidence/r16/BUILD-REPORT.md:1418:semantic code was changed. `atlas-diff.json` is ignored and was not staged.
falsifier | docs/orders/evidence/r16/BUILD-REPORT.md:1714:wrote qf-atlas/atlas-diff.json
```

The exact scoped `rg` search returned no matches (`rg-exit=1`, the standard no-match result). G1 therefore found no consumer.

## Atlas before deletion

### `03-atlas-before-check.log`

- Command: `bun qf-atlas/generate.mjs --check`
- Checked SHA: `57fc4ff711848bbb7f668f608e7478d407dc14f4`
- Exit code: `0`
- Log SHA-256: `12C38066F3E3AF84B8A4D3D129EA280D0E81922DDE9B04C14DB637FE3650CD72`
- Full current line: `qf-atlas: current — 439 files, 126 channels, 13 strip candidates`

### `04-atlas-before-ratchet.log`

- Command: `bun qf-atlas/ratchet.mjs`
- Checked SHA: `57fc4ff711848bbb7f668f608e7478d407dc14f4`
- Exit code: `0`
- Log SHA-256: `2D9EEF0F257E146DE36E9FC7E5793A628D91F7E09A1CB5AFD4B7CBF71E8F79F4`
- Full ratchet line: `baseline: 3 entries · HARD RED: 0 · unexplained coverage: 0 · undecided w/o blocker: 0 · AMBER (visible, non-blocking): 20 · undecided: 42`

## Dock inventory before deletion

Log: `logs/05-dock-inventory-before.log`
Log SHA-256: `C2586C3D8E078B97F6D07A334ED3708C6D4715B794D9C1AC440E60F0A3F7A895`
Command: `bun qa/run.ts dock-production-inventory`
Exit code: `0`

```text
dock-production-inventory: production=[{"manifest":"species/hermes/dock-profiles.json","id":"hermes-research-director","role":"orchestrator"},{"manifest":"species/hermes/dock-profiles.json","id":"hermes-worker","role":"worker"},{"manifest":"species/hermes/dock-profiles.json","id":"hermes-worker-2","role":"worker2"},{"manifest":"species/hermes/dock-profiles.json","id":"hermes-critic","role":"critic"},{"manifest":"species/claude-code/dock-profiles.json","id":"claude-code-orchestrator","role":"claude-orchestrator"},{"manifest":"species/claude-code/dock-profiles.json","id":"claude-code-worker","role":"claude-worker"}] qaContainsClaudeCodeUngranted=true
```

The before production inventory is the six-element ordered JSON array above and `qaContainsClaudeCodeUngranted=true`.
