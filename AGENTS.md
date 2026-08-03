# AGENTS.md

**Read this before you touch anything.** It is the cold-start briefing for any coding agent
(Cursor, Codex, Claude Code, or a seat QuantFlow spawned itself). It is short on purpose. It
is not the authority — it tells you where the authority lives and which rules you will break
if you skip it.

QuantFlow is a Windows-first, single-user spatial console for AI-assisted quantitative research.
It is **research and advisor only** — it never places a bet or executes a trade. It proposes,
backtests, criticizes, evaluates, and reports; the operator acts in the world.

## Read in this order, in full, before your first edit

1. **`START_HERE.md`** — mission and the hard rules. If anything below contradicts it, it wins.
2. **`docs/orders/NEXT.md`** — points at the one unblocked order, or tells you to stop when none is authorized. Never choose work around it.
3. **Your order in `docs/orders/`** — deliverables, gates, and out-of-scope. End to end.
4. **`docs/orders/PROTOCOL.md`** — rules of engagement, roles, evidence standards.

Background, only as needed: `docs/DOCTRINE.md` (plan of record, the *why*),
`docs/LAWS.md` (canvas-seam laws, same weight as the One Rule), `docs/DEBT.md`
(known debt — binding, blocks nothing).

**`NEXT.md` is the build authority** (DOCTRINE A9). There is no ladder file to consult and no
roadmap to select from. The old ones are in `docs/history/` and are not authority — if one names a
rung, that is history, not permission. If `NEXT.md` closes the door, stop and say so.

## The one rule

**The Kernel owns truth. Everything else is a projection or a cache.**

The Kernel is a typed ontology (objects · links · actions) in local SQLite. Any change that
makes something remember state outside the Kernel is rejected on sight. There is exactly one
write path — `execute()` in `packages/qf-kernel/src/execute.ts`. If your change writes SQL
anywhere else, it is wrong no matter how well it works.

## Delivery standard: tangible progress, anti-ceremony, honest credit

This binds every main agent, sub-agent, verifier, and automated swarm working in this repository.

- **Ship runnable capability.** Optimize for the shortest correct path to software an operator or
  downstream agent can actually exercise. Process serves delivery; it never becomes the product.
- **No process for its own sake.** A certificate, ledger, dashboard, meta-report, or governance file
  counts only when it is a hard gate or required release evidence for a named feature. Otherwise do
  not create it.
- **Feature work dominates.** At least 95% of open work must deliver or directly repair runnable
  behavior. Any process-only item must name the feature and gate it unblocks.
- **Proof must be real.** Never present a fixture, mock, scripted movie, weakened assertion, or
  hard-coded success path as live capability. A false close is reopened and recorded as an incident.
- **Refusal is not delivery.** A correct refusal earns credit only for the refusal path; it does not
  close the feature. Keep the capability open and name the smallest follow-up that implements it.
- **Acceptance criteria carry these rules.** Every order must say what a user or consuming agent can
  run when it is done, and every builder prompt inherits this section without restatement.

## The five you are most likely to break

1. **No work without an order.** If you find a bug outside your order, log it — don't fix it.
   An unscoped fix in a scoped commit is how a clean gate hides a regression.
2. **No new truth stores. Ever.** Not a JSON sidecar, not a second schema file, not a cache
   that outlives the process. If you need to remember something, it is a Kernel object or it
   does not exist.
3. **You are never your own verifier.** Do not mark your own work passed. Report evidence and
   stop. Someone who did not build it decides whether it landed.
4. **A gate you did not falsify is not a gate.** Every gate ships with a bait transcript:
   break the thing on purpose → watch it go red → restore → watch it go green. Paste both
   outputs. A gate that has only ever been green is decoration.
5. **Never handle credentials.** Do not write, read, log, print, commit, or template any API
   key, token, or secret — not in code, not in tests, not in a `.env`, not in your report. If
   an order needs one, it says "read from `$VAR_NAME`" and the operator exports it before
   launching you.

## Working shape

- Work on a short-lived branch off `main`, named for your order (`wo-101`).
- **Commit from a git worktree, never the shared tree.** Another agent is probably working in
  it. `cursor-agent -w` does this for you.
- Lockfiles are committed. LF line endings (`.gitattributes` enforces).
- TypeScript strict. Bun is the runtime. Every schema entity carries a non-empty description —
  this is lint-enforced at define time and it is not a style preference (see below).

## Descriptions are the product, not documentation

Schema descriptions are the context window of every future agent. An agent that mis-acts
because a description was lazy is a *schema* defect, not an agent defect.

The register: **first sentence says what it is; second says the rule that governs it.** A
description that can be reconstructed from the field name is a defect — "The name of the
workspace" fails. Compare `run`'s live description, which ends "Never clone types per pipeline
step." That is the bar.

## Commands (as CI runs them — `.github/workflows/ci.yml`)

From a clean native-Windows worktree, run the one canonical release verifier from repo root:

```bash
bun qa/verify-release.ts
```

It fails closed off Windows and runs the frozen `collab-electron` install, shell-free focused unit
tests (including the packaged Windows logger policy), the real Windows cold-boot package gate, and
the WO-WIN1 static acceptance gates. The compatibility-only Linux route is
`bun qa/verify-release-linux.ts`; it is not Windows acceptance proof. Use `bun qa/run.ts --list` to
inspect the available gates.

Schema work specifically:

```bash
cd qf-kernel-schema
bun test                           # the suite reports its own count; do not cache it here
bun run generate                   # regenerates golden/ — see below
```

The `schema` QA gate runs that suite with a frozen install, so the canonical release verifier
covers schema work through its final all-gates stage.

**`golden/` is generated output, never hand-edited.** `bun run generate` writes
`golden/migration.sql`, `golden/tools.json`, `golden/ONTOLOGY.md`, and
`golden/conformance.test.ts` from the schema. Drift is caught **byte-for-byte** by
`src/generate.test.ts` — four tests compare each generated artifact against the committed file.

Two consequences you must internalize:

- If you change the schema, `golden/` **must** be regenerated and committed in the same commit,
  or the suite goes red. That is the ritual working, not a nuisance.
- If your change was supposed to be behavior-neutral (a refactor, a file split), then
  `golden/` must **not** change. The golden tests are your proof — you do not need to paste a
  diff. A single changed byte means you moved something you weren't supposed to move.

Never hand-edit `golden/` to make a test pass. That is a second truth store — see rule 2.

## Hard stops — ask the operator, do not decide

- Anything that would place, execute, or automate a real-world bet or trade.
- Adding a dependency, a package, or a service the order did not name.
- Changing `START_HERE.md`, `docs/DOCTRINE.md`, or `PROTOCOL.md`. These change by deliberate
  decision, not as a side effect of a build.
- Deleting or rewriting a test to make a gate pass. If a gate is wrong, say so and stop.
- Force-pushing, rebasing shared history, or touching `main` directly.

## When you finish

Report **evidence, not conclusions**. For each deliverable: what you did, the command that
proves it, and the output. For each gate: the bait transcript. Then one paragraph on any
place you exercised judgment — where the order was silent and you chose. That paragraph is
the most valuable thing in your report, because it is where the next defect is hiding.

**Open your report with one sentence a non-programmer can read** — what you did and what it
means, no type names, no file paths, no jargon (`PROTOCOL.md`, plain-language rule). The person
who decides whether your work ships is the one person in the loop who cannot check your
technical claims. A report only its author can read is a report nobody approved.

If you could not finish, say exactly where you stopped and why. A partial order honestly
reported is useful. A partial order reported as complete costs a day.
