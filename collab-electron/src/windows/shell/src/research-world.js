import { tiles } from "./canvas-state.js";

const FIELD_ORDER = {
	mission: ["id", "name", "objective"],
	task: ["id", "title", "description", "status", "assignee_session_id", "delegator_session_id", "steering_state", "review_state", "mission_id"],
	hypothesis: ["id", "claim", "success_criteria", "sources", "status"],
	dataset: ["id", "kind", "as_of", "content_hash", "coverage", "source_artifact"],
	run: ["id", "kind", "status", "trace_id", "params", "dataset_id", "hypothesis_id", "executor_session_id", "result_artifact_id"],
	strategy: ["id", "family", "version", "spec_ref", "content_hash", "stake_model", "score_field", "probability_field"],
	ticket: ["id", "origin", "external_ref", "grade", "placed_at", "stake", "payout"],
	artifact: ["id", "kind", "receipt"],
	evaluation: ["id", "critic_session_id", "rubric", "overall", "verdict", "confidence", "rationale", "block_reason", "findings_artifact_id", "review_task_id", "report_artifact_id"],
	agent_session: ["id", "status", "label"],
};

function tileId(type, id) { return `ontology:${type}:${id}`; }

const WORLD_TILE_WIDTH = 420;
const WORLD_TILE_HEIGHT = 280;
const WORLD_LANE_GAP = 24;
const WORLD_ROW_GAP = 24;
const WORLD_COLLISION_STEP = 20;
const WORLD_TYPE_ORDER = new Map([
	["mission", 0], ["task", 1], ["hypothesis", 2], ["dataset", 3],
	["run", 4], ["artifact", 5], ["evaluation", 6],
	["strategy", 5], ["ticket", 6],
]);

function laneFor(object) {
	if (object?.type === "evaluation") return 2;
	if (object?.type === "artifact" && object?.fields?.kind === "report") return 2;
	if (["dataset", "run", "strategy", "artifact"].includes(object?.type)) return 1;
	return 0;
}

function overlaps(a, b) {
	return a.x < b.x + b.width && a.x + a.width > b.x &&
		a.y < b.y + b.height && a.y + a.height > b.y;
}

function rectFor(tile) {
	return {
		x: Number(tile?.x) || 0,
		y: Number(tile?.y) || 0,
		width: Number(tile?.width) || WORLD_TILE_WIDTH,
		height: Number(tile?.height) || WORLD_TILE_HEIGHT,
	};
}

export function latestSavedWorldRoot(canvasTiles) {
	return [...(Array.isArray(canvasTiles) ? canvasTiles : [])].reverse().find((tile) =>
		tile?.type === "research" && (tile.ontologyType === "mission" || tile.ontologyType === "task")
	) || null;
}

export function researchWorldLayoutIsMalformed(worldTiles) {
	const memberTiles = (Array.isArray(worldTiles) ? worldTiles : []).filter((tile) => tile?.type === "research");
	if (memberTiles.length < 2) return false;
	const xs = memberTiles.map((tile) => Number(tile.x) || 0);
	const ys = memberTiles.map((tile) => Number(tile.y) || 0);
	const horizontalSpan = Math.max(...xs) - Math.min(...xs);
	const verticalSpan = Math.max(...ys) - Math.min(...ys);
	return horizontalSpan < WORLD_TILE_WIDTH || verticalSpan > 2_500;
}

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

export function researchSessionReceiptFields(object) {
	const fields = object?.fields || {};
	return ["id", "status", "label"].map((field) => ({
		field,
		value: displayValue(fields[field], Object.prototype.hasOwnProperty.call(fields, field)),
	}));
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
	if (object.type === "artifact" && object.fields?.receipt?.preview) {
		try {
			const payload = JSON.parse(object.fields.receipt.preview);
			if (payload?.contract === "qf.execution.result.v1" && Array.isArray(payload.selected)) {
				for (const selection of payload.selected) {
					const row = document.createElement("div");
					row.className = "qf-outcome-row";
					row.dataset.selectionRef = String(selection?.id ?? "");
					const state = document.createElement("span");
					state.className = "qf-outcome-state";
					state.textContent = "PENDING OUTCOME";
					const button = document.createElement("button");
					button.type = "button";
					button.textContent = "Record settled outcome";
					button.setAttribute("aria-label", `Record settled outcome ${row.dataset.selectionRef}`);
					button.addEventListener("click", () => {
						const form = document.createElement("form");
						form.className = "qf-outcome-form";
						for (const name of ["external_ref", "settled_at", "decimal_odds", "closing_decimal_odds", "stake", "payout"]) {
							const input = document.createElement("input"); input.name = name; input.placeholder = name; form.appendChild(input);
						}
						const outcome = document.createElement("select"); outcome.name = "outcome"; for (const value of ["win", "loss", "push", "void"]) { const option = document.createElement("option"); option.value = value; option.textContent = value; outcome.appendChild(option); } form.appendChild(outcome);
						const submit = document.createElement("button"); submit.type = "submit"; submit.textContent = "Save outcome"; form.appendChild(submit);
						const message = document.createElement("span"); message.className = "qf-outcome-message"; form.appendChild(message);
						form.addEventListener("submit", async (event) => {
							event.preventDefault();
							const input = Object.fromEntries([...form.elements].filter((entry) => entry.name).map((entry) => [entry.name, entry.value]));
							try { const result = await window.shellApi.qf.recordStrategyOutcome({ run_id: object.fields?.run_id ?? "", selection_ref: row.dataset.selectionRef, ...input, payout: input.payout === "" ? null : input.payout }); if (!result?.ok) throw new Error(result?.error?.message ?? "Outcome refused"); message.textContent = "Recorded"; state.textContent = String(input.outcome).toUpperCase(); } catch (error) { message.textContent = error?.message ?? String(error); }
						});
						row.appendChild(form); button.remove();
					});
					row.append(state, button); details.appendChild(row);
				}
			}
		} catch { /* unavailable or truncated previews remain inspectable through receipt */ }
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
			const taskFoot = dom.taskFoot;
			if (taskFoot) {
				const receipts = [...taskFoot.children].filter((child) => child.classList.contains("qf-world-session-receipt"));
				const receipt = receipts[0] || document.createElement("div");
				if (receipts.length === 0) {
					receipt.className = "qf-world-session-receipt";
					taskFoot.appendChild(receipt);
				}
				for (const duplicate of receipts.slice(1)) duplicate.remove();
				receipt.replaceChildren(...researchSessionReceiptFields(object).map(({ field, value }) => makeField(field, value)));
			}
		}
		return tile;
	}

	function positionFor(nextY, object, rootTile, occupied) {
		const lane = laneFor(object);
		const candidate = {
			x: rootTile.x + lane * (WORLD_TILE_WIDTH + WORLD_LANE_GAP),
			y: nextY[lane],
			width: WORLD_TILE_WIDTH,
			height: WORLD_TILE_HEIGHT,
		};
		while (occupied.some((other) => overlaps(candidate, other))) candidate.y += WORLD_COLLISION_STEP;
		nextY[lane] = candidate.y + WORLD_TILE_HEIGHT + WORLD_ROW_GAP;
		occupied.push(candidate);
		return { x: candidate.x, y: candidate.y };
	}

	async function reveal(rootType, rootId) {
		const result = await window.shellApi.qf.getResearchWorldProjection({ root_type: rootType, root_id: rootId });
		if (!result?.ok) { showStatus?.(result?.message || "Research world unavailable"); return result; }
		lastRoot = { type: rootType, id: rootId };
		lastWorld = result.world;
		const worldResearchIds = new Set(result.world.objects
			.filter((object) => object.type !== "agent_session")
			.map((object) => tileId(object.type, object.id)));
		const worldSessionIds = new Set(result.world.objects
			.filter((object) => object.type === "agent_session")
			.map((object) => object.id));
		const staleProjectionIds = tiles.filter((tile) =>
			(tile.type === "research" && !worldResearchIds.has(tile.id)) ||
			(tile.type === "term" && tile.sessionId && !tile.ptySessionId && !worldSessionIds.has(tile.sessionId))
		).map((tile) => tile.id);
		if (staleProjectionIds.length > 0) tileManager.removeProjectionTiles?.(staleProjectionIds);
		let rootTile = existing(rootType, rootId);
		if (!rootTile) {
			const rootObject = result.world.objects.find((object) => object.type === rootType && object.id === rootId);
			const occupied = tiles.map(rectFor);
			const candidate = { x: 80, y: 80, width: WORLD_TILE_WIDTH, height: WORLD_TILE_HEIGHT };
			while (occupied.some((other) => overlaps(candidate, other))) candidate.y += WORLD_COLLISION_STEP;
			rootTile = tileManager.createResearchTile(candidate.x, candidate.y, rootObject);
		}
		const existingWorldResearch = tiles.filter((tile) => worldResearchIds.has(tile.id));
		const repairMalformedLayout = researchWorldLayoutIsMalformed(existingWorldResearch);
		const layoutIds = new Set(existingWorldResearch.map((tile) => tile.id));
		const occupied = tiles.filter((tile) => !layoutIds.has(tile.id) && !worldSessionIds.has(tile.sessionId)).map(rectFor);
		occupied.push(rectFor(rootTile));
		const nextY = [
			rootTile.y + WORLD_TILE_HEIGHT + WORLD_ROW_GAP,
			rootTile.y,
			rootTile.y,
		];
		const ordered = [...result.world.objects].sort((a, b) =>
			laneFor(a) - laneFor(b) ||
			(WORLD_TYPE_ORDER.get(a.type) ?? 99) - (WORLD_TYPE_ORDER.get(b.type) ?? 99) ||
			a.id.localeCompare(b.id));
		const projectedLayout = [];
		if (repairMalformedLayout) {
			const sessionTiles = result.world.objects
				.filter((object) => object.type === "agent_session")
				.map((object) => tiles.find((tile) => tile.sessionId === object.id))
				.filter(Boolean);
			for (const [index, tile] of sessionTiles.entries()) {
				const candidate = {
					x: rootTile.x + index * (WORLD_TILE_WIDTH + WORLD_LANE_GAP),
					y: rootTile.y - 520,
					width: Number(tile.width) || 400,
					height: Number(tile.height) || 500,
				};
				while (occupied.some((other) => overlaps(candidate, other))) candidate.y -= WORLD_COLLISION_STEP;
				occupied.push(candidate);
				projectedLayout.push({ ...tile, x: candidate.x, y: candidate.y });
			}
		}
		for (const object of ordered) {
			if (object.type === "agent_session") { decorateSession(object); continue; }
			let tile = existing(object.type, object.id);
			if (tile?.id === rootTile.id) { renderTile(getTileDOMs().get(tile.id), tile, object); continue; }
			const pos = positionFor(nextY, object, rootTile, occupied);
			if (!tile) tile = tileManager.createResearchTile(pos.x, pos.y, object);
			else {
				renderTile(getTileDOMs().get(tile.id), tile, object);
				if (repairMalformedLayout) projectedLayout.push({ ...tile, ...pos });
			}
		}
		if (repairMalformedLayout && projectedLayout.length > 0) tileManager.applyTileLayout?.(projectedLayout);
		if (staleProjectionIds.length > 0 || projectedLayout.length > 0) tileManager.saveCanvasImmediate?.();
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
		const worldMemberTiles = tiles.filter((tile) =>
			worldResearchIds.has(tile.id) || worldSessionIds.has(tile.sessionId));
		tileManager.onResearchWorldReady?.(worldMemberTiles);
		return result;
	}

	function hydrateSaved() {
		const root = latestSavedWorldRoot(tiles);
		if (root) void reveal(root.ontologyType, root.ontologyId);
	}

	return { reveal, renderTile, hydrateSaved, getLastWorld: () => lastWorld, getLastRoot: () => lastRoot };
}
