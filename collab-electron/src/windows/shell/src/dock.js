/**
 * Dock rail — species + sessions from Kernel IPC only.
 * No hardcoded species names; refresh on qf:dock:invalidate only.
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

/**
 * @param {HTMLElement} panelEl
 * @param {{ onTidy?: () => void, qaMode?: boolean }} [options]
 */
export function initDock(panelEl, options = {}) {
	const speciesList = panelEl.querySelector("#dock-species-list");
	const sessionsList = panelEl.querySelector("#dock-sessions-list");
	if (!speciesList || !sessionsList) {
		console.error("[dock] missing #dock-species-list or #dock-sessions-list");
		return;
	}

	let refreshing = false;

	async function refresh() {
		if (refreshing) return;
		refreshing = true;
		try {
			const [defsRes, sessRes] = await Promise.all([
				window.shellApi.qf.listDefinitions(),
				window.shellApi.qf.listSessions(),
			]);

			speciesList.replaceChildren();
			if (!defsRes?.ok) {
				speciesList.appendChild(
					el("div", "qf-empty", defsRes?.error?.message ?? "Failed to list species"),
				);
			} else {
				const defs = visibleDockDefinitions(defsRes.definitions, {
					qaMode: options.qaMode === true || window.__QF_QA_MODE__ === true,
				});
				if (defs.length === 0) {
					speciesList.appendChild(el("div", "qf-empty", "No species registered"));
				}
				for (const row of defs) {
					const definitionId = String(row.id ?? "");
					const name = String(row.name ?? definitionId);
					const role = String(row.role ?? "");
					const availability = row.availability;
					const card = el("div", "dock-species-row");
					const meta = el("div", "dock-species-meta");
					meta.appendChild(el(
						"div",
						"dock-species-name",
						name,
					));
					if (role) meta.appendChild(el("div", "qf-label", role));
					if (availability?.message) {
						meta.appendChild(el(
							"div",
							availability.available === false ? "qf-label dock-species-unavailable" : "qf-label",
							availability.message,
						));
					}
					const spawnBtn = el("button", "qf-btn qf-btn-primary", "Spawn");
					spawnBtn.type = "button";
					if (availability?.available === false) {
						spawnBtn.disabled = true;
						spawnBtn.textContent = "Unavailable";
						spawnBtn.title = availability.message;
					}
					spawnBtn.addEventListener("click", async () => {
						card.classList.remove("dock-spawn-failed");
						spawnBtn.disabled = true;
						spawnBtn.textContent = "Starting…";
						card.classList.add("dock-spawning");
						try {
							const result = await window.shellApi.qf.spawnSession({ definitionId });
							if (!result?.ok) {
								throw new Error(result?.error?.message ?? "Spawn failed");
							}
						} catch (error) {
							spawnBtn.textContent = "Failed — retry";
							spawnBtn.title = error?.message ?? String(error);
							card.classList.add("dock-spawn-failed");
						} finally {
							if (!card.classList.contains("dock-spawn-failed")) {
								spawnBtn.textContent = "Spawn";
							}
							spawnBtn.disabled = false;
							card.classList.remove("dock-spawning");
						}
					});
					card.appendChild(meta);
					card.appendChild(spawnBtn);
					speciesList.appendChild(card);
				}
			}

			sessionsList.replaceChildren();
			if (!sessRes?.ok) {
				sessionsList.appendChild(
					el("div", "qf-empty", sessRes?.error?.message ?? "Failed to list sessions"),
				);
			} else {
				const sessions = sessRes.sessions ?? [];
				if (sessions.length === 0) {
					sessionsList.appendChild(el("div", "qf-empty", "No sessions"));
				}
				for (const row of sessions) {
					const id = String(row.id ?? "");
					const status = String(row.status ?? "");
					const label = row.label != null ? String(row.label) : "";
					const card = el("div", "dock-session-row");
					const head = el("div", "dock-session-head");
					head.appendChild(el("span", "dock-session-id", shortId(id)));
					if (label) head.appendChild(el("span", "qf-label", label));
					const chip = el("span", `qf-chip ${status}`, status);
					head.appendChild(chip);
					card.appendChild(head);

					const actions = el("div", "dock-session-actions");
					if (status === "running" || status === "blocked") {
						const cancelBtn = el("button", "qf-btn qf-btn-quiet", "Cancel");
						cancelBtn.type = "button";
						cancelBtn.addEventListener("click", () => {
							void window.shellApi.qf.cancelSession(id);
						});
						actions.appendChild(cancelBtn);
					}
					if (status === "cancelled" || status === "failed") {
						const closeBtn = el("button", "qf-btn qf-btn-quiet", "Close");
						closeBtn.type = "button";
						closeBtn.addEventListener("click", () => {
							void window.shellApi.qf.closeSession(id);
						});
						actions.appendChild(closeBtn);
					}
					if (actions.childNodes.length > 0) {
						card.appendChild(actions);
					}
					sessionsList.appendChild(card);
				}
			}
		} finally {
			refreshing = false;
		}
	}

	panelEl.querySelector("#dock-tidy")?.addEventListener("click", () => {
		options.onTidy?.();
	});

	window.shellApi.qf.onDockInvalidate(() => {
		void refresh();
	});
	void refresh();
}
