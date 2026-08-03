# WO-K1 — pre-build adversarial read, round 2, 2026-07-27

**Seat:** `composer-2.5` — decorrelated from round 1's `cursor-grok-4.5-high`, and from the architect
seat that wrote the order and the fixes.
**Command:** `cursor-agent --print --output-format text --model composer-2.5 --trust --sandbox enabled "$(cat …/prebuild-k1-round2.md)"`
**Raw:** stdout arrived complete, 6,708 bytes. **Tree after: clean.**

**Why a second read at all.** Round 1's fixes changed a ruling, added a deliverable and rewrote three
gates. That is more change than round 1 had reviewed, so shipping on round 1's verdict would have
meant cutting an order no seat had ever read in its final form.

**Verdict: DO NOT CUT**, with four required changes. All four are now in the order.

## The question round 2 was built to answer

Round 2 was not asked to re-find round 1's bugs. It was asked, for each accepted finding: **did the
fix actually fix it, or only acknowledge it?** — because an order that names a defect and then leaves
the remedy ambiguous has converted one bug into a bug plus false confidence.

That framing earned its keep. Two of eight came back **ACKNOWLEDGED**, and both were real:

| Round-1 finding | Round-2 verdict | The gap |
|---|---|---|
| A1 — four `~/.hermes` pins | FIXED | — |
| High 2 — D6 incomplete | FIXED | — |
| **High 3 — G1 vs D2 contradict** | **ACKNOWLEDGED** | The named allowlist fixed the harnesses, but `setup-founder-seats.ts:22` still constructs `kernel.db` and is deliberately *not* on the list. The order noted G1 would redden it and never said what the builder should do about it |
| High 4 — relative env path | FIXED | — |
| High 5 — unnamed settings | FIXED | — |
| RULING 2 correction | FIXED | Independently re-measured: `busy_timeout=0` → fail in ~1 ms on both journal modes; `busy_timeout=2000` → OK ~530 ms |
| **readonly + WAL landmine** | **ACKNOWLEDGED** | The order mandated a conditional pragma. `attachKernel(db)` takes no options and `openKernel`'s `readonly` flag never reaches it — **no mechanism existed to make the condition knowable**, so a builder would set WAL unconditionally and ship the WO-K2 breaker anyway |
| G4 overclaim | FIXED | — |

The readonly row is the sharpest lesson on this page: **a requirement stated without a mechanism is
not a fix.** The architect wrote "only on a handle that can write" while the codebase had no way to
know that at the point of the call.

## New High findings in material round 1 never saw

**1. D3 had no mechanism for "is this handle writable."** As above. Fixed by giving `attachKernel` an
options parameter that `openKernel` populates, with an explicit instruction *not* to infer readonly
by catching the throw — a `try`/`catch` around a pragma swallows real failures and cannot separate
"reader, expected" from "this file is broken."

**2. G4's MCP requirement was not buildable as written.** "Drive the MCP seat path" named no
subprocess, no fixture, and no recipe, so a builder could satisfy G4 with the app plus `agent-host`
spawn and never exercise the Hermes YAML route **that caused the live split**. Fixed by specifying a
stdio-MCP subprocess of `server.ts` with no `QF_KERNEL_DB` in its environment, reusing the existing
`harness.ts` transport pattern — and by forbidding any dependency on the `hermes` binary, which would
reproduce the false-red class debt #23 already records against `agent-path`.

**3. D8 and G1 deadlocked on `setup-founder-seats.ts`.** Stopping the YAML emission at `:47-49` left
`:22` and `:148` constructing and opening a second Kernel path, in a file G1 reddens. The two likely
builder outcomes were a stealth allowlist entry (forbidden) or a red gate the order never planned
for. Fixed: the file calls the resolver, and an exemption is a finding to report rather than a line
to add.

## Findings the architect verified and escalated

**The seat profiles are dead, and it is the same defect shape as the pin.** Round 2 noted as a Low
that the profiles' MCP `args` point at a stale `server.ts`. Measured, it is worse than a nit — all
three point at:

```
/tmp/claude-1000/…/7336e31a-…/scratchpad/scope-w2/tools/qf-peer-bus/src/server.ts     MISSING
```

A scratchpad from a long-finished session. **The founder's three peer-bus seats cannot start at all
today**, independently of the Kernel pin. Same shape as A1 — a generator baking a path that was only
valid in the machine state of the moment it ran — so D8 now covers both. Removing the Kernel pin
alone would have left three seats resolving the correct Kernel and still failing to launch.

**The fifth config surface is latent, not live.** `~/.collaborator/agentos-host-mounts.json` carries
a `speciesEnv` map that `resolveSpeciesSessionEnv` (`host-mounts.ts:103-113`) forwards wholesale into
the AgentOS env. Measured: it holds only `HERMES_BIN`, `HOME`, `HOST_ACP_BIN` — **no Kernel pin, so
nothing to strip.** Recorded because a pin added there later would reach AgentOS and not the
host-ACP literal, producing another half-split. No change required.

**Independent confirmation of A1.** Round 2 re-measured all four pins at the stated files and line
numbers, and swept `.mcp.json`, shell rc files, `.profile`, Cursor config and systemd for a fifth
live `QF_KERNEL_DB`. **None found** — the architect seat ran the same sweep separately and also found
none. Two independent sweeps agreeing is the strongest statement available that the four-file list is
complete on this machine.

## A disagreement between the two seats, left standing

Round 1 measured the reader-during-commit blip at **721 ok / 1 locked** under a rollback journal.
Round 2's tighter loop reproduced **0 locked** in both journal modes and marked its own result
UNVERIFIED.

**Not resolved, and it does not need to be.** The blip is timing-dependent and rare by both accounts.
The corrected RULING 2 rests on the writer-versus-writer measurement, which **both seats reproduced
independently and which agree**: `busy_timeout` does the turn-taking, WAL does not. Recorded rather
than adjudicated, because the shipping requirement is identical either way and manufacturing
agreement between two seats would be worth less than the disagreement is.

## Process notes

- Round 2 killed two of its own background probes that hung on overlapping `bun` children, and said
  so. Its headline numbers came from follow-up probes it re-ran afterwards.
- No repo file was written by either seat across both rounds.
