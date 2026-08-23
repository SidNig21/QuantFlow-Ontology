# QuantFlow Atlas — Operating Manual

## Purpose

Atlas helps a human and coding agents answer:

- What is this?
- Who owns it?
- Who uses it?
- What does it use?
- What breaks if I touch it?
- Is its mutation governed?
- Is another system doing the same job?
- Is it actually connected?
- Is it stale?
- Can it be considered for removal?
- What evidence is still missing?
- Did my last change improve or degrade the architecture?

Atlas does **not** automatically authorize product changes or deletion.

Atlas is a **generated projection of code**. It is not Kernel truth and not runtime truth.

---

## Three modes

### 1. Baseline / Archaeology

Understand the repo without modifying it. Read LOOPS, OWNERS, COVERAGE, and MAP for orientation.

### 2. Health / Cleanup

Adjudicate Atlas findings and make bounded repairs. Prefer **one bounded causal cluster** per cleanup cycle (e.g. REVIEW broken + review-publication ownership conflict + `governed-review` write bypass may be one repair, not three unrelated sessions).

### 3. Change control

Before and after normal QuantFlow feature work:

```text
Atlas snapshot
→ identify files / responsibilities / loops this order will touch
→ blast-radius expectation
→ build
→ regenerate → check → ratchet → DIFF
→ prove no accidental second owner / new red / broken loop
```

Long-term, this may be Atlas's highest-value use.

---

## Snapshots — do not confuse tool and map

| Concept | Meaning |
|---------|---------|
| **Atlas tool** | Capability work: CLOSED; independent acceptance: PASS; founder acceptance: recorded in qf-atlas/verification.json; baseline: present; Atlas authorizes diagnosis and blast-radius analysis, not product repair or deletion. |
| **Baseline** | Present in `qf-atlas/baseline.json` |
| **Current map snapshot** | Read `ATLAS.md` header or `atlas.json` meta — this is what you use for the next decision |

After every health pass, the current map may advance (e.g. `health-pass-001 @ abc1234`). **Establish freshness** on every session; never assume an old SHA is still current.

**Tool provenance:** branch `atlas-strip-1`. If `qf-atlas/` is missing on a product branch,
bring the tooling as-is — do not rebuild Atlas from scratch.

**Authority status.** Capability work: CLOSED; independent acceptance: PASS; founder acceptance: recorded in qf-atlas/verification.json; baseline: present; Atlas authorizes diagnosis and blast-radius analysis, not product repair or deletion.

---

## Normal health loop

```text
REFRESH
→ LOOPS
→ choose one causal cluster
→ OWNERS
→ WIRES / COVERAGE as needed
→ inspect blast radius
→ classify
→ founder approval when intent is required
→ repair / remove / keep / quarantine
→ focused gates
→ regenerate
→ check
→ ratchet
→ DIFF
```

### Left-rail tabs

| Tab | Use when |
|-----|----------|
| **LOOPS** | Start here — product-path health (ASK → … → CLOSE) |
| **OWNERS** | Competing responsibility / duplicate implementations |
| **COVERAGE** | Before trusting a strong claim — gray is uncertainty, not clean |
| **DEMOLITION** | Investigation queue only — never delete from static non-reachability alone |
| **DIFF** | After every cleanup batch — before/after scoreboard |
| **WIRES** | IPC path debug — dead/unused/unreached/cheats |
| **MAP** | Spatial orientation — not the starting view |

Everyday controls for most sessions: **LOOPS → OWNERS → DEMOLITION → DIFF**.

---

## Findings and verdicts

Undecided findings are **questions**, not bugs. The goal is **zero unlooked-at findings**, not zero findings total. Record verdicts in `decisions.json` (`keep`, `repair`, `remove`, `accepted`, etc.).

| Signal | Meaning |
|--------|---------|
| **Red** | Investigate / repair confirmed architecture debt |
| **Gray** | Uncertainty or unsupported analysis — not clean |
| **Amber** | Investigate / candidate |
| **Undecided** | Needs adjudication — may require founder intent |

Static non-reachability can mean future architecture or abandoned code. Only the founder resolves intent.

---

## Build authority

Before modifying **product code**, identify the currently authorized work surface (`NEXT.md`, active work order, or founder health-pass authorization).

**Atlas identifies possible work; it does not grant build authority.**

---

## Do not

- Modify Atlas to make a finding disappear
- Interpret gray as green
- Interpret undecided as broken
- Delete something solely because it is unreachable
- Expand a cleanup into a redesign
- Manually edit generated `atlas.json`, `ATLAS.md`, or `atlas.html`
- Redesign or extend Atlas v1 — it is closed

---

## Refresh commands

From the checkout you are analyzing:

```powershell
git status
git branch --show-current
git rev-parse HEAD

bun qf-atlas/generate.mjs
bun qf-atlas/generate.mjs --check
bun qf-atlas/ratchet.mjs
```

Open `qf-atlas/atlas.html` in a browser for the interactive map. Read `qf-atlas/ATLAS.md` before auditing code.

---

## Agent boot template

Before modifying product code, return this block and wait for approval when required:

```text
SOURCE SNAPSHOT
repo:
branch:
HEAD:
tree:
Atlas generated from:
ratchet result:
baseline known debt:

TARGET FINDING
Atlas ID:
classification:
confidence:
blocker:
affected files:
blast radius:
affected north-star loops:
affected IPC:
ownership implications:
what Atlas proves:
what Atlas does NOT prove:

RECOMMENDED VERDICT
KEEP / REPAIR / QUARANTINE / REMOVE / ASK FOUNDER
```

After an approved change:

1. Run the smallest relevant existing QA gates
2. `bun qf-atlas/generate.mjs`
3. `bun qf-atlas/generate.mjs --check`
4. `bun qf-atlas/ratchet.mjs`
5. Inspect Atlas DIFF

Return **BEFORE → AFTER**:

```text
known red debt:
ownership conflicts:
undecided findings:
resolved findings:
new reds:
affected loops:
ratchet:
diff verdict:
```

The goal is not to make Atlas cosmetically green. The goal is to make QuantFlow smaller, clearer, and more canonical without introducing new architectural debt.

---

## Personal operator routine (founder)

1. **Loops** — What part of the product is broken?
2. **Owners** — Why do I have multiple systems doing the same thing?
3. **Demolition** — What old code might I not need? (investigation only)
4. Click a finding → ask the agent to explain it and state what founder input is needed
5. After a change batch → **Diff** — Did we actually improve?

The center 3D map is spatial context. The left tabs are where you drive.
