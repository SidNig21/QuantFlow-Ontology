# WO-106 BLOCKER — D6 has a wrong premise and no spelling

> **In plain terms:** the order is right that the system will currently read any file on the machine
> and store it, and right that this must be closed. But it says the desktop app is safe because it
> uses a different route — and the app does not; it uses exactly the route being closed. It also
> says to confine file reads to "a declared staging root" without saying where that root is declared,
> and the four places that publish files today all write to **different** directories. Any fix
> therefore changes app behaviour in a way the order does not authorise. **This needs an architect's
> ruling, not a builder's judgment.**

**Status:** raised **before any D6 code was written**, by the builder-preparer seat, at the pre-build
measurement pass. D0/D1/D2/D3/D4 are unaffected and were built. **D6 and G7 are not attempted.**

Both halves below were re-measured at `d0b714c` in the `wo-106` worktree.

## Finding 1 — the order's stated reason for leaving `bytes` alone is factually wrong (High)

D6 says:

> **The in-process `bytes` route is unaffected and must keep working** — the Electron app publishes
> through it.

Measured — **every `publish_artifact` call in `collab-electron/src` passes `path`, never `bytes`:**

| Caller | Line | Route | Stages into |
|---|---|---|---|
| `collab-electron/src/main/agent-host.ts` | `639-641` | **`path`** | `$HOME/.collaborator/agent-artifacts` (`:630-634`) |
| `collab-electron/src/main/a2a-bus.ts` | `68-72` | **`path`** | `join(COLLAB_DIR, "a2a")` (`:56`) |
| `qa/gates/agent-path/run.ts` | `197-202` | **`path`** | `<gate pkg>/.tmp` (`:193`) |
| `species/hermes/a2a-4tile-smoke.ts` | `274-276` | **`path`** | caller-supplied `storagePath` |
| `tools/qf-peer-bus/src/bus.ts` | `116-125` | `bytes` | — (in-process, no file) |
| `packages/qf-kernel/src/kernel.test.ts` | 9 sites | `bytes` | — |

The only `bytes` producers are the peer bus and the Kernel's own tests. The app is entirely on
`path`. Verify with:

```bash
grep -rn --include=*.ts -A6 '"publish_artifact"' collab-electron/src | grep -E "bytes|path"
```

**Why this is not pedantry.** The clause is D6's *blast-radius assessment*. Read literally it says
constraining `path` costs the app nothing. It costs the app both of its publish sites. An
implementation built on that premise would be tested against the wrong callers — and this is the
same composition error D6 itself exists to fix: two individually-true facts (constrain `path`;
`bytes` is unaffected) combined into a false conclusion about who is affected.

## Finding 2 — "a declared staging root" has no spelling, and no single root fits (High)

D6: *"Constrain `path` to a declared staging root."* ROADMAP debt #25 says the same thing —
*"constrain `path` to a declared root (a workspace/artifact-staging directory)"*. **Neither says how
the root is declared**, and the four live callers stage into four different places (table above), so
**no fixed root satisfies them all**.

Measured constraints that make this a design call rather than a detail:

- `packages/qf-kernel/src/` contains **zero** `process.env` reads. The Kernel takes no environment
  configuration today, so an env-var root is a new pattern in the layer that owns the rejection.
- `COLLAB_DIR` (`collab-electron/src/main/paths.ts:34-36`) is `$HOME/.collaborator` in production but
  `$HOME/.collaborator/dev/worktree-<hash>` in DEV, while `agent-host.ts:630` hardcodes
  `$HOME/.collaborator/agent-artifacts` — so even the app's two staging dirs **diverge in DEV**.
  A root that covers both in production silently rejects one of them in a dev build.
- D6 requires the rejection to be "the Kernel's, at or before `resolveBytes`, so it applies to every
  caller" — which forecloses fixing this at the MCP layer, where the actual privilege widening is.

Two competent builders would land differently, and both could defend it against the order's text:

| Candidate | What it does | Cost |
|---|---|---|
| **A — configurable root, env var, reject when unset** | `resolveBytes` reads a declared root; no root ⇒ `path` rejected entirely, `bytes` unaffected | Cleanest layering. Every `path` caller must now declare a root: two app sites, one QA gate, one species smoke |
| **B — configurable root with a default** | As A, but defaults to the app's artifact dir | Nothing to change in the app — but hardcodes an app-layer, home-relative path into the Kernel, and the DEV divergence above makes the default wrong half the time |
| **C — root passed to `openKernel()` / `attachKernel()`** | Root becomes part of opening a Kernel, like the DB path | Most explicit, matches `openKernel(path)`; widest signature change, touches `portable.ts` |
| **D — relocate every caller into one root, then hardcode it** | One staging dir repo-wide | Simplest check; a behaviour change to the app's artifact layout that D6 does not authorise |

**This is the pre-build read's Q2 failing** — *"if two competent builders could implement it
differently and both be right, it is underspecified."*

## Finding 3 — `path` is the only route an MCP agent has, so D6 constrains the rung's own surface (High)

`publish_artifact`'s own schema says it, in the field description WO-105 D0 wrote
(`qf-kernel-schema/src/ontology/research.ts:516-521`):

> *"Filesystem path to read artifact bytes from; **MCP callers must supply this because bytes cannot
> cross JSON**."*

`bytes` is a `Uint8Array`. It cannot travel over an MCP tool call. So for every agent on the served
plane — the plane this rung exists to make self-describing — **`path` is not one of two routes, it
is the only one.**

Confining `path` to a staging root therefore does not merely narrow a privilege; it decides whether
served agents can publish artifacts at all. They can, but only for files that already exist inside
the root, and **no tool in the served plane writes files** — actions write to the Kernel, and the
host process is what stages bytes to disk today (`agent-host.ts:636-637` writes the file, then
publishes it). An external agent can still do it if its *own* framework has file tools pointed at the
root — which is how the D5 baseline run worked (`d5-baseline-real-model-2026-07-26.md`: kimi-k3
driving Hermes, with Hermes' own tooling).

So the ruling also has to say which of these the staging root is:

- **a shared drop-box** that served agents are expected to write into with their own tools — in which
  case it is a trust boundary in its own right, and "reject symlinks that escape it" is doing real
  work; or
- **host-staged only**, in which case MCP publication becomes host-mediated and
  `qf_publish_artifact`'s usefulness on the served plane changes materially — on the same rung whose
  objective is *"an agent that has never been told about QuantFlow can list the tools and see exactly
  how to call them."*

Neither is wrong. But the order picks neither, and the choice changes what the rung ships.

*Found independently by the D0–D4 builder run as its standing-closer defect, and confirmed here at
source.*

## Why the pre-build read did not catch it

It could not. `NEXT.md` records it plainly: **"D6 and G7 were added AFTER that read."** The thirteen
findings were all against the D0–D5 text. D6 is the one deliverable on this rung that has never been
adversarially read — and it is the one carrying a security fix.

That is a process observation worth more than the finding: **an order amended after its adversarial
read is, in the amended part, an unread order.** WO-105's rework record made the same shape of point
about a gate edited after it was falsified.

## What is NOT blocked

D0, D1, D2, D3 and D4 are independent of this and were built. The hole D6 names is real — it was
measured with a canary file by the post-merge review and is logged as ROADMAP debt #25 with its
trigger already FIRED. **Nothing here argues for leaving it open.** It argues that the fix's shape is
an architect's call, because every candidate changes where the desktop app is allowed to stage files.

## The ruling needed

1. **Which candidate** (A–D above, or another), and
2. **Whether `agent-host.ts` and `a2a-bus.ts` may have their staging directories changed** — because
   if they may not, only B is available, and B is the weakest of the four.
3. **Correct D6's `bytes` clause** so the next reader is not told the app is unaffected.

Worth deciding in the same sitting: G7's "a path inside it still works" needs a root the gate can
point at, which is itself an argument for A or C over D.

*Recorded by the builder-preparer seat. Every fact above was measured at source in the `wo-106`
worktree before this was written; no claim here is inherited from the order's text.*
