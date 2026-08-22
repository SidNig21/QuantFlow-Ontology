/**
 * Cable SVG overlay (WO-g5). Geometry is pure; honesty = dashed + hollow until
 * the runtime honours view edges (always false in this order).
 */
import {
	connectionPath,
	hitTestPath,
	makePortRef,
	parsePortRef,
	portPosition,
	bezierPath,
	SIDES,
} from "./cable-math.js";
import { cableStateLabel } from "./glacier-feel.js";

const SVG_NS = "http://www.w3.org/2000/svg";

/** Runtime does not honour view edges yet — solid would be a false close. */
export function runtimeHonoursViewConnections() {
	return false;
}

/**
 * @param {{ kind: string }} connection
 * @param {boolean} [honoured]
 */
export function cableStrokeStyle(connection, honoured = runtimeHonoursViewConnections()) {
	const solid = honoured && connection.kind === "view";
	return {
		strokeDasharray: solid ? "none" : "7 5",
		hollowNodes: !solid,
		className: solid ? "cable-path cable-path--live" : "cable-path cable-path--declared",
		label: cableStateLabel(connection, honoured),
	};
}

/**
 * @param {HTMLElement} svgEl
 * @param {object} opts
 */
export function createCableOverlay(svgEl, {
	getTiles,
	getViewport,
	getConnections,
	onSelect,
	onRedrawNeeded,
}) {
	const content = document.createElementNS(SVG_NS, "g");
	content.setAttribute("class", "cable-content");
	svgEl.appendChild(content);

	const preview = document.createElementNS(SVG_NS, "path");
	preview.setAttribute("class", "cable-path cable-path--preview");
	preview.setAttribute("fill", "none");
	preview.style.display = "none";
	svgEl.appendChild(preview);

	let selectedId = null;
	/** @type {Set<string>} */
	const settlingIds = new Set();

	function tilesById() {
		const map = new Map();
		for (const t of getTiles()) {
			map.set(t.id, t);
		}
		return map;
	}

	function worldToScreen(x, y) {
		const { panX, panY, zoom } = getViewport();
		return { x: x * zoom + panX, y: y * zoom + panY };
	}

	function screenToWorld(sx, sy) {
		const { panX, panY, zoom } = getViewport();
		return {
			x: (sx - panX) / zoom,
			y: (sy - panY) / zoom,
		};
	}

	function redraw() {
		while (content.firstChild) content.removeChild(content.firstChild);
		const map = tilesById();
		const honoured = runtimeHonoursViewConnections();
		for (const conn of getConnections()) {
			const geom = connectionPath(conn, map);
			if (!geom) continue;
			const style = cableStrokeStyle(conn, honoured);
			const a = worldToScreen(geom.a.x, geom.a.y);
			const b = worldToScreen(geom.b.x, geom.b.y);
			const d = bezierPath(
				{ ...geom.a, x: a.x, y: a.y },
				{ ...geom.b, x: b.x, y: b.y },
			);
			const path = document.createElementNS(SVG_NS, "path");
			path.setAttribute("d", d);
			path.setAttribute("fill", "none");
			path.setAttribute("class", style.className);
			path.setAttribute("aria-label", style.label);
			const title = document.createElementNS(SVG_NS, "title");
			title.textContent = style.label;
			path.appendChild(title);
			if (style.strokeDasharray !== "none") {
				path.setAttribute("stroke-dasharray", style.strokeDasharray);
			}
			path.dataset.connectionId = conn.id;
			path.dataset.cableState = honoured ? "honoured" : "declared";
			if (conn.qfWorldCableKind) path.dataset.qfWorldCableKind = conn.qfWorldCableKind;
			if (conn.qfWorldCableFrom) path.dataset.qfWorldCableFrom = conn.qfWorldCableFrom;
			if (conn.qfWorldCableTo) path.dataset.qfWorldCableTo = conn.qfWorldCableTo;
			if (conn.id === selectedId) {
				path.classList.add("cable-path--selected");
			}
			if (settlingIds.has(conn.id)) {
				path.classList.add("cable-path--settle");
			}
			path.addEventListener("pointerdown", (e) => {
				e.stopPropagation();
				selectedId = conn.id;
				onSelect?.(conn);
				redraw();
			});
			content.appendChild(path);

			if (conn.id === selectedId) {
				const midX = (a.x + b.x) / 2;
				const midY = (a.y + b.y) / 2 - 10;
				const label = document.createElementNS(SVG_NS, "text");
				label.setAttribute("x", String(midX));
				label.setAttribute("y", String(midY));
				label.setAttribute("text-anchor", "middle");
				label.setAttribute("class", "cable-label");
				label.textContent = style.label;
				content.appendChild(label);
			}
		}
		syncNodeHonesty(honoured);
		onRedrawNeeded?.();
	}

	function playSettle(connectionId) {
		if (!connectionId) return;
		settlingIds.add(connectionId);
		redraw();
		window.setTimeout(() => {
			settlingIds.delete(connectionId);
			redraw();
		}, 520);
	}

	function syncNodeHonesty(honoured) {
		const connected = new Set();
		for (const conn of getConnections()) {
			const from = parsePortRef(conn.from_ref);
			const to = parsePortRef(conn.to_ref);
			if (from) connected.add(makePortRef(from.tileId, from.side));
			if (to) connected.add(makePortRef(to.tileId, to.side));
		}
		for (const tile of getTiles()) {
			const root = [...document.querySelectorAll(".canvas-tile")].find(
				(node) => node.dataset?.tileId === tile.id,
			);
			if (!root) continue;
			for (const side of SIDES) {
				const node = root.querySelector(`.gl-node--${side}`);
				if (!node) continue;
				const ref = makePortRef(tile.id, side);
				const isConnected = connected.has(ref);
				node.classList.toggle("gl-node--connected", isConnected);
				node.classList.toggle(
					"gl-node--hollow",
					isConnected && !honoured,
				);
				node.classList.toggle("gl-node--solid", isConnected && honoured);
			}
		}
	}

	function setPreview(fromTile, fromSide, worldPoint, invalid = false) {
		if (!fromTile || !worldPoint) {
			preview.style.display = "none";
			return;
		}
		const start = portPosition(fromTile, fromSide);
		const a = worldToScreen(start.x, start.y);
		const b = worldToScreen(worldPoint.x, worldPoint.y);
		const end = {
			x: b.x,
			y: b.y,
			dx: -start.dx,
			dy: -start.dy,
		};
		preview.setAttribute(
			"d",
			bezierPath({ ...start, x: a.x, y: a.y }, end),
		);
		preview.setAttribute("stroke-dasharray", "6 5");
		preview.classList.toggle("cable-path--invalid", invalid);
		preview.style.display = "";
	}

	function clearPreview() {
		preview.style.display = "none";
		preview.classList.remove("cable-path--invalid");
	}

	function hitTestScreen(sx, sy) {
		const map = tilesById();
		for (const conn of getConnections()) {
			const geom = connectionPath(conn, map);
			if (!geom) continue;
			const a = worldToScreen(geom.a.x, geom.a.y);
			const b = worldToScreen(geom.b.x, geom.b.y);
			const d = bezierPath(
				{ ...geom.a, x: a.x, y: a.y },
				{ ...geom.b, x: b.x, y: b.y },
			);
			if (hitTestPath(d, sx, sy, 10)) return conn;
		}
		return null;
	}

	return {
		redraw,
		playSettle,
		setPreview,
		clearPreview,
		screenToWorld,
		worldToScreen,
		hitTestScreen,
		getSelectedId: () => selectedId,
		setSelectedId: (id) => {
			selectedId = id;
			redraw();
		},
	};
}
