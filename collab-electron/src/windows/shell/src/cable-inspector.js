/**
 * Minimal connection inspector (WO-g5). Honesty label reflects runtime honour.
 */
import { runtimeHonoursViewConnections } from "./cable-overlay.js";

/**
 * @param {HTMLElement | null} host
 */
export function createCableInspector(host) {
	if (!host) {
		return {
			show() {},
			hide() {},
		};
	}

	host.classList.add("cable-inspector");
	host.hidden = true;

	function show(connection) {
		if (!connection) {
			hide();
			return;
		}
		const honoured = runtimeHonoursViewConnections();
		host.hidden = false;
		host.innerHTML = "";
		const title = document.createElement("div");
		title.className = "cable-inspector__title";
		title.textContent = "connection";
		const body = document.createElement("pre");
		body.className = "cable-inspector__body";
		body.textContent = [
			`id         ${connection.id}`,
			`kind       ${connection.kind}`,
			`from       ${connection.from_ref}`,
			`to         ${connection.to_ref}`,
			`created_at ${connection.created_at ?? "n/a"}`,
			`runtime    ${honoured ? "honours view" : "does not honour (dashed)"}`,
		].join("\n");
		host.appendChild(title);
		host.appendChild(body);
	}

	function hide() {
		host.hidden = true;
		host.innerHTML = "";
	}

	return { show, hide };
}
