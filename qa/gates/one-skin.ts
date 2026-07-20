/**
 * WO-006d / WO-007 debts #15/#16: every window wears qf-tokens — no raw hex,
 * rgb()/rgba()/hsl()/hsla(), or font-family outside shared/qf-tokens.css.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const REPO = join(import.meta.dir, "../..");
const WINDOWS = join(REPO, "collab-electron/src/windows");
const TOKENS = "collab-electron/src/windows/shared/qf-tokens.css";

/** WO-007: gate surface includes .js (canvas palette) as well as CSS/TS. */
const CODE_EXT = new Set([".css", ".tsx", ".ts", ".js"]);

/**
 * Vendor/generated under windows/ — each entry justified.
 * Flow-cube is the only allowlist: founder brand engine; spectrum is token source.
 */
const ALLOWLIST = new Set<string>([
  // Founder-authored brand engine — spectrum constants are the token source, not a divergence.
  "collab-electron/src/windows/shared/flow-cube/cube3d.js",
  // Founder-authored empty-state wrapper — palette/ink constants belong to the brand engine.
  "collab-electron/src/windows/shared/flow-cube/flow-cube-watermark.js",
]);

const HEX_RE = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
/** Functional color syntax that must live only in qf-tokens.css. */
const FUNC_COLOR_RE = /\b(?:rgba?|hsla?)\(/gi;
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
  funcCount: number;
  fontCount: number;
} {
  const files: string[] = [];
  walk(WINDOWS, files);
  const offenders: string[] = [];
  let hexCount = 0;
  let funcCount = 0;
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
    const funcMatches = text.match(FUNC_COLOR_RE) ?? [];
    const fontBad = badFontDecls(text);
    hexCount += hexMatches.length;
    funcCount += funcMatches.length;
    fontCount += fontBad.length;
    if (hexMatches.length > 0) {
      offenders.push(`${rel} (hex×${hexMatches.length}: ${hexMatches.slice(0, 3).join(", ")})`);
    }
    if (funcMatches.length > 0) {
      offenders.push(
        `${rel} (func-color×${funcMatches.length}: ${funcMatches.slice(0, 3).join(", ")})`,
      );
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
    console.error(
      `totals: hex=${hexCount} func-color=${funcCount} raw-font-family=${fontCount}`,
    );
  } else {
    console.log("one-skin OK");
    console.log(
      `totals: hex=0 func-color=0 raw-font-family=0 (outside ${TOKENS})`,
    );
  }
  return { ok: offenders.length === 0, offenders, hexCount, funcCount, fontCount };
}

if (import.meta.main) {
  const { ok } = checkOneSkin();
  process.exit(ok ? 0 : 1);
}
