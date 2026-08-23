# Pre-R18 Coherence Screenshot Manifest

These are live current-candidate captures from the production Electron shell and renderer, using the bounded `QF_PRE_R18_CAPTURE=1` proof mode. The gate uses the real BrowserWindow `webContents.capturePage` path at 1600x1000, 100% scale, `devicePixelRatio=1`; the object/link counts below are the DOM counts at each capture checkpoint. Before frame 12, the real START Dock tab is clicked to close the participant session inspector; the Dock remains visibly rendered because that is the product state Ryan can reach. Frames 12 and 13 then use the exact Canvas tile body focus/raise interaction, real Canvas pan/zoom wheel interactions, and the tile's own Inspect control; the gate proves actual DOM identity, bounding rectangles, computed paint visibility, z-order/topmost center, and no participant-inspector overlap before capture. Frame 14 is recaptured from a fresh reopened world so the dense 16-object/20-link state remains legible. Every frame was visually inspected after capture.

| # | State | Viewport | Objects / links | File | Bytes | SHA-256 | Approved defect mapping |
|---:|---|---|---:|---|---:|---|---|
| 01 | Empty workspace baseline | 1600x1000 / 100% | 0 / 0 | [01-empty-workspace.webp](./01-empty-workspace.webp) | 37,506 | `1e76a6f56cc2ead1b1e1f77d482f2da2eec30c5f72e3f7385746e25a14e5d2a4` | C14 Canvas baseline |
| 02 | Mission starting | 1600x1000 / 100% | 1 / 0 | [02-mission-starting.webp](./02-mission-starting.webp) | 55,766 | `f2ffa780ec72325441e3b097bce68feae18a2436a52b0625dfbcc4c7eaa271a5` | C01, C10 |
| 03 | Director planning | 1600x1000 / 100% | 1 / 0 | [03-director-planning.webp](./03-director-planning.webp) | 75,154 | `bc9db0077ef37a1485c16d48928ef579d6b4f67beb62a74003d6b711d56586d2` | C02, C03 |
| 04 | Active participants | 1600x1000 / 100% | 14 / 16 | [04-active-participants.webp](./04-active-participants.webp) | 64,922 | `729e46adfdf82056ddee0a67f0fd5647364e4cd0b8a63777ee45d80cf7ce66b3` | C08, C12 |
| 05 | Artifact produced | 1600x1000 / 100% | 14 / 16 | [05-artifact-produced.webp](./05-artifact-produced.webp) | 73,818 | `393df5b9650f27ba9450f19982836fc4ffd6e950228a701d12109f23d925853a` | C04 |
| 06 | Evaluation and Report | 1600x1000 / 100% | 16 / 20 | [06-evaluation-and-report.webp](./06-evaluation-and-report.webp) | 79,858 | `3f19c1a917c55d71cd5ca0552d0a7696feefe0e6037704bcd26d89760e24df8d` | C05, C06 |
| 07 | Completed world | 1600x1000 / 100% | 16 / 20 | [07-completed-world.webp](./07-completed-world.webp) | 80,010 | `21ad09959f83c8bcfd6971e03a19bec75b4dcbc95ec3eb48209e365faaf3d780` | C07, C10 |
| 08 | Reopened world | 1600x1000 / 100% | 16 / 20 | [08-reopened-world.webp](./08-reopened-world.webp) | 76,464 | `ba3d47c5a1659f3633a0bffdab40ef7987b6ff71957fcb540dd7e4e3dcb8e2dd` | C10 |
| 09 | Dock catalog | 1600x1000 / 100% | 16 / 20 | [09-dock-catalog.webp](./09-dock-catalog.webp) | 76,448 | `9b34d1e2e3c1ea575133416a3e56ced15bd296de84b243f7a56c51d8cc11ef80` | C07 |
| 10 | Dock active sessions | 1600x1000 / 100% | 16 / 20 | [10-dock-active-sessions.webp](./10-dock-active-sessions.webp) | 76,418 | `9ef8a14c27d6d3b5df452fc391541125ab783cd1774dbd8f10c8fcf943359f53` | C08, C12 |
| 11 | Selected participant | 1600x1000 / 100% | 16 / 20 | [11-selected-participant.webp](./11-selected-participant.webp) | 75,750 | `80445cf23f060bc7afeddefb1657b19852af4945c613755e8081cd11ee4fcdcb` | C08, C12 |
| 12 | Selected Artifact, Canvas Inspect open | 1600x1000 / 100% | 16 / 20 | [12-selected-artifact.webp](./12-selected-artifact.webp) | 58,178 | `0626b33b29591b5a1b7db15ea3243f16c64004641a4bde8c2a7e7a9c3d3b9f4d` | C04, C05 |
| 13 | Selected Evaluation, Canvas Inspect open | 1600x1000 / 100% | 16 / 20 | [13-selected-evaluation.webp](./13-selected-evaluation.webp) | 69,334 | `e71f4710a2d01c7b1cbf7d47158610de6916739c8fd2fc5857d5454cab5ad166` | C05, C06 |
| 14 | Most cable-dense region; real cable selection open | 1600x1000 / 100% | 16 / 20 | [14-most-cable-dense-region.webp](./14-most-cable-dense-region.webp) | 82,404 | `3061f451fba536a5b446c52ad5f143d176134c18625446ceebb82beb0dbbb116` | C13, C14 |

Total: `14 files`, `982,030 bytes`; all images are unique, exactly `1600x1000`, each is `<=600 KB`, and the evidence directory screenshot total is `<=25 MB`.
