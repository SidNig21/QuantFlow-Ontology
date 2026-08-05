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
	return String(row?.label ?? row?.definition_id ?? row?.role ?? "session");
}

/**
 * @param {HTMLElement} panelEl
 * @param {{ onTidy?: () => void, qaMode?: boolean }} [options]
 */
export function initDock(panelEl, options = {}) {
	const speciesList = panelEl.querySelector("#dock-species-list");
	const sessionsList = panelEl.querySelector("#dock-sessions-list");
	const tallyEl = panelEl.querySelector("#dock-tally");
	if (!speciesList || !sessionsList) {
		console.error("[dock] missing #dock-species-list or #dock-sessions-list");
		return;
	}

	let refreshing = false;
	/** @type {string | null} ISO watermark — hide terminal sessions at-or-before. */
	let sessionsClearedThroughIso = null;
	/** @type {boolean} */
	let closedCollapsed = true;

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
			const [defsRes, sessRes] = await Promise.all([
				window.shellApi.qf.listDefinitions(),
				window.shellApi.qf.listSessions(),
			]);

			speciesList.replaceChildren();
			let launchable = 0;
			if (!defsRes?.ok) {
				speciesList.appendChild(
					el("div", "qf-empty", defsRes?.error?.message ?? "Failed to list species"),
				);
			} else {
				for (const diagnostic of (Array.isArray(defsRes.diagnostics) ? defsRes.diagnostics : [])) {
					const row = el("div", "lrow lrow-unavailable");
					row.appendChild(el("b", null, String(diagnostic.name ?? "Adapter")));
					row.appendChild(el("span", null, "unavailable"));
					row.title = String(diagnostic.message ?? "Unavailable");
					speciesList.appendChild(row);
				}
				const defs = visibleDockDefinitions(defsRes.definitions, {
					qaMode: options.qaMode === true || window.__QF_QA_MODE__ === true,
				});
				if (defs.length === 0 && speciesList.childNodes.length === 0) {
					speciesList.appendChild(el("div", "qf-empty", "No species registered"));
				}
				for (const row of defs) {
					const definitionId = String(row.id ?? "");
					const name = String(row.name ?? definitionId);
					const role = String(row.role ?? "");
					const availability = row.availability;
					const unavailable = availability?.available === false;
					const card = el("div", unavailable ? "lrow lrow-unavailable" : "lrow");
					card.tabIndex = unavailable ? -1 : 0;
					card.setAttribute("role", "button");
					card.appendChild(el("b", null, name));
					if (role) card.appendChild(el("span", null, role));
					const cue = el("em", null, unavailable ? "unavailable" : "spawn ⏎");
					card.appendChild(cue);
					if (unavailable) {
						card.title = String(availability.message ?? "Unavailable");
					} else {
						launchable += 1;
						const spawn = async () => {
							card.classList.remove("dock-spawn-failed");
							card.classList.add("dock-spawning");
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
								card.classList.remove("dock-spawning");
							}
						};
						card.addEventListener("click", () => {
							void spawn();
						});
						card.addEventListener("keydown", (event) => {
							if (event.key === "Enter" || event.key === " ") {
								event.preventDefault();
								void spawn();
							}
						});
					}
					speciesList.appendChild(card);
				}
			}

			sessionsList.replaceChildren();
			let liveCount = 0;
			let closedCount = 0;
			if (!sessRes?.ok) {
				sessionsList.appendChild(
					el("div", "qf-empty", sessRes?.error?.message ?? "Failed to list sessions"),
				);
			} else {
				const allSessions = Array.isArray(sessRes.sessions) ? sessRes.sessions : [];
				const sessions = visibleDockSessions(allSessions, sessionsClearedThroughIso);
				const live = [];
				const closed = [];
				for (const row of sessions) {
					if (isDockLiveSessionStatus(row?.status)) live.push(row);
					else closed.push(row);
				}
				liveCount = live.length;
				closedCount = closed.length;

				if (sessions.length === 0) {
					const hidden = allSessions.length - sessions.length;
					sessionsList.appendChild(
						el(
							"div",
							"qf-empty",
							hidden > 0
								? `No sessions in view (${hidden} kept in Kernel)`
								: "No sessions",
						),
					);
				}

				const appendSessionRow = (row) => {
					const id = String(row.id ?? "");
					const status = String(row.status ?? "");
					const state = formatDockSessionState(row);
					const card = el(
						"div",
						state.kind === "live"
							? "srow live"
							: state.kind === "blocked"
								? "srow blk"
								: "srow",
					);
					card.appendChild(el("i", null, null));
					card.appendChild(el("span", "id", shortId(id)));
					card.appendChild(el("span", "who", sessionSpeciesLabel(row)));
					card.appendChild(el("span", "st", state.text));

					if (status === "running" || status === "blocked") {
						card.title = "Click to cancel session";
						card.addEventListener("click", () => {
							void window.shellApi.qf.cancelSession(id);
						});
					} else if (status === "cancelled" || status === "failed") {
						card.title = "Click to close session";
						card.addEventListener("click", () => {
							void window.shellApi.qf.closeSession(id);
						});
					}
					sessionsList.appendChild(card);
				};

				for (const row of live) appendSessionRow(row);

				if (closed.length > 0) {
					const grp = el("div", "lg-grp");
					grp.appendChild(
						document.createTextNode(
							`closed · ${closed.length}`,
						),
					);
					grp.appendChild(el("span", "r", null));
					grp.appendChild(
						el("span", null, closedCollapsed ? "expand" : "collapse"),
					);
					grp.addEventListener("click", () => {
						closedCollapsed = !closedCollapsed;
						void refresh();
					});
					sessionsList.appendChild(grp);
					if (!closedCollapsed) {
						for (const row of closed) appendSessionRow(row);
					}
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
	if (questionForm && questionInput) {
		questionForm.addEventListener("submit", (event) => {
			event.preventDefault();
			const question = String(questionInput.value ?? "").trim();
			if (!question) return;
			questionInput.value = "";
			void window.shellApi.qf.submitResearchQuestion(question).then((res) => {
				if (!res?.ok) {
					console.error("[dock] submit question failed", res?.error);
				}
				void refresh();
			});
		});
		questionInput.addEventListener("keydown", (event) => {
			if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
				event.preventDefault();
				questionForm.requestSubmit();
			}
		});
	}

	window.shellApi.qf.onDockInvalidate(() => {
		void refresh();
	});
	void refresh();
}
