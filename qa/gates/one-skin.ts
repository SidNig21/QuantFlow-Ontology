/**
 * WO-006d: every window wears qf-tokens — no raw hex or font-family outside
 * shared/qf-tokens.css.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const REPO = join(import.meta.dir, "../..");
const WINDOWS = join(REPO, "collab-electron/src/windows");
const TOKENS = "collab-electron/src/windows/shared/qf-tokens.css";

/** WO-006d: gate surface is CSS + TS/TSX only (not .js). */
const CODE_EXT = new Set([".css", ".tsx", ".ts"]);

/** Vendor/generated under windows/ — each entry justified. */
const ALLOWLIST = new Set<string>([
  // none yet — add only with a one-line justification per entry
]);

const HEX_RE = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
/** Captures each font-family declaration value (up to ; or newline). */
const FONT_DECL_RE = /font-family\s*:\s*([^;\n}]+)/gi;
/** Allowed faces — must resolve only through qf tokens. */
const FONT_OK = /^var\(\s*--qf-(?:mono|sans)\s*\)$/;

const SKIP_DIRS = new Set(["node_modules", "dist", "out", ".git"]);

function walk(dir: string, out: string[]): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      walk(full, out);
      continue;
    }
    const ext = name.includes(".") ? `.${name.split(".").pop()}` : "";
    if (!CODE_EXT.has(ext)) continue;
    out.push(full);
  }
}

function badFontDecls(text: string): string[] {
  const bad: string[] = [];
  FONT_DECL_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = FONT_DECL_RE.exec(text)) !== null) {
    const value = m[1].trim();
    if (!FONT_OK.test(value)) bad.push(value);
  }
  return bad;
}

export function checkOneSkin(): {
  ok: boolean;
  offenders: string[];
  hexCount: number;
  fontCount: number;
} {
  const files: string[] = [];
  walk(WINDOWS, files);
  const offenders: string[] = [];
  let hexCount = 0;
  let fontCount = 0;

  for (const full of files) {
    const rel = relative(REPO, full).split("\\").join("/");
    if (rel === TOKENS) continue;
    if (ALLOWLIST.has(rel)) continue;
    let text: string;
    try {
      text = readFileSync(full, "utf8");
    } catch {
      continue;
    }
    const hexMatches = text.match(HEX_RE) ?? [];
    const fontBad = badFontDecls(text);
    hexCount += hexMatches.length;
    fontCount += fontBad.length;
    if (hexMatches.length > 0) {
      offenders.push(`${rel} (hex×${hexMatches.length}: ${hexMatches.slice(0, 3).join(", ")})`);
    }
    if (fontBad.length > 0) {
      offenders.push(
        `${rel} (font-family×${fontBad.length}: ${fontBad.slice(0, 2).join("; ")})`,
      );
    }
  }

  if (offenders.length > 0) {
    console.error("one-skin FAIL — raw palette/font outside qf-tokens.css:");
    for (const o of offenders) console.error(`  ${o}`);
    console.error(`totals: hex=${hexCount} raw-font-family=${fontCount}`);
  } else {
    console.log("one-skin OK");
    console.log(`totals: hex=0 raw-font-family=0 (outside ${TOKENS})`);
  }
  return { ok: offenders.length === 0, offenders, hexCount, fontCount };
}

if (import.meta.main) {
  const { ok } = checkOneSkin();
  process.exit(ok ? 0 : 1);
}
