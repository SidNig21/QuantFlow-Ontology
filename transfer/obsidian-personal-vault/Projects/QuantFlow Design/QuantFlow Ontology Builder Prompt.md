
# QuantFlow Verifier
```
**You are the verifier for QuantFlow. Read `docs/orders/VERIFYING.md`, then `docs/orders/PROTOCOL.md`. Do your commits from a `git worktree`, never the main tree — a builder may be live in it.**
```
# QuantFlow builder handoff — pointer (do not maintain content here)

**The live, self-updating version is in the repo:** `~/QuantFlow-Ontology/docs/orders/NEXT.md`
The verifier rotates it to the next unblocked order inside every PASS commit — this vault note would drift, so it holds no instructions.

## The only line you ever give a fresh Cursor window
```
git fetch origin QuantFlow && git show origin/QuantFlow:docs/orders/NEXT.md
Then follow THAT — cut your branch from origin/QuantFlow. Do not trust the working tree's docs/orders/NEXT.md until you are on that branch (local checkout is often a stale builder branch).
```
## Your loop (memorize this, it never changes)

1. Fresh Cursor agent chat in `~/QuantFlow-Ontology` → paste the block above.
2. Builder works a branch, runs gates, pushes, reports.
3. Carry the report to the verifier session → it merges, flips the log, **rotates NEXT.md** on `QuantFlow`.
4. Repeat step 1. Same block, forever.

Rules live in `docs/orders/PROTOCOL.md` (status flips only on verification; builder questions are order defects; two failed reworks = stop).
