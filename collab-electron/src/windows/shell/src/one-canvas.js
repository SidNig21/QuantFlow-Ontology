import { tiles } from "./canvas-state.js";
import {
	blockedReviewPresentation,
	criticMaterialAttack,
	deriveResearchWorkflow,
	contextualInspectReceipt,
} from "./research-workflow.js";

const RESULT_WIDTH = 460;
const RESULT_HEIGHT = 320;
const INVESTIGATION_WIDTH = 480;
const INVESTIGATION_HEIGHT = 300;

function definitionGroups(definition) {
	const value = definition?.capability_groups;
	if (Array.isArray(value)) return value;
	try { return JSON.parse(String(value ?? "[]")); } catch { return []; }
}

export function readyDirectorDefinitions(definitions) {
	return (Array.isArray(definitions) ? definitions : []).filter((definition) =>
		definition?.id === "hermes-research-director" &&
		definition?.role === "orchestrator" &&
		definition?.display_name === "Research Director" &&
		definitionGroups(definition).includes("desk.orchestrate")
	);
}

export function hasLiveDirectorSurface(canvasTiles) {
	return (Array.isArray(canvasTiles) ? canvasTiles : []).some((tile) =>
		Boolean(tile?.sessionId) && tile?.definitionId === "hermes-research-director"
	);
}

function nextPosition() {
	const visible = tiles.filter((tile) => !tile.hidden);
	if (visible.length === 0) return { x: 80, y: 80 };
	return {
		x: Math.max(...visible.map((tile) => tile.x + tile.width)) + 48,
		y: Math.min(...visible.map((tile) => tile.y)),
	};
}

function appendText(parent, className, text) {
	const node = document.createElement("div");
	node.className = className;
	node.textContent = text;
	parent.appendChild(node);
	return node;
}

function humanize(value) {
	return String(value ?? "Not recorded").replace(/_/g, " ").toLowerCase().replace(/^./, (letter) => letter.toUpperCase());
}

/** Product surfaces are a deliberate subset of Kernel truth, never object cardinality. */
export function oneCanvasSurfaceObjects(workflow) {
	if (!workflow) return [];
	if (workflow.currentReport) return [workflow.currentReport];
	return workflow.mission ? [workflow.mission] : [];
}

export function requireSecondCriticAdmission(response) {
	if (!response?.ok) throw new Error(response?.error?.message ?? "Second critic failed");
	if (response.result?.kind === "refused") throw new Error(response.result?.receipt?.message ?? "A new independent Critic is not available.");
	return response.result;
}

/** One persistent desk: deliberate surfaces in front, exact Kernel detail in Inspect. */
export function createOneCanvasController({ tileManager, getTileDOMs, onCables, onClearCableSelection, showStatus, getParticipantView, onSecondCritic }) {
	let lastRoot = null;
	let lastWorld = null;
	let lastWorkflow = null;
	let selectedSubject = null;
	const analysisErrors = new Map();

	function clearInspect() {
		const pane = document.getElementById("dock-inspect-pane");
		if (pane) pane.replaceChildren();
	}

	function inspect(object) {
		if (!object || !lastWorkflow) return;
		selectedSubject = { kind: "object", type: object.type, id: object.id };
		onClearCableSelection?.();
		const pane = document.getElementById("dock-inspect-pane");
		if (!pane) return;
		pane.replaceChildren();
		appendText(pane, "dock-inspect-heading", object.type === "artifact" && object.fields?.kind === "report" ? "Decision details" : humanize(object.type));
		const facts = document.createElement("div");
		facts.className = "dock-inspect-facts";
		const fields = object.fields && typeof object.fields === "object" ? object.fields : {};
		const decision = fields.market_decision && typeof fields.market_decision === "object" ? fields.market_decision : null;
		const summaryFields = object.type === "mission"
			? [["Question", fields.name ?? fields.objective], ["State", fields.state], ["Next action", lastWorkflow.sourceTask?.fields?.status === "open" ? "Wait for the active participant or cancel it." : "Analyze or refresh the selected market."]]
			: decision ? [["Question", decision.hypothesis], ["Research assessment", decision.research_assessment], ["Bovada action", decision.classification], ["Why", decision.selection_reason ?? decision.rationale], ["Next action", decision.change_condition]]
			: object.type === "agent_session" ? [["Participant", fields.display_name ?? fields.label ?? humanize(fields.role)], ["State", fields.status], ["Current work", fields.current_task_title ?? "No active Task"]]
			: [["Summary", fields.name ?? fields.title ?? fields.kind ?? humanize(object.type)], ["State", fields.status ?? fields.state]];
		for (const [label, value] of summaryFields) {
			if (value === null || value === undefined || value === "") continue;
			const row = document.createElement("div");
			row.className = "qf-world-field";
			appendText(row, "qf-world-field-label", humanize(label));
			appendText(row, "qf-world-field-value", typeof value === "object" ? JSON.stringify(value) : String(value));
			facts.appendChild(row);
		}
		pane.appendChild(facts);
		const receipt = contextualInspectReceipt(lastWorkflow, object);
		if (receipt?.evidence.length) appendText(pane, "dock-inspect-link", `${receipt.evidence.length} exact evidence/computation item${receipt.evidence.length === 1 ? "" : "s"} available`);
		if (receipt?.evaluation) {
			appendText(pane, "dock-inspect-subheading", "Independent evaluation");
			appendText(pane, "dock-inspect-link", humanize(receipt.evaluation.fields?.verdict));
		}
		if (receipt?.revisions.length) appendText(pane, "dock-inspect-link", `${receipt.revisions.length} durable decision revision${receipt.revisions.length === 1 ? "" : "s"}`);
		const technical = document.createElement("details");
		technical.className = "dock-inspect-technical";
		const summary = document.createElement("summary");
		summary.textContent = "Technical details";
		const body = appendText(technical, "dock-inspect-technical-body", JSON.stringify({ object: { type: object.type, id: object.id, fields }, ...receipt }, null, 2));
		body.style.whiteSpace = "pre-wrap";
		technical.prepend(summary);
		pane.appendChild(technical);
		document.querySelector?.('[data-dock-mode="INSPECT"]')?.click();
	}

	function bindSelection(container, object) {
		if (!container || container._qfOneCanvasSelection) return;
		const handler = (event) => {
			if (event.button !== undefined && event.button !== 0) return;
			if (event.target?.closest?.("button, input, textarea, select, webview, .gl-tile__spine")) return;
			inspect(object);
		};
		container._qfOneCanvasSelection = handler;
		container.addEventListener("pointerdown", handler, true);
	}

	function renderReadyDirector(dom, tile, definition) {
		if (!dom?.contentArea || dom.container.dataset.qfReadyDirector === "true") return;
		dom.container.dataset.qfReadyDirector = "true";
		dom.container.dataset.qfSurfaceKind = "director-ready";
		dom.titleText.textContent = "Research Director";
		if (dom.idSpan) dom.idSpan.textContent = "DIRECTOR";
		dom.contentArea.replaceChildren();
		const surface = document.createElement("div");
		surface.className = "qf-ready-director";
		appendText(surface, "qf-ready-director__eyebrow", "HERMES · DIRECTOR");
		appendText(surface, "qf-ready-director__title", "What do you want to investigate?");
		appendText(surface, "qf-ready-director__body", "Start the Director when you are ready. Nothing else has been restored or launched.");
		const start = document.createElement("button");
		start.type = "button";
		start.className = "qf-ready-director__start";
		start.textContent = "Start Director";
		start.addEventListener("click", async () => {
			if (start.disabled) return;
			start.disabled = true;
			start.textContent = "Starting…";
			try {
				const result = await window.shellApi.qf.spawnSession({ definitionId: definition.id });
				if (!result?.ok) throw new Error(result?.error?.message ?? "Director could not start");
				tileManager.closeCanvasTile(tile.id);
			} catch (error) {
				start.disabled = false;
				start.textContent = "Retry Director";
				showStatus?.(error?.message ?? String(error));
			}
		});
		surface.appendChild(start);
		dom.contentArea.appendChild(surface);
	}

	async function ensureReadyDirector() {
		if (tiles.some((tile) => tile.sessionId || tile.ontologyType === "ready_director")) return;
		const listed = await window.shellApi.qf.listDefinitions();
		const definitions = listed?.definitions ?? listed?.rows ?? [];
		const eligible = readyDirectorDefinitions(definitions);
		if (eligible.length !== 1) {
			showStatus?.("Exactly one ready Research Director definition is required.");
			return;
		}
		const definition = eligible[0];
		const tile = tileManager.createResearchTile(80, 80, { type: "ready_director", id: definition.id, fields: {} });
		tile.width = 520;
		tile.height = 340;
		const dom = getTileDOMs().get(`ontology:ready_director:${definition.id}`);
		if (dom) renderReadyDirector(dom, tile, definition);
		tileManager.repositionAllTiles();
	}

	function retireReadyDirectorWhenLive() {
		if (!hasLiveDirectorSurface(tiles)) return false;
		for (const tile of tiles.filter((entry) => entry.ontologyType === "ready_director")) {
			tileManager.closeCanvasTile(tile.id);
		}
		return true;
	}

	function renderResult(dom, tile, object) {
		if (!dom?.contentArea) return;
		const decision = object.fields?.market_decision;
		if (!decision) return;
		dom.container.dataset.qfSurfaceKind = "decision-result";
		dom.container.dataset.qfResearchAssessment = String(decision.research_assessment ?? "");
		dom.container.dataset.qfMarketActionability = String(decision.classification ?? "");
		dom.titleText.textContent = "Research decision";
		tile.width = RESULT_WIDTH;
		tile.height = RESULT_HEIGHT;
		dom.contentArea.replaceChildren();
		const surface = document.createElement("section");
		surface.className = "qf-decision-surface";
		appendText(surface, "qf-decision-surface__question", String(decision.hypothesis ?? "Current inquiry"));
		const assessment = appendText(surface, "qf-decision-surface__assessment", `Research: ${humanize(decision.research_assessment)}`);
		assessment.dataset.assessment = String(decision.research_assessment ?? "");
		const actionability = appendText(surface, "qf-decision-surface__actionability", `Bovada now: ${String(decision.classification ?? "UNAVAILABLE")}`);
		actionability.dataset.actionability = String(decision.classification ?? "");
		appendText(surface, "qf-decision-surface__reason", String(decision.selection_reason ?? decision.rationale ?? "No reason recorded"));
		appendText(surface, "qf-decision-surface__condition", `Next condition: ${String(decision.change_condition ?? "No change condition recorded")}`);
		if (lastWorkflow?.evaluation) {
			appendText(surface, "qf-decision-surface__critic", `Critic: ${humanize(lastWorkflow.evaluation.fields?.verdict)} · independently reviewed`);
			const attack = criticMaterialAttack(lastWorkflow);
			if (attack) appendText(surface, "qf-decision-surface__attack", `Strongest challenge: ${attack}`);
		}
		const button = document.createElement("button");
		button.type = "button";
		button.className = "qf-decision-surface__inspect";
		button.textContent = "Inspect evidence and lineage";
		button.addEventListener("click", (event) => { event.stopPropagation(); inspect(object); });
		surface.appendChild(button);
		dom.contentArea.appendChild(surface);
		bindSelection(dom.container, object);
	}

	function renderInvestigation(dom, tile, mission) {
		if (!dom?.contentArea || !lastWorkflow?.marketQuote) return;
		const blocked = blockedReviewPresentation(lastWorkflow);
		dom.container.dataset.qfSurfaceKind = "investigation";
		dom.titleText.textContent = "UFC market investigation";
		tile.width = INVESTIGATION_WIDTH;
		tile.height = blocked ? 500 : INVESTIGATION_HEIGHT;
		dom.contentArea.replaceChildren();
		const surface = document.createElement("section");
		surface.className = "qf-investigation-surface";
		appendText(surface, "qf-investigation-surface__eyebrow", "YOUR QUESTION · LIVE BOVADA MARKET");
		appendText(surface, "qf-investigation-surface__question", String(mission.fields?.name ?? mission.fields?.objective ?? "Current investigation"));
		const runtimeFailed = lastWorkflow.executor?.fields?.status === "failed";
		const reviewActive = lastWorkflow.reviewTask?.fields?.status === "open";
		const researchActive = (lastWorkflow.sourceTask?.fields?.status === "open" || reviewActive) && !runtimeFailed;
		const stateText = blocked?.secondCriticInProgress ? "Second independent review is in progress"
			: blocked ? "Publication blocked"
				: runtimeFailed ? "The research provider became unavailable. Your saved evidence is intact; retry after service returns."
				: reviewActive ? "Independent review is in progress"
				: researchActive ? "Research is in progress" : "Ready for evidence, calculation, and independent review";
		appendText(surface, "qf-investigation-surface__state", stateText);
		if (blocked) {
			appendText(surface, "qf-investigation-surface__blocked", blocked.state);
			for (const evaluation of blocked.evaluations) {
				appendText(surface, "qf-investigation-surface__critic", `Critic ${evaluation.index} verdict: ${evaluation.verdict}`);
				if (evaluation.attack) appendText(surface, "qf-investigation-surface__attack", `Strongest material finding: ${evaluation.attack}`);
			}
		}
		const priorError = analysisErrors.get(mission.id);
		if (priorError) appendText(surface, "qf-investigation-surface__error", priorError);
		const analyze = document.createElement("button");
		analyze.type = "button";
		analyze.className = "qf-investigation-surface__analyze";
		analyze.textContent = reviewActive ? "Independent review in progress" : researchActive ? "Research in progress" : runtimeFailed ? "Resume with current market" : "Analyze and independently review";
		analyze.disabled = researchActive || Boolean(blocked);
		analyze.addEventListener("click", async (event) => {
			event.stopPropagation();
			analysisErrors.delete(mission.id);
			analyze.disabled = true;
			analyze.textContent = "Starting governed research…";
			try {
				const result = await window.shellApi.qf.analyzeMarketAndReview({ mission_id: mission.id, quote_id: lastWorkflow.marketQuote.id, ...(runtimeFailed && lastWorkflow.sourceTask?.id ? { retry_task_id: lastWorkflow.sourceTask.id } : {}) });
				if (!result?.ok) throw new Error(result?.error?.message ?? "Research could not start");
				analysisErrors.delete(mission.id);
				analyze.textContent = "Research in progress";
				showStatus?.("Researcher started. The independent Critic follows the durable result.");
				await reveal("mission", mission.id);
			} catch (error) {
				const message = error?.message ?? String(error);
				analysisErrors.set(mission.id, message);
				analyze.disabled = false;
				analyze.textContent = runtimeFailed ? "Resume with current market" : "Analyze and independently review";
				showStatus?.(message);
				await reveal("mission", mission.id);
			}
		});
		if (!blocked) surface.appendChild(analyze);
		if (blocked) {
			const actions = document.createElement("div");
			actions.className = "qf-investigation-surface__review-actions";
			const revision = document.createElement("button");
			revision.type = "button";
			revision.className = "qf-investigation-surface__revision";
			revision.textContent = "Request revision unavailable";
			revision.disabled = true;
			revision.title = "Revision will be available when QuantFlow can create and review a new result version.";
			actions.appendChild(revision);
			const second = document.createElement("button");
			second.type = "button";
			second.className = "qf-investigation-surface__second-critic";
			second.textContent = blocked.secondCriticInProgress ? "Second critic in progress" : "Second critic";
			second.disabled = blocked.reviewInProgress;
			second.addEventListener("click", async (event) => {
				event.stopPropagation();
				if (second.disabled) return;
				analysisErrors.delete(mission.id);
				second.disabled = true;
				second.textContent = "Starting second critic…";
				try {
					await onSecondCritic?.(lastWorkflow.sourceTask.id, lastWorkflow.evaluation.id, crypto.randomUUID());
					showStatus?.("A new independent Critic is reviewing the same frozen work.");
					await reveal("mission", mission.id);
				} catch (error) {
					const message = error?.message ?? String(error);
					analysisErrors.set(mission.id, message);
					showStatus?.(message);
					await reveal("mission", mission.id);
				}
			});
			actions.appendChild(second);
			surface.appendChild(actions);
			appendText(surface, "qf-investigation-surface__revision-note", "Revision is unavailable until QuantFlow can create a new result version and send it through independent review.");
		}
		const inspectButton = document.createElement("button");
		inspectButton.type = "button";
		inspectButton.className = "qf-investigation-surface__inspect";
		inspectButton.textContent = "Inspect exact market and evidence";
		inspectButton.addEventListener("click", (event) => { event.stopPropagation(); inspect(mission); });
		surface.appendChild(inspectButton);
		dom.contentArea.appendChild(surface);
		bindSelection(dom.container, mission);
	}

	function renderTile(dom, tile, object) {
		if (object?.type === "ready_director") {
			void window.shellApi.qf.listDefinitions().then((listed) => {
				const definitions = listed?.definitions ?? listed?.rows ?? [];
				const definition = definitions.find((row) => row.id === object.id);
				if (definition) renderReadyDirector(dom, tile, definition);
			});
			return;
		}
		if (object?.type === "mission") renderInvestigation(dom, tile, object);
		if (object?.type === "artifact" && object.fields?.kind === "report") renderResult(dom, tile, object);
	}

	function decorateVisibleParticipants() {
		retireReadyDirectorWhenLive();
		if (!lastWorkflow) return;
		for (const object of lastWorkflow.objects.filter((entry) => entry.type === "agent_session")) {
			const tile = tiles.find((entry) => entry.sessionId === object.id);
			const dom = tile && getTileDOMs().get(tile.id);
			if (!dom) continue;
			dom.container.dataset.qfSurfaceKind = "participant";
			bindSelection(dom.container, object);
		}
	}

	async function reveal(rootType, rootId) {
		const result = await window.shellApi.qf.getResearchWorldProjection({ root_type: rootType, root_id: rootId });
		if (!result?.ok) { showStatus?.(result?.message ?? "Investigation unavailable"); return result; }
		lastRoot = { type: rootType, id: rootId };
		lastWorld = result.world;
		lastWorkflow = deriveResearchWorkflow(result.world);
		selectedSubject = null;
		clearInspect();
		onCables?.([]);
		decorateVisibleParticipants();
		const [surfaceObject] = oneCanvasSurfaceObjects(lastWorkflow);
		const mission = surfaceObject?.type === "mission" ? surfaceObject : null;
		const report = surfaceObject?.type === "artifact" ? surfaceObject : null;
		if (!report && mission) {
			let tile = tiles.find((entry) => entry.type === "research" && entry.ontologyType === "mission" && entry.ontologyId === mission.id);
			if (!tile) {
				const position = nextPosition();
				tile = tileManager.createResearchTile(position.x, position.y, mission);
			}
			renderInvestigation(getTileDOMs().get(tile.id), tile, mission);
		} else if (report) {
			const priorMissionTile = tiles.find((entry) => entry.type === "research" && entry.ontologyType === "mission" && entry.ontologyId === lastWorkflow.mission?.id);
			const priorPosition = priorMissionTile ? { x: priorMissionTile.x, y: priorMissionTile.y } : null;
			if (priorMissionTile) tileManager.closeCanvasTile(priorMissionTile.id);
			let tile = tiles.find((entry) => entry.type === "research" && entry.ontologyType === "artifact" && entry.ontologyId === report.id);
			if (!tile) {
				const position = priorPosition ?? nextPosition();
				tile = tileManager.createResearchTile(position.x, position.y, report);
			}
			renderResult(getTileDOMs().get(tile.id), tile, report);
		}
		document.dispatchEvent?.(new CustomEvent("qf:investigation-selected", { detail: { missionId: lastWorkflow.mission?.id ?? rootId } }));
		return result;
	}

	async function hydrateSaved() {
		onCables?.([]);
		clearInspect();
		await ensureReadyDirector();
		return null;
	}

	return {
		reveal,
		renderTile,
		refreshParticipants: decorateVisibleParticipants,
		hydrateSaved,
		selectRelationship: () => {},
		getLastWorld: () => lastWorld,
		getLastRoot: () => lastRoot,
		getProjectionState: () => "ONE_CANVAS",
		getProjectionModel: () => lastWorkflow,
	};
}
