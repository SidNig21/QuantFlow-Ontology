# Handoff — WO-106b & WO-V1

**For:** the architect · **From:** the checking seat · **Date:** 2026-07-27

| | |
|---|---|
| WO-106b | branch `wo-106b` @ `2730a00` — pushed, **not merged** |
| WO-V1 | branch `wo-V1` @ `e380a01` — pushed, **not merged** |
| Suite | **20 gates, 20 PASS, `GATE_RUNNER_EXIT=0`** — unpiped, quiet machine |
| Baits reddened | 11, all by editing shipping code |
| Findings open | 5, logged and deliberately not fixed |
| Debt closed | #25 (agent file-read sandbox) |

Both orders were built by Cursor seats and re-verified here. Evidence below is tagged by provenance,
because that distinction is the only thing a checking seat is for:

- **[seat]** — I ran it, at source, on a quiet machine.
- **[relayed]** — Cursor's own terminal recording (command + logged output), not the model's prose.
  I did not reproduce it.
- **[not run]** — nobody has run it. Named so it cannot be mistaken for proven.

---

## Rung one — WO-106b: the agent could read any file on the machine

An MCP agent could name any path and have its bytes copied permanently into the Kernel through
`publish_artifact`. It now publishes only from `QF_ARTIFACT_ROOT`, and when that variable is unset the
tool **does not appear at all** rather than appearing and refusing.

The constraint sits at the MCP serving boundary, not in the Kernel — deliberately. The founder's own
file-picker passes arbitrary paths by design, so a Kernel-wide rejection would have broken the desktop
button. `packages/qf-kernel` and `collab-electron` both have **zero diff**.

### Measured here **[seat]**

| Probe | With root | Without root |
|---|---|---|
| Tools served | 93 (24 action) | 92 (23 action) |
| `qf_publish_artifact` advertised | `true` | `false` |
| Direct `callTool` | succeeds in-root | fails |
| Kernel rows / events after refusal | 1 → 1, unchanged | |

Four escape attempts, all rejected: absolute path outside the root, `..` traversal, symlink escape,
and the prefix sibling.

**The prefix sibling is the one that matters.** With a root at `/tmp/artifacts` and a real file at
`/tmp/artifacts-evil/x`, a resolve-then-`startsWith` check walks straight out while looking correct.
The implementation uses `path.relative` against a root resolved once at startup.

### Both doors falsified **[seat]**

Fail-closed had to bind two independent paths: invocation through `register.ts` and discovery through
`discovery.ts`, which builds `tools/list` from the schema and never consults the registry.

```
bait: filter the tool from tools/list only, leave registerTool intact
  red    G3: callTool on unconfigured server should fail
bait: remove the path check entirely
  red    G1 absolute_outside: path outside root should be rejected
both restored
  green  publish-artifact-root PASS
```

### OPEN FINDING — the catalogue can lie in the other direction, and every gate stays green

WO-106b closed *callable but not advertised* — the security direction. The mirror is open.

Dropping `create_mission` from `registerActionTools` while leaving its advertisement intact leaves it
listed in `tools/list` while `callTool` returns `MCP error -32602`. **All four tool-plane gates pass.**

Control: dropping `start_run` instead *does* redden two gates — but only because those gates happen to
call it. Nothing asserts the property. Any action tool no gate exercises can go missing in silence.

The cause is structural and this rung did not create it: advertisement and registry are both derived
from the schema, so both agree with the schema, and nothing compares them to **each other**. An agent
discovering a tool from the catalogue and getting `-32602` is *declaration is not capability* at the
exact surface three rungs were spent making honest.

---

## Rung two — WO-V1: the ledger renders itself into Obsidian, and nothing comes back

A one-way projector: one folder per object type from `schema.objects`, one note per object. An
artifact's body renders **only** when the bytes still on disk hash to the `content_hash` recorded at
publish time; a changed byte yields a mismatch banner showing both hashes. The vault is never read,
listed, or probed, and nothing in it can travel back into the Kernel.

### Suite and the decisive bait **[seat]**

```
bun qa/run.ts --all      20 PASS / 0 FAIL / GATE_RUNNER_EXIT=0

bait G2(d): replace the hash comparison with String(row.id) !== publishedHash
  vault-projection FAIL: G2 assertion 2: edited bytes must not render as body
  G2d_BREAK_EXIT=1
restored, tree clean     (green side is the 20/20 above, same tree)
```

G2(d) is the bait worth the wall clock. Substituting `id === content_hash` for the real comparison is
the **one-source-two-sides** forgery — an assertion whose halves derive from the same place, so the
bait cannot separate them — that this repo has shipped four times this week. It reddens here.

### Four further baits **[relayed]**

| Bait, applied to shipping code | Reddened on |
|---|---|
| add `readdirSync` to `project.ts` | `G1(c): must not call directory-listing APIs` |
| disable the hash check (`if (false && …)`) | `G2 assertion 2` |
| drop `limit: null` | `G4: expected 107 session notes, got 100` |
| hand-list types instead of `schema.objects` | `G5: fixture schema must produce experimental/ folder` |

### GOOD NEWS — `_Doctrine/` is safe structurally, not by coincidence

The projector clears `join(vaultRoot, typeName)` for every schema object name, unconditionally, with
**no denylist**. G3 proves `README.md`, `_Doctrine/` and `.obsidian/` survive — but G3 would stay green
whether that was a rule or an accident, which is the same shape as the forged assertion above. So I
probed it directly **[seat]**:

```
ACCEPTS_NAME[_Doctrine]=false   defineObject rejected: name must be snake_case
ACCEPTS_NAME[.obsidian]=false   defineObject rejected: name must be snake_case
```

The protection is enforced at the schema layer, **upstream of the projector**: no object type can ever
be named after a leading-underscore or dotfile path. That is stronger than a denylist. Worth stating in
doctrine, because the gate does not currently prove it.

### OPEN FINDING — the first real projection will not land where the vault expects

Read from the real vault, directory names only, nothing written, nothing read from inside **[seat]**:

```
vault today        Artifacts   Runs   Sessions   _Doctrine   README.md

projector creates  agent_definition agent_session artifact competitor connection
                   dataset environment evaluation execution_environment hypothesis
                   instrument market_event mission policy quote result run strategy
                   task ticket tool venue workspace              (23 folders)
```

The filesystem is case-sensitive, so `Artifacts/` and `artifact/` are different directories and **no
data is lost**. But whoever created `Artifacts/`, `Runs/` and `Sessions/` was anticipating a projector
that fills them, and this is not that projector — they will sit orphaned beside 23 new lowercase
siblings.

### OPEN FINDING — a check that punishes stating the rule it enforces

G1(c) enforces "no `readdir`/`stat`/`exists`" as a word-boundary grep across the whole of `project.ts`:

```ts
/\b(existsSync|statSync|lstatSync|accessSync|exists|stat)\b/.test(projectSrc)
```

The bare English words match **inside comments**, so the file cannot document the rule it obeys. The
scar is visible at `project.ts:4-5` — two overlapping sentences, the second contorted to dodge the
banned words. Left exactly as found so you see the artifact rather than my cleanup.

It is also weak in the other direction: a text grep over one file would miss a helper module that does
the `stat` and gets imported.

### OPEN FINDING — one gate run costs six minutes, a proper bait costs eleven

`packages/qf-kernel/src/db.ts:71` sets only `PRAGMA foreign_keys = ON` — no `journal_mode`, no
`synchronous` — so SQLite runs at its defaults: rollback journal, `synchronous = FULL`. G4's fixture is
107 sessions, each seeded as its own transaction, on a dm-crypt-over-SATA root filesystem. That is
several fsyncs per row and roughly 1.5 s of pure disk wait each.

This gate is an order of magnitude more expensive than anything else in the suite.
`journal_mode = WAL` with `synchronous = NORMAL` **on fixture databases only** would cut it below a
minute without touching the real Kernel's durability guarantee.

### OPEN FINDING — the gate cannot be run twice at once

Fixtures live at a fixed in-package path (`PKG_ROOT/.gate-fixtures`) and the gate wipes that root on
start, so two simultaneous runs delete each other's fixtures mid-flight. I caused exactly this by
running the suite while the builder was live: it produced a spurious `unable to open database file` and
sent the builder into a debugging cycle chasing a failure that came from outside its own process. Every
other gate uses `mkdtempSync` under the system temp directory.

---

## What is NOT proven

- **No live projection against the real vault.** The order asks for it; the standing reminder forbids
  pointing `QF_VAULT_ROOT` there from fixture work. **[not run]**
- **G3(b), the rewrite-README bait** — the assertion standing between this tool and `_Doctrine/`. The
  snake_case probe covers the same ground from another angle but is not a substitute. **[not run]**
- **G3(a) widen write scope · G4(a) inject a run timestamp.** **[not run]**
- **Four of five WO-V1 baits are the builder's recordings, not my runs.** Only G2(d) was re-run here.
- 19 of the 20 gates predate these two rungs; nothing here claims anything about them.

---

## Five rulings requested

1. **Advertised-but-not-callable — debt entry or follow-on order?**
   Suggested shape: one assertion that the advertised name set equals the *registry's* returned
   definitions rather than the schema's. `registerAllTools` already returns `McpToolDefinition[]`, so
   it is cheap, and it closes the mirror of the hole WO-106b just shut.

2. **Vault folder collision — rename, map, or accept?**
   Rename the vault's `Artifacts/ Runs/ Sessions/`, add a type→folder display mapping in the
   projector, or accept lowercase snake_case as the vault's shape. Wants deciding **before** the first
   real run, not after.

3. **G1(c) — fix the check, or keep the euphemism?**
   A check that only flags call expressions, or only names near `vaultRoot`, would match the ruling.
   The current one makes the file lie about itself by omission.

4. **May fixture databases use WAL?**
   Not the Kernel's — fixtures only. It is the difference between an eleven-minute bait and a
   one-minute one, on every future round against this gate.

5. **Who runs G3(b)?**
   It is the only untested assertion protecting the founder's real vault, and both seats have now
   declined it. It should not stay unassigned.

---

## Process notes, including two of my own errors

- **I contaminated a builder run.** Ran the suite against a live worktree; the shared fixture wipe
  destroyed its state and it spent a cycle debugging my interference. Second time this session I have
  run the suite against a busy machine — the first cost a false `runtime-proof` failure. It is now a
  standing trap in `NEXT.md`.
- **I misread a slow gate as a hang** and said so before checking. The process sat in `D` state with
  near-zero CPU, which is what fsync-bound work looks like from outside. It was correct and finishing
  normally.
- **Zero rework rounds on WO-106b, one on WO-V1.** The V1 round moved a Law E allowlist entry out of
  the shipped package and rewrote a justification that was partly false ("synthetic links", when links
  have been writable through `execute()`'s `links:` envelope since WO-103).
- The only raw `INSERT INTO links` left in the repo is the Kernel's own write path at
  `packages/qf-kernel/src/links.ts:160`.

---

## Verify from clean

```bash
git fetch origin wo-106b wo-V1
git worktree add --detach /tmp/verify origin/<branch>
cd /tmp/verify && bun qa/run.ts --all     # unpiped, $? on its own line, NO other agent running
```

Per-branch reports:
- `docs/orders/evidence/wo-106b/BUILD-REPORT.md`
- `docs/orders/evidence/wo-V1/BUILD-REPORT.md`

**Neither branch is merged. Both await your ruling.**
