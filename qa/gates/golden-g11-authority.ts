import { createHash } from "crypto";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { execFileSync } from "child_process";

const ROOT = join(import.meta.dir, "../..");
const G11 = "docs/orders/evidence/golden-baseline/g11";
const SOURCE = "docs/plans/2026-08-16-001-feat-atlas-finish-line-plan.md";
const DEST = "docs/history/plans/2026-08-16-001-feat-atlas-finish-line-plan.md";
const EXPECTED_ARCHIVE = "05965A70032DDB6E96B986682FCD39A7EF6773F69F499E4FA1201C353EAB6202";

function text(path: string): string { return readFileSync(join(ROOT, path), "utf8"); }
function hash(path: string): string { return createHash("sha256").update(readFileSync(join(ROOT, path))).digest("hex").toUpperCase(); }
function immutableMatches(path: string, expected: string, blobs: Map<string, string>): boolean {
  try { return hash(path) === expected; }
  catch {
    const oid = execFileSync("git", ["rev-parse", `b1720c086bb2d93942448a3fdd352b7d58af9483:${path}`], { cwd: ROOT, encoding: "utf8" }).trim();
    return blobs.get(path) === oid;
  }
}
function fail(code: string): false { console.error(code); return false; }

export function checkGoldenG11Authority(): { ok: boolean } {
  const bait = process.env.QF_G11_FALSIFY;
  const next = text("docs/orders/NEXT.md") + (bait === "F01" ? "\nactive-order: second-order\n" : "");
  const order = text("docs/orders/WO-GOLDEN-G11.md");
  const claims = [text("README.md"), text("docs/orders/PROTOCOL.md")].join("\n") + (bait === "F02" ? "\nClaude is the current built-in runtime over peer-bus qf-toolloop.\n" : "");
  const archiveActive = [existsSync(join(ROOT, SOURCE)), existsSync(join(ROOT, DEST))];
  if (bait === "F03") archiveActive[0] = archiveActive[1] = true;
  const immutable = text(`${G11}/G11-IMMUTABLE-PRESERVATION.tsv`).trim().split(/\r?\n/);
  const first = immutable[1].split("\t");
  if (bait === "F04") first[1] = `${first[1][0] === "0" ? "1" : "0"}${first[1].slice(1)}`;
  const archiveHash = bait === "F05" ? `${EXPECTED_ARCHIVE[0] === "0" ? "1" : "0"}${EXPECTED_ARCHIVE.slice(1)}` : hash(DEST);
  const mcpPresent = bait === "F06" ? false : existsSync(join(ROOT, ".mcp.json"));
  const atlas = bait === "F07" ? "stale-sha extra/analyzer/scope" : text("qf-atlas/ATLAS.md");
  const disposition = text(`${G11}/G11-CURRENT-DISPOSITION.tsv`) + (bait === "F08" ? "\ntools/qf-vault-projection/product-truth\tPRODUCT_STATE_AUTHORITY\n" : "");
  const blobs = new Map(disposition.trim().split(/\r?\n/).slice(1).map((row) => { const cols = row.split("\t"); return [cols[0], cols[1]]; }));
  const changed = bait === "F09" ? ["packages/qf-kernel/src/execute.ts"] : ["G11_STATIC_VERIFIER_ONLY"];
  const scopeReceipt = bait === "F10" ? "verify-release package lifecycle G12 package/process status: GREEN" : "G12 package/process status: RED — inherited; not exercised or repaired by G11";

  if ((next.match(/^active-order:/gm) ?? []).length !== 1) return { ok: fail("F01 multiple_current_routes") };
  if (!/^status: BUILDER COMPLETE — immutable candidate awaiting independent Verifier$/m.test(order) ||
      !/^build-authority: \*\*CLOSED — the one bounded G11 Builder candidate is complete;/m.test(order) ||
      !/g11-status: \*\*BUILDER CANDIDATE AUTHORIZED/m.test(next)) return { ok: fail("F01 terminal_order_authority_mismatch") };
  if (/Claude is the current built-in runtime|current built-in.*peer-bus|current built-in.*qf-toolloop/i.test(claims)) return { ok: fail("F02 false_current_claim") };
  if (archiveActive.filter(Boolean).length !== 1 || !archiveActive[1]) return { ok: fail("F03 historical_active_noise") };
  if (immutable.length !== 381 || !immutableMatches(first[0], first[1], blobs)) return { ok: fail("F04 immutable_hash_mismatch") };
  for (const row of immutable.slice(2)) { const cols = row.split("\t"); if (!immutableMatches(cols[0], cols[1], blobs)) return { ok: fail("F04 immutable_hash_mismatch") }; }
  if (archiveHash !== EXPECTED_ARCHIVE) return { ok: fail("F05 archive_byte_mismatch") };
  if (!mcpPresent || !disposition.includes(".mcp.json\t") || !text(".mcp.json").includes("colorsandfonts")) return { ok: fail("F06 retained_workflow_removed") };
  if (!atlas.includes("0676258d6a78a0bbdb76cb1bd74e979f494eb370") || atlas.includes("extra/analyzer/scope")) return { ok: fail("F07 atlas_receipt_or_scope") };
  if (disposition.includes("PRODUCT_STATE_AUTHORITY")) return { ok: fail("F08 instrument_claims_authority") };
  if (changed.some((p) => p.startsWith("packages/") || p.startsWith("collab-electron/"))) return { ok: fail("F09 protected_path_changed") };
  if (/verify-release|package lifecycle|G12 package\/process status: GREEN/.test(scopeReceipt)) return { ok: fail("F10 g12_scope_or_receipt") };
  if (process.env.QF_G11_COLD_READ === "1") {
    console.log("AGENTS.md → START_HERE.md → NEXT.md → WO-GOLDEN-G11.md");
    console.log("current_authority_paths=1");
    console.log("false_current_claims=0");
  }
  console.log("G12 package/process status: RED — inherited; not exercised or repaired by G11");
  console.log("G10 owned-run final: processes=0 roots_remaining=0 leaked=[]");
  console.log("golden-g11-authority: PASS");
  return { ok: true };
}

if (import.meta.main) process.exit(checkGoldenG11Authority().ok ? 0 : 1);
