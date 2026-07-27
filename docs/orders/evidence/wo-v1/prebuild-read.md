The order’s intent is right: a one-way, hash-checked Obsidian mirror so you can read the ledger without ever trusting the vault as truth. But as written, several acceptance gates can go green while the projector still fails that promise — especially the hash check, “project everything,” and “readers only.” Two measured-fact rows are already wrong against today’s Kernel, and the order never names how the projector opens the database (or that opening it the wrong way would trip an existing Law E gate).

---

# WO-V1 Pre-Build Adversarial Read

## Q1. Can each acceptance gate actually fail?

### G1 — one direction
**What it claims:** vault content is never an input; Kernel unchanged by vault plants.

**Cheats that satisfy the literal baits:**
1. **Filename/mtime as input (not “content”).** Use `readdir`/`stat` on `Artifacts/` to decide what to rewrite or skip. Bait (a): fabricated file is overwritten → Kernel unchanged. Bait (b): grep for `readFile`/`Bun.file`/`text()` of vault paths stays clean. The ruling (“nothing in the vault is ever an input”) is violated; the gate text (“never reads vault *content*” / “existence checks”) allows it.
2. **Merge-from-vault via non-grep surface.** Read vault notes through a path the gate’s grep does not name (e.g. Obsidian API, `fs.open`+manual buffers, child process). Bait (b) is a grep, not a semantic check — it can stay green.

**Harder to cheat:** bait (a)’s “Kernel unchanged” is sound for *ingest-into-Kernel*. I could not construct a clean cheat that *writes Kernel rows from a vault plant* while keeping bait (a) green, if the projector truly never calls `execute()`.

**Verdict:** G1 can pass while still treating the vault as a control-plane input. **High.**

---

### G2 — the hash gate
**What it claims:** only bytes that still match Kernel `content_hash` are rendered as the artifact.

**Cheats that satisfy baits (a)–(c):**
1. **Always-fail-closed “check.”** Never read `storage_ref`. Always emit mismatch (show `content_hash` + a dummy second hash). Bodies never inline. Bait (a)(b): green. Bait (c): delete that branch → start reading/inlining → edited bytes “render as genuine.” Gate proves *a* branch gate exists, not that bytes were verified against Kernel identity.
2. **Hash the wrong thing.** Hash the `storage_ref` *path string* (or note frontmatter) and compare to `content_hash` → always mismatch → same always-fail-closed shape; bait (c) still “proves” the branch.
3. **Compare without binding to Kernel.** Recompute `contentHash(bytes)` and compare to a second hash of the *same* buffer (tautology), *or* compare `content_hash` to `artifact.id`. Measured on the live Kernel: for artifacts, **`id === content_hash`** already:

```
id:            2964065d5232f6b41512538a1ed123cebb410b30bba442358c15628392ed6ce7
content_hash:  2964065d5232f6b41512538a1ed123cebb410b30bba442358c15628392ed6ce7
```

   Comparing id↔content_hash always “matches” **without reading the file** → edited bytes still render → bait (a) would fail this one. So this particular cheat fails the written bait — good — but the order never says “compare `contentHash(read(storage_ref))` to the Kernel column `content_hash` via the `contentHash` helper.” A builder can still pick cheat (1) or (2).

**Not tightly specified:** caching inside one process is irrelevant to G2; “only check artifacts it just wrote” is not forced by the bait (publish → edit → project is the sequence). The order does not require using `contentHash` from `hash.ts`.

**Verdict:** G2’s literal text is **not tight enough**. Always-fail-closed / wrong-hash-target implementations pass while never verifying published bytes. **High.**

---

### G3 — `_Doctrine/` untouched
**Cheat:** Never touch `_Doctrine/`, but rewrite vault `README.md` or `.obsidian/` (or invent a fourth generated folder). Bait only widens write scope to vault root *or* checks `_Doctrine/` bytes. Gate proves `_Doctrine/` carve-out, not “only the three generated folders.”

**Verdict:** Narrow cheat exists. **Medium** (intent is mostly sound).

---

### G4 — idempotence
**Cheats / holes:**
1. **Tied `created_at` ordering.** `queryObjects` / `getLinks` order by `created_at` only. With more rows sharing a timestamp, SQLite can reshuffle; two runs in one sitting on today’s Kernel (5 / 18 / 0 links) stay identical. Gate never loads a fixture with tied timestamps or many links.
2. **Default `limit` 100.** Deliverable never mandates `limit: null`. Measured: default and unbounded both return 18 sessions *today*. A projector that omits `null` is byte-identical on two runs and silently truncates once sessions > 100. Not nondeterminism — **silent incompleteness that G4 cannot see**.
3. **Locale / key-order** bugs that only appear with non-ASCII names or denser frontmatter — not baited.

Timestamp bait only catches an inserted run clock.

**Verdict:** Can pass while remaining nondeterministic or incomplete under more data. **High** (limit trap); **Medium** (ordering).

---

### G5 — schema-driven
**Cheat:** Iterate `schema.objects` for *reads*, but hard-map writes to `Artifacts|Sessions|Runs` only. Fixture type is “read” and maybe written to a throwaway path the gate checks — or gate only asserts “a file containing the type name exists.” Order does not define where fixture notes must land or how the fixture DB table is created (`seedExperimentalFixtureTable` lives in-kernel for Law E reasons; order silent).

**Verdict:** Underspecified enough to pass without true schema-driven *projection*. **Medium–High**, compounded by the D2/folder contradiction in Q2/Q3.

---

### G6 — cold suite + `vault-projection` registered
**Cheat:** Register a no-op gate named `vault-projection` that always greps a constant. Order does not say the gate must embed G1–G5. Falsification of G6 is only “suite red if gate missing/failing,” not that the gate encodes the ruling.

**Verdict:** Registration-only cheat possible. **Medium.**

---

## Q2. Does each deliverable have exactly one meaning?

| ID | Second competent readings |
|---|---|
| **D1** | **`QF_VAULT_ROOT`:** env var (by analogy to `QF_KERNEL_DB` in `tools/qf-read-tools`) vs config file vs CLI flag — order says only “configuration (`QF_VAULT_ROOT`).” **Kernel DB path is unnamed** — second reading: hardcode the worktree path from the facts table; or invent `QF_KERNEL_DB`; or open via raw `bun:sqlite`. **`openKernel` is not listed** among allowed APIs but is required to obtain `KernelDb` (see Q3). **“Refuses to run”:** `process.exit(1)` vs throw vs print+return 0 — exit code for automation undefined. **“Path does not exist or contains no README.md”:** symlink to wrong place with a README still runs; empty README counts; README elsewhere doesn’t. |
| **D2** | **“One note per object” × “iterate `schema.objects`”** vs ruling/folders only `Artifacts/`, `Sessions/`, `Runs/` vs plain-terms “every artifact, session and run.” Schema has **23** object types (`competitor`…`connection`). Second reading A: notes only for those three types. B: notes for all 23 dumped into those three folders by ad-hoc rules. C: invent more folders (violates ruling). **“Stable id-derived filename”:** `{id}.md` vs `{content_hash}.md` (same for artifacts today) vs slug from a `name` field (agent_definition has `name`; artifact has none) vs `{type}-{id}.md`. UUIDs vs content-hash ids both appear in the live Kernel. |
| **D3** | Which kinds are “binary” (link-only) vs inline: only `report`/`strategy_spec` named for inline; `trajectory`/`code`/`result_set` left as “binary” by implication — a builder could inline `trajectory` markdown. Mismatch copy not prescribed (wording free). |
| **D4** | Wikilink form: `[[id]]` vs `[[folder/id]]` vs `[[id\|kind]]` vs prose `kind: [[id]]`. **`getLinks` returns no peer type** — resolving folder-qualified links needs another lookup; id-only links are another reading. With **0 links** today, any of these passes. |
| **D5** | Byte-identical across two runs in one process vs across machines/timezones; whether deleting orphan notes is required for “same as golden discipline.” |

**Stale notes (deleted Kernel objects):** order is silent. Readings: (1) leave forever (vault accumulates ghosts — not a pure projection); (2) delete orphans (requires vault inventory → tension with G1/ruling); (3) only overwrite known ids, never remove. **High gap.**

---

## Q3. Self-contradiction or contradiction with the code?

### Context table vs HEAD

| Claim | Verdict | Measurement |
|---|---|---|
| Vault exists with four folders + README | **Sound** | `~/Vaults/QuantFlow Ontology` has `Artifacts/`, `Sessions/`, `Runs/`, `_Doctrine/`, `README.md` (also `.obsidian/`, not claimed). |
| Artifact stores pointer, not bytes | **Sound** | `golden/migration.sql` artifact columns: `id`, `created_at`, `kind`, `content_hash`, `storage_ref` — no content blob. Live rows use filesystem `storage_ref`s. |
| Real Kernel: 5 artifacts, 18 sessions, **2 species**, 0 runs, 0 links, 68 events | **Wrong row** | On `~/.collaborator/dev/worktree-ada48d49dc49/kernel.db`: artifact=5, agent_session=18, run=0, links=0, events=68. **No `species` table.** Count **2** is `agent_definition` (`qf-toolloop`, `hermes`). Calling them “species” is domain slang, not a measured table name — a **wrong measured-fact row**. |
| Readers at `getObject:64`, `queryObjects:81`, `getLinks:111` | **Partly wrong** | Measured: `getObject` **64** ✓; `queryObjects` **84** (not 81); `getLinks` **126** (not 111). |
| `queryObjects` unbounded + `order` (WO-106 D2) | **Sound** | `limit: null` omits LIMIT; `order` asc/desc on `created_at`. Unbounded artifact count = 5. |
| `contentHash` at `packages/qf-kernel/src/hash.ts` | **Sound** | `export function contentHash(bytes: Uint8Array): string` — SHA-256 hex; re-exported from package index. Usable after reading `storage_ref` into `Uint8Array`. |
| 19 gates | **Sound** | `bun qa/run.ts --list` → 19 names; last is `boot-reconcile`. |
| Artifact kinds | **Sound** | `z.enum(["strategy_spec", "code", "result_set", "report", "trajectory"])`. |

### Do generated readers support D2–D4?

| Need | Support? |
|---|---|
| All objects of every type | **Yes, if** builder loops `schema.objects` and calls `queryObjects(db, type, undefined, null)`. **Order does not require `limit: null`.** Default limit **100** — High trap. |
| Links for an object | **Yes** — `getLinks(db, id)` / optional `kind`. Ordered by `created_at ASC`. |
| Peer type for wikilink paths | **No** — `LinkRow` is `{id, kind, from_id, to_id, created_at}` only. Folder-qualified `[[Sessions/…]]` needs extra `getObject` probes or id-only links. **Medium** unless id-only is accepted. |
| Events / non-object tables | Not in `schema.objects` — fine if projection is objects-only; conflicts with “everything the Kernel records” in the Objective. |

### Pointer + `contentHash`
**Sound**, as above. Order should bind G2 to: `contentHash(bytes at storage_ref) === row.content_hash` using that helper — it currently does not.

### `kernel-sole-writer` / Law E collision — **High**

Measured gate behavior (`qa/gates/kernel-sole-writer.ts`):
- Flags `bun:sqlite` / DDL/DML **outside** allowlist.
- Allowlist includes `packages/qf-kernel/`, `qf-kernel-schema/`, and a few tools exceptions — **not** a new `tools/qf-vault-projection/`.
- Does **not** ban importing `qf-kernel`.

Precedent: `tools/qf-read-tools` opens via `openKernel` + readers only — green under this gate. WO-104 explicitly said reads through the Kernel package are “not a `kernel-sole-writer` question.”

**WO-V1 defects:**
1. Says projector may use **ONLY** `getObject` / `queryObjects` / `getLinks` — **literally excludes `openKernel`**, which is how every existing tool gets a `KernelDb`. A literal builder either invents a second open path (`bun:sqlite` in `tools/` → **reddens `kernel-sole-writer`**) or violates the “only” clause.
2. **`openKernel` creates databases:** docstring “Open (or create)”; measured: missing path → new `kernel.db` written. Order never requires `readonly: true`, never names `QF_KERNEL_DB` (existing convention), never forbids create-on-miss. Projector could create a stray Kernel — opposite of “refuses to run if unintended.”
3. Order **does not acknowledge** Law E / `kernel-sole-writer` at all — the exact class of miss that bit a prior rung when a deliverable authorized a posture the gate forbids.

`kernel-sole-writer-app` only walks `collab-electron/src` — a `tools/` projector does not collide with it.

### Internal contradictions
1. **Objective / D2 “everything / all schema.objects”** vs **ruling / vault layout “only Artifacts, Sessions, Runs.”** 23 types vs 3 folders. **High.**
2. **G1 “never read vault”** vs any competent **orphan cleanup** for deleted Kernel rows (unspecified, but needed for pure projection). **High** silence that forces a contradiction when implemented.
3. Plain-terms “if you delete the vault, nothing is lost — it regenerates” assumes complete regeneration from Kernel; D2/folder mismatch and stale-note silence undermine that claim.

---

## Severity-ranked findings (order-text defects only)

1. **High — G2 falsifiable without verifying bytes** (always-fail-closed / hash-wrong-target still passes baits including (c)).
2. **High — “Readers only” omits `openKernel`; Kernel path unspecified; `openKernel` can create a DB** — Law E tripwire if builder opens SQLite directly; order silent where WO-104 was explicit.
3. **High — D2/Objective vs three-folder ruling** — two incompatible scopes for what gets notes.
4. **High — Stale/orphan notes unspecified** — collides with G1 if deleted, lies about pure projection if kept.
5. **High — `queryObjects` default limit 100 not mandated** — all gates pass on today’s Kernel while incomplete later.
6. **High — Measured-fact row “2 species” is wrong** (no such table; means `agent_definition`).
7. **Medium — G1 allows vault filenames/mtimes as inputs** under “existence checks.”
8. **Medium — G4 does not bait ordering/truncation under load.**
9. **Medium — D1/D2/D4 naming and “refuses to run” underspecified** (`QF_VAULT_ROOT`, exit semantics, id-derived names, wikilink shape).
10. **Medium — Line citations for `queryObjects`/`getLinks` wrong**; G5/G6 harness details thin; G3 scope narrow.
11. **Low — `.obsidian/` / root README write surface unmentioned.**

---

## What is sound (do not churn)

- One-direction ruling and `_Doctrine/` carve-out are the right product law.
- Hash-before-render is the right artifact rule; columns and `contentHash(Uint8Array)` really exist.
- `getLinks` / unbounded `queryObjects` **can** express the read half of D2–D4 if `limit: null` is required and wikilinks are id-based.
- Vault target on disk matches the story; off-ladder framing is clear; no write-back in out-of-scope is correct; 19-gate count and artifact kinds are accurate.

---

**Bottom line for the author:** Fix G2’s comparison contract, name `openKernel`+`QF_KERNEL_DB`+readonly/fail-closed, pick one projection scope (three types vs all objects) and orphan policy, require `limit: null`, and correct the “species” fact — before any builder cuts.That background check finished and matched what the review already used:

- Default `queryObjects` vs `limit: null` both returned 18 sessions on today’s Kernel (so the limit-100 trap is invisible until the Kernel grows).
- `openKernel` on a missing path **creates** a new `kernel.db`.
- WO-V1 still never names `QF_KERNEL_DB`, `openKernel`, or orphan/stale-note handling.

The full pre-build read is in the previous message; nothing further from that probe.
