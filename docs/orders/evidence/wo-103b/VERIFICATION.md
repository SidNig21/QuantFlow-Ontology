# WO-103b — verification record

**Verdict: PASS.** Branch `wo-103b`, one commit (`ac419fb`), merged 2026-07-26. **Zero rework rounds.**

**In plain terms:** the system used to advertise six commands it could not actually run, and the
next piece of work turns every advertised command into a button an AI can press. Those six are now
deleted, and a door we know is unlocked has an alarm on it — so it cannot quietly open before
someone decides to open it.

## Seats

| Seat | Model | Did |
|---|---|---|
| Order author | Fable | Wrote WO-103b |
| Pre-build reviewer | — | PROTOCOL's two-question read **before** the build: seven findings, all in the order text, all fixed (`edec6be`) |
| Builder | Cursor `composer-2.5` | The single commit |
| Verification | Claude Opus 5 (checking seat) | Cold suite, independent count derivation, three attacks on the new gate |

**The headline of this record is not the code.** This is the first rung in the P1/P2 sequence to
get the pre-build adversarial read, and the first to need **zero rework rounds**. WO-103 skipped
that read, carried three order-text defects into the build, and took two rework rounds plus a
correction. One cheap check, run before the expensive one, is the whole difference.

## Cold suite

Fresh detached worktree, zero `node_modules`, unpiped: **14 PASS, 0 FAIL, exit 0.**

Schema suite 147 → **148** (+1 `lintActionSurface` test), kernel **23** unchanged.
`collab-electron` untouched; `QF_EXECUTE_ALLOWLIST` still `["publish_artifact"]`.

**The builder reported two gates failing and was right to.** `agent-path` and `dock-registry` failed
in its sandbox on `Could not resolve: "ai/test"` during `pack-agent`. It flagged them as probably
environmental and asked the verifier to confirm rather than claiming green or hiding them. Confirmed:
both **PASS** cold here. That disclosure is the behaviour the two preceding rounds lacked.

## Counts re-derived, not read

The order requires every count to carry its mechanism. Derived independently before reading the
builder's table:

```
23 objects × 2 (_get, _query) + 25 actions = 71
golden/tools.json actual entries          = 71
```

Actions **31 → 25**; all six of `retry_run`, `close_run`, `request_approval`, `approve`, `deny`,
`promote_type` confirmed absent from `schema.actions`. `observe_ticket` remains an action — correct,
it is a working verb; the question the gate governs is whether it is ever *served*.

## The `observe-door` gate — attacked, not re-run

This gate exists because **three seats hand-wrote triggers for this risk on 2026-07-26 and all three
read "safe" while exposed.** Re-running the builder's transcripts would have proved nothing about
that, so the verification seat attacked it instead:

| Attack | Result |
|---|---|
| Add `observe_ticket` to `QF_EXECUTE_ALLOWLIST` — debt #22's own first trigger clause | **RED** — caught |
| Make `tools/qf-peer-bus/src/bus.ts` call it — the allowlist-bypassing writer that **none of the three written triggers covered** | **RED** — caught |
| String-concat obfuscation: `"observe_" + "ticket"` | **PASSES** — missed |
| All reverted | green |

The second row is the one that matters: the gate covers a path every prose trigger missed, including
the founder's and this seat's. The third is a **stated limit, not a defect** — the builder declared it
unprompted, and the threat model is a door opening with nobody deciding, not deliberate evasion. A
determined agent that obfuscates a string is a different problem, and it is debt #22's real
resolution (caller identity), which this rung explicitly does not close.

## Judgment calls the builder disclosed

Recorded because they are the kind of thing that is expensive to discover later:

- **The gate exempts its own file** (`qa/gates/observe-door.ts`) from the serving-surface scan, and
  `qa/run.ts`'s description was reworded to avoid self-matching. Legitimate — a gate must name the
  strings it hunts — but it means the gate file itself is unscanned.
- **Debt #21 closed by demotion, not regeneration.** `ONTOLOGY_SCHEMA.md` is now REFERENCE with a
  banner pointing at `golden/ONTOLOGY.md`. The entry offered both; regenerate-and-gate the full
  object surface was judged out of scope for this rung. That choice is now load-bearing for anyone
  who reads the old file.
- **`DOC_AUTHORITY_MAP.md` remains partly unmaintained** beyond this one demotion. Noted by the
  builder, not fixed — correctly, it was out of scope.

## Carried forward

**WO-104 inherits a hard obligation, and it is the reason this rung existed at all.** The generator
emits one tool per action; `qf_observe_ticket` was already being generated and left unserved. WO-104
must decide **whether that tool is served, and to whom** — the `observe-door` gate makes the decision
unavoidable rather than automatic, but it does not make it.

**Debt #22 is gated, not closed.** Nothing here gives the Kernel caller identity. The gate alarms
when the door opens; it does not lock it.
