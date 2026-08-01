# WO-CI4 — Runtime ownership ignores foreign listeners, not owned ones

status: **second binding rewrite — enforce zero guest sockets after PID attribution proved impossible**
assignee: builder
depends: WO-CI3 candidate `196b0ec`
blocks: WO-CI3 verification · WO-107c verification
kind: off-ladder release-gate correction

## Objective

Make the runtime ownership proof reject TCP listeners owned by its own AgentOS/tool-loop process
tree while ignoring unrelated listeners created elsewhere on the founder's machine.

## In plain terms

QuantFlow's agent test currently fails whenever any other program opens a port; make it watch only
QuantFlow's test and agent processes, while still failing if one of those agents starts a hidden
server.

## Measured failure

The independent WO-CI3 verifier ran `bun qa/verify-release.ts` exactly once from a pristine checkout
at `4a7b2d3` (content integrated here as `196b0ec`). The CI3 target passed under canonical load:

```text
prior-schema fixture writable  296.69 ms
prior-schema fixture readonly  462.23 ms
67 pass · 0 fail · PASS kernel
```

The release still exited `1` only because `tools/runtime-proof` snapshots every machine-wide
`ss -ltn` line. Port 8180 appeared after its baseline and persisted after the run:

```text
P2 listeners before: 18
P2 listeners after session: 20
P2 new after session: LISTEN [::]:8180 · LISTEN 0.0.0.0:8180
P2 no second listening server: FAIL
P4 cancel mid-turn is clean: FAIL
```

This is a previously recorded standing trap, not a new theory:
`docs/orders/evidence/wo-106/VERIFICATION.md` and `BUILD-REPORT.md` document concurrent agents and
foreign sockets producing the same false failure. The current gate compares global lines in
`tools/runtime-proof/src/listeners.ts`; it does not attribute sockets to the test or its children.

## Ruling 1 — ownership is PID-scoped

Use `ss -H -ltnp` and parse its owner metadata. An owned listener is one whose `pid=` is either:

1. the runtime-proof test process (`process.pid`), or
2. a `qf-toolloop`/`acp-main` process that appeared after this test's agent-process baseline **and is
   a descendant of the runtime-proof test PID**.

Foreign and ownerless listener lines are observation noise, not evidence against QuantFlow. Preserve
them only for diagnostic counts if useful; they never enter the owned-listener delta.

`processes.ts` reads one full `pid · ppid · args` table and recursively derives descendants of the
runtime-proof test PID. `SharedOs` records the descendant agent-process baseline before
`AgentOs.create()`. At every P2 listener assertion, derive the owned PID set from `process.pid` plus
`processDelta(baseline, currentDescendantAgents)` and snapshot listeners for exactly that set. A
concurrent `qf-toolloop` launched by another task is foreign even if it started after the baseline.

For P4, remember the exact agent PIDs observed during this test. After destroy, query whether those
exact PIDs still exist regardless of current parentage, so a daemonized/reparented orphan cannot
escape the check. Use `process.pid` plus any surviving exact PIDs for the final owned-listener
snapshot. Keep the existing independent orphan-PID assertion; change its global command-name scan
to this exact spawned-PID ownership model rather than deleting or relaxing it.

Do not identify ownership by port number, command substring in the `ss` line, global listener count,
timing sleeps, allowlisted ports, or ignoring `8180` specifically.

## Ruling 2 — fail closed if attribution is unavailable

Before changing the invariant, add a focused live probe that starts a test-owned ephemeral TCP
listener and proves `ss -H -ltnp` reports its exact PID. If this host cannot expose same-user owner
metadata, stop and report; do not fall back to machine-wide counts or declare every line foreign.

The listener parser is pure and covered with exact fixtures for IPv4/IPv6, multiple owners,
malformed PID tokens, ownerless lines, a foreign `8180` listener, and an owned listener. The process
parser/derivation is covered for a direct child, grandchild, unrelated same-command process, and a
tracked PID that survives after reparenting. Malformed or ambiguous owner metadata must not be
classified as owned, but the live probe keeps that from silently making the gate vacuous on the
supported Linux host.

## Ruling 3 — real owned listeners falsify P2 and P4 independently

Add one test-only runtime-proof hook, `QF_PROOF_OPEN_LISTENER=1`, passed only into the packed
`qf-toolloop` session used by P2. Under that hook the mock ACP child opens an ephemeral TCP listener
for the duration of the session and closes it on exit. It changes no production Electron, Kernel,
Dock, schema, or packaged app behavior.

Add a second test-only hook, `QF_PROOF_P4_OPEN_OWNED_LISTENER=1`, inside `runCancelProof`. Immediately
before P4's final owned-listener snapshot, the runtime-proof **test process itself** opens one
ephemeral listener; capture it, close it in `finally`, and leave `orphanSurvivors` empty. This makes
only P4's listener assertion red and proves it is not piggybacking on the orphan-process assertion.

The real P2 command with the first hook must fail by showing the owned child listener. The real P4
command with the second hook must fail with a non-empty owned-listener delta while the orphan PID
checks remain green. Without either hook, P2 and P4 must pass even while a separately spawned,
test-managed foreign ephemeral listener is alive.

## Deliverables

1. `tools/runtime-proof/src/listeners.ts`: pure PID parsing plus owned-listener snapshot/delta.
2. `tools/runtime-proof/src/processes.ts` and `processes.test.ts`: recursive descendant ownership,
   exact spawned-PID survival, and controls for an unrelated same-command process.
3. `tools/runtime-proof/src/proof.ts`: descendant baseline/new-agent ownership wired through P2 and
   exact spawned-PID survival wired through P4 without weakening the orphan assertion.
4. `tools/runtime-proof/src/listeners.test.ts`: parser and live same-user PID-attribution proof,
   including a managed foreign-listener control.
5. The smallest test-agent file needed for `QF_PROOF_OPEN_LISTENER`, plus the P4 test-process hook;
   no app/runtime package surface outside `tools/runtime-proof` changes.

## Acceptance

### Builder-run

From `tools/runtime-proof` after its frozen install:

```bash
bun test src/listeners.test.ts
bun test src/processes.test.ts
bun test src/proof.test.ts
QF_PROOF_OPEN_LISTENER=1 bun test src/proof.test.ts --test-name-pattern "P2"
QF_PROOF_P4_OPEN_OWNED_LISTENER=1 bun test src/proof.test.ts --test-name-pattern "P4"
```

The ordinary commands pass. Both selector commands exit non-zero and print their distinct owned
listener evidence. In the P4 selector run, the exact spawned-agent orphan set remains empty. Restore
by removing the environment selectors and rerun only P2/P4 green. Then run the standing static gates
and `git diff --check`. Do not run the canonical release verifier.

### Verifier-run

In a pristine detached checkout at the submitted commit:

1. Inspect that every listener assertion is PID-owned and the existing orphan-PID assertion remains.
2. Start a verifier-managed foreign ephemeral listener, run P2/P4 green, and stop that owned fixture.
3. Run both real owned-listener selectors red independently, restore the environment, and run P2/P4
   green. Confirm the P4 bait leaves its orphan-process checks green.
4. Run `bun qa/verify-release.ts` exactly once. It must reach `PASS release-verification`, including
   CI3's unchanged five-second drift tests and runtime-proof under ordinary concurrent host noise.

## Out of scope

Port allowlists · special-casing 8180 · production networking · AgentOS replacement · Peer Bus or MCP
redesign · Dock/profile behavior · schema, Kernel, Electron, package, or QA-order changes · timeout
increases · retries · new dependencies · network access · credentials · bets or trades.

## Report back

One plain-language sentence · exact owner model · live PID probe · foreign-listener green control ·
P2/P4 owned-listener red→restore→green · unchanged independent orphan assertion · focused outputs · static gates ·
judgment where the order was silent.

---

## BINDING REWRITE — 2026-08-01 after two rejected candidates

This section supersedes Ruling 3 only where it specifies the P2 child-listener implementation. The
PID ownership design and P4 falsifier remain unchanged.

### Rejected candidate 1 — `3147913`

Ordinary P2/P4 passed with a verifier-owned foreign listener alive, and P4's independent owned
listener bait went red while `orphanSurvivors=[]`. P2's child bait was invalid: the packed ACP agent
runs under Node and crashed on `Bun.listen` before opening a socket.

### Rejected candidate 2 — `9d9d430`

The one-file Node rewrite reached its listening handler but called `server.off()`, which the packed
runtime's Server surface does not provide. It again crashed before listener attribution. Neither
candidate may be approved, and no canonical release run was spent on either after the focused
falsifier proved REWORK.

### RW1 — the packed P2 hook uses only the measured Server surface

The `QF_PROOF_OPEN_LISTENER` hook uses `node:net.createServer()` and exactly these lifecycle APIs:

```text
server.once("error", reject)
server.listen({ host: "127.0.0.1", port: 0 }, resolve)
server.close()
```

Do not call `Bun`, `off`, `removeListener`, `on`, `address`, or any other Server convenience method
inside the hook. The unresolved one-time error listener after successful bind is acceptable for this
short-lived test child; `close()` on stdin end remains mandatory. Listen errors reject `newSession`
instead of hanging or being swallowed.

The builder may change only `tools/runtime-proof/agent-package/src/acp-main.ts` from `9d9d430`, run
the Node-targeted bundle plus existing no-bind type/parser checks, and commit. The independent
verifier then runs the real packed P2 selector first. It must print an owned listener line and fail
the P2 assertion; any child exception is REWORK. Only after exact restore-green and the unchanged P4
control may the verifier spend the one canonical release run.

---

## BINDING REWRITE 2 — 2026-08-01 after `8f0af1f` REWORK

This section supersedes Ruling 1 and RW1 only for the AgentOS guest's P2 listener invariant. Host
foreign-listener filtering, the exact spawned-PID orphan assertion, and the independent P4
test-process listener remain unchanged.

### Measured contradiction

Candidate `8f0af1f` proved that the minimal packed `node:net` surface works: the guest no longer
crashed. Its real listener nevertheless appeared outside the host PID-attribution surface, so P2
reported owned listener counts `0/0/0` and passed. The packed AgentOS guest is isolated from the
ordinary same-user host process/listener model; requiring an attributed host `ss` line for it is not
an achievable contract.

The replacement seam was measured reversibly on the exact candidate:

```text
AgentOs.create({ limits: { resources: { maxSockets: 0 } } })
ordinary P2: 1 pass · 0 fail
packed QF_PROOF_OPEN_LISTENER session/new:
EAGAIN: maximum socket count reached · 0 pass · 1 fail
```

### RW2 — enforce the invariant at the guest boundary

The runtime-proof AgentOS fixture sets exactly `limits.resources.maxSockets: 0`. This fixture uses
ACP over stdio and needs no guest network socket. The limit is test-fixture policy only; it changes
no production Electron, Kernel, Dock, schema, or packaged-app runtime.

Add one permanent P2 socket-denial control that asks the real packed `qf-toolloop` child to open its
test listener through `QF_PROOF_OPEN_LISTENER=1`. The control passes only when:

1. `session/new` rejects with the exact AgentOS capacity mechanism (`maximum socket count reached`);
2. no session remains registered after the rejection; and
3. the ordinary P2 turn still completes normally in the same zero-socket fixture.

If the denial unexpectedly succeeds, destroy that session before failing the test. Do not identify
the guest by host PID, global listener count, port number, command substring, or ownerless `ss`
line. The VM limit is the enforcement; the real packed denial test is its receipt.

### Bound implementation and falsification

From `8f0af1f`, the builder may change only:

- `tools/runtime-proof/src/proof.ts` — configure the zero-socket limit and expose the smallest
  denial helper/result needed by the test;
- `tools/runtime-proof/src/proof.test.ts` — add the permanent packed denial control.

No dependency, timeout, retry, production surface, listener parser, process parser, or packed-agent
change is allowed. Run ordinary P2, the new denial control, P4, and the existing pure parser tests.

The required P2 falsifier changes only `maxSockets: 0` to `maxSockets: 1`. The permanent denial
control must go red because the packed listener opens; its cleanup must leave no registered session.
Restore `0` and rerun green. The independent verifier repeats this bait, repeats the unchanged P4
owned-listener bait, confirms ordinary P2/P4 ignore a managed foreign host listener, and only then
spends the one canonical release run.
