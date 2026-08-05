import { describe, expect, test } from "bun:test";

/**
 * Orphan-cascade selection (WO-g5). Kernel delete is covered by
 * packages/qf-kernel connection-actions tests; this asserts the tile-touch
 * filter that the IPC cascade uses (no FK on connection.from_ref/to_ref).
 */
function parseTileId(portRef: string): string {
	const colon = portRef.lastIndexOf(":");
	return colon === -1 ? portRef : portRef.slice(0, colon);
}

function connectionsTouchingTile(
	rows: Array<{ id: string; from_ref: string; to_ref: string }>,
	tileId: string,
) {
	return rows.filter(
		(row) =>
			parseTileId(row.from_ref) === tileId ||
			parseTileId(row.to_ref) === tileId,
	);
}

describe("WO-g5 connection orphan cascade", () => {
	test("selects both incident rows for a deleted tile", () => {
		const rows = [
			{ id: "c1", from_ref: "tile-a:e", to_ref: "tile-b:w" },
			{ id: "c2", from_ref: "tile-c:e", to_ref: "tile-a:n" },
			{ id: "c3", from_ref: "tile-b:e", to_ref: "tile-c:w" },
		];
		const touchingA = connectionsTouchingTile(rows, "tile-a");
		expect(touchingA.map((r) => r.id).sort()).toEqual(["c1", "c2"]);
		const left = rows.filter((r) => !touchingA.some((t) => t.id === r.id));
		expect(left.map((r) => r.id)).toEqual(["c3"]);
	});
});
