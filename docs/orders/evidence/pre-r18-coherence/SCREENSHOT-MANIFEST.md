# Pre-R18 Coherence Screenshot Manifest

These fourteen captures come from product/proof candidate
`eecb2457eef6a71d888129c0bb353129956478d1` through the production Electron
shell and renderer with the bounded `QF_PRE_R18_CAPTURE=1` evidence switch.
Every image uses `webContents.capturePage` at 1600×1000, 100% scale, and
`devicePixelRatio=1`. Object/link counts are measured from the live DOM at each
checkpoint.

This is one adopted successful capture from the immutable product candidate
above. The later evidence-only commit carries these captures and this manifest;
its SHA is reported separately from the product candidate in the handoff. No
capture was inherited from the prior manifest: all fourteen prior hashes differ
from the hashes below.

Frames 12 and 13 select the exact live Artifact/Evaluation tile, enter LOCAL, and
show full identity and provenance only in Dock INSPECT. Frame 14 deliberately
uses Show full lineage, paints all 16 oracle objects and 20 exact links without a
selection or Canvas inspector, and retains a visible Back to world action.

| # | State | Viewport | Objects / links | File | Bytes | SHA-256 | Acceptance mapping |
|---:|---|---|---:|---|---:|---|---|
| 01 | Empty workspace; Dock START | 1600×1000 / 100% | 0 / 0 | [01-empty-workspace.webp](./01-empty-workspace.webp) | 35,440 | `b90c17f2c463fb94080108d3bb95319bb3f4609ca1b6ba1359290267c6ffc096` | Dock discovery, empty next action |
| 02 | Mission starting | 1600×1000 / 100% | 1 / 0 | [02-mission-starting.webp](./02-mission-starting.webp) | 36,606 | `b8ae371a01cd1d9b2c378104fc244804dc5dd396f2e20a25518df6ccb758cd76` | C01, Mission grammar |
| 03 | Director planning | 1600×1000 / 100% | 1 / 0 | [03-director-planning.webp](./03-director-planning.webp) | 29,246 | `e0c8d3b028e02ab61384298b129a3964d9f64b77a73ae2a54715a87941eccd08` | C02, C03 |
| 04 | Active current-Mission workflow | 1600×1000 / 100% | 14 / 13 | [04-active-participants.webp](./04-active-participants.webp) | 46,634 | `9b8ff78ce46c629f8f6d787e44ca0dace1a2a0255d292e485281a51e669c3cb8` | Five stages, ownership, participant state |
| 05 | Raw Artifact produced | 1600×1000 / 100% | 14 / 16 | [05-artifact-produced.webp](./05-artifact-produced.webp) | 47,590 | `0a5f9fe48b8cb55eff56c86742ca92b386be2564a29afd3f20ef4e314d7eb4b4` | Raw/evaluated authority transition |
| 06 | Evaluation and current Report | 1600×1000 / 100% | 16 / 13 | [06-evaluation-and-report.webp](./06-evaluation-and-report.webp) | 52,204 | `bd26b623d1deaecea128724fea0ed299bfb0fe2503b0caef36e8f6a903518037` | Evaluation verdict, published current Report |
| 07 | Completed DEFAULT; HISTORY isolated | 1600×1000 / 100% | 16 / 13 | [07-completed-world.webp](./07-completed-world.webp) | 42,626 | `d0369d5d95efb6a5abb3ab226602afbc916d63fff68fc154b3eba9bde11780c2` | C06, C07, history authority |
| 08 | Reopened DEFAULT | 1600×1000 / 100% | 16 / 13 | [08-reopened-world.webp](./08-reopened-world.webp) | 50,964 | `46a833316569ec90ee608299569e383c2c297ad48bf8c64c9c9208679be4a7a7` | C10, durable reconstruction |
| 09 | Exact launchable CATALOG | 1600×1000 / 100% | 16 / 13 | [09-dock-catalog.webp](./09-dock-catalog.webp) | 52,568 | `f3719d44fa7ae73d5d64b391c2a68bd74b5eb8c892d29e5b4160c59b9330957a` | Dock inventory and one-pane isolation |
| 10 | ACTIVE participant rows | 1600×1000 / 100% | 16 / 13 | [10-dock-active-sessions.webp](./10-dock-active-sessions.webp) | 48,406 | `c11058c7ecf8ecf9ffefc2bf7e71891423c622c2b98bbd67af0505e3697cd43e` | Participant role/runtime/work |
| 11 | Selected participant in Dock INSPECT | 1600×1000 / 100% | 16 / 13 | [11-selected-participant.webp](./11-selected-participant.webp) | 49,470 | `10c533bc5c50abfba45801e07431f083862f78e9b8e0c849477a4c45b3ced911` | Exact participant selection |
| 12 | LOCAL raw Artifact; Dock INSPECT | 1600×1000 / 100% | 16 / 20 | [12-selected-artifact.webp](./12-selected-artifact.webp) | 52,678 | `261c6720a5596ebc13c88ac05f524c58af19492d2195629579f719b40159eea1` | Raw authority, provenance, local emphasis |
| 13 | LOCAL Evaluation; Dock INSPECT | 1600×1000 / 100% | 16 / 20 | [13-selected-evaluation.webp](./13-selected-evaluation.webp) | 52,714 | `0b8d0543743aae3b8a6be8e0fe0e23f95ba6145deec852d917040a87d0c454ea` | Critic/verdict/target, local emphasis |
| 14 | FULL lineage overview | 1600×1000 / 100% | 16 / 20 | [14-most-cable-dense-region.webp](./14-most-cable-dense-region.webp) | 54,766 | `d0a2a6ba224aabe3c95c49804776f31f6058c0e29f83284b1b3a790b33303ebf` | C13/C14 completeness and cable geometry |

Total: `14 files`, `651,912 bytes`. Every image is unique, exactly
`1600×1000`, individually below 600 KB, and the full screenshot set is below
25 MB. Independent visual validation found the expected state marker in every
frame: START empty, Mission starting, Director planning, active participants,
raw Artifact, Evaluation/current Report, completed world, reopened world,
CATALOG, ACTIVE sessions, participant Inspect, Artifact LOCAL Inspect,
Evaluation LOCAL Inspect, and FULL lineage. All fourteen frames visibly carry
the `BUILD EECB2457EEF6A71D888129C0BB353129956478D1` footer.

Capture and cleanup receipt:

- Command: `$env:QF_PRE_R18_CAPTURE='1'; bun qa/run.ts pre-r18-coherence`.
- Isolated roots: randomized `qf-pre-r18-coherence-<suffix>` temp root;
  `<root>\stores\kernel.db`, `<root>\stores\artifacts`, `<root>\app-root`,
  `<root>\home`, and `<root>\temp` (with the app's `AppData` children).
- The prior gate receipt was `roots_remaining=0 leaked=[]`; current validation
  found zero `qf-pre-r18-coherence-*` roots and zero capture-owned app/process
  entries. The randomized child root name was not emitted by the interrupted
  repeat and is intentionally not invented here.
- The product candidate remained immutable at
  `eecb2457eef6a71d888129c0bb353129956478d1`; the later evidence-only commit is
  a separate boundary and is reported separately.

Original-resolution visual inspection covered 01, 04, 07, 09, 12, 13, and 14:
no blank tile, false Mission identity, terminal overlap, contradictory historical
current Report, clipped catalog role, Canvas inspector, or dominant cable hairball
is present.
