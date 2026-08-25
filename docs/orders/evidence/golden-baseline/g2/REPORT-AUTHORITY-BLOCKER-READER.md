# G2 report-authority blocker — fresh semantic Reader

Reader task: `01a0379c-af16-7fc0-b059-0667babd2d16`

Verdict: **Outcome B — pause G2 and route the semantic repair to G9.**

Plain meaning: an ordinary completed agent response is being mislabeled as a
governed Report. The Kernel correctly refuses it because no independent
Evaluation exists yet.

## Evidence

- `START_HERE.md` fixes the order `Artifact → Critic → Evaluation → Report`.
- `qf-kernel-schema/golden/ONTOLOGY.md` identifies ordinary completion output
  as the canonical result `trajectory` Artifact.
- `collab-electron/src/main/ontology-gateway.ts` already publishes ordinary
  session output as `kind: "trajectory"`.
- `collab-electron/src/main/agent-host.ts` is a live completion path and calls
  `writeAgentReportArtifact()`.
- `collab-electron/src/main/agent-artifact-writer.ts` hard-codes
  `kind: "report"` without `evaluation_id`.
- `packages/qf-kernel/src/create.ts` correctly requires a supporting,
  independently linked Evaluation for every Report.
- `packages/qf-kernel/src/governed-review.ts` is the accepted path that creates
  the Evaluation first and publishes a Report only after a supporting verdict.

The item-6 receipt is `logs/21-matrix-06-artifact-root-helper.txt`, SHA-256
`553F43834222DD82191BF2BA0543E175699B50CB938EA7F3AAD1A242A766BC8D`.
It proves the Windows install seam is repaired and the live writer is rejected
at `publish_artifact report requires evaluation_id`.

## Ruling

G2 cannot inject a fake Evaluation, relabel only its fixture, skip the positive
writer/root/hash proof, or weaken the exhaustive publisher scan. The defect is
production-bearing and ADR-0004 assigns current Report/result authority to G9.
G2 remains paused with its working diff preserved until a separately authorized
and independently verified G9 prerequisite establishes:

- ordinary completion publishes one durable `trajectory` Artifact;
- only the governed review path publishes a `report` after a supporting
  independent Evaluation;
- unsupported, incomplete, and self-review lineage remains red;
- artifact-root storage/hash and publisher exhaustiveness can run to PASS.

The Reader answered the protocol questions YES/YES for that bounded route:
each acceptance gate has an explicit falsifier, and ordinary trajectory output,
governed Report authority, G8 proof repair, and G2 residue removal each retain
exactly one meaning.
