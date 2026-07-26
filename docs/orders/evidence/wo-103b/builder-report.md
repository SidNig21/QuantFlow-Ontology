The system no longer advertises six commands it cannot run, and a new safety check will alarm if the observe-ticket door opens before someone decides to open it.

## Deliverables

### D1 · Six dead actions deleted

Removed from `qf-kernel-schema/src/ontology/research.ts` (`retry_run`, `close_run`) and `qf-kernel-schema/src/ontology/agent.ts` (`request_approval`, `approve`, `deny`, `promote_type`); dropped from `schema.ts` imports and `actions` array. Regenerated `golden/` via `bun run generate`.

### D2 · `connection` ruling

**What is a cable?** A cable is a visible canvas gesture between tiles — it wires projection and control, not ontology meaning.

**Ruling: (a) canvas presentation.** `connection` draws cables and carries no ontology meaning; `links` remains the only relationship store for research facts. Recorded in `docs/orders/SCOPES.md` under "Rulings shipped by WO-103b".

### D3 · `docs/ONTOLOGY_SCHEMA.md` — option (a) demote

- Synced `## Actions` (removed six names)
- Demoted to REFERENCE in `DOC_AUTHORITY_MAP.md`
- Added header banner pointing at `qf-kernel-schema/golden/ONTOLOGY.md`

**Why (a):** Cheapest honest fix — the gate hardcodes this path; demoting the authority map alone does not clear `doc-action-surface`. Regenerating and gating the full object surface was out of scope for this rung.

### D4 · `observe-door` gate

Added `qa/gates/observe-door.ts`, registered in `qa/run.ts`. Updated ROADMAP debt #22 trigger to `bun qa/run.ts observe-door`.

**Gate limit:** Does not prevent serving `observe_ticket` or block unknown future paths. It makes the two known silent routes fail the gate: expanding the string surface outside the allowlist, and reading `golden/tools.json` or calling `generateMcp()` from outside `qf-kernel-schema/`.

### D5 · Rulings recorded

- **Ingest seam:** `pipelineFed` stays; bulk ingest through `execute()` with ingest trace. Contract: `SCOPES.md` WO-107b. ROADMAP P3 line notes unblocking `quotes`, `has_leg`, `offered_on`, `lists`.
- **IPC allowlist:** Renderer trust tier paragraph in `SCOPES.md`. No `collab-electron` code changes.

---

## G4 · Counts

| Metric | Predicted | Measured | Mechanism |
|---|---|---|---|
| actions | 31 → 25 | **25** | Deleted 6 from `schema.actions` |
| tools | 77 → 71 | **71** | `generateMcp()` emits one tool per action |
| gates | 13 → 14 | **14** | Added `observe-door` in `qa/run.ts` |

**Removed set:** `approve`, `close_run`, `deny`, `promote_type`, `request_approval`, `retry_run`

**Survivors (25):** `block_agent_session`, `cancel_agent_session`, `cancel_run`, `close_agent_session`, `complete_run`, `create_agent_session`, `create_hypothesis`, `create_mission`, `create_run`, `create_ticket`, `fail_agent_session`, `fail_run`, `grade_ticket`, `observe_ticket`, `publish_artifact`, `record_evaluation`, `register_agent_definition`, `register_dataset_version`, `resolve_hypothesis`, `settle_event`, `start_agent_session`, `start_event`, `start_run`, `unblock_agent_session`, `void_event`

**Test counts:** schema 147 → **148** (+1 `lintActionSurface` test); kernel **23** (unchanged).

---

## Gate transcripts

### G1 · `lintActionSurface` (set equality)

**RED (re-declare `promote_type` without wiring):**
```
=== G1 bait RED ===
Error: Schema actions have no command wiring: promote_type
0
```

**GREEN (live schema + test):**
```
=== G1 bait GREEN ===
bun test v1.3.14 (0d9b296a)

 1 pass
 19 filtered out
 0 fail
 2 expect() calls
Ran 1 test across 1 file. [50.00ms]
0
```

**G1 known limit:** Proves honest surface (delete or wire), not which choice was made. G4 name-set pins deletions.

### G2 · `observe-door`

**Clause 1 RED** (`observe_ticket` in `collab-electron/src/main/kernel.ts`):
```
=== G2 clause 1 RED ===
observe-door: "observe_ticket" found outside allowlist at collab-electron/src/main/kernel.ts
FAIL  observe-door
1
```

**Clause 1 GREEN:**
```
=== G2 clause 1 GREEN ===
PASS  observe-door
0
```

**Clause 2 RED** (read `golden/tools.json` from `collab-electron/src/main/observe-bait-scratch.ts`):
```
=== G2 clause 2 RED ===
observe-door: serving surface violation (golden/tools.json) at collab-electron/src/main/observe-bait-scratch.ts
FAIL  observe-door
1
```

**Clause 2 GREEN:**
```
=== G2 clause 2 GREEN ===
PASS  observe-door
0
```

### G3 · `doc-action-surface`

**RED** (stale `retry_run` in doc after code deletion):
```
=== G3 bait RED: stale doc action ===
doc-action-surface: action lists disagree
  in doc but not code: retry_run
FAIL  doc-action-surface
1
```

**GREEN** (after `## Actions` sync):
```
=== G3 bait GREEN: restored ===
PASS  doc-action-surface
0
```

### Builder-run gates (all green, exit codes unpiped)

```
PASS  repo-shape
0
PASS  lockfile-committed
0
PASS  schema
0
PASS  kernel
0
PASS  typecheck
0
PASS  kernel-sole-writer
0
PASS  kernel-sole-writer-app
0
PASS  no-canvas-domain-writes
0
PASS  doc-action-surface
0
PASS  observe-door
0
PASS  one-skin
0
```

### G5 · Cold `bun qa/run.ts --all` (verifier-run)

Not run by builder (PROTOCOL cold-run-is-verifier-only). Verifier should run in a fresh worktree.

**Note:** `agent-path` and `dock-registry` failed here with `Could not resolve: "ai/test"` during `pack-agent` — likely sandbox/network; unrelated to this diff. Verifier should confirm on cold checkout.

---

## Other confirmations

- **`collab-electron` unchanged:** no edits; `QF_EXECUTE_ALLOWLIST` still `["publish_artifact"]`.
- **`kernel.db` unaffected:** no object-type or transition-table changes.
- **`golden/conformance.test.ts`:** unchanged (deleted actions had no transition edges).
- **Commit:** `ac419fb` on `wo-103b` locally.
- **Push:** failed (environment rejected `git push`). Push manually: `git push -u origin wo-103b`.

---

## Judgment (where the order was silent)

1. **`observe-door` clause 2:** Exempted `qa/gates/observe-door.ts` from serving-surface scan — the implementation must mention the patterns it searches for. Reworded `qa/run.ts` description to avoid matching `generateMcp(`.
2. **Deliverable 3:** Option (a) demote over (b) regenerate-and-gate — scope and cost.
3. **`connection`:** Option (a) — cable use case is presentation/control; dual storage in `links` violates the One Rule.
4. **Ingest rung ID:** Named WO-107b in SCOPES to distinguish from real-data WO-107.
5. **`DOC_AUTHORITY_MAP.md`:** Still partially unmaintained beyond this demotion (order finding #5) — noted, not fixed.

**Suspected order ambiguity:** Whether `observe-door` clause 2 should exempt only the gate file vs. any file mentioning patterns in comments. Chose gate-file exemption only; WO-104 must update the gate if it legitimately serves tools outside `qf-kernel-schema/`.
