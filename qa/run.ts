/**
 * QuantFlow QA gate runner. Every gate is a named, re-runnable check —
 * "verified" means this command passed, never a typed checkmark.
 *
 *   bun qa/run.ts --list
 *   bun qa/run.ts <gate-name>
 *   bun qa/run.ts --all
 */
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const REPO_ROOT = join(import.meta.dir, "..");

type Gate = {
  name: string;
  description: string;
  run: () => boolean | Promise<boolean>;
};

const gates: Gate[] = [
  {
    name: "repo-shape",
    description: "Front door + authority map + orders dir exist; CLA machinery stays gone",
    run: () => {
      const mustExist = [
        "START_HERE.md",
        "DOC_AUTHORITY_MAP.md",
        "docs/orders/README.md",
        ".gitattributes",
      ];
      const mustNotExist = [".clabot", "CLA.md", ".github/workflows/cla.yml"];
      let ok = true;
      for (const f of mustExist) {
        if (!existsSync(join(REPO_ROOT, f))) {
          console.error(`repo-shape: missing required file ${f}`);
          ok = false;
        }
      }
      for (const f of mustNotExist) {
        if (existsSync(join(REPO_ROOT, f))) {
          console.error(`repo-shape: stripped file has returned: ${f}`);
          ok = false;
        }
      }
      return ok;
    },
  },
  {
    name: "lockfile-committed",
    description: "bun.lock exists and is not gitignored (reproducible installs)",
    run: () => {
      const lock = join(REPO_ROOT, "collab-electron", "bun.lock");
      if (!existsSync(lock)) {
        console.error("lockfile-committed: collab-electron/bun.lock missing");
        return false;
      }
      const gi = readFileSync(join(REPO_ROOT, "collab-electron", ".gitignore"), "utf8");
      if (/^bun\.lock$/m.test(gi)) {
        console.error("lockfile-committed: bun.lock is gitignored — remove that line");
        return false;
      }
      return true;
    },
  },
];

async function main() {
  const arg = process.argv[2];
  if (!arg || arg === "--list") {
    for (const g of gates) console.log(`${g.name}\t${g.description}`);
    if (!arg) console.log("\nUsage: bun qa/run.ts --list | <gate-name> | --all");
    return;
  }
  const selected = arg === "--all" ? gates : gates.filter((g) => g.name === arg);
  if (selected.length === 0) {
    console.error(`No gate named '${arg}'. Run with --list.`);
    process.exit(1);
  }
  let failed = 0;
  for (const g of selected) {
    const ok = await g.run();
    console.log(`${ok ? "PASS" : "FAIL"}  ${g.name}`);
    if (!ok) failed++;
  }
  process.exit(failed === 0 ? 0 : 1);
}

main();
