You are the **decorrelated reader** on QuantFlow-Ontology (`/home/sidnig21/QuantFlow-Ontology`, branch `main`, tree clean, 3 commits ahead of `origin/main`). You did not write any of what you are about to read. That is the entire reason you are here — do not defer to it.

**Read first, in this order:** `AGENTS.md` (cold-start briefing, new, unread by anyone but its author) → `START_HERE.md` (wins all conflicts) → `docs/orders/SCOPES.md` (**the thing you are auditing**, ~380 lines, eleven rung scope contracts) → `docs/orders/PROTOCOL.md` (§24 and §51 especially) → `docs/DOCTRINE.md` amendment **A5**. Skim as needed: `docs/ROADMAP.md`, `docs/orders/WO-101.md` (already pre-flighted clean).

**The situation.** An audit on 2026-07-25 measured the Kernel instead of trusting the schema:

```
19 declared object types  ->   3 creatable27 declared actions       ->   9 throw "Unknown command" at execute()13 declared link types    ->   0 writable
```

That killed a work order mid-flight as unbuildable, forced a new rung in (**WO-103, the write path**), and made the ladder eleven orders instead of ten.

**The architect who wrote SCOPES.md has a documented six-instance record of one defect: asserting "X has Y" where X was measured and Y inferred.** A5 names the shape — _declaration is not capability_. SCOPES.md was written immediately after discovering that pattern in itself, and has already had three holes found in it once, by a verifier checking something else. Nobody has looked for the rest. **Trust nothing in SCOPES.md, AGENTS.md, or A5 you have not re-derived — including the numbers above.**

**Task 1 — Re-derive the foundation claims.** Run, don't accept:

```
cd /home/sidnig21/QuantFlow-Ontology/qf-kernel-schemabun -e 'import { schema } from "./src/schema.ts";import { commands, creationCommands } from "./src/commands.ts";import { transitions } from "./src/transitions.ts";const a=schema.actions.map(x=>x.name), c=creationCommands.map(x=>x.action);const t=[...new Set(commands.map(x=>x.action))], w=new Set([...c,...t]);console.log("objects",schema.objects.length,"links",schema.links.length,"actions",a.length);console.log("creatable:",c.join(", "));console.log("dead:",a.filter(x=>!w.has(x)).join(", "));'bun -e 'import { schema } from "./src/schema.ts";for (const l of schema.links) console.log(l.name.padEnd(18), JSON.stringify(l.from), "->", JSON.stringify(l.to));'cd .. && grep -rn "links" --include=*.ts . | grep -v node_modules | grep -viE "schema.links|defineLink|golden/"
```

Any number that disagrees with the docs is a finding, not a rounding error.

**Task 2 — The seam audit.** The question is not "do these exist" but **"are they connected, and does SCOPES.md know which ones aren't."** Trace each to where it actually terminates; give `file:line` or state plainly it isn't made.

1. `schema.ts` → `generateMcp()` → `golden/tools.json` — 65 definitions emitted. **Does any process serve them?** Is any tool name bound to a Kernel read or write?
2. `golden/migration.sql` — does anything execute it, or is it generated and unconsumed?
3. MCP tool call → `execute()` → SQLite — is there a single end-to-end path? Trace or declare absent.
4. `tools/qf-peer-bus` → Kernel — `bus.ts` imports `execute`. Is that the **only** real agent→Kernel path?
5. `collab-electron` → Kernel (Law D IPC seam) — does it still hold, and what does it carry?
6. `tools/runtime-proof`, `tools/examples` — live, or archaeology?
7. `qa/gates/*` — for each of the 12: what does it **actually assert** vs what its name implies? A gate whose name overclaims is this same defect class.

Then the payoff: **does the eleven-rung ladder correctly account for every currently-unconnected seam, or does any rung assume a connection that doesn't exist?** That's what killed the last order, and it's the most valuable thing you can find.

**Task 3 — Audit SCOPES.md rung by rung.** For each: (1) **Buildable?** — does every assumed capability exist by the time that rung starts? (2) **Falsifiable gate?** — can it go red, can a builder run it? (3) **Dependencies honest?** — including needs from two rungs back. (4) **Sequenced right?**

Press hardest on: **WO-103** (carries three rulings bolted on _after_ drafting — market writes, the Golden Hammer contradiction where `pipelineFed` is doctrine vocabulary with **zero occurrences in code**, and a gating edge because `evaluation` is a pure sink; retrofitted scope hides contradictions) · **WO-104–111** (all scoped by an author who had just discovered he'd misread the Kernel) · **WO-110** (the doctrine's proof standard; its gate needs an edge that doesn't exist).

**Task 4 — Does the roadmap make sense as a whole?** Does it actually terminate in WO-111's proof? Are two rungs doing one job, or one doing three? Anything present that shouldn't be, or missing that should? And: `ROADMAP.md` and `SCOPES.md` deliberately disagree on numbering (SCOPES wins numbers, stricter wins gates) — **is that survivable, or a second truth store wearing a hat?** `START_HERE.md` §5.2 forbids exactly that, and the author may have exempted himself without noticing.

**Output:** (1) claims re-derived — claim / your measurement / ✅❌ · (2) seam map — connected at `file:line`, or NOT · (3) rung findings, most severe first, each with what it costs if found later · (4) roadmap-level judgment · (5) verdict on pushing 3 commits to a public main. **Rank by cost of discovering it late** — a rung-3 flaw surfacing at rung 8 beats a wording problem at rung 1.

**Rules:** Don't edit any file without saying what and why first — you're reading, not building. Don't push. Never handle credentials. **Cite or probe** — every claim carries a `file:line`, a command with output, or an explicit "I did not verify this"; that rule is why this audit exists and you are not exempt. **If a rung is clean, say so plainly** — the last verifier withdrew an objection mid-write after measuring it, and that was the most useful thing in its report.