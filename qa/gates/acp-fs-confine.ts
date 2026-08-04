/**
 * R7 — ACP fs confinement static + unit gate.
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  assertPathWithinAcpFsRoot,
  loadAcpFsRoot,
  shouldAdvertiseAcpFs,
} from "../../collab-electron/src/main/acp-fs-root.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export async function runAcpFsConfineGate(): Promise<{ ok: boolean }> {
  try {
    const source = readFileSync(
      join(import.meta.dir, "../../collab-electron/src/main/acp-agent.ts"),
      "utf8",
    );
    assert(source.includes("shouldAdvertiseAcpFs"), "fs advertise helper missing");
    assert(source.includes("assertPathWithinAcpFsRoot"), "fs confine helper missing");
    assert(
      !source.includes("fs: { readTextFile: true, writeTextFile: true }"),
      "unconditional fs advertise still present",
    );
    console.log("acp-fs-confine: FALSIFY GREEN fs advertise gated on root");

    assert(!shouldAdvertiseAcpFs(null), "missing root must not advertise");
    console.log("acp-fs-confine: FALSIFY RED missing root not advertised");

    const root = mkdtempSync(join(tmpdir(), "qf-acp-confine-"));
    try {
      writeFileSync(join(root, "ok.txt"), "ok");
      const sibling = mkdtempSync(join(tmpdir(), "qf-acp-confine-sib-"));
      try {
        writeFileSync(join(sibling, "secret.txt"), "no");
        mkdirSync(join(`${root}-evil`), { recursive: true });
        writeFileSync(join(`${root}-evil`, "x.txt"), "x");

        assertPathWithinAcpFsRoot(root, join(root, "ok.txt"));

        const escapes: Array<[string, string]> = [
          ["absolute outside", join(sibling, "secret.txt")],
          ["dotdot", join(root, "..", "outside.txt")],
          ["prefix sibling", join(`${root}-evil`, "x.txt")],
          ["unc-ish", "\\\\?\\C:\\Windows\\win.ini"],
        ];
        for (const [label, path] of escapes) {
          let denied = false;
          try {
            assertPathWithinAcpFsRoot(root, path);
          } catch {
            denied = true;
          }
          assert(denied, `escape not refused: ${label}`);
          console.log(`acp-fs-confine: FALSIFY RED escape refused (${label})`);
        }
        assert(loadAcpFsRoot({ QF_ACP_FS_ROOT: "" } as NodeJS.ProcessEnv) === null);
        console.log("acp-fs-confine: FALSIFY RED empty root unset");
      } finally {
        rmSync(sibling, { recursive: true, force: true });
        rmSync(`${root}-evil`, { recursive: true, force: true });
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }

    console.log("acp-fs-confine: PASS");
    return { ok: true };
  } catch (error) {
    console.error(
      `acp-fs-confine: FAIL ${error instanceof Error ? error.message : String(error)}`,
    );
    return { ok: false };
  }
}

if (import.meta.main) {
  const { ok } = await runAcpFsConfineGate();
  process.exit(ok ? 0 : 1);
}
