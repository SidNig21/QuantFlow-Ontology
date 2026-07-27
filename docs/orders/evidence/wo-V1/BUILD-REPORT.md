# WO-V1 — build report

> **In plain terms:** the research ledger now renders itself into an Obsidian vault as ordinary
> markdown notes — one folder per object type, one note per object. An artifact's body is shown
> **only** when the file still on disk hashes to the value that was recorded when it was published;
> if a byte changed, you get a mismatch banner instead of the text. The vault is written to and never
> read from: nothing you type in Obsidian can travel back into the ledger. Your `_Doctrine/` folder,
> your `README.md` and `.obsidian/` are never touched — and that is now proven structurally, not by
> luck.

| | |
|---|---|
| Branch | `wo-V1` at `0cbf6f7`, from `main` at `28c56c7` |
| Builder | Cursor CLI, `cursor-grok-4.5-high` (founder seat constraint) — build + one rework round |
| Checked by | Claude Fable 5 seat — wrote none of the deliverable code |
| Suite | **20 gates, 20 PASS, `GATE_RUNNER_EXIT=0`**, unpiped, machine verified quiet |
| Status | **awaiting independent verification** |

## What shipped

`tools/qf-vault-projection/` — a read-only consumer of the Kernel:

- **D1** `openKernel(..., { readonly: true })`; refuses without `QF_KERNEL_DB` / `QF_VAULT_ROOT`
- **D2** iterates `schema.objects`, one folder per type, `<id>.md` per object, `queryObjects(..., null)`
- **D3** `contentHash(bytes at storage_ref)` compared against the `content_hash` column
- **D4** links rendered as `[[wikilinks]]` via `getLinks`
- **D5** sorted by `(created_at, id)`; no run timestamps, so output is byte-stable across runs

## Measured by the checking seat

```
bun qa/run.ts --all        ->  20 PASS / 0 FAIL / GATE_RUNNER_EXIT=0
```

Static claims re-checked at source, not taken from the builder's report:

| Claim | Result |
|---|---|
| Raw `INSERT INTO links` removed from fixtures | only remaining one repo-wide is the Kernel's own write path, `packages/qf-kernel/src/links.ts:160` |
| Law E exemption out of the shipped package | entry is `qa/gates/vault-projection/fixture-seed.ts` |
| `tools/qf-vault-projection/` on the allowlist | **no** — shipped package carries no exemption |
| Raw SQL anywhere in the shipped package | none |

## The reserved-path question, and the good answer

G3 plants `README.md`, `_Doctrine/keep.md` and `.obsidian/app.json` and proves they survive. But the
projector's clear loop is unconditional and has **no denylist**:

```ts
const ownedFolders = schema.objects.map((o) => o.name);
for (const typeName of ownedFolders) {
  rmSync(join(vaultRoot, typeName), { recursive: true, force: true });
}
```

So the checking seat asked whether those paths survive because something *forbids* them, or only
because no object type happens to be named that — the one-source-two-sides pattern again. Probed
directly against a fixture vault:

```
ACCEPTS_NAME[_Doctrine]=false  (defineObject rejected: Object name "_Doctrine" must be snake_case)
ACCEPTS_NAME[.obsidian]=false  (defineObject rejected: Object name ".obsidian" must be snake_case)
```

**The protection is structural and upstream of the projector.** `defineObject` enforces snake_case,
so no schema object can ever be named after a leading-underscore or dotfile path. This is stronger
than a denylist would have been, and it is worth stating explicitly because the current gate does not
prove it — G3 would stay green either way.

## FINDING — the first real projection will not land where the founder expects

Not a safety defect; a collision of expectations, found by reading the real vault (names only, no
content, nothing written).

```
founder vault today:   Artifacts   Runs   Sessions   _Doctrine   README.md
projector will create: agent_definition agent_session artifact competitor connection dataset
                       environment evaluation execution_environment hypothesis instrument
                       market_event mission policy quote result run strategy task ticket tool
                       venue workspace          (23 folders)
```

The filesystem is case-sensitive, so `Artifacts/` and `artifact/` are different directories. **No data
is lost.** But the founder's three existing folders are not the projection targets — they will sit
untouched and orphaned beside 23 new lowercase ones. Whoever created `Artifacts/`, `Runs/` and
`Sessions/` was anticipating a projector that fills them, and this is not that projector.

For the architect to rule on: rename the vault folders, add a type→folder display mapping, or accept
lowercase snake_case folders as the vault's shape.

## Baits

**Re-run independently by the checking seat**, editing shipping code. Verbatim:

```
G2(d) bait applied by checking seat
=== G2(d) BREAK (checking seat) ===
vault-projection: D1 env refusal…
vault-projection: G1…
vault-projection: G2…
vault-projection FAIL: G2 assertion 2: edited bytes must not render as body
G2d_BREAK_EXIT=1
=== restored; tree clean? ===
RESTORE_CLEAN_EXIT=0
```

The restore is `git checkout --` against the committed tree, and `git status --short` printed nothing
after it, so the green side is the 20/20 `--all` above at the identical tree state.

**Run by the builder.** These are quoted from Cursor's own terminal recordings on disk
(`~/.cursor/projects/.../terminals/*.txt`) — the recorded command and its output, not the model's
prose summary. The checking seat did **not** re-run these four:

| Bait | Reddened on |
|---|---|
| **G1(c)** add `readdirSync` to `project.ts` | `G1(c): project.ts must not call directory-listing APIs` |
| **G2(c)** disable the hash comparison (`if (false && ...)`) | `G2 assertion 2: edited bytes must not render as body` |
| **G4(b)** `queryObjects(..., 100, ...)` instead of `null` | `G4: expected 107 session notes, got 100 (truncation?)` |
| **G5** hand-list `["artifact","agent_session","run"]` | `G5: fixture schema must produce experimental/ folder` |

**G2(d) is the one that mattered most.** Replacing the real comparison with `id === content_hash` is
the forged-assertion class — an assertion whose two sides come from the same source, so the bait
cannot separate them — that this repo has shipped four times this week. It reddens.

**Declared not run by the builder, and still not run:** G3(a) widen write scope, G3(b) rewrite
README, G4(a) inject a run timestamp. G3(b) is the one guarding the founder's real vault; the
snake_case probe above covers the same ground from a different angle but is not a substitute.

## FINDING — logged, not fixed: a gate that punishes stating its own rule

G1(c) enforces "no `readdir`/`stat`/`exists`" as a word-boundary grep over the whole of `project.ts`:

```ts
/\b(existsSync|statSync|lstatSync|accessSync|exists|stat)\b/.test(projectSrc)
```

The bare English words `exists` and `stat` match **inside comments**. The file therefore cannot
document the rule it obeys. The scar is visible at `project.ts:4-5`, where two overlapping sentences
say the same thing and the second is contorted to dodge the banned words. The builder disclosed this
itself as the defect it thought the order was hiding, and it was right to.

It also weakens the check in the other direction: a text grep over `project.ts` alone would miss a
helper module that does the `stat` and gets imported. Left exactly as found so the architect sees the
artifact rather than a cleanup.

## FINDING — logged, not fixed: this gate costs six minutes a run

`packages/qf-kernel/src/db.ts:71` sets only `PRAGMA foreign_keys = ON` — no `journal_mode`, no
`synchronous` — so SQLite runs at its defaults (rollback journal, `synchronous = FULL`). G4's fixture
is 107 sessions, each seeded as its own transaction, on a dm-crypt-over-SATA root filesystem. That is
several fsyncs per row and roughly 1.5 s of pure disk wait each.

Consequence: one gate run is ~6 minutes, and a proper break→red→restore→green bait is ~11. The five
baits above cost about 55 minutes of wall clock. This gate is an order of magnitude more expensive
than anything else in the suite and will hurt the first time CI runs two jobs at once.

`journal_mode = WAL` plus `synchronous = NORMAL` **on fixture databases only** would cut it to well
under a minute without touching the real Kernel's durability guarantee.

## FINDING — the gate cannot be run twice concurrently

Fixtures live at a fixed path inside the package (`PKG_ROOT/.gate-fixtures`, `gate.ts:44`) and the
gate wipes that root at start (`gate.ts:47`). Two simultaneous runs delete each other's fixtures
mid-flight. This is not theoretical — the checking seat triggered it by running the suite while the
builder was live, producing a spurious `unable to open database file` at G3 and sending the builder
into a debugging cycle chasing a failure that came from outside its process. Every other gate in the
suite uses `mkdtempSync` under the system temp directory. The builder's note says `/tmp` is not
writable in sandboxed seats, which is a real constraint, but a per-run subdirectory would solve it
without the shared wipe.

## Honest limits of what is proven

- **No live projection against the founder's real vault.** The order asks for it; the standing
  reminder forbids pointing `QF_VAULT_ROOT` there from fixture work. **Not run.** The folder-collision
  finding above was derived from directory *names* only.
- **`TraceContext` is not exported from `qf-kernel`.** The builder worked around it with a local
  `{ trace_id, span_id }` helper rather than widening the kernel API — correct scope discipline, but
  it means the gate's trace values are not the Kernel's own type.
- **Four of five baits are the builder's, not mine.** Recorded by Cursor rather than narrated by the
  model, which is better than prose, but it is not the same as re-running them. Only G2(d) was
  re-run by the checking seat.
- 19 of the 20 gates predate this rung; this report claims nothing about them.

## For the verifier

```bash
git fetch origin wo-V1
git worktree add --detach /tmp/verify-v1 origin/wo-V1
cd /tmp/verify-v1 && bun qa/run.ts --all     # unpiped, $? on its own line, NO other agent running
```

Then the parts the suite cannot prove:

1. **Re-run G3(b)** — the rewrite-README bait the builder skipped. It is the assertion standing
   between this tool and the founder's `_Doctrine/`.
2. **Rule on the folder collision** — 23 lowercase folders beside `Artifacts/`, `Runs/`, `Sessions/`.
3. **Rule on G1(c)** — a static check that forbids its own vocabulary.
4. **Decide whether fixture DBs may use WAL**, which makes every future bait on this gate affordable.
