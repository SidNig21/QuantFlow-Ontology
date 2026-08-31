import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";

const ROOT = join(import.meta.dir, "../..");
const SEED = "746d29a0";
const HISTORICAL_G11 = "1f81c469371fbb4db3e4e8bdac1248f0a0d3d51c";
const PHASE3_GATE = "golden-phase3-requalification";
const ELECTRON_SDK_ROW = "collab-electron/package.json\tdependencies\t@agentclientprotocol/sdk\t0.18.2";
const CURRENT_DEPENDENCIES_SHA256 = "3AD64D1EE994131B963B5574C3B9529D26BC6D3FEFCD747241DA350F4B56F172";
const CLASSIFICATION = "docs/orders/evidence/golden-baseline/phase3/PHASE3-GATE-CLASSIFICATION.tsv";
const TRAVERSAL = "docs/orders/evidence/golden-baseline/phase3/PHASE3-WINDOWS-TRAVERSAL.tsv";
const EXPECTED_SEEDS: Record<string, { count: number; sha256: string }> = {
  "tracked-files": { count: 1440, sha256: "7A4DCF576D0B7C586FFAEF31AE41A24734A5028604DD8E9155309FDD535E088A" },
  "package-manifests": { count: 20, sha256: "CCC2519B5EF183600C20C14075D8A7FD504E64498DC251875C6E1D0DF440790C" },
  "direct-dependencies": { count: 103, sha256: "826BCBA2CABA315DD64E890D2EAB7220DDB3D508FCCF00A948FE9E83E37C3717" },
  "package-hooks": { count: 6, sha256: "0056654FA5A0E567C41EE3E2C556861237FDB15EBA10CB748F462E9E2CB883CD" },
  "package-lock-roots": { count: 15, sha256: "E2A0E8183C8D9B40EB1D46DADDE2E88C25FA280517D7ED265FCB9A78057A96CF" },
  "packaged-generated-resources": { count: 72, sha256: "A65D956315B4372FC36256E864DC65941E67760F10A2765756B69E0E81B219EA" },
  tests: { count: 122, sha256: "82AD9C295F37F74E1C9B1A2D3476BA3CFA811C21A85CAA3CC6C8CC8FA5936AAB" },
  gates: { count: 72, sha256: "DDB965029DBF1F2A93466B5DA5B0D08D5A4F4BFC9A678D19EB29D5DA2BA70AA3" },
  claims: { count: 2136, sha256: "24C8F30E5C0BC1F4EA8C7DFB3C9F19E41605E1393044726C394540F0F7A6C812" },
};

type Ledgers = Record<string, string[]>;
type Bait =
  | "delete-ledger-row"
  | "duplicate-disposition"
  | "remove-claim-mapping"
  | "fixture-only-claim"
  | "missing-electron-sdk-owner"
  | "unregistered-gate"
  | "wrong-historical-authority";

function git(args: string[]): string {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8", maxBuffer: 128 * 1024 * 1024 })
    .replaceAll("\r\n", "\n");
}

function lines(text: string): string[] {
  return text.replace(/\n$/, "").split("\n").filter(Boolean).sort((a, b) => a.localeCompare(b));
}

function blob(path: string, ref?: string): string {
  return ref ? git(["show", `${ref}:${path}`]) : readFileSync(join(ROOT, path), "utf8").replaceAll("\r\n", "\n");
}

function tracked(ref?: string): string[] {
  return lines(git(ref ? ["-c", "core.quotepath=false", "ls-tree", "-r", "--name-only", ref] : ["-c", "core.quotepath=false", "ls-files"]));
}

function manifests(paths: string[]): string[] {
  return paths.filter((path) => path.split("/").at(-1) === "package.json").sort();
}

function dependencies(paths: string[], ref?: string): string[] {
  const rows: string[] = [];
  for (const path of manifests(paths)) {
    const value = JSON.parse(blob(path, ref)) as Record<string, Record<string, string> | undefined>;
    for (const section of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
      for (const [name, version] of Object.entries(value[section] ?? {})) rows.push(`${path}\t${section}\t${name}\t${version}`);
    }
  }
  return rows.sort();
}

function hooks(ref?: string): string[] {
  const scripts = (JSON.parse(blob("collab-electron/package.json", ref)) as { scripts: Record<string, string> }).scripts;
  return ["build", "package", "package:verify", "package:unsigned", "release", "postinstall"]
    .map((name) => `${name}\t${scripts[name]}`).sort();
}

function grep(ref: string | undefined, pattern: string, paths: string[]): string[] {
  const args = ["grep", "-n", "-E", pattern];
  if (ref) args.push(ref);
  args.push("--", ...paths);
  try { return lines(git(args)); } catch (error) {
    const status = (error as { status?: number }).status;
    if (status === 1) return [];
    throw error;
  }
}

function resources(ref?: string): string[] {
  return grep(ref, "extraResources|extraMetadata|requiredFiles|requiredDirectories|packageResource|copyFile|copyFileSync|cpSync|assertPackagedPath|golden/|atlas\\.(json|html)|ATLAS\\.md", [
    ":(glob)**/package.json", "collab-electron/electron.vite.config.ts", "collab-electron/scripts/package.mjs",
    "collab-electron/scripts/package-lib/**", "qf-kernel-schema/src/**", "qf-atlas/generate.mjs",
  ]);
}

function claims(ref?: string): string[] {
  return grep(ref, "description[[:space:]]*:|textContent[[:space:]]*=|innerText[[:space:]]*=|aria-label|title[[:space:]]*:|assert\\(|status:|mission:|decision:|name:[[:space:]]*\"", [
    "qf-kernel-schema/src/**", "collab-electron/src/windows/**", "collab-electron/scripts/package-lib/**", "qa/run.ts", "qa/gates/**",
    "START_HERE.md", "docs/orders/NEXT.md", "docs/orders/GOLDEN-RUN.md", "docs/adr/0004-repository-golden-baseline.md",
  ]);
}

function gates(ref?: string): string[] {
  const runner = ref ? blob("qa/run.ts", ref) : blob("qa/run.ts");
  const rows: string[] = [];
  const matcher = /name:\s*"([^"]+)"[\s\S]*?description:\s*(?:\n\s*)?"([^"]+)"/g;
  for (const match of runner.matchAll(matcher)) rows.push(`${match[1]}\t${match[2]}`);
  return rows.sort();
}

function buildLedgers(ref?: string): Ledgers {
  const files = tracked(ref);
  const traversal = lines(blob(TRAVERSAL, ref)).filter((row) => !row.startsWith("id\t")).map((row) => row.split("\t")[0]);
  return {
    "tracked-files": files,
    "package-manifests": manifests(files),
    "direct-dependencies": dependencies(files, ref),
    "package-hooks": hooks(ref),
    "package-lock-roots": files.filter((path) => path.split("/").at(-1) === "bun.lock"),
    "packaged-generated-resources": resources(ref),
    tests: files.filter((path) => /\.(?:test|spec)\.(?:ts|tsx|js|mjs|cjs)$/.test(path)),
    gates: gates(ref),
    claims: claims(ref),
    "supported-consumers": traversal,
  };
}

function serialize(rows: string[]): string { return rows.join("\n") + "\n"; }
function sha256(text: string): string { return createHash("sha256").update(text).digest("hex").toUpperCase(); }
function key(ledger: string, row: string): string { return `${ledger}\t${sha256(row).slice(0, 24)}\t${row}`; }

function disposition(ledger: string, row: string): string {
  if (ledger === "tracked-files") {
    if (row.startsWith("docs/orders/evidence/")) return "authority/evidence";
    if (row.startsWith("qa/") || /\.(?:test|spec)\./.test(row)) return "test/proof";
    if (row.startsWith("docs/") || row === "START_HERE.md" || row === "AGENTS.md") return "authority/evidence";
    if (row.endsWith("package.json") || row.endsWith("bun.lock") || row.includes("package")) return "package";
    return "current-production";
  }
  if (["package-manifests", "direct-dependencies", "package-hooks", "package-lock-roots", "packaged-generated-resources"].includes(ledger)) return "package";
  if (ledger === "tests" || ledger === "gates") return "test/proof";
  if (ledger === "claims") return row.startsWith("docs/") || row.startsWith("START_HERE") ? "authority/evidence" : "current-production";
  return "current-production";
}

function validate(seed: Ledgers, current: Ledgers, bait?: Bait): { issues: string[]; dispositions: string[]; maps: string[] } {
  const issues: string[] = [];
  for (const [name, expected] of Object.entries(EXPECTED_SEEDS)) {
    const rows = seed[name];
    if (!rows || rows.length !== expected.count) issues.push(`seed-count ${name} expected=${expected.count} actual=${rows?.length ?? -1}`);
    else if (sha256(serialize(rows)) !== expected.sha256) issues.push(`seed-hash ${name} expected=${expected.sha256} actual=${sha256(serialize(rows))}`);
  }
  const currentDependencies = bait === "missing-electron-sdk-owner"
    ? current["direct-dependencies"].filter((row) => row !== ELECTRON_SDK_ROW)
    : current["direct-dependencies"];
  if (currentDependencies.length !== 104) issues.push(`current dependency total expected=104 actual=${currentDependencies.length}`);
  if (!currentDependencies.includes(ELECTRON_SDK_ROW)) issues.push("Electron direct @agentclientprotocol/sdk owner absent");
  if (bait !== "missing-electron-sdk-owner" && sha256(serialize(currentDependencies)) !== CURRENT_DEPENDENCIES_SHA256) {
    issues.push(`current dependency hash expected=${CURRENT_DEPENDENCIES_SHA256} actual=${sha256(serialize(currentDependencies))}`);
  }
  if (!dependencies(tracked(), undefined).some((row) => row === "species/hermes/package.json\tdependencies\t@agentclientprotocol/sdk\t0.18.2")) {
    issues.push("Hermes compatibility declaration absent");
  }
  const all = Object.entries(current).flatMap(([ledger, rows]) => rows.map((row) => key(ledger, row)));
  if (bait === "delete-ledger-row") all.pop();
  const dispositions = all.map((entry) => {
    const [ledger, , ...rest] = entry.split("\t");
    const row = rest.join("\t");
    return `${entry}\t${disposition(ledger, row)}\tmechanical:${ledger}`;
  });
  if (bait === "duplicate-disposition" && dispositions.length) dispositions.push(dispositions[0]);
  const dispositionKeys = dispositions.map((row) => row.split("\t").slice(0, 3).join("\t"));
  if (new Set(dispositionKeys).size !== dispositionKeys.length) issues.push("duplicate disposition key");
  const expectedKeys = new Set(Object.entries(current).flatMap(([ledger, rows]) => rows.map((row) => key(ledger, row).split("\t").slice(0, 3).join("\t"))));
  const actualKeys = new Set(dispositionKeys);
  for (const item of expectedKeys) if (!actualKeys.has(item)) issues.push(`missing disposition ${item}`);
  for (const item of actualKeys) if (!expectedKeys.has(item)) issues.push(`unknown disposition ${item}`);
  for (const row of dispositions) {
    const fields = row.split("\t");
    const dispositionClass = fields.at(-2) ?? "";
    const evidence = fields.at(-1) ?? "";
    if (/^(?:unknown|legacy|future|unreachable)$/i.test(dispositionClass) || !dispositionClass || !evidence) {
      issues.push(`unsupported disposition ${row}`);
    }
  }

  const consumer = current["supported-consumers"][0] ?? "W01";
  const maps = current.claims.map((row) => `${key("claims", row)}\t${consumer}\t${PHASE3_GATE}\tui-kernel-mismatch\tRED\tstatic-or-runtime-owner\tPHASE3-WINDOWS-TRAVERSAL`);
  if (bait === "remove-claim-mapping") maps.pop();
  if (bait === "fixture-only-claim" && maps.length) maps[0] = maps[0].replace("static-or-runtime-owner", "fixture-only");
  const mapKeys = new Set(maps.map((row) => row.split("\t").slice(0, 3).join("\t")));
  for (const claim of current.claims.map((row) => key("claims", row).split("\t").slice(0, 3).join("\t"))) if (!mapKeys.has(claim)) issues.push(`missing claim mapping ${claim}`);
  if (maps.some((row) => row.includes("\tfixture-only\t"))) issues.push("fixture-only claim presented as current proof");

  const classificationRows = lines(blob(CLASSIFICATION)).filter((row) => !row.startsWith("gate\t"));
  const classified = new Map(classificationRows.map((row) => [row.split("\t")[0], row]));
  const currentNames = new Set(current.gates.map((row) => row.split("\t")[0]));
  if (bait === "unregistered-gate") currentNames.add("bait-unregistered-gate");
  const expectedNames = new Set([...classified.keys(), PHASE3_GATE]);
  for (const name of currentNames) if (!expectedNames.has(name)) issues.push(`unclassified gate ${name}`);
  for (const name of expectedNames) if (!currentNames.has(name)) issues.push(`classified gate absent ${name}`);
  if (currentNames.size !== 74) issues.push(`gate total expected=74 actual=${currentNames.size}`);
  const historical = bait === "wrong-historical-authority" ? "d14ceb36659d86f157b4856b927581616dbaaa56" : HISTORICAL_G11;
  if (historical !== HISTORICAL_G11) issues.push("wrong-historical-authority");
  else {
    const historicalGate = gates(HISTORICAL_G11).find((row) => row.startsWith("golden-g11-authority\t"));
    if (!historicalGate) issues.push("historical golden-g11-authority registration absent");
    const currentGate = current.gates.find((row) => row.startsWith("golden-g11-authority\t"));
    if (historicalGate !== currentGate) issues.push("historical/current golden-g11-authority registration mismatch");
    const implementationPath = "qa/gates/golden-g11-authority.ts";
    if (blob(implementationPath, HISTORICAL_G11) !== blob(implementationPath)) {
      issues.push("historical/current golden-g11-authority implementation mismatch");
    }
    const acceptance = blob("docs/orders/evidence/golden-baseline/g11/VERIFIER-ACCEPTANCE-20260829.md");
    if (!acceptance.includes(HISTORICAL_G11)) issues.push("historical G11 acceptance identity absent");
  }
  return { issues, dispositions: dispositions.sort(), maps: maps.sort() };
}

export async function runGoldenPhase3RequalificationGate(): Promise<{ ok: boolean }> {
  const rawBait = process.env.QF_PHASE3_FALSIFY?.trim() as Bait | undefined;
  const allowed = new Set<Bait>(["delete-ledger-row", "duplicate-disposition", "remove-claim-mapping", "fixture-only-claim", "missing-electron-sdk-owner", "unregistered-gate", "wrong-historical-authority"]);
  if (rawBait && !allowed.has(rawBait)) {
    console.error(`golden-phase3-requalification: unknown QF_PHASE3_FALSIFY=${rawBait}`);
    return { ok: false };
  }
  const owned = !process.env.QF_PHASE3_RECEIPT_ROOT;
  const out = process.env.QF_PHASE3_RECEIPT_ROOT || mkdtempSync(join(tmpdir(), "qf-phase3-census-"));
  mkdirSync(out, { recursive: true });
  try {
    const seed = buildLedgers(SEED);
    const current = buildLedgers();
    const result = validate(seed, current, rawBait);
    for (const [name, rows] of Object.entries(current)) writeFileSync(join(out, `${name}.tsv`), serialize(rows));
    writeFileSync(join(out, "dispositions.tsv"), serialize(result.dispositions));
    writeFileSync(join(out, "claim-proof-map.tsv"), serialize(result.maps));
    const seedDelta = Object.keys(current).flatMap((name) => {
      const seedSet = new Set(seed[name] ?? []);
      const currentSet = new Set(current[name]);
      const summary = `${name}\tSUMMARY\tseed=${seedSet.size}\tcurrent=${currentSet.size}\tdelta=${currentSet.size - seedSet.size}`;
      const added = [...currentSet].filter((row) => !seedSet.has(row)).map((row) => `${name}\tADDED\t${row}`);
      const removed = [...seedSet].filter((row) => !currentSet.has(row)).map((row) => `${name}\tREMOVED\t${row}`);
      return [summary, ...added, ...removed];
    });
    writeFileSync(join(out, "seed-delta.tsv"), serialize(seedDelta));
    const ok = result.issues.length === 0 && !rawBait;
    writeFileSync(join(out, "completeness.txt"), `${ok ? "PASS" : "RED"}\n${result.issues.join("\n")}${result.issues.length ? "\n" : ""}`);
    if (rawBait) {
      if (result.issues.length === 0) console.error(`golden-phase3-requalification: FALSIFIER unexpectedly green ${rawBait}`);
      else console.error(`golden-phase3-requalification: expected RED bait=${rawBait} issues=${result.issues.length}`);
      return { ok: false };
    }
    if (!ok) {
      for (const issue of result.issues.slice(0, 50)) console.error(`golden-phase3-requalification: ${issue}`);
      console.error(`golden-phase3-requalification: RED issues=${result.issues.length} receipt=${relative(ROOT, out) || out}`);
      return { ok: false };
    }
    console.log(`golden-phase3-requalification: PASS tracked=${current["tracked-files"].length} deps=${current["direct-dependencies"].length} hooks=${current["package-hooks"].length} locks=${current["package-lock-roots"].length} tests=${current.tests.length} gates=${current.gates.length} claims=${current.claims.length} consumers=${current["supported-consumers"].length}`);
    return { ok: true };
  } finally {
    if (owned && existsSync(out)) rmSync(out, { recursive: true, force: true });
  }
}
