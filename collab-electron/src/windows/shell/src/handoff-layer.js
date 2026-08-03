function shortId(id) {
	return typeof id === "string" ? id.slice(0, 8) : "";
}

function truncate(text, max = 96) {
	const clean = String(text ?? "").replace(/\s+/g, " ").trim();
	return clean.length <= max ? clean : `${clean.slice(0, max - 3)}...`;
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
			item.className = `handoff-projection ${handoff.status}`;

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
			task.textContent = `TASK - ${truncate(handoff.task)}`;
			card.title = `Task ${handoff.taskArtifactId}\n${handoff.task}`;
			card.append(head, task);
			if (handoff.result) {
				const result = document.createElement("div");
				result.className = "handoff-copy handoff-result";
				result.textContent = `RESULT - ${truncate(handoff.result)}`;
				card.appendChild(result);
			}
			const receipt = document.createElement("div");
			receipt.className = "handoff-receipt";
			receipt.textContent = `Kernel ${shortId(handoff.taskArtifactId)}`;
			card.appendChild(receipt);

			item.append(line, card);
			layerEl.appendChild(item);
		}
	}

	return {
		setHandoffs(next) {
			handoffs = Array.isArray(next) ? next : [];
			update();
		},
		update,
	};
}
