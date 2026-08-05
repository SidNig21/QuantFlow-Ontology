import { describe, expect, it } from "bun:test";
import {
	bezierPath,
	connectionPath,
	hitTestPath,
	makePortRef,
	parsePortRef,
	portPosition,
} from "./cable-math.js";

const TILE = { x: 100, y: 200, width: 400, height: 300 };

describe("portPosition", () => {
	it("places n at top center", () => {
		expect(portPosition(TILE, "n")).toEqual({
			x: 300,
			y: 200,
			dx: 0,
			dy: -1,
		});
	});

	it("places e at right middle", () => {
		expect(portPosition(TILE, "e")).toEqual({
			x: 500,
			y: 350,
			dx: 1,
			dy: 0,
		});
	});
});

describe("bezierPath (WO-g5 curvature)", () => {
	it("clamps short-distance curvature to 40", () => {
		const a = { x: 0, y: 0, dx: 1, dy: 0 };
		const b = { x: 10, y: 0, dx: -1, dy: 0 };
		expect(bezierPath(a, b)).toBe("M 0 0 C 40 0, -30 0, 10 0");
	});

	it("clamps long-distance curvature to 160", () => {
		const a = { x: 0, y: 0, dx: 1, dy: 0 };
		const b = { x: 10000, y: 0, dx: -1, dy: 0 };
		expect(bezierPath(a, b)).toBe("M 0 0 C 160 0, 9840 0, 10000 0");
	});

	it("uses 0.4 * dist when within clamp", () => {
		const a = { x: 0, y: 0, dx: 1, dy: 0 };
		const b = { x: 200, y: 0, dx: -1, dy: 0 };
		// k = 80
		expect(bezierPath(a, b)).toBe("M 0 0 C 80 0, 120 0, 200 0");
	});
});

describe("port refs + connectionPath", () => {
	it("parses and builds port refs", () => {
		expect(makePortRef("tile-1", "e")).toBe("tile-1:e");
		expect(parsePortRef("tile-1:w")).toEqual({ tileId: "tile-1", side: "w" });
		expect(parsePortRef("bad")).toBeNull();
	});

	it("builds expected path between two known rects", () => {
		const tiles = new Map([
			["a", { x: 0, y: 0, width: 100, height: 100 }],
			["b", { x: 300, y: 0, width: 100, height: 100 }],
		]);
		const path = connectionPath(
			{ id: "c1", kind: "view", from_ref: "a:e", to_ref: "b:w" },
			tiles,
		);
		expect(path).not.toBeNull();
		expect(path.d).toMatch(/^M 100 50 C/);
		expect(path.d).toMatch(/, 300 50$/);
	});

	it("hit-tests near the curve", () => {
		const d = "M 0 0 C 40 0, 60 0, 100 0";
		expect(hitTestPath(d, 50, 0, 4)).toBe(true);
		expect(hitTestPath(d, 50, 40, 4)).toBe(false);
	});
});
