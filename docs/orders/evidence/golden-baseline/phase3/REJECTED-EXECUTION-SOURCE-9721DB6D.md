# Rejected Phase-3 execution source — clean install topology

In plain terms: the Electron package owned its SDK correctly, but the clean release route installed only Electron before testing Hermes source directly, so the archive could not resolve Hermes's own already-declared dependency.

status: **REJECTED RED / IMMUTABLE / NOT A CANDIDATE**
commit: `9721db6d22e789715e1c1780c65dc36aef53ccac`
tree: `5363a8332c500fec5b94aad80f79c2654e07f2c7`
sole-parent: `28dd91f8e2c1ebc92e0afef0974bad3a1b06a4f9`

## Frozen topology and blob identities

| Path | Git blob |
|---|---|
| `collab-electron/package.json` | `9aef7bf7b8aef242a3e654dedae90d2c94c033f7` |
| `collab-electron/bun.lock` | `16280563859d36532a69763e02da40c0c48e713e` |
| `species/hermes/package.json` | `5d4f1f4c21783a6c99476281d3e01dac46db9cc8` |
| `species/hermes/bun.lock` | `d7c04789ff65d1de7ef6054078cc88ff8148ef5a` |
| `qa/gates/golden-phase3-requalification.ts` | `c60c986892b58dece5f6fbb5eede9914380449de` |
| `qf-atlas/ATLAS.md` | `092298ba7dd40880e2d6894b7496e54707bc088e` |
| `qf-atlas/atlas.html` | `7b5fd1e05e095b739376cba1376c4eef481910d7` |
| `qf-atlas/atlas.json` | `2c3cb8f1ac025d698fd7269bb72d2084d0dc0421` |

Both manifests declare direct runtime `@agentclientprotocol/sdk` exactly `0.18.2`. Hermes owns `host-acp-client.ts` source/direct execution; Electron owns the packaged consumer. The denominator is 104 because Hermes was already in the 103-row seed and Electron is the sole new row.

## Diagnosed RED

The clean archive installed `collab-electron` only before `qa/windows-unit.ts`. The unit route executes Hermes host-ACP source directly, outside Electron's dependency root, so clean module resolution failed despite both declarations being correct. Ambient or sibling installation can mask the defect and is forbidden evidence.

This source and its outputs remain immutable rejected evidence. The authorized follow-up changes install orchestration only; it does not change either owner, move source, add a third declaration, or alter host-ACP behavior.
