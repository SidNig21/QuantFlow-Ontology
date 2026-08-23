# Pre-R18 Coherence Screenshot Manifest

These fourteen captures come from product/proof candidate
`67f9ba42affcb30fa8bc0961808ed10d8541ea6f` through the production Electron
shell and renderer with the bounded `QF_PRE_R18_CAPTURE=1` evidence switch.
Every image uses `webContents.capturePage` at 1600×1000, 100% scale, and
`devicePixelRatio=1`. Object/link counts are measured from the live DOM at each
checkpoint.

Frames 12 and 13 select the exact live Artifact/Evaluation tile, enter LOCAL, and
show full identity and provenance only in Dock INSPECT. Frame 14 deliberately
uses Show full lineage, paints all 16 oracle objects and 20 exact links without a
selection or Canvas inspector, and retains a visible Back to world action.

| # | State | Viewport | Objects / links | File | Bytes | SHA-256 | Acceptance mapping |
|---:|---|---|---:|---|---:|---|---|
| 01 | Empty workspace; Dock START | 1600×1000 / 100% | 0 / 0 | [01-empty-workspace.webp](./01-empty-workspace.webp) | 36,720 | `86112ca01199aa9aaebdc0eab9bec71b3edae72ba646a651e1ad9768b3114b64` | Dock discovery, empty next action |
| 02 | Mission starting | 1600×1000 / 100% | 1 / 0 | [02-mission-starting.webp](./02-mission-starting.webp) | 39,194 | `732f37e655bed38c9e9b09ef782d7d71c207a0583926f698fa9bec022c8b908a` | C01, Mission grammar |
| 03 | Director planning | 1600×1000 / 100% | 1 / 0 | [03-director-planning.webp](./03-director-planning.webp) | 31,196 | `c815f1917022ec46415854cba1ae1397ddb3bca76931487d45a0ce00bc8bccb5` | C02, C03 |
| 04 | Active current-Mission workflow | 1600×1000 / 100% | 14 / 13 | [04-active-participants.webp](./04-active-participants.webp) | 48,500 | `bdcdd8bd562cc714b7dde4cd2cb3b7e0358cb83ad145f9af637f6454df98e1f3` | Five stages, ownership, participant state |
| 05 | Raw Artifact produced | 1600×1000 / 100% | 14 / 16 | [05-artifact-produced.webp](./05-artifact-produced.webp) | 49,154 | `7b0cfffcd60b1a8546ade103896e46e6c4536df40b982be7d13d0af607adc212` | Raw/evaluated authority transition |
| 06 | Evaluation and current Report | 1600×1000 / 100% | 16 / 13 | [06-evaluation-and-report.webp](./06-evaluation-and-report.webp) | 53,580 | `988713bd2d0a7e827ea2ab7a0551d391c04fd52f69d1538b073e49f036f7d148` | Evaluation verdict, published current Report |
| 07 | Completed DEFAULT; HISTORY isolated | 1600×1000 / 100% | 16 / 13 | [07-completed-world.webp](./07-completed-world.webp) | 44,250 | `2b75d3b34d93aba18deb4061c35b3ce9c610a0c5cc64c8e57b617958b792f851` | C06, C07, history authority |
| 08 | Reopened DEFAULT | 1600×1000 / 100% | 16 / 13 | [08-reopened-world.webp](./08-reopened-world.webp) | 51,614 | `ffa68eea8ba28abb2e52d387c6fa86aca048bc0d25ed797dd3adc75835b13480` | C10, durable reconstruction |
| 09 | Exact launchable CATALOG | 1600×1000 / 100% | 16 / 13 | [09-dock-catalog.webp](./09-dock-catalog.webp) | 52,980 | `967615a354bf22fd48b5cd37c30dfa70b60ae0a1213c3f2798fb9555ca17174f` | Dock inventory and one-pane isolation |
| 10 | ACTIVE participant rows | 1600×1000 / 100% | 16 / 13 | [10-dock-active-sessions.webp](./10-dock-active-sessions.webp) | 48,156 | `e5956b9460e0c946fc741edf1af6fca4cb6f84c56d40956e9382fffb74a5e1d8` | Participant role/runtime/work |
| 11 | Selected participant in Dock INSPECT | 1600×1000 / 100% | 16 / 13 | [11-selected-participant.webp](./11-selected-participant.webp) | 49,440 | `70d6df49db6dea5eda3c61b9b00939ce99a7382cc6e68b55ff6467a1188c097d` | Exact participant selection |
| 12 | LOCAL raw Artifact; Dock INSPECT | 1600×1000 / 100% | 16 / 20 | [12-selected-artifact.webp](./12-selected-artifact.webp) | 52,612 | `7badae0291c8ed8e8185088d076391e3fa493f623cc93ac66414108d248bbc6d` | Raw authority, provenance, local emphasis |
| 13 | LOCAL Evaluation; Dock INSPECT | 1600×1000 / 100% | 16 / 20 | [13-selected-evaluation.webp](./13-selected-evaluation.webp) | 52,944 | `fbeca79c13dadcb9abd4b6ffcbb0b6ee9404367ed4e2daf56e14dcd8f0158d6b` | Critic/verdict/target, local emphasis |
| 14 | FULL lineage overview | 1600×1000 / 100% | 16 / 20 | [14-most-cable-dense-region.webp](./14-most-cable-dense-region.webp) | 55,048 | `a33a8ea81ff7376d83e8eb31f74cea89ece483cc3c90ceb1924a92c2f59c57fd` | C13/C14 completeness and cable geometry |

Total: `14 files`, `665,388 bytes`. Every image is unique, exactly
`1600×1000`, individually below 600 KB, and the full screenshot set is below
25 MB.

Original-resolution visual inspection covered 01, 04, 07, 09, 12, 13, and 14:
no blank tile, false Mission identity, terminal overlap, contradictory historical
current Report, clipped catalog role, Canvas inspector, or dominant cable hairball
is present.
