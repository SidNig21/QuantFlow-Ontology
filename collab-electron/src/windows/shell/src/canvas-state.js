/**
 * @typedef {'term' | 'note' | 'code' | 'image' | 'graph' | 'browser' | 'pdf'} TileType
 *
 * @typedef {Object} Tile
 * @property {string} id
 * @property {TileType} type
 * @property {number} x - Canvas X coordinate
 * @property {number} y - Canvas Y coordinate
 * @property {number} width - Canvas width
 * @property {number} height - Canvas height
 * @property {string} [filePath] - For file tiles
 * @property {string} [folderPath] - For graph tiles
 * @property {string} [url] - URL for browser tiles
 * @property {string} [cwd] - Working directory for terminal tiles
 * @property {string} [ptySessionId] - PTY session ID for terminal tiles
 * @property {string} [userTitle] - Manual title override set by user
 * @property {string} [autoTitle] - Auto-computed title from terminal session
 * @property {string} [role] - Optional orchestration role, e.g. "hermes"
 * @property {string} [startupCommand] - One-shot command for a fresh terminal
 * @property {number} zIndex - Stacking order
 */

/** @type {Tile[]} */
export const tiles = [];

let canvasRevision = 1;

/**
 * @typedef {'agent-channel' | 'pty-baton' | 'pty-generic'} ConnectionTransport
 * @typedef {'agent' | 'note' | 'browser'} ConnectionEndpointKind
 *
 * @typedef {Object} Connection
 * @property {string} id
 * @property {string} sourceId
 * @property {string} targetId
 * @property {ConnectionTransport} transport
 * @property {ConnectionEndpointKind} endpointKind
 * @property {boolean} active
 * @property {string | null} [lastError]
 * @property {number | null} [lastErrorAt]
 * @property {string} [clientRequestId]
 * @property {string} [triggerPattern]
 * @property {boolean} [triggered]
 * @property {number} [connectionSchemaVersion]
 * @property {string[]} [verbs]
 * @property {'user' | 'session' | 'mixed'} [ownerKind]
 * @property {string} [ownerTileId]
 * @property {string} [sessionId]
 * @property {string} [createdBy]
 * @property {number} [createdAt]
 * @property {number} [updatedAt]
 */

/** @type {Connection[]} */
export const connections = [];

let connectionIdCounter = 0;

export function getCanvasRevision() {
	return canvasRevision;
}

export function setCanvasRevision(revision) {
	canvasRevision = Number.isFinite(revision) && revision > 0
		? Math.trunc(revision)
		: 1;
	return canvasRevision;
}

export function bumpCanvasRevision() {
	canvasRevision += 1;
	return canvasRevision;
}

export function generateConnectionId() {
	connectionIdCounter++;
	return `connection-${Date.now()}-${connectionIdCounter}`;
}

function normalizeConnectionTransport(transport, endpointKind) {
	if (transport === "pty-baton" || transport === "pty-generic") {
		return transport;
	}
	return endpointKind === "agent" ? "agent-channel" : "agent-channel";
}

function normalizeEndpointKind(link) {
	if (
		link.endpointKind === "agent"
		|| link.endpointKind === "note"
		|| link.endpointKind === "browser"
	) {
		return link.endpointKind;
	}
	return "agent";
}

/** @param {Connection} link */
export function addConnection(link) {
	const endpointKind = normalizeEndpointKind(link);
	const normalized = {
		...link,
		connectionSchemaVersion: link.connectionSchemaVersion ?? 1,
		endpointKind,
		transport: normalizeConnectionTransport(link.transport, endpointKind),
		active: link.active ?? true,
		verbs: Array.isArray(link.verbs) && link.verbs.length > 0
			? [...link.verbs]
			: defaultConnectionVerbs(endpointKind),
		ownerKind: link.ownerKind ?? "user",
		lastError: link.lastError ?? null,
		lastErrorAt: link.lastErrorAt ?? null,
		clientRequestId: link.clientRequestId,
		ownerTileId: link.ownerTileId,
		sessionId: link.sessionId,
		createdBy: link.createdBy,
		createdAt: link.createdAt ?? Date.now(),
		updatedAt: link.updatedAt ?? Date.now(),
	};
	connections.push(normalized);
	return normalized;
}

function defaultConnectionVerbs(endpointKind) {
	if (endpointKind === "browser") return ["browser-control"];
	if (endpointKind === "note") return ["note-write"];
	return ["ask", "notify", "wake"];
}

/** @param {string} id */
export function removeConnection(id) {
	const idx = connections.findIndex((c) => c.id === id);
	if (idx !== -1) connections.splice(idx, 1);
}

/** @param {string} id */
export function getConnection(id) {
	return connections.find((c) => c.id === id) || null;
}

/** @param {string} id */
export function toggleConnection(id) {
	const link = getConnection(id);
	if (link) {
		link.active = !link.active;
		link.updatedAt = Date.now();
	}
	return link;
}

/**
 * @param {string} id
 * @param {ConnectionTransport} transport
 */
export function setConnectionTransport(id, transport) {
	const link = getConnection(id);
	if (!link) return null;
	link.transport = normalizeConnectionTransport(transport, link.endpointKind);
	link.updatedAt = Date.now();
	return link;
}

/**
 * @param {string} id
 * @param {string | null} error
 */
export function setConnectionLastError(id, error) {
	const link = getConnection(id);
	if (!link) return null;
	link.lastError = error || null;
	link.lastErrorAt = error ? Date.now() : null;
	link.updatedAt = Date.now();
	return link;
}

export function findConnectionByClientRequestId(clientRequestId) {
	if (!clientRequestId) return null;
	return connections.find((c) => c.clientRequestId === clientRequestId) || null;
}

/** @param {string} tileId */
export function getConnectionsForTile(tileId) {
	return connections.filter(
		(c) => c.sourceId === tileId || c.targetId === tileId,
	);
}

/** @param {string} tileId */
export function getConnectionsForSource(tileId) {
	return connections.filter((c) => c.sourceId === tileId);
}

/** @param {string} tileId */
export function getConnectionsForTarget(tileId) {
	return connections.filter((c) => c.targetId === tileId);
}

export function getActiveConnections() {
	return connections.filter((c) => c.active);
}

export function wouldCreateConnectionCycle(sourceId, targetId) {
	const visited = new Set();
	const queue = [targetId];
	while (queue.length > 0) {
		const current = queue.shift();
		if (current === sourceId) return true;
		if (visited.has(current)) continue;
		visited.add(current);
		for (const s of connections) {
			if (s.sourceId === current) queue.push(s.targetId);
		}
	}
	return false;
}

/**
 * Remove all connections referencing a tile.
 * @param {string} tileId
 * @returns {string[]} ids of removed connections
 */
export function removeConnectionsForTile(tileId) {
	/** @type {string[]} */
	const removedIds = [];
	for (let i = connections.length - 1; i >= 0; i--) {
		if (connections[i].sourceId === tileId || connections[i].targetId === tileId) {
			removedIds.push(connections[i].id);
			connections.splice(i, 1);
		}
	}
	for (let i = strings.length - 1; i >= 0; i--) {
		if (strings[i].sourceId === tileId || strings[i].targetId === tileId) {
			strings.splice(i, 1);
		}
	}
	return removedIds;
}

// ── String links (terminal-to-terminal pipes) ──

/**
 * @typedef {'none' | 'ansi-strip' | 'framed'} StringFilterMode
 * @typedef {'generic' | 'baton'} StringLinkMode
 *
 * @typedef {Object} StringLink
 * @property {string} id
 * @property {string} sourceId - Source terminal tile ID
 * @property {string} targetId - Target terminal tile ID
 * @property {StringFilterMode} filter
 * @property {StringLinkMode} [mode]
 * @property {boolean} active - Can be paused/resumed
 * @property {string} [triggerPattern] - Regex; string only activates when source output matches
 * @property {boolean} [triggered] - Whether the trigger has fired
 */

/** @type {StringLink[]} */
export const strings = [];

let stringIdCounter = 0;

export function generateStringId() {
	stringIdCounter++;
	return `string-${Date.now()}-${stringIdCounter}`;
}

function transportFromLegacyString(link) {
	return link.mode === "baton" ? "pty-baton" : "pty-generic";
}

function syncLegacyStringConnection(link) {
	const existing = getConnection(link.id);
	if (!existing) {
		addConnection({
			id: link.id,
			sourceId: link.sourceId,
			targetId: link.targetId,
			endpointKind: "agent",
			transport: transportFromLegacyString(link),
			active: link.active,
			lastError: null,
			lastErrorAt: null,
			clientRequestId: existing?.clientRequestId,
			triggerPattern: link.triggerPattern,
			triggered: link.triggered,
		});
		return;
	}
	existing.sourceId = link.sourceId;
	existing.targetId = link.targetId;
	existing.endpointKind = "agent";
	existing.transport = transportFromLegacyString(link);
	existing.active = link.active;
	existing.triggerPattern = link.triggerPattern;
	existing.triggered = link.triggered;
	existing.updatedAt = Date.now();
}

/** @param {StringLink} link */
export function addString(link) {
	const mode = link.mode === "baton" ? "baton" : "generic";
	const normalized = {
		...link,
		mode,
		filter: mode === "baton" ? "framed" : link.filter,
	};
	strings.push(normalized);
	syncLegacyStringConnection(normalized);
	return normalized;
}

/** @param {string} id */
export function removeString(id) {
	const idx = strings.findIndex((s) => s.id === id);
	if (idx !== -1) strings.splice(idx, 1);
	removeConnection(id);
}

/** @param {string} id */
export function getString(id) {
	return strings.find((s) => s.id === id) || null;
}

/** @param {string} id */
export function toggleString(id) {
	const link = getString(id);
	if (link) link.active = !link.active;
	const connection = getConnection(id);
	if (connection && link) {
		connection.active = link.active;
	}
	return link;
}

/** @param {string} tileId */
export function getStringsForSource(tileId) {
	return strings.filter((s) => s.sourceId === tileId);
}

/** @param {string} tileId */
export function getStringsForTarget(tileId) {
	return strings.filter((s) => s.targetId === tileId);
}

/** @param {string} tileId */
export function getStringsForTile(tileId) {
	return strings.filter((s) => s.sourceId === tileId || s.targetId === tileId);
}

export function getActiveStrings() {
	return strings.filter((s) => s.active);
}

/**
 * Detect if adding a string from sourceId to targetId would create a cycle.
 * Uses BFS to check reachability from targetId back to sourceId.
 */
export function wouldCreateCycle(sourceId, targetId) {
	return wouldCreateConnectionCycle(sourceId, targetId);
}

/**
 * Remove all strings referencing a tile (called when tile is closed).
 * @param {string} tileId
 * @returns {string[]} ids of removed string links (for main-process PTY registry sync)
 */
export function removeStringsForTile(tileId) {
	/** @type {string[]} */
	const removedIds = [];
	for (let i = strings.length - 1; i >= 0; i--) {
		if (strings[i].sourceId === tileId || strings[i].targetId === tileId) {
			removedIds.push(strings[i].id);
			strings.splice(i, 1);
		}
	}
	for (const id of removedIds) {
		removeConnection(id);
	}
	return removedIds;
}

let nextZIndex = 1;

const DEFAULT_TILE_SIZES = {
	term: { width: 400, height: 500 },
	note: { width: 440, height: 540 },
	code: { width: 440, height: 540 },
	image: { width: 280, height: 280 },
	graph: { width: 600, height: 500 },
	browser: { width: 800, height: 650 },
	pdf: { width: 600, height: 800 },
};

/** @param {TileType} type */
export function defaultSize(type) {
	return { ...DEFAULT_TILE_SIZES[type] };
}

let idCounter = 0;

export function generateId() {
	idCounter++;
	return `tile-${Date.now()}-${idCounter}`;
}

export function bringToFront(tile) {
	nextZIndex++;
	tile.zIndex = nextZIndex;
}

export function removeTile(id) {
	const idx = tiles.findIndex((t) => t.id === id);
	if (idx !== -1) tiles.splice(idx, 1);
}

export function addTile(tile) {
	if (!tile.zIndex) {
		nextZIndex++;
		tile.zIndex = nextZIndex;
	}
	tiles.push(tile);
	return tile;
}

export function getTile(id) {
	return tiles.find((t) => t.id === id) || null;
}

const IMAGE_EXTENSIONS = new Set([
	".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp",
]);

const GRID_CELL = 20;

/** Snap tile position and size to the minor grid. */
export function snapToGrid(tile) {
	tile.x = Math.round(tile.x / GRID_CELL) * GRID_CELL;
	tile.y = Math.round(tile.y / GRID_CELL) * GRID_CELL;
	tile.width = Math.round(tile.width / GRID_CELL) * GRID_CELL;
	tile.height = Math.round(tile.height / GRID_CELL) * GRID_CELL;
}

// ── Selection state ──

/** @type {Set<string>} */
const selectedTileIds = new Set();

/** @param {string} id */
export function selectTile(id) {
	selectedTileIds.add(id);
}

/** @param {string} id */
export function deselectTile(id) {
	selectedTileIds.delete(id);
}

/** @param {string} id */
export function toggleTileSelection(id) {
	if (selectedTileIds.has(id)) {
		selectedTileIds.delete(id);
	} else {
		selectedTileIds.add(id);
	}
}

export function clearSelection() {
	selectedTileIds.clear();
}

/** @param {string} id */
export function isSelected(id) {
	return selectedTileIds.has(id);
}

/** @returns {Tile[]} */
export function getSelectedTiles() {
	return tiles.filter((t) => selectedTileIds.has(t.id));
}

/** @returns {Tile | null} */
export function tileAtPoint(cx, cy) {
	const sorted = [...tiles].sort((a, b) => b.zIndex - a.zIndex);
	for (const tile of sorted) {
		if (
			cx >= tile.x && cx < tile.x + tile.width &&
			cy >= tile.y && cy < tile.y + tile.height
		) {
			return tile;
		}
	}
	return null;
}

export function inferTileType(filePath) {
	const ext = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
	if (ext === ".md") return "note";
	if (ext === ".pdf") return "pdf";
	if (IMAGE_EXTENSIONS.has(ext)) return "image";
	return "code";
}
