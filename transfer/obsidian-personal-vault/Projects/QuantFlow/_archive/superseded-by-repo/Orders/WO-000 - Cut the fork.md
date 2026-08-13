---
tags: [quantflow, work-order]
status: open
assignee: fable (+ founder for GitHub repo creation)
created: 2026-07-17
---

# WO-000 — Cut the fork

## Objective
Create the new QuantFlow repository from a fresh clone of upstream Collaborator, with the foundation disciplines installed before any feature code exists.

## Context pack
- [[QuantFlow Rebuild Blueprint]] (becomes the repo's `START_HERE.md`)
- Upstream: `https://github.com/collaborator-ai/collab-public` (license: FSL-1.1-ALv2 — free to build on; conversion to Apache-2.0 two years per release; avoid marketing QuantFlow as a general-purpose Collaborator substitute)

## Deliverables
1. Fresh clone of upstream `main`; survey what changed vs the March-era base the old QuantFlow knew (new upstream improvements = free wins; note surprises).
2. New repo (founder names it; suggestion: `quantflow-console`) with upstream history preserved as the base.
3. Foundation kit, commit one: `START_HERE.md` (adapted blueprint) · `DOC_AUTHORITY_MAP.md` (three-line seed) · `.gitattributes` (LF) · lockfiles committed · `qa/` skeleton with gate runner · GitHub Actions running install + test on push.
4. Strip pass: remove upstream marketing/site assets not needed for the shell; keep canvas, tiles, terminals, PTY intact. Deletion list recorded in the commit message.
5. `docs/orders/` directory — work orders graduate from the vault into the repo from WO-002 on.

## Contract
- No feature code. No schema code (that's WO-001's package, dropped in later).
- Old QuantFlow repo is untouched (parts shop, read-only).
- Founder performs the GitHub repo creation + first push (or authenticates `gh` for Fable to do it — founder's choice).

## Acceptance gates
- Fresh `git clone` → install → test runs green **in CI** on the first push.
- `START_HERE.md` present; a new agent session given only the repo can state the mission and the current work order without any chat context.

## Out of scope
Kernel schema, MCP, canvas changes, visual work, data ingestion.

## Report back
Commit list + deletion list + upstream-drift notes appended to this file.

---

## REPORT — done (2026-07-17, fable)

**Repo:** `~/QuantFlow-Ontology` · origin `SidNig21/QuantFlow-Ontology` (founder renames on GitHub) · upstream remote configured · `main` tracks upstream pristine at v0.8.3 (476b8ef) · work lives on `quantflow`.

**Commits:** `c0e7ddd` strip (screenshot 1.8MB, CLA machinery, CONTRIBUTING; kept LICENSE+NOTICE) · `8ef255b` build fix + lockfile · `ba9da39` foundation kit.

**Upstream drift absorbed (April→June, 20 commits):** all QoL free wins — tile fullscreen modes, terminal caret motion, viewer fixes, packaging fix. Nothing structural.

**Two upstream bugs found and fixed:**
1. **Fresh-install build breakage** — `@assistant-ui/core@0.1.17` vs `store@0.2.19` (`tapClientLookup` missing). Same bug that hit the old repo; upstream never sees it because they gitignore bun.lock. Fixed via override to `store@0.2.20`; full build green. *PR-able upstream.*
2. **`mock.module()` leakage** — bun module mocks leak across test files sharing a process; upstream's suite only passes in lucky orderings. `test-unit.sh` isolates the three mock-using files; 256 tests green, split documented (node-only sidecar + Electron/DOM tests reserved for a future integration lane).

**Gates:** `bun qa/run.ts --all` PASS · `./scripts/test-unit.sh` exit 0 · `bun run build` green. CI enforces all three on push.

**Founder actions to finish:** rename GitHub repo to `QuantFlow-Ontology` → push `quantflow` + `main` → set `quantflow` as default branch.

**CI addendum:** two post-push fixes — `cfa4750` (branch filter case: `quantflow`→`QuantFlow`) and `3d06d68` (upstream's blanket `docs/` gitignore silently excluded `docs/orders/`; caught by the repo-shape gate failing in CI while passing locally — the gate doing its job on day one). **CI run on 3d06d68: SUCCESS.** All acceptance gates met. WO-000 closed.
