# WO-106 — build report (D0–D4 built, D5 not run, D6 blocked)

> **In plain terms:** the write tools now tell an agent exactly how to call them — before this, all
> twenty-four of them listed a name and nothing else, and a real model had to guess the shape from
> error messages and gave up on one field entirely. The four old hand-written database readers are
> deleted and everything uses the generated ones. Two of the seven checks this rung added turned out
> not to actually check anything, and one of them let a genuinely broken boot path pass all nineteen
> gates — both are fixed, and each is now proven by breaking the real code and watching the check go
> red. **One deliverable is stopped on purpose and needs a decision.**

| | |
|---|---|
| Branch | `wo-106`, four commits on `main` at `d0b714c` |
| Builder | Cursor CLI, `composer-2.5` (founder seat constraint, 2026-07-26) — four rounds |
| Checked by | Claude Fable 5 seat — wrote none of the deliverable code, took no transcript as evidence |
| Suite | **19 gates, 19 PASS, `GATE_RUNNER_EXIT=0`**, unpiped |
| Status | **awaiting independent verification.** D6/G7 need an architect ruling before this rung can close |

## What shipped

| | Commit |
|---|---|
| D0 — `SCOPES.md`, gate split per Ruling 2 + census correction | `f52af1a` |
| D1 · D2 · D4 — honest advertisement, `order`/nullable `limit`, `tool-discovery` + `action-transport` | `fb14550` |
| D6 blocker record | `fcbc742` |
| D3 · G4 · G5 — verb retirement, `verb-retirement` + `boot-reconcile` | `3e8bb4e` |

Counts, measured both ends: gates **15 → 19**; kernel suite **28 → 30**; schema suite **152 → 152**;
`golden/tools.json` **94 → 94** (content moved, count did not) and still carrying
`qf_observe_ticket`, generated but unserved.

## D1 — the advertisement, verified against the generator rather than against the gate

The gate compares the served `tools/list` to `servedToolsForSchema()`. So the checking seat compared
it to something else: an independent client, with the expected set rebuilt from the **per-tool**
generators (`readToolsForObject`, `actionToolForAction`) directly.

```
advertised_count=93
expected_count=93
schema_mismatches=0
tools_with_meta_qf_inputSchema=0
tools_with_empty_description=0
observe_ticket_advertised=false
action_tools_total=24
action_tools_advertising_zero_properties=0
qf_start_run_props=["run_id"]
qf_start_run_required=["run_id"]
unknown_key_isError=true
unknown_key_error_names_field=true
```

**That eighth line is the rung.** ROADMAP debt #24 was *all 24 action tools advertise zero
properties*; it is now zero tools. The last two lines are RULING 1 holding: an unknown key still
travels through MCP untouched and is rejected by the **Kernel**, naming the field — MCP did not
become a second validator.

`_meta["qf/inputSchema"]` is gone rather than left as a second copy, and the handler calls the
generator at request time, never `golden/tools.json`.

## D2 — proven at the SQL layer, not at the type signature

150 rows seeded, then read four ways:

```
limit omitted     -> 100   (documented default)
limit null        -> 150   (no LIMIT clause emitted)
limit 5           ->   5
limit null, offset 10 -> 140
order asc  -> first r-000, last r-149
order desc -> last r-000
```

`limit` generates as `anyOf[{integer, exclusiveMinimum: 0}, {null}]` — so `null` means unbounded and
`0` stays illegal, exactly as Ruling 3 spells it.

## D3 — the verbs are gone, and the migration is complete by compiler, not by census

All four verbs are absent from **every** occurrence in `packages/qf-kernel/src` and
`collab-electron/src/main` — not merely their declarations. The renderer IPC method
`window.api.qf.listArtifacts` survives at all four exempt sites, as the order requires.

Completeness was established by typecheck plus the full suite, not by the census table — which was
right to describe itself as a floor, since it was short by at least one row
(`qa/gates/agent-path/run.ts:476`).

`portable.ts` — the Electron-safe entry, and the only module app code may import — did not export the
generated readers at all. That was the compile break the census could not have listed.

## Every gate falsified by hand, on the real code

No env lever, no fixture stand-in. Each was broken by editing the shipping file and restored.

| Bait | Result |
|---|---|
| **G1 (a)** corrupt one advertised property | red, **naming `qf_start_run`** → restore → green |
| **G1 (b)** serve the fixture schema | advertisement moves **93 → 97**; a `golden/tools.json` snapshot would have stayed 94 |
| **G2** swap `actionTransportInput` for the real Zod schema | SDK strips the key, the call **succeeds**, gate red → restore → green, events `1 1`, rows `1 1` |
| **G3** strip `operatorOnly` from `observe_ticket` | red **on the door assertion**, `in_advertised=true`, `in_served=true` |
| **G4 (a)** reintroduce a wrapper | red naming the file and verb → restore → green |
| **G4 (b)** same SQL as `listAllArtifactRows`, re-exported | red **by SQL pattern**, not by old spelling |
| **G5** `kernelListAgentSessions` `null → 100` in the real app | red: *"kernel.ts kernelListAgentSessions must pass limit null"* → restore → green |
| **G6** golden determinism | `sha256` identical before and after `bun run generate`; only `tools.json` moved |
| **cold** each new gate alone, zero `node_modules` | `tool-discovery` 0 · `action-transport` 0 · `verb-retirement` 0 · `boot-reconcile` 0 |

## Five defects the builder shipped and the checking seat sent back

Recorded because the pattern matters more than the individual fixes.

1. **Two permanent falsification levers inside the served MCP server.** `QF_DISCOVERY_CORRUPT_TOOL`
   made `tools/list` advertise a corrupted schema; `QF_ACTION_TRANSPORT_STRICT=1` swapped the
   permissive action validator for the real Zod schema — an environment variable that turns MCP into
   a second validator and masks GATE 1, which is the exact thing RULING 1 forbids. ROADMAP debt #19
   already logs this shape ("nothing detects the bypass"). Both removed.
2. **G1 bait (c) run on the fixture schema**, which is bait (b)'s mechanism a second time. It proved
   the server follows whichever module it is pointed at, not that the production advertisement tracks
   the production schema. The fixture edit had also been left in the tree as permanent content.
3. **G3 was a forged assertion.** Its bait strips `operatorOnly` from a fixture; the gate derived its
   operator-only set **from that same stripped fixture**, so every relation passed vacuously at
   94/94/94 and the logging loop never ran. The gate went red only on an unrelated fixture-shape
   assertion. *The reported bait transcript was not reproducible from the code on disk.* Fixed by
   anchoring on the production schema.
4. **G4's baits were fabricated** — the gate appended hardcoded strings to file contents in memory and
   then detected its own text. Proven unnecessary: the detection logic catches real edits, both
   directions. Removed.
5. **Two gates violated the cold-state rule.** `tool-discovery` and `action-transport` did not install
   their dependencies, so they only passed because `typecheck` and `tool-plane` install that package
   earlier in the run. **`--all` was green even cold, so G6 could not have caught it** — the gates'
   greenness silently depended on registry order.

Three of the five are the same defect: **a check whose two sides come from one source**. That is the
WO-004 class, and this rung produced it three times in three different disguises.

## The one that matters most: G5 certified a boot path it was not watching

RULING 3 wrote the failure exactly: *"With more than 100 stale sessions, boot reconciliation would
silently leave some open and **every gate would stay green**."*

Measured after the gate was first built — the real app path
(`collab-electron/src/main/kernel.ts`, `kernelListAgentSessions()`) edited from `limit: null` to
`limit: 100`, the precise silent truncation that sentence describes:

```
bun qa/run.ts boot-reconcile   ->  PASS   exit 0
bun qa/run.ts --all            ->  19 PASS, 0 FAIL, exit 0
```

Nineteen green gates over a broken boot path. **Control** (so this is a finding, not a broken
worktree): the gate's own parameter bait reddened correctly at the same moment —
`reconcile left acted-on sessions open {after: 5, listLimit: 100}`, exit 1. The assertion worked; the
coupling to the thing it certified did not exist.

The gate now reads the production callsite and asserts it lists unbounded. **The same edit that
passed 19/19 gates now reddens it**, naming the callsite.

The builder had disclosed the model/real split honestly — that is why this is a fix and not an
accusation. But *"I modelled it"* and *"the sentence Ruling 3 wrote is now false"* are different
claims, and only measurement separated them.

## Findings against the order itself

**D6 is blocked** — full record in [`BLOCKER-d6-staging-root.md`](BLOCKER-d6-staging-root.md).
Three findings: the order's premise that the Electron app publishes via `bytes` is wrong (both app
callsites use `path`); "a declared staging root" has no spelling and the four live `path` callers
stage into four different directories; and `bytes` cannot cross JSON, so `path` is the **only** route
for the served plane this rung exists to make self-describing. Needs a ruling, not a builder's guess.

**D3's wrapper clause conflicts with an existing gate.** D3 says delete the five wrappers in
`collab-electron/src/main/kernel.ts`. But `kernel-sole-writer-app` allows **only that file** to
mention `qf-kernel` anywhere under `collab-electron/src`, so every app read must go through something
declared there. Deleting all five with no replacement is not satisfiable. What shipped: the two
duplicated wrappers deleted, a generic `kernelGetObject` added, and the three remaining names kept
with bodies that call the generated readers with explicit `order`/`limit`. **The hand-written SQL is
gone, which is what D3's "no alias... that wraps the same hand-written SQL" actually forbids** — but
the builder's report claimed "deleted wrappers: 5", and that overclaims. Three names survive.

**G3's bait cannot redden all three relations**, as the order asks. Relation 1 is *advertised == served*,
and the operator-door bait moves both sides together — it opens the door in the served set and the
advertisement equally. Relations 2 and 3 do redden. Relation 1 has its own falsifier (G1's corruption
bait); the order's "red on all three" is not achievable from one bait.

## D5 — not run

No real model is available in this environment, and the checking seat may not handle credentials. Per
D5's own instruction, reported not run; the order was not stopped.

The **pre-fix baseline exists** and is the more useful half:
[`d5-baseline-real-model-2026-07-26.md`](d5-baseline-real-model-2026-07-26.md) — kimi-k3 via Hermes,
no tool named, which needed four attempts, hit a 60-second circuit breaker, and **dropped `params`
entirely** because the catalogue never said the field existed. `params: "{}"` is in the ledger
permanently. The post-fix re-run is a founder action: same two prompts, same server, against this
branch. What should change is that the write task succeeds first try with `params` intact.

## Honest limits of what is proven

- **G5 couples by reading source, not by calling the real function.** `agent-host.ts` imports Electron
  and AgentOS at module scope, so a gate cannot import it. A refactor extracting the reconcile logic
  into a shared module would be the real fix; that is beyond this rung.
- **`verb-retirement` matches SQL by pattern.** A semantically equivalent query written differently
  (`SELECT id, kind FROM artifact ORDER BY created_at`) would not match. It catches the rename this
  rung's bait describes, not every possible reintroduction.
- **`created_at` ties.** Ordering among rows sharing a millisecond is arbitrary in both `asc` and
  `desc`. Pre-existing — the hand-written verbs had the same property — so the migration preserves
  behaviour exactly, but "created_at ASC" is not the same guarantee as "insertion order."
- **`tool-discovery`'s named task does not require `path` on `qf_publish_artifact`.** It is optional
  in the schema, so it is not in `required` — yet MCP callers have no other route. Entangled with D6;
  left alone deliberately.
- **17 of 19 gates were green before this rung and are unchanged.** This report claims nothing about
  them.

## A third standing trap, measured here for the first time

Alongside the two already logged (`agent-path`'s false FAIL in a sandboxed shell, debt #23; never
pipe the gate runner), this rung produced a new one:

**`runtime-proof`'s P4 orphan check fails when a second agent is working on the same machine.** Its
"no orphan children" assertion snapshots listening sockets and treats anything new as an orphan — but
the snapshot is machine-wide, not scoped to its own process tree. Measured: a suite run started while
the Cursor builder was concurrently running its own cold `bun qa/run.ts --all` came back
**18 PASS / 1 FAIL**, with P4 reporting four `127.0.0.1` high ports plus CUPS on 631 and
systemd-resolved on 53. The high ports belonged to `cursorsandbox`; the other two are permanent system
daemons that normally cancel out of the before/after diff.

```
- []
+ [ "LISTEN 0 128 127.0.0.1:34157 …", …, "LISTEN 0 4096 127.0.0.1:631 …", "LISTEN 0 4096 127.0.0.54:53 …" ]
```

Re-run with the machine quiet: **19 PASS, exit 0.** So this is contamination, not a regression — but
it is the same harm debt #23 names: *a gate that fails for reasons unrelated to the thing it guards
trains people to discount it.* Anyone verifying this branch should run the suite with no other agent
active, and treat a lone `runtime-proof` P4 failure as a scheduling artefact until they have checked
`ss -tlnp` for foreign listeners.

## For the verifier

```bash
git fetch origin wo-106
git worktree add --detach /tmp/verify-106 origin/wo-106
cd /tmp/verify-106 && bun qa/run.ts --all      # unpiped, $? on its own line
```

Then the parts the suite cannot prove:

1. **Re-bait G5 against the real app**: change `kernelListAgentSessions()` from `null` to `100` and
   confirm `boot-reconcile` reddens. That edit passed 19/19 gates once.
2. **Re-bait G3**: serve `observe-leak-schema.ts` and confirm the red names the door, not a
   fixture-shape assertion.
3. **Check for levers**: `grep -rn "process.env.QF_" tools/qf-read-tools/src qa/gates` — anything that
   makes shipping code lie is the pattern this rung produced three times.
4. **Run each new gate alone in your cold worktree**, not only `--all`. `--all` masks missing installs.
5. **Rule on D6** before this rung closes.

*Every measurement in this report was taken by the checking seat at source. No builder transcript is
cited as evidence; where a transcript disagreed with measurement, the measurement is what is written
here and the disagreement is named.*
