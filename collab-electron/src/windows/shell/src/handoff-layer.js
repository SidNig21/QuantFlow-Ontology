const TERMINAL_SESSION_STATUSES = new Set([
	"closed", "failed", "cancelled",
]);

export function handoffEdgeEndpoints(from, to) {
	const center = (rect) => ({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });
	const edge = (rect, target) => {
		const own = center(rect); const dx = target.x - own.x; const dy = target.y - own.y;
		const scale = 1 / Math.max(Math.abs(dx) / (rect.width / 2), Math.abs(dy) / (rect.height / 2), Number.EPSILON);
		return { x: own.x + dx * scale, y: own.y + dy * scale };
	};
	const fromCenter = center(from); const toCenter = center(to);
	return { from: edge(from, toCenter), to: edge(to, fromCenter) };
}

export function handoffPortSides(from, to) {
	const dx = (to.x + to.width / 2) - (from.x + from.width / 2);
	const dy = (to.y + to.height / 2) - (from.y + from.height / 2);
	if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? { from: "e", to: "w" } : { from: "w", to: "e" };
	return dy >= 0 ? { from: "s", to: "n" } : { from: "n", to: "s" };
}

function visibleTileElement(element) {
	return Boolean(element) && element.hidden !== true && element.style?.display !== "none" && element.dataset?.qfProjectionVisibility !== "hidden";
}

/** Resolve the cable against the actual rendered port centers, in layer-local coordinates. */
export function handoffPortEndpoints(from, to, fromElement, toElement, layerRect, fullscreenTileId = null) {
	if (!visibleTileElement(fromElement) || !visibleTileElement(toElement)) return null;
	if (fullscreenTileId && (from.id !== fullscreenTileId || to.id !== fullscreenTileId)) return null;
	const sides = handoffPortSides(from, to);
	const fromPort = fromElement.querySelector?.(`.gl-node--${sides.from}`);
	const toPort = toElement.querySelector?.(`.gl-node--${sides.to}`);
	if (!fromPort || !toPort) return null;
	const point = (port) => {
		const rect = port.getBoundingClientRect();
		return { x: rect.left + rect.width / 2 - layerRect.left, y: rect.top + rect.height / 2 - layerRect.top };
	};
	return { from: point(fromPort), to: point(toPort) };
}

export function visibleTaskHandoffs(handoffs) {
	return (Array.isArray(handoffs) ? handoffs : []).filter((handoff) =>
		String(handoff?.fromSessionId ?? "") !== String(handoff?.toSessionId ?? "") && handoff?.status === "open",
	);
}

export function sessionsForTaskDelegationCanvas(sessions, handoffs) {
	const historicalIds = new Set();
	for (const handoff of handoffs) {
		if (typeof handoff?.fromSessionId === "string") {
			historicalIds.add(handoff.fromSessionId);
		}
		if (typeof handoff?.toSessionId === "string") {
			historicalIds.add(handoff.toSessionId);
		}
	}
	return sessions.filter((session) => {
		const sessionId = typeof session?.id === "string" ? session.id : null;
		if (!sessionId) return false;
		const status = typeof session.status === "string" ? session.status : "";
		return !TERMINAL_SESSION_STATUSES.has(status) || historicalIds.has(sessionId);
	});
}

/**
 * Fetch one durable projection snapshot, ensure its endpoint tiles exist, then
 * draw cables. The ordering prevents a cable refresh racing ahead of tiles.
 */
export async function refreshTaskDelegationCanvas({
	listHandoffs,
	listSessions,
	ensureSessionTile,
	setHandoffs,
}) {
	const handoffResponse = await listHandoffs();
	if (!handoffResponse?.ok || !Array.isArray(handoffResponse.handoffs)) return;
	const sessionResponse = await listSessions();
	if (!sessionResponse?.ok || !Array.isArray(sessionResponse.sessions)) return;
	const handoffs = visibleTaskHandoffs(handoffResponse.handoffs);
	for (const session of sessionsForTaskDelegationCanvas(
		sessionResponse.sessions,
		handoffs,
	)) {
		ensureSessionTile(session.id);
	}
	setHandoffs(handoffs);
}

export function createHandoffLayer({ layerEl, viewportState, getTiles, getTileElement, getFullscreenTileId }) {
	let handoffs = [];

	function update() {
		layerEl.replaceChildren();
		const layerRect = layerEl.getBoundingClientRect();
		const fullscreenTileId = getFullscreenTileId?.() ?? null;
		for (const handoff of handoffs) {
			const from = getTiles().find((tile) => tile.sessionId === handoff.fromSessionId);
			const to = getTiles().find((tile) => tile.sessionId === handoff.toSessionId);
			if (!from || !to) continue;

			const endpoints = handoffPortEndpoints(from, to, getTileElement?.(from.id), getTileElement?.(to.id), layerRect, fullscreenTileId);
			if (!endpoints) continue;
			const x1 = endpoints.from.x;
			const y1 = endpoints.from.y;
			const x2 = endpoints.to.x;
			const y2 = endpoints.to.y;

			const item = document.createElement("div");
			item.className = `handoff-projection ${handoff.status === "done" ? "completed" : "open"}`;

			const line = document.createElement("div");
			line.className = "handoff-line";
			const dx = x2 - x1;
			const dy = y2 - y1;
			line.style.left = `${x1}px`;
			line.style.top = `${y1}px`;
			line.style.width = `${Math.hypot(dx, dy)}px`;
			line.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;

			item.append(line);
			layerEl.appendChild(item);
		}
	}

	return {
		setHandoffs(next) {
			handoffs = visibleTaskHandoffs(next);
			update();
		},
		update,
	};
}
