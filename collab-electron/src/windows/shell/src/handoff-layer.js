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

export function createHandoffLayer({ layerEl, viewportState, getTiles }) {
	let handoffs = [];

	function update() {
		layerEl.replaceChildren();
		for (const handoff of handoffs) {
			const from = getTiles().find((tile) => tile.sessionId === handoff.fromSessionId);
			const to = getTiles().find((tile) => tile.sessionId === handoff.toSessionId);
			if (!from || !to) continue;

			const endpoints = handoffEdgeEndpoints(from, to);
			const x1 = endpoints.from.x * viewportState.zoom + viewportState.panX;
			const y1 = endpoints.from.y * viewportState.zoom + viewportState.panY;
			const x2 = endpoints.to.x * viewportState.zoom + viewportState.panX;
			const y2 = endpoints.to.y * viewportState.zoom + viewportState.panY;

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
