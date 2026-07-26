## Measured facts

All cited counts check out on this tree: 23 objects / 9 creatable; 15 links / 7 writable / 8 not; 31 actions / 25 transition-command rows + 10 creation / 6 dead named as claimed; 77 tools; 13 gates in `qa/run.ts`; `qf_observe_ticket` at `golden/tools.json:1060`; no runtime reader of `tools.json` outside `qf-kernel-schema`; zero `ListTools` handlers.

Cosmetic attribution only: `lists` is also blocked by unccreatable `venue`, not only `pipelineFed: instrument`. Count still holds.

---

## QUESTION 1 — Can each acceptance gate actually fail?

**G1 — yes.** Today `lintCommands` does *not* require every `schema.actions` entry to have a command (the six dead ones prove it). A new “every action has a command” lint/test goes red when you re-add e.g. `retry_run` with no command row, green when removed.  
**Wrong pass:** wiring the six instead of deleting them also makes G1 green; only G4’s 31→25 catches that. G1 alone is not “deleted the six.”

**G2 — baitable, but clause 1 is self-hostile as written.**  
- **Clause 1 fails when** `observe_ticket` / `qf_observe_ticket` appears outside the allowlist (bait in `collab-electron/...` works).  
- **Clause 2 fails when** something outside `qf-kernel-schema/` reads `golden/tools.json` (baited read works *if* detection is defined).  
**Load-bearing hole:** the new gate file under `qa/` is not on the allowlist. A straightforward implementation that literals the needles `observe_ticket` / `golden/tools.json` is red against itself forever, or the builder dodges with string-splitting / excluding `qa/` without the order saying so — two different “passes.”  
**Clause 2 coverage claim is overstated:** serving via `generateMcp(schema)` (or any copy not named `golden/tools.json`) opens the door without tripping clause 2; clause 1 may stay green too. The order admits the gate doesn’t block serving — but it also says clause 2 “is the one that catches WO-104,” which is only true for one WO-104 shape.

**G3 — yes, and it is the real force on D3.** After deletions, `docs/ONTOLOGY_SCHEMA.md` still lists the six → `onlyDoc` non-empty → red. Green requires the Actions list to match code again (or equivalent). That is falsifiable.  
**Catch:** D3(a) as written (demote + banner) does **not** make this green. See findings.

**G4 — counts can match a wrong implementation.**  
| Count | Can a wrong impl hit it? |
|---|---|
| actions 31→25 | Yes: delete five dead + one wired (and its commands), and wire one remaining dead → still 25, G1 green, wrong surface. |
| tools 77→71 | Yes: follows any six deleted actions once `generate` runs; does not prove *which* six. |
| gates 13→14 | Yes: add any always-true gate (name `observe-door` or not). Emptiness is only caught if G2 bait is real. |

Mechanism prose is required and helps a human verifier; the numeric gate alone is weak. Not “unfalsifiable,” but easy to satisfy without the intended change.

**G5 — yes.** Cold `bun qa/run.ts --all` fails on install/test/gate regressions; exit-code rule is sound. Not satisfiable by construction.

---

## QUESTION 2 — Does each deliverable have exactly one meaning?

**D1 — one meaning.** Delete those six; deltas 31→25 / 77→71. Clear.

**D2 — underspecified (author was right).** (a) vs (b) is an intentional fork, but scope is not: option text describes schema surgery (“strip … or move out” / “goes”), while “the sentence is the deliverable; the diff is downstream” plus declared deps (“no object type … changes … If you believe one does, stop”) imply ruling-only. Builder A ships a sentence; builder B deletes `connection` and regenerates goldens; both can claim D2. That is two jobs.

**D3 — two meanings; (a) incomplete vs G3.** (a) demote/banner vs (b) regenerate-and-gate are fine as a choice, but (a) never says to sync the Actions paragraph that `doc-action-surface` actually reads. Order text claims D3 clears that gate. Demote-only → G3 still red; demote+edit Actions → green. Both can call it “(a) done.”

**D4 — mostly one meaning; detection left open.** “Add `observe-door` with these two clauses” is clear; how to detect “runtime read,” what “documentation paths” are, and whether `qa/**` may contain the needles are not. That is where G2’s self-trip lives.

**D5 — mostly one meaning; “no machinery” is sharp enough for code, soft for docs.** (a) SCOPES contract (objective · depends · in · out · gate) + ROADMAP line; (b) one SCOPES paragraph, no allowlist edit. Two builders will write different contracts, but not different *kinds* of work. Borderline: how much of the already-pasted WO-103b note in SCOPES counts as “recorded.” Not load-bearing if the five fields are present.

---

## Findings (by severity)

### High — load-bearing

1. **D3(a) does not restore `doc-action-surface`, but G3 / deps say D3 does.**  
   *Wrong:* (a) = demote + banner only. Gate still diffs `## Actions` in `docs/ONTOLOGY_SCHEMA.md` to `schema.actions`.  
   *Why:* Builder can “finish” (a), leave G3 red, or silently edit the Actions line without the order requiring it — correlated false confidence either way.  
   *Fix:* Under (a), require removing/syncing the six names in `## Actions` (minimum), or point the gate at the demoted doc’s replacement surface without weakening equality. State that demotion alone is insufficient for G3.

2. **G2 clause 1 allowlist omits the gate that must name the needles.**  
   *Wrong:* Allowlist is schema/kernel/golden only; `qa/gates/observe-door.ts` (and likely `qa/run.ts`) will contain `observe_ticket` / `tools.json`.  
   *Why:* Gate is red-by-construction, or builders invent exclusions/obfuscation the order never ratified — false pass or stuck order.  
   *Fix:* Put the gate path(s) on the allowlist, or require needles built without a repo-wide literal match on the gate file, explicitly.

3. **D2 scope contradicts declared dependencies.**  
   *Wrong:* Options describe object-schema changes; deps say no object-type/transition-table changes and to stop if one appears; “sentence is the deliverable.”  
   *Why:* Two competent builds (ruling-only vs schema diff), both “honest.” Implementing (b) also rewrites `connection` / `migration.sql` / `kernel.db` shape — the stop clause fires.  
   *Fix:* One line: “This order records the ruling only; no `connection` schema diff.” Or: “Implement the chosen option; the kernel.db note applies only to D1.”

### Medium — load-bearing

4. **G4 action/tool counts do not pin the six named deletions.**  
   *Wrong:* 25/71 is a cardinality check.  
   *Why:* Pathological reshuffles (drop a wired verb, revive a dead one) still hit the numbers with G1 green.  
   *Fix:* Assert the deleted name set (or “actions ≡ command actions”) in G1/G4, not only `length`.

5. **G2 clause 2’s “catches WO-104” claim is implementation-shaped.**  
   *Wrong:* Only catches readers of `golden/tools.json`, not all serving paths.  
   *Why:* Order oversells the alarm; WO-104 via generator API sails through. Limit paragraph helps, but the mechanism sentence should match.  
   *Fix:* Narrow the claim to “catches serving-by-reading-this-file,” or also forbid runtime `generateMcp` / tool-plane bootstrap outside an allowlist.

### Low — cosmetic

6. **Unwritable-link cause list understates `lists` / `offered_on`.**  
   `lists` also lacks creatable `venue`; `offered_on` also lacks creatable `market_event`. Counts right; blockers incomplete. Fix the cause column.

7. **`approve`/`deny` “same” as `request_approval`’s `subject_ref`.**  
   They take `request_id`. Reason (no approval type) still holds. Tighten the table.

---

**Nothing High found on G1’s bait design, G3’s red→green *mechanism*, G5, D1, or D5’s “build no machinery” code line** — those are sound once the D3(a)/G3 and G2 allowlist holes above are fixed.

**Nominated “the one the author asked you to find”:** #1 (D3(a) vs G3) and #3 (D2 ruling vs diff) are the order-text defects most likely to birth a false pass or a split build; #2 is the gate that fails its own definition.
