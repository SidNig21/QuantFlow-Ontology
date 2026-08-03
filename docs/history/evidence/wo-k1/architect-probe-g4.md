# WO-K1 — architect probe of the round-3 G4 fix, 2026-07-27

**In plain terms:** the last review said the order's final test recipe might still be fake — that it
could pass while the real problem survived. A fresh session ran the recipe against the real library
it depends on instead of re-reading the text. The recipe works, and one detail nobody had seen is
now written into the order so the builder is not surprised by it.

**Seat:** a fresh architect session (handoff, 2026-07-27). The previous architect seat asked for
exactly this check: *"worth your session checking whether my fix for it is real, because my track
record this session is that two of my fixes were not."* This record is a **measurement, not a
fourth prose read** — the decorrelation concern about a fourth read grading the third seat's
requirements does not apply to running the recipe against the live SDK, per PROTOCOL: measurements
beat prose.

## What was probed

G4's final recipe (`WO-K1.md`, the round-3 WORSE fix): *build the gate as `StdioClientTransport`
directly, with an explicitly constructed child env that **omits** `QF_KERNEL_DB`, and `HOME` pointed
at a temp directory.* That is an SDK-facing claim, and the order carried no probe for it — an
external-surface-rule gap in its own right, closed by this record.

## The SDK fact none of the three rounds saw

`StdioClientTransport` does **not** use the caller's env verbatim. It spawns with the caller's env
merged **over a default environment inherited from the parent**:

```
tools/qf-read-tools/node_modules/@modelcontextprotocol/sdk/dist/cjs/client/stdio.js:73-77
    env: {
        ...getDefaultEnvironment(),
        ...this._serverParams.env
    },
```

where `getDefaultEnvironment()` copies `HOME, LOGNAME, PATH, SHELL, TERM, USER` from
`process.env` (`stdio.js:30-31`, "list inspired by the default env inheritance of sudo").

## The probe — three runs, parent carrying a canary pin

Parent set `QF_KERNEL_DB=/tmp/LEAK-CANARY/kernel.db` (simulating D6, which puts the key in the
app's own process by design). Child is a trivial script that writes its own `process.env` view —
`QF_KERNEL_DB`, `HOME`, `os.homedir()`, key count — to a file. Three transports:

| Run | Child env passed to the transport | Result |
|---|---|---|
| A | `envFor({})` — the harness's spread of `process.env` | `QF_KERNEL_DB=/tmp/LEAK-CANARY/kernel.db`, 117 keys — **the round-3 WORSE, reproduced** |
| B | `{ PATH, HOME: <mkdtemp sandbox> }` — the recipe | `QF_KERNEL_DB=null`, `HOME` **and** `homedir()` both inside the sandbox, **6 keys** |
| C | `undefined` — SDK default environment | `QF_KERNEL_DB=null`, but `HOME` = the founder's real home |

Verbatim output:

```
[A-envFor-spread] {"QF_KERNEL_DB":"/tmp/LEAK-CANARY/kernel.db","HOME":"/home/sidnig21","homedir":"/home/sidnig21","envKeyCount":117}
[B-explicit-omit] {"QF_KERNEL_DB":null,"HOME":"/home/sidnig21/QuantFlow-Ontology/.probe-wo-k1/home-PEzBgY","homedir":"/home/sidnig21/QuantFlow-Ontology/.probe-wo-k1/home-PEzBgY","envKeyCount":6}
[C-sdk-default] {"QF_KERNEL_DB":null,"HOME":"/home/sidnig21","homedir":"/home/sidnig21","envKeyCount":6}
```

Probe files were temporary and are not in the tree; `git status` clean after removal.

## Verdict

**The fix is REAL, both halves.**

- **Omission holds.** `QF_KERNEL_DB` is not on the SDK's inherited safe-list, so a constructed env
  that omits it produces a child without it — even though the parent carries it (run B vs run A).
- **The `HOME` sandbox is load-bearing, not decoration.** Run C shows the key stays out even with no
  env at all, but `HOME` then resolves to the founder's real home — exactly the "gate writes into
  the real platform Kernel" failure G4's text predicts. Without run C on record, a builder could
  argue the explicit env is unnecessary.
- **One correction fed back into the order:** the child's *effective* env is not the object the gate
  constructs — the SDK merges six inherited keys underneath it. So report-back item 5's original
  wording ("print the child env the gate actually constructed") was the weak, parent-side form: the
  constructed object and the child's reality are one merge apart, which is one-source-two-sides in
  miniature. The order now requires the proof from **inside the child** — the child's own D4 boot
  line, whose `provenance=default` is precisely the statement that no `QF_KERNEL_DB` reached it.

## One boundary note

The generator's existing `existsSync(SERVER_TS)` check (`setup-founder-seats.ts:141-144`) is **not**
the recurrence defence D8 asks for, and the two must not be conflated at build time: the scratchpad
path passed that check on the day it was baked, because the file existed at that moment. D8's
git-work-tree assertion is a genuinely different predicate and stays required.
