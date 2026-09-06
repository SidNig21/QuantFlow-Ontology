# W1-01 paused source investigation

Bovada currently supplies UFC fight prices; the initial failure came from an incorrect route chosen by the Builder, and no product code was changed.

Paused on the founder's direction to require UFC first and remove NFL fallback authority. Branch is `codex/wo-wave1-foundation`, HEAD `9842868cca3fd0bbddafd2232989ce970e771529`. No commit, merge, push, worktree, schema edit, or product candidate was made. Only this evidence directory is untracked. Atlas has not been regenerated: the founder requested preserving the current state and stopping.

## Cause and measurements

The order did not supply a literal UFC URL. I inferred `martial-arts/ufc` instead of first resolving Bovada's public navigation. That was my error. HTTP 404 proved that exact candidate route failed; it did not establish UFC unavailability or justify a source-wide conclusion. The server's internal reason is not observable, but the controlled route change below isolates the wrong path as the operational cause.

All API requests used the existing `/services/sports/event/v2/events/A/description/` prefix, public GET, `Accept: application/json`, the existing fixed public user-agent, no credentials, same-origin final-response validation, a 20-second whole-request abort, and a streamed 5 MiB maximum. The disposable scripts ran outside the repository. Initial sandbox requests were unreachable; the authorized unsandboxed requests produced the HTTP receipts. No production transport was mutated.

| Suffix tried | Result | Evidence |
|---|---|---|
| `martial-arts/ufc` | 404, 2 bytes (`{}`), SHA-256 `44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a` | `live-door.txt` |
| `football/nfl` | 200, real Patriots/Seahawks moneyline; preserved solely as evidence, not adopted | `live-door.txt` |
| `ufc-mma/ufc` | 200, 34,197 bytes at `2026-09-06T04:51:49.266Z`, SHA-256 `3bd6158bf0741a7c4a110e703653a60e84ac008632b1c3c5b06487754d48fedb` | `ufc-route-detail.txt` |

The corrected slug came from Bovada's public [UFC/MMA navigation](https://www.bovada.lv/sports/ufc-mma) and its linked UFC competition route. No other API suffixes were tried. `ufc-route-cause.txt` preserves the first successful corrected request; its first coupon was Potential Fights and the probe's exact `Moneyline` label lookup returned null. The follow-up inspected every coupon and established that the actual market label is `Fight Winner`.

One actual scheduled sample: JJ Aldrich vs Regina Tarin, event `30385179`, competition `29388400` (UFC Fight Night: Silva vs Delgado), starts `2026-09-12T18:00:00.000Z`, event status `U`, live false. Market `523742998`, key `2W-12`, type `120789`, period `12122` / Bout / main, status `O`. Aldrich competitor `30385179-16525137`, selection `2396944866`, +205 / 3.050. Tarin competitor `30385179-20622484`, selection `2396944867`, -245 / 1.408163. The rendered public listing independently showed both names, September 12 at 11 AM Pacific, and +205/-245. A second scheduled sample and the separate Potential Fights coupon are in the receipt.

Event lastModified was `2026-09-05T21:44:39.932Z`. Quote-specific provider update time is unavailable; event modification time and local observation time must not be called quote update time. Potential Fights must not be admitted as a confirmed scheduled fight merely because a future placeholder date and open market exist.

## Existing seams and remaining work

Read `tools/qf-bovada-football/src/constants.ts`, `transport.ts`, `parser.ts`, and `runner.ts`. The transport is fixed to NFL. Parser predicates require Football/NFL identity, `Moneyline`, and `Game`; runner mappings also name football/NFL. Thus the existing production capture cannot be called a UFC implementation merely by changing its URL. UFC adds a TOUR path node, uses MMA identity, Fight Winner and Bout, and includes Potential Fights that require explicit exclusion. None of these seams was edited.

Live/current UFC response availability is demonstrated. Full Deliverable 0 is not closed: no UFC historical identity mapping or historical statistic falsifier was completed. Ryan's resolved UFC history remains an offered input, not an inspected dataset. The prior NFL historical cross-check and recomputed score difference remain in `live-door.txt`; they do not satisfy a UFC-only door. No schema, Dock, Canvas, investigation, reopen, cleanup acceptance, or package capability is claimed.

## Frozen starting checks

Unedited command output is retained as `starting-*.txt`; commands were `bun qf-atlas/generate.mjs --check`, `bun qf-atlas/ratchet.mjs`, and `bun qa/run.ts <gate>`.

- Atlas check and ratchet: stale at entry; zero hard reds. Fingerprints `9e32fe41df007381` versus `392930855138033e`.
- Exit 0: market-ingest, market-context, schema, doc-action-surface.
- bovada-football: core tests, five-bait gate, RPC tests and generated surface passed; package portion requires canonical `QF_RELEASE_RUN_ID` and package receipt.
- research-director-front-door: Windows process snapshot denied by sandbox.
- tool-discovery: package cache permissions denied.
- kernel: 111 pass, 4 fail, all R12 independent-critic fixtures rejected for missing exact succeeded Run/Hypothesis/Artifact/executor/R14 source-Task lineage. This was present before product edits; no test was weakened or repaired.
- golden-g10-canvas-runtime: candidate build denied directory access. pre-r18-coherence: candidate build exited 1; its output does not establish a more specific cause.
- typecheck: frozen install could not write to tempdir.

The starting commands themselves refreshed local file dependencies and attempted builds; tracked files stayed unchanged. They are not all green, and sandbox failures are not product failure diagnoses. No final package gate was run. Disposable request scripts terminated and were deleted; their final request receipt says `owned_requests=0`. Full app-owned process/root cleanup was not measured because no app capability was built.

Judgment correction: I switched toward NFL too quickly after an inferred UFC URL returned 404. The corrected public route succeeds. The next authorized Builder should start with that measured UFC response and the amended order, while keeping Potential Fights, historical identity resolution, and quote-time uncertainty explicit.
