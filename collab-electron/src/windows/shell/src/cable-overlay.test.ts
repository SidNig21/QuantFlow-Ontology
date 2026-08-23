import { describe, expect, test } from "bun:test";
import { chooseCableLabelPosition } from "./cable-overlay.js";

describe("collision-aware cable labels", () => {
	test("chooses the first clear screen-space candidate", () => {
		const position = chooseCableLabelPosition({
			baseX: 100,
			baseY: 100,
			baseRect: { left: 50, top: 90, right: 150, bottom: 104 },
			obstacles: [{ left: 40, top: 80, right: 160, bottom: 120 }],
			candidates: [{ dx: 0, dy: 0 }, { dx: 0, dy: -32 }, { dx: 48, dy: 0 }],
		});

		expect(position).toEqual({ x: 100, y: 68 });
	});

	test("keeps the first candidate as deterministic fallback", () => {
		const position = chooseCableLabelPosition({
			baseX: 100,
			baseY: 100,
			baseRect: { left: 50, top: 90, right: 150, bottom: 104 },
			obstacles: [{ left: 0, top: 0, right: 400, bottom: 400 }],
			candidates: [{ dx: 0, dy: 0 }, { dx: 0, dy: -32 }],
		});

		expect(position).toEqual({ x: 100, y: 100 });
	});
});
