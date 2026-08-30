# Phase 3 P14-A one-shot live measurement authority — 2026-08-30

Phase 3 has no canonical command for its already-authorized live P14-A measurement, so one non-registered one-shot entry point may be added without changing capture or parser behavior.

status: **FRESH SEMANTIC READER YES / YES / ONE-FILE DIAGNOSTIC COMMAND OPEN / P14-A REMAINS RED PENDING ADMISSION**

- Reader task: `01a05212-f0e4-7101-a0d9-8e59df8a3f08`
- Reader adjudication: **YES / YES — no canonical live measurement command exists; finite one-file diagnostic entry point required**
- authority base commit: `0db14c90f485c9273770eae282191a0a3f8a7358`
- authority base tree: `6eb30ac67d1cf67a3ed3c7ffcc6907b4762ce54c`
- sole executable path: `qa/gates/bovada-football/run.ts`
- exact invocation: `bun qa/gates/bovada-football/run.ts --p14-a-measure-once`

Scope reason: the packaged capture and safe no-refetch diagnostic are already authorized, but no deterministic command composes their required lifecycle and evidence ordering. The owner is the existing Bovada gate runner as an unregistered direct entry point, not `qa/run.ts`, the product parser, selection logic, packaged CLI, Kernel, or any release gate.

## Preserved current dirty set

This docs/evidence task does not touch or stage the eleven existing authorized dirty paths:

| Unstaged path | Working blob | Per-file binary-diff hash |
| --- | --- | --- |
| `collab-electron/cli/qf-hermes-synthetic-responder.mjs` | `72384f9400835799cc5994c4260a16942e95c151` | `ddda2f6d281f48320d9314e507044ab55e05d002` |
| `collab-electron/cli/qf-hermes-synthetic-responder.test.ts` | `eabe883d6def947a05dfe31b0bfdb6711b533e5d` | `3dface6b45930081b1b3b6e2fb3f28e66e85da1b` |
| `collab-electron/src/windows/shell/src/cable-overlay.js` | `1d365e7d631ee134cee879e8c4468df327370ec3` | `f38f418d66e5b614b12280c7bba2ba3abfdab34c` |
| `collab-electron/src/windows/shell/src/cable-overlay.test.ts` | `05d707c06787c6f3ee3aeb6ba0de86f0e80a4903` | `315c5e4f105060f691aa99d88a1140aa903625fe` |
| `collab-electron/src/windows/shell/src/research-world.js` | `8a42c0ae8c1c465c42b37132f43da4a3442cc06f` | `d92ae622c5270d9387e57c9b8f45540733fdf6a9` |
| `collab-electron/src/windows/shell/src/research-world.test.ts` | `9e66ef7ba1f6e54743154e4e39a12c441192df21` | `394bef7b31db51b18256a49443a00e1924813ae7` |
| `qa/gates/founder-steering.ts` | `0b200734bbf1be43fffe596317557d4fe8357347` | `1d9b32f5eb5a4f617c4d4e599027e3ae85b2f71d` |
| `qa/gates/pre-r18-coherence.ts` | `42ca268bb96f4e198f0aa06f88b33f1594341b91` | `3ddfcbc8f431542057e0a6ad2ccb6fa36d9e2235` |
| `qf-atlas/ATLAS.md` | `4e05cc86392d7326b006632dc08bdc39b1014354` | `cd1eaa550216b0de257b738724bf0bd2ae9d3dcb` |
| `qf-atlas/atlas.html` | `f5f7c068de450a808fa2224a7691628608463e74` | `af1687c72eb71e7c5f82e2866428d630a9ea3af8` |
| `qf-atlas/atlas.json` | `285ec3c902b9fef4b9dc470428a906abcc30bc24` | `dad52614ea6a466026a492eb6c533f380a94c55d` |

The Builder may resume that dirty set under existing authority and add only the one Bovada runner path named above.

## Exact one-shot dispatch and lifecycle

Add `runP14ALiveMeasurement()` and dispatch it solely when both `import.meta.main` is true and `process.argv[2] === "--p14-a-measure-once"`. The default registered/exported Bovada gate path and every other direct invocation remain byte/behavior compatible. Do not register this mode in `qa/run.ts`, add an alias, or make it run during ordinary gate/release verification.

The one-shot function creates a fresh run-owned isolated root and launches the current isolated packaged application. Through that packaged app, invoke exactly its packaged `resources/collab-cli.mjs market bovada-football --once` route. Wait for the CLI result. After that result and before application shutdown or cleanup, identify the newly published source Artifact from this run and analyze its stored bytes directly with no refetch.

The analyzer and lifecycle bind the execution source and packaged invocation to the exact new source Artifact/content hash. They record exact pre/post ontology counts for Artifact, Venue, MarketEvent, Instrument, Quote, and links, then shut down normally and prove owned process/root cleanup zero. Any scheduled-cancellation control remains governed by the existing P14-A authority and is not replaced by this one-shot measurement.

## Exact output allowlist

The command may emit only:

- execution-source/package identity hashes and the exact new source Artifact ID/content hash;
- distinct path-node tuples for the coupon containing the exact NFL league, limited to `type`, `id`, SHA-256 of `description` rather than description text, cardinality, and order/parent position, with execution and Artifact hashes bound;
- aggregate parser/funnel counts already authorized by P14-A, including coupon/path reach and sequential admission-predicate counts, without names or payload fragments;
- exact pre/post ontology object/link counts and their delta;
- transport facts copied from the original packaged CLI process/error receipt only: observed HTTP status, approved-final-origin validation, and JSON media-type validation when present there, never inferred by the analyzer;
- final owned process/root cleanup counts, which must be zero.

It must not emit raw response bytes, raw JSON, descriptions, names, teams, competitors, odds, outcomes, headers, URLs beyond the approved-origin fact, credentials, environment values, stack dumps containing payload data, or any unlisted field.

## Stop and classification rules

Stop RED after normal confined cleanup if the packaged command cannot launch, the CLI result is unavailable, the newly published source Artifact is not uniquely attributable to this run, its stored bytes cannot be analyzed without refetch, either identity hash cannot be bound, output cannot remain within the allowlist, pre/post counts cannot be exact, or any owned process/root remains. Do not print unsafe evidence to explain the stop.

The original packaged receipt alone owns transport claims; the no-refetch analyzer owns stored-content tuples/counts only. Source reachability, a new Artifact, HTTP 200, or diagnostic tuples do not constitute admission. P14-A remains diagnostic/RED unless the ordinary unchanged product path successfully admits the required MarketEvent, Instrument, Quote, and links. Report that admission only from the normal product result and exact Kernel delta.

## Preserved authority and stops

No parser, selection predicate, product, packaged CLI, Kernel write path, schema, fixture, network endpoint, credential flow, gate registration, timeout, retry, or acceptance meaning changes. No new dependency, cache/truth store, refetch, mocked payload, or hard-coded admission is authorized.

P14-A parser/selection mutation remains closed pending tuple adjudication. P18/candidate freeze, independent Verifier acceptance, Golden designation, `main`, every remote ref, and R18 remain closed. No candidate is permitted until P01-P17 are green. Any second new executable path or broader diagnostic output stops for new authority.
