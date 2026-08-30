import { describe, expect, test } from "bun:test";
import { chooseCableLabelPosition, LABEL_PATH_FRACTIONS } from "./cable-overlay.js";

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

	test("samples the selected path and excludes only its exact endpoint tiles", () => {
		expect(LABEL_PATH_FRACTIONS).toEqual([0.50, 0.375, 0.625, 0.25, 0.75]);
		const hypothesis = { left: 920, top: 540, right: 1220, bottom: 730 };
		const evaluation = { left: 1500, top: 310, right: 1800, bottom: 500 };
		const workerEvidence = { left: 920, top: 310, right: 1220, bottom: 500 };
		const label = { left: 1160, top: 398, right: 1260, bottom: 416 };
		const offsets = [{ dx: 0, dy: 0 }];
		const anchors = [
			{ x: 1210, y: 407 },
			{ x: 1320, y: 390 },
			{ x: 1390, y: 420 },
			{ x: 1130, y: 520 },
			{ x: 1470, y: 350 },
		];

		const midpointOnlyIncludingEndpoints = chooseCableLabelPosition({
			baseX: 1210, baseY: 407, baseRect: label,
			obstacles: [hypothesis, evaluation, workerEvidence], candidates: offsets,
		});
		expect(midpointOnlyIncludingEndpoints).toEqual({ x: 1210, y: 407 });
		expect(midpointOnlyIncludingEndpoints.x - 50).toBeLessThan(workerEvidence.right);

		const sampledWithExactEndpointsExcluded = chooseCableLabelPosition({
			baseX: 1210, baseY: 407, baseRect: label,
			obstacles: [workerEvidence], candidates: offsets, anchors,
		});
		expect(sampledWithExactEndpointsExcluded).toEqual({ x: 1320, y: 390 });
	});

	test("tries the next deterministic candidate and has a stable no-clear fallback", () => {
		const args = {
			baseX: 100, baseY: 100,
			baseRect: { left: 60, top: 90, right: 140, bottom: 108 },
			anchors: [{ x: 100, y: 100 }, { x: 200, y: 100 }],
			candidates: [{ dx: 0, dy: 0 }, { dx: 0, dy: -32 }],
		};
		expect(chooseCableLabelPosition({ ...args, obstacles: [{ left: 50, top: 80, right: 150, bottom: 120 }] }))
			.toEqual({ x: 100, y: 68 });
		const blocked = { left: 0, top: 0, right: 400, bottom: 400 };
		const first = chooseCableLabelPosition({ ...args, obstacles: [blocked] });
		const second = chooseCableLabelPosition({ ...args, obstacles: [blocked] });
		expect(first).toEqual({ x: 100, y: 100 });
		expect(second).toEqual(first);
	});
});
