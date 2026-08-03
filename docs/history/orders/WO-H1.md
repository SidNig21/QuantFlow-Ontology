# WO-H1 — Debt register audit and sweep (housekeeping, off-ladder)

> **Status:** open, cuttable · **Branch:** `wo-h1` · **Depends:** none · **Ladder:** none — this is
> **not** a rung. It runs beside the ladder and blocks nothing.
> **Scope shape:** `qa/` and `docs/ROADMAP.md` only. **Zero `qf-kernel-schema/src` changes. Zero
> `packages/qf-kernel` changes. Zero `collab-electron` changes. Zero schema changes.**
> Builder reads `AGENTS.md`, then `START_HERE.md`, then this file end to end before any edit.
> Standing rules inherit: cold-state, gate falsification (bait → red → restore → green, both
> outputs in the report), no credentials, commit from a worktree, `PROTOCOL.md` roles.

> **Seat disclosure.** Authored 2026-07-25 by the session that verified WO-102. That seat may
> **not** verify this order — it wrote it. A different seat verifies, per `PROTOCOL.md`.

## In plain terms

The project keeps a numbered list of known-but-unfixed problems so they don't get rediscovered.
The list has grown to 22 entries and nobody has ever audited it. This order re-measures every open
entry against the actual code, fixes the two that are genuinely small and safe to touch right now,
and corrects the ones whose descriptions have gone stale. It changes no product behaviour.

**If it goes wrong:** the register keeps drifting, entries that are already fixed keep reading as
open, and the list gradually stops being read at all — at which point it is a graveyard rather
than a ledger.

## Why this order exists

`ROADMAP.md`'s debt register is a **document with no duty attached to it**, which `PROTOCOL.md`
already names as the rot condition: *a stale entry read exactly like a current one.* `NEXT.md` and
`VERIFYING.md` both got rotation duties after rotting. The register never did.

**This was measured, not assumed.** Debt #9 asks for a *"compact golden + determinism check."*
The determinism half **already exists and is fully green** — four tests at
`qf-kernel-schema/src/generate.test.ts:38-54`, one per generator. Nobody noticed, because nothing
re-reads the register. That is one confirmed stale entry found by spot-check; this order checks the
rest.

> **Re-based 2026-07-25 after WO-103 merged.** This order was written while WO-103 was open, so
> several of its facts referenced a `main` that no longer exists. Corrections are struck through
> inline below and in the gates. **Re-measured against the post-merge `main`:** register entries
> **22**, struck through **4**, open **18** — all unchanged, because WO-103 did not touch the debt
> table. Gates **12 → 13**. Treat every number below as testimony and re-measure it anyway; that is
> literally this order's deliverable, and an order that asks you to audit stale claims while
> carrying its own is the joke that writes itself.

## Context (measured 2026-07-25 against `main` at `235d029` — cite these, do not re-estimate)

| Fact | Value | Where |
|---|---|---|
| Register entries | **22** | `docs/ROADMAP.md`, "Known debt" table |
| Struck through (killed) | **4** (#0, #1, #2, #5) | same |
| Open | **18** | same |
| Trigger-gated (not schedulable) | **4** (#17, #18, #19, #20) | same |
| #9's determinism half | **already done, 4 tests** | `qf-kernel-schema/src/generate.test.ts:38-54` |
| #10's duplication | **two ~28-line blocks** | `qa/run.ts:77-104` (schema) and `qa/run.ts:147-172` (kernel) |
| #12's gate | **123 lines** | `qa/gates/no-canvas-domain-writes.ts` |
| #13 | **not a code task** — a founder menu click | `docs/ROADMAP.md:61` |

**The sweep is deliberately small.** Most open debts are *not* trivial, and the audit below must
say so rather than force them. Pre-measured exclusions, each with its reason:

| # | Why it is NOT swept here |
|---|---|
| 3 | `_zod` internals → `FieldSpec` IR is a real refactor of `define.ts`/`sql.ts` — both are WO-103/WO-104 territory |
| 4 | `stateFieldName` → explicit `stateField` is a **schema-surface change** (regenerates `golden/`). ~~all 3 call sites are in `define.ts`, which WO-103 edits~~ — **the collision reason expired when WO-103 merged (2026-07-25), but the exclusion stands on the schema-surface reason alone**, which this order forbids outright. Note WO-103 added a *fourth* consumer, `qf-kernel-schema/src/transition-meta.ts`, which derives state fields from it — audit the entry against that, do not sweep it |
| 9 | determinism half **already done**; the "compact golden" half collides with WO-104, which rewrites the whole tool surface |
| 11 | `validate.ts` signature touches `packages/qf-kernel/src/execute.ts:6` and raises a real question (does `execute()` narrow, or does the boundary stay permissive?). ~~WO-103's core file~~ — **that collision expired on merge; the open design question is the live reason and it is not a housekeeping call.** WO-103 made it sharper, not simpler: `execute()` now has a third branch (links) and a shared creation-policy layer. Audit and route; do not sweep |
| 13 | founder action, not builder work |
| 15, 16 | routed to WO-007, which is founder-gated on the visual pass |
| 17, 18, 19, 20 | trigger-gated by design. **Do not touch.** A trigger-gated debt is not an overdue task |

## Deliverables

### 1 · Audit every open entry — this is the main deliverable

For each of the 18 open entries, re-measure the claim against current code and record one line in
your report:

- **STANDS** — still true, still correctly routed. Cite `path:line` proving it still reproduces.
- **STALE** — the description is now wrong (numbers moved, partially fixed, file renamed). Say
  what is actually true and cite it.
- **DONE** — fully fixed by some later order and nobody closed it. Cite the proof.
- **MISROUTED** — its "lands in" points at a rung that no longer exists or no longer touches it.

**A `path:line` citation is required for every verdict.** An audit line without one is an
assertion, and this repo has paid for those five times. If you cannot cite it, the verdict is
"could not measure" and you say so.

### 2 · Correct the register in place

Rewrite the entries your audit found STALE or DONE. Strike through DONE entries in the existing
`~~killed~~` style with the order that killed them, and correct STALE text to what you measured.
**Do not delete history** — the register's value is that old entries stay readable.

Known correction, already measured: **#9's determinism check exists**
(`generate.test.ts:38-54`). Narrow the entry to the compact-golden half and re-route it to WO-104,
which regenerates the tool surface anyway.

### 3 · Sweep #10 — extract the duplicated package gate

`qa/run.ts:77-104` and `qa/run.ts:147-172` are the same install-then-test sequence with different
`cwd` and label. Extract one helper — the debt names it `bunPackageGate` — and call it from both.

**Behaviour must not change:** same commands, same `--frozen-lockfile`, same inherited stdio, same
per-gate error message shape. Prove it by running `bun qa/run.ts schema` and `bun qa/run.ts kernel`
before and after and pasting both.

### 4 · Sweep #12 — harden the Law E canvas gate

`qa/gates/no-canvas-domain-writes.ts` matches property-key syntax only, so a dot-assignment
(`tile.content_hash = x`) evades it. Realistic shapes are already caught — this closes the
measured hole rather than a hypothetical one.

Extend the scan to catch dot-assignment of a domain field on a canvas object. **Keep the existing
matches working**; this is an addition, not a rewrite.

## Declared dependencies (do not discover these at commit time)

- ~~`docs/ROADMAP.md` is shared with WO-103; merge WO-H1 first if both are open.~~ **Moot as of
  2026-07-25: WO-103 is verified and merged.** You branch from a `main` that already contains it.
  WO-103 added a status paragraph to the P2 section of `ROADMAP.md` and **did not touch the debt
  table** — so the register you audit is unchanged, but re-measure rather than trusting this line.
- **No gate may be weakened to make a sweep pass.** If hardening #12 makes an existing gate red,
  that is a finding to report, not a threshold to relax.
- **`qa/run.ts` is the gate runner itself.** A mistake here disables the whole safety net silently.
  That is why G1 exists.

## Gates

**G1 · The extracted helper still fails (builder-run).** The refactor in deliverable 3 must not
turn a real gate into a no-op. Bait it: break something the `schema` gate catches → `bun qa/run.ts
schema` goes **red** → restore → **green**. Then the same for `kernel`. Both transcripts, both
directions. *A gate runner that cannot report failure is worse than no gate runner, because it
reports success.*

**G2 · The hardened canvas gate catches the shape it was blind to (builder-run).** Plant a
dot-assignment of a domain field on a canvas object → `no-canvas-domain-writes` goes **red** →
remove → **green**. Paste both. Also confirm the previously-caught shapes still go red.

**G3 · Suite green, cold (verifier-run).** `bun qa/run.ts --all` from a fresh worktree, exit code
stated explicitly. **Do not pipe the runner's output** — a pipe reports the pipe's exit code, not
the runner's (measured error, WO-102 verification). Expect ~~12/12~~ **13/13 and no count change**
(corrected 2026-07-25 — WO-103 merged after this order was written and added the `typecheck` gate;
measured `bun qa/run.ts --list` → 13). This order adds no tests to the schema or kernel suites, and
a change there means something was touched that should not have been.

## Evidence required in the report

The full 18-line audit table with a citation per verdict · before/after transcripts for
deliverables 3 and 4 · G1 bait both gates, both directions · G2 bait both directions · G3 exit
code · confirmation that `qf-kernel-schema/src`, `packages/qf-kernel` and `collab-electron` are
untouched (`git diff --stat main...wo-h1`) · one paragraph on every place you exercised judgment
where this order was silent.

**If your audit finds an entry this order told you to exclude is actually trivial, say so — do not
fix it.** The exclusion list above is a measurement and may be wrong; correcting it in the report
is worth more than acting on it.

## Out of scope (hard)

Any `qf-kernel-schema/src` change · any `packages/qf-kernel` change · any `collab-electron` change ·
any schema, `golden/`, or migration change · debts #3, #4, #9-compaction, #11, #13, #15, #16 ·
**any trigger-gated debt (#17, #18, #19, #20)** · adding new debts for things you notice (log them
in the report; the architect routes them) · `docs/ONTOLOGY_SCHEMA.md`, which is debt #21 and
edit-by-order-only.
