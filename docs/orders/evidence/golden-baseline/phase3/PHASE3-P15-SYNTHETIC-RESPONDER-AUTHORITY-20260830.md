# Phase 3 P15 synthetic-responder authority — 2026-08-30

The deterministic QA responder no longer reaches its exact second-opinion delivery branch, so only its strict two-contract dispatch may be repaired.

status: **FRESH SEMANTIC READER YES / YES / TWO-FILE QA RESPONDER REPAIR OPEN**

- Reader task: `01a05212-f0e4-7101-a0d9-8e59df8a3f08`
- Reader adjudication: **YES / YES — real P15 deterministic QA responder regression**
- regression commit: `82011c5f934aca5d15b692bed883d1addfc19245`
- regression tree: `692900a2c736eaf5c810542a5caeb7076c337169`
- authority base commit: `c168bdbc2a4262460f9bb7d5aabd4141b65b77a5`
- authority base tree: `c9898c44f1aa58480f95e4b0baa0150eda40595d`
- added responder path: `collab-electron/cli/qf-hermes-synthetic-responder.mjs`
- added focused test path: `collab-electron/cli/qf-hermes-synthetic-responder.test.ts`

Scope reason: commit `82011c5f...` made `nextReview` accept only `parseCriticMission`, so a valid exact `qf.task.second_opinion.v1` delivery cannot reach the deterministic responder branch that acknowledges the requested review. This is a QA responder dispatch regression, not a Main, Kernel, gateway, peer-identity, product contract, timeout, or P15 gate-semantics defect.

## Preserved current dirty set

This authority task does not touch or stage the eight already-authorized dirty paths. Their identities before this authority commit are:

| Unstaged path | Working blob | Per-file binary-diff hash |
| --- | --- | --- |
| `collab-electron/src/windows/shell/src/cable-overlay.js` | `1d365e7d631ee134cee879e8c4468df327370ec3` | `f38f418d66e5b614b12280c7bba2ba3abfdab34c` |
| `collab-electron/src/windows/shell/src/cable-overlay.test.ts` | `05d707c06787c6f3ee3aeb6ba0de86f0e80a4903` | `315c5e4f105060f691aa99d88a1140aa903625fe` |
| `collab-electron/src/windows/shell/src/research-world.js` | `8a42c0ae8c1c465c42b37132f43da4a3442cc06f` | `d92ae622c5270d9387e57c9b8f45540733fdf6a9` |
| `collab-electron/src/windows/shell/src/research-world.test.ts` | `9e66ef7ba1f6e54743154e4e39a12c441192df21` | `394bef7b31db51b18256a49443a00e1924813ae7` |
| `qa/gates/pre-r18-coherence.ts` | `42ca268bb96f4e198f0aa06f88b33f1594341b91` | `3ddfcbc8f431542057e0a6ad2ccb6fa36d9e2235` |
| `qf-atlas/ATLAS.md` | `4e05cc86392d7326b006632dc08bdc39b1014354` | `cd1eaa550216b0de257b738724bf0bd2ae9d3dcb` |
| `qf-atlas/atlas.html` | `f5f7c068de450a808fa2224a7691628608463e74` | `af1687c72eb71e7c5f82e2866428d630a9ea3af8` |
| `qf-atlas/atlas.json` | `285ec3c902b9fef4b9dc470428a906abcc30bc24` | `dad52614ea6a466026a492eb6c533f380a94c55d` |

The Builder may resume those paths under their existing authority and add only the two responder paths named above.

## Exact strict dispatch contract

`nextReview` accepts exactly a successfully parsed `qf.task.second_opinion.v1` delivery and returns exactly `{ secondOpinion: delivery }`. The acknowledgement must use the exact `review_id` from that parsed delivery and must not substitute a task ID, previous review ID, regex capture, or inferred peer identity.

For every input that is not an exact valid `qf.task.second_opinion.v1` delivery, `nextReview` retains the existing strict `parseCriticMission` path and its exact `QUANTFLOW_MISSION` contract. A malformed second-opinion envelope, wrong contract/version/kind, missing or wrong review ID, or arbitrary payload must be rejected unless it independently satisfies the unchanged strict critic-Mission parser.

No loose carried state, permissive regex, raw governed-review payload shortcut, substring match, remembered prior delivery, or fallback fabrication is authorized. The two accepted inputs are independently parsed exact contracts; failure of one parser does not weaken the other.

## Required focused falsifiers

1. Feed one exact valid `qf.task.second_opinion.v1` delivery and require the responder acknowledgement to contain the exact delivered `review_id`; restoring the `parseCriticMission`-only regression must RED because no exact acknowledgement is emitted.
2. Change the review ID, contract name/version/kind, required field, or envelope shape: RED; no second-opinion acknowledgement and no carried prior review.
3. Feed raw governed-review content, a regex-compatible substring, or an unwrapped object: RED unless it independently satisfies the unchanged strict `QUANTFLOW_MISSION` grammar.
4. Feed the normal exact `QUANTFLOW_MISSION` critic input: the existing strict `parseCriticMission` path remains GREEN and byte/meaning compatible.
5. Sequence a valid second opinion followed by malformed/wrong input: the latter REDs and cannot reuse the earlier delivery.

## Preserved authority and stops

P15 gate assertions, timeouts, delivery protocol, Main process, Kernel truth/write path, gateway behavior, peer/session identity, Task/Review identity, refusal zero delta, and normal critic-Mission behavior remain unchanged. This deterministic responder is QA proof infrastructure only and does not add a production shortcut or synthetic Task.

No gate edit, timeout increase, retry loop, Main/Kernel/product change, loose parser, credential, network/service, or new contract is authorized. P14-A parser/selection mutation remains closed and measurement pending. P18/candidate freeze, independent Verifier acceptance, Golden designation, `main`, every remote ref, and R18 remain closed. No candidate is permitted until P01-P17 are green. Any third new executable path or semantic expansion stops for new authority.
