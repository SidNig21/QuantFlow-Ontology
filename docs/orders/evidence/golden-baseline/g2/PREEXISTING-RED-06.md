# G2 matrix item 6 — mechanical Windows launcher red

Plain meaning: G2's artifact proof could not start because its old launcher
used the Windows-fragile raw Bun install path instead of QuantFlow's existing
accepted package-install helper.

## Bound result

- Resume SHA: `66fbe97cb6e99ae3479cd7759758144c06eea2ff`.
- First wrapper log: `logs/21-matrix-06-artifact-root.txt`.
- First log SHA-256:
  `D2794B0EA397EF54F174798CB377281ABC69E7E3020A0A889E5BE383127AE3B3`.
- Exact retry log: `logs/21-matrix-06-artifact-root-retry.txt`.
- Retry log SHA-256:
  `54212AD149F169D9A92C82790DCB5CE3D714CC7B873E9730D9A65AD6F6BF0918`.
- Both exits: `1` before `qa/gates/artifact-root/run.ts` loaded.
- Shared failure boundary: Windows local-file dependency copy `EPERM`.
- Cleanup: product-process count `0`; temporary gate dependencies absent.

## Source adjudication

The unchanged launcher `qa/gates/artifact-root.ts` has blob
`3b05d81097810e217c2b7b3bd4b65b4a975683e9` and directly spawns raw
`bun install --frozen-lockfile`. QuantFlow already owns the accepted
`qa/package-install.ts` helper at blob
`067f3ec04fe004da7f8deef0e883f13abbb14e3f`. It keeps the frozen install,
uses the bounded Windows `copyfile` plus isolated-linker contract, removes only
stale generated destinations for direct local file dependencies, performs no
retry, and fails closed. Its unit-test blob is
`f4af113ada61fb308dde2125f70a996d2de9889a`.

This is a mechanical same-meaning proof-harness defect under ADR-0004 section 9.
The authorized repair changes only the launcher to call the existing helper,
then requires the helper unit test and one exact item-6 rerun. The semantic
artifact-root assertions, install-plan order, falsification vocabulary, and all
G2 acceptance remain unchanged. G12 retains whole-repository Windows
install/package/operations ownership.
