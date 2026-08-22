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
