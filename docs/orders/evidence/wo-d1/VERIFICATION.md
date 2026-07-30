# WO-D1 — verification PASS · 2026-07-30

**In plain terms:** QuantFlow now remembers which exact Dock profile created every new agent
session, even when several profiles share the same runtime, and the shipped app can safely upgrade
the founder's existing database without guessing old identities.

**Verdict:** **PASS** at `4617e06c5e043b90ef88d6391b35ba95df08b55d`.
Independent checking used fresh detached worktrees and no builder transcript as evidence. WO-D1
needed **zero semantic rework rounds after two cold integration repairs**: `dc77729` made the new
gate install the linked Kernel package it imports, and `4617e06` classified the frozen compatibility
authority and comparison-only D1 gate correctly in `observe-door`. Neither repair changed shipped
runtime behavior.

## Canonical cold release receipt

The exact passing commit began with no inherited `node_modules` or build output:

```text
$ bun qa/verify-release.ts
release: runId=59454ec3-6640-49f3-ac2f-3243d07e126a
...
PASS  observe-door
PASS  agent-path
PASS  dock-profile-identity
PASS  package-closure
...
PASS  vault-projection

PASS  release-verification
EXIT=0
```

This single command completed the frozen Electron install, bare-environment unit suites, production
build, unsigned Linux package, and the complete QA board. The verifier worktree remained detached at
the exact commit and tracked-clean.

## Cold integration repair history

The semantic implementation did not enter a rework round, but two verifier-only cold failures were
repaired before the canonical PASS:

1. At `3cb3eee`, a brand-new worktree running `bun qa/run.ts dock-profile-identity` exited 1 with
   `Cannot find package 'qf-kernel-schema' from 'packages/qf-kernel/src/upgrade.ts'`. Commit
   `dc77729` changed only the D1 gate launcher so the linked Kernel package installs its own declared
   dependency before the gate runs.
2. At `dc77729`, production build and package closure passed, but canonical QA exited 1 because
   `observe-door` treated the frozen pre-D1 SQL as live observation code and the D1 comparison gate
   as a serving surface. Commit `4617e06` changed only the scanner's two narrow, explained
   allowlists. The exact-commit canonical rerun then exited 0.

Neither rejected state was merged, and neither repair changed schema, Kernel, Electron, runtime,
package inventory, dependency manifests, or generated output.

## Profile identity and upgrade receipts

The independently run `dock-profile-identity` gate printed:

```json
{
  "profileA": "dock-profile-a",
  "profileB": "dock-profile-b",
  "sessionLinks": {
    "a": "dock-profile-a",
    "b": "dock-profile-b"
  },
  "unknownDefinitionResidue": "none",
  "legacyUnlinkedSessions": 2,
  "upgradeRowCounts": {
    "before": { "definitions": 2, "sessions": 2, "links": 15, "events": 3 },
    "after": { "definitions": 2, "sessions": 2, "links": 15, "events": 3 }
  }
}
```

The two definitions used different `runtime_profile` values and the same credential-free
qf-toolloop package. Identical presentation labels did not collapse their identities. Unknown
definitions, caller-supplied `spawned_from`, and a trigger-forced identity-link failure left no
session, link, or event residue. The real Node `node:sqlite` nested-transaction control passed, and
the production handler stayed at transaction depth one.

The frozen pre-D1 database upgraded once and classified current on its second attach. Historical
rows remained byte-equivalent apart from the ruled schema additions; the two sessions lacking
durable definition evidence remained visibly unlinked. Readonly attach reported exactly
`upgrade_required: "agent-profile-identity"` without changing bytes, mtime, rows, WAL, or SHM, and
the same detection succeeded from an isolated copy with no D1 upgrade SQL available.

Every required partial shape failed closed with `KernelUpgradeShapeError`: new column with old
links, new links with old column, stale metadata, missing metadata, fake substring, altered governed
table, missing `agent_definition`, missing `links`, lost old link kind, and infrastructure without
`schema_meta`. Each rejection preserved SHA-256, mtime, rows, and sidecar inventory. A deliberate
mid-upgrade SQL fault rolled the full schema and data back to the pre-D1 shape.

## Independent falsification transcripts

The verifier changed only a disposable detached worktree, restored after every bait, and finished
with `git diff --exit-code` equal to zero.

| Guard | Deliberate break | Red receipt | Restored receipt |
|---|---|---|---|
| required identity link | removed the production `spawned_from` append | `session A spawned_from mismatch []`; exit 1 | `PASS dock-profile-identity` |
| production callsite coupling | removed `agent_definition_id` from a real Electron admission call | `agent-host.ts:429 missing agent_definition_id`; exit 1 | Dock gate PASS and independent `agent-path` PASS |
| writable upgrade coupling | disabled `applyProfileIdentityUpgrade()` in `attachKernel()` | `post-upgrade shape is not current`; exit 1 | upgrade and second attach PASS |
| sole creation boundary | restored an exported `insertAgentSession`-style bypass | `insertAgentSession bypass still present in packages/qf-kernel/src/index.ts`; exit 1 | `PASS dock-profile-identity` |

The gate's ordinary green run independently repeated the unknown-definition, caller-supplied link,
forced link-writer rollback, frozen upgrade, idempotence, operator-only served-surface, and readonly
no-upgrade-file controls.

## Shipped SQL closure

The package inspector and an independent `@electron/asar` extraction both compared packaged bytes
with committed authority:

| ASAR path | Bytes | SHA-256 | Match |
|---|---:|---|---|
| `node_modules/qf-kernel-schema/golden/migration.sql` | 37,985 | `49c66c42caf72d0f1a7017777fd3e8bbe82d6d0716f5f8a0b6e953a3aaf1e6ab` | yes |
| `node_modules/qf-kernel-schema/compat/pre-d1-profile-identity.sql` | 37,432 | `935fb49c677f91c66da9624fbd2ce501b4f20fb60739acc11b0681a03181f807` | yes |
| `node_modules/qf-kernel-schema/golden/upgrades/0001-agent-profile-identity.sql` | 1,974 | `a0a4dc1259aa658cf1a4fe7e47585ed5f289d2963d3306b5d687ffbc8de2a768` | yes |

The copied-package control changed the ASAR inventory by exactly the D1 upgrade path and then failed
with:

```text
missing packaged SQL artifact:
node_modules/qf-kernel-schema/golden/upgrades/0001-agent-profile-identity.sql
```

## Prior blocker disposition

| Previously measured blocker | Independent result |
|---|---|
| Bun lost the Node control's piped stdout | fixed; the gate reads child buffers and the Node control passes |
| runtime classifier depended on a QA fixture absent from ASAR | fixed; frozen authority lives in and ships with `qf-kernel-schema/compat` |
| registry drift could mask partial upgrade shapes | fixed; exact structural classification runs first |
| “uninitialized” ignored links/events | fixed; infrastructure-only partial case rejects without mutation |
| missing-table and incomplete-metadata cases were absent | fixed; all are present and independently observed green |
| readonly proof still needed upgrade SQL | fixed; isolated no-upgrade-file readonly control passes |

## Judgment and limits

The frozen pre-D1 migration is compatibility authority, not a second mutable schema: it is an
immutable copy of the exact WO-CI2 generated shape, shipped only so runtime classification can make
an exact comparison. The D1 gate's direct `generateMcp()` call compares the complete generated
catalogue with the filtered served catalogue; it does not register or advertise tools. Those two
narrow facts justify the `observe-door` entries added by the second cold integration repair.

WO-D1 establishes Kernel identity only. It intentionally does not remove the hardcoded Peer Seats
catalogue or launch live definition-driven profiles; WO-D2 owns that next seam. No historical
identity was invented, no credential was read, and no bet or trade path was added.
