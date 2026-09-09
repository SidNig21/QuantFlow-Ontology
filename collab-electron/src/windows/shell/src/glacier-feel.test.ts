import { describe, expect, test } from "bun:test";
import { connectionPath } from "./cable-math.js";
import {
	cableEndpointsMoved,
	cableStateLabel,
	fitViewportToTiles,
} from "./glacier-feel.js";

describe("WO-g6 D2 cables track tile geometry", () => {
	test("endpoints recompute when a tile moves (no stored coordinates)", () => {
		const conn = {
			id: "c1",
			kind: "view",
			from_ref: "a:e",
			to_ref: "b:w",
		};
		const before = new Map([
			["a", { x: 0, y: 0, width: 100, height: 100 }],
			["b", { x: 300, y: 0, width: 100, height: 100 }],
		]);
		const after = new Map([
			["a", { x: 50, y: 40, width: 100, height: 100 }],
			["b", { x: 300, y: 0, width: 100, height: 100 }],
		]);
		expect(cableEndpointsMoved(conn, before, after, connectionPath)).toBe(true);
		const p0 = connectionPath(conn, before);
		const p1 = connectionPath(conn, after);
		expect(p0.a.x).toBe(100);
		expect(p1.a.x).toBe(150);
		expect(p1.a.y).toBe(90);
	});

	test("identical geometry yields no movement", () => {
		const conn = {
			id: "c1",
			kind: "view",
			from_ref: "a:e",
			to_ref: "b:w",
		};
		const tiles = new Map([
			["a", { x: 0, y: 0, width: 100, height: 100 }],
			["b", { x: 300, y: 0, width: 100, height: 100 }],
		]);
		expect(cableEndpointsMoved(conn, tiles, tiles, connectionPath)).toBe(false);
	});
});

describe("WO-g6 D5 tidy fit", () => {
	test("empty tiles is null (no-op)", () => {
		expect(fitViewportToTiles([], 800, 600)).toBeNull();
	});

	test("fits bounding box with margin and clamps zoom", () => {
		const tiles = [
			{ x: 0, y: 0, width: 200, height: 200 },
			{ x: 400, y: 300, width: 200, height: 200 },
		];
		const fit = fitViewportToTiles(tiles, 800, 600, 48);
		expect(fit).not.toBeNull();
		expect(fit.zoom).toBeGreaterThanOrEqual(0.25);
		expect(fit.zoom).toBeLessThanOrEqual(1);
		const left = fit.minX * fit.zoom + fit.panX;
		const top = fit.minY * fit.zoom + fit.panY;
		const right = fit.maxX * fit.zoom + fit.panX;
		const bottom = fit.maxY * fit.zoom + fit.panY;
		expect(left).toBeGreaterThanOrEqual(0);
		expect(top).toBeGreaterThanOrEqual(0);
		expect(right).toBeLessThanOrEqual(800);
		expect(bottom).toBeLessThanOrEqual(600);
	});

	test("keeps an expanded participant readable when the whole desk cannot fit at readable scale", () => {
		const participant = { id: "director", x: 420, y: 320, width: 720, height: 520 };
		const tiles = [
			participant,
			...Array.from({ length: 12 }, (_, index) => ({ x: index * 460, y: 900, width: 300, height: 190 })),
		];
		const fit = fitViewportToTiles(tiles, 1200, 800, 48, { minZoom: 0.6, anchorTile: participant });
		expect(fit.zoom).toBe(0.6);
		const left = participant.x * fit.zoom + fit.panX;
		const top = participant.y * fit.zoom + fit.panY;
		const right = (participant.x + participant.width) * fit.zoom + fit.panX;
		const bottom = (participant.y + participant.height) * fit.zoom + fit.panY;
		expect(left).toBeGreaterThanOrEqual(48);
		expect(top).toBeGreaterThanOrEqual(48);
		expect(right).toBeLessThanOrEqual(1200 - 48);
		expect(bottom).toBeLessThanOrEqual(800 - 48);
	});
});

describe("WO-g6 D1 declared label", () => {
	test("unhonoured view stays declared wording", () => {
		expect(cableStateLabel({ kind: "view" }, false)).toContain("declared");
		expect(cableStateLabel({ kind: "view" }, false)).not.toContain("failed");
	});
});
