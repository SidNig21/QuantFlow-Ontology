**One sentence:** The MCP read-tools safety proof now runs automatically on every CI pass, and the observe-door scanner no longer flags documentation in comments as live code.

Commit `e421ea4` on `wo-104` (local; push was blocked in this environment — operator should `git push -u origin wo-104`).

---

## Deliverables

### R1 · `read-tools` gate wired into `qa/run.ts`

Added gate #15 using `bunPackageGate` (frozen install → `bun run harness` in `tools/qf-read-tools`). No `package.json` change — `harness` script already existed.

**Falsification — red (schema.actions leak bait in `register.ts`):**

```
G4_tools_list_length=94
...
error: G4: expected 69 tools, got 94
error: script "harness" exited with code 1
read-tools: bun run harness exited 1
FAIL  read-tools
1
```

94 = 69 read + 25 action tools — the leak is named by count (G4's `G4_action_tools_leaked` assertion is unreachable before the count check because no action name ends in `_get`/`_query`/`_links`).

**Falsification — green (restore):**

```
[harness] G2 G3 G4 PASS
PASS  read-tools
0
```

**Cold worktree** (`git worktree add -f --detach /tmp/cold-104-r1 wo-104`, zero `node_modules`):

```
PASS  read-tools
0
```

(`/tmp/cold-104` had a stale worktree registration; used `-f` on alternate path.)

### R2 · observe-door strips comments before matching

Added `stripNonCodeContent()` in `qa/gates/observe-door.ts` — strips line comments, block comments, and markdown fences while preserving string literals.

**Falsification — comment-only → green** (`qa/gates/_bait-r2-comment.ts` with only comments mentioning `observe_ticket`, `qf_observe_ticket`, `golden/tools.json`, `generateMcp(`):

```
PASS  observe-door
0
```

**Falsification — live code → red** (same file + `export const baitR2Live = "observe_ticket"` and `baitR2LivePath = "golden/tools.json"`):

```
observe-door: "observe_ticket" found outside allowlist at qa/gates/_bait-r2-comment.ts
observe-door: serving surface violation (golden/tools.json) at qa/gates/_bait-r2-comment.ts
FAIL  observe-door
1
```

Bait file removed after falsification; not committed.

---

## Suite

**Gate count:** 14 → **15** (mechanism: one new `read-tools` entry in `qa/run.ts`).

**Full suite** (`bun qa/run.ts --all`, unpiped):

```
15 PASS, 0 FAIL
0
```

---

## Judgment calls (one line each)

1. **Comment stripper:** Character scanner preserving quoted/backtick strings — naive regex would false-negative on strings containing `//` or `/*`.
2. **R1 red transcript:** Harness fails at `G4_tools_list_length=94` before `G4_action_tools_leaked` because action names don't match the `_get|_query|_links` suffix check; 94 = 69 + 25 is conclusive.
3. **Route #7:** Did not add a seventh observe-door pattern for `schema.actions` iteration — closed by rework record; R1 harness gate covers served-action detection instead.
4. **No `package.json` edit:** `harness` script pre-existed; scope limit honored.
5. **Cold worktree path:** Used `/tmp/cold-104-r1` with `-f` because `/tmp/cold-104` had a stale git worktree registration.
6. **JSDoc wording:** Avoided literal `/* */` in the new function's doc comment — Bun's parser would terminate the block comment early.

---

## Scope confirmation

- Changed files: `qa/gates/observe-door.ts`, `qa/run.ts` only.
- Kernel, schema, server logic untouched.
- `collab-electron` untouched.
- Push pending operator action.
