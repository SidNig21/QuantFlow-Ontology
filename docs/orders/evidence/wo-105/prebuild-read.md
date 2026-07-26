**Plain language:** This order’s intent is sound — agents get write buttons, your observe door stays off the map — but several gates can be satisfied without proving what they claim, and one Context citation is already wrong against the code.

---

# Pre-build adversarial read — WO-105

Frame: PROTOCOL reviewer role — two questions only; findings are testimony; measurements beat prose.

## Context table audit (measured)

| Claim | Verdict |
|---|---|
| `execute.ts:116-120` GATE 2 | **Sound** — `assertTransition` / `IllegalTransitionError` sit there. (SCOPES still says `:128`; the order fixed the cite.) |
| No Zod `.parse`/`safeParse` in `packages/qf-kernel/src` | **Sound** — only `JSON.parse` in `replay.ts` / `kernel.test.ts`. |
| `links.ts:12` `extractLinkSpecs` | **Sound**. |
| `register.ts:43` iterates `schema.objects` | **Sound**. |
| 25 actions · 24 = 25 − 1 | **Sound** (live schema). |
| 15 gates · schema 149 · kernel 28 | **Sound** (`qa/run.ts --list` = 15; WO-104 verification record). |
| `create.ts:677` strips `links` | **Wrong** — even at cited `fd7c2ef`, call is `create.ts:736`; `:677` is inside `observeTicket`. |
| `pipelineFed` at `define.ts:12,160,172` · `lintCommands` at `:467` | **Sound**. |
| `ticket.observed` / `observe_ticket` creation | **Sound**. |

---

## Findings (severity-ranked)

### 1 — High · G5 vs Deliverable 4 / current `read-tools` G4: contradictory obligations

**Order text:** G5 — "`observe-door` and `read-tools` must both still pass — this order must not weaken either`"; Deliverable 4 — `tools/list` must show "**exactly** the action tools for non-`operatorOnly` actions (**24** today)"; current `read-tools` gate runs harness G4 which requires `names.length !== 69` fail and **zero** action-shaped names (`harness.ts` “G4 zero action tools”).

**Can the gate fail / one meaning?** Two competent builders both “comply”:
- **A** rewrites harness G4 to expect 69+24 and keeps `read-tools` calling the same script — G5’s “must not weaken” is judged by “observe still absent.”
- **B** refuses to change harness G4 (literally “don’t weaken”), so `read-tools` stays red once actions are served — order unsatisfiable.

Serving 24 actions through the **same** server binary that `read-tools` proofs against makes “leave read-tools G4 unchanged” impossible. The order never says “replace WO-104’s zero-action assertion with a non-operatorOnly assertion.” **Underspecified to the point of deadlock.**

---

### 2 — High · G4 does not falsify `.observed` suffix coupling (WO-004 forged-assertion class)

**Order text:** ruling — lint fails when “(a) any creation command whose event name ends `.observed` maps to an action without `operatorOnly`, or (b) any `operatorOnly` action's command event does not end `.observed`”; G4 baits only: strip flag from `observe_ticket` / add flag to a non-observation action.

**Passing implementation that violates the guarantee:**

```ts
// Name-coupled, not suffix-coupled — passes both G4 baits, fails the ruling’s “future observe_run inherits”
for (const cmd of creationList) {
  if (cmd.action === "observe_ticket" && !action(cmd).operatorOnly) throw …;
}
for (const a of schema.actions) {
  if (a.operatorOnly && a.name !== "observe_ticket") throw …;
}
```

G4 never baits: add creation `{ action: "observe_run", event: "run.observed" }` without the flag → lint must go red. Without that, the “not an `if (name === …)`” claim is prose. Same shape as a gate that only ever sees the one known row.

**Also (one meaning):** side (a) is explicitly **creation**-only. A transition-only action with event `*.observed` and no creation row is outside (a). Side (b) says “the action's command event” (singular) while actions like `resolve_hypothesis` have **three** transition events — which list, which event, all-must / any-must? Transition actions with no creation command are underspecified.

---

### 3 — High · “Counts derived at runtime, never hardcoded” is not a gate

**Order text:** Deliverable 4 — “Counts derived from the live schema at runtime, never hardcoded”; G3 baits (a) remove `operatorOnly` → list gains `qf_observe_ticket`; (b) hand-register one tool → “count assertion red.”

**Passing implementation:** hardcode `expected = 93` (or `69 + 24`) in the harness. Both baits still go red; derivation is never checked. The live harness already hardcodes `69` — the failure mode is the incumbent pattern. The clause cannot fail as written.

(The inline “(**24** today: 25 − 1)” / “all 69 read tools” invites that hardcoding.)

---

### 4 — High · Context row invents `create.ts:677`

**Order text:** “stripped by `extractLinkSpecs` **before** field validation | `…`, `create.ts:677`”

Measured at `fd7c2ef` and at HEAD: extraction is `create.ts:736`. Line 677 is observation-ticket handler body. **A measured-claims table with a wrong row is worse than none** — builders will cite it.

---

### 5 — Medium · G1 bait can be ceremony for two of three shapes; GATE 1 coverage can be creation-only

**Order text:** G1 — three malformed shapes; then bait: “disable the parse (one-line revert), show a malformed call that now lands garbage in a row or event payload.”

**Can it fail for real?** Partially.
- Creation handlers already hand-check types (`parseTicketFields`, `typeof` guards). After disabling Zod, `stake: "100"` / missing fields may still throw in the handler — **no garbage lands**, so the bait transcript cannot be produced for those shapes without picking a path that doesn’t re-validate.
- Transition path writes full `input` into the event payload (`execute.ts` payload). **Unknown extra key** can land garbage after disable — that bait is real.
- G1 never requires a **transition** malformed call. Builder can put GATE 1 only on the creation branch (where `extractLinkSpecs` already lives) and still paste a green G1 from `create_*` only — **violating “creation and transition commands alike”** (Deliverable 1) while satisfying G1 as written.

“Disable the parse” is real only if there is a single parse site covering both paths; the order does not require proving that.

---

### 6 — Medium · Deliverable 3 vs Deliverable 4 on where rejection happens

**Order text:** D3 — “the server does **not** pre-validate — `execute()` is the gate, the tool stays dumb”; D4 — one action tool “**rejects** a malformed one at the protocol surface.”

**Two meanings:**
- **A:** MCP `inputSchema` validates (SDK rejects before handler) — “protocol surface” green; execute() may still lack GATE 1 if G1 was only demoed in unit tests.
- **B:** no MCP schema (or passthrough); handler calls `execute()`, returns Kernel error over MCP — “dumb tool,” rejection is still visible on `callTool`.

Both can be argued as “right.” D3 forbids A; D4’s “protocol surface” wording invites A. Pin: rejection must be Kernel/`execute()`-thrown and visible on the transport, and MCP must not be a second validator that masks a missing GATE 1.

---

### 7 — Medium · “Strict” has two buildable meanings; schemas are not `.strict()` today

**Order text:** “**Strict**: unknown keys are rejected, not stripped — after the kernel envelope is removed.”

Measured: Zod object default **strips** unknown keys; `.strict()` rejects. Trace stays in `ctx`, not `input` — sound. Envelope = `links` only — sound if extract-then-parse is followed.

**Two meanings:**
- Apply `.strict()` at the `execute()` parse site only.
- Change every `defineAction` input to `.strict()` in ontology (golden/MCP churn).

Both satisfy the sentence. Order is silent. Prefer parse-site strict so golden tool JSON Schema doesn’t silently change cardinality of “additionalProperties.”

**Related:** if parse runs on raw input **before** `extractLinkSpecs`, every create-with-`links` fails unknown-key. Order says extract first — one meaning **if read**; a skim-reader ships the broken order. Worth a one-line sequencing mandate in execute(): resolve command → (creation? extract) → strict parse → rest.

---

### 8 — Medium · SCOPES contract vs order on GATE 1 placement

**SCOPES WO-105:** “Zod validates … **before anything touches the Kernel**”; gate: “malformed call dies **before the Kernel sees it**.”

**Order:** validate “**inside `execute()`, before any DB read or write**.”

Following the order **fails** the SCOPES gate wording literally (`execute()` is the Kernel). Intent (sole write path) is better in the order; the contract text was not updated. Not a builder defect — an authority-doc defect that will confuse the next pre-build reader.

---

### 9 — Low · Deliverable 3/4 “extend harness” vs new `action-tools` gate

**Order text:** D3 “harness extends… see gate G3”; D4 “Extend the harness… registered as gate **`action-tools`**… expect **16 gates**.”

Mostly one meaning: one new qa gate, harness grows assertions. Residual fork: whether `read-tools` keeps running the **same** `bun run harness` (and thus inherits action assertions) or `action-tools` gets a separate entry script. Coupled to finding 1 — must be pinned with how WO-104 G4 is retired/replaced.

---

### 10 — Low · `golden/tools.json` “count does not change” vs generator loop

**Order text:** “the tool count does not change — the flag changes *serving*, not generation”; generator today emits all 25 actions including `qf_observe_ticket`.

Sound **if** generation ignores `operatorOnly` and only the server filters. A builder who skips `operatorOnly` in `generate/mcp.ts` “for consistency with serving” shrinks tools.json and still serves 24 — conflicts with the count claim. Say explicitly: **generation still emits operatorOnly tools; serving skips them.**

---

## What’s sound (do not “fix”)

- **Ruling mechanism intent** — schema flag + generator/server skip, not `if (name === "observe_ticket")`, is the right shape after six route-naming failures; debt #22 correctly left out.
- **GATE 2 already enforced** — order cites the live lines; G2 requiring bait *through a served tool* is the right upgrade over citation.
- **D1 “schemas from schema package / no second ARTIFACT_KINDS”** — one meaning; caller breakage = finding, not loosen — clear.
- **D3 RW DB + `kernel-sole-writer` still green** — clear; `server.ts:32` really is `readonly: true` today.
- **G3 bait (a)/(b)** — real checks on serving exclusion / schema-loop registration (independent of the hollow count-derivation clause).
- **Arithmetic and most Context cites** — see audit table.
- **Plain-language objective** — founder-readable and matched to debt #22.

---

## Per-item two-question summary

| Item | Can the gate/requirement actually fail? | Exactly one meaning? |
|---|---|---|
| **D1 GATE 1** | Yes for strict parse if tested; G1 as written allows creation-only + weak bait | Strict/extract sequencing mostly pinned; `.strict()` site ambiguous |
| **D2 operatorOnly + lint** | G4 baits fail a no-op lint; **not** a name-coupled lint | Suffix rule underspec for transitions / multi-event actions |
| **D3 action server** | observe exclusion via G3a is real | Pre-validate vs dumb tool vs D4 conflict |
| **D4 / G3 action-tools** | Serving baits real; **runtime derivation not checkable** | Harness vs new gate vs read-tools G4 collision |
| **G1** | Partially ceremony (handler re-checks; creation-only escape) | “Disable the parse” assumes one site |
| **G2** | Yes, if bait neuters `assertTransition` on the served path | Sound |
| **G4** | Yes for the two named mutations; **no** for suffix generality | Mechanism ≠ what G4 proves |
| **G5** | Cold 16-gate run is real | “Don’t weaken read-tools” vs serve 24 actions — **two meanings / deadlock** |
| **operatorOnly ruling** | Serving skip is checkable; lint coupling as claimed is not (by G4) | Creation-suffix well-defined today; transition future underspec |

---

**Bottom line for the founder:** Don’t cut this to a builder until (1) `read-tools` G4 vs serving actions is one written rule, (2) G4 gains a synthetic `.observed` bait so the lint can’t be a name check in disguise, (3) “derive counts” becomes a checkable assertion or is dropped, and (4) the `create.ts:677` cite is corrected. The observe-door *ruling* is the strongest part of the order; the *gates around the lint and the harness* are where this week’s failure modes recur.
