import { expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { refreshDesktopShortcut } from "./refresh-desktop-shortcut.mjs";

test.skipIf(process.platform !== "win32")("desktop shortcut preserves literal Windows paths on COM read-back", async () => {
  const root = mkdtempSync(join(tmpdir(), "qf-shortcut-literal-"));
  const packageRoot = join(root, "QuantFlow $literal's package");
  const exePath = join(packageRoot, "QuantFlow.exe");
  const shortcutPath = join(root, "QuantFlow $literal's proof.lnk");
  mkdirSync(packageRoot, { recursive: true });
  writeFileSync(exePath, "task-owned shortcut target");
  try {
    const result = refreshDesktopShortcut({ exePath, shortcutPath, workingDirectory: packageRoot, repoRoot: root });
    expect(result).toMatchObject({
      ok: true,
      shortcutPath,
      exePath,
      workingDirectory: packageRoot,
      iconLocation: `${exePath},0`,
    });
    expect(existsSync(shortcutPath)).toBe(true);
  } finally {
    for (let attempt = 0; attempt < 20 && existsSync(root); attempt += 1) {
      try { rmSync(root, { recursive: true, force: true }); } catch {}
      if (existsSync(root)) await Bun.sleep(25);
    }
    expect(existsSync(root)).toBe(false);
  }
});
