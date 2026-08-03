# WO-K1 — third seat, 2026-07-27 · `/thermo-review` shape, adapted

**Seat:** `cursor-grok-4.5-high`. **Decorrelation:** round 2 (`composer-2.5`) *wrote* the four
requirements under review, so it could not grade its own implementation of them. Round 1 was grok but
had never seen this material.
**Raw:** [`prebuild-read-round3-raw.md`](prebuild-read-round3-raw.md), 8,125 bytes, stdout complete.
**Tree after: clean.**

## Why the skill was adapted, stated plainly

`/thermo-review` is a **post-merge** review: it wants an order that shipped, a verifier who passed
it, and a diff. **Nothing here is built.** There is no diff and no verification record, so the skill
does not apply as written and was not pretended to.

What was kept is its actual mechanic, which does apply: a third seat on a different model, the
known-limits list quoted and re-reporting forbidden, the four asks in priority order (correctness ·
gate-assert vs code-guarantee · trust boundaries · **composition defects, asked for by name**), and
every finding re-measured by the architect seat with a control before being recorded.

The trigger for running it now was specific. Round 2 caught that two of round 1's fixes were
requirements with no mechanism. **The architect then wrote four more fixes that no seat had read.**
Same trap, one turn later.

## Verdict: DO NOT BUILD → all three blockers fixed → now cuttable

### Grade of the four unreviewed fixes

| Fix | Verdict |
|---|---|
| **D3** — `attachKernel` options carrying `readonly`, and reading the fixtures env var | **FIXED** |
| **D6** — `openAppKernel` named as the parent-env injection site | **FIXED** |
| **D8** — resolver in `setup-founder-seats.ts`, plus the dead scratchpad `args` | **ACKNOWLEDGED** |
| **G4** — the stdio-MCP subprocess recipe | **WORSE** |

## The WORSE — a composition defect between this order's own D6 and its own G4

**Re-measured, and it is exact.** The second draft of G4 told the builder to reuse
`tools/qf-read-tools/src/harness.ts`. Measured:

```
harness.ts:33-39   function envFor(overrides) {
                     const base = {}; for (…of process.env) base[k] = v;
                     return { ...base, ...overrides };   // can add or replace. CANNOT delete.
                   }
harness.ts:41-45   makeClient() -> StdioClientTransport({ env: envFor({ QF_KERNEL_DB: …, … }) })
```

D6 requires the parent process to carry `QF_KERNEL_DB` — correct, and necessary for `acp-agent.ts`'s
`...process.env` spread to work at all. `envFor` then spreads that parent env into every child and
offers no way to remove a key. **So G4's child would carry `QF_KERNEL_DB` no matter what the gate
passed.**

The consequence is the precise failure this order exists to prevent: G4 would prove *that injection
works* — which D6 already guarantees — and would **never once exercise the no-pin fall-through that
D8 creates, which is the configuration the live split came from.** Five green gates, four pins still
on disk, three seats still dead.

Two halves were required and both are now in G4: build the child env explicitly so `QF_KERNEL_DB` is
**omitted rather than overridden**, and sandbox `HOME` to a temp directory so the resolver default
lands in the fixture instead of the founder's real `~/.quantflow/`. Without the `HOME` sandbox the
gate either writes to the real platform Kernel or the builder avoids that by pinning the app and
thereby "proves" a split.

**Recorded rather than quietly fixed, because the recurrence is the finding.** The order had, one
revision earlier, congratulated itself for catching this same class between K1 and K2.

## The ACKNOWLEDGED — a property with no mechanism, for the third time

D8 said the emitted config "must carry no path that is local to the machine state of the moment it
ran." That is a property. A builder cannot execute a property.

**Measured cause:** `setup-founder-seats.ts:16-19` derives `PKG_ROOT` from `import.meta.url` and
writes `SERVER_TS = join(PKG_ROOT, "src/server.ts")` into the YAML at `:46`. Run the generator from a
copy of the repo and it faithfully bakes the copy's path. The dead
`/tmp/claude-1000/…/scope-w2/…/server.ts` in all three seat profiles is that code working as written,
not a mistake in one run.

Mechanism now in D8: the generator **asserts `SERVER_TS` resolves inside a git work tree and refuses
to write otherwise** (the only part that prevents recurrence), it is re-run from the real tree to
repair the three profiles, and report-back must show `args` before and after — not pins alone, which
is what would have let a builder satisfy every written requirement while leaving three seats
pointing at a deleted directory.

**Three times now** — the readonly pragma (round 2), the `args` paths (round 3), and G4's MCP recipe
(round 3). Same shape each time: the architect states what must be true and not how anyone would make
it true. Worth naming as a habit rather than three incidents.

## Correctness and composition findings accepted

- **`SCOPES.md:392` still taught the uncorrected concurrency model** — "a writer locks readers out
  entirely" — after `WO-K1.md` had been corrected. **One-source-two-sides, committed by the architect
  in the section written to name that defect class.** A builder reading the contract for "why WAL"
  would under-weight G2's `busy_timeout = 0` control, the load-bearing falsifier. Corrected, with the
  correction visible rather than silently overwritten.
- **The wipe-and-recreate blast radius changes.** Debt #27's remedy (`SCOPES.md:105`) previously
  destroyed one of three indexes while the artifact bytes survived. After K1 it destroys **the only
  index there is**. Between K1 and K3 every new `storage_ref` points at the old shelf. Not a reason
  to pull K3 forward — the measured instance is 2 files of test data — but now stated in the ritual
  rather than left to discovery.

## Trust boundaries — no posture change found

Round 3 checked and cleared: `execute()` as sole domain write path · `observe_ticket` unserved ·
`QF_ARTIFACT_ROOT` confinement (WO-106b, `2730a00`) · `QF_EXECUTE_ALLOWLIST` limited to
`publish_artifact` · the closed spawn allowlists, which D6 adds one key to and explicitly forbids
widening.

Two watch items, both Low and both accepted: D6 mutates `process.env` in the Electron main process by
design (which is exactly why G4 must not inherit it), and `attachKernel` reading
`QF_KERNEL_SYNC_UNSAFE_FIXTURES_ONLY` from the ambient env means an inherited fixture flag could
relax durability — D4's boot line is the fence, and the app must never set it.

## Disposition — why nothing new went to the debt register

`/thermo-review` routes confirmed findings to `ROADMAP.md` with a trigger. **Nothing was routed
there, deliberately.** Every finding was in an order that has not shipped, so the correct home is the
order's own deliverables and gates, where a builder will actually meet them. Debt entries are for
defects that outlive the work in front of them; filing these would have moved live requirements into
a register nobody reads at cut time.

## Baseline captured before any build

`kernel-sole-writer` exit 0 · `kernel-sole-writer-app` OK · `doc-action-surface` exit 0. The doc-only
commits reddened nothing. `kernel-sole-writer`'s green is the **expected** green of debt #28's
blindness, and is the "before" measurement WO-K2 will have to move.
