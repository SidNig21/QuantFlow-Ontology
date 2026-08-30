import { tiles } from "./canvas-state.js";
import { participantFieldRows } from "./participant-projection.js";

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

const WORLD_TILE_WIDTH = 300;
const WORLD_TILE_HEIGHT = 190;
const WORLD_LANE_GAP = 160;
const WORLD_ROW_GAP = 40;
const WORLD_COLLISION_STEP = 20;
const WORKFLOW_STAGE_STEP = WORLD_TILE_WIDTH + WORLD_LANE_GAP;
export const RESEARCH_PROJECTION_STATES = Object.freeze({
	ORDINARY_CANVAS: "ORDINARY_CANVAS",
	CURRENT_MISSION: "CURRENT_MISSION",
	FULL_LINEAGE: "FULL_LINEAGE",
});
const PROJECTION_ORDINARY = RESEARCH_PROJECTION_STATES.ORDINARY_CANVAS;
const PROJECTION_MISSION = RESEARCH_PROJECTION_STATES.CURRENT_MISSION;
const PROJECTION_FULL = RESEARCH_PROJECTION_STATES.FULL_LINEAGE;
const WORKFLOW_STAGE_LABELS = Object.freeze(["Mission", "Work", "Evidence", "Evaluation", "Current Report"]);
const WORLD_TYPE_ORDER = new Map([
	["mission", 0], ["task", 1], ["hypothesis", 2], ["dataset", 3],
	["run", 4], ["artifact", 5], ["evaluation", 6],
	["strategy", 5], ["ticket", 6],
]);

const SESSION_TILE_WIDTH = WORLD_TILE_WIDTH;
const SESSION_TILE_HEIGHT = WORLD_TILE_HEIGHT;

function laneFor(object) {
	if (["evaluation"].includes(object?.type)) return 3;
	if (object?.type === "artifact" && object?.fields?.kind === "report") return 3;
	if (["run", "artifact", "strategy"].includes(object?.type)) return 2;
	if (["hypothesis", "dataset"].includes(object?.type)) return 1;
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

const CABLE_SIDES = Object.freeze(["n", "e", "s", "w"]);

function cablePortPoint(tile, side) {
	const { x, y, width, height } = rectFor(tile);
	if (side === "n") return { x: x + width / 2, y, dx: 0, dy: -1 };
	if (side === "e") return { x: x + width, y: y + height / 2, dx: 1, dy: 0 };
	if (side === "s") return { x: x + width / 2, y: y + height, dx: 0, dy: 1 };
	return { x, y: y + height / 2, dx: -1, dy: 0 };
}

function cableCurvePoints(fromTile, fromSide, toTile, toSide, samples = 96, curveLength = null) {
	const a = cablePortPoint(fromTile, fromSide);
	const b = cablePortPoint(toTile, toSide);
	const distance = Math.hypot(b.x - a.x, b.y - a.y);
	const curve = curveLength ?? Math.min(160, Math.max(40, distance * 0.4));
	const c1 = { x: a.x + a.dx * curve, y: a.y + a.dy * curve };
	const c2 = { x: b.x + b.dx * curve, y: b.y + b.dy * curve };
	return Array.from({ length: samples - 1 }, (_, index) => {
		const t = (index + 1) / samples;
		const u = 1 - t;
		return {
			x: u ** 3 * a.x + 3 * u ** 2 * t * c1.x + 3 * u * t ** 2 * c2.x + t ** 3 * b.x,
			y: u ** 3 * a.y + 3 * u ** 2 * t * c1.y + 3 * u * t ** 2 * c2.y + t ** 3 * b.y,
		};
	});
}

function cableRouteLength(points) {
	let length = 0;
	for (let index = 1; index < points.length; index += 1) {
		length += Math.hypot(points[index].x - points[index - 1].x, points[index].y - points[index - 1].y);
	}
	return length;
}

/** Choose ports for the existing cubic Canvas cable without crossing unrelated tiles. */
export function researchCablePorts(fromTile, toTile, obstacleTiles = []) {
	const from = rectFor(fromTile);
	const to = rectFor(toTile);
	const dx = (to.x + to.width / 2) - (from.x + from.width / 2);
	const dy = (to.y + to.height / 2) - (from.y + from.height / 2);
	let preferred;
	if (Math.abs(dx) > WORLD_TILE_WIDTH / 2) {
		preferred = dx >= 0 ? { from: "e", to: "w" } : { from: "w", to: "e" };
	} else if (Math.abs(dy) <= WORLD_TILE_HEIGHT + WORLD_ROW_GAP + 4) {
		preferred = dy >= 0 ? { from: "s", to: "n" } : { from: "n", to: "s" };
	} else {
		const side = from.x < WORKFLOW_STAGE_STEP * 1.5 ? "w" : "e";
		preferred = { from: side, to: side };
	}
	const obstacles = obstacleTiles
		.filter((tile) => tile && tile !== fromTile && tile !== toTile)
		.map((tile) => rectFor(tile));
	const targetVector = { x: dx, y: dy };
	const candidates = [];
	for (const fromSide of CABLE_SIDES) {
		for (const toSide of CABLE_SIDES) {
			let bodyHits = 0;
			let nearHits = 0;
			const distance = Math.hypot(to.x - from.x, to.y - from.y);
			const nominalCurve = Math.min(360, Math.max(70, distance * 0.4));
			const curveLengths = [...new Set([
				Math.max(70, nominalCurve - 80),
				Math.max(70, nominalCurve - 40),
				nominalCurve,
				Math.min(360, nominalCurve + 40),
			])];
			for (const curveLength of curveLengths) {
				for (const point of cableCurvePoints(fromTile, fromSide, toTile, toSide, 96, curveLength)) {
					for (const obstacle of obstacles) {
						if (point.x > obstacle.x && point.x < obstacle.x + obstacle.width && point.y > obstacle.y && point.y < obstacle.y + obstacle.height) bodyHits += 1;
						else if (point.x > obstacle.x - 14 && point.x < obstacle.x + obstacle.width + 14 && point.y > obstacle.y - 14 && point.y < obstacle.y + obstacle.height + 14) nearHits += 1;
					}
				}
			}
			const points = cableCurvePoints(fromTile, fromSide, toTile, toSide);
			const fromPort = cablePortPoint(fromTile, fromSide);
			const toPort = cablePortPoint(toTile, toSide);
			const fromFacesTarget = fromPort.dx * targetVector.x + fromPort.dy * targetVector.y >= 0;
			const toFacesSource = toPort.dx * targetVector.x + toPort.dy * targetVector.y <= 0;
			const preferencePenalty = (fromSide === preferred.from ? 0 : 1) + (toSide === preferred.to ? 0 : 1);
			candidates.push({
				from: fromSide,
				to: toSide,
				score: bodyHits * 1_000_000 + nearHits * 10_000 + (!fromFacesTarget ? 1_000 : 0) + (!toFacesSource ? 1_000 : 0) + preferencePenalty * 100 + cableRouteLength(points),
			});
		}
	}
	const selected = candidates.sort((a, b) => a.score - b.score || CABLE_SIDES.indexOf(a.from) - CABLE_SIDES.indexOf(b.from) || CABLE_SIDES.indexOf(a.to) - CABLE_SIDES.indexOf(b.to))[0];
	return { from: selected.from, to: selected.to };
}

function normalizeResearchTile(tile) {
	if (!tile || tile.type !== "research") return tile;
	tile.width = WORLD_TILE_WIDTH;
	tile.height = WORLD_TILE_HEIGHT;
	return tile;
}

function normalizeSessionTile(tile) {
	if (!tile || !tile.sessionId) return tile;
	tile.width = SESSION_TILE_WIDTH;
	tile.height = SESSION_TILE_HEIGHT;
	return tile;
}

function objectKey(object) {
	return object ? `${object.type}:${object.id}` : "";
}

function stableObjectOrder(a, b) {
	return (WORLD_TYPE_ORDER.get(a?.type) ?? 99) - (WORLD_TYPE_ORDER.get(b?.type) ?? 99) ||
		String(a?.type ?? "").localeCompare(String(b?.type ?? "")) ||
		String(a?.id ?? "").localeCompare(String(b?.id ?? ""));
}

function firstLink(links, predicate) {
	return (links || []).filter(predicate).sort((a, b) =>
		String(a.kind).localeCompare(String(b.kind)) ||
		String(a.from_id).localeCompare(String(b.from_id)) ||
		String(a.to_id).localeCompare(String(b.to_id)))[0] || null;
}

export function deriveResearchWorkflow(world) {
	const objects = Array.isArray(world?.objects) ? world.objects : [];
	const links = Array.isArray(world?.links) ? world.links : [];
	const byId = new Map(objects.map((object) => [object.id, object]));
	const objectById = (id) => byId.get(String(id ?? "")) || null;
	const outgoing = (id, kind) => links.filter((link) => link.from_id === id && (!kind || link.kind === kind));
	const addLink = (set, link) => { if (link) set.add(`${link.kind}\u0000${link.from_id}\u0000${link.to_id}`); };
	const linkFrom = (fromId, kind, toId = null) => firstLink(links, (link) =>
		link.from_id === fromId && link.kind === kind && (toId === null || link.to_id === toId));
	const linkTo = (toId, kind, fromId = null) => firstLink(links, (link) =>
		link.to_id === toId && link.kind === kind && (fromId === null || link.from_id === fromId));

	const root = objectById(world?.root?.id);
	const mission = root?.type === "mission"
		? root
		: objectById(linkFrom(root?.id, "belongs_to")?.to_id);
	const sourceTask = root?.type === "task"
		? root
		: objectById(linkTo(mission?.id, "belongs_to")?.from_id);
	const stages = [[], [], [], [], []];
	const primaryIds = new Set();
	const primaryLinks = new Set();
	const addObject = (object) => {
		if (!object || primaryIds.has(object.id)) return object;
		primaryIds.add(object.id);
		return object;
	};
	const addPathLink = (link) => addLink(primaryLinks, link);

	addObject(mission);
	addObject(sourceTask);
	const sourceTaskMission = sourceTask && linkFrom(sourceTask.id, "belongs_to", mission?.id);
	addPathLink(sourceTaskMission);

	const executorLink = sourceTask && linkFrom(sourceTask.id, "assigned_to");
	const executor = objectById(executorLink?.to_id || sourceTask?.fields?.assignee_session_id);
	addObject(executor);
	addPathLink(executorLink);
	const directorLink = sourceTask && linkFrom(sourceTask.id, "delegated_by");
	const director = objectById(directorLink?.to_id || sourceTask?.fields?.delegator_session_id);
	addObject(director);
	addPathLink(directorLink);
	addPathLink(director && executor ? linkFrom(director.id, "delegates_to", executor.id) : null);

	const runCandidates = objects.filter((object) => object.type === "run").sort(stableObjectOrder);
	const run = runCandidates.find((object) => executor && object.fields?.executor_session_id === executor.id) ||
		runCandidates.find((object) => sourceTask && object.fields?.source_task_id === sourceTask.id) ||
		runCandidates[0] || null;
	const runLink = run && firstLink(outgoing(run.id, "produces"), (link) => {
		const artifact = objectById(link.to_id);
		return artifact?.type === "artifact" && artifact.fields?.kind !== "report" && artifact.fields?.kind !== "evaluation_findings";
	});
	const rawArtifact = objectById(run?.fields?.result_artifact_id || runLink?.to_id);
	if (run) {
		addObject(run);
		for (const link of outgoing(run.id)) {
			if (link.kind === "tests" || link.kind === "uses") {
				const input = objectById(link.to_id);
				if (["hypothesis", "dataset", "strategy"].includes(input?.type)) {
					addObject(input);
					addPathLink(link);
				}
			}
		}
	}
	addObject(rawArtifact);
	if (run && rawArtifact) addPathLink(runLink || linkFrom(run.id, "produces", rawArtifact.id));

	const evaluationLink = rawArtifact && linkFrom(rawArtifact.id, "evaluated_by");
	const evaluation = objectById(rawArtifact?.fields?.evaluation_id || evaluationLink?.to_id) ||
		objects.filter((object) => object.type === "evaluation" &&
			(object.fields?.target_artifact_id === rawArtifact?.id || object.fields?.source_work?.source_task_id === sourceTask?.id))
			.sort(stableObjectOrder)[0] || null;
	addObject(evaluation);
	if (evaluationLink) addPathLink(evaluationLink);
	const criticLink = evaluation && linkFrom(evaluation.id, "performed_by");
	const critic = objectById(criticLink?.to_id || evaluation?.fields?.critic_session_id);
	addObject(critic);
	addPathLink(criticLink);
	const reviewTask = objectById(evaluation?.fields?.review_task_id);
	addObject(reviewTask);
	const reviewExecutorLink = reviewTask && linkFrom(reviewTask.id, "assigned_to");
	const reviewExecutor = objectById(reviewExecutorLink?.to_id || reviewTask?.fields?.assignee_session_id);
	addObject(reviewExecutor);
	const reviewDirectorLink = reviewTask && linkFrom(reviewTask.id, "delegated_by");
	const reviewDirector = objectById(reviewDirectorLink?.to_id || reviewTask?.fields?.delegator_session_id);
	addObject(reviewDirector);
	if (reviewTask) {
		addPathLink(reviewExecutorLink);
		addPathLink(reviewDirectorLink);
	}
	const currentReport = objectById(world?.current_report_id || evaluation?.fields?.publication_report_id);
	addObject(currentReport);
	if (evaluation && currentReport) addPathLink(linkFrom(evaluation.id, "gates", currentReport.id));

	if (mission) stages[0].push(mission);
	const workTasks = [sourceTask, reviewTask]
		.filter(Boolean)
		.filter((object, index, rows) => rows.findIndex((row) => row.id === object.id) === index)
		.sort(stableObjectOrder);
	for (const task of workTasks) {
		stages[1].push(task);
		const assignment = linkFrom(task.id, "assigned_to");
		const participant = objectById(assignment?.to_id || task.fields?.assignee_session_id);
		if (participant && !stages[1].some((object) => object.id === participant.id)) stages[1].push(participant);
	}
	const pairedIds = new Set(stages[1].map((object) => object.id));
	for (const participant of [director, critic, reviewDirector, reviewExecutor].filter(Boolean).sort(stableObjectOrder)) {
		if (!pairedIds.has(participant.id)) {
			stages[1].push(participant);
			pairedIds.add(participant.id);
		}
	}
	if (run) stages[2].push(run);
	for (const input of objects.filter((object) => primaryIds.has(object.id) && ["hypothesis", "dataset", "strategy"].includes(object.type)).sort(stableObjectOrder)) stages[2].push(input);
	if (rawArtifact) stages[2].push(rawArtifact);
	if (evaluation) stages[3].push(evaluation);
	if (currentReport) stages[4].push(currentReport);
	const primaryLinkKeys = new Set();
	for (const link of links) {
		if (!primaryIds.has(link.from_id) || !primaryIds.has(link.to_id)) continue;
		if (primaryLinks.has(`${link.kind}\u0000${link.from_id}\u0000${link.to_id}`)) primaryLinkKeys.add(`${link.kind}\u0000${link.from_id}\u0000${link.to_id}`);
	}
	const historyIds = new Set((Array.isArray(world?.report_ids) ? world.report_ids : [])
		.filter((id) => id !== currentReport?.id));
	for (const object of objects) {
		const status = String(object.fields?.status ?? "");
		if (object.id !== currentReport?.id && (object.fields?.historical === true || object.fields?.semantic_markers?.includes?.("HISTORICAL") ||
			(object.type === "agent_session" && ["closed", "cancelled", "failed"].includes(status)))) historyIds.add(object.id);
	}
	const stageById = new Map();
	for (let stage = 0; stage < stages.length; stage += 1) for (const object of stages[stage]) stageById.set(object.id, stage);
	const currentMissionIds = new Set(objects
		.filter((object) => !historyIds.has(object.id) || (primaryIds.has(object.id) && object.type === "agent_session"))
		.map((object) => object.id));
	return { objects, links, byId, stages, stageById, primaryIds, primaryLinkKeys, historyIds, currentMissionIds, mission, sourceTask, executor, director, run, rawArtifact, evaluation, reviewTask, critic, currentReport };
}

function derivedStage(workflow, object) {
	if (workflow.stageById.has(object.id)) return workflow.stageById.get(object.id);
	if (object.type === "artifact" && object.fields?.kind === "report") return 4;
	if (object.type === "ticket") return 3;
	if (object.type === "artifact" && object.fields?.kind === "evaluation_findings") return 4;
	if (object.type === "artifact" && workflow.links.some((link) => link.from_id === object.id && String(link.kind).startsWith("grades_"))) return 2;
	const adjacent = workflow.links.filter((link) => link.from_id === object.id || link.to_id === object.id)
		.map((link) => workflow.stageById.get(link.from_id === object.id ? link.to_id : link.from_id))
		.filter((stage) => Number.isInteger(stage));
	if (adjacent.length > 0) return Math.min(...adjacent);
	if (object.type === "evaluation") return 3;
	if (object.type === "run" || object.type === "artifact") return 2;
	if (object.type === "task" || object.type === "agent_session") return 1;
	return 0;
}

export function researchWorldLayout(workflow) {
	const byId = new Map();
	const rowStep = WORLD_TILE_HEIGHT + WORLD_ROW_GAP;
	const stageX = WORKFLOW_STAGE_LABELS.map((_, index) => index * WORKFLOW_STAGE_STEP);
	const place = (object, x, y, width = WORLD_TILE_WIDTH, height = WORLD_TILE_HEIGHT) => {
		if (!object) return;
		byId.set(tileId(object.type, object.id), { x, y, width, height });
	};
	const startY = 80;
	for (const [stage, members] of workflow.stages.entries()) {
		if (stage === 2) {
			const evidenceRows = [0, 2, 3, 4, 5];
			members.forEach((object, index) => place(object, stageX[stage], startY + (evidenceRows[index] ?? index + 1) * rowStep));
			continue;
		}
		if (stage === 3 || stage === 4) {
			members.forEach((object, index) => place(object, stageX[stage], startY + (1 + index) * rowStep));
			continue;
		}
		members.forEach((object, index) => place(object, stageX[stage], startY + index * rowStep));
	}
	const fallbackRows = workflow.stages.map((members, stage) => stage === 2 ? 6 : Math.max(members.length, stage >= 3 ? 2 : 0));
	for (const object of workflow.objects.filter((candidate) => !byId.has(tileId(candidate.type, candidate.id))).sort(stableObjectOrder)) {
		const stage = derivedStage(workflow, object);
		let row = fallbackRows[stage];
		if (object.type === "artifact" && object.fields?.kind === "evaluation_findings") row = Math.max(2, row);
		else if (object.type === "ticket") row = Math.max(3, row);
		fallbackRows[stage] = row + 1;
		const y = startY + row * rowStep;
		place(object, stageX[stage], y, object.type === "agent_session" ? SESSION_TILE_WIDTH : WORLD_TILE_WIDTH, object.type === "agent_session" ? SESSION_TILE_HEIGHT : WORLD_TILE_HEIGHT);
	}
	return byId;
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
	if (horizontalSpan < WORLD_TILE_WIDTH || verticalSpan > 2_500) return true;
	for (let index = 0; index < memberTiles.length; index += 1) {
		for (let other = index + 1; other < memberTiles.length; other += 1) {
			if (overlaps(rectFor(memberTiles[index]), rectFor(memberTiles[other]))) return true;
		}
	}
	return false;
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

function semanticMarkers(object) {
	return Array.isArray(object?.fields?.semantic_markers) ? object.fields.semantic_markers.map(String) : [];
}

export function projectedSemanticMarkers(object, workflow) {
	const markers = semanticMarkers(object);
	return object?.id === workflow?.currentReport?.id
		? markers.filter((marker) => marker !== "HISTORICAL")
		: markers;
}

function recordedText(value) {
	return value === null || value === undefined || String(value).trim() === "" ? null : String(value);
}

function firstRecorded(...values) {
	for (const value of values) {
		const recorded = recordedText(value);
		if (recorded) return recorded;
	}
	return "Not recorded";
}

function humanizedKind(value) {
	const recorded = recordedText(value);
	if (!recorded) return "Not recorded";
	return recorded.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function objectHumanTitle(object, participantView = null, workflow = null) {
	const fields = object?.fields || {};
	if (object?.type === "mission") return firstRecorded(fields.objective, fields.name === "Founder question" ? null : fields.name);
	if (object?.type === "task") return firstRecorded(fields.title, fields.description);
	if (object?.type === "agent_session") return firstRecorded(participantView?.role, fields.role, fields.display_name, fields.label);
	if (object?.type === "run") return firstRecorded(fields.name, fields.title, fields.label, humanizedKind(fields.kind));
	if (object?.type === "dataset") return firstRecorded(fields.name, fields.title, fields.label, humanizedKind(fields.kind));
	if (object?.type === "artifact") {
		if (fields.kind === "report") return firstRecorded(fields.name, fields.title, fields.label, object.id === workflow?.currentReport?.id ? "Current report" : "Historical report");
		return firstRecorded(fields.name, fields.title, fields.label, humanizedKind(fields.kind));
	}
	if (object?.type === "evaluation") return firstRecorded(fields.name, fields.title, fields.label, "Independent evaluation");
	if (object?.type === "strategy") return firstRecorded(fields.family, fields.name, fields.title, fields.label, humanizedKind(fields.kind));
	if (object?.type === "hypothesis") return firstRecorded(fields.claim, fields.name, fields.title, fields.label);
	if (object?.type === "ticket") return firstRecorded(fields.name, fields.title, fields.label, fields.external_ref);
	return firstRecorded(fields.name, fields.title, fields.label, humanizedKind(fields.kind));
}

export function researchTilePresentation(object, workflow, participantViewForId = () => null) {
	const fields = object?.fields || {};
	const links = workflow?.links || [];
	const byId = workflow?.byId || new Map();
	const participantView = object?.type === "agent_session" ? participantViewForId(object.id, object) : null;
	const titleFor = (id) => {
		const target = byId.get(String(id ?? ""));
		return target ? objectHumanTitle(target, target.type === "agent_session" ? participantViewForId(target.id, target) : null, workflow) : "Not recorded";
	};
	const outgoing = links.filter((link) => link.from_id === object?.id);
	const incoming = links.filter((link) => link.to_id === object?.id);
	const facts = [];
	const addFact = (label, value) => facts.push({ label, value: firstRecorded(value) });
	let badge = String(object?.type ?? "object").replace("agent_session", "participant").toUpperCase();
	let status = firstRecorded(fields.status);
	if (object?.type === "mission") {
		const technique = (workflow?.stages?.[2] || []).filter((candidate) => candidate.type === "strategy").sort(stableObjectOrder)[0];
		addFact("Technique", technique ? titleFor(technique.id) : "Not recorded");
	} else if (object?.type === "task") {
		addFact("Owner", titleFor(outgoing.find((link) => link.kind === "assigned_to")?.to_id));
	} else if (object?.type === "agent_session") {
		badge = "PARTICIPANT";
		status = firstRecorded(participantView?.runtimeState);
		const ownedTaskId = links.find((link) => link.kind === "assigned_to" && link.to_id === object.id)?.from_id;
		addFact("Task", titleFor(ownedTaskId));
		facts.push({
			label: "Session",
			value: `${firstRecorded(participantView?.session)} · Work ${firstRecorded(participantView?.work)} · Recovery ${firstRecorded(participantView?.recovery)}`,
		});
	} else if (object?.type === "run") {
		addFact("Context", `${titleFor(workflow?.mission?.id)} · ${titleFor(workflow?.sourceTask?.id)}`);
	} else if (object?.type === "dataset") {
		addFact("Rows", fields.coverage?.record_count);
		addFact("As of", fields.as_of);
	} else if (object?.type === "artifact") {
		badge = fields.kind === "report" ? "REPORT" : "ARTIFACT";
		const historical = workflow?.historyIds?.has(object.id) || fields.historical === true;
		const grade = outgoing.some((link) => String(link.kind).startsWith("grades_"));
		if (fields.kind === "report") status = object.id === workflow?.currentReport?.id ? "PUBLISHED CURRENT" : "HISTORICAL";
		else if (object.id === workflow?.rawArtifact?.id) status = "RAW UNREVIEWED";
		else if (historical) status = "HISTORICAL";
		else if (grade) status = "GRADE ARTIFACT";
		else status = firstRecorded(fields.status, semanticMarkers(object)[0]);
		const producerId = fields.producer_id || incoming.find((link) => link.kind === "produces")?.from_id;
		const sourceRunId = fields.source_run_id || fields.run_id || (object.id === workflow?.rawArtifact?.id ? workflow?.run?.id : null) || outgoing.find((link) => link.kind === "grades_run")?.to_id;
		const sourceTaskId = fields.source_task_id || (sourceRunId ? workflow?.sourceTask?.id : null);
		addFact("Producer", titleFor(producerId));
		addFact("Source", `${titleFor(sourceRunId)} · ${titleFor(sourceTaskId)}`);
		if (fields.kind === "report") {
			facts.splice(0, facts.length);
			addFact("Gated by", titleFor(incoming.find((link) => link.kind === "gates")?.from_id || fields.gating_evaluation_id));
		}
	} else if (object?.type === "evaluation") {
		badge = "EVALUATION";
		status = firstRecorded(fields.verdict);
		const criticId = fields.critic_session_id || outgoing.find((link) => link.kind === "performed_by")?.to_id;
		const targetId = fields.target_artifact_id || incoming.find((link) => link.kind === "evaluated_by" && link.from_id === workflow?.rawArtifact?.id)?.from_id;
		addFact("Critic", titleFor(criticId));
		addFact("Confidence", `${firstRecorded(fields.confidence)} · Target ${titleFor(targetId)}`);
	} else if (object?.type === "strategy") {
		badge = "TECHNIQUE";
	} else if (object?.type === "ticket") {
		status = firstRecorded(fields.status, fields.grade);
	}
	return Object.freeze({
		title: objectHumanTitle(object, participantView, workflow),
		badge,
		status,
		facts: facts.slice(0, 2),
	});
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

function bindObjectSelection(container, subject, onSelectObject) {
	if (!container || !onSelectObject) return;
	if (container._qfWorldSelectHandler) container.removeEventListener("pointerdown", container._qfWorldSelectHandler, true);
	const handler = (event) => {
		if (event.button !== undefined && event.button !== 0) return;
		if (event.target?.closest?.("button, input, textarea, select, form, webview, .gl-tile__spine")) return;
		onSelectObject(subject);
	};
	container._qfWorldSelectHandler = handler;
	container.addEventListener("pointerdown", handler, true);
}

/**
 * Back to world is one ephemeral restoration action. Delegate from the
 * document so the static Canvas control, a dynamically rendered Dock control,
 * and a normal DOM replacement all use the same handler exactly once.
 */
export function bindBackToWorldControls(root, restoreOverview) {
	if (!root?.addEventListener || typeof restoreOverview !== "function") return () => {};
	const handler = (event) => {
		const target = event?.target?.closest?.("[data-qf-world-back], [data-qf-back-to-world]");
		if (!target || (typeof root.contains === "function" && !root.contains(target))) return;
		restoreOverview();
	};
	root.addEventListener("click", handler);
	return () => root.removeEventListener?.("click", handler);
}

function renderPresentationCard(presentation) {
	const compact = document.createElement("div");
	compact.className = "qf-world-compact";
	const humanLabel = document.createElement("strong");
	humanLabel.className = "qf-world-human-label";
	humanLabel.dataset.qfTileTitle = "true";
	humanLabel.textContent = presentation.title;
	const meta = document.createElement("div");
	meta.className = "qf-world-meta";
	const badge = document.createElement("span");
	badge.className = "qf-world-type-label";
	badge.dataset.qfTileBadge = "true";
	badge.textContent = presentation.badge;
	const status = document.createElement("span");
	status.className = "qf-world-status";
	status.dataset.qfTileStatus = "true";
	status.textContent = presentation.status;
	meta.append(badge, status);
	compact.append(humanLabel, meta);
	if (presentation.facts.length > 0) {
		const facts = document.createElement("div");
		facts.className = "qf-world-facts";
		for (const fact of presentation.facts) {
			const row = document.createElement("div");
			row.className = "qf-world-fact";
			row.dataset.qfTileFact = fact.label;
			const label = document.createElement("span");
			label.className = "qf-world-fact-label";
			label.textContent = fact.label;
			const value = document.createElement("span");
			value.className = "qf-world-fact-value";
			value.textContent = fact.value;
			value.title = fact.value;
			row.append(label, value);
			facts.appendChild(row);
		}
		compact.appendChild(facts);
	}
	return compact;
}

function appendInspectFact(container, labelText, valueText) {
	const row = document.createElement("div");
	row.className = "dock-inspect-fact";
	const label = document.createElement("span");
	label.className = "dock-inspect-fact-label";
	label.textContent = labelText;
	const value = document.createElement("span");
	value.className = "dock-inspect-fact-value";
	value.textContent = firstRecorded(valueText);
	row.append(label, value);
	container.appendChild(row);
}

function renderDockObjectOverview(object, workflow, participantViewForId) {
	const presentation = researchTilePresentation(object, workflow, participantViewForId);
	const overview = document.createElement("div");
	overview.className = "dock-inspect-overview";
	const authority = document.createElement("div");
	authority.className = "dock-inspect-authority";
	const badge = document.createElement("span");
	badge.className = "qf-world-type-label";
	badge.textContent = presentation.badge;
	const status = document.createElement("span");
	status.className = "qf-world-status";
	status.textContent = presentation.status;
	authority.append(badge, status);
	overview.appendChild(authority);
	if (object.type === "artifact" && object.id === workflow?.rawArtifact?.id) {
		const sourceRun = workflow.run;
		const producer = sourceRun && workflow.byId.get(sourceRun.fields?.executor_session_id);
		appendInspectFact(overview, "Producer", producer ? objectHumanTitle(producer, participantViewForId(producer.id, producer), workflow) : "Not recorded");
		appendInspectFact(overview, "Source Run", sourceRun ? objectHumanTitle(sourceRun, null, workflow) : "Not recorded");
		appendInspectFact(overview, "Source Task", workflow.sourceTask ? objectHumanTitle(workflow.sourceTask, null, workflow) : "Not recorded");
		const evaluationLink = workflow.links.find((link) => link.kind === "evaluated_by" && link.from_id === object.id);
		const evaluation = workflow.byId.get(evaluationLink?.to_id);
		const reportLink = evaluation && workflow.links.find((link) => link.kind === "gates" && link.from_id === evaluation.id && link.to_id === workflow?.currentReport?.id);
		appendInspectFact(overview, "Evaluated by", evaluation ? objectHumanTitle(evaluation, null, workflow) : "Not recorded");
		appendInspectFact(overview, "Current report", reportLink && workflow.currentReport ? objectHumanTitle(workflow.currentReport, null, workflow) : "Not recorded");
	} else if (object.type === "evaluation") {
		const criticId = object.fields?.critic_session_id || workflow.links.find((link) => link.kind === "performed_by" && link.from_id === object.id)?.to_id;
		const critic = workflow.byId.get(criticId);
		const targetLink = workflow.links.find((link) => link.kind === "evaluated_by" && link.to_id === object.id && link.from_id === workflow.rawArtifact?.id);
		const target = workflow.byId.get(object.fields?.target_artifact_id || targetLink?.from_id);
		appendInspectFact(overview, "Critic", critic ? objectHumanTitle(critic, participantViewForId(critic.id, critic), workflow) : "Not recorded");
		appendInspectFact(overview, "Confidence", object.fields?.confidence);
		appendInspectFact(overview, "Target Artifact", target ? objectHumanTitle(target, null, workflow) : "Not recorded");
		appendInspectFact(overview, "Rationale", object.fields?.rationale);
	} else {
		for (const fact of presentation.facts) appendInspectFact(overview, fact.label, fact.value);
	}
	return overview;
}

function renderObject(dom, tile, object, onReveal, workflow, onOutcomeRecorded, onSelectObject, participantViewForId) {
	if (!dom?.contentArea || !object) return;
	const container = dom.container;
	if (container._qfWorldKeyHandler) container.removeEventListener("keydown", container._qfWorldKeyHandler);
	bindObjectSelection(container, { kind: "object", type: object.type, id: object.id }, onSelectObject);
	container.dataset.qfWorldType = object.type;
	container.dataset.qfWorldId = object.id;
	const markers = projectedSemanticMarkers(object, workflow);
	container.dataset.qfWorldMarkers = markers.join("|");
	container.setAttribute("aria-label", `${object.type} ${object.id}`);
	const presentation = researchTilePresentation(object, workflow, participantViewForId);
	container.setAttribute("aria-description", `${presentation.title} · ${presentation.badge} · ${presentation.status}`);
	dom.contentArea.replaceChildren();
	const compact = renderPresentationCard(presentation);
	const controls = document.createElement("div");
	controls.className = "qf-world-controls";
	const details = document.createElement("div");
	details.className = "qf-world-details";
	details.hidden = true;
	const world = workflow;
	for (const field of FIELD_ORDER[object.type] || Object.keys(object.fields || {})) {
		const exists = Object.prototype.hasOwnProperty.call(object.fields || {}, field);
		details.appendChild(makeField(field, object.fields?.[field], exists));
	}
	const contextFields = [
		["semantic markers", markers.join(" · ")],
		["producer", object.fields?.producer_type && object.fields?.producer_id ? `${object.fields.producer_type} · ${object.fields.producer_id}` : ""],
		["source task", object.fields?.source_task_id],
		["source run", object.fields?.source_run_id],
		["gating evaluation", object.fields?.gating_evaluation_id],
		["current authority", object.fields?.current_authority === true ? "yes" : object.fields?.current_authority === false ? "no" : ""],
		["historical", object.fields?.historical === true ? "yes" : object.fields?.historical === false ? "no" : ""],
		["target artifact", object.fields?.target_artifact_id],
		["definition", object.fields?.definition_id],
		["role", object.fields?.role],
		["runtime profile", object.fields?.runtime_profile],
	];
	for (const [field, value] of contextFields) {
		if (!value) continue;
		const row = document.createElement("div");
		row.className = "qf-world-context-field";
		const label = document.createElement("span");
		label.className = "qf-world-field-label";
		label.textContent = field;
		const content = document.createElement("span");
		content.className = "qf-world-field-value";
		content.textContent = displayValue(value);
		row.append(label, content);
		details.appendChild(row);
	}
	const relations = document.createElement("div");
	relations.className = "qf-world-relations";
	for (const direction of ["incoming", "outgoing"]) {
		for (const link of (world?.links || []).filter((candidate) => direction === "incoming" ? candidate.to_id === object.id : candidate.from_id === object.id)) {
			const row = document.createElement("div");
			row.className = "qf-world-relation";
			row.dataset.direction = direction;
			row.dataset.kind = link.kind;
			row.dataset.fromId = link.from_id;
			row.dataset.toId = link.to_id;
			row.textContent = `${direction} · ${link.kind} · ${link.from_id} → ${link.to_id}`;
			relations.appendChild(row);
		}
	}
	if (relations.children.length > 0) details.appendChild(relations);
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
					const persistedGrade = (world?.objects || []).find((candidate) => {
						if (candidate.type !== "artifact") return false;
						const preview = candidate.fields?.receipt?.preview;
						if (typeof preview !== "string") return false;
						const linkedToRun = (world?.links || []).some((link) => link.kind === "grades_run" && link.from_id === candidate.id && link.to_id === object.fields?.run_id);
						const linkedToTicket = (world?.links || []).some((link) => link.kind === "grades_ticket" && link.from_id === candidate.id);
						try { const grade = JSON.parse(preview); const linkedToStrategy = (world?.links || []).some((link) => link.kind === "grades_strategy" && link.from_id === candidate.id && link.to_id === grade.strategy_id); const linkedToResult = (world?.links || []).some((link) => link.kind === "grades_run_result" && link.from_id === candidate.id && link.to_id === grade.run_result_artifact_id); return linkedToRun && linkedToTicket && linkedToStrategy && linkedToResult && grade.run_id === object.fields?.run_id && grade.selection_ref === row.dataset.selectionRef; } catch { return false; }
					});
					let persistedPayload = null;
					if (persistedGrade) { try { persistedPayload = JSON.parse(persistedGrade.fields.receipt.preview); } catch { persistedPayload = null; } }
					state.textContent = persistedPayload ? String(persistedPayload.outcome).toUpperCase() : "PENDING OUTCOME";
					const makeOutcomeForm = () => {
						const form = document.createElement("form");
						form.className = "qf-outcome-form";
						for (const name of ["external_ref", "settled_at", "decimal_odds", "closing_decimal_odds", "stake", "payout"]) {
							const input = document.createElement("input"); input.name = name; input.placeholder = name; form.appendChild(input);
						}
						const outcome = document.createElement("select"); outcome.name = "outcome"; outcome.required = true; for (const value of ["win", "loss", "push", "void"]) { const option = document.createElement("option"); option.value = value; option.textContent = value; outcome.appendChild(option); } form.appendChild(outcome);
						const submit = document.createElement("button"); submit.type = "submit"; submit.textContent = "Save outcome"; form.appendChild(submit);
						const message = document.createElement("span"); message.className = "qf-outcome-message"; form.appendChild(message);
						form.addEventListener("submit", async (event) => {
							event.preventDefault();
							const input = Object.fromEntries([...form.elements].filter((entry) => entry.name).map((entry) => [entry.name, entry.value]));
							try {
								const result = await window.shellApi.qf.recordStrategyOutcome({ run_id: object.fields?.run_id ?? "", selection_ref: row.dataset.selectionRef, ...input, payout: input.payout === "" ? null : input.payout });
								window.__QF_LAST_OUTCOME_RESULT = result;
								if (!result?.ok) { message.textContent = String(result?.error?.message ?? ""); return; }
								await onOutcomeRecorded?.();
							} catch (error) { message.textContent = error?.message ?? String(error); }
						});
						return form;
					};
					if (persistedPayload) {
						const receipt = document.createElement("span"); receipt.className = "qf-outcome-receipt";
						receipt.textContent = `calibration=${String(persistedPayload.calibration)} clv=${String(persistedPayload.clv)}`;
						const replay = document.createElement("button"); replay.type = "button"; replay.className = "qf-outcome-replay"; replay.textContent = "Replay settled outcome"; replay.setAttribute("aria-label", `Replay settled outcome ${row.dataset.selectionRef}`);
						replay.addEventListener("click", () => { replay.remove(); row.appendChild(makeOutcomeForm()); });
						row.append(state, receipt, replay); details.appendChild(row); continue;
					}
					const button = document.createElement("button");
					button.type = "button";
					button.textContent = "Record settled outcome";
					button.setAttribute("aria-label", `Record settled outcome ${row.dataset.selectionRef}`);
					button.addEventListener("click", () => { row.appendChild(makeOutcomeForm()); button.remove(); });
					row.append(state, button); details.appendChild(row);
				}
			}
		} catch { /* unavailable or truncated previews remain inspectable through receipt */ }
	}
	if (object.type === "mission" && onReveal) {
		// Preserve the inherited R16 "Show research world" action contract while
		// presenting its consumer-facing name as Open workspace.
		const reveal = document.createElement("button");
		reveal.type = "button";
		reveal.className = "qf-world-reveal";
		reveal.textContent = "Open workspace";
		reveal.setAttribute("aria-label", `Open workspace ${object.id}`);
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
	container._qfWorldDetails = details;
	dom.contentArea.appendChild(compact);
	if (controls.children.length > 0) dom.contentArea.appendChild(controls);
	container.tabIndex = 0;
	const keyHandler = (event) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			onSelectObject?.({ kind: "object", type: object.type, id: object.id });
		}
	};
	container._qfWorldKeyHandler = keyHandler;
	container.addEventListener("keydown", keyHandler);
}

export function createResearchWorldController({ tileManager, getTileDOMs, onCables, onClearCableSelection, showStatus, getParticipantView }) {
	let lastRoot = null;
	let lastWorld = null;
	let lastWorkflow = null;
	let projectionState = PROJECTION_ORDINARY;
	let selectedSubject = null;
	let savedOverview = null;
	let projectionControls = null;
	let cableObserver = null;

	function currentDockMode() {
		const tab = document.querySelector?.('[data-dock-mode][aria-selected="true"]');
		const mode = String(tab?.dataset?.dockMode ?? "START").toUpperCase();
		return mode === "INSPECT" ? "START" : mode;
	}

	function setDockMode(mode) {
		document.querySelector?.(`[data-dock-mode="${String(mode).toUpperCase()}"]`)?.click();
	}

	function ensureProjectionControls() {
		if (projectionControls) return projectionControls;
		projectionControls = document.getElementById?.("research-world-projection");
		if (!projectionControls) return null;
		projectionControls.dataset.qfProjectionState = projectionState;
		projectionControls.querySelector("[data-qf-world-full]")?.addEventListener("click", () => {
			if (projectionState !== PROJECTION_FULL) savedOverview = { state: projectionState, dockMode: currentDockMode() };
			selectedSubject = null;
			onClearCableSelection?.();
			clearInspectSurface();
			projectionState = PROJECTION_FULL;
			applyProjection({ fit: true });
		});
		return projectionControls;
	}

	function clearInspectSurface() {
		document.getElementById?.("cable-inspector")?.setAttribute("hidden", "");
		const pane = document.getElementById?.("dock-inspect-pane");
		if (pane) pane.replaceChildren();
	}

	function localLineage(subject) {
		const workflow = lastWorkflow;
		if (!workflow || !subject) return { objectIds: [], linkKeys: [] };
		const objectIds = new Set();
		const subjectIds = subject.kind === "link" ? [subject.from_id, subject.to_id] : [subject.id];
		for (const id of subjectIds) objectIds.add(id);
		const contextFields = ["mission_id", "source_task_id", "assignee_session_id", "delegator_session_id", "executor_session_id", "result_artifact_id", "publication_report_id", "critic_session_id", "review_task_id"];
		const oneHopIds = new Set(subjectIds);
		for (const link of workflow.links) if (subjectIds.includes(link.from_id)) oneHopIds.add(link.to_id); else if (subjectIds.includes(link.to_id)) oneHopIds.add(link.from_id);
		for (const id of oneHopIds) objectIds.add(id);
		const oneHop = workflow.objects.filter((object) => oneHopIds.has(object.id));
		for (const object of oneHop) {
			for (const field of contextFields) if (object.fields?.[field]) objectIds.add(String(object.fields[field]));
		}
		const linkKeys = workflow.links
			.filter((link) => objectIds.has(link.from_id) && objectIds.has(link.to_id))
			.map((link) => `${link.kind}\u0000${link.from_id}\u0000${link.to_id}`);
		if (subject.kind === "link") linkKeys.push(`${subject.kindName}\u0000${subject.from_id}\u0000${subject.to_id}`);
		return { objectIds: [...objectIds], linkKeys: [...new Set(linkKeys)] };
	}

	function renderDockInspect(subject) {
		const pane = document.getElementById("dock-inspect-pane");
		if (!pane || !lastWorkflow || !subject) return;
		const subjectObject = subject.kind === "object" ? lastWorkflow.byId.get(subject.id) : null;
		const lineage = localLineage(subject);
		pane.replaceChildren();
		pane.dataset.qfProjectionSubject = subject.kind === "object" ? subject.id : `${subject.kindName}:${subject.from_id}:${subject.to_id}`;
		pane.dataset.qfLocalObjects = lineage.objectIds.join(",");
		pane.dataset.qfLocalLinks = lineage.linkKeys.join(",");
		const heading = document.createElement("h3");
		heading.className = "dock-inspect-heading";
		heading.textContent = subjectObject
			? researchTilePresentation(subjectObject, lastWorkflow, getParticipantView).title
			: "Selected relationship";
		pane.appendChild(heading);
		const back = document.createElement("button");
		back.type = "button";
		back.className = "dk-link qf-world-back";
		back.dataset.qfBackToWorld = "true";
		back.textContent = "Back to world";
		pane.appendChild(back);
		if (subjectObject) {
			pane.appendChild(renderDockObjectOverview(subjectObject, lastWorkflow, getParticipantView));
		} else {
			const overview = document.createElement("div");
			overview.className = "dock-inspect-overview";
			const authority = document.createElement("div");
			authority.className = "dock-inspect-authority";
			const badge = document.createElement("span");
			badge.className = "qf-world-type-label";
			badge.textContent = "RELATIONSHIP";
			const kind = document.createElement("span");
			kind.className = "qf-world-status";
			kind.textContent = subject.kindName;
			authority.append(badge, kind);
			overview.appendChild(authority);
			const from = lastWorkflow.byId.get(subject.from_id);
			const to = lastWorkflow.byId.get(subject.to_id);
			appendInspectFact(overview, "Direction", `${from ? objectHumanTitle(from, null, lastWorkflow) : "Not recorded"} → ${to ? objectHumanTitle(to, null, lastWorkflow) : "Not recorded"}`);
			pane.appendChild(overview);
		}
		const technical = document.createElement("details");
		technical.className = "dock-inspect-technical";
		const technicalSummary = document.createElement("summary");
		technicalSummary.textContent = "Technical details";
		const technicalBody = document.createElement("div");
		technicalBody.className = "dock-inspect-technical-body";
		const identity = document.createElement("div");
		identity.className = "dock-inspect-id";
		identity.textContent = subjectObject ? `${subjectObject.type} · ${subjectObject.id}` : `${subject.kindName} · ${subject.from_id} → ${subject.to_id}`;
		technicalBody.appendChild(identity);
		if (subjectObject) {
			const tile = subjectObject.type === "agent_session"
				? tiles.find((entry) => entry.sessionId === subjectObject.id)
				: tiles.find((entry) => entry.type === "research" && entry.ontologyType === subjectObject.type && entry.ontologyId === subjectObject.id);
			const details = tile && getTileDOMs().get(tile.id)?.container?._qfWorldDetails;
			if (details) {
				details.hidden = false;
				technicalBody.appendChild(details);
			} else {
				for (const field of FIELD_ORDER[subjectObject.type] || Object.keys(subjectObject.fields || {})) {
					technicalBody.appendChild(makeField(field, subjectObject.fields?.[field], Object.prototype.hasOwnProperty.call(subjectObject.fields || {}, field)));
				}
			}
		} else {
			const lineageBlock = document.createElement("div");
			lineageBlock.className = "qf-world-relations";
			for (const key of lineage.linkKeys) {
				const [kind, fromId, toId] = key.split("\u0000");
				const row = document.createElement("div");
				row.className = "qf-world-relation";
				row.dataset.kind = kind;
				row.dataset.fromId = fromId;
				row.dataset.toId = toId;
				row.textContent = `${kind} · ${fromId} → ${toId}`;
				lineageBlock.appendChild(row);
			}
			technicalBody.appendChild(lineageBlock);
		}
		technical.append(technicalSummary, technicalBody);
		pane.appendChild(technical);
	}

	function visibleObjectIds() {
		if (!lastWorkflow) return new Set();
		if (projectionState === PROJECTION_ORDINARY) return new Set(lastWorkflow.objects.map((object) => object.id));
		if (projectionState === PROJECTION_FULL) return new Set(lastWorkflow.objects.map((object) => object.id));
		const ids = new Set(lastWorkflow.currentMissionIds);
		if (selectedSubject) for (const id of localLineage(selectedSubject).objectIds) ids.add(id);
		return ids;
	}

	function visibleLinkKeys() {
		if (!lastWorkflow) return new Set();
		const objectIds = visibleObjectIds();
		if (projectionState === PROJECTION_ORDINARY) return new Set();
		if (projectionState === PROJECTION_MISSION) return new Set([...lastWorkflow.primaryLinkKeys].filter((key) => {
			const [, fromId, toId] = key.split("\u0000");
			return objectIds.has(fromId) && objectIds.has(toId);
		}));
		return new Set(lastWorkflow.links
			.filter((link) => objectIds.has(link.from_id) && objectIds.has(link.to_id))
			.map((link) => `${link.kind}\u0000${link.from_id}\u0000${link.to_id}`));
	}

	function syncStageLabels(visibleIds) {
		for (const label of document.querySelectorAll?.(".qf-world-stage-label") || []) label.remove();
		for (const [stage, members] of lastWorkflow.stages.entries()) {
			const anchor = members.find((object) => visibleIds.has(object.id));
			if (!anchor) continue;
			const tile = anchor.type === "agent_session"
				? tiles.find((entry) => entry.sessionId === anchor.id)
				: tiles.find((entry) => entry.type === "research" && entry.ontologyType === anchor.type && entry.ontologyId === anchor.id);
			const container = tile && getTileDOMs().get(tile.id)?.container;
			if (!container) continue;
			const label = document.createElement("div");
			label.className = "qf-world-stage-label";
			label.dataset.qfStage = String(stage);
			label.textContent = WORKFLOW_STAGE_LABELS[stage];
			container.appendChild(label);
		}
	}

	function syncCableProjectionPaint() {
		if (!lastWorkflow) return;
		const lineage = selectedSubject ? localLineage(selectedSubject) : null;
		const localKeys = new Set(lineage?.linkKeys || []);
		for (const path of document.querySelectorAll?.(".cable-path[data-qf-world-cable-kind]") || []) {
			const key = `${path.dataset.qfWorldCableKind}\u0000${path.dataset.qfWorldCableFrom}\u0000${path.dataset.qfWorldCableTo}`;
			const selected = path.classList.contains("cable-path--selected");
			const inspecting = Boolean(selectedSubject);
			const local = inspecting && localKeys.has(key);
			const visibility = inspecting ? (local ? "normal" : "dim") : "background";
			path.dataset.qfProjectionVisibility = selected ? "selected" : visibility;
			path.style.opacity = String(selected || local ? 0.9 : projectionState === PROJECTION_MISSION ? 0.28 : 0.16);
		}
	}

	function observeCablePaint() {
		if (cableObserver || typeof MutationObserver === "undefined") return;
		const overlay = document.getElementById?.("cable-overlay");
		if (!overlay) return;
		cableObserver = new MutationObserver(() => syncCableProjectionPaint());
		cableObserver.observe(overlay, { childList: true, subtree: true });
	}

	function applyProjection({ fit = false } = {}) {
		if (!lastWorkflow) return;
		const ordinary = projectionState === PROJECTION_ORDINARY;
		const visibleIds = visibleObjectIds();
		const local = selectedSubject ? localLineage(selectedSubject) : null;
		const doms = getTileDOMs();
		const visibleTiles = [];
		if (ordinary) {
			for (const tile of tiles) {
				const dom = doms.get(tile.id);
				if (!dom?.container) continue;
				dom.container.hidden = false;
				dom.container.setAttribute("aria-hidden", "false");
				dom.container.style.pointerEvents = "";
				delete dom.container.dataset.qfProjectionVisibility;
				delete dom.container.dataset.qfSelected;
			}
		}
		for (const object of lastWorkflow.objects) {
			const tile = object.type === "agent_session"
				? tiles.find((entry) => entry.sessionId === object.id)
				: tiles.find((entry) => entry.type === "research" && entry.ontologyType === object.type && entry.ontologyId === object.id);
			const dom = tile && doms.get(tile.id);
			if (!tile || !dom) continue;
			const visible = ordinary || visibleIds.has(object.id);
			const normal = ordinary || !local || local.objectIds.includes(object.id);
			const selected = selectedSubject?.kind === "object" && selectedSubject.id === object.id;
			dom.container.hidden = !visible;
			dom.container.setAttribute("aria-hidden", visible ? "false" : "true");
			dom.container.dataset.qfProjectionState = projectionState;
			dom.container.dataset.qfProjectionVisibility = visible ? (normal ? "normal" : "dim") : "hidden";
			dom.container.dataset.qfSelected = selected ? "true" : "false";
			if (!dom.container.style) dom.container.style = {};
			dom.container.style.opacity = visible && normal ? "1" : visible ? "0.35" : "";
			dom.container.style.pointerEvents = visible ? "" : "none";
			if (visible) visibleTiles.push(tile);
		}
		const viewer = document.getElementById?.("panel-viewer");
		if (ordinary) viewer?.removeAttribute("data-qf-research-projection-active");
		else viewer?.setAttribute("data-qf-research-projection-active", "true");
		syncStageLabels(ordinary ? new Set() : visibleIds);
		const keySet = visibleLinkKeys();
		const cables = lastWorkflow.links.filter((link) => keySet.has(`${link.kind}\u0000${link.from_id}\u0000${link.to_id}`)).map((link) => makeWorldCable(link, lastWorkflow));
		tileManager.repositionAllTiles?.();
		onCables?.(cables.filter(Boolean));
		observeCablePaint();
		globalThis.queueMicrotask?.(() => syncCableProjectionPaint());
		const controls = ensureProjectionControls();
		if (controls) {
			controls.hidden = ordinary;
			controls.dataset.qfProjectionState = projectionState;
			controls.querySelector("[data-qf-projection-label]")?.replaceChildren(document.createTextNode(
				projectionState === PROJECTION_FULL ? "full lineage" : "current Mission",
			));
			const full = controls.querySelector("[data-qf-world-full]");
			const back = controls.querySelector("[data-qf-world-back]");
			if (full) full.hidden = projectionState !== PROJECTION_MISSION;
			if (back) back.hidden = ordinary;
		}
		if (selectedSubject) renderDockInspect(selectedSubject);
		if (fit) tileManager.onResearchWorldReady?.(visibleTiles);
	}

	function saveOverview() {
		return { state: projectionState, dockMode: currentDockMode() };
	}

	function selectSubject(subject) {
		if (!lastWorkflow || !subject) return;
		selectedSubject = subject;
		if (subject.kind === "object") onClearCableSelection?.();
		applyProjection();
		setDockMode("INSPECT");
	}

	function restoreOverview() {
		projectionState = PROJECTION_ORDINARY;
		selectedSubject = null;
		savedOverview = null;
		onClearCableSelection?.();
		clearInspectSurface();
		applyProjection();
		setDockMode("START");
	}

	bindBackToWorldControls(document, restoreOverview);

	function makeWorldCable(link, workflow) {
		const fromTileId = resolveResearchWorldEndpointTileId(workflow.objects, tiles, link.from_id);
		const toTileId = resolveResearchWorldEndpointTileId(workflow.objects, tiles, link.to_id);
		const fromTile = tiles.find((tile) => tile.id === fromTileId);
		const toTile = tiles.find((tile) => tile.id === toTileId);
		if (!fromTileId || !toTileId || !fromTile || !toTile) return null;
		const worldTileIds = new Set(workflow.objects.map((object) => resolveResearchWorldEndpointTileId(workflow.objects, tiles, object.id)).filter(Boolean));
		const ports = researchCablePorts(fromTile, toTile, tiles.filter((tile) => worldTileIds.has(tile.id)));
		const fromType = researchTilePresentation(workflow.byId.get(link.from_id), workflow, getParticipantView).badge;
		const toType = researchTilePresentation(workflow.byId.get(link.to_id), workflow, getParticipantView).badge;
		return {
			id: `research-view:${link.kind}:${link.from_id}:${link.to_id}`,
			kind: "view",
			from_ref: `${fromTileId}:${ports.from}`,
			to_ref: `${toTileId}:${ports.to}`,
			qfWorldCableKind: link.kind,
			qfWorldCableFrom: link.from_id,
			qfWorldCableTo: link.to_id,
			qfWorldCableLabel: `${link.kind} · ${fromType} → ${toType}`,
			qfWorldCableCurrent: workflow.currentReport?.id === link.to_id,
			qfWorldCableHistorical: workflow.historyIds.has(link.to_id),
		};
	}

	function renderTile(dom, tile, object) {
		const found = object || lastWorld?.objects?.find((entry) => entry.type === tile.ontologyType && entry.id === tile.ontologyId);
		if (found) renderObject(dom, tile, found, reveal, lastWorkflow, refreshOutcome, selectSubject, getParticipantView);
	}

	function existing(type, id) {
		return tiles.find((tile) => tile.id === tileId(type, id));
	}

	async function refreshOutcome() {
		if (lastRoot) await reveal(lastRoot.type, lastRoot.id);
	}

	function decorateSession(object) {
		const tile = tiles.find((entry) => entry.sessionId === object.id);
		const dom = tile && getTileDOMs().get(tile.id);
		if (dom) {
			bindObjectSelection(dom.container, { kind: "object", type: object.type, id: object.id }, selectSubject);
			dom.container.dataset.qfWorldType = object.type;
			dom.container.dataset.qfWorldId = object.id;
			const view = getParticipantView?.(object.id, object);
			const presentation = researchTilePresentation(object, lastWorkflow, getParticipantView);
			dom.container.setAttribute("aria-label", `${object.type} ${object.id}`);
			dom.container.setAttribute("aria-description", `${presentation.title} · PARTICIPANT · ${presentation.status} · ${view?.historical ? "HISTORICAL SESSION" : "CURRENT SESSION"}`);
			dom.container.dataset.qfParticipantId = object.id;
			if (view) {
				dom.container.dataset.qfParticipantRole = view.role;
				dom.container.dataset.qfParticipantSession = view.session;
				dom.container.dataset.qfParticipantRuntime = view.runtimeState;
				dom.container.dataset.qfParticipantWork = view.work;
				dom.container.dataset.qfParticipantRecovery = view.recovery;
				dom.container.dataset.qfParticipantHistory = view.historical ? "true" : "false";
			}
			const taskFoot = dom.taskFoot;
			if (taskFoot) {
				let card = taskFoot.querySelector?.(".qf-world-participant-card") ||
					[...(taskFoot.children || [])].find((child) => child.classList?.contains("qf-world-participant-card"));
				if (!card) {
					card = document.createElement("div");
					card.className = "qf-world-participant-card";
					taskFoot.appendChild(card);
				}
				const terminalToggle = document.createElement("button");
				terminalToggle.type = "button";
				terminalToggle.className = "qf-world-terminal-toggle";
				const syncTerminalToggle = () => {
					const expanded = dom.container.dataset.qfTerminalExpanded === "true";
					terminalToggle.textContent = expanded ? "Back to participant" : "Terminal";
					terminalToggle.setAttribute("aria-expanded", expanded ? "true" : "false");
				};
				terminalToggle.addEventListener("click", (event) => {
					event.stopPropagation();
					dom.container.dataset.qfTerminalExpanded = dom.container.dataset.qfTerminalExpanded === "true" ? "false" : "true";
					syncTerminalToggle();
				});
				syncTerminalToggle();
				card.replaceChildren(renderPresentationCard(presentation), terminalToggle);
			}
			const details = document.createElement("div");
			details.className = "qf-world-details";
			details.hidden = true;
			details.append(...researchSessionReceiptFields(object).map(({ field, value }) => makeField(field, value)));
			if (view) details.append(...participantFieldRows(view).map(({ field, value }) => makeField(field, value, true)));
			const relations = document.createElement("div");
			relations.className = "qf-world-relations";
			for (const direction of ["incoming", "outgoing"]) {
				for (const link of (lastWorkflow?.links || []).filter((candidate) => direction === "incoming" ? candidate.to_id === object.id : candidate.from_id === object.id)) {
					const row = document.createElement("div");
					row.className = "qf-world-relation";
					row.dataset.direction = direction;
					row.dataset.kind = link.kind;
					row.dataset.fromId = link.from_id;
					row.dataset.toId = link.to_id;
					row.textContent = `${direction} · ${link.kind} · ${link.from_id} → ${link.to_id}`;
					relations.appendChild(row);
				}
			}
			if (relations.children.length > 0) details.appendChild(relations);
			dom.container._qfWorldDetails = details;
		}
		return tile;
	}

	function refreshParticipants() {
		if (!lastWorkflow) return;
		for (const object of lastWorkflow.objects) {
			if (object.type === "agent_session") decorateSession(object);
		}
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
		const dockMode = currentDockMode();
		const result = await window.shellApi.qf.getResearchWorldProjection({ root_type: rootType, root_id: rootId });
		if (!result?.ok) { showStatus?.(result?.message || "Research world unavailable"); return result; }
		lastRoot = { type: rootType, id: rootId };
		lastWorld = result.world;
		lastWorkflow = deriveResearchWorkflow(result.world);
		projectionState = PROJECTION_MISSION;
		selectedSubject = null;
		savedOverview = null;
		onClearCableSelection?.();
		clearInspectSurface();
		ensureProjectionControls();
  document.dispatchEvent?.(new CustomEvent("qf:research-world-active", { detail: { missionId: lastWorkflow.mission?.id || rootId, world: result.world } }));
		const navToggle = document.getElementById?.("nav-toggle");
		if (navToggle?.getAttribute?.("aria-pressed") === "true") navToggle.click?.();
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
		const missingSessionObjects = result.world.objects.filter((object) =>
			object.type === "agent_session" && !tiles.some((tile) => tile.sessionId === object.id));
		for (const [index, object] of missingSessionObjects.entries()) {
			const sessionTile = tileManager.createSessionTile?.(
				80 + index * (WORLD_TILE_WIDTH + WORLD_LANE_GAP),
				80,
				object.id,
			);
			normalizeSessionTile(sessionTile);
		}
		let rootTile = existing(rootType, rootId);
		if (!rootTile) {
			const rootObject = result.world.objects.find((object) => object.type === rootType && object.id === rootId);
			const occupied = tiles.map(rectFor);
			const candidate = { x: 80, y: 80, width: WORLD_TILE_WIDTH, height: WORLD_TILE_HEIGHT };
			while (occupied.some((other) => overlaps(candidate, other))) candidate.y += WORLD_COLLISION_STEP;
			rootTile = tileManager.createResearchTile(candidate.x, candidate.y, rootObject);
		}
		normalizeResearchTile(rootTile);
		for (const tile of tiles.filter((entry) => entry.sessionId)) normalizeSessionTile(tile);
		const existingWorldResearch = tiles.filter((tile) => worldResearchIds.has(tile.id));
		for (const tile of existingWorldResearch) normalizeResearchTile(tile);
		const repairMalformedLayout = true;
		const denseLayout = researchWorldLayout(lastWorkflow);
		const layoutIds = new Set(existingWorldResearch.map((tile) => tile.id));
		const occupied = tiles.filter((tile) => !layoutIds.has(tile.id) && !worldSessionIds.has(tile.sessionId)).map(rectFor);
		occupied.push({ ...rectFor(rootTile), width: WORLD_TILE_WIDTH, height: WORLD_TILE_HEIGHT });
		const nextY = [
			rootTile.y + WORLD_TILE_HEIGHT + WORLD_ROW_GAP,
			rootTile.y,
			rootTile.y,
			rootTile.y,
		];
		const ordered = [...result.world.objects].sort((a, b) =>
			laneFor(a) - laneFor(b) ||
			(WORLD_TYPE_ORDER.get(a.type) ?? 99) - (WORLD_TYPE_ORDER.get(b.type) ?? 99) ||
			a.id.localeCompare(b.id));
		const projectedLayout = [];
		if (repairMalformedLayout) {
			projectedLayout.push({ ...rootTile, ...(denseLayout.get(rootTile.id) || {}), width: WORLD_TILE_WIDTH, height: WORLD_TILE_HEIGHT });
			const sessionTiles = result.world.objects
				.filter((object) => object.type === "agent_session")
				.map((object) => tiles.find((tile) => tile.sessionId === object.id))
				.filter(Boolean);
			for (const tile of sessionTiles) {
				normalizeSessionTile(tile);
				projectedLayout.push({ ...tile, ...(denseLayout.get(tileId("agent_session", tile.sessionId)) || {}) });
			}
		}
		for (const object of ordered) {
			if (object.type === "agent_session") { decorateSession(object); continue; }
			let tile = existing(object.type, object.id);
			if (tile?.id === rootTile.id) { renderTile(getTileDOMs().get(tile.id), tile, object); continue; }
			const pos = denseLayout.get(tileId(object.type, object.id)) || positionFor(nextY, object, rootTile, occupied);
			if (!tile) {
				tile = tileManager.createResearchTile(pos.x, pos.y, object);
			} else {
				renderTile(getTileDOMs().get(tile.id), tile, object);
			}
			normalizeResearchTile(tile);
			if (repairMalformedLayout) projectedLayout.push({ ...tile, ...pos, width: WORLD_TILE_WIDTH, height: WORLD_TILE_HEIGHT });
		}
	if (repairMalformedLayout && projectedLayout.length > 0) {
		const rootProjection = projectedLayout.find((tile) => tile.id === rootTile.id);
		if (rootProjection && rootTile.locked === true) {
			rootTile.x = rootProjection.x;
			rootTile.y = rootProjection.y;
		}
		tileManager.applyTileLayout?.(projectedLayout);
	}
		if (staleProjectionIds.length > 0 || projectedLayout.length > 0) tileManager.saveCanvasImmediate?.();
		tileManager.repositionAllTiles?.();
		applyProjection({ fit: true });
		setDockMode(dockMode);
		return result;
	}

	function selectRelationship(connection) {
		if (!connection?.qfWorldCableKind || !connection.qfWorldCableFrom || !connection.qfWorldCableTo) return;
		selectSubject({
			kind: "link",
			kindName: connection.qfWorldCableKind,
			from_id: connection.qfWorldCableFrom,
			to_id: connection.qfWorldCableTo,
		});
	}

	function installCableSelectionBridge() {
		const overlay = document.getElementById?.("cable-overlay");
		if (!overlay || overlay._qfResearchWorldSelectionBridge) return;
		const handler = (event) => {
			const path = event.target?.closest?.(".cable-path[data-qf-world-cable-kind]");
			if (!path) return;
			selectRelationship({
				qfWorldCableKind: path.dataset.qfWorldCableKind,
				qfWorldCableFrom: path.dataset.qfWorldCableFrom,
				qfWorldCableTo: path.dataset.qfWorldCableTo,
			});
		};
		overlay.addEventListener("pointerdown", handler, true);
		overlay._qfResearchWorldSelectionBridge = handler;
	}

	function hydrateSaved() {
		installCableSelectionBridge();
		projectionState = PROJECTION_ORDINARY;
		selectedSubject = null;
		savedOverview = null;
		clearInspectSurface();
		const controls = ensureProjectionControls();
		if (controls) {
			controls.hidden = true;
			controls.dataset.qfProjectionState = PROJECTION_ORDINARY;
		}
		if (lastWorkflow) applyProjection();
	}

	installCableSelectionBridge();
	return {
		reveal,
		renderTile,
		refreshParticipants,
		hydrateSaved,
		selectRelationship,
		getLastWorld: () => lastWorld,
		getLastRoot: () => lastRoot,
		getProjectionState: () => projectionState,
		getProjectionModel: () => lastWorkflow,
	};
}
