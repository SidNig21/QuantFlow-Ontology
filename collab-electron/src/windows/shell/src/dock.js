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

/**
 * @param {HTMLElement} panelEl
 */
export function initDock(panelEl) {
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
				const defs = defsRes.definitions ?? [];
				if (defs.length === 0) {
					speciesList.appendChild(el("div", "qf-empty", "No species registered"));
				}
				for (const row of defs) {
					const name = String(row.name ?? row.id ?? "");
					const role = String(row.role ?? "");
					const card = el("div", "dock-species-row");
					const meta = el("div", "dock-species-meta");
					meta.appendChild(el("div", "dock-species-name", name));
					if (role) meta.appendChild(el("div", "qf-label", role));
					const spawnBtn = el("button", "qf-btn qf-btn-primary", "Spawn");
					spawnBtn.type = "button";
					spawnBtn.addEventListener("click", () => {
						void window.shellApi.qf.spawnSession({ species: name });
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

	const seatsStatus = panelEl.querySelector("#dock-seats-status");
	const orchBtn = panelEl.querySelector("#dock-spawn-orchestrator");
	const workerBtn = panelEl.querySelector("#dock-spawn-worker");

	async function spawnSeat(seatId, btn) {
		if (!seatsStatus || !btn) return;
		btn.disabled = true;
		seatsStatus.textContent = `spawning ${seatId}…`;
		try {
			const res = await window.shellApi.qf.spawnSeat({ seatId });
			if (res?.ok) {
				const title = res.result?.displayName ?? seatId;
				seatsStatus.textContent = `${title} ready`;
			} else {
				const msg = res?.error?.message ?? "seat spawn failed";
				seatsStatus.textContent = msg.includes("profile") || msg.includes("Hermes")
					? `${msg} — run: cd tools/qf-peer-bus && bun run setup-seats`
					: msg;
			}
		} catch (err) {
			seatsStatus.textContent = String((err && err.message) || err);
		} finally {
			btn.disabled = false;
		}
	}

	if (orchBtn) {
		orchBtn.addEventListener("click", () => {
			void spawnSeat("orchestrator", orchBtn);
		});
	}
	if (workerBtn) {
		workerBtn.addEventListener("click", () => {
			void spawnSeat("worker", workerBtn);
		});
	}

	window.shellApi.qf.onDockInvalidate(() => {
		void refresh();
	});
	void refresh();
}
