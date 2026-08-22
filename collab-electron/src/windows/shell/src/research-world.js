import { tiles } from "./canvas-state.js";

const FIELD_ORDER = {
	mission: ["id", "name", "objective"],
	task: ["id", "title", "description", "status", "assignee_session_id", "delegator_session_id", "steering_state", "review_state", "mission_id"],
	hypothesis: ["id", "claim", "success_criteria", "sources", "status"],
	dataset: ["id", "kind", "as_of", "content_hash", "coverage", "source_artifact"],
	run: ["id", "kind", "status", "trace_id", "params", "dataset_id", "hypothesis_id", "executor_session_id", "result_artifact_id"],
	artifact: ["id", "kind", "receipt"],
	evaluation: ["id", "critic_session_id", "rubric", "overall", "verdict", "confidence", "rationale", "block_reason", "findings_artifact_id", "review_task_id", "report_artifact_id"],
	agent_session: ["id", "status", "label"],
};

function tileId(type, id) { return `ontology:${type}:${id}`; }

export function resolveResearchWorldEndpointTileId(objects, canvasTiles, endpointId) {
	const matchingObjects = (Array.isArray(objects) ? objects : []).filter((object) => object?.id === endpointId);
	if (matchingObjects.length !== 1) return null;

	const object = matchingObjects[0];
	const matchingTiles = (Array.isArray(canvasTiles) ? canvasTiles : []).filter((tile) => {
		if (object.type === "agent_session") return tile?.type !== "research" && tile?.sessionId === object.id;
		return tile?.type === "research" && tile?.ontologyType === object.type && tile?.ontologyId === object.id;
	});
	return matchingTiles.length === 1 ? matchingTiles[0].id : null;
}

function displayValue(value, exists = true) {
	if (!exists || value === null || value === undefined) return "Not recorded";
	if (typeof value === "object") return JSON.stringify(value);
	if (value === "") return "[empty string]";
	return String(value);
}

function objectPrimary(object) {
	const fields = object.fields || {};
	return fields.name || fields.title || fields.claim || fields.verdict || fields.kind || fields.status || object.id;
}

function makeField(field, value, exists) {
	const row = document.createElement("div");
	row.className = "qf-world-field";
	row.dataset.qfWorldField = field;
	const label = document.createElement("span");
	label.className = "qf-world-field-label";
	label.textContent = field;
	const content = document.createElement("span");
	content.className = "qf-world-field-value";
	content.textContent = displayValue(value, exists);
	content.title = content.textContent;
	row.append(label, content);
	return row;
}

function renderObject(dom, tile, object, onReveal) {
	if (!dom?.contentArea || !object) return;
	const container = dom.container;
	if (container._qfWorldKeyHandler) container.removeEventListener("keydown", container._qfWorldKeyHandler);
	container.dataset.qfWorldType = object.type;
	container.dataset.qfWorldId = object.id;
	container.setAttribute("aria-label", `${object.type} ${object.id}`);
	dom.contentArea.replaceChildren();
	const compact = document.createElement("div");
	compact.className = "qf-world-compact";
	compact.textContent = `${object.type} · ${objectPrimary(object)} · ${object.id}`;
	const controls = document.createElement("div");
	controls.className = "qf-world-controls";
	const inspect = document.createElement("button");
	inspect.type = "button";
	inspect.className = "qf-world-inspect";
	inspect.textContent = "Inspect";
	inspect.setAttribute("aria-label", `Inspect ${object.type} ${object.id}`);
	const details = document.createElement("div");
	details.className = "qf-world-details";
	details.hidden = true;
	for (const field of FIELD_ORDER[object.type] || Object.keys(object.fields || {})) {
		const exists = Object.prototype.hasOwnProperty.call(object.fields || {}, field);
		details.appendChild(makeField(field, object.fields?.[field], exists));
	}
	if ((object.type === "mission" || object.type === "task") && onReveal) {
		const reveal = document.createElement("button");
		reveal.type = "button";
		reveal.className = "qf-world-reveal";
		reveal.textContent = "Show research world";
		reveal.setAttribute("aria-label", `Show research world ${object.type} ${object.id}`);
		reveal.addEventListener("click", (event) => {
			event.stopPropagation();
			onReveal(object.type, object.id);
		});
		controls.appendChild(reveal);
	}
	if (object.type === "evaluation" && ["rejects", "inconclusive"].includes(String(object.fields?.verdict))) {
		const blocked = document.createElement("div");
		blocked.className = "qf-world-blocked";
		blocked.textContent = "PUBLICATION BLOCKED";
		details.appendChild(blocked);
		for (const [label, action] of [["Request revision", "requestRevision"], ["Second critic", "requestSecondCritic"]]) {
			const button = document.createElement("button");
			button.type = "button";
			button.textContent = label;
			button.setAttribute("aria-label", `${label} evaluation ${object.id}`);
			button.addEventListener("click", async (event) => {
				event.stopPropagation();
				const sourceTaskId = object.fields?.review_task_id || object.fields?.source_task_id;
				if (sourceTaskId && window.shellApi.qf[action]) await window.shellApi.qf[action]({ sourceTaskId, evaluationId: object.id, attemptId: crypto.randomUUID() });
			});
			details.appendChild(button);
		}
	}
	inspect.addEventListener("click", (event) => {
		event.stopPropagation();
		details.hidden = !details.hidden;
		inspect.textContent = details.hidden ? "Inspect" : "Collapse";
	});
	controls.appendChild(inspect);
	dom.contentArea.append(compact, controls, details);
	container.tabIndex = 0;
	const keyHandler = (event) => {
		if (event.key === "Enter") { event.preventDefault(); inspect.click(); }
		if (event.key === "Escape" && !details.hidden) { event.preventDefault(); details.hidden = true; inspect.textContent = "Inspect"; }
	};
	container._qfWorldKeyHandler = keyHandler;
	container.addEventListener("keydown", keyHandler);
}

export function createResearchWorldController({ tileManager, getTileDOMs, onCables, showStatus }) {
	let lastRoot = null;
	let lastWorld = null;

	function renderTile(dom, tile, object) {
		const found = object || lastWorld?.objects?.find((entry) => entry.type === tile.ontologyType && entry.id === tile.ontologyId);
		if (found) renderObject(dom, tile, found, reveal);
	}

	function existing(type, id) {
		return tiles.find((tile) => tile.id === tileId(type, id));
	}

	function decorateSession(object) {
		const tile = tiles.find((entry) => entry.sessionId === object.id);
		const dom = tile && getTileDOMs().get(tile.id);
		if (dom) {
			dom.container.dataset.qfWorldType = object.type;
			dom.container.dataset.qfWorldId = object.id;
			dom.container.setAttribute("aria-label", `${object.type} ${object.id}`);
		}
		return tile;
	}

	function positionFor(index, object, rootTile) {
		const lane = { mission: 0, task: 0, hypothesis: 0, dataset: 1, run: 1, artifact: 1, evaluation: 2 }[object.type] ?? 0;
		const order = ["mission", "task", "hypothesis", "dataset", "run", "artifact", "evaluation"].indexOf(object.type);
		return { x: rootTile.x + lane * 444, y: rootTile.y + Math.max(0, order + index) * 304 };
	}

	async function reveal(rootType, rootId) {
		const result = await window.shellApi.qf.getResearchWorldProjection({ root_type: rootType, root_id: rootId });
		if (!result?.ok) { showStatus?.(result?.message || "Research world unavailable"); return result; }
		lastRoot = { type: rootType, id: rootId };
		lastWorld = result.world;
		let rootTile = existing(rootType, rootId);
		if (!rootTile) rootTile = tileManager.createResearchTile(80, 80, result.world.objects.find((object) => object.type === rootType && object.id === rootId));
		const ordered = [...result.world.objects].sort((a, b) => a.type.localeCompare(b.type) || a.id.localeCompare(b.id));
		for (const [index, object] of ordered.entries()) {
			if (object.type === "agent_session") { decorateSession(object); continue; }
			let tile = existing(object.type, object.id);
			if (!tile) { const pos = positionFor(index, object, rootTile); tile = tileManager.createResearchTile(pos.x, pos.y, object); }
			else renderTile(getTileDOMs().get(tile.id), tile, object);
		}
		const cables = result.world.links.map((link) => {
			const fromTileId = resolveResearchWorldEndpointTileId(result.world.objects, tiles, link.from_id);
			const toTileId = resolveResearchWorldEndpointTileId(result.world.objects, tiles, link.to_id);
			if (!fromTileId || !toTileId) return null;
			return {
				id: `research-view:${link.kind}:${link.from_id}:${link.to_id}`,
				kind: "view",
				from_ref: `${fromTileId}:e`,
				to_ref: `${toTileId}:w`,
				qfWorldCableKind: link.kind,
				qfWorldCableFrom: link.from_id,
				qfWorldCableTo: link.to_id,
			};
		}).filter(Boolean);
		onCables?.(cables);
		return result;
	}

	function hydrateSaved() {
		const roots = tiles.filter((tile) => tile.type === "research" && (tile.ontologyType === "mission" || tile.ontologyType === "task"));
		const root = roots[0];
		if (root) void reveal(root.ontologyType, root.ontologyId);
	}

	return { reveal, renderTile, hydrateSaved, getLastWorld: () => lastWorld, getLastRoot: () => lastRoot };
}
