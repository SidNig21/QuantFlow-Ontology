# Rejected Phase-3 execution source — clean install topology

In plain terms: the Electron package owned its SDK correctly, but the clean release route installed only Electron before testing Hermes source directly, so the archive could not resolve Hermes's own already-declared dependency.

status: **REJECTED RED / IMMUTABLE / NOT A CANDIDATE**
commit: `9721db6d22e789715e1c1780c65dc36aef53ccac`
tree: `5363a8332c500fec5b94aad80f79c2654e07f2c7`
sole-parent: `28dd91f8e2c1ebc92e0afef0974bad3a1b06a4f9`
archive-sha256: `DB39F2AD28C16790750290D6BB02FB63609C2A0294DF98297564078C020C8B1D`
canonical-red-log-sha256: `341B6D074F265BAF438A29BA6761E715A4B07DEC8E34BB88BFF5F461BC44BE0`
census-green-sha256: `6EC9E7C6204AEE1E7611636EBF13C376B87B1B4A58CB2A33DEE307EEAC3D312B`

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

The retained Builder measurements establish:

- the exact archive hash above;
- the Electron-only install used an empty run-owned cache and `bun install --frozen-lockfile` with cwd at the archive's `collab-electron` root, followed from the archive repository root by `bun qa/windows-unit.ts`;
- `qa/windows-unit.ts` exited nonzero at the unresolved import of `@agentclientprotocol/sdk` from `species/hermes/src/host-acp-client.ts` before the host-ACP test could run;
- the canonical RED log and independently green Phase-3 census have the exact SHA-256 values above;
- cleanup completed with `roots_remaining=0`, owned Bun processes `0`, and owned Electron processes `0`.

Exact-SHA reproduction closed those finite fields:

```text
run_root=C:\tmp\p3-red-9721-r1
cache=C:\tmp\p3-red-9721-r1\cache; initial_count=0
archive_command=git archive --format=tar -o C:\tmp\p3-red-9721-r1\9721db6d.tar 9721db6d22e789715e1c1780c65dc36aef53ccac
archive_exit=0
archive_sha256=DB39F2AD28C16790750290D6BB02FB63609C2A0294DF98297564078C020C8B1D
extract_command=tar -xf C:\tmp\p3-red-9721-r1\9721db6d.tar -C C:\tmp\p3-red-9721-r1\source
extract_exit=0
install_command=bun install --frozen-lockfile
install_cwd=C:\tmp\p3-red-9721-r1\source\collab-electron
install_exit=0
install_log=C:\tmp\p3-red-9721-r1\logs\frozen-install.log
install_log_sha256=B5F43043BC6182CCF22734A025A294861EC4FA6890BC74B4ECEB53524AB455EE
sdk_probe=C:\tmp\p3-red-9721-r1\source\species\hermes\node_modules\@agentclientprotocol\sdk
sdk_path_absent=true
unit_command=bun qa/windows-unit.ts
unit_cwd=C:\tmp\p3-red-9721-r1\source
unit_exit=1
unit_log=C:\tmp\p3-red-9721-r1\logs\windows-unit-red.log
unit_log_sha256=2CAA978B327808D11A99F6F61EDB76E8D4598A7F9BBD4670327505A40F9F7025
error: Cannot find module '@agentclientprotocol/sdk' from 'C:\tmp\p3-red-9721-r1\source\species\hermes\host-acp-client.ts'
(fail) orchestrateNativeTuiAdmission > shutdown awaits a detached native-TUI teardown
59 pass; 1 fail; windows-unit: FAIL
processes_before=0; processes_after=0; roots_remaining=0; owned_bun_electron_remaining=0
```

The reproduced absolute diagnostic above is authoritative and supersedes the abbreviated retained bullet's `species/hermes/src/host-acp-client.ts` path wording. The separately retained canonical RED-log hash remains recorded above; the reproduction log has its own exact SHA-256 because it was a new exact-SHA measurement.

This source and its outputs remain immutable rejected evidence. The authorized follow-up changes install orchestration only; it does not change either owner, move source, add a third declaration, or alter host-ACP behavior.
