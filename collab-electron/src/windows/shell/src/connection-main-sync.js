import {
	connections,
	getConnection,
	getConnectionsForTile,
	getTile,
} from "./canvas-state.js";

/**
 * @param {{
 *   id: string;
 *   sourceId: string;
 *   targetId: string;
 *   transport: "agent-channel" | "pty-baton" | "pty-generic";
 *   endpointKind: "agent" | "note" | "browser";
 *   active: boolean;
 *   lastError?: string | null;
 *   lastErrorAt?: number | null;
 *   emitEvent?: boolean;
 * }} payload
 */
export async function connectionUpsertToMain(payload) {
	if (!window.shellApi?.canvasConnectionUpsert) return;
	await window.shellApi.canvasConnectionUpsert(payload);
}

/** @param {string} connectionId */
export async function connectionRemoveFromMain(connectionId) {
	if (!window.shellApi?.canvasConnectionRemove) return;
	await window.shellApi.canvasConnectionRemove(connectionId);
}

export async function syncAllShellConnectionsToMain(options = {}) {
	for (const connection of connections) {
		await syncOneShellConnectionToMain(connection.id, options);
	}
}

export async function syncConnectionsTouchingTile(tileId, options = {}) {
	for (const connection of getConnectionsForTile(tileId)) {
		await syncOneShellConnectionToMain(connection.id, options);
	}
}

/** @param {string} connectionId */
export async function syncOneShellConnectionToMain(connectionId, options = {}) {
	const connection = getConnection(connectionId);
	if (!connection) return;
	const srcTile = getTile(connection.sourceId);
	const tgtTile = getTile(connection.targetId);
	await connectionUpsertToMain({
		id: connection.id,
		sourceId: connection.sourceId,
		targetId: connection.targetId,
		transport: connection.transport,
		endpointKind: connection.endpointKind,
		active: connection.active,
		lastError: connection.lastError ?? null,
		lastErrorAt: connection.lastErrorAt ?? null,
		sourcePtySessionId: srcTile?.ptySessionId ?? null,
		targetPtySessionId: tgtTile?.ptySessionId ?? null,
		emitEvent: options.emitEvent ?? true,
	});
}

