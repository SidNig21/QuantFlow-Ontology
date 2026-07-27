# WO-V1 — The reading vault (Kernel → Obsidian projection)

status: written, pre-build read pending — do not cut until the read record is appended
assignee: builder
depends: WO-104 (generated readers) — done, merged. **Not blocked by anything on the ladder.**
ladder: **off-ladder.** This is not one of the eleven doctrine rungs (`SCOPES.md`) and must never
be counted as one. It is founder-facing value that can land whenever it is worth having.

## Objective

Everything the Kernel records becomes readable in Obsidian — one way, hash-verified, and incapable
of corrupting the ledger.

## In plain terms

Right now the only way to see what your system recorded is to query a database or ask an agent. This
builds a vault at `~/Vaults/QuantFlow Ontology` that fills itself from the Kernel: every artifact,
session and run as a note, with the ontology's own links becoming Obsidian backlinks so the graph
view shows your actual research lineage.

**It is a projection, not a second copy of truth.** The Kernel writes to it; it never writes back. If
you delete the whole vault, nothing is lost — it regenerates.

**If it goes wrong:** either the vault becomes a second truth store that drifts from the Kernel, or
it renders content that no longer matches the artifact claiming it (the file on disk was edited after
publication), or it overwrites the founder's own notes.

## RULING — one direction, and hash-verified (architect, final)

**Ruled: the projection reads the Kernel and writes files. It never reads the vault, and nothing in
the vault is ever an input to anything.**

This is the One Rule applied literally: the Kernel owns truth, everything else is a projection or a
cache. A vault that fed anything back would be a second truth store — the failure this repo exists
to prevent — so there is no "sync", no "import", and no conflict resolution. Re-running the
projection is always safe and always produces the same result.

**Ruled: content is rendered only when its hash verifies.** Measured, and this is the crux:

```
artifact columns: id, created_at, kind, content_hash, storage_ref
sample storage_ref: /home/sidnig21/.collaborator/agent-artifacts/<uuid>.md
```

**The Kernel stores a pointer, not the bytes.** `content_hash` is the artifact's identity, but the
content lives at a filesystem path that can be moved, deleted, or **edited after publication.** So
before rendering any artifact body the projection recomputes the hash of the bytes at `storage_ref`
and compares it to `content_hash`:

- **match** → render the content.
- **mismatch** → render the note **without** the body, stating plainly that the file on disk no
  longer matches the published artifact, and showing both hashes.
- **missing** → render the note without the body, stating the file is gone.

**Never render unverified bytes as though they were the artifact.** A vault that silently shows an
edited file as the published artifact is worse than no vault: it launders a tampered file into
something that looks authoritative.

**Ruled: `_Doctrine/` is the founder's, and the projection never writes there.** Everything generated
goes in `Artifacts/`, `Sessions/`, `Runs/`. Anything else in the vault is untouched.

## Context — measured facts (verify before use)

| Claim | Where | Verified |
|---|---|---|
| Vault exists with the four folders and a README | `~/Vaults/QuantFlow Ontology` | ✅ created 2026-07-26 |
| Artifact stores a pointer, not bytes | `artifact` columns above | ✅ |
| Real Kernel today: 5 artifacts, 18 sessions, 2 species, 0 runs, **0 links**, 68 events | `~/.collaborator/dev/worktree-<id>/kernel.db` | ✅ |
| Generated readers exist and are schema-driven | `packages/qf-kernel/src/read.ts` — `getObject:64`, `queryObjects:81`, `getLinks:111` | ✅ |
| `queryObjects` supports unbounded reads and ordering | WO-106 D2 — `order`, `limit: null` | ✅ |
| `contentHash` helper exists | `packages/qf-kernel/src/hash.ts` | ✅ |
| 19 gates today | `bun qa/run.ts --list` | ✅ |
| Artifact kinds | `strategy_spec`, `code`, `result_set`, `report`, `trajectory` | ✅ |

**Honest note on the graph payoff:** `links` is **0** in the real Kernel today. Backlinks will be
sparse until WO-107b writes them. Build the link rendering anyway — it is a few lines given
`getLinks` — but do not sell the graph as this order's headline, and do not gate on link count.

## Deliverables

**D1 — the projector.** A script (`tools/qf-vault-projection/`) that reads the Kernel through the
**generated readers only** — `getObject`, `queryObjects`, `getLinks`. No hand-written SQL; that is
the second-implementation problem WO-106 just spent a rung deleting. Target vault path comes from
configuration (`QF_VAULT_ROOT`), and the projector **refuses to run** if the path does not exist or
contains no `README.md` — it must never create a vault somewhere unintended, and must never write to
a directory it did not expect.

**D2 — one note per object, generated from the schema.** Iterate `schema.objects`, not a hand-written
list of types, so a new object type gets notes with no new code — the same property WO-104 proved for
read tools. Frontmatter carries the object's fields; the body carries links. File naming must be
stable across runs (id-derived), so re-running rewrites rather than duplicates.

**D3 — artifact bodies, hash-verified.** Per the ruling. `report` and `strategy_spec` kinds inline
their content as markdown when the hash verifies; binary kinds link to `storage_ref` rather than
inlining. Mismatch and missing states are rendered as stated, never silently omitted.

**D4 — links become wikilinks.** Every row in `links` touching an object becomes a `[[…]]` in that
object's note, labelled with its `kind` (`produces`, `tests`, `evaluated_by`, `gates`, …), so
Obsidian's backlinks and graph reflect the ontology's real edges.

**D5 — idempotence.** Running the projector twice produces **byte-identical** output. Same discipline
as `golden/`: no timestamps-of-run, no nondeterministic ordering, no random ids in generated files.

## Acceptance gates

Every gate ships with a bait transcript: break it, show red, restore, show green.

**G1 — one direction, provable.** The projector never reads vault content. *Baits:* (a) place a file
in `Artifacts/` containing a fabricated artifact id and run the projector — the Kernel is unchanged
and the file is overwritten or ignored, never ingested; (b) grep the projector for any read of the
vault other than existence checks — a read of vault *content* is a defect.

**G2 — the hash gate.** Publish an artifact, then **edit the file at `storage_ref`**, then project.
The note must render **without** the body and state the mismatch, showing both hashes.
*Baits:* (a) the edit above → mismatch state, body absent; (b) delete the file → missing state;
(c) remove the hash check → the edited content renders as though genuine, proving the check is what
stops it. **Bait (c) is the point of this gate.**

**G3 — `_Doctrine/` is untouched.** Put a note in `_Doctrine/`, run the projector twice, and confirm
it is byte-identical afterwards. *Bait:* widen the projector's write scope to the vault root → red.

**G4 — idempotence.** Run twice on an unchanged Kernel; the second run produces **no diff**.
*Bait:* introduce a run-timestamp into any generated file → red.

**G5 — schema-driven, not hand-listed.** Point the projector at a fixture schema with an extra object
type and confirm notes appear for it **with no projector edit**.
*Bait:* hand-list the types → the fixture type produces nothing → red.

**G6 — full cold suite.** `bun qa/run.ts --all` in a worktree with zero `node_modules`, unpiped, `$?`
on its own line, no other agent on the machine. The projector's own gate registers as `vault-projection`.

## Report-back format

Per `PROTOCOL.md`. Full unedited gate output, every bait in break → red → restore → green form, and a
screenshot or file listing of the vault after a real projection against the founder's Kernel (5
artifacts, 18 sessions today).

## Out of scope

Writing anything back to the Kernel from the vault — ever, in any form, under any justification.
Obsidian plugins. Sync. Editing the founder's `_Doctrine/`. Publishing artifacts (that is WO-106b's
staging root, a different folder with a different purpose). Real market data (P4).
