/**
 * rung-ladder — the ladder cannot go stale.
 *
 * Doc rot in this repository has always had the same shape: two places describe
 * the same state, one gets updated, and a stale entry reads exactly like a
 * current one. This gate removes the possibility for the build ladder.
 *
 * G1 Every rung named in GOLDEN-RUN.md's route tables appears exactly once in
 *    the rung status table, and vice versa.
 * Explicit closed NEXT pointers are checked without treating historical rungs as active.
 * G2 For an open legacy pointer, exactly one rung is `active`.
 * G3 NEXT.md's title names that same rung.
 * G4 Every `complete` rung has a non-empty evidence directory at the path the
 *    status table declares.
 * G5 No rung is `complete` while an earlier rung is not. Close-out before
 *    progress, enforced rather than requested.
 * G6 No second ladder: no other tracked doc defines its own rung table.
 *
 * Stated limit: this is a markdown parser, not a semantic reviewer. It proves
 * the ladder is internally consistent and that evidence files exist. It cannot
 * judge whether the evidence is any good -- that is the verifier's job.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dir, "../..");
const ROUTE = "docs/orders/GOLDEN-RUN.md";
const NEXT = "docs/orders/NEXT.md";

type RungState = "complete" | "active" | "pending";
type StatusRow = { rung: string; state: RungState; evidence: string | null };

/** Rung ids as they appear in the Act tables: | **R0** | ... */
export function routeRungIds(markdown: string): string[] {
  const ids = [...markdown.matchAll(/^\|\s*\*\*(R\d+[ab]?)\*\*\s*\|/gm)].map((m) => m[1]!);
  return [...new Set(ids)];
}

/** Rows of the rung status table: | R0 | complete | `path` | */
export function statusRows(markdown: string): StatusRow[] {
  const start = markdown.indexOf("## Rung status");
  if (start < 0) throw new Error("rung-ladder: '## Rung status' section not found");
  const section = markdown.slice(start, markdown.indexOf("\n### Closing a rung", start));
  const rows: StatusRow[] = [];
  for (const m of section.matchAll(
    /^\|\s*(R\d+[ab]?)\s*\|\s*(complete|active|pending)\s*\|\s*(.+?)\s*\|/gm,
  )) {
    const raw = m[3]!.trim();
    rows.push({
      rung: m[1]!,
      state: m[2]! as RungState,
      evidence: raw === "—" || raw === "-" ? null : raw.replace(/`/g, ""),
    });
  }
  return rows;
}

/** The rung NEXT.md declares active, from its title line. */
export function nextActiveRung(markdown: string): string | null {
  const m = markdown.match(/^#\s*NEXT\s*—\s*(R\d+[ab]?)\b/m);
  return m ? m[1]! : null;
}

function rungOrder(id: string): number {
  const m = id.match(/^R(\d+)([ab]?)$/)!;
  return Number(m[1]) * 10 + (m[2] === "b" ? 1 : 0);
}

/** A closed pointer authorizes no work, regardless of historical rung tables. */
export function closedPointerReasons(markdown: string): string[] | null {
  const fields = (name: string) => [...markdown.matchAll(new RegExp("^" + name + ": *(.+)$", "gm"))].map((match) => match[1]!.trim());
  const status = fields("status");
  const order = fields("active-order");
  if (!status.includes("CLOSED") && !order.includes("none")) return null;
  const reasons: string[] = [];
  for (const [name, expected] of [["status", "CLOSED"], ["active-order", "none"], ["builder-authority", "CLOSED"], ["router-authority", "CLOSED"]]) {
    const values = fields(name!);
    if (values.length !== 1 || values[0] !== expected) reasons.push("closed NEXT requires exactly one " + name + ": " + expected);
  }
  if (!markdown.startsWith("# NEXT — CLOSED\n")) reasons.push("closed NEXT title must be '# NEXT — CLOSED'");
  return reasons;
}

export function checkRungLadder(): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const next = readFileSync(join(REPO_ROOT, NEXT), "utf8");
  const closed = closedPointerReasons(next);
  if (closed !== null) {
    for (const reason of closed) console.error(`rung-ladder: ${reason}`);
    if (closed.length === 0) console.log("rung-ladder: PASS (authority closed; no active order; historical ladder not activated)");
    return { ok: closed.length === 0, reasons: closed };
  }
  const route = readFileSync(join(REPO_ROOT, ROUTE), "utf8");

  const routeIds = routeRungIds(route);
  const rows = statusRows(route);
  const statusIds = rows.map((r) => r.rung);

  if (routeIds.length === 0) reasons.push("no rungs found in the route tables");
  if (rows.length === 0) reasons.push("rung status table is empty");

  // G1
  for (const id of routeIds) {
    if (!statusIds.includes(id)) reasons.push(`${id} is in the route but not the status table`);
  }
  for (const id of statusIds) {
    if (!routeIds.includes(id)) reasons.push(`${id} is in the status table but not the route`);
  }
  const dupes = statusIds.filter((id, i) => statusIds.indexOf(id) !== i);
  for (const d of new Set(dupes)) reasons.push(`${d} appears more than once in the status table`);

  // G2
  const active = rows.filter((r) => r.state === "active");
  if (active.length !== 1) {
    reasons.push(`exactly one rung must be active; found ${active.length}`);
  }

  // G3
  const declared = nextActiveRung(next);
  if (!declared) {
    reasons.push("NEXT.md title does not name a rung (expected '# NEXT — R<n> …')");
  } else if (active.length === 1 && declared !== active[0]!.rung) {
    reasons.push(`NEXT.md names ${declared} but the status table marks ${active[0]!.rung} active`);
  }

  // G4
  for (const row of rows.filter((r) => r.state === "complete")) {
    if (!row.evidence) {
      reasons.push(`${row.rung} is complete but names no evidence directory`);
      continue;
    }
    const dir = join(REPO_ROOT, row.evidence);
    if (!existsSync(dir) || !statSync(dir).isDirectory()) {
      reasons.push(`${row.rung} evidence directory missing: ${row.evidence}`);
    } else if (readdirSync(dir).length === 0) {
      reasons.push(`${row.rung} evidence directory is empty: ${row.evidence}`);
    }
  }

  // G5
  const sorted = [...rows].sort((a, b) => rungOrder(a.rung) - rungOrder(b.rung));
  let seenUnfinished: string | null = null;
  for (const row of sorted) {
    if (row.state !== "complete" && !seenUnfinished) seenUnfinished = row.rung;
    if (row.state === "complete" && seenUnfinished) {
      reasons.push(`${row.rung} is complete while ${seenUnfinished} is not — close rungs in order`);
    }
  }

  // G6
  for (const rel of secondLadderCandidates()) {
    const text = readFileSync(join(REPO_ROOT, rel), "utf8");
    const rungRows = [...text.matchAll(/^\|\s*\*?\*?(R\d+[ab]?)\*?\*?\s*\|.*\|.*\|/gm)];
    if (rungRows.length >= 3) {
      reasons.push(`${rel} defines its own rung table — the ladder lives only in ${ROUTE}`);
    }
    if (/^\|\s*\*?\*?L\d/m.test(text)) {
      reasons.push(`${rel} still carries a retired L-numbered ladder`);
    }
  }

  for (const reason of reasons) console.error(`rung-ladder: ${reason}`);
  if (reasons.length === 0) {
    console.log(
      `rung-ladder: PASS (${rows.length} rungs; active=${active[0]?.rung}; complete=${rows.filter((r) => r.state === "complete").length})`,
    );
  }
  return { ok: reasons.length === 0, reasons };
}

/** Authority docs that must not grow a competing ladder. Never the route itself. */
function secondLadderCandidates(): string[] {
  const out = ["START_HERE.md", "AGENTS.md", "README.md", "docs/DOCTRINE.md", NEXT];
  return out.filter((rel) => existsSync(join(REPO_ROOT, rel)));
}

if (import.meta.main) {
  process.exit(checkRungLadder().ok ? 0 : 1);
}
