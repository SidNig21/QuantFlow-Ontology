const DEFAULT_LAYOUT = {
	margin: 40,
	columnWidth: 420,
	gutter: 24,
	baseline: 20,
};

function finite(value, fallback) {
	return Number.isFinite(value) ? value : fallback;
}

function snap(value, baseline) {
	return Math.round(finite(value, 0) / baseline) * baseline;
}

function rect(tile) {
	return {
		x: finite(tile?.x, 0),
		y: finite(tile?.y, 0),
		width: Math.max(20, finite(tile?.width, 420)),
		height: Math.max(20, finite(tile?.height, 280)),
	};
}

function overlaps(a, b) {
	return a.x < b.x + b.width &&
		a.x + a.width > b.x &&
		a.y < b.y + b.height &&
		a.y + a.height > b.y;
}

function stableOrder(a, b) {
	return finite(a?.y, 0) - finite(b?.y, 0) ||
		finite(a?.x, 0) - finite(b?.x, 0) ||
		finite(a?.zIndex, 0) - finite(b?.zIndex, 0) ||
		String(a?.id ?? "").localeCompare(String(b?.id ?? ""));
}

function viewportWorldWidth(options, tokens) {
	const width = finite(options?.viewportWidth, tokens.columnWidth * 2 + tokens.gutter + tokens.margin * 2);
	const zoom = finite(options?.zoom, 1);
	return options?.screenSpace === true ? width / Math.max(zoom, 0.01) : width;
}

function viewportWorldRight(options, tokens, originX) {
	if (options?.screenSpace !== true) return viewportWorldWidth(options, tokens);
	const zoom = Math.max(finite(options?.zoom, 1), 0.01);
	const width = finite(options?.viewportWidth, tokens.columnWidth * 2 + tokens.gutter + tokens.margin * 2);
	return originX + Math.max(tokens.columnWidth, width - tokens.margin * 2) / zoom;
}

/**
 * Pack eligible canvas tiles into a deterministic, readable flow grid.
 * The tile objects remain the projection cache. This helper is deliberately
 * ephemeral: it never persists geometry, invents IDs, or touches session
 * identity.
 */
export function repackTilesToGrid(layout, options = {}) {
	const tokens = { ...DEFAULT_LAYOUT, ...(options.tokens ?? {}) };
	const tiles = Array.isArray(layout) ? layout : [];
	const locked = tiles.filter((tile) => tile?.locked === true).map(rect);
	const moving = tiles.filter((tile) => tile?.locked !== true).slice().sort(stableOrder);
	const occupied = locked.slice();
	const originX = finite(options?.originX, tokens.margin);
	const originY = finite(options?.originY, tokens.margin);
	const rightLimit = Math.max(
		originX + tokens.columnWidth,
		viewportWorldRight(options, tokens, originX),
	);
	let x = originX;
	let y = originY;
	let rowHeight = 0;
	let tidied = 0;

	function nextRow() {
		x = originX;
		y = snap(y + Math.max(rowHeight, tokens.baseline) + tokens.gutter, tokens.baseline);
		rowHeight = 0;
	}

	for (const tile of moving) {
		const size = rect(tile);
		let candidate;
		while (true) {
			candidate = {
				x: snap(x, tokens.baseline),
				y: snap(y, tokens.baseline),
				width: size.width,
				height: size.height,
			};
			// A wide tile may exceed the nominal column width, but it should
			// still start a row rather than clip into the next grid column.
			if (candidate.x > originX && candidate.x + candidate.width > rightLimit) {
				nextRow();
				continue;
			}
			const blocker = occupied.find((other) => overlaps(candidate, other));
			if (!blocker) break;
			// Move past the blocker in the current row. If the blocker is tall,
			// repeated row advances naturally clear it without moving the lock.
			x = Math.max(x + tokens.baseline, blocker.x + blocker.width + tokens.gutter);
		}

		if (tile.x !== candidate.x || tile.y !== candidate.y) tidied++;
		tile.x = candidate.x;
		tile.y = candidate.y;
		occupied.push(candidate);
		rowHeight = Math.max(rowHeight, candidate.height);
		x = candidate.x + tokens.columnWidth + tokens.gutter;
		if (x + tokens.columnWidth > rightLimit) {
			nextRow();
		}
	}

	return { tidied, skipped: locked.length };
}

export function formatTidyToast(result = {}) {
	const tidied = Math.max(0, finite(result.tidied, 0));
	const skipped = Math.max(0, finite(result.skipped, 0));
	const message = tidied === 0
		? "No tiles to tidy"
		: `Tidied ${tidied} tile${tidied === 1 ? "" : "s"}`;
	return skipped > 0 ? `${message}; ${skipped} locked skipped` : message;
}
