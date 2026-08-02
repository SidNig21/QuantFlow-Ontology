# WO-WIN2 packaged Computer Use receipt

Date: 2026-08-02
Proof nonce: `CU-WIN2-NONCE-20260802`

## Isolated packaged run

- Package: unpacked Windows `QuantFlow.exe` built from the current checkout.
- Package root: `C:\Users\rybow\AppData\Local\Temp\qf-win2-cu-package-8xPh6T\dist\win-unpacked`
- Run root: `C:\Users\rybow\AppData\Local\Temp\qf-win2-cu-run-YaRwOs`
- Isolation: temporary `USERPROFILE`, `QF_KERNEL_DB`, `QF_PEER_BUS_DB`, and `QF_ARTIFACT_ROOT`; founder `C:\Users\rybow\.quantflow` was not used.

## Native UI observation

Using Computer Use against the packaged QuantFlow window and the normal Dock:

- Dock displayed two `DETERMINISTIC PROOF AGENT` definitions with `ORCHESTRATOR` and `WORKER` roles.
- Both were spawned through their Dock `Spawn` buttons.
- Canvas showed two distinct terminal tiles with distinct session badges:
  - orchestrator: `69445248-f4fe-48d2-a3a6-5146db7a9626`
  - worker: `09b5f18e-1b30-4698-a2fb-01841744302f`
- Worker tile visibly showed `TASK RECEIPT CU-WIN2-NONCE-20260802`.
- Orchestrator tile visibly showed `COLLAB PASS CU-WIN2-NONCE-20260802`.

## Isolated Kernel and peer-bus receipt

```json
{
  "sessions": [
    {"id": "09b5f18e-1b30-4698-a2fb-01841744302f", "status": "closed"},
    {"id": "69445248-f4fe-48d2-a3a6-5146db7a9626", "status": "closed"}
  ],
  "spawned_from": [
    {"from_id": "69445248-f4fe-48d2-a3a6-5146db7a9626", "to_id": "qf-proof-orchestrator"},
    {"from_id": "09b5f18e-1b30-4698-a2fb-01841744302f", "to_id": "qf-proof-worker"}
  ],
  "trajectories": ["peer://orchestrator->worker", "peer://worker->orchestrator"],
  "messages": [
    "ACK CU-WIN2-NONCE-20260802",
    "TASK CU-WIN2-NONCE-20260802"
  ]
}
```

## Independent gates

- `bun qa/windows-unit.ts`: 44 pass, 0 fail.
- `bunx tsc --noEmit` from `collab-electron`: pass.
- `git diff --check`: pass.
- `bun qa/run.ts windows-dock-collaboration`: pass.
- Delivery-off bait: red (`FALSIFY RED delivery blocked`).
- Collapsed-session bait: red (`Kernel did not preserve two distinct sessions`).
- Final packaged UI close: both sessions closed; no QuantFlow process remained.
