import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const shellDir = join(import.meta.dir, "..");
const shellMarkup = readFileSync(join(shellDir, "index.html"), "utf8");
const renderer = readFileSync(join(import.meta.dir, "renderer.js"), "utf8");
const shellStyles = readFileSync(join(import.meta.dir, "shell.css"), "utf8");

describe("shell startup", () => {
  test("starts the normal workspace without the removed canvas-skill onboarding", () => {
    for (const source of [shellMarkup, renderer, shellStyles]) {
      expect(source).not.toContain("canvas-skill");
      expect(source).not.toContain("Canvas Skill for AI Agents");
    }

    expect(renderer).not.toContain("checkFirstLaunchDialog");
    expect(renderer).toContain("async function init()");
    expect(renderer).toContain("init().catch((err) => {");
  });
});
