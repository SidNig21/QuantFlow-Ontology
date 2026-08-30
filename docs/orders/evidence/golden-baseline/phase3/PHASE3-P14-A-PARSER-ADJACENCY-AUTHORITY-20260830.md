# Phase 3 P14-A parser adjacency authority — 2026-08-30

Completed live tuple adjudication proves exactly two coupled contiguous path windows—one fixture tuple and one measured-live tuple—without authorizing their cross-product.

status: **FRESH SEMANTIC READER YES / YES / TWO-FILE PARSER REPAIR OPEN / LIVE REPROOF REQUIRED**

- Reader task: `01a05212-f0e4-7101-a0d9-8e59df8a3f08`
- Reader adjudication: **YES / YES — prior forward alias cross-product falsified; exactly two coupled ordered tuples accepted**
- initial authority base commit: `fa3c5a26265f61934cc49d5b8616cea13580392a`
- correction authority base commit: `8b74807cd4d6ec033aaa05fd5462cbcd74c11cc3`
- correction authority base tree: `a218f958e4cf6cb24870ac20b8ad4037fa28ea4c`
- parser path: `tools/qf-bovada-football/src/parser.ts`
- focused test path: `tools/qf-bovada-football/src/parser.test.ts`

Scope reason: the fixture proves tuple A, `SPORT/FOOT/Football` immediately followed by `LEAGUE/241/NFL`. The safe live measurement proves tuple B in the opposite order, `LEAGUE/241/NFL` immediately followed by `SPORT/1/Football`. These are coupled tuple alternatives, not independent SPORT-ID and ordering aliases. Event selection and every later market predicate remain correct and unchanged.

## Preserved current dirty set

This correction docs/evidence task does not touch or stage the fourteen existing authorized dirty paths:

| Unstaged path | Working blob | Per-file binary-diff hash |
| --- | --- | --- |
| `collab-electron/cli/qf-hermes-synthetic-responder.mjs` | `72384f9400835799cc5994c4260a16942e95c151` | `ddda2f6d281f48320d9314e507044ab55e05d002` |
| `collab-electron/cli/qf-hermes-synthetic-responder.test.ts` | `eabe883d6def947a05dfe31b0bfdb6711b533e5d` | `3dface6b45930081b1b3b6e2fb3f28e66e85da1b` |
| `collab-electron/src/windows/shell/src/cable-overlay.js` | `1d365e7d631ee134cee879e8c4468df327370ec3` | `f38f418d66e5b614b12280c7bba2ba3abfdab34c` |
| `collab-electron/src/windows/shell/src/cable-overlay.test.ts` | `05d707c06787c6f3ee3aeb6ba0de86f0e80a4903` | `315c5e4f105060f691aa99d88a1140aa903625fe` |
| `collab-electron/src/windows/shell/src/research-world.js` | `8a42c0ae8c1c465c42b37132f43da4a3442cc06f` | `d92ae622c5270d9387e57c9b8f45540733fdf6a9` |
| `collab-electron/src/windows/shell/src/research-world.test.ts` | `9e66ef7ba1f6e54743154e4e39a12c441192df21` | `394bef7b31db51b18256a49443a00e1924813ae7` |
| `qa/gates/bovada-football/run.ts` | `ff161e66c6cee21e2406204c790f7990c0a32533` | `fa39cc1be7fc7dd337cb3ee35e48e69c485f70f9` |
| `qa/gates/founder-steering.ts` | `0b200734bbf1be43fffe596317557d4fe8357347` | `1d9b32f5eb5a4f617c4d4e599027e3ae85b2f71d` |
| `qa/gates/pre-r18-coherence.ts` | `42ca268bb96f4e198f0aa06f88b33f1594341b91` | `3ddfcbc8f431542057e0a6ad2ccb6fa36d9e2235` |
| `qf-atlas/ATLAS.md` | `4e05cc86392d7326b006632dc08bdc39b1014354` | `cd1eaa550216b0de257b738724bf0bd2ae9d3dcb` |
| `qf-atlas/atlas.html` | `f5f7c068de450a808fa2224a7691628608463e74` | `af1687c72eb71e7c5f82e2866428d630a9ea3af8` |
| `qf-atlas/atlas.json` | `285ec3c902b9fef4b9dc470428a906abcc30bc24` | `dad52614ea6a466026a492eb6c533f380a94c55d` |
| `tools/qf-bovada-football/src/parser.test.ts` | `f1a31d6b252d847b582a0a461fbed0b02ee3dba8` | `29708f8c7394539bbb9040c2c4b172279d1522ce` |
| `tools/qf-bovada-football/src/parser.ts` | `f1da867e0bd49eb98ecb876c06ed5be9c84f32a1` | `627a5545a8133c150971ae10cd6b684fd2c3af14` |

The Builder may resume that dirty set under existing authority and add only the parser and parser-test paths above.

## Exact candidate-path grammar

A candidate NFL path is exactly one recognized adjacent ordered sibling window under the same parent. The only recognized windows are:

- **Tuple A — fixture:** `SPORT { id: "FOOT", description: "Football" }` immediately followed by `LEAGUE { id: "241", description: "NFL" }`.
- **Tuple B — measured live:** `LEAGUE { id: "241", description: "NFL" }` immediately followed by `SPORT { id: "1", description: "Football" }`.

Both tuples return the same semantic sport/league result. `SPORT/1/Football → LEAGUE/241/NFL` is explicitly unproven and rejected. `LEAGUE/241/NFL → SPORT/FOOT/Football` is explicitly unproven and rejected. Do not form a cross-product, sort nodes, convert them to sets, search SPORT and LEAGUE independently, join across parents/coupons, normalize case, trim values, or derive any other alias/order.

Exactly zero recognized windows makes that coupon/path a noncandidate. More than one recognized window in the selection domain throws `BovadaSelectionError` for ambiguity; it must not choose first/last, merge, or deduplicate them. Missing or non-string required `type`, `id`, or `description` fields remain structurally fail-closed as `SchemaError`, not noncandidate or selection ambiguity.

Once the unique path is found, event `competition.id === "241"` and every later existing predicate remain byte/meaning unchanged: competition, live, status, future time, competitors, Game Lines, Moneyline, market status, period description, live, main, outcomes, and ambiguity handling.

## Ten-case focused mutation matrix

The focused parser tests must cover these ten exact categories:

1. Tuple A positive: exact contiguous `SPORT/FOOT/Football → LEAGUE/241/NFL` returns the expected semantic sport/league.
2. Tuple B positive: exact contiguous `LEAGUE/241/NFL → SPORT/1/Football` returns the same semantic sport/league.
3. Unproven cross negative: `SPORT/1/Football → LEAGUE/241/NFL` is a noncandidate.
4. Unproven cross negative: `LEAGUE/241/NFL → SPORT/FOOT/Football` is a noncandidate.
5. Coupling failures: separated nodes, a non-A/non-B reorder, and SPORT/LEAGUE halves split across coupons/parents are noncandidates and never independently joined.
6. Wrong IDs, including SPORT `2` or LEAGUE other than `241`, are noncandidates.
7. Wrong descriptions are noncandidates.
8. Any case change in `SPORT`, `LEAGUE`, `Football`, or `NFL` is a noncandidate.
9. A+A, B+B, and A+B recognized-window inputs each throw `BovadaSelectionError` ambiguity.
10. Missing or non-string required fields, with field/type subcases in either tuple, throw `SchemaError`.

Mutation cases must assert error class and exact candidate/noncandidate meaning, not only counts or generic throw. Existing downstream predicate tests remain unchanged and must still fail when any later predicate is mutated.

## Fresh live proof and stops

After the corrected focused parser tests and their red/green baits, run exactly one final fresh isolated live capture through the authorized one-shot measurement path. Normal Kernel success may be reported only if the unchanged later predicates admit exactly one eligible event/market and create the exact MarketEvent, Instrument, Quote, and link delta. If tuple B is recognized but a later unchanged predicate rejects or yields ambiguity, preserve that exact later RED and its safe aggregate evidence; do not broaden the parser or reinterpret it as success.

No raw payload, name, team, odds, header, or credential may be emitted. No second capture is authorized by this amendment solely to chase a later RED.

## Preserved authority and stops

No fixture file, gate runner, one-shot runner, Kernel, schema, packaged CLI, network, admission object/link mapping, timeout, retry, or later predicate change is authorized. No cross-product, sorting/set normalization, independent node search, dependency, regex/loose matcher, raw-data log, hard-coded event, or alternate parser path is permitted.

P18/candidate freeze, independent Verifier acceptance, Golden designation, `main`, every remote ref, and R18 remain closed. No candidate is permitted until P01-P17 are green. Any third new executable path, additional alias, or later-predicate repair stops for new authority.
