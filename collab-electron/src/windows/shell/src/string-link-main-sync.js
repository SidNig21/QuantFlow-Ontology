import {
	getTile,
	getString,
	strings,
	getStringsForTile,
} from "./canvas-state.js";

/**
 * @param {{
 *   id: string;
 *   sourceSessionId: string;
 *   targetSessionId: string;
 *   filter: string;
 *   mode?: "generic" | "baton";
 *   active: boolean;
 *   triggerPattern?: string;
 *   triggered?: boolean;
 * }} payload
 */
export async function ptyStringLinkUpsertToMain(payload) {
	if (!window.shellApi?.ptyStringLinkUpsert) return;
	await window.shellApi.ptyStringLinkUpsert(payload);
}

export async function ptyStringLinkListFromMain() {
	if (!window.shellApi?.ptyStringLinkList) return [];
	return window.shellApi.ptyStringLinkList();
}

/** @param {string} stringId */
export async function ptyStringLinkRemoveFromMain(stringId) {
	if (!window.shellApi?.ptyStringLinkRemove) return;
	await window.shellApi.ptyStringLinkRemove(stringId);
}

/**
 * @param {string} stringId
 * @param {boolean} active
 */
export async function ptyStringLinkSetActiveOnMain(stringId, active) {
	if (!window.shellApi?.ptyStringLinkSetActive) return;
	await window.shellApi.ptyStringLinkSetActive({ stringId, active });
}

/**
 * @param {string} stringId
 * @param {"none" | "ansi-strip" | "framed"} filter
 */
export async function ptyStringLinkSetFilterOnMain(stringId, filter) {
	if (!window.shellApi?.ptyStringLinkSetFilter) return;
	await window.shellApi.ptyStringLinkSetFilter({ stringId, filter });
}

/**
 * @param {string} stringId
 * @param {"generic" | "baton"} mode
 */
export async function ptyStringLinkSetModeOnMain(stringId, mode) {
	if (!window.shellApi?.ptyStringLinkSetMode) return;
	await window.shellApi.ptyStringLinkSetMode({ stringId, mode });
}

/** Push current shell string link state to main using live tile ptySessionIds. */
export async function syncAllShellStringsToMain() {
	for (const s of strings) {
		const srcTile = getTile(s.sourceId);
		const tgtTile = getTile(s.targetId);
		if (!srcTile?.ptySessionId || !tgtTile?.ptySessionId) continue;
		await ptyStringLinkUpsertToMain({
			id: s.id,
			sourceSessionId: srcTile.ptySessionId,
			targetSessionId: tgtTile.ptySessionId,
			filter: s.filter,
			mode: s.mode,
			active: s.active,
			triggerPattern: s.triggerPattern || undefined,
			triggered: s.triggered,
		});
	}
}

/** After a tile gets or changes `ptySessionId`, re-upsert any strings that use it. */
export async function syncStringsTouchingTile(tileId) {
	for (const s of getStringsForTile(tileId)) {
		await syncOneShellStringToMain(s.id);
	}
}

/** @param {string} stringId */
export async function syncOneShellStringToMain(stringId) {
	const s = getString(stringId);
	if (!s) return;
	const srcTile = getTile(s.sourceId);
	const tgtTile = getTile(s.targetId);
	if (!srcTile?.ptySessionId || !tgtTile?.ptySessionId) return;
	await ptyStringLinkUpsertToMain({
		id: s.id,
		sourceSessionId: srcTile.ptySessionId,
		targetSessionId: tgtTile.ptySessionId,
		filter: s.filter,
		mode: s.mode,
		active: s.active,
		triggerPattern: s.triggerPattern || undefined,
		triggered: s.triggered,
	});
}
