/**
 * Kernel events ledger (WO-g6 D4) — projection only.
 */
import { projectKernelLedger } from "./glacier-feel.js";

function projectLedgerRows(rows) {
	const source = Array.isArray(rows) ? rows : [];
	const byId = new Map(source.map((row) => [row.id, row]));
	const ordered = projectKernelLedger(source.map((row) => ({
		id: row.id,
		type: row.stage,
		object_type: row.title,
		created_at: row.created_at,
	})));
	return ordered
		.map((entry) => byId.get(entry.id))
		.filter(Boolean);
}

/**
 * @param {HTMLElement} rootEl
 * @param {object} opts
 */
export function createKernelLedger(rootEl, { listEvents, onSubscribe, onReveal }) {
	if (!rootEl) {
		return { refresh: async () => {}, dispose() {}, renderedIds: () => [] };
	}
	const listEl = rootEl.querySelector("#kernel-ledger-list");
	const emptyEl = rootEl.querySelector("#kernel-ledger-empty");
	if (!listEl) {
		console.error("[kernel-ledger] missing #kernel-ledger-list");
		return { refresh: async () => {}, dispose() {}, renderedIds: () => [] };
	}

	/** @type {Array<{id:string,stage:string,title:string,status:string,detail:string,created_at:string}>} */
	let lastRows = [];

	function render(rows) {
		lastRows = projectLedgerRows(rows);
		listEl.replaceChildren();
		if (lastRows.length === 0) {
			if (emptyEl) emptyEl.hidden = false;
			return;
		}
		if (emptyEl) emptyEl.hidden = true;
		for (const entry of lastRows) {
			const row = document.createElement("div");
			row.className = "kl-row";
			row.dataset.eventId = entry.id;
			const type = document.createElement("span");
			type.className = "kl-type";
			type.textContent = `${entry.stage} · ${entry.title}`;
			const obj = document.createElement("span");
			obj.className = "kl-obj";
			obj.textContent = entry.detail;
			obj.title = entry.detail;
			const when = document.createElement("span");
			when.className = "kl-when";
			when.textContent = entry.status;
			row.appendChild(type);
			row.appendChild(obj);
			row.appendChild(when);
			if (entry.stage === "question" && onReveal) {
				const reveal = document.createElement("button");
				reveal.type = "button";
				reveal.className = "kl-reveal";
				reveal.textContent = "Show research world";
				reveal.setAttribute("aria-label", `Show research world mission ${entry.id}`);
				reveal.addEventListener("click", (event) => {
					event.stopPropagation();
					onReveal("mission", entry.id);
				});
				row.appendChild(reveal);
			}
			listEl.appendChild(row);
		}
	}

	async function refresh() {
		try {
			const rows = await listEvents();
			render(Array.isArray(rows) ? rows : []);
		} catch (err) {
			console.error("[kernel-ledger] refresh failed", err);
		}
	}

	const unsubscribe = onSubscribe?.(() => {
		void refresh();
	});

	void refresh();

	return {
		refresh,
		/** Test seam: last projected DOM ids. */
		renderedIds: () =>
			[...listEl.querySelectorAll(".kl-row")].map((n) => n.dataset.eventId),
		dispose() {
			unsubscribe?.();
		},
	};
}
