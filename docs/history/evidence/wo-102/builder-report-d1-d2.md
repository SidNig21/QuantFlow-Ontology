I replaced the market schema vocabulary with neutral terms and added a sportsbook home, so slips can be represented in the language you use without touching runtime app code.

1. **Rename map implemented (with link delta/count)**
- **Object types**
  - `event` -> `market_event`
  - `market` -> `instrument`
  - `odds_series` -> `quote`
  - added new `venue`
  - kept `competitor`, `result`
- **Links in market plane**
  - `participates_in`: `competitor -> event` -> `competitor -> market_event`
  - `offered_on`: `market -> event` -> `instrument -> market_event`
  - `quotes`: `odds_series -> market` -> `quote -> instrument`
  - `settles`: `result -> event` -> `result -> market_event`
  - added `lists`: `venue -> instrument`
- **Dependent edge update outside market.ts**
  - `has_leg`: `ticket -> market` -> `ticket -> instrument` in `qf-kernel-schema/src/ontology/research.ts`
- **Counts**
  - Market-plane links: **4 -> 5** (`+1`, from `lists`)
  - Total schema links (baseline 13): **13 -> 14**
  - Total schema objects (baseline 22): **22 -> 23**

2. **`competitor` / `result` retention argument (one paragraph)**
`competitor` and `result` were retained because both model real, non-optional facts in the founder’s slip shape: who participated and what settled truth was. Removing `competitor` would collapse participant identity into instrument text, which would break cross-slip reconciliation and duplicate identities for the same person/team. Removing `result` would collapse settlement truth into ticket-local grading, which loses reusable event-level truth and weakens auditable lineage from occurrence -> outcome -> ticket grade. Keeping both preserves canonical identities and settlement facts without introducing sport-specific type clones.

3. **Decision on domain-event name strings (`commands.ts`)**
I changed the three domain event name strings from `event.*` to `market_event.*`:
- `event.started` -> `market_event.started`
- `event.settled` -> `market_event.settled`
- `event.voided` -> `market_event.voided`

Reasoning: these strings are the domain-event type identity for the transition edge, and keeping them on `event.*` after the type moved to `market_event` would leave the transition catalog semantically split. Since your pre-flight measurement says Kernel/collab do not hardcode those strings, renaming keeps edge semantics aligned with the new type without requiring out-of-scope runtime edits.

4. **G2 — exact grep command + full unedited output**
Command:
```bash
cd "/home/sidnig21/qf-worktrees/wo-102/qf-kernel-schema" && bun -e 'import { schema } from "./src/schema.ts"; for (const object of schema.objects) console.log(object.name);' | rg --json '^(event|market|odds_series)$'
```

Full unedited output:
```text
{"data":{"elapsed_total":{"human":"0.053785s","nanos":53785078,"secs":0},"stats":{"bytes_printed":0,"bytes_searched":224,"elapsed":{"human":"0.053265s","nanos":53265217,"secs":0},"matched_lines":0,"matches":0,"searches":1,"searches_with_match":0}},"type":"summary"}
```

5. **G4 — fresh-database transcript (command + output)**
(`sqlite3` CLI is unavailable here, so I executed the same migration/open check with Bun’s SQLite driver.)

Command:
```bash
cd "/home/sidnig21/qf-worktrees/wo-102" && bun -e 'import { Database } from "bun:sqlite"; import { readFileSync, mkdtempSync } from "node:fs"; import { tmpdir } from "node:os"; import { join } from "node:path"; const dir = mkdtempSync(join(tmpdir(), "wo-102-g4-")); const dbPath = join(dir, "kernel.db"); const migration = readFileSync("qf-kernel-schema/golden/migration.sql", "utf8"); const db = new Database(dbPath); db.exec(migration); const integrity = db.query("PRAGMA integrity_check;").get(); const tables = db.query("SELECT count(*) AS count FROM sqlite_master WHERE type = ?").get("table"); console.log(`integrity_check=${integrity.integrity_check}`); console.log(`table_count=${tables.count}`); console.log(`kernel_db=${dbPath}`); db.close();'
```

Output:
```text
integrity_check=ok
table_count=25
kernel_db=/tmp/wo-102-g4-H7FoOD/kernel.db
```

6. **Conformance count before -> after, with mechanism**
- Before (your measured baseline): **118**
- After (measured): **118** via:
  - `cd "/home/sidnig21/qf-worktrees/wo-102/qf-kernel-schema" && rg -n "^  test\(" golden/conformance.test.ts | wc -l`
  - output: `118`

Mechanism: conformance tests are generated from transition tables, not from object count alone. This pass renamed transition type key `event -> market_event` but preserved the same state enum and legal edges (`scheduled -> live|void`, `live -> settled`), so legal/illegal transition matrix cardinality is unchanged. New `venue` is stateless (no transition table), so it contributes zero conformance tests. Result: count stays 118.

7. **Confirmation `packages/qf-kernel` and `collab-electron` untouched**
`git status --short` shows only `qf-kernel-schema` files changed:

```text
 M qf-kernel-schema/golden/ONTOLOGY.md
 M qf-kernel-schema/golden/conformance.test.ts
 M qf-kernel-schema/golden/migration.sql
 M qf-kernel-schema/golden/tools.json
 M qf-kernel-schema/src/commands.ts
 M qf-kernel-schema/src/ontology/market.ts
 M qf-kernel-schema/src/ontology/research.ts
 M qf-kernel-schema/src/schema.ts
 M qf-kernel-schema/src/transitions.ts
```

8. **Judgment exercised where order was silent**
- **Domain-event string value policy:** chose to rename `event.*` -> `market_event.*` for semantic alignment with renamed stateful type.
- **Action surface scope:** kept action names as `start_event` / `settle_event` / `void_event` (did not rename action IDs) to stay inside Deliverables 1–2 and avoid broad action-surface churn.
- **Action input field key:** kept `event_id` key unchanged (description still points at event semantics) to avoid introducing payload-shape drift in this pass.
- **New `venue` shape:** added `kind` (`sportsbook|exchange`) + `name` as minimal identity schema for Bovada/home-of-listing while keeping scope limited.
- **Research-plane dependency:** updated `has_leg` endpoint to `instrument` to keep graph consistency with the market rename.
- **G4 execution method:** used Bun SQLite API when `sqlite3` CLI was unavailable; same migration-open invariant tested.

9. **Broken things found but not fixed**
- Environment lacks `sqlite3` CLI (`Command 'sqlite3' not found`), so I used Bun SQLite for G4 evidence.
- `docs/ONTOLOGY_SCHEMA.md` still describes pre-rename market-plane type names (`event/market/odds_series`); not changed in this run to stay inside your Deliverables 1–2 scope and avoid extra non-gated doc edits.

Additional requested verify commands were run:
- `cd "/home/sidnig21/qf-worktrees/wo-102/qf-kernel-schema" && bun test` -> 143 pass / 0 fail
- `cd "/home/sidnig21/qf-worktrees/wo-102/qf-kernel-schema" && bun run generate && bun test` -> generate wrote all 4 golden files, then 143 pass / 0 fail
- `cd "/home/sidnig21/qf-worktrees/wo-102" && bun qa/run.ts --list` -> printed full gate list (including `doc-action-surface`)

No commit was made.G4 background task result: the first run failed (SQL syntax error in the ad-hoc verification query), so I immediately reran the fresh-db check with the corrected query.

Follow-up completed:
- Fresh `kernel.db` creation from regenerated migration succeeded
- `PRAGMA integrity_check` returned `ok`
- Table count was `25`

No further follow-up is needed for G4.
