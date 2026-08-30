function shortId(id) {
	return typeof id === "string" ? id.slice(0, 8) : "";
}

function truncate(text, max = 96) {
	const clean = String(text ?? "").replace(/\s+/g, " ").trim();
	return clean.length <= max ? clean : `${clean.slice(0, max - 3)}...`;
}

const TERMINAL_SESSION_STATUSES = new Set([
	"closed", "failed", "cancelled",
]);

export function visibleTaskHandoffs(handoffs) {
	return (Array.isArray(handoffs) ? handoffs : []).filter((handoff) =>
		String(handoff?.fromSessionId ?? "") !== String(handoff?.toSessionId ?? ""),
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

			const x1 = (from.x + from.width / 2) * viewportState.zoom + viewportState.panX;
			const y1 = (from.y + from.height / 2) * viewportState.zoom + viewportState.panY;
			const x2 = (to.x + to.width / 2) * viewportState.zoom + viewportState.panX;
			const y2 = (to.y + to.height / 2) * viewportState.zoom + viewportState.panY;

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

			const card = document.createElement("div");
			card.className = "handoff-card";
			card.style.left = `${(x1 + x2) / 2}px`;
			card.style.top = `${(y1 + y2) / 2}px`;
			card.innerHTML = "";

			const head = document.createElement("div");
			head.className = "handoff-head";
			const route = document.createElement("strong");
			route.textContent = `${handoff.fromRole} -> ${handoff.toRole}`;
			const status = document.createElement("span");
			status.className = "handoff-status";
			status.textContent = handoff.status;
			head.append(route, status);

			const task = document.createElement("div");
			task.className = "handoff-copy";
			task.textContent = `TASK - ${truncate(handoff.title)}`;
			card.title = `Task ${handoff.taskId}\n${handoff.title}`;
			card.append(head, task);
			const receipt = document.createElement("div");
			receipt.className = "handoff-receipt";
			receipt.textContent = `Kernel ${shortId(handoff.taskId)}`;
			card.appendChild(receipt);

			item.append(line, card);
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
