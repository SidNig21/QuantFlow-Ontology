/**
 * doc-links — a pointer in a live document must resolve.
 *
 * The repository's recurring failure is a document that names another document
 * which has moved, been archived, or never existed. A stale pointer reads
 * exactly like a live one, and the reader who follows it is misled with no
 * signal. Three gates crashed on 2026-08-03 for this exact reason, and a stale
 * doctrine PDF survived the restructure that was supposed to remove it.
 *
 * G1 Every relative markdown link in a live doc resolves to a tracked path.
 * G2 A live doc may not point into docs/history/ as if it were current, unless
 *    the sentence marks it as superseded (archived / superseded / history /
 *    retired / was / now / cut out of / cited for its reasoning).
 *
 * Live means: tracked markdown outside docs/history/ and outside evidence
 * directories. Evidence records are dated testimony about a moment; their links
 * are allowed to point at what existed then.
 *
 * Stated limit: this checks that a target exists, never that the sentence
 * describing it is still true. A pointer can resolve and still lie.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFileSync } from "node:fs";
import { join, dirname, normalize, resolve } from "node:path";

const REPO_ROOT = join(import.meta.dir, "../..");

const SUPERSEDED_MARKERS =
  /archiv|supersed|history|retired|was\b|now\b|cut out of|for its reasoning|no longer|predecessor|older|closed\b|resolved\b/i;

export function liveDocs(): string[] {
  return execFileSync("git", ["ls-files", "*.md"], { cwd: REPO_ROOT, encoding: "utf8" })
    .split("\n")
    .map((l) => l.trim())
    .filter(
      (l) =>
        l.length > 0 &&
        !l.startsWith("docs/history/") &&
        !l.includes("/evidence/") &&
        !l.startsWith("node_modules/"),
    );
}

type Link = { target: string; line: number; raw: string };

/** Relative markdown links only. Skips http(s), mailto, anchors, and code spans. */
export function extractLinks(markdown: string): Link[] {
  const out: Link[] = [];
  const lines = markdown.split("\n");
  let inFence = false;
  lines.forEach((text, index) => {
    if (/^\s*```/.test(text)) inFence = !inFence;
    if (inFence) return;
    for (const m of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const raw = m[1]!.trim();
      if (/^(https?:|mailto:|#)/i.test(raw)) continue;
      const target = raw.split("#")[0]!.trim();
      if (target.length === 0) continue;
      out.push({ target, line: index + 1, raw });
    }
  });
  return out;
}

export function checkDocLinks(): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const tracked = new Set(
    execFileSync("git", ["ls-files"], { cwd: REPO_ROOT, encoding: "utf8" })
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0),
  );

  for (const doc of liveDocs()) {
    const text = readFileSync(join(REPO_ROOT, doc), "utf8");
    const lines = text.split("\n");
    for (const link of extractLinks(text)) {
      const absolute = resolve(join(REPO_ROOT, dirname(doc)), link.target);
      const rel = normalize(absolute.slice(REPO_ROOT.length + 1)).replace(/\\/g, "/");
      const isDir = tracked.has(rel) ? false : [...tracked].some((t) => t.startsWith(`${rel}/`));
      if (!tracked.has(rel) && !isDir && !existsSync(absolute)) {
        reasons.push(`${doc}:${link.line} dead link -> ${link.raw}`);
        continue;
      }
      if (rel.startsWith("docs/history/")) {
        // Strip link TARGETS before looking for the marker. The path itself
        // contains "history", so testing the raw line let the URL vouch for
        // itself and G2 could never fire -- verified by bait on 2026-08-04.
        // Only the prose a human reads may satisfy this check.
        const context = (lines[link.line - 1] ?? "").replace(/\]\([^)]+\)/g, "]()");
        if (!SUPERSEDED_MARKERS.test(context)) {
          reasons.push(
            `${doc}:${link.line} points into docs/history/ without marking it superseded -> ${link.raw}`,
          );
        }
      }
    }
  }

  for (const reason of reasons) console.error(`doc-links: ${reason}`);
  if (reasons.length === 0) {
    console.log(`doc-links: PASS (${liveDocs().length} live documents, every pointer resolves)`);
  }
  return { ok: reasons.length === 0, reasons };
}

if (import.meta.main) {
  process.exit(checkDocLinks().ok ? 0 : 1);
}
