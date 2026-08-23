# Pre-R18 Coherence Screenshot Manifest

These are live current-candidate captures from the production Electron shell and renderer, using the bounded `QF_PRE_R18_CAPTURE=1` proof mode. The gate uses the real BrowserWindow `webContents.capturePage` path at 1600x1000, 100% scale, `devicePixelRatio=1`; the object/link counts below are the DOM counts at each capture checkpoint. Frames 12 and 13 are the real Canvas Inspect control opened on the named Artifact and Evaluation tiles. Every frame was visually inspected after capture.

| # | State | Viewport | Objects / links | File | Bytes | SHA-256 | Approved defect mapping |
|---:|---|---|---:|---|---:|---|---|
| 01 | Empty workspace baseline | 1600x1000 / 100% | 0 / 0 | [01-empty-workspace.webp](./01-empty-workspace.webp) | 37,576 | `49d3c5616ad11a86f221337b1ee2ba9d26ac152fae53bf3c7d8ddb7bdb964019` | C14 Canvas baseline |
| 02 | Mission starting | 1600x1000 / 100% | 1 / 0 | [02-mission-starting.webp](./02-mission-starting.webp) | 55,784 | `767040f057d6368ca0f9fa63dac1480a7d62369688fcd7c5758827344acfcd03` | C01, C10 |
| 03 | Director planning | 1600x1000 / 100% | 1 / 0 | [03-director-planning.webp](./03-director-planning.webp) | 75,036 | `ccfcbc8f88a8f1e201a67674d84f49ea6eed4ea29f32fa948fe27b59a3f51bbc` | C02, C03 |
| 04 | Active participants | 1600x1000 / 100% | 14 / 16 | [04-active-participants.webp](./04-active-participants.webp) | 71,018 | `7077c7bb9178e6250ed908055d1e6e9a923607166ffb4f68e6f115ff82fe3110` | C08, C12 |
| 05 | Artifact produced | 1600x1000 / 100% | 14 / 16 | [05-artifact-produced.webp](./05-artifact-produced.webp) | 73,692 | `75844c46e109da5c4b8fd080d4690519365528f5692655323b39eeb167b7b970` | C04 |
| 06 | Evaluation and Report | 1600x1000 / 100% | 16 / 20 | [06-evaluation-and-report.webp](./06-evaluation-and-report.webp) | 80,608 | `6d53d9406d3ce7f5e21a0194fc17ea249c9e808b7213dc0b80be21c5e936985e` | C05, C06 |
| 07 | Completed world | 1600x1000 / 100% | 16 / 20 | [07-completed-world.webp](./07-completed-world.webp) | 80,676 | `8ef37a51c3a877cf5c68756a98a111db4e0d76e2c57719007fce8d25c22caf68` | C07, C10 |
| 08 | Reopened world | 1600x1000 / 100% | 16 / 20 | [08-reopened-world.webp](./08-reopened-world.webp) | 76,426 | `9f4901b4a99f755917195d47c9feadec0c1351b082defaa2b5af73467562a059` | C10 |
| 09 | Dock catalog | 1600x1000 / 100% | 16 / 20 | [09-dock-catalog.webp](./09-dock-catalog.webp) | 76,544 | `6c6edaf7bfb6e190e0db386b4c33231942a6bea875b09257d2c52d00769c08a9` | C07 |
| 10 | Dock active sessions | 1600x1000 / 100% | 16 / 20 | [10-dock-active-sessions.webp](./10-dock-active-sessions.webp) | 76,448 | `4ba09963d0f1252a63f823e53012da8405d293897dea88c7897612db6b15ccd6` | C08, C12 |
| 11 | Selected participant | 1600x1000 / 100% | 16 / 20 | [11-selected-participant.webp](./11-selected-participant.webp) | 74,934 | `78c6536d329986cb767949eac30e2a90f18cb1df96627ea664c1088780f7a2aa` | C08, C12 |
| 12 | Selected Artifact, Canvas Inspect open | 1600x1000 / 100% | 16 / 20 | [12-selected-artifact.webp](./12-selected-artifact.webp) | 74,992 | `3b82c0bfa4c4c02f5f70fdf71efeec9f8ae87a624ac2b868f47796219c2c033e` | C04, C05 |
| 13 | Selected Evaluation, Canvas Inspect open | 1600x1000 / 100% | 16 / 20 | [13-selected-evaluation.webp](./13-selected-evaluation.webp) | 74,872 | `f8ecce34233cd086e0a333b991cf69b211f5ee927932292a918a4f55779c44c4` | C05, C06 |
| 14 | Most cable-dense region; real cable selection open | 1600x1000 / 100% | 16 / 20 | [14-most-cable-dense-region.webp](./14-most-cable-dense-region.webp) | 80,890 | `76f3007c6f86a356578508920731870524f53472fce0f993f02189a0d1ac038b` | C13, C14 |

Total: `14 files`, `1,009,496 bytes`; all images are unique, exactly `1600x1000`, each is `<=600 KB`, and the evidence directory screenshot total is `<=25 MB`.
