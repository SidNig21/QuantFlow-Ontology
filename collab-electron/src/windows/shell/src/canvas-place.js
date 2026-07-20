/**
 * Shared canvas placement helpers (WO-008d extract-first).
 * Keeps shell:forward tile handlers tiny so renderer.js does not grow.
 */

/**
 * @param {HTMLElement} canvasEl
 * @param {{ panX: number, panY: number, zoom: number }} viewportState
 * @param {{ width: number, height: number }} size
 * @returns {{ cx: number, cy: number }}
 */
export function centerCanvasCoords(canvasEl, viewportState, size) {
	const rect = canvasEl.getBoundingClientRect();
	return {
		cx:
			(rect.width / 2 - viewportState.panX) /
				viewportState.zoom -
			size.width / 2,
		cy:
			(rect.height / 2 - viewportState.panY) /
				viewportState.zoom -
			size.height / 2,
	};
}
