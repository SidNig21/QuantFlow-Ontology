/**
 * Kernel events ledger (WO-g6 D4) — projection only.
 */
import { projectKernelLedger } from "./glacier-feel.js";

/**
 * @param {HTMLElement} rootEl
 * @param {object} opts
 */
export function createKernelLedger(rootEl, { listEvents, onSubscribe }) {
	if (!rootEl) {
		return { refresh: async () => {}, dispose() {}, renderedIds: () => [] };
	}
	const listEl = rootEl.querySelector("#kernel-ledger-list");
	const emptyEl = rootEl.querySelector("#kernel-ledger-empty");
	if (!listEl) {
		console.error("[kernel-ledger] missing #kernel-ledger-list");
		return { refresh: async () => {}, dispose() {}, renderedIds: () => [] };
	}

	/** @type {Array<{id:string,type:string,object_type:string,created_at:string}>} */
	let lastRows = [];

	function render(rows) {
		lastRows = Array.isArray(rows) ? rows : [];
		const projected = projectKernelLedger(lastRows);
		listEl.replaceChildren();
		if (projected.length === 0) {
			if (emptyEl) emptyEl.hidden = false;
			return;
		}
		if (emptyEl) emptyEl.hidden = true;
		for (const entry of projected) {
			const row = document.createElement("div");
			row.className = "kl-row";
			row.dataset.eventId = entry.id;
			const type = document.createElement("span");
			type.className = "kl-type";
			type.textContent = entry.type;
			const obj = document.createElement("span");
			obj.className = "kl-obj";
			obj.textContent = entry.object_type;
			const when = document.createElement("span");
			when.className = "kl-when";
			when.textContent = entry.relative;
			row.appendChild(type);
			row.appendChild(obj);
			row.appendChild(when);
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
