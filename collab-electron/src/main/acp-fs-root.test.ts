import { describe, expect, test } from "bun:test";
import {
  mkdirSync,
  mkdtempSync,
  symlinkSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  assertPathWithinAcpFsRoot,
  loadAcpFsRoot,
  shouldAdvertiseAcpFs,
} from "./acp-fs-root";

describe("ACP fs root confinement", () => {
  const roots: string[] = [];
  function temp(): string {
    const root = mkdtempSync(join(tmpdir(), "qf-acp-fs-"));
    roots.push(root);
    return root;
  }

  test("missing root is not advertised", () => {
    expect(loadAcpFsRoot({} as NodeJS.ProcessEnv)).toBeNull();
    expect(shouldAdvertiseAcpFs(null)).toBe(false);
  });

  test("six escape baits fail closed", () => {
    const root = temp();
    const inside = join(root, "allowed.txt");
    writeFileSync(inside, "ok");
    const sibling = mkdtempSync(join(tmpdir(), "qf-acp-sib-"));
    roots.push(sibling);
    writeFileSync(join(sibling, "secret.txt"), "no");

    assertPathWithinAcpFsRoot(root, inside);

    expect(() =>
      assertPathWithinAcpFsRoot(root, join(sibling, "secret.txt")),
    ).toThrow(/outside QF_ACP_FS_ROOT/);

    expect(() =>
      assertPathWithinAcpFsRoot(root, join(root, "..", "nope.txt")),
    ).toThrow();

    const link = join(root, "escape-link");
    try {
      symlinkSync(sibling, link, "junction");
      expect(() =>
        assertPathWithinAcpFsRoot(root, join(link, "secret.txt")),
      ).toThrow(/outside QF_ACP_FS_ROOT/);
    } catch (error) {
      if (String(error).includes("outside QF_ACP_FS_ROOT")) throw error;
      // Symlink may be unavailable on some Windows configs — still cover other escapes.
    }

    const prefixSibling = `${root}-evil`;
    mkdirSync(prefixSibling, { recursive: true });
    roots.push(prefixSibling);
    writeFileSync(join(prefixSibling, "x.txt"), "x");
    expect(() =>
      assertPathWithinAcpFsRoot(root, join(prefixSibling, "x.txt")),
    ).toThrow(/outside QF_ACP_FS_ROOT/);

    expect(() =>
      assertPathWithinAcpFsRoot(root, "\\\\?\\C:\\Windows\\win.ini"),
    ).toThrow();

    expect(loadAcpFsRoot({ QF_ACP_FS_ROOT: "" } as NodeJS.ProcessEnv)).toBeNull();
    expect(
      loadAcpFsRoot({ QF_ACP_FS_ROOT: join(root, "missing-dir") } as NodeJS.ProcessEnv),
    ).toBeNull();
  });

  test("cleanup", () => {
    for (const root of roots.splice(0)) {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
