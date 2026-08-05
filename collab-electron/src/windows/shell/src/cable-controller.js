/**
 * Cable draw + keyboard parity (WO-g5). Kind defaults to view.
 */
import { makePortRef, SIDES } from "./cable-math.js";
import { cableStrokeStyle, runtimeHonoursViewConnections } from "./cable-overlay.js";

/**
 * @param {object} opts
 */
export function createCableController({
	canvasEl,
	overlay,
	getTiles,
	getTileDOMs,
	loadConnections,
	createConnection,
	deleteConnection,
	onConnectionsChanged,
	showToast,
}) {
	/** @type {{ tileId: string, side: 'n'|'e'|'s'|'w' } | null} */
	let drawing = null;
	/** @type {string | null} */
	let focusTileId = null;
	let focusSideIndex = 0;
	/** @type {'from' | 'to'} */
	let keyboardPhase = "from";
	/** @type {{ tileId: string, side: 'n'|'e'|'s'|'w' } | null} */
	let keyboardFrom = null;

	async function refresh() {
		const tiles = getTiles();
		const conns = await loadConnections(tiles.map((t) => t.id));
		onConnectionsChanged?.(conns);
		overlay.redraw();
		return conns;
	}

	function markInvalid(tileId, side, on) {
		const dom = getTileDOMs()?.get(tileId);
		const node = dom?.container?.querySelector(`.gl-node--${side}`);
		node?.classList.toggle("gl-node--invalid", Boolean(on));
	}

	function clearInvalid() {
		for (const tile of getTiles()) {
			for (const side of SIDES) markInvalid(tile.id, side, false);
		}
	}

	function portFromEventTarget(target) {
		const node = target?.closest?.(".gl-node");
		if (!node) return null;
		const tileEl = node.closest(".canvas-tile");
		const tileId = tileEl?.dataset?.tileId;
		const side = node.dataset.side;
		if (!tileId || !SIDES.includes(side)) return null;
		return { tileId, side };
	}

	async function commit(from, to) {
		clearInvalid();
		overlay.clearPreview();
		drawing = null;
		keyboardFrom = null;
		keyboardPhase = "from";
		if (!from || !to || from.tileId === to.tileId) return null;
		try {
			const row = await createConnection({
				from: makePortRef(from.tileId, from.side),
				to: makePortRef(to.tileId, to.side),
				kind: "view",
				canvasTileIds: getTiles().map((t) => t.id),
			});
			await refresh();
			return row;
		} catch (err) {
			showToast?.(err instanceof Error ? err.message : String(err));
			return null;
		}
	}

	function onPointerDown(e) {
		const port = portFromEventTarget(e.target);
		if (!port) return;
		e.stopPropagation();
		e.preventDefault();
		drawing = port;
		focusTileId = port.tileId;
		focusSideIndex = SIDES.indexOf(port.side);
		canvasEl.setPointerCapture?.(e.pointerId);
	}

	function onPointerMove(e) {
		if (!drawing) return;
		const rect = canvasEl.getBoundingClientRect();
		const world = overlay.screenToWorld(
			e.clientX - rect.left,
			e.clientY - rect.top,
		);
		const over = portFromEventTarget(document.elementFromPoint(e.clientX, e.clientY));
		clearInvalid();
		let invalid = false;
		if (over) {
			invalid = over.tileId === drawing.tileId;
			if (invalid) markInvalid(over.tileId, over.side, true);
		}
		const fromTile = getTiles().find((t) => t.id === drawing.tileId);
		overlay.setPreview(fromTile, drawing.side, world, invalid);
	}

	async function onPointerUp(e) {
		if (!drawing) return;
		const over = portFromEventTarget(document.elementFromPoint(e.clientX, e.clientY));
		const from = drawing;
		drawing = null;
		canvasEl.releasePointerCapture?.(e.pointerId);
		if (over && over.tileId !== from.tileId) {
			await commit(from, over);
		} else {
			overlay.clearPreview();
			clearInvalid();
		}
	}

	function cycleSide(delta) {
		focusSideIndex = (focusSideIndex + delta + SIDES.length) % SIDES.length;
		return SIDES[focusSideIndex];
	}

	async function onKeyDown(e) {
		if (e.key === "Escape") {
			drawing = null;
			keyboardFrom = null;
			keyboardPhase = "from";
			overlay.clearPreview();
			clearInvalid();
			return;
		}

		if (e.key === "Delete" || e.key === "Backspace") {
			const id = overlay.getSelectedId?.();
			if (id) {
				e.preventDefault();
				await deleteConnection(id);
				await refresh();
			}
			return;
		}

		const focused = focusTileId || getTiles()[0]?.id;
		if (!focused) return;

		if (e.key === "ArrowRight" || e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "ArrowDown") {
			if (!e.altKey) return;
			e.preventDefault();
			focusTileId = focused;
			const side = cycleSide(
				e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1,
			);
			const dom = getTileDOMs()?.get(focused);
			dom?.container?.querySelectorAll(".gl-node").forEach((n) => {
				n.classList.toggle("gl-node--kbd", n.dataset.side === side);
			});
			return;
		}

		if (e.key === "Enter" && e.altKey) {
			e.preventDefault();
			const side = SIDES[focusSideIndex];
			if (keyboardPhase === "from") {
				keyboardFrom = { tileId: focused, side };
				keyboardPhase = "to";
				showToast?.("Cable: pick target tile, Alt+Enter to commit");
			} else if (keyboardFrom) {
				await commit(keyboardFrom, { tileId: focused, side });
			}
			return;
		}

		if (e.key === "Tab" && keyboardPhase === "to") {
			const tiles = getTiles();
			const idx = tiles.findIndex((t) => t.id === focused);
			if (idx >= 0 && tiles.length > 1) {
				e.preventDefault();
				const next = tiles[(idx + (e.shiftKey ? -1 : 1) + tiles.length) % tiles.length];
				focusTileId = next.id;
			}
		}
	}

	canvasEl.addEventListener("pointerdown", onPointerDown);
	window.addEventListener("pointermove", onPointerMove);
	window.addEventListener("pointerup", onPointerUp);
	window.addEventListener("keydown", onKeyDown);

	// Enable pointer events on nodes while cable UI is live
	const styleBoost = document.createElement("style");
	styleBoost.textContent = `.gl-node { pointer-events: auto; cursor: crosshair; }`;
	document.head.appendChild(styleBoost);

	return {
		refresh,
		commit,
		dispose() {
			canvasEl.removeEventListener("pointerdown", onPointerDown);
			window.removeEventListener("pointermove", onPointerMove);
			window.removeEventListener("pointerup", onPointerUp);
			window.removeEventListener("keydown", onKeyDown);
			styleBoost.remove();
		},
		/** Test seam: drive keyboard commit without pointer. */
		async keyboardCreate(from, to) {
			return commit(from, to);
		},
		honestyProbe(connection) {
			return cableStrokeStyle(connection, runtimeHonoursViewConnections());
		},
	};
}
