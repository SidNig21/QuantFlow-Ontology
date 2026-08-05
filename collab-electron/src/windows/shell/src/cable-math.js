/**
 * Pure cable geometry (WO-g5). Ported from QuantFlow cable-math with Ontology
 * port ids (`tileId:n|e|s|w`) and curvature k = clamp(dist * 0.4, 40, 160).
 */

export const SIDES = /** @type {const} */ (["n", "e", "s", "w"]);

/**
 * @typedef {Object} PortPoint
 * @property {number} x
 * @property {number} y
 * @property {number} dx
 * @property {number} dy
 */

/**
 * @param {{x: number, y: number, width: number, height: number}} tile
 * @param {'n'|'e'|'s'|'w'} side
 * @returns {PortPoint}
 */
export function portPosition(tile, side) {
	const { x, y, width: w, height: h } = tile;
	switch (side) {
		case "n":
			return { x: x + w / 2, y, dx: 0, dy: -1 };
		case "s":
			return { x: x + w / 2, y: y + h, dx: 0, dy: 1 };
		case "e":
			return { x: x + w, y: y + h / 2, dx: 1, dy: 0 };
		case "w":
			return { x, y: y + h / 2, dx: -1, dy: 0 };
		default: {
			const _exhaustive = side;
			throw new Error(`Unknown port side: ${_exhaustive}`);
		}
	}
}

/**
 * @param {string} portRef `tileId:side`
 * @returns {{ tileId: string, side: 'n'|'e'|'s'|'w' } | null}
 */
export function parsePortRef(portRef) {
	if (typeof portRef !== "string") return null;
	const colon = portRef.lastIndexOf(":");
	if (colon <= 0) return null;
	const tileId = portRef.slice(0, colon);
	const side = portRef.slice(colon + 1);
	if (!tileId || !SIDES.includes(/** @type {'n'|'e'|'s'|'w'} */ (side))) {
		return null;
	}
	return { tileId, side: /** @type {'n'|'e'|'s'|'w'} */ (side) };
}

/**
 * @param {string} tileId
 * @param {'n'|'e'|'s'|'w'} side
 */
export function makePortRef(tileId, side) {
	return `${tileId}:${side}`;
}

/**
 * @param {PortPoint} a
 * @param {PortPoint} b
 * @returns {string} SVG path d
 */
export function bezierPath(a, b) {
	const dist = Math.hypot(b.x - a.x, b.y - a.y);
	const k = Math.min(160, Math.max(40, dist * 0.4));
	const c1 = { x: a.x + a.dx * k, y: a.y + a.dy * k };
	const c2 = { x: b.x + b.dx * k, y: b.y + b.dy * k };
	return `M ${a.x} ${a.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${b.x} ${b.y}`;
}

/**
 * @param {{ id: string, from_ref: string, to_ref: string, kind: string }} connection
 * @param {Map<string, {x:number,y:number,width:number,height:number}>} tilesById
 * @returns {{ d: string, a: PortPoint, b: PortPoint } | null}
 */
export function connectionPath(connection, tilesById) {
	const from = parsePortRef(connection.from_ref);
	const to = parsePortRef(connection.to_ref);
	if (!from || !to) return null;
	const fromTile = tilesById.get(from.tileId);
	const toTile = tilesById.get(to.tileId);
	if (!fromTile || !toTile) return null;
	const a = portPosition(fromTile, from.side);
	const b = portPosition(toTile, to.side);
	return { d: bezierPath(a, b), a, b };
}

/**
 * Hit-test a screen/world point against a cubic path (coarse sampling).
 * @param {string} d
 * @param {number} x
 * @param {number} y
 * @param {number} [threshold=8]
 */
export function hitTestPath(d, x, y, threshold = 8) {
	const m = /^M\s+([-\d.]+)\s+([-\d.]+)\s+C\s+([-\d.]+)\s+([-\d.]+),\s+([-\d.]+)\s+([-\d.]+),\s+([-\d.]+)\s+([-\d.]+)$/.exec(
		d,
	);
	if (!m) return false;
	const ax = Number(m[1]);
	const ay = Number(m[2]);
	const c1x = Number(m[3]);
	const c1y = Number(m[4]);
	const c2x = Number(m[5]);
	const c2y = Number(m[6]);
	const bx = Number(m[7]);
	const by = Number(m[8]);
	const thr2 = threshold * threshold;
	for (let i = 0; i <= 24; i++) {
		const t = i / 24;
		const u = 1 - t;
		const px =
			u * u * u * ax +
			3 * u * u * t * c1x +
			3 * u * t * t * c2x +
			t * t * t * bx;
		const py =
			u * u * u * ay +
			3 * u * u * t * c1y +
			3 * u * t * t * c2y +
			t * t * t * by;
		const dx = px - x;
		const dy = py - y;
		if (dx * dx + dy * dy <= thr2) return true;
	}
	return false;
}
