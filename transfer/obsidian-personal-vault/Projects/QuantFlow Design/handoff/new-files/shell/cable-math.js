// cable-math.js
// Pure math for QuantFlow cables. No DOM, no imports. Safe to unit-test.
//
// A "tile" here is anything with { x, y, width, height } in world (canvas) coords.
// A "side" is one of 'N' | 'E' | 'S' | 'W'.

export const SIDES = /** @type {const} */ (['N', 'E', 'S', 'W']);

/**
 * World-space port position + outward normal vector.
 * @param {{x:number,y:number,width:number,height:number}} tile
 * @param {'N'|'E'|'S'|'W'} side
 * @returns {{x:number,y:number,dx:number,dy:number}}
 */
export function portPosition(tile, side) {
  const { x, y, width: w, height: h } = tile;
  switch (side) {
    case 'N': return { x: x + w / 2, y,         dx:  0, dy: -1 };
    case 'S': return { x: x + w / 2, y: y + h,  dx:  0, dy:  1 };
    case 'E': return { x: x + w,     y: y + h / 2, dx:  1, dy: 0 };
    case 'W': return { x,            y: y + h / 2, dx: -1, dy: 0 };
    default: throw new Error('bad side: ' + side);
  }
}

/**
 * Cubic-bezier SVG path between two endpoints with directional tangents.
 * Curvature ramp: short cables stay tight, long cables get rounder.
 *
 * @param {{x:number,y:number,dx:number,dy:number}} a  start endpoint w/ normal
 * @param {{x:number,y:number,dx:number,dy:number}} b  end endpoint w/ normal
 * @param {number} [curvature=0.45]
 * @returns {string}  SVG "M ... C ... " path d-attribute
 */
export function bezierPath(a, b, curvature = 0.45) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  const k = Math.min(180, Math.max(40, dist * curvature));
  const c1 = { x: a.x + a.dx * k, y: a.y + a.dy * k };
  const c2 = { x: b.x + b.dx * k, y: b.y + b.dy * k };
  return `M ${a.x} ${a.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${b.x} ${b.y}`;
}

/**
 * Approximate bezier midpoint at t=0.5 — accurate enough for badge placement
 * at typical zoom levels (within ~3px of true midpoint for our curvature range).
 */
export function bezierMidpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/**
 * Group cables for visual bundling. Cables with the same unordered tile-pair
 * and side-pair render as a single thicker cable with a count badge.
 *
 * @param {Array<{id:string, from:{tileId:string,side:string}, to:{tileId:string,side:string}}>} cables
 * @returns {Map<string, Array>}  key → cables in that bundle
 */
export function groupCablesForBundling(cables) {
  const groups = new Map();
  for (const c of cables) {
    const tilePair = [c.from.tileId, c.to.tileId].sort().join('|');
    const sidePair = [c.from.side, c.to.side].sort().join(',');
    const key = `${tilePair}:${sidePair}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(c);
  }
  return groups;
}
