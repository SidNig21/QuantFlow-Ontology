/**
 * Pure helpers for WO-g6 Glacier feel — no DOM, no Kernel writes.
 */

/**
 * D2: cable path endpoints must move when tile geometry moves.
 * @param {{ id: string, from_ref: string, to_ref: string, kind: string }} connection
 * @param {Map<string, {x:number,y:number,width:number,height:number}>} tilesById
 * @param {(c: object, m: Map) => { a: {x:number,y:number}, b: {x:number,y:number} } | null} connectionPath
 */
export function cableEndpointsMoved(connection, tilesByIdBefore, tilesByIdAfter, connectionPath) {
	const before = connectionPath(connection, tilesByIdBefore);
	const after = connectionPath(connection, tilesByIdAfter);
	if (!before || !after) return false;
	return before.a.x !== after.a.x || before.a.y !== after.a.y
		|| before.b.x !== after.b.x || before.b.y !== after.b.y;
}

/**
 * D4: project Kernel events rows into ledger entries (newest first).
 * Projection only — no invented rows, no caching of derived truth.
 * @param {Array<{id:string,type:string,object_type:string,created_at:string}>} rows
 * @param {number} [nowMs]
 */
export function projectKernelLedger(rows, nowMs = Date.now()) {
	const sorted = [...rows].sort((a, b) => {
		const ta = String(a.created_at);
		const tb = String(b.created_at);
		if (ta !== tb) return tb.localeCompare(ta);
		return String(b.id).localeCompare(String(a.id));
	});
	return sorted.map((row) => ({
		id: row.id,
		type: row.type,
		object_type: row.object_type,
		created_at: row.created_at,
		relative: formatRelative(row.created_at, nowMs),
	}));
}

/**
 * @param {string} iso
 * @param {number} nowMs
 */
export function formatRelative(iso, nowMs = Date.now()) {
	const t = Date.parse(iso);
	if (!Number.isFinite(t)) return "—";
	const sec = Math.max(0, Math.floor((nowMs - t) / 1000));
	if (sec < 5) return "just now";
	if (sec < 60) return `${sec}s ago`;
	const min = Math.floor(sec / 60);
	if (min < 60) return `${min}m ago`;
	const hr = Math.floor(min / 60);
	if (hr < 48) return `${hr}h ago`;
	const day = Math.floor(hr / 24);
	return `${day}d ago`;
}

/**
 * D5: pan/zoom so all tiles fit in the viewport with margin.
 * Zoom clamped to canvas limits [0.25, 1].
 * @param {Array<{x:number,y:number,width:number,height:number}>} tiles
 * @param {number} viewportW
 * @param {number} viewportH
 * @param {number} [margin]
 */
export function fitViewportToTiles(tiles, viewportW, viewportH, margin = 48) {
	if (!Array.isArray(tiles) || tiles.length === 0) return null;
	if (!(viewportW > 0) || !(viewportH > 0)) return null;

	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	for (const t of tiles) {
		if (!Number.isFinite(t.x) || !Number.isFinite(t.y)) continue;
		const w = Number.isFinite(t.width) ? t.width : 0;
		const h = Number.isFinite(t.height) ? t.height : 0;
		minX = Math.min(minX, t.x);
		minY = Math.min(minY, t.y);
		maxX = Math.max(maxX, t.x + w);
		maxY = Math.max(maxY, t.y + h);
	}
	if (!Number.isFinite(minX)) return null;

	const boxW = Math.max(24, maxX - minX);
	const boxH = Math.max(24, maxY - minY);
	const availW = Math.max(24, viewportW - margin * 2);
	const availH = Math.max(24, viewportH - margin * 2);
	let zoom = Math.min(availW / boxW, availH / boxH);
	zoom = Math.min(1, Math.max(0.25, zoom));

	const contentW = boxW * zoom;
	const contentH = boxH * zoom;
	const panX = (viewportW - contentW) / 2 - minX * zoom;
	const panY = (viewportH - contentH) / 2 - minY * zoom;
	return { zoom, panX, panY, minX, minY, maxX, maxY };
}

/**
 * D1: human label for cable honesty (never claims honour while dashed).
 * @param {{ kind: string }} connection
 * @param {boolean} honoured
 */
export function cableStateLabel(connection, honoured) {
	if (honoured && connection.kind === "view") {
		return "honoured · runtime uses this wiring";
	}
	return "declared · no runtime honours this yet";
}
