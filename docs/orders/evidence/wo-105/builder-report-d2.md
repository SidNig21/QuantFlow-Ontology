The operator-only flag now marks which actions are tied to real-world bet settlement, and a permanent schema check ensures that flag always matches observation events — so a future “observe” action can’t slip through by name alone.

## 1. What changed

### Flag (`operatorOnly`)

**`qf-kernel-schema/src/define.ts`**
- Added `operatorOnly?: boolean` to `DefinedAction` (mirrors `pipelineFed` on objects).
- Extended `defineAction()` to accept and return the flag.

**`qf-kernel-schema/src/ontology/research.ts`**
- Set `operatorOnly: true` on `observe_ticket`.

### Lint (generic rule, not name check)

**`qf-kernel-schema/src/define.ts`**
- Added `event: string` to `CommandEdge` (transition commands already carried events in `commands.ts`; the type was incomplete).
- Added `isObservationEvent()` (`event.endsWith(".observed")`).
- Added `assertOperatorOnlyCoupling()` at the end of `lintCommands()`:
  - Collects all command events per action (transition + creation).
  - An action is observation-coupled iff any event ends `.observed`.
  - Requires `operatorOnly === observationCoupled` for every action (both directions).
  - If `operatorOnly`, every command event for that action must end `.observed`.

**`qf-kernel-schema/src/define.test.ts`**
- Updated existing transition-command fixtures to include `event`.
- Added three tests for the lint rule (including bait (c) synthetic `observe_run` / `run.observed` fixture).

**`golden/`** — regenerated with `bun run generate`; **no byte changes** (generators do not filter or emit `operatorOnly`; `tools.json` stays at 94).

---

## 2. G4 bait transcripts (unpiped, full output)

### Bait (a) — strip `operatorOnly` from `observe_ticket`, event stays `ticket.observed`

**Red** (`operatorOnly` removed):

```
bun test v1.3.14 (0d9b296a)

src/generate.test.ts:

# Unhandled error between tests
-------------------------------
576 |     const observationCoupled = events.some((event) => isObservationEvent(event));
577 |     const operatorOnly = action.operatorOnly === true;
578 | 
579 |     if (operatorOnly !== observationCoupled) {
580 |       if (observationCoupled) {
581 |         throw new Error(
                        ^
error: Action "observe_ticket" is observation-coupled (command event ends ".observed") but operatorOnly is not true
      at assertOperatorOnlyCoupling (/home/sidnig21/qf-worktrees/wo-105/qf-kernel-schema/src/define.ts:581:19)
      at lintCommands (/home/sidnig21/qf-worktrees/wo-105/qf-kernel-schema/src/define.ts:545:3)
      at /home/sidnig21/qf-worktrees/wo-105/qf-kernel-schema/src/schema.ts:165:1
-------------------------------


src/define.test.ts:

# Unhandled error between tests
-------------------------------
576 |     const observationCoupled = events.some((event) => isObservationEvent(event));
577 |     const operatorOnly = action.operatorOnly === true;
578 | 
579 |     if (operatorOnly !== observationCoupled) {
580 |       if (observationCoupled) {
581 |         throw new Error(
                        ^
error: Action "observe_ticket" is observation-coupled (command event ends ".observed") but operatorOnly is not true
      at assertOperatorOnlyCoupling (/home/sidnig21/qf-worktrees/wo-105/qf-kernel-schema/src/define.ts:581:19)
      at lintCommands (/home/sidnig21/qf-worktrees/wo-105/qf-kernel-schema/src/define.ts:545:3)
      at /home/sidnig21/qf-worktrees/wo-105/qf-kernel-schema/src/schema.ts:165:1
-------------------------------


 118 pass
 2 fail
 2 errors
 236 expect() calls
Ran 120 tests across 3 files. [59.00ms]
exit: 1
```

**Green** (`operatorOnly: true` restored):

```
bun test v1.3.14 (0d9b296a)

 152 pass
 0 fail
 561 expect() calls
Ran 152 tests across 3 files. [123.00ms]
exit: 0
```

---

### Bait (b) — add `operatorOnly` to `create_ticket` (event `ticket.created`, not `.observed`)

**Red** (`operatorOnly: true` on `create_ticket`):

```
bun test v1.3.14 (0d9b296a)

src/generate.test.ts:

# Unhandled error between tests
-------------------------------
580 |       if (observationCoupled) {
581 |         throw new Error(
582 |           `Action "${action.name}" is observation-coupled (command event ends ".observed") but operatorOnly is not true`,
583 |         );
584 |       }
585 |       throw new Error(
                      ^
error: Action "create_ticket" has operatorOnly but is not observation-coupled (no command event ends ".observed")
      at assertOperatorOnlyCoupling (/home/sidnig21/qf-worktrees/wo-105/qf-kernel-schema/src/define.ts:585:17)
      at lintCommands (/home/sidnig21/qf-worktrees/wo-105/qf-kernel-schema/src/define.ts:545:3)
      at /home/sidnig21/qf-worktrees/wo-105/qf-kernel-schema/src/schema.ts:165:1
-------------------------------


src/define.test.ts:

# Unhandled error between tests
-------------------------------
580 |       if (observationCoupled) {
581 |         throw new Error(
582 |           `Action "${action.name}" is observation-coupled (command event ends ".observed") but operatorOnly is not true`,
583 |         );
584 |       }
585 |       throw new Error(
                      ^
error: Action "create_ticket" has operatorOnly but is not observation-coupled (no command event ends ".observed")
      at assertOperatorOnlyCoupling (/home/sidnig21/qf-worktrees/wo-105/qf-kernel-schema/src/define.ts:585:17)
      at lintCommands (/home/sidnig21/qf-worktrees/wo-105/qf-kernel-schema/src/define.ts:545:3)
      at /home/sidnig21/qf-worktrees/wo-105/qf-kernel-schema/src/schema.ts:165:1
-------------------------------


 118 pass
 2 fail
 2 errors
 236 expect() calls
Ran 120 tests across 3 files. [54.00ms]
exit: 1
```

**Green** (`operatorOnly` removed from `create_ticket`):

```
bun test v1.3.14 (0d9b296a)

 152 pass
 0 fail
 561 expect() calls
Ran 152 tests across 3 files. [119.00ms]
exit: 0
```

---

### Bait (c) — synthetic `observe_run` + `run.observed`, no flag (no production schema change)

**Green** (generic lint; permanent test passes):

```
bun test --test-name-pattern "observation-coupled action without operatorOnly" 2>&1; echo "exit: $?"

bun test v1.3.14 (0d9b296a)

 1 pass
 151 filtered out
 0 fail
 1 expect() calls
Ran 1 test across 3 files. [55.00ms]
exit: 0
```

**Red** (lint temporarily replaced with name-check on `observe_ticket` only — no fixture or schema change):

```
bun test --test-name-pattern "observation-coupled action without operatorOnly" 2>&1; echo "exit: $?"

bun test v1.3.14 (0d9b296a)

src/define.test.ts:
328 |     const schema: Schema = { objects: [run], links: [], actions: [observe_run] };
329 |     expect(() =>
330 |       lintCommands(schema, {}, [], [
331 |         { action: "observe_run", object_type: "run", event: "run.observed" },
332 |       ]),
333 |     ).toThrow(
            ^
error: expect(received).toThrow(expected)

Expected substring: "Action \"observe_run\" is observation-coupled (command event ends \".observed\") but operatorOnly is not true"

Received function did not throw
Received value: undefined

      at <anonymous> (/home/sidnig21/qf-worktrees/wo-105/qf-kernel-schema/src/define.test.ts:333:7)
(fail) schema lint > lintCommands rejects observation-coupled action without operatorOnly (generic rule) [2.92ms]

 0 pass
 151 filtered out
 1 fail
 1 expect() calls
Ran 1 test across 3 files. [61.00ms]
exit: 1
```

**Green** (generic lint restored; full suite):

```
bun test v1.3.14 (0d9b296a)

 152 pass
 0 fail
 561 expect() calls
Ran 152 tests across 3 files. [131.00ms]
exit: 0
```

---

## 3. `golden/tools.json` entry count

```bash
python3 -c "import json; d=json.load(open('qf-kernel-schema/golden/tools.json')); print(len(d))"
```

```
94
```

Confirmed after `bun run generate`: generators still emit all 25 action tools (including `qf_observe_ticket`); serving filter is deliverable 3.

---

## 4. Schema suite count

| | Count |
|---|---|
| Before (baseline on this branch) | **149** |
| After | **152** |
| Delta | **+3** |

**Mechanism:** three new `define.test.ts` cases:
1. `lintCommands rejects observation-coupled action without operatorOnly (generic rule)` — bait (c) permanent fixture (`observe_run` / `run.observed`).
2. `lintCommands rejects operatorOnly on action with no observation event` — bait (b) shape.
3. `lintCommands rejects operatorOnly action with a non-observation command event` — half-observation guard.

No golden-byte changes; production schema lint passes at module load via `schema.ts:165`.

Final verification:

```
cd qf-kernel-schema && bun test          → 152 pass, exit 0
cd qf-kernel-schema && bun run generate && bun test  → 152 pass, exit 0
bun qa/run.ts --list                     → 15 gates listed, exit 0
```

---

## 5. Judgment calls (order was silent)

1. **`CommandEdge.event` added to the type** — transition rows in `commands.ts` already had `event`; `CommandEdge` did not. The lint needs events from both command lists; typing `event` avoids silent omission in fixtures.

2. **Bait (c) fixture uses `{}` transition tables** — with a populated `run` transition table, `lintCommands` fails on uncovered edges before reaching the operatorOnly check. Empty tables isolate the coupling rule.

3. **Third test for half-observation** — order states flagged actions must have every event end `.observed`; added an explicit test (creation `ticket.observed` + transition `ticket.graded`, both `operatorOnly: true`) so that branch is covered, not only the bidirectional flag↔suffix coupling.

4. **No generator changes** — `operatorOnly` is schema metadata for lint and (later) serving; generators unchanged so `golden/` is byte-stable and count stays 94.

---

## 6. Not fixed (out of scope)

- Deliverable 1: GATE 1 Zod boundary at `execute()`.
- Deliverable 3: action server / serving filter in `tools/qf-read-tools`.
- Deliverable 4: `tool-plane` harness gate rename and derived-count assertions.
- `packages/qf-kernel`, `collab-electron`, `tools/qf-read-tools` — untouched per order.

---

## 7. Possible eleventh defect

G4 bait (c) says the lint must go red on the synthetic fixture **“without any code change.”** That is true for the *production* schema, but the permanent proof lives in a **new test** (+1 to the suite). A builder could read “no code change” as “no repo edits at all” and try to run bait (c) only by hand-invoking `lintCommands` in a REPL without committing the test — which would not survive CI. The order would be clearer if it said the fixture must be a **committed test** that fails under a name-check implementation.

Secondary ambiguity: bait (c)’s “restore → suite green” is about the **lint implementation**, not schema edits (unlike baits (a) and (b)). That distinction is easy to misread.

---

Changes are in the working tree only (not committed), across 3 files: `define.ts`, `ontology/research.ts`, `define.test.ts`.
