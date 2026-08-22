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
