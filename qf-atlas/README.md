# qf-atlas

A generated map of how QuantFlow is wired. Point an agent at `ATLAS.md` instead
of explaining the architecture.

```bash
bun qf-atlas/generate.mjs           # rewrite the map from source
bun qf-atlas/generate.mjs --check    # exit 1 if the committed map is stale
```

## What it is

A **projection of the code**, in the same spirit as `qf-kernel-schema/golden/`.
It owns exactly one claim: *this is how the program is wired right now.*

It is **not** Kernel truth and **not** the running app. The Kernel still owns
Missions, Tasks, Runs, Artifacts and Evaluations. Nothing here is a second
storage place for research state, and nothing reads it at runtime.

## Outputs

| File | For | |
|---|---|---|
| `ATLAS.md` | agents and humans | the brief you hand to an architect |
| `atlas.html` | humans | the interactive map — open it in a browser |
| `atlas.json` | tools | the full model, every node, wire and finding |

All three are generated. **Nobody hand-edits them.** If you change one by hand,
`--check` fails on the next run, which is the point.

## What a wire is

One IPC channel, traced across the three hops work actually takes:

```
renderer  →  preload  →  main
 App.tsx     contextBridge   ipcMain.handle
```

A wire is only as good as its weakest hop, so every channel gets a status:

- **`live`** — all three hops present. Work flows.
- **`unused`** — preload exposes it, main handles it, no renderer calls it.
- **`unreached`** — main registers a handler nothing forwards to.
- **`dead`** — preload calls a channel with no handler. **Fails at runtime.**

In the HTML, a packet travels its wire only as far as the code carries it. Where
it stops, an `×` marks the break. That is where work dies.

## What it finds

Two separate lists, because they call for different actions:

- **Strip candidates** — dead, unreached and unused wires. **Removal candidates, not permission.** Static non-reachability never authorizes a cut on its own: rule out a packaged or dynamically-loaded caller first, and record a verdict in decisions.json.
- **Write-door violations** — files holding SQL outside the declared write door
  (DERIVED from the Kernel's own dispatch structure — see `writeDoor` in atlas.json —
  plus generated schema SQL). The hand-typed six-file list this README used to print
  was retired: the derivation disagreed with it on eight of ten files, and four of its
  six entries implement no dispatched action at all. These are governance findings,
  not cleanup: a
  violation is code that works but breaks `START_HERE §1`. Scoped `product` vs
  `qa` so a gate seeding fixture SQL cannot inflate the real number.

A file that starts writing SQL, or a handler nobody calls, appears on the next
run without anyone editing anything. That is the whole design.

## Keeping it honest

`--check` regenerates in memory and compares against the committed files. Code
moved and the map did not → exit 1. **The map cannot drift from its generator for
longer than one commit.** Generator correctness is separate, protected by the
falsifiers and independent verification.

Wire it into CI the same way generated schema files are already diffed. It is
deliberately not registered in `qa/run.ts` yet — that file belongs to the active
rung, and this branch does not touch it.
