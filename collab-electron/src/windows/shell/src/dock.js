import { participantFieldRows, participantViewForSession } from "./participant-projection.js";

/**
 * Dock rail — species + sessions from Kernel IPC only.
 * No hardcoded species names; refresh on qf:dock:invalidate only.
 *
 * Session Clear is a view filter only: Kernel agent_session rows are never
 * deleted. Terminal sessions at-or-before the cursor are hidden from the rail;
 * live sessions and newer rows still appear. The list may grow without bound
 * in the Kernel.
 *
 * WO-g3: Glacier zones (masthead / ask / launcher / ledger). Exit codes are
 * not on agent_session — terminal rows show "exit n/a" rather than a fake 0.
 */

function shortId(id) {
	if (typeof id !== "string") return String(id ?? "");
	return id.length <= 12 ? id : `${id.slice(0, 8)}…${id.slice(-4)}`;
}

function el(tag, className, text) {
	const node = document.createElement(tag);
	if (className) node.className = className;
	if (text != null) node.textContent = text;
	return node;
}

export function isQaDockDefinition(definitionId) {
	return String(definitionId ?? "").startsWith("qf-proof-");
}

export function researchDirectorRunningStatus(missionId) {
	return `Research Director running · Mission ${String(missionId ?? "")}`;
}

export function isProductionDockDefinition(row) {
	const packageRef = String(row?.package_ref ?? "");
	if (
		packageRef.startsWith("tools/qf-proof-agent/") ||
		packageRef.startsWith("tools/runtime-proof/")
	) {
		return false;
	}
	return !isQaDockDefinition(row?.id);
}

/**
 * Production Dock projection. QA may opt in explicitly, but proof fixtures
 * never become product inventory merely because they are Kernel-registered.
 */
export function visibleDockDefinitions(definitions, { qaMode = false } = {}) {
	const rows = Array.isArray(definitions) ? definitions : [];
	return rows.filter((row) => qaMode || isProductionDockDefinition(row));
}

export function dockDefinitionDisplayName(row) {
	const value = row?.display_name ?? row?.role;
	return value === null || value === undefined || String(value).trim() === ""
		? "Not recorded"
		: String(value);
}

/** One immutable presentation of the existing launchable Kernel inventory. */
export function launchableDockDefinitions(definitions, { qaMode = false } = {}) {
	return visibleDockDefinitions(definitions, { qaMode })
		.filter((row) => row?.availability?.available === true)
		.slice()
		.sort((a, b) => dockDefinitionDisplayName(a).localeCompare(dockDefinitionDisplayName(b)) ||
			String(a?.id ?? "").localeCompare(String(b?.id ?? "")));
}

export function formatDockTeamSummary(definitions, options = {}) {
	const launchable = launchableDockDefinitions(definitions, options);
	return formatLaunchableTeamSummary(launchable);
}

function formatLaunchableTeamSummary(launchable) {
	const roles = launchable.length > 0
		? launchable.map(dockDefinitionDisplayName).join(", ")
		: "None recorded";
	return `Available team: ${launchable.length} — ${roles}`;
}

const CAPABILITY_LABELS = Object.freeze({
	"market.read": "Market data",
	"desk.orchestrate": "Team composition",
	"research.evaluate": "Research evaluation",
});

export function formatDockCapabilities(groups) {
	if (!Array.isArray(groups)) return [];
	return groups.map((group) => {
		const label = CAPABILITY_LABELS[String(group ?? "")];
		if (!label) throw new Error(`Unknown capability group: ${String(group ?? "")}`);
		return label;
	});
}

export function dockAdapterLabel(adapterId) {
	const id = String(adapterId ?? "").toLowerCase();
	if (id === "hermes") return "Hermes";
	if (id === "claude-code") return "Claude Code";
	return String(adapterId ?? "Adapter");
}

export function activeTaskForSession(assignments, sessionId) {
	if (!Array.isArray(assignments)) return null;
	return assignments.find((row) =>
		row?.assignmentState === "assigned" &&
		row?.status === "open" &&
		row?.assignedToSessionId === sessionId
	) ?? null;
}

export function unavailableTaskForSession(assignments, sessionId) {
	if (!Array.isArray(assignments)) return null;
	return assignments.find((row) =>
		row?.assignmentState === "unavailable" &&
		(Array.isArray(row?.unavailableSessionIds) && row.unavailableSessionIds.includes(sessionId))
	) ?? null;
}

/** Terminal statuses that Clear may hide from the Dock rail. */
export function isDockTerminalSessionStatus(status) {
	return ["closed", "cancelled", "failed"].includes(String(status ?? ""));
}

export function isDockLiveSessionStatus(status) {
	return ["starting", "running", "blocked"].includes(String(status ?? ""));
}

/**
 * Ledger state label. agent_session has no exit_code property — never invent one.
 * @returns {{ text: string; kind: "live" | "blocked" | "terminal" }}
 */
export function formatDockSessionState(row) {
	const status = String(row?.status ?? "");
	if (status === "running" || status === "starting") {
		return { text: status, kind: "live" };
	}
	if (status === "blocked") {
		return { text: "blocked", kind: "blocked" };
	}
	if (isDockTerminalSessionStatus(status)) {
		const code = row?.exit_code ?? row?.exitCode;
		if (typeof code === "number" && Number.isFinite(code)) {
			return { text: `exit ${code}`, kind: "terminal" };
		}
		return { text: `${status} · exit n/a`, kind: "terminal" };
	}
	return { text: status || "unknown", kind: "terminal" };
}

/**
 * View filter for the Dock sessions rail. Does not mutate Kernel rows.
 * @param {unknown} sessions
 * @param {string | null | undefined} clearedThroughIso exclusive lower bound for
 *   terminal sessions (hide when created_at <= cursor). Live sessions always pass.
 */
export function visibleDockSessions(sessions, clearedThroughIso) {
	const rows = Array.isArray(sessions) ? sessions : [];
	const cursor =
		typeof clearedThroughIso === "string" && clearedThroughIso.length > 0
			? clearedThroughIso
			: null;
	if (!cursor) return rows;
	return rows.filter((row) => {
		if (!isDockTerminalSessionStatus(row?.status)) return true;
		const created = String(row?.created_at ?? "");
		return created > cursor;
	});
}

function sessionSpeciesLabel(row) {
	return String(row?.display_name ?? row?.label ?? row?.role ?? "session");
}

/**
 * @param {HTMLElement} panelEl
 * @param {{ onTidy?: () => void, onResearchSubmitted?: (result: object) => void, qaMode?: boolean }} [options]
 */
export function initDock(panelEl, options = {}) {
	const speciesList = panelEl.querySelector("#dock-species-list");
	const sessionsList = panelEl.querySelector("#dock-sessions-list");
	const historyList = panelEl.querySelector("#dock-history-list");
	const inspectPane = panelEl.querySelector("#dock-inspect-pane");
	const tallyEl = panelEl.querySelector("#dock-tally");
	const teamSummaryEl = panelEl.querySelector("#dock-team-summary");
	const missionEmptyEl = panelEl.querySelector("#dock-mission-empty");
	if (!speciesList || !sessionsList || !historyList || !inspectPane) {
		console.error("[dock] missing required Dock projection surfaces");
		return;
	}

	let refreshing = false;
	/** @type {string | null} ISO watermark — hide terminal sessions at-or-before. */
	let sessionsClearedThroughIso = null;
	/** @type {boolean} */
	let closedCollapsed = true;
	let selectedSessionId = null;
	let planningDirector = null;
	let missionWorld = null;
	let latestDefinitions = [];
	let activeMissionId = null;

	function syncStartDiscovery() {
		if (teamSummaryEl) teamSummaryEl.textContent = formatLaunchableTeamSummary(latestDefinitions);
		if (missionEmptyEl) missionEmptyEl.hidden = Boolean(activeMissionId || planningDirector?.missionId || missionWorld?.root?.id);
	}

	function setMode(mode) {
		const selected = String(mode ?? "START").toUpperCase();
		for (const tab of panelEl.querySelectorAll("[data-dock-mode]")) {
			const active = tab.dataset.dockMode === selected;
			tab.setAttribute("aria-selected", active ? "true" : "false");
		}
		for (const pane of panelEl.querySelectorAll("[data-dock-primary]")) {
			pane.hidden = pane.dataset.dockPrimary !== selected;
		}
	}

	for (const tab of panelEl.querySelectorAll("[data-dock-mode]")) {
		tab.addEventListener("click", () => setMode(tab.dataset.dockMode));
	}
	panelEl.querySelector("#dock-browse-catalog")?.addEventListener("click", () => setMode("CATALOG"));
	document.addEventListener("qf:research-world-active", (event) => {
		activeMissionId = String(event?.detail?.missionId ?? "") || null;
		syncStartDiscovery();
		void refresh();
	});
	setMode("START");

	function participantFor(session, assignments, sessions = []) {
		return participantViewForSession({
			sessionId: session?.id,
			sessions: sessions.length > 0 ? sessions : [session],
			definitions: latestDefinitions,
			assignments,
			world: missionWorld,
			planningDirector,
		});
	}

	function renderInspect(session, view) {
		inspectPane.replaceChildren();
		if (!session || !view) {
			inspectPane.appendChild(el("div", "qf-empty", "Select a participant from ACTIVE."));
			return;
		}
		const heading = el("h3", "dock-inspect-heading", view.displayName);
		heading.title = String(session.id ?? "");
		inspectPane.appendChild(heading);
		inspectPane.appendChild(el("div", "dock-inspect-id", String(session.id ?? "")));
		const facts = el("div", "dock-inspect-facts");
		for (const { field, value } of participantFieldRows(view)) {
			const row = el("div", "qf-world-field");
			row.appendChild(el("span", "qf-world-field-label", field));
			row.appendChild(el("span", "qf-world-field-value", value));
			facts.appendChild(row);
		}
		inspectPane.appendChild(facts);
	}

	function setTally({ live, closed, launchable }) {
		if (!tallyEl) return;
		tallyEl.replaceChildren();
		const liveEl = el("b", null, `${live} live`);
		tallyEl.appendChild(liveEl);
		tallyEl.appendChild(el("s", null, "·"));
		tallyEl.appendChild(document.createTextNode(`${closed} closed`));
		tallyEl.appendChild(el("s", null, "·"));
		tallyEl.appendChild(document.createTextNode(`${launchable} launchable`));
	}

	async function refresh() {
		if (refreshing) return;
		refreshing = true;
		try {
			const [defsRes, sessRes, surfaceRes] = await Promise.all([
				window.shellApi.qf.listDefinitions(),
				window.shellApi.qf.listSessions(),
				window.shellApi.qf.listTaskSurface(),
			]);
			const taskAssignments = surfaceRes?.ok && Array.isArray(surfaceRes.assignments)
				? surfaceRes.assignments
				: [];

			speciesList.replaceChildren();
			let launchable = 0;
			if (!defsRes?.ok) {
				speciesList.appendChild(
					el("div", "qf-empty", defsRes?.error?.message ?? "Failed to list species"),
				);
			} else {
				const defs = launchableDockDefinitions(defsRes.definitions, {
					qaMode: options.qaMode === true || window.__QF_QA_MODE__ === true,
				});
				if (defs.length === 0) {
					speciesList.appendChild(el("div", "qf-empty", "No launchable participants"));
				}
				for (const row of defs) {
					const definitionId = String(row.id ?? "");
					const name = dockDefinitionDisplayName(row);
					const adapter = dockAdapterLabel(row.availability?.adapterId);
					const capabilities = formatDockCapabilities(row.capability_groups);
					const card = el("div", "lrow");
					card.tabIndex = 0;
					card.setAttribute("role", "button");
					card.setAttribute("data-definition-id", definitionId);
					card.appendChild(el("b", null, name));
					card.appendChild(el("span", "dock-adapter", `${adapter} · native CLI`));
					card.appendChild(el("span", "dock-capabilities", capabilities.join(" · ")));
					card.appendChild(el("span", "dock-ready", "ready"));
					const cue = el("em", null, "spawn ⏎");
					card.appendChild(cue);
					launchable += 1;
						let spawnInFlight = false;
						const spawn = async () => {
							if (spawnInFlight) return;
							spawnInFlight = true;
							card.classList.remove("dock-spawn-failed");
							card.classList.add("dock-spawning");
							card.setAttribute("aria-disabled", "true");
							cue.textContent = "starting…";
							try {
								const result = await window.shellApi.qf.spawnSession({ definitionId });
								if (!result?.ok) {
									throw new Error(result?.error?.message ?? "Spawn failed");
								}
								cue.textContent = "spawn ⏎";
							} catch (error) {
								cue.textContent = "failed — retry";
								card.title = error?.message ?? String(error);
								card.classList.add("dock-spawn-failed");
							} finally {
								spawnInFlight = false;
								card.removeAttribute("aria-disabled");
								card.classList.remove("dock-spawning");
							}
						};
						card.addEventListener("click", () => {
							void spawn();
						});
						card.addEventListener("keydown", (event) => {
							if (event.key === "Enter" || event.key === " ") {
								event.preventDefault();
								if (card.getAttribute("aria-disabled") !== "true") void spawn();
							}
						});
					speciesList.appendChild(card);
				}
			}

			latestDefinitions = defsRes?.ok ? launchableDockDefinitions(defsRes.definitions, {
				qaMode: options.qaMode === true || window.__QF_QA_MODE__ === true,
			}) : [];
			syncStartDiscovery();
			sessionsList.replaceChildren();
			historyList.replaceChildren();
			let liveCount = 0;
			let closedCount = 0;
			if (!sessRes?.ok) {
				sessionsList.appendChild(
					el("div", "qf-empty", sessRes?.error?.message ?? "Failed to list sessions"),
				);
				historyList.appendChild(el("div", "qf-empty", sessRes?.error?.message ?? "Failed to list sessions"));
			} else {
				const allSessions = surfaceRes?.ok && Array.isArray(surfaceRes.sessions)
					? surfaceRes.sessions
					: (Array.isArray(sessRes.sessions) ? sessRes.sessions : []);
				const sessions = visibleDockSessions(allSessions, sessionsClearedThroughIso);
				const live = [];
				const closed = [];
				for (const row of sessions) {
					if (isDockLiveSessionStatus(row?.status)) live.push(row);
					else closed.push(row);
				}
				liveCount = live.length;
				closedCount = closed.length;

				const appendSessionRow = (row, targetList) => {
					const id = String(row.id ?? "");
					const status = String(row.status ?? "");
					const state = formatDockSessionState(row);
					const view = participantFor(row, taskAssignments, allSessions);
					const card = el(
						"div",
						state.kind === "live"
							? "srow live"
							: state.kind === "blocked"
								? "srow blk"
								: "srow",
					);
					card.dataset.sessionId = id;
					card.dataset.qfParticipantHistory = view.historical ? "true" : "false";
					card.dataset.qfParticipantSession = view.session;
					card.dataset.qfParticipantRuntime = view.runtimeState;
					card.dataset.qfParticipantWork = view.work;
					card.dataset.qfParticipantRecovery = view.recovery;
					card.tabIndex = 0;
					card.setAttribute("role", "button");
					card.setAttribute("aria-label", `${view.displayName} ${id} · ${view.historical ? "historical" : "current"} participant`);
					card.appendChild(el("i", null, null));
					card.appendChild(el("span", "id", shortId(id)));
					const who = el("span", "who", view.role === "Not recorded" ? sessionSpeciesLabel(row) : view.role);
					who.title = `${view.displayName} · ${view.role}`;
					card.appendChild(who);
					card.appendChild(el("span", "own", `${view.task} · ${view.work}`));
					card.appendChild(el("span", "st", `${view.runtimeState} · ${state.text}`));
					card.addEventListener("click", () => {
						selectedSessionId = id;
						renderInspect(row, view);
						setMode("INSPECT");
					});
					card.addEventListener("keydown", (event) => {
						if (event.key === "Enter" || event.key === " ") {
							event.preventDefault();
							selectedSessionId = id;
							renderInspect(row, view);
							setMode("INSPECT");
						}
					});
					const actions = el("span", "srow-actions");
					if (isDockLiveSessionStatus(status)) {
						const cancel = el("button", "srow-action", "Cancel");
						cancel.type = "button";
						cancel.setAttribute("aria-label", `Cancel session ${id}`);
						cancel.addEventListener("click", (event) => { event.stopPropagation(); void window.shellApi.qf.cancelSession(id); });
						actions.appendChild(cancel);
					} else if (status === "cancelled" || status === "failed") {
						const close = el("button", "srow-action", "Close");
						close.type = "button";
						close.setAttribute("aria-label", `Close session ${id}`);
						close.addEventListener("click", (event) => { event.stopPropagation(); void window.shellApi.qf.closeSession(id); });
						actions.appendChild(close);
					}
					card.appendChild(actions);
					targetList.appendChild(card);
				};

				if (live.length === 0) sessionsList.appendChild(el("div", "qf-empty", "No active participants"));
				for (const row of live) appendSessionRow(row, sessionsList);
				if (closed.length === 0) historyList.appendChild(el("div", "qf-empty", "No historical sessions"));
				for (const row of closed) appendSessionRow(row, historyList);
				if (selectedSessionId) {
					const selected = allSessions.find((row) => String(row.id ?? "") === selectedSessionId);
					if (selected) renderInspect(selected, participantFor(selected, taskAssignments, allSessions));
				}
			}

			setTally({ live: liveCount, closed: closedCount, launchable });
		} finally {
			refreshing = false;
		}
	}

	panelEl.querySelector("#dock-tidy")?.addEventListener("click", () => {
		options.onTidy?.();
	});

	panelEl.querySelector("#dock-sessions-clear")?.addEventListener("click", () => {
		sessionsClearedThroughIso = new Date().toISOString();
		void refresh();
	});

	const questionForm = panelEl.querySelector("#dock-question-form");
	const questionInput = panelEl.querySelector("#dock-question-input");
	const questionStatus = panelEl.querySelector("#dock-question-status");
	let selectedResearchDatasetId = null;
	let selectedStrategyId = null;
	const techniqueSelect = document.createElement("select");
	techniqueSelect.className = "dock-technique-version";
	techniqueSelect.id = "dock-technique-version";
	techniqueSelect.setAttribute("aria-label", "Technique version");
	const techniquePlaceholder = document.createElement("option");
	techniquePlaceholder.value = "";
	techniquePlaceholder.textContent = "Technique version";
	techniqueSelect.appendChild(techniquePlaceholder);
	(panelEl.querySelector("#dock-technique-host") || questionForm)?.appendChild(techniqueSelect);
	const populateTechniqueSelect = () => window.shellApi.qf.listStrategyVersions().then((response) => {
		for (const option of [...techniqueSelect.options].slice(1)) option.remove();
		for (const strategy of (response?.strategies || [])) { const option = document.createElement("option"); option.value = String(strategy.strategy_id); option.textContent = String(strategy.label); option.dataset.family = String(strategy.family); option.dataset.version = String(strategy.version); option.dataset.contentHash = String(strategy.content_hash ?? ""); techniqueSelect.appendChild(option); }
	}).catch(() => {});
	void populateTechniqueSelect();
	techniqueSelect.addEventListener("change", () => { selectedStrategyId = techniqueSelect.value || null; });
	const questionSubmit = questionForm?.querySelector("button[type=submit]");
	if (questionSubmit) questionSubmit.disabled = true;
	techniqueSelect.addEventListener("change", () => { if (questionSubmit) questionSubmit.disabled = !selectedStrategyId; });
	const setQuestionStatus = (message, tone = "") => {
		if (!questionStatus) return;
		questionStatus.textContent = message;
		questionStatus.dataset.tone = tone;
	};
	if (questionForm && questionInput) {
		questionForm.addEventListener("submit", (event) => {
			event.preventDefault();
			const question = String(questionInput.value ?? "").trim();
			if (!question) return;
			if (window.__QF_UI_PROOF__ === true) {
				console.info("qf-ui-proof renderer_form_submit=1");
			}
			questionInput.value = "";
			questionInput.disabled = true;
			setQuestionStatus("Starting durable research…");
			const datasetId = selectedResearchDatasetId || questionForm?.dataset.r17DatasetId || null;
			selectedResearchDatasetId = null;
			void window.shellApi.qf.submitResearchQuestion(question, datasetId ?? undefined, undefined, selectedStrategyId ?? undefined).then((res) => {
				if (!res?.ok) throw new Error(res?.error?.message ?? "research launch failed");
				window.__QF_LAST_RESEARCH_SUBMIT = res;
				planningDirector = { sessionId: String(res.sessionId), missionId: String(res.missionId) };
				activeMissionId = String(res.missionId);
				syncStartDiscovery();
				void window.shellApi.qf.getResearchWorldProjection({ root_type: "mission", root_id: String(res.missionId) }).then((projection) => {
					if (projection?.ok) missionWorld = projection.world;
					void refresh();
				}).catch(() => {});
				options.onResearchSubmitted?.(res);
				setQuestionStatus(researchDirectorRunningStatus(res.missionId), "ok");
				void refresh();
			}).catch((error) => {
				questionInput.value = question;
				setQuestionStatus(error?.message ?? String(error), "error");
			}).finally(() => {
				questionInput.disabled = false;
			});
		});
		questionInput.addEventListener("keydown", (event) => {
			if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
				event.preventDefault();
				questionForm.requestSubmit();
			}
		});
		panelEl.querySelector("#dock-guided-research")?.addEventListener("click", (event) => {
			const button = event.currentTarget;
			button.disabled = true;
			button.textContent = "Loading sample…";
			void window.shellApi.qf.loadSampleResearchDataset().then((res) => {
				if (!res?.ok) throw new Error(res?.error?.message ?? "sample dataset failed");
				setQuestionStatus("Guided settled-data sample loaded", "ok");
				selectedResearchDatasetId = res.dataset?.object_id ?? null;
				const technique = res.technique;
				if (!technique?.strategy_id || technique.family !== "guided-settled-results" || Number(technique.version) !== 1 || !/^[0-9a-f]{64}$/.test(String(technique.content_hash ?? ""))) throw new Error("TECHNIQUE COVERAGE REFUSED");
				let option = [...techniqueSelect.options].find((candidate) => candidate.value === String(technique.strategy_id));
				if (!option) {
					option = document.createElement("option");
					option.value = String(technique.strategy_id);
					option.textContent = `${technique.family} v${technique.version} · ${String(technique.strategy_id).slice(-8)}`;
					option.dataset.family = String(technique.family);
					option.dataset.version = String(technique.version);
					option.dataset.contentHash = String(technique.content_hash);
					techniqueSelect.appendChild(option);
				}
				techniqueSelect.value = String(technique.strategy_id);
				techniqueSelect.dispatchEvent(new Event("change", { bubbles: true }));
				questionInput.value = "Using the guided settled-results sample, test whether the highest recorded edge produced positive ROI and explain the evidence.";
				questionForm.requestSubmit();
			}).catch((error) => {
				setQuestionStatus(error?.message ?? String(error), "error");
			}).finally(() => {
				button.disabled = false;
				button.textContent = "Try guided research";
			});
		});
	}

	window.shellApi.qf.onDockInvalidate(() => {
		void populateTechniqueSelect();
		void refresh();
	});
	void refresh();
}
