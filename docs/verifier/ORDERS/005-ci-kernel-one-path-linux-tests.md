# Order 005 — CI honesty: `kernel-one-path` + Linux kernel tests

**Parent:** Verifier audit rot item (not a new NEXT order)  
**Priority:** P1 — do in parallel with W2-02 only if it does not delay Orders 001–004

## Problem

1. **`kernel-one-path` FAIL on `main`** (Linux 2026-11-08):

```text
bun qa/run.ts kernel-one-path
```

Offenders listed in `qa/gates/kernel-one-path.ts` docstring pattern — five files including `qa/gates/bovada-football/run.ts`, `packages/qf-kernel/src/wave1-evidence-upgrade.test.ts`.

2. **Twelve `qf-kernel` tests fail on Linux** because cleanup guards require Windows temp prefixes:

`packages/qf-kernel/src/wave1-evidence-upgrade.test.ts:17-18`:

```typescript
if (!target.startsWith(`${resolve(tmpdir())}\\`) || !target.includes("qf-w1-evidence-upgrade-")) {
```

Same pattern in other upgrade suites.

## Why it matters

Red gates on `main` teach the founder and agents to ignore QA. Linux failures block cloud agents and CI from catching real kernel regressions during W2-02.

## Scope

**May change:**

- `qa/gates/kernel-one-path.ts` allowlist (document each entry per gate file comments)
- `qa/gates/bovada-football/run.ts`, `windows-dock-species.ts`, etc. **only** if needed to satisfy G1 without weakening intent
- Test `afterEach` guards in `packages/qf-kernel/src/*upgrade*.test.ts` — use platform-neutral safe temp check (e.g. require path under `tmpdir()` + include fixture token)

**Must not:**

- Remove G1 grep enforcement
- Add kernel.db resolvers outside `packages/qf-kernel/src/resolve-path.ts`

## Done means

```text
bun qa/run.ts kernel-one-path
cd packages/qf-kernel && bun test
```

Both exit 0 on **Linux** and **Windows**.

Optional: add `kernel-one-path` to a documented CI stage if architect approves (out of scope unless founder asks).

## Report

Before/after offender list; note any new allowlist entries with justification matching WO-K1 pattern.
