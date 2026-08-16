# NEXT — R14 WO-RD-3 founder steering

status: AUTHORIZED — INDEPENDENT VERIFIER REWORK
authorized-at: 2026-08-15
authorized-by: founder umbrella goal 2026-08-15
active-order: [WO-RD-3](WO-RD-3.md)
route: [GOLDEN-RUN.md](GOLDEN-RUN.md) · R14 active
depends-receipt: [WO-RD-2 verification](evidence/wo-rd-2/VERIFICATION.md) — candidate `13beba7fb9a24632946b8f50a319f9df161396c1`
reader-receipt: task `01a007d7-e59d-79d2-bf68-ed832015b6b1` — PASS at order commit `bdefeb4`
rework-receipt: first Builder stopped before matrix/commit because it called nonexistent app RPC `qf:spawnSession`; Rework 1 binds setup to existing `qf.dock.spawn`
final-rework-receipt: Rework 1 used the 5-second RPC default inside a retry loop while synthetic admission may take 10 seconds; Rework 2 makes one call with 20-second timeout, then polls only the returned session
rewrite-diagnosis: task `01a007fb-99ca-7561-910d-7ff0e0c76370` proved the checked-in synthetic responder rejects production role `worker2` before readiness
rewrite-reader-receipt: task `01a007fe-f6a4-77e1-b270-1a522b52a1b4` — PASS at order commit `420a381`
rewrite-builder-receipt: task `01a00806-7a19-79a2-895f-713aa6f99596` — selector/unit green, live gate red before named assertion, no commit/push
renderer-diagnosis: task `01a0080d-bba5-74a0-b10b-6175907da68d` — gate throws before asynchronous Task projection; gate-only bounded synchronization required
founder-authorization: 2026-08-15 — perform the required gate-only synchronization and finish WO-RD-3
gate-only-builder-receipt: task `01a00917-9de4-7ee2-b5d8-056cfe6cb211` — pure test green; single live gate red `Task control Clarify timed out`; no matrix/commit/push
sequencing-diagnosis: task `01a0091b-f6ab-71a0-b4bd-bafb8c84a50b` — gate waits up to 55 seconds for worker-2 before Clarify, contrary to the order; worker may complete Task and correctly remove controls
standing-authority: 2026-08-15 — diagnose and repair in-scope delivery defects without further founder prompts
candidate-receipt: `6423b711e1dc06b646017473e4cfa6d8439f35b5` — Builder matrix green and pushed
verifier-receipt: task `01a0097e-1b8b-7aa0-8bb9-c6ae5d34a4ce` — FAIL; delegation cleanup measured one owned process and source audit named three proof/side-effect defects

## Authorized outcome

Ryan can clarify, redirect, reassign, cancel, or request a second opinion from
the exact durable Task tile. Every accepted action and the required invalid
refusal is visible from Kernel truth; exact runtime delivery is receipted.

## Builder instructions

One fresh Builder is authorized to repair the four exact defects in WO-RD-3's
independent Verifier receipt: deterministic owned-process cleanup in the
delegation regression; measured post-cleanup founder receipts; no critic
recruitment before a repeated Second-opinion rejection; and launch-two visible
Task/session/link equality. Green proceeds through the exact focused matrix,
commit/push, and one fresh Verifier. In-scope reds continue under standing
authority. No R15 implementation begins before WO-RD-3 verification.

## Stop

No R15 work begins from this file. Never place bets or trades.
