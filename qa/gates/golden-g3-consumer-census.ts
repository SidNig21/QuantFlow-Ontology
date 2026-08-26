/**
 * Golden Baseline G3 — consumer census for the two retired package islands.
 *
 * This is deliberately a source/package-input census, not a reachability claim.
 * QA, generated output, accepted history, comments/strings, and the named G3
 * control documents are reported but do not count as live production consumers.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dir, "../..");
const FALSIFY_ENV = "QF_G3_CONSUMER_CENSUS_FALSIFY";

const ROOTS = {
  "peer-bus": "tools/qf-peer-bus",
  "critic-mock": "species/critic-mock",
} as const;

type ObsoleteRoot = keyof typeof ROOTS;
type ConsumerClass =
  | "production-import"
  | "spawn-launch"
  | "runtime-inventory"
  | "dock-manifest"
  | "electron-extraResources"
  | "package-ref"
  | "build-output"
  | "installer"
  | "compatibility-state"
  | "qa"
  | "current-authority"
  | "history"
  | "generated"
  | "comment-string"
  | "future-r18-r25"
  | "control-document";

type CensusRow = {
  class: ConsumerClass;
  source: string;
  target: string;
  line?: number;
};

const NON_CONSUMER_CLASSES = new Set<ConsumerClass>([
  "qa",
  "history",
  "generated",
  "comment-string",
  "control-document",
]);

const HISTORY_PATHS = [
  "docs/DEBT.md",
  "docs/orders/evidence/post-merge-review-kernel-identity.md",
  "docs/orders/evidence/wo-103/",
  "docs/orders/evidence/wo-103b/",
  "docs/orders/evidence/wo-104/",
  "docs/orders/evidence/wo-106/",
  "docs/orders/evidence/wo-106b/",
  "docs/orders/evidence/wo-ci4/",
  "docs/orders/evidence/wo-ci5/",
  "docs/orders/evidence/wo-k1/",
];

const CONTROL_PATHS = new Set([
  "docs/orders/NEXT.md",
  "docs/orders/WO-GOLDEN-G3.md",
]);

const PRESERVED_SEAMS = [
  "collab-electron/src/main/kernel.ts",
  "collab-electron/src/main/peer-delivery.ts",
  "collab-electron/src/main/index.ts",
  "collab-electron/src/main/agent-host.ts",
  "collab-electron/src/main/host-native-tui.ts",
  "collab-electron/src/main/sidecar/server.ts",
  "species/hermes",
] as const;

function normalized(value: string): string {
  return value.replaceAll("\\", "/");
}

function gitFiles(): string[] {
  const tracked = execFileSync("git", ["ls-files", "-z"], {
    cwd: REPO_ROOT,
  }).toString();
  const ignored = execFileSync(
    "git",
    [
      "ls-files",
      "--others",
      "--ignored",
      "--exclude-standard",
      "-z",
      "--",
      ...Object.values(ROOTS),
    ],
    { cwd: REPO_ROOT, maxBuffer: 64 * 1024 * 1024 },
  ).toString();
  return [...new Set(`${tracked}${ignored}`.split("\0").filter(Boolean).map(normalized))]
    .filter((path) => !path.startsWith("docs/orders/evidence/golden-baseline/g3/"))
    .sort();
}

function rootFor(text: string): ObsoleteRoot | null {
  const value = normalized(text);
  if (value.includes(ROOTS["peer-bus"])) return "peer-bus";
  if (value.includes(ROOTS["critic-mock"])) return "critic-mock";
  return null;
}

function under(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}

function isHistory(path: string): boolean {
  if (path.startsWith("docs/history/") || path.startsWith("docs/orders/evidence/")) return true;
  return HISTORY_PATHS.some((prefix) => {
    const normalizedPrefix = prefix.replace(/\/+$/, "");
    return under(path, normalizedPrefix);
  });
}

function isGenerated(path: string): boolean {
  return (
    path === "qf-atlas/atlas.json" ||
    path === "qf-atlas/atlas.html" ||
    path === "qf-atlas/ATLAS.md" ||
    path === "qf-atlas/atlas-diff.json" ||
    path === "qf-atlas/falsifiers.json"
  );
}

function isCommentOnly(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed.startsWith("//") ||
    trimmed.startsWith("/*") ||
    trimmed.startsWith("*") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("<!--")
  );
}

function classify(path: string, line: string): ConsumerClass {
  if (CONTROL_PATHS.has(path)) return "control-document";
  if (isHistory(path)) return "history";
  if (path.startsWith("qa/")) return "qa";
  if (isGenerated(path)) return "generated";
  if (path === "install.sh" || path.startsWith("collab-electron/scripts/upload-")) {
    return "installer";
  }
  if (path.includes("/out/") || path.startsWith("collab-electron/out/")) {
    return "build-output";
  }
  if (path.endsWith("package.json") || path.endsWith("bun.lock")) {
    return "package-ref";
  }
  if (path.startsWith("docs/") || path === "README.md" || path.startsWith("species/")) {
    return "current-authority";
  }
  if (/R(?:18|19|20|21|22|23|24|25)|R18-R25|R18–R25/.test(line)) {
    return "future-r18-r25";
  }
  if (/QF_PEER_BUS_DB|\.qf-peer-bus|peer-bus\.db|compatib|migration|state/i.test(line)) {
    return "compatibility-state";
  }
  if (/extraResources/i.test(line)) return "electron-extraResources";
  if (/dock|inventory|agent_definition|agent-package/i.test(line)) return "dock-manifest";
  if (/spawn\s*\(|exec(File|Path)?Sync|Bun\.spawn|child_process|launch|command\s*:/i.test(line)) {
    return "spawn-launch";
  }
  if (/\b(import|require|from|export)\b|import\s*\(/.test(line)) {
    return "production-import";
  }
  if (isCommentOnly(line)) return "comment-string";
  return "comment-string";
}

function census(): CensusRow[] {
  const rows: CensusRow[] = [];
  for (const path of gitFiles()) {
    if (path.includes("/node_modules/") || path.includes("/.old_modules-")) continue;
    const absolute = join(REPO_ROOT, path);
    let text: string;
    try {
      text = readFileSync(absolute, "utf8");
    } catch {
      continue;
    }
    for (const [index, line] of text.split(/\r?\n/).entries()) {
      const root = rootFor(line);
      if (!root) continue;
      rows.push({
        class: classify(path, line),
        source: path,
        target: ROOTS[root],
        line: index + 1,
      });
    }
  }
  return rows;
}

function checkPreservedSeams(): string[] {
  const missing: string[] = PRESERVED_SEAMS.filter((path) => !existsSync(join(REPO_ROOT, path)));
  const peerDelivery = join(REPO_ROOT, "collab-electron/src/main/peer-delivery.ts");
  const hermesResearch = join(REPO_ROOT, "qa/gates/hermes-research.ts");
  if (
    existsSync(peerDelivery) &&
    !/peer-bus\.db|QF_PEER_BUS_DB|transport/i.test(readFileSync(peerDelivery, "utf8"))
  ) {
    missing.push("collab-electron/src/main/peer-delivery.ts (transport seam text)");
  }
  if (existsSync(hermesResearch) && !/hermes-critic/.test(readFileSync(hermesResearch, "utf8"))) {
    missing.push("qa/gates/hermes-research.ts (hermes-critic identity)");
  }
  return missing;
}

export function runGoldenG3ConsumerCensus(): boolean {
  const selector = process.env[FALSIFY_ENV];
  const rows = census();
  if (selector !== undefined) {
    if (selector !== "peer-bus" && selector !== "critic-mock") {
      console.error(`golden-g3-consumer-census: unknown ${FALSIFY_ENV}=${JSON.stringify(selector)}`);
      return false;
    }
    const selected = selector as ObsoleteRoot;
    rows.unshift({
      class: "production-import",
      source: "qa:falsifier",
      target: ROOTS[selected],
    });
  }

  const forbidden = rows.filter((row) => !NON_CONSUMER_CLASSES.has(row.class));
  if (forbidden.length > 0) {
    for (const row of forbidden) {
      const suffix = row.line === undefined ? "" : `:${row.line}`;
      console.error(
        `golden-g3-consumer-census: forbidden ${row.class} ${row.source}${suffix} -> ${row.target}`,
      );
    }
    return false;
  }

  const missing = checkPreservedSeams();
  if (missing.length > 0) {
    for (const seam of missing) {
      console.error(`golden-g3-consumer-census: preserved seam missing -> ${seam}`);
    }
    return false;
  }

  const classCounts = new Map<ConsumerClass, number>();
  for (const row of rows) {
    classCounts.set(row.class, (classCounts.get(row.class) ?? 0) + 1);
  }
  console.log(
    `golden-g3-consumer-census: PASS rows=${rows.length} ` +
      `non-consumer=${[...classCounts.entries()].map(([key, value]) => `${key}:${value}`).join(",") || "none"}`,
  );
  return true;
}

if (import.meta.main) process.exit(runGoldenG3ConsumerCensus() ? 0 : 1);