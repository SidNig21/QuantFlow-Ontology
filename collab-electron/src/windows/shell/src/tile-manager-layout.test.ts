import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const tileManagerSource = readFileSync(join(import.meta.dir, "tile-manager.js"), "utf8");
const rendererSource = readFileSync(join(import.meta.dir, "renderer.js"), "utf8");

function functionBody(source: string, name: string, endMarker: string) {
  const start = source.indexOf(`function ${name}`);
  const end = source.indexOf(endMarker, start);
  return source.slice(start, end < 0 ? source.length : end);
}

describe("Tidy authority boundary", () => {
  test("applyTileLayout is projection-only and never persists", () => {
    const body = functionBody(tileManagerSource, "applyTileLayout", "\n\treturn {");
    expect(body).toContain("repositionAllTiles");
    expect(body).not.toContain("saveCanvas");
  });

  test("renderer Tidy path has no persistence call", () => {
    const body = functionBody(rendererSource, "tidyTilesToGrid", "\n\t// -- Canvas RPC --");
    expect(body).toContain("applyTileLayout");
    expect(body).not.toContain("saveCanvas");
  });

	test("keeps terminal guests out of Tab order without removing programmatic focus", () => {
		const spawnBody = functionBody(
			tileManagerSource,
			"spawnTerminalWebview",
			"\n\tfunction spawnGraphWebview",
		);
		const createIndex = spawnBody.indexOf(
			'document.createElement("webview")',
		);
		const tabIndexAssignment = spawnBody.indexOf(
			"wv.tabIndex = -1;",
			createIndex,
		);
		const srcAttribute = spawnBody.indexOf(
			'wv.setAttribute(\n\t\t\t"src"',
			createIndex,
		);
		const append = spawnBody.indexOf(
			"dom.contentArea.appendChild(wv);",
			createIndex,
		);

		expect(createIndex).toBeGreaterThanOrEqual(0);
		expect(tabIndexAssignment).toBeGreaterThan(createIndex);
		expect(srcAttribute).toBeGreaterThan(tabIndexAssignment);
		expect(append).toBeGreaterThan(tabIndexAssignment);

		const focusBody = functionBody(
			tileManagerSource,
			"focusCanvasTile",
			"\n\tlet fullscreenTileId = null;",
		);
		expect(focusBody).toContain("dom.webview.focus()");
	});
});
