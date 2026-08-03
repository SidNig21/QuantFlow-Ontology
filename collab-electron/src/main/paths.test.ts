import { describe, expect, test } from "bun:test";
import {
  resolveQuantFlowPaths,
  shouldRunLegacyAppMigration,
} from "./paths";

const base = {
  home: "C:\\Users\\founder",
  platform: "win32" as const,
  isDev: false,
  worktreeRoot: "C:\\repo",
};

describe("QuantFlow app path authority", () => {
  test("preserves the packaged Windows default without overrides", () => {
    expect(resolveQuantFlowPaths(base)).toEqual({
      appRoot: "C:\\Users\\founder\\.quantflow\\app",
      appDir: "C:\\Users\\founder\\.quantflow\\app",
      devWorktreeId: null,
    });
    expect(shouldRunLegacyAppMigration({})).toBe(true);
  });

  test("uses an explicit isolated app root and contained app directory", () => {
    expect(resolveQuantFlowPaths({
      ...base,
      appRootOverride: "C:\\acceptance\\quantflow",
      appDirOverride: "C:\\acceptance\\quantflow\\app",
    })).toEqual({
      appRoot: "C:\\acceptance\\quantflow",
      appDir: "C:\\acceptance\\quantflow\\app",
      devWorktreeId: null,
    });
    expect(shouldRunLegacyAppMigration({
      appRootOverride: "C:\\acceptance\\quantflow",
      appDirOverride: "C:\\acceptance\\quantflow\\app",
    })).toBe(false);
  });

  test("rejects an app directory that escapes its explicit root", () => {
    expect(() => resolveQuantFlowPaths({
      ...base,
      appRootOverride: "C:\\acceptance\\quantflow",
      appDirOverride: "C:\\Users\\founder\\.quantflow",
    })).toThrow("QF_APP_DIR must be contained beneath QF_APP_ROOT");
  });

  test("rejects incomplete override pairs", () => {
    expect(() => resolveQuantFlowPaths({
      ...base,
      appRootOverride: "C:\\acceptance\\quantflow",
    })).toThrow("QF_APP_ROOT and QF_APP_DIR must be configured together");
    expect(() => shouldRunLegacyAppMigration({
      appDirOverride: "C:\\acceptance\\quantflow\\app",
    })).toThrow("QF_APP_ROOT and QF_APP_DIR must be configured together");
  });

  test("rejects relative override paths", () => {
    expect(() => resolveQuantFlowPaths({
      ...base,
      appRootOverride: ".\\acceptance",
      appDirOverride: ".\\acceptance\\app",
    })).toThrow("QF_APP_ROOT and QF_APP_DIR must be absolute paths");
  });
});
