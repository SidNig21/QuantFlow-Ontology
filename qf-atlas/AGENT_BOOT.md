# QuantFlow Atlas — Agent Boot

Read this before touching QuantFlow architecture or cleanup.

## Authority

1. Read `START_HERE.md` and identify current work authority (`docs/orders/NEXT.md` or founder health-pass authorization).
2. Read `qf-atlas/OPERATING_MANUAL.md`.

**STATUS**

- Capability work: CLOSED; independent acceptance: PASS; founder acceptance: recorded in qf-atlas/verification.json; baseline: present; Atlas authorizes diagnosis and blast-radius analysis, not product repair or deletion.

## Establish snapshot

```powershell
git status
git branch --show-current
git rev-parse HEAD
```

Ensure this checkout contains the `qf-atlas/` v1 tooling. If missing, bring it from `atlas-strip-1` — use it as-is, do not rebuild.

## Refresh

```powershell
bun qf-atlas/generate.mjs
bun qf-atlas/generate.mjs --check
bun qf-atlas/ratchet.mjs
```

Read `qf-atlas/ATLAS.md`. Current map snapshot = header line in that file (not a hard-coded SHA).

## Investigate

1. Start in **LOOPS**, then **OWNERS**.
2. Use **COVERAGE** before trusting uncertainty.
3. Use **DEMOLITION** only as an investigation queue.
4. Use **WIRES** for IPC path breaks.
5. Use **MAP** for spatial lookup only.
6. Read blast radius before editing.
7. Never delete from static non-reachability alone.

## Before editing product code

Fill the TARGET FINDING block in `OPERATING_MANUAL.md`. Do not edit until diagnosis is supported and work is authorized.

## After approved change

Focused gates → regenerate → check → ratchet → **DIFF**.

Report before/after: known reds, ownership conflicts, undecided count, new reds, affected loops, ratchet result.
