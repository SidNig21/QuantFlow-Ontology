import { describe, expect, test } from "bun:test";
import { silentInstallScript } from "./windows-installer.ts";

describe("NSIS silent install command", () => {
  test("keeps /D unquoted and last on the requested directory", () => {
    const installRoot = "C:\\Users\\runneradmin\\AppData\\Local\\qf-windows-installer-abc\\installed";
    const script = silentInstallScript(
      "D:\\a\\QuantFlow-Ontology\\QuantFlow-Ontology\\collab-electron\\dist\\QuantFlow Setup 0.8.4.exe",
      installRoot,
      "C:\\Users\\runneradmin\\AppData\\Local\\qf-windows-installer-abc\\nsis-install-exit.txt",
    );
    const argsLine = script.split(/\r?\n/).find((line) => line.startsWith("$psi.Arguments"));
    expect(argsLine).toBe(`$psi.Arguments = '/S /currentuser /D=${installRoot}'`);
    expect(script.includes('"/D=')).toBe(false);
    expect(argsLine?.trimEnd().endsWith(`/D=${installRoot}'`)).toBe(true);
    expect(script.includes("exit $code")).toBe(true);
  });
});
