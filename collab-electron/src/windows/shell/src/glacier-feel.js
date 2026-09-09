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
 * D5: pan/zoom so all tiles fit in the viewport with margin.
 * Zoom clamped to canvas limits [0.25, 1].
 * @param {Array<{x:number,y:number,width:number,height:number}>} tiles
 * @param {number} viewportW
 * @param {number} viewportH
 * @param {number} [margin]
 * @param {{minZoom?:number,anchorTile?:{x:number,y:number,width:number,height:number}}} [options]
 */
export function fitViewportToTiles(tiles, viewportW, viewportH, margin = 48, options = {}) {
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
	const naturalZoom = Math.min(availW / boxW, availH / boxH);
	const requestedMinZoom = Math.min(1, Math.max(0.25, Number(options.minZoom) || 0.25));
	const anchor = options.anchorTile;
	const anchorWidth = Number(anchor?.width) || 0;
	const anchorHeight = Number(anchor?.height) || 0;
	const anchorFitZoom = anchorWidth > 0 && anchorHeight > 0
		? Math.min(1, availW / anchorWidth, availH / anchorHeight)
		: 1;
	const minZoom = Math.max(0.25, Math.min(requestedMinZoom, anchorFitZoom));
	const zoom = Math.min(1, Math.max(minZoom, naturalZoom));

	const contentW = boxW * zoom;
	const contentH = boxH * zoom;
	const anchorReadable = anchor && naturalZoom < minZoom;
	const panX = anchorReadable
		? viewportW / 2 - (Number(anchor.x) + anchorWidth / 2) * zoom
		: (viewportW - contentW) / 2 - minX * zoom;
	const panY = anchorReadable
		? viewportH / 2 - (Number(anchor.y) + anchorHeight / 2) * zoom
		: (viewportH - contentH) / 2 - minY * zoom;
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
