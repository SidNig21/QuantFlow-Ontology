import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  resolveCollaborationResourcePath,
  resolveHermesProfileRoot,
} from "./package-resource-paths";

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("packaged collaboration resource resolution", () => {
  test("prefers the installed resources root over the development checkout", () => {
    const root = mkdtempSync(join(tmpdir(), "qf-collab-resource-"));
    roots.push(root);
    const moduleDir = join(root, "out/main");
    const resourcesPath = join(root, "resources");
    mkdirSync(moduleDir, { recursive: true });
    mkdirSync(join(resourcesPath), { recursive: true });
    mkdirSync(join(root, "cli"), { recursive: true });
    writeFileSync(join(resourcesPath, "qf-hermes-launch.sh"), "packaged");
    writeFileSync(join(root, "cli/qf-hermes-launch.sh"), "development");

    expect(resolveCollaborationResourcePath("qf-hermes-launch.sh", {
      resourcesPath,
      moduleDir,
    })).toBe(join(resourcesPath, "qf-hermes-launch.sh"));
  });

  test("falls back to development resources when no installed resource exists", () => {
    const root = mkdtempSync(join(tmpdir(), "qf-collab-resource-"));
    roots.push(root);
    const moduleDir = join(root, "out/main");
    mkdirSync(moduleDir, { recursive: true });
    mkdirSync(join(root, "cli"), { recursive: true });
    writeFileSync(join(root, "cli/qf-collaboration-mcp.mjs"), "development");

    expect(resolveCollaborationResourcePath("qf-collaboration-mcp.mjs", {
      resourcesPath: join(root, "missing-resources"),
      moduleDir,
    })).toBe(join(root, "cli/qf-collaboration-mcp.mjs"));
  });

  test("returns null instead of silently falling back to an unrelated path", () => {
    expect(resolveCollaborationResourcePath("qf-hermes-launch.sh", {
      resourcesPath: null,
      moduleDir: join(tmpdir(), "qf-no-such-main-module"),
    })).toBeNull();
  });

  test("derives Hermes state only from the authoritative app directory", () => {
    const authoritative = "C:\\QuantFlow\\app-dev-worktree";
    expect(resolveHermesProfileRoot(authoritative)).toBe(join(authoritative, "hermes-profiles"));
  });
});
