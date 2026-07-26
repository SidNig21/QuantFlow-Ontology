# Pre-build adversarial read — WO-103 amendments

Seat: reviewer (neither builder nor verifier of this work). Findings only. Two PROTOCOL questions only.

---

## Findings (by severity)

### 1 · High — G4b is largely unfalsifiable as written

> **G4b · The generalization is real (builder-run).** Show the create/observe distinction is a named reusable property of the creation path, not ticket-local: name the mechanism, and show a second object type could adopt it without copying `createTicket`'s body. Also show `create_run` **rejects** a supplied `status` rather than coercing it.

**Can it fail?** Only the `create_run` half has a concrete red condition. The rest is a show-and-name gate.

**Bypass that passes while violating the intended guarantee:** extract a file that exports named helpers, have only `createTicket` / `observeTicket` call them, and in the report write one paragraph that `market_event` “could” call the same helpers. No second type adopts the path; the accidental special case Round 1 shipped can survive under a new name. Round 1’s own failure mode (“claimed this generalization and did not deliver it”) is exactly what a narrative G4b still permits.

The deliverable text is the same shape: “a named, reusable property … that a second ingested type can adopt” — **can**, not **does**.

---

### 2 · High — C1’s replacement is clearer than R6 on algorithm, softer on the bar that motivated it

R6 was unambiguous and wrong: *“Install every package that carries a `bun.lock`.”*

C1 replaces that with:

> Install the **dependency closure of the typecheck targets, not the repo**: each package that declares a `typecheck` script, plus the local `file:` dependencies it declares, resolved transitively. … **do not hardcode the package names**, and do not add an exclusion list…

and proof:

> paste `$?`, **and paste the installed size** (`du -sh …`). Cold pass with a small footprint is the bar; either half alone is not.

**Q1 — can the size half fail?** Exit code can. “Small footprint” cannot go red by construction: no threshold, no comparator, no fail command. A builder can install the discovery set (today that includes `tools/qf-peer-bus` and its npm tree, not only kernel+schema), paste a multi-hundred-MB `du`, and still claim “small vs 3.4 GB.”

**Q2 — one meaning?** No. C1 simultaneously says:

| Clause | Reading A | Reading B |
|---|---|---|
| “each package that declares a `typecheck` script” + “do not hardcode” | Discover all typecheck packages (incl. `qf-peer-bus`) | — |
| “Actually required (`qf-kernel` + `qf-kernel-schema`) · **~15 MB**” | — | Success looks like those two packages / ~15 MB |

Those are different install/typecheck sets. C1 is better than R6 on *how* to walk manifests; it is not better specified on *what counts as done*. The defect C1 attributes to R6 (“instruction rather than builder”) is real; C1’s cure reintroduces judgment where R6 had a crisp (wrong) rule.

---

### 3 · Medium — G4 part 1 vs Round 2’s blessed null behavior: two legal readings

G4:

> `create_ticket` with **any** grade supplied → **rejected**. Not coerced, not ignored — rejected.

Round 2 “verified fixed”:

> an explicit `grade: null` is accepted but still lands `pending`, so it fabricates nothing

**One meaning?** No. Builder A rejects any present `grade` key (including `null`) — literal G4. Builder B accepts `grade: null` — literal Round 2. Both are “right” against different amendment layers. The checking seat already treated B as correct, so the order text still says A.

---

### 4 · Medium — G4 part 3’s grep is satisfiable while a non-`origin` bypass remains unenumerated

> **The bypass is closed:** show that no input to `create_ticket` — `origin` included — produces a terminal-grade row. Demonstrate that `origin` is not a readable input field on either verb. A grep proving `origin` is never read from command input satisfies this; a passing test does not.

**Can the grep fail?** Yes if someone still reads `input.origin`.

**Satisfiable while missing the spirit:** `grep` for `input.origin` (as Round 2 did) passes under `const { origin } = input`, or under a different settling field never named in G4 (`settled_grade`, `result`, etc.). The stronger claim — “no input … produces a terminal-grade row” — has no finite bait list, so it cannot be shown to fail exhaustively; it is only as strong as the attacks someone happens to try. Parts 1–2 (reject `grade` on create; observation event on observe) *can* fail cleanly. Part 3’s grep clause is the soft spot — same family as the original G4 (a check that can pass while the rule is still open).

---

### 5 · Medium — Deliverable 0 body amendment never absorbed C1; cold readers can still implement the wrong install set

In-body amendment:

> The gate must satisfy PROTOCOL's **cold-state rule**: it installs whatever it needs, or it invokes `bunx tsc --noEmit` directly. … **Discover the packages, do not enumerate them**

“Installs whatever it needs” does not define the install set. That underspecification is what produced R1 → R6 → C1. C1’s required shape lives only in the appendix; the deliverable text was not rewritten to match. Two competent builders, both obeying “amended” D0: one installs typecheck-script packages only (R1 failure mode); one implements C1’s closure. Both can claim the body amendment.

---

### 6 · Low — Counting rule is a report rule, not a gate that goes red

> Report **only kinds you can write end to end through `execute()`**, and list the unreachable ones separately with the reason.

Clear enough for Q2. For Q1 it cannot fail a command — only a verifier’s recount. Acceptable as a counting discipline; not an acceptance gate in PROTOCOL’s sense.

---

## Sound (no finding manufactured)

**Split-the-verb ruling (as written into the order)** — unambiguous for the mechanism that matters:

> **`create_ticket`** — … **Does not accept a grade at all.** Always starts `pending`. …  
> **`observe_ticket`** — … **May arrive at any legal grade** … observation event, never a synthetic transition.  
> **`ticket.origin` is derived from which verb was used and is no longer accepted as input.**

Bound with D1’s name list (“exactly” `create_run` / `create_mission` / `create_ticket` / `observe_ticket`; “No other action name is added”), the generalization reads as shared reject/observe *machinery*, not a license to invent more `observe_*` verbs. Do-not-relitigate is clear. Not relitigating wisdom — only clarity. **Sound.**

**D1 action-name / single `## Actions` line carve-out** — one meaning; `doc-action-surface` can go red. **Sound.**

**G4 parts 1–2** (ignore the null edge in finding 3) — concrete reject / accept / event-shape baits. **Mostly sound.**

**G5 unpiped `$?` amendment** — can and did fail; one meaning. **Sound.**

**R4** (filter all commands per type; require id-field agreement; multiple `*_id` keys) — one concrete meaning; describes a real unfalsified guard. **Sound.**

**R2’s attack transcript as a *probe checklist*** — concrete. The problem is G4’s written gate not fully capturing that checklist (findings 3–4), not the ruling itself.

---

## Plain sentence

The amendments fixed a real gate hole (relabel `origin` and pretend you observed a bet), but the new “generalization” check and the “small install” check can still be passed without proving what they claim — and one sentence about rejecting “any grade” still disagrees with a null case the same seat already blessed.

---

Stopped. No edits, no merge, no push.
