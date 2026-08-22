# R16 founder-kernel compatibility — independent verification

**Result: PASS** — the immutable product candidate is
`b8e7d57c04288e1315bbe658a4665a57b4d5f3e7`.

Plain meaning: the founder's earlier Kernel can be upgraded safely on an
isolated copy; the real founder database was not written and the app was not
launched.

## Freeze and checkout receipts

- Verification started at `fea714479ac802c1eb9cd95cec23d7ab87e6f1c8` on
  `wo-R16`; `b8e7d57c04288e1315bbe658a4665a57b4d5f3e7` is an ancestor.
- `fea7144` descends from the candidate and their only tracked diff is
  `docs/orders/evidence/r16/BUILD-REPORT.md`; product code is identical.
- Before and after measurement, the only pre-existing dirty paths were the
  Router-owned, unstaged `docs/orders/NEXT.md` and `docs/orders/WO-R16.md`.
- No live R16 gate, packaged/release gate, normal app, or other app process was
  run.

## Bounded matrix

All commands ran from the saved `C:\Users\rybow\QuantFlow-Ontology` checkout
and exited `0`.

```text
bun test packages/qf-kernel/src/r11a-deterministic-execution.test.ts -t "pinned post-composition|extra or missing"
  2 pass, 0 fail, 16 expect calls

(packages/qf-kernel) bunx tsc --noEmit
  exit 0

bun qa/run.ts dock-profile-identity
  PASS dock-profile-identity; pre-current chain and partial-shape controls green

bun qa/run.ts kernel-drift
  G6 coupling PASS; G1/G2/G3 PASS; PASS kernel-drift

bun qa/run.ts kernel-sole-writer
  PASS kernel-sole-writer

bun test qa/gates/research-world-visible.test.ts
  13 pass, 0 fail, 192 expect calls

bun qf-atlas/generate.mjs --check
  current — 431 files, 124 channels, 13 strip candidates

bun qf-atlas/ratchet.mjs
  HARD RED: 0; unexplained coverage: 0

git diff --check
  exit 0
```

## Isolated founder-copy proof

The only source file copied was
`C:\Users\rybow\.quantflow\kernel.db`, copied with `copyFileSync` to the fresh
temporary directory
`C:\Users\rybow\AppData\Local\Temp\qf-r16-verify-9BfUol`. The source was opened
only with `new Database(sourcePath, { readonly: true })`, then closed before the
copy was created. Only the copy was opened writable and passed to
`attachKernel()`; the temporary directory was removed after the proof.

```text
source SHA-256 before = c29fd79a328d1006eedfc425a5f55ca5a60fdc5a07b89db861a7cad128369bdf
source shape          = task_steering
copy SHA-256 before   = c29fd79a328d1006eedfc425a5f55ca5a60fdc5a07b89db861a7cad128369bdf
copy shape before     = task_steering
copy shape after      = current
source SHA-256 after  = c29fd79a328d1006eedfc425a5f55ca5a60fdc5a07b89db861a7cad128369bdf
temporary copy cleanup = removed
```

Counts were nondecreasing (and identical): artifacts `8 → 8`, tasks `1 → 1`,
links `25 → 25`, and events `58 → 58`.

Representative rows survived exactly:

- artifact `41382a3f664128ac1c297c98c2b4cd8244b06c3e2b1b743bb70169be5d2713eb`,
  with the same `content_hash`;
- task `task-32dcfa3d-2365-4ece-885b-ee3b5bbaa469`, title/description/status
  unchanged (`done`);
- link `02f22077-d82b-41e0-9f9b-ab341a7ce513`, still `derived_from` from
  `ae4b7f94a8952bcd041e45c81e0caf5e86d0feac37c98c904e70ef3538f729b5` to
  `cbf63a78ded928c3319b7dbc570e0b5351d514ad452f9d6849acf0b52313042c`;
- event `0165976f-68cf-462e-a0c0-bda73fbb7e0f`, with identical JSON payload and
  trace ID `b2114ca7-13f3-424e-aa33-4db9a24b5f57`.

The source hash is unchanged. The real founder DB was never opened writable,
was never modified, and no live app was launched.

## R16 normal consumer action-schema — independent durable-tail verification

**Result: PASS** — the immutable product candidate remains
`94c4ee61e9b64fca56d0101557eeb64cb5f4c534`.

Plain meaning: the previously independently verified action-schema repair has
now also passed its missing durable typecheck receipt and final static checks;
the Director is shown the fields it needs to create a worker.

### Freeze and prior independent evidence

- Verification began from evidence-only HEAD
  `eddbbd202b0506a0a0568cd6c311c8a05cbadd32` on `wo-R16`.
- Before and after the tail, `git diff --name-only
  94c4ee61e9b64fca56d0101557eeb64cb5f4c534 HEAD -- .
  ':(exclude)docs/**'` was empty: product bytes equal the candidate.
- The pre-existing unstaged Router-owned paths remained
  `docs/orders/NEXT.md` and `docs/orders/WO-R16.md`; they were neither staged
  nor edited here.
- The earlier fresh Terra Verifier independently recorded the required focused
  and product gates green through R16 `13/0` at this same candidate. Its two
  tooling receipts in `docs/orders/WO-R16.md` record the first Windows `EBUSY`
  typecheck transport failure and the later unmeasured continuation; neither
  changed product or founder state. This receipt measures only their authorized
  unchanged durable tail.

### Durable typecheck receipt

Before launch, no prior `qa/run.ts typecheck`, `bunx`, or `tsc` process or
descendant remained. Exactly one direct hidden background PowerShell process
was started (PID `27672`) to run the unchanged command in the saved checkout.
It exited before the five-minute limit.

```text
command: bun qa/run.ts typecheck
log:     C:\tmp\r16-action-schema-typecheck-20260822-013304597.log
exit:    C:\tmp\r16-action-schema-typecheck-20260822-013304597.exit
exit text (exact): 0
```

The log's unedited tail contains the runner's aligned success marker
`PASS  typecheck` (two spaces before the gate name):

```text
+ qf-kernel@../../packages/qf-kernel
+ qf-kernel-schema@../../qf-kernel-schema

4 packages installed [138.00ms]
PASS  typecheck
```

### Direct final static checks

All three commands ran directly from
`C:\Users\rybow\QuantFlow-Ontology` and exited `0`.

```text
bun qf-atlas/generate.mjs --check
qf-atlas: current — 431 files, 124 channels, 13 strip candidates

bun qf-atlas/ratchet.mjs
qf-atlas ratchet — 3.3s (budget 60s)
baseline: 3 entries · HARD RED: 0 · unexplained coverage: 0 · undecided w/o blocker: 0 · AMBER (visible, non-blocking): 20 · undecided: 42

git diff --check
exit=0
```

### Committed runtime contract

The committed source uses `actionToolForAction(action)` for every
capability-group action. The committed production-handler runtime test compares
the served `qf_create_agent_session` definition to that authority and asserts
exactly these property keys, in order:

```text
session_id
agent_definition_id
label
```

Its required array is exactly:

```text
session_id
agent_definition_id
```

No app or live gate was launched, and the founder database and backup were not
accessed. Together with the prior independent focused/product receipts, this
is an independent **PASS** for the R16 normal consumer action-schema repair.

## R16 independent verification — write-status matrix

Plain meaning: QuantFlow now refuses to call a critic review delivered unless
both the typed instruction and its separate submit key were accepted, and the
only gate-only follow-up correctly excludes four isolated test fixtures without
exempting any application writer.

### Scope and immutable identities

| Item | SHA |
|---|---|
| Immutable product candidate | `e824ae10f50336a1640afeecd802ed7141bbeeb7` |
| Gate candidate | `ed9de40fc801340aa5a299821c3b322183a547f3` |
| Builder evidence head measured | `5d660ecd2d2b7191b90c464c37e410e00c147b84` |

No Electron build or launch, Computer Use, package/release gate, founder-state
action, product/test edit, or R17 work occurred in this verification.

The three product candidate blobs were unchanged at the measured head:

```text
collab-electron/src/main/pty.ts                  bd55e8e1101ed29c30b79549006e7cc7ddcd39b9
collab-electron/src/main/agent-host.ts           c29511839c4530e4250c3a83770f9d22ec527210
collab-electron/src/main/governed-review.test.ts 8041765f76d56ff548b937f2ecc3bda29cbe93fc
```

`e824ae10..ed9de40` changes only the authorized
`qa/gates/kernel-sole-writer-app.ts` gate and the three generated Atlas
projections. `ed9de40..5d660ec` changes only `BUILD-REPORT.md`. Reader-order
documents precede the gate candidate; no post-candidate product byte changed.

### Direct PTY and two-write proof

```text
bun test collab-electron/src/main/governed-review.test.ts
exit=0; 4 pass / 0 fail / 51 expect
```

Inspection confirmed `writeToSession()` returns `true` only after routing bytes
to a live non-destroyed data socket or retained PTY, otherwise `false`; it does
not use socket backpressure as failure. The green governed continuation proves
the production helper writes the terminal-CR-stripped instruction, waits 400 ms,
then writes exactly one separate `\\r`, with failed write status preventing a
delivered receipt or downstream governed work.

Independent write falsifiers, each against the unchanged focused test:

```text
1. Replace only the submit write with a no-op accepted value:
   exit=1; governed review critic submit write was not accepted
   restore: agent-host.ts SHA-256 0542DE9685FAC9FA67A9B9D5069B554EB1A90D97570F3EA27DEA5C5B75E6A7FA
   restored test: exit=0; 4 pass / 0 fail

2. Replace only textAccepted with writeToSession(...) && false:
   exit=1; governed review critic instruction write was not accepted
   restore: same SHA-256 and zero diff
   restored test: exit=0; 4 pass / 0 fail
```

### Gate correction and falsifier

`KERNEL_ALLOWED` contains exactly these four new literals under the adjacent
isolated-fixture/oracle comment:

```text
collab-electron/src/main/governed-review.test.ts
collab-electron/src/main/native-tui-orchestration.test.ts
collab-electron/src/main/ontology-gateway.test.ts
collab-electron/src/main/precreated-native-tui.test.ts
```

```text
bun qa/run.ts kernel-sole-writer-app
exit=0; PASS  kernel-sole-writer-app

Remove only governed-review.test.ts literal:
exit=1; collab-electron/src/main/governed-review.test.ts (node:sqlite)

Restore candidate gate bytes:
SHA-256 B18BF6EE5D19A5F00048B232C3FF08BE4066A15EB6AC3274EAAEE3C34B2AE03C
zero diff; rerun exit=0; PASS  kernel-sole-writer-app
```

### Ordered parent short matrix

All commands exited zero. Focused results were `12 pass / 0 fail`, `26 pass /
0 fail`, and `13 pass / 0 fail`; direct governed-review was `4 pass / 0 fail`.
Every named QA gate printed `PASS`: `governed-review`, `kernel-sole-writer`,
`kernel-sole-writer-app`, `lockfile-committed`, `no-canvas-domain-writes`,
`doc-action-surface`, `repo-shape`, `one-skin`, `doc-links`, and `rung-ladder`.
Both required `git diff --check` commands exited zero.

### Atlas and final checks

```text
bun qf-atlas/generate.mjs --check
exit=0; current — 432 files, 124 channels, 13 strip candidates

bun qf-atlas/ratchet.mjs
exit=0; HARD RED: 0; unexplained coverage: 0; undecided w/o blocker: 0

bun qf-atlas/generate.mjs --diff fef713c06f091dc8df13f7bde07be859d3b04930
exit=0; VERDICT: WORSE — one added, documented persistence-links finding

git diff --check
git diff --check fef713c06f091dc8df13f7bde07be859d3b04930 HEAD
exit=0 for both
```

### Verdict

`verdict: PASS`

## R16 independent verification — shared Artifact world isolation

**Result: PASS** — immutable product candidate
`7dda122435dce47adbc650e5d5b9d933db249263` passed the final independent
cross-Mission closure. Plain meaning: two real Missions may reuse the same
Dataset and result Artifact without exposing each other's history.

### Freeze, scope, and seam inspection

- Verification began and ended with evidence head
  `d9f112993e68dbf2b7efbfa743c5e6cfe76d7a14` on `wo-R16`; it was also the
  pushed `origin/wo-R16` head at measurement start. The only committed change
  from candidate to evidence head was `BUILD-REPORT.md`.
- Candidate product/test SHA-256 before verification:
  `research-world-projection.ts`
  `ECD64A563E53FE73BE8BDDEED59A49904284E12C789C5446A3B55FCBDBBDD279` and
  `research-world.test.ts`
  `155F75CE5204679DDF0DB68BC5FCE8D25C09FED585A2DB39451DFE46AE0EE64C`.
  The restored hashes matched exactly; both files had zero diff against the
  immutable candidate before this evidence append.
- Inspection of the named regression confirms each complete Mission is made
  with real Kernel actions: `execute(create_mission)`,
  `execute(create_hypothesis)`, `execute(create_task)`,
  `execute(execute_deterministic_run)`, the existing source-work binding,
  `requestGovernedReview`, delivery/receipt helpers, and
  `execute(record_evaluation)`. No direct ontology/link insertion is used.
  The two worlds have equal Dataset and result-Artifact IDs; their other named
  Mission, Task, Hypothesis, Run, review Task, Evaluation, findings/Report
  Artifacts, Director, executor, and critic IDs are distinct. For each root,
  the test compares the exact local 13 object and 15 link triples and asserts
  every other-world-only ID absent.

### Focused acceptance

```text
bun test collab-electron/src/main/research-world.test.ts
exit=0; 4 pass / 0 fail; 52 expect() calls
```

The fourth test is named `isolates two Missions that share Dataset and result
Artifact in both root directions`.

### Ordered 15-command parent matrix

Each row ran exactly once in this order and exited 0:

```text
1  bun test collab-electron/src/main/governed-review.test.ts
   4 pass / 0 fail / 51 expect
2  bun test collab-electron/src/main/research-world.test.ts
   4 pass / 0 fail / 52 expect
3  bun test collab-electron/src/windows/shell/src/research-world.test.ts
   6 pass / 0 fail / 32 expect
4  bun test collab-electron/src/windows/shell/src/task-composition.test.ts
   3 pass / 0 fail / 55 expect
5  bun test collab-electron/src/main/native-tui-orchestration.test.ts
   9 pass / 0 fail / 42 expect
6  bun test collab-electron/src/main/precreated-native-tui.test.ts
   2 pass / 0 fail / 5 expect
7  bun test packages/qf-kernel/src/r15-governed-review.test.ts
   7 pass / 0 fail / 55 expect
8  bun test packages/qf-kernel/src/r16-visible-world.test.ts
   3 pass / 0 fail / 5 expect
9  bun test qa/gates/governed-review.test.ts
   nested production/kernel 11 pass / 0 fail; live contract 7 pass / 0 fail;
   gate 3 pass / 0 fail
10 bun test qa/gates/research-world-visible.test.ts
   13 pass / 0 fail / 192 expect
11 bun qa/run.ts kernel-sole-writer
   PASS kernel-sole-writer
12 bun qf-atlas/generate.mjs --check
   current — 432 files, 124 channels, 13 strip candidates
13 bun qf-atlas/ratchet.mjs
   HARD RED: 0; unexplained coverage: 0; undecided without blocker: 0;
   AMBER: 20; undecided: 42
14 git diff --check
   exit=0
15 git diff --check fef713c06f091dc8df13f7bde07be859d3b04930 HEAD
   exit=0
```

### Executable projection-from-base falsifier and restoration

Only `collab-electron/src/main/research-world-projection.ts` was temporarily
changed, to its exact bytes from base
`5445578508e3b76f107e5c3ed40eafefd0e18319`; the test and every other path
remained unchanged.

```text
bun test collab-electron/src/main/research-world.test.ts
exit=1; 3 pass / 1 fail
```

The native assertion output named decoy-only IDs including
`agent_session:decoy-critic`, `mission:decoy-shared-mission`,
`run:decoy-shared-run`, and `task:decoy-shared-source-task`; it reported 11
unexpected objects. This proves the broad base traversal leaks through the
shared Artifact.

Candidate projection bytes were restored exactly. Restoration SHA-256 values
were the two frozen values above, and both candidate comparison commands
(`git diff --exit-code <candidate> -- <projection>` and `-- <test>`) exited 0.
The restored focused command exited 0 with exactly `4 pass / 0 fail` and 52
expect calls.

### Verdict

Atlas is current and its ratchet verdict is PASS (`HARD RED: 0`, unexplained
coverage `0`); both prescribed diff rows passed. No Electron build/launch,
consumer check, package/release gate, founder-state access, or R17 work ran.
Product and test bytes remained unchanged throughout normal verification.

`verdict: PASS`

## R16 independent verification — governed Artifact read closure

**Result: PASS** — immutable product candidate
`99188c6b3e039821c5c615c621a45d5c3f484ab9` passed the exact independent
governed-critic Artifact-read repair. Plain meaning: an admitted critic can
inspect the verified result payload, and the durable broker record contains
the same evidence.

### Freeze and seam inspection

- Verification started at clean pushed docs head `3aebb25d912103e3b32691b08dc56cb5dc028cec`
  on `wo-R16`; candidate `99188c6b3e039821c5c615c621a45d5c3f484ab9` was
  immutable and Builder evidence was `404b7274a03be3189d5360ae55948bbf783fd8b8`.
- The gateway imports and reuses the single exported R16 `artifactReceipt()`.
  Only an admitted governed `qf_artifact_get` receives the safe metadata plus
  verified receipt; `storage_ref` is omitted. The same enriched value is sent
  to `qf_review_invocation`. Non-governed Artifact, Hypothesis, and Run reads
  retain their prior shapes. The candidate test preserves the five existing
  blocks and appends one literal-oracle contract test.
- Frozen SHA-256 values before mutation, after restoration, and at handoff:

```text
51abb6d8ea34fac6466bb3f81e7507a2ff2211cb51b0b79181f912fdb2d9c77a  collab-electron/src/main/research-world-projection.ts
08ce2f507538e08ad30994b5d7cfbddf217fb4839e58bfea60b11819808e3c8a  collab-electron/src/main/ontology-gateway.ts
48189153395479484b323c4e2407409271a65d37921acf743074b55c06a2cbf0  collab-electron/src/main/ontology-gateway.test.ts
ece7a1dbe2f384ca6cb6ce36f7f0ddb527f758d8928198dd34f3f2c0cc4f66f9  collab-electron/src/main/governed-review.test.ts
87df5c7f0506bb966008611a0f592e942fd6e08a8dd1512d17dd90a0f71cf8b4  qf-atlas/ATLAS.md
9687a849734f6215605b46391ae3a258af320d96487e175f55ae9ebebf800156  qf-atlas/atlas.json
87df5c7f0506bb966008611a0f592e942fd6e08a8dd1512d17dd90a0f71cf8b4  qf-atlas/atlas.md
a459c1bc9e1c8ac8b4ef33a5b15c056f91241674b554866510a564e740b70206  qf-atlas/atlas.html
```

All frozen product/test/generated-Atlas paths had zero diff against the
candidate before this evidence append and after restoration.

### Exact nine-row immutable Verifier matrix

Each row ran once, in order, with native exit 0:

```text
1  bun test collab-electron/src/main/ontology-gateway.test.ts
   6 pass / 0 fail / 67 expect
2  bun test collab-electron/src/main/research-world.test.ts
   4 pass / 0 fail / 52 expect
3  bun test collab-electron/src/main/governed-review.test.ts
   4 pass / 0 fail / 51 expect
4  bun qa/run.ts kernel-sole-writer-app
   PASS kernel-sole-writer-app
5  bun qf-atlas/generate.mjs --check
   current — 432 files, 124 channels, 13 strip candidates
6  bun qf-atlas/ratchet.mjs
   HARD RED: 0; unexplained coverage: 0; undecided without blocker: 0;
   AMBER: 20; undecided: 42
7  bun qf-atlas/generate.mjs --diff fef713c06f091dc8df13f7bde07be859d3b04930
   VERDICT: WORSE; 1 visible explained coverage classification, native exit 0
8  git diff --check
   exit=0
9  git diff --check fef713c06f091dc8df13f7bde07be859d3b04930 HEAD
   exit=0
```

The Atlas diff's visible classification was retained unedited: the analyzer
reported `packages/qf-kernel/src/attach-kernel-drift.test.ts` persistence as
`not-applicable -> partial` because six SQL sites are outside named functions;
ratchet HARD RED and unexplained coverage remained zero.

### Exact gateway falsifier and restoration

Only `collab-electron/src/main/ontology-gateway.ts` was temporarily replaced
with its exact bytes from base
`7dda122435dce47adbc650e5d5b9d933db249263`. The only command run against the
mutation was:

```text
bun test collab-electron/src/main/ontology-gateway.test.ts
exit=1; 5 pass / 1 fail / 36 expect() calls
```

The native failure named the absent `receipt`: the governed Artifact result
returned the old `storage_ref` metadata instead of the verified receipt.
The candidate file was restored exactly; all four product/test paths had zero
diff against the candidate, and the restored command returned:

```text
6 pass
0 fail
67 expect() calls
```

No Electron build, normal application launch, founder-state access,
package/release gate, order/NEXT change, or R17 work ran. Product, test, and
generated-Atlas bytes remained frozen.

### Verdict

`verdict: PASS`

## R16 independent verification — exact numeric evaluation rubric

**Result: PASS** — immutable product candidate
`e94e544b1275958d22b3826dfec43bbfcae71c3f` passed the exact independent
numeric-rubric repair. Plain meaning: the critic is shown four bounded numeric
scores, so a valid evaluation can be recorded instead of rejected text.

### Freeze and unchanged-scope receipt

- Verification ran from docs head `b172ec13e6eeec3f93bea79fc64de7d2d6c5ab39`
  on `wo-R16`; Builder evidence was frozen at
  `c8c686997849c6df080f50cea24c5ce0f7b81b8c`.
- Candidate-to-HEAD changes were limited to `docs/orders/NEXT.md` and
  `docs/orders/evidence/r16/BUILD-REPORT.md`; the checkout was clean before
  the evidence append.
- No build, app launch, consumer check, founder-state access, order edit,
  product/test/generated-Atlas edit, credential access, or R17 work occurred.
- Candidate SHA-256 values before falsification, after restoration, and at
  handoff were identical:

```text
D84DE3362D842A3C192EB6314B12757C62B6C1356C9CA9D854FB7E10CBCBD942  qf-kernel-schema/src/ontology/research.ts
D56D2A58D817EF97C65B183FB0390282F3D044CD2FC8EB4FF379C867D624BC4D  qf-kernel-schema/src/generate.test.ts
09E2A2B57B515736B23E951EA2D90E69D37317EF3ED9852203660613AB05DBCD  qf-kernel-schema/golden/tools.json
31B9D45B062E56AEF7B8FCFC90BD11EE599C628BE326C3F60F3EFE829EFA89A4  collab-electron/src/main/ontology-gateway.test.ts
FB46A8C93047D8BDF6919227863870F5B75D4CA1E8B698C775FC54A96D4B2D3B  qf-atlas/ATLAS.md
A789746D3FC974F3267B66C84C1E6B90CD25531FC20EA288B7025E599A0E5516  qf-atlas/atlas.html
0C90C090DBE0FAA49702CB8F3EBBEAD4F66013C528AFD20FB98E2FF37A42FE82  qf-atlas/atlas.json
```

All seven frozen paths had zero diff against the immutable candidate before
the append and after restoration.

### Exact nine-row immutable Verifier matrix

Each row ran once, in order, with native exit 0. The matrix did not run either
generator command:

```text
1  bun test --cwd qf-kernel-schema
   178 pass / 0 fail / 613 expect calls
2  bun test collab-electron/src/main/ontology-gateway.test.ts
   6 pass / 0 fail / 70 expect calls
3  bun test collab-electron/src/main/governed-review.test.ts
   4 pass / 0 fail / 51 expect calls
4  bun qa/run.ts governed-review
   focused production/kernel proof 11 pass / 0 fail; PASS governed-review
5  bun qa/run.ts kernel-sole-writer-app
   PASS kernel-sole-writer-app
6  bun qf-atlas/generate.mjs --check
   current — 432 files, 124 channels, 13 strip candidates
7  bun qf-atlas/ratchet.mjs
   HARD RED: 0; unexplained coverage: 0; undecided without blocker: 0
8  git diff --check
   exit=0
9  git diff --check fef713c06f091dc8df13f7bde07be859d3b04930 HEAD
   exit=0
```

### Exact source-only falsifier and restoration

Only `qf-kernel-schema/src/ontology/research.ts` was restored from base
`99188c6b3e039821c5c615c621a45d5c3f484ab9`; the schema was regenerated, then
the two focused commands ran:

```text
bun run --cwd qf-kernel-schema generate
exit=0

bun test --cwd qf-kernel-schema
native exit=1; 177 pass / 1 fail / 613 expect calls
named failure: record_evaluation publishes an exact numeric rubric object
named defect: generic object shape with propertyNames={type:string} and additionalProperties={}; missing the four numeric properties, required list, bounds, and closed object

bun test collab-electron/src/main/ontology-gateway.test.ts
exit=0; 6 pass / 0 fail / 70 expect calls
```

The exact candidate source and generated bytes were restored. Restoration had
zero candidate diff; the restored focused commands returned `178 pass / 0
fail` and `6 pass / 0 fail`, respectively. Atlas remained byte-identical and
the matrix ratchet remained `HARD RED: 0`.

### Verdict

`verdict: PASS`

## R16 independent verification — sixteenth-cable repair

**Result: PASS** — immutable product candidate
`1b329e7c5d1825848b2d13345aef949136cfe73f` independently passed the
sixteenth-cable repair. Plain meaning: the research world retains its fifteen
intended cables even when the Kernel also holds the real Director-to-critic
relationship.

### Freeze and evidence identity

- Verification began at clean pushed docs head
  `4fcf12a5cb24fa3d94fc83be64d4e5b497456096` on `wo-R16`.
- Immutable product candidate:
  `1b329e7c5d1825848b2d13345aef949136cfe73f`
  (`fix R16 research world semantic cables`).
- Separate Builder evidence:
  `9cacd5208ca2c392649f423be8afe5f6d8b213a4`
  (`docs: record R16 sixteenth cable proof`).
- Source-only falsifier base:
  `e94e544b1275958d22b3826dfec43bbfcae71c3f`.

The following candidate bytes were frozen before the matrix, confirmed again
immediately before mutation, and reproduced exactly after restoration:

```text
74A3213124EEC532ED1A377E4335FE5BB8225B469A6C3410BD607432F457F5FC  collab-electron/src/main/research-world-projection.ts
EA0F160788CEB19113ACD73409A69AF1C631637B4633ED014BF9FFE26F529B88  collab-electron/src/main/research-world.test.ts
E1A6749B768FFA44884E0733467D7BDA4D05BCAD57EF6D9D763F36E7F64F0C6F  qf-atlas/ATLAS.md
185C32C7B8B831E07B86EA18B065108A939FC5ADBCF2AA8AE6DB076886D8F9AE  qf-atlas/atlas.json
87851E9C773E01A2974E28430305DA023542756A6FC08F911ECA4616E8D901A3  qf-atlas/atlas.html
```

### Exact immutable Verifier matrix

The final-section commands completed in the required order with native exit
zero. The first isolated-gate console detached before returning its receipt;
its child process completed, and one retained repeat of that same row supplied
the receipt below. No product, test, or generated-Atlas byte changed.

```text
1  bun test collab-electron/src/main/research-world.test.ts
   4 pass / 0 fail / 53 expect() calls
2  bun qa/run.ts research-world-visible
   PASS research-world-visible
3  bun qa/run.ts kernel-sole-writer-app
   PASS kernel-sole-writer-app
4  bun qf-atlas/generate.mjs --check
   current — 432 files, 124 channels, 13 strip candidates
5  bun qf-atlas/ratchet.mjs
   HARD RED: 0; unexplained coverage: 0; undecided w/o blocker: 0
6  git diff --check
   exit=0
7  git diff --check fef713c06f091dc8df13f7bde07be859d3b04930 HEAD
   exit=0
```

The retained isolated-gate receipt is exact:

```text
build_once_ms=58874 build_exit=0
forced_failure_phase=spawned_not_ready
forced-failure shutdown_requested=false owned_processes_remaining=0
forced_timeout_phase=spawned_not_ready elapsed_ms=513
forced-timeout shutdown_requested=false owned_processes_remaining=0
cleanup_preflight_ms=12611 forced_roots_remaining=0
pointer_tiles=10 inspect=10 collapse=10
oracle_tiles=13 oracle_cables=15 dom_tiles=13 dom_cables=15
first-launch shutdown_requested=true owned_processes_remaining=0
first_world_stage_ms=26655
roots_created=3 roots_remaining=0 retried=0 leaked=[]
primary_failure=null
cleanup_failures=[]
launch_attempts=3 ready_launches=1 active_launches=0 max_concurrent_launches=1
PASS  research-world-visible
```

The frozen candidate's recorded Atlas base-diff classification is
`VERDICT: WORSE — 1 analyzer cell(s) got worse`: one pre-existing added
`persistence links insert into` finding and the pre-existing
`packages/qf-kernel/src/attach-kernel-drift.test.ts` persistence coverage
classification `not-applicable -> partial`. It is outside this repair's five
paths; the independent currentness check and ratchet both remained green with
`HARD RED: 0`.

### Exact source-only falsifier and restoration

Only `collab-electron/src/main/research-world-projection.ts` was replaced with
its exact base bytes from `e94e544b1275958d22b3826dfec43bbfcae71c3f`.
The mutation SHA-256 was:

```text
51ABB6D8EA34FAC6466BB3F81E7507A2FF2211CB51B0B79181F912FDB2D9C77A
```

The focused command returned the required native red:

```text
bun test collab-electron/src/main/research-world.test.ts
exit=1; 3 pass / 1 fail / 52 expect() calls
expected length: 15
received length: 16
at the complete-world link assertion
```

The candidate projection was restored from
`1b329e7c5d1825848b2d13345aef949136cfe73f`; its restoration SHA-256 was
`74A3213124EEC532ED1A377E4335FE5BB8225B469A6C3410BD607432F457F5FC`.
All five frozen paths above then had zero diff against the candidate. The
restored focused command returned `4 pass / 0 fail / 53 expect() calls`, and
the five-path candidate diff exited `0`.

No normal Electron build or application launch, consumer-evidence edit,
founder-state access, product/test/generated-Atlas commit, assertion change,
or R17 action occurred in this verification.

`verdict: PASS`

## Independent Verification — Consumer Attempt 5 critic findings contract

Plain meaning: the critic's instructions and generated tool contract agree on
one strict finding format, and the frozen product remained unchanged while the
independent checks passed.

Candidate: `417e3178ad9eb9d2bdc88cbfab7d9f506c5965fa`. Router-docs HEAD and
`origin/wo-R16` were both
`6b256e3762af8c8ab531a0e76c8349e6fbd4d6ef` before and after the matrix.
`git diff --name-status 417e3178ad9eb9d2bdc88cbfab7d9f506c5965fa HEAD`
listed only `docs/orders/NEXT.md`, `docs/orders/WO-R16.md`, and
`docs/orders/evidence/r16/BUILD-REPORT.md`; its path-filtered form for the
eleven candidate product/test/generated paths returned no output before and
after the matrix.

SHA-256 hashes were recorded before and after (identical values):

```text
BEFORE                                                            AFTER                                                             PATH
30D6591255E986F80E7FE6C51DF5480567289A0D1220959F5AAE66F634747F69  30D6591255E986F80E7FE6C51DF5480567289A0D1220959F5AAE66F634747F69  collab-electron/src/main/governed-review.test.ts
4C1E7518AFC03AA76FEF9303A15AE3DB1B34E2ABBBF384C5C59AB42C03AB02FF  4C1E7518AFC03AA76FEF9303A15AE3DB1B34E2ABBBF384C5C59AB42C03AB02FF  collab-electron/src/main/index.ts
291F302AFD7D14F3CBB5CC5CC7AC49B38DB965C3051C23C7692FB923641B3789  291F302AFD7D14F3CBB5CC5CC7AC49B38DB965C3051C23C7692FB923641B3789  collab-electron/src/main/mission-activation.test.ts
A71787041D0396973D2331971EBE74159B609E101AD48BE49024BD75EA09EA7B  A71787041D0396973D2331971EBE74159B609E101AD48BE49024BD75EA09EA7B  collab-electron/src/main/mission-activation.ts
3CAB4B904FB23C7722C64C0DFD1F885D14209AE192486F6787A07F9F1D8EDC90  3CAB4B904FB23C7722C64C0DFD1F885D14209AE192486F6787A07F9F1D8EDC90  qf-atlas/ATLAS.md
99E6B7BC0FAC66E83A1AB880B84BA6E982ADF3D716B48864777A621297510090  99E6B7BC0FAC66E83A1AB880B84BA6E982ADF3D716B48864777A621297510090  qf-atlas/atlas.html
772670DC2A60454BB241B655F4967F2AB50464B1F97C20D1BB4247E0C9DC839C  772670DC2A60454BB241B655F4967F2AB50464B1F97C20D1BB4247E0C9DC839C  qf-atlas/atlas.json
4592C9D9809C8AE59037CA5B27A0A044DF8442228FB738181E87FF4AC0574DD7  4592C9D9809C8AE59037CA5B27A0A044DF8442228FB738181E87FF4AC0574DD7  qf-kernel-schema/golden/ONTOLOGY.md
B44EE1897E55C563BF99EA64ADD2AFAE5E649CBE0C27CDD767F76E766C4ABBDB  B44EE1897E55C563BF99EA64ADD2AFAE5E649CBE0C27CDD767F76E766C4ABBDB  qf-kernel-schema/golden/tools.json
5DAF1F44270AA825C83BADD67AD96165530B39FD0A3735FEA2852590D6AEB7E0  5DAF1F44270AA825C83BADD67AD96165530B39FD0A3735FEA2852590D6AEB7E0  qf-kernel-schema/src/generate.test.ts
E8B94113A5D47359D9F1D2F82CD32963586CF339596A728B169F5AB85F876A5F  E8B94113A5D47359D9F1D2F82CD32963586CF339596A728B169F5AB85F876A5F  qf-kernel-schema/src/ontology/research.ts
```

The two generator rows were omitted. Every remaining final Consumer Attempt 5
matrix row ran once, in order, with native exit `0`:

```text
1  bun test --cwd qf-kernel-schema                                      179 pass / 0 fail / 615 expect() calls
2  bun test collab-electron/src/main/mission-activation.test.ts         3 pass / 0 fail / 33 expect() calls
3  bun test collab-electron/src/main/ontology-gateway.test.ts           6 pass / 0 fail / 70 expect() calls
4  bun test collab-electron/src/main/governed-review.test.ts            5 pass / 0 fail / 56 expect() calls
5  bun qa/run.ts governed-review                                        12 pass / 0 fail; PASS governed-review
6  bun qa/run.ts kernel-sole-writer-app                                 PASS kernel-sole-writer-app
7  bun qf-atlas/generate.mjs --check                                    current: 432 files, 124 channels, 13 strip candidates
8  bun qf-atlas/ratchet.mjs                                             HARD RED: 0; unexplained coverage: 0; undecided w/o blocker: 0
9  git diff --check                                                     exit=0; no output
10 git diff --check fef713c06f091dc8df13f7bde07be859d3b04930 HEAD       exit=0; no output
```

No generator, build, application launch, consumer attempt, founder-state or
credential access, product/test/generated edit, or R17 work occurred.

`verdict: PASS`
