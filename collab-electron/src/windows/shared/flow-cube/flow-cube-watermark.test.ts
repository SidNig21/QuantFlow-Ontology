import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

test("Canvas brand restores the rotating flow cube and suspends nonessential motion", () => {
	const source = readFileSync(new URL("./flow-cube-watermark.js", import.meta.url), "utf8");
	const shell = readFileSync(new URL("../../shell/src/renderer.js", import.meta.url), "utf8");
	expect(source).toContain("VERTICES");
	expect(source).toContain("EDGES");
	expect(source).toContain('wordmark.textContent="QUANTFLOW"');
	expect(source).toContain("requestAnimationFrame(frame)");
	expect(source).toContain('prefers-reduced-motion: reduce');
	expect(source).toContain('document.addEventListener("visibilitychange",visibility)');
	expect(source).toContain("document.hidden?stop():start()");
	expect(shell).toContain("createFlowCubeWatermark");
});
