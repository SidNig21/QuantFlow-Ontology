# WO-104 — verification record

**Verdict: PASS.** Branch `wo-104`, four commits (`968914a`, `1a0e4b3`, `627cf69`, `e421ea4`),
merged 2026-07-26 after one rework round.

**In plain terms:** the system's whole catalogue of reading tools used to be paperwork — 71 tools
defined, none of them actually answering. Now an AI seat can look up any object, search any table,
and walk the connections between things, through 69 served tools — and a permanent check proves,
on every run, that none of the *action* buttons snuck into that served list.

## Seats

| Seat | Model | Did |
|---|---|---|
| Order author | Fable | Wrote WO-104 |
| Pre-build reviewer | Fable-routed | Eight findings before the build — three High, the phase-exit gate among them |
| Builder | Cursor `composer-2.5` | Both build commits + the rework commit |
| Verification | Claude Opus 5 (checking seat) | Cold suites, independent count derivation, gate attacks, both rework re-baits |

Conflict disclosure, as on WO-H1/WO-103b: the checking seat wrote the rework record it then
verified against. It did not write any code. Every measurement below is re-runnable.

## Cold suite

Fresh detached worktree, zero `node_modules`, unpiped — run twice (post-build and post-rework):
**14 PASS / exit 0**, then **15 PASS / exit 0** after the `read-tools` gate landed.
Schema suite 148 → **149**, kernel 23 → **28**. `collab-electron` untouched.

## Counts derived, not read

```
23 objects × 3 (_get, _query, _links) + 25 actions = 94   → golden/tools.json: 94
read tools matching _(get|query|links)$              = 69   → served list: 69
_links traversal tools                               = 23   (0 before this rung)
action tools in the served list                      = 0    (asserted by gate, see below)
```

## What was attacked, and what each attack found

**Deliverable 0 (observe-door fix) — held against its brief.** The exact probe that beat the old
gate — a generic server inside `qf-kernel-schema/` reading `golden/tools.json` — now goes **red**.
The directory-wide trust is a three-file allowlist.

**Finding 1 (High, recorded not patched): the sixth evasion.** A rogue server iterating
`schema.actions` and registering `qf_${a.name}` serves `qf_observe_ticket` with `observe-door`
**green** — no forbidden string, no `tools.json`, no `generateMcp()`. This is the sixth
boundary-naming attempt (writer count, callsite shape, two-folder grep, path allowlist, trusted
directory, file allowlist) defeated by a reader who did not write it. **By decision there is no
seventh pattern.** The honest statement, now in ROADMAP debt #22 and here: the gate is an alarm on
known routes; the lock is caller identity; the serving ruling is WO-105's contract.

**Finding 2 (Medium, fixed in rework): the gate matched comments.** A file whose comments said
"never names observe_ticket" reddened both clauses while its code did neither — it nearly converted
one of the verification seat's own misses into a recorded catch. Post-rework, re-probed both
directions: comment-only mention → **green**; same string in live code → **red**.

**Finding 3 (Medium, fixed in rework): the safety proof ran once.** The G2/G3/G4 harness — including
*zero action tools served, measured at the protocol surface* — was invoked by nothing after the
builder's transcript. The WO-103 typecheck shape again, on 1,789 new lines. Now gate #15
(`read-tools`), re-baited independently: `register.ts` made to leak `schema.actions` → harness fails
`G4: expected 69 tools, got 94` (94 = 69 + 25, the leak named by arithmetic) → restore → green.
Also proven **cold** by the builder in a never-installed worktree, exit 0.

**Incidental positive:** WO-H1's typecheck discovery picked up the brand-new package unprompted — a
baited type error inside `tools/qf-read-tools` reddened the `typecheck` gate. A hand-listed gate
would have missed it; the discovery design paid for itself two rungs later.

## The phase-exit gate was real

G2 (rewritten at the pre-build read after its first draft was satisfiable by hand-registration):
a fixture object type added to a test schema produced its three read tools **in the served
`tools/list` of a running server**, one of which answered a call — with zero new registration lines.
G3: the traversal tool's answer matched raw SQL on a graph created through `execute()`. G4: the raw
served list contains no name from `schema.actions`. All three verified from the transcripts and the
first re-run independently via the now-permanent gate.

## Carried forward

- **WO-105 decides whether `qf_observe_ticket` is served at all, and to whom.** The read plane
  cannot open that door (structural); the action plane must rule on it (contractual). Debt #22
  remains the lock's real shape.
- **Debt #9** (compact golden surface) — WO-104's ruling recorded in the order; remaining work
  stays with the action-tool rung.
- The `read-tools` gate asserts the **served set**; a rogue second server remains constructible
  (finding 1). Any future MCP server must land inside this gate's coverage or extend it.
