# Phase 3 continued current-floor Builder receipt — 2026-08-30

This run proved the real packaged Director and the missing live-composition boundary, while preserving three product reds that still block any Phase 3 candidate.

status: **EVIDENCE ONLY / NOT A CANDIDATE / P14-A, P14-C, P13-P16, AND P15 RED**

## Immutable source and reused release proof

- execution source: `0c6287fd09d749379eb430d3534e27f41c5f75a5`
- tree: `c6774cd92af45e09fc98f961cba7d1848757da4f`
- sole parent: `ebd57d8d9b40c6c206b2b6b463b3885bc63e8125`
- executable-surface changed paths versus `c467645063bc51b710c684edf7a244874a85457f`: `0`
- executable-surface changed paths versus `9a0e6359fab034e4504512b5acfa635d5028bbf7`: `0`
- Atlas fingerprint: `3a743908537a556b`; generated check PASS; ratchet PASS; HARD RED `0`
- reused canonical release log SHA-256: `D02DA4D85F119EA49AA6A301DCC6D307BB0EF7662D8FBBD1FB7C80AEA1C28B29`
- focused current-source package log: `EBC385AE77552C78F53883286986CC42396F33AE970286D76C129E42D27826DD` (`1,422` bytes); embedded identity `0c6287fd09d749379eb430d3534e27f41c5f75a5`; exit `0`

## P14-A — admission RED, diagnostic preserved

The production packaged CLI/RPC request reached the selection boundary and returned `Bovada football selection rejected: no future open NFL Game-Line moneyline satisfied every predicate`; capture exit `1`, normal shutdown accepted, app exit `0`. Reaching and storing source data is not successful market admission.

- production+analyzer receipt SHA-256: `3E27F677E42BE2097CDB621FAD49892DDA0C27B59020C78DE5E5344EFF5D4928` (`8,964` bytes)
- source Artifact/content hash: `767b50d3ea7ecc588e94cb4bfa15e75457dcaf5bd45113d518ff126aa28255c4`
- body bytes: `884170`
- Artifact created/observed time: `2026-08-30T11:49:08.838Z`
- aggregate taxonomy: coupons `1`; exact `SPORT/FOOT` paths `0`; NFL league paths `1`; unique FOOT/NFL paths `0`
- later sequential event/market predicate reach counts: all `0`; eligible markets `0`; event timestamp range unavailable because no event entered the exact candidate path
- exact source delta: Artifact `1`; Venue `0`; MarketEvent `0`; Instrument `0`; Quote `0`; links `0`
- transport metadata authority: production process/error receipt and reached selection code only; the no-refetch analyzer made no independent transport claim
- forbidden output check: no raw response, team/competitor names, odds, headers, or credentials were emitted

The separate scheduled capture was set within 24 hours, then cancelled through normal app shutdown. The CLI returned `Bovada capture canceled: app shutdown`, exit `1`; app exit `0`; Artifact/Venue/MarketEvent/Instrument/Quote/link counts were exactly zero before and after.

- cancellation receipt SHA-256: `F1A4B04E413D0B92EC29648C692DBD93D4B0E41B2C74EEE6E2663C39BE8C57F7` (`4,183` bytes)

P14-A remains **RED** because no MarketEvent/Instrument/Quote admission succeeded.

## P14-B — real packaged Director GREEN

The current packaged app admitted the production `hermes-research-director` definition with runtime profile `default` through the Dock native-TUI boundary. All environment variables containing `SYNTHETIC` or the proof prefix were absent. The external terminal transcript contained `QF_PHASE3_REAL_TURN_OK`.

- Kernel AgentSession: `4fa6df80-922d-49f2-92bb-f0f2ae10ce5c`
- PTY/guest identity: `2f1cc599507b1847`
- link: exactly `spawned_from` Session → `hermes-research-director`
- lifecycle: exactly `agent_session.created`, then `agent_session.started`
- post-turn row status observed after app exit: `running` (preserved exactly; not normalized)
- transcript bytes: `8695`
- transcript SHA-256: `3387A40908ACF48956AAE5FF49E8BF6AB117A97495AED12F01D1471DA42DB595`
- provider/model: `provider-model-identity-unprovable`
- research-domain counts: Mission `0`, Hypothesis `0`, Dataset `0`, Run `0`, Artifact `0`, Evaluation `0`, Report `0`
- app shutdown accepted; app exit `0`
- P14-B receipt SHA-256: `54BDE20B95E734454174E2F11264F6D9A3706712BD59A5CA53E3332B37B8FA9B` (`8,633` bytes)

## P14-C — RED

The accepted R17 outcome gate produced both required zero-delta refusal baits (`missing-malformed-technique` and unavailable authenticated gateway), then failed before settlement with `R17 pre-settlement world cardinality 15/17`.

- receipt SHA-256: `1EEC16D65A729944352F328A5886ACBB6FC3E2BFDBBE1889924DE78BDF6CA417` (`1,124` bytes)
- cleanup: `roots_remaining=0`, `leaked=[]`

No guided settled result, Evaluation, current Report, or reopen claim is made. P14-C remains **RED**.

## P14-D — GREEN

Read-only inventory found 43 generated actions, 99 served tools, and 46 discovered production control identifiers. None is a production capture→Dataset admission action.

- generated relevant actions: none
- served relevant tools: Dataset reads/links/query, MarketEvent reads/links/query, and `qf_register_dataset_version`
- relevant controls include the independent `market.bovadaFootballCapture` capture control and sample/fixture Dataset controls; none composes capture into Dataset admission
- exact downstream pre/post counts tied to the retained source Artifact: Dataset `0`, Run `0`, non-source result/report Artifact `0`, Evaluation `0`, Report `0`
- classification: `R18 seam unavailable`
- product refusal emitted: `false`
- bet or trade: `false`
- successful inventory receipt SHA-256: `6B7A2D944FA7804C8D506FCDAA8361264161E9E6B3FC62A78AC44256768A0710` (`3,444` bytes)

## P13/P15/P16/P17 outcomes

- P13/P16 packaged coherence receipt SHA-256: `721CF3C7A88843FDF3FA59D26716E76EBA6D8F05A16A0A35CA3AFBA140484F18` (`1,112` bytes). Dock isolation and initial UI↔Kernel participant projection passed; the unit then failed `R17 settled ticket timed out`. It cleaned `roots_remaining=0`, `leaked=[]`. P13/P16 remain **RED**.
- P15 receipt SHA-256: `B9097DE542D0D403AEF0273CD576B1C9F9EDA9E03A91DFC9C6A78E5AABE777FE` (`1,097` bytes). It failed `original Task timed out`; cleanup was `processes_remaining=0`, `roots_remaining=0`, `leaked=[]`. P15 remains **RED**.
- final owned run root: `0`; packaged processes: `0`; shared checkout was clean before this evidence file was created.

## Judgment

P14 units were kept independent as authorized. P14-A source reachability was not reclassified as admission; P14-C, P13/P16, and P15 timeouts were not hidden by their partial greens. The real Hermes transcript is execution evidence only, and its provider/model identity was not inferred from self-report. No candidate, Verifier acceptance, Golden designation, product repair, test/gate change, R18 work, bet, or trade was created.
