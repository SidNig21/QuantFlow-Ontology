import { describe, expect, test } from "bun:test";
import { connectionPath } from "./cable-math.js";
import {
	cableEndpointsMoved,
	cableStateLabel,
	fitViewportToTiles,
	projectKernelLedger,
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

describe("WO-g6 D4 ledger projection", () => {
	test("newest first; equals input set with no extras", () => {
		const rows = [
			{ id: "e1", type: "connection.created", object_type: "connection", created_at: "2026-08-05T04:32:17.308Z" },
			{ id: "e2", type: "connection.deleted", object_type: "connection", created_at: "2026-08-05T04:34:40.043Z" },
			{ id: "e3", type: "agent_session.closed", object_type: "agent_session", created_at: "2026-08-05T04:34:40.226Z" },
		];
		const projected = projectKernelLedger(rows, Date.parse("2026-08-05T04:34:45.000Z"));
		expect(projected.map((p) => p.id)).toEqual(["e3", "e2", "e1"]);
		expect(projected.map((p) => `${p.type}|${p.object_type}`)).toEqual([
			"agent_session.closed|agent_session",
			"connection.deleted|connection",
			"connection.created|connection",
		]);
		expect(new Set(projected.map((p) => p.id))).toEqual(new Set(rows.map((r) => r.id)));
		expect(projected).toHaveLength(rows.length);
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
});

describe("WO-g6 D1 declared label", () => {
	test("unhonoured view stays declared wording", () => {
		expect(cableStateLabel({ kind: "view" }, false)).toContain("declared");
		expect(cableStateLabel({ kind: "view" }, false)).not.toContain("failed");
	});
});
