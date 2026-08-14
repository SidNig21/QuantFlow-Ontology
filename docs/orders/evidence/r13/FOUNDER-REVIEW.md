# WO-V2-1 founder review

Machine verification is complete. Founder acceptance is intentionally pending.

## What Ryan can now do

Install the current QuantFlow Windows candidate, open it from the desktop
shortcut, inspect the exact build identity, see the production Dock including
`hermes-critic`, and launch that critic as a normal Dock seat with the restricted
`5 tools · 0 skills` surface. Closing QuantFlow should leave zero processes
owned by that install.

## Receipts

- Product candidate:
  `c93b04f1d6a448cee299b2a79a6c21204fdc8502`.
- Evidence commit before this founder packet:
  `702ab7c4ddc1bd27935bb9c2bf3ff7f599b6a244`.
- Independent verifier task:
  `019fff8a-46b9-77c2-bea7-4e0f69d67504` — `PASS`.
- All 20 machine commands exited `0` in fresh detached worktree
  `C:\tmp\qf-v21-final-verify-c93`.
- Complete verifier logs: `C:\tmp\qf-v21-final-verify-c93-logs`.
- Installer:
  `C:\tmp\qf-v21-accept-c93b04f\collab-electron\dist\QuantFlow Setup 0.8.4.exe`.
- Authenticode: `NotSigned`.
- Full evidence: [`V2-1-VERIFICATION.md`](V2-1-VERIFICATION.md).

## Founder check

1. Use a Windows account that has never run this checkout.
2. Install `QuantFlow Setup 0.8.4.exe` from the path above.
3. Open QuantFlow from the installed desktop shortcut.
4. Confirm the masthead commit is exactly
   `c93b04f1d6a448cee299b2a79a6c21204fdc8502`.
5. Confirm its UTC build timestamp equals the installed
   `resources\RELEASE-STATUS.json` timestamp.
6. Confirm the Dock contains `hermes-critic` and no id or role containing
   `ungranted`.
7. Spawn `hermes-critic` directly from the ordinary Dock, with no mission or
   task activation.
8. Confirm its native TUI opens and reports `5 tools · 0 skills`.
9. Close QuantFlow.
10. Run `bun qa/run.ts windows-installer` from the candidate checkout and
    confirm `install-owned processes=0`, `windows-installer: PASS`, and
    `PASS windows-installer`.

## Sign-off

Reply with the observed masthead SHA, build timestamp, Dock result, critic
surface, and shutdown result. WO-V2-1 remains incomplete until Ryan explicitly
accepts or rejects those observations.

## Next

[`WO-V2-2.md`](../../WO-V2-2.md) is drafted but not authorized. It measures the
first Hermes turn synthetically before one bounded live fixture-backed turn,
repairs only the earliest failed boundary, and proves the governed research
chain end to end. A fresh reader must approve that draft before `NEXT.md` may
name it; no V2-2 implementation starts during this founder review.
