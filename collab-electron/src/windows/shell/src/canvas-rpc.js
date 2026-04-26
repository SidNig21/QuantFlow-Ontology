import {
	tiles, getTile, defaultSize, snapToGrid,
	connections, getConnection, addConnection, removeConnection,
	toggleConnection, generateConnectionId, wouldCreateConnectionCycle,
	setConnectionTransport, getCanvasRevision,
	findConnectionByClientRequestId,
	strings, getString, addString, removeString,
	toggleString, generateStringId, wouldCreateCycle,
} from "./canvas-state.js";
import {
	ptyStringLinkUpsertToMain,
	ptyStringLinkRemoveFromMain,
	ptyStringLinkSetActiveOnMain,
} from "./string-link-main-sync.js";
import {
	connectionUpsertToMain,
	connectionRemoveFromMain,
} from "./connection-main-sync.js";

/**
 * Find a non-overlapping position on the canvas for a tile of the
 * given size. Scans on a 20 px grid within a 4000x3000 region.
 */
export function findAutoPlacement(existingTiles, width, height) {
	const CANVAS_W = 4000;
	const CANVAS_H = 3000;
	const STEP = 20;

	for (let y = 0; y <= CANVAS_H - height; y += STEP) {
		for (let x = 0; x <= CANVAS_W - width; x += STEP) {
			const overlaps = existingTiles.some((t) =>
				x < t.x + t.width &&
				x + width > t.x &&
				y < t.y + t.height &&
				y + height > t.y,
			);
			if (!overlaps) return { x, y };
		}
	}

	const last = existingTiles[existingTiles.length - 1];
	if (last) return { x: last.x + 40, y: last.y + 40 };
	return { x: 40, y: 40 };
}

/**
 * Create the canvas RPC request handler.
 *
 * Methods: tileList, tileCreate, tileRemove, tileMove, tileResize,
 *          viewportGet, viewportSet, terminalWrite, terminalRead,
 *          tileFocus.
 */
export function createCanvasRpc({
	tileManager, viewportState, viewport, edgeIndicators,
}) {
	function throwRpcError(code, message, data) {
		const error = new Error(message);
		error.code = code;
		error.data = data;
		throw error;
	}

	function respond(requestId, result) {
		window.shellApi.canvasRpcResponse({ requestId, result });
	}

	function respondError(requestId, code, message, data) {
		window.shellApi.canvasRpcResponse({
			requestId, error: { code, message, data },
		});
	}

	function requireTile(requestId, tileId) {
		const tile = getTile(tileId);
		if (!tile) {
			if (requestId) {
				respondError(
					requestId,
					"TILE_NOT_FOUND",
					`Tile not found: ${tileId}`,
					{ tileId },
				);
				return null;
			}
			throwRpcError(
				"TILE_NOT_FOUND",
				`Tile not found: ${tileId}`,
				{ tileId },
			);
		}
		return tile;
	}

	function requireRevision(requestId, ifRevision) {
		if (ifRevision == null) return true;
		const currentRevision = getCanvasRevision();
		if (ifRevision !== currentRevision) {
			respondError(
				requestId,
				"REVISION_CONFLICT",
				`Canvas revision mismatch: expected ${ifRevision}, got ${currentRevision}`,
				{ revision: currentRevision },
			);
			return false;
		}
		return true;
	}

	function getBrowserDom(tileId) {
		const tile = getTile(tileId);
		if (!tile) {
			throwRpcError(
				"TILE_NOT_FOUND",
				`Tile not found: ${tileId}`,
				{ tileId },
			);
		}
		if (tile.type !== "browser") {
			throwRpcError(
				"INVALID_ENDPOINT_KIND",
				`Tile ${tileId} is not a browser tile`,
				{ tileId, tileType: tile.type },
			);
		}
		const dom = tileManager.getTileDOMs().get(tileId);
		if (!dom?.webview) {
			throwRpcError(
				"TARGET_OFFLINE",
				`Browser tile ${tileId} is not ready`,
				{ tileId },
			);
		}
		return { tile, dom };
	}

	function tileLabel(tile) {
		return tile.userTitle || tile.autoTitle || tile.id;
	}

	function endpointKindForPair(sourceTile, targetTile) {
		if (sourceTile.type === "term" && targetTile.type === "term") {
			return "agent";
		}
		if (sourceTile.type === "term" && targetTile.type === "browser") {
			return "browser";
		}
		if (sourceTile.type === "browser" && targetTile.type === "term") {
			return "browser";
		}
		if (sourceTile.type === "term" && (targetTile.type === "note" || targetTile.type === "code")) {
			return "note";
		}
		if ((sourceTile.type === "note" || sourceTile.type === "code") && targetTile.type === "term") {
			return "note";
		}
		return null;
	}

	function connectionMainPayload(connection, emitEvent = false) {
		return {
			id: connection.id,
			sourceId: connection.sourceId,
			targetId: connection.targetId,
			connectionSchemaVersion: connection.connectionSchemaVersion ?? 1,
			transport: connection.transport,
			endpointKind: connection.endpointKind,
			active: connection.active,
			verbs: connection.verbs,
			ownerKind: connection.ownerKind,
			ownerTileId: connection.ownerTileId,
			sessionId: connection.sessionId,
			createdBy: connection.createdBy,
			createdAt: connection.createdAt,
			updatedAt: connection.updatedAt,
			lastError: connection.lastError,
			lastErrorAt: connection.lastErrorAt,
			emitEvent,
		};
	}

	async function connectionCreateMutation(params, requestId = null) {
		if (!requireRevision(requestId, params.ifRevision)) return null;
		const srcTile = requireTile(requestId, params.sourceTileId);
		if (!srcTile) return null;
		const tgtTile = requireTile(requestId, params.targetTileId);
		if (!tgtTile) return null;
		if (srcTile.id === tgtTile.id) {
			if (requestId) {
				respondError(
					requestId,
					"INVALID_ARGUMENT",
					"Cannot connect a tile to itself",
					{
						sourceTileId: srcTile.id,
						targetTileId: tgtTile.id,
					},
				);
				return null;
			}
			throwRpcError(
				"INVALID_ARGUMENT",
				"Cannot connect a tile to itself",
				{
					sourceTileId: srcTile.id,
					targetTileId: tgtTile.id,
				},
			);
		}
		const endpointKind = params.endpointKind || endpointKindForPair(srcTile, tgtTile);
		if (!endpointKind) {
			if (requestId) {
				respondError(
					requestId,
					"INVALID_ENDPOINT_KIND",
					"Unsupported tile pairing for a semantic connection",
					{
						sourceType: srcTile.type,
						targetType: tgtTile.type,
					},
				);
				return null;
			}
			throwRpcError(
				"INVALID_ENDPOINT_KIND",
				"Unsupported tile pairing for a semantic connection",
				{
					sourceType: srcTile.type,
					targetType: tgtTile.type,
				},
			);
		}
		if (wouldCreateConnectionCycle(srcTile.id, tgtTile.id)) {
			if (requestId) {
				respondError(
					requestId,
					"INVALID_ARGUMENT",
					"Connection would create a cycle",
					{
						sourceTileId: srcTile.id,
						targetTileId: tgtTile.id,
					},
				);
				return null;
			}
			throwRpcError(
				"INVALID_ARGUMENT",
				"Connection would create a cycle",
				{
					sourceTileId: srcTile.id,
					targetTileId: tgtTile.id,
				},
			);
		}
		const transport = params.transport || "agent-channel";
		const existingByRequest = findConnectionByClientRequestId(
			params.clientRequestId,
		);
		if (
			existingByRequest &&
			existingByRequest.sourceId === srcTile.id &&
			existingByRequest.targetId === tgtTile.id
		) {
			return {
				connectionId: existingByRequest.id,
				revision: getCanvasRevision(),
				changedEntityIds: [existingByRequest.id],
			};
		}
		const connectionId = params.connectionId || generateConnectionId();
		const existingById = getConnection(connectionId);
		if (existingById) {
			return {
				connectionId,
				revision: getCanvasRevision(),
				changedEntityIds: [connectionId],
			};
		}
		let connection;
		if (transport === "pty-baton" || transport === "pty-generic") {
			if (srcTile.type !== "term" || tgtTile.type !== "term") {
				throwRpcError(
					"TRANSPORT_MISMATCH",
					"PTY transports require terminal-to-terminal connections",
					{
						sourceType: srcTile.type,
						targetType: tgtTile.type,
						transport,
					},
				);
			}
			if (!srcTile.ptySessionId || !tgtTile.ptySessionId) {
				throwRpcError(
					"TARGET_OFFLINE",
					"PTY transports require active terminal sessions on both sides",
					{
						sourceTileId: srcTile.id,
						targetTileId: tgtTile.id,
					},
				);
			}
			const legacy = addString({
				id: connectionId,
				sourceId: srcTile.id,
				targetId: tgtTile.id,
				filter: "framed",
				mode: transport === "pty-baton" ? "baton" : "generic",
				active: true,
				triggerPattern: params.triggerPattern || undefined,
				triggered: !params.triggerPattern,
			});
			connection = getConnection(legacy.id);
			connection.clientRequestId = params.clientRequestId;
			await ptyStringLinkUpsertToMain({
				id: legacy.id,
				sourceSessionId: srcTile.ptySessionId,
				targetSessionId: tgtTile.ptySessionId,
				filter: legacy.filter,
				mode: legacy.mode,
				active: legacy.active,
				triggerPattern: legacy.triggerPattern || undefined,
				triggered: legacy.triggered,
			});
		} else {
			connection = addConnection({
				id: connectionId,
				sourceId: srcTile.id,
				targetId: tgtTile.id,
				transport,
				endpointKind,
				active: true,
				verbs: params.verbs,
				ownerKind: params.ownerKind,
				ownerTileId: params.ownerTileId,
				sessionId: params.sessionId,
				createdBy: params.createdBy,
				clientRequestId: params.clientRequestId,
				lastError: null,
				lastErrorAt: null,
			});
		}
		await connectionUpsertToMain(connectionMainPayload(connection, true));
		tileManager.saveCanvasImmediate();
		window.dispatchEvent(new CustomEvent("connections-changed"));
		return {
			connectionId,
			revision: getCanvasRevision(),
			changedEntityIds: [connectionId],
		};
	}

	async function connectionRemoveMutation(params, requestId = null) {
		if (!requireRevision(requestId, params.ifRevision)) return null;
		const connection = getConnection(params.connectionId);
		if (!connection) {
			if (requestId) {
				respondError(
					requestId,
					"CONNECTION_NOT_FOUND",
					`Connection not found: ${params.connectionId}`,
					{ connectionId: params.connectionId },
				);
				return null;
			}
			throwRpcError(
				"CONNECTION_NOT_FOUND",
				`Connection not found: ${params.connectionId}`,
				{ connectionId: params.connectionId },
			);
		}
		removeConnection(params.connectionId);
		removeString(params.connectionId);
		await connectionRemoveFromMain(params.connectionId);
		await ptyStringLinkRemoveFromMain(params.connectionId);
		tileManager.saveCanvasImmediate();
		window.dispatchEvent(new CustomEvent("connections-changed"));
		return {
			connectionId: params.connectionId,
			revision: getCanvasRevision(),
			changedEntityIds: [params.connectionId],
		};
	}

	async function connectionToggleMutation(params, requestId = null) {
		if (!requireRevision(requestId, params.ifRevision)) return null;
		const connection = toggleConnection(params.connectionId);
		if (!connection) {
			if (requestId) {
				respondError(
					requestId,
					"CONNECTION_NOT_FOUND",
					`Connection not found: ${params.connectionId}`,
					{ connectionId: params.connectionId },
				);
				return null;
			}
			throwRpcError(
				"CONNECTION_NOT_FOUND",
				`Connection not found: ${params.connectionId}`,
				{ connectionId: params.connectionId },
			);
		}
		const legacyString = getString(params.connectionId);
		if (legacyString) {
			legacyString.active = connection.active;
			await ptyStringLinkSetActiveOnMain(
				params.connectionId,
				connection.active,
			);
		}
		await connectionUpsertToMain(connectionMainPayload(connection, true));
		tileManager.saveCanvasImmediate();
		window.dispatchEvent(new CustomEvent("connections-changed"));
		return {
			connectionId: params.connectionId,
			active: connection.active,
			revision: getCanvasRevision(),
			changedEntityIds: [params.connectionId],
		};
	}

	async function connectionSetTransportMutation(params, requestId = null) {
		if (!requireRevision(requestId, params.ifRevision)) return null;
		const current = getConnection(params.connectionId);
		if (!current) {
			if (requestId) {
				respondError(
					requestId,
					"CONNECTION_NOT_FOUND",
					`Connection not found: ${params.connectionId}`,
					{ connectionId: params.connectionId },
				);
				return null;
			}
			throwRpcError(
				"CONNECTION_NOT_FOUND",
				`Connection not found: ${params.connectionId}`,
				{ connectionId: params.connectionId },
			);
		}
		const srcTile = requireTile(requestId, current.sourceId);
		if (!srcTile) return null;
		const tgtTile = requireTile(requestId, current.targetId);
		if (!tgtTile) return null;
		const nextTransport = params.transport;
		let connection = current;
		if (nextTransport === "pty-baton" || nextTransport === "pty-generic") {
			if (srcTile.type !== "term" || tgtTile.type !== "term") {
				throwRpcError(
					"TRANSPORT_MISMATCH",
					"PTY transports require terminal-to-terminal connections",
					{
						sourceType: srcTile.type,
						targetType: tgtTile.type,
						transport: nextTransport,
					},
				);
			}
			if (!srcTile.ptySessionId || !tgtTile.ptySessionId) {
				throwRpcError(
					"TARGET_OFFLINE",
					"PTY transports require active terminal sessions on both sides",
					{
						sourceTileId: srcTile.id,
						targetTileId: tgtTile.id,
					},
				);
			}
			const legacy = getString(params.connectionId) || addString({
				id: params.connectionId,
				sourceId: current.sourceId,
				targetId: current.targetId,
				filter: "framed",
				mode: nextTransport === "pty-baton" ? "baton" : "generic",
				active: current.active,
				triggerPattern: current.triggerPattern,
				triggered: current.triggered,
			});
			legacy.mode = nextTransport === "pty-baton" ? "baton" : "generic";
			legacy.filter = "framed";
			legacy.active = current.active;
			connection = setConnectionTransport(params.connectionId, nextTransport);
			connection.clientRequestId = current.clientRequestId;
			await ptyStringLinkUpsertToMain({
				id: legacy.id,
				sourceSessionId: srcTile.ptySessionId,
				targetSessionId: tgtTile.ptySessionId,
				filter: legacy.filter,
				mode: legacy.mode,
				active: legacy.active,
				triggerPattern: legacy.triggerPattern || undefined,
				triggered: legacy.triggered,
			});
		} else {
				const snapshot = {
					id: current.id,
					sourceId: current.sourceId,
					targetId: current.targetId,
					active: current.active,
					endpointKind: current.endpointKind,
					connectionSchemaVersion: current.connectionSchemaVersion,
					verbs: current.verbs,
					ownerKind: current.ownerKind,
					ownerTileId: current.ownerTileId,
					sessionId: current.sessionId,
					createdBy: current.createdBy,
					createdAt: current.createdAt,
					updatedAt: current.updatedAt,
					clientRequestId: current.clientRequestId,
					lastError: current.lastError,
					lastErrorAt: current.lastErrorAt,
				};
			if (getString(params.connectionId)) {
				removeString(params.connectionId);
				await ptyStringLinkRemoveFromMain(params.connectionId);
				connection = addConnection({
					...snapshot,
					transport: "agent-channel",
				});
			} else {
				connection = setConnectionTransport(
					params.connectionId,
					"agent-channel",
				);
			}
		}
		await connectionUpsertToMain(connectionMainPayload(connection, true));
		tileManager.saveCanvasImmediate();
		window.dispatchEvent(new CustomEvent("connections-changed"));
		return {
			connectionId: params.connectionId,
			transport: connection.transport,
			revision: getCanvasRevision(),
			changedEntityIds: [params.connectionId],
		};
	}

	async function browserNavigateMutation(params) {
		const { tile, dom } = getBrowserDom(params.tileId);
		const url = String(params.url || "").trim();
		if (!url) {
			throwRpcError(
				"INVALID_ARGUMENT",
				"browserNavigate requires a non-empty url",
				{ tileId: params.tileId },
			);
		}
		tile.url = url;
		if (dom.webview) {
			dom.contentArea.removeChild(dom.webview);
			dom.webview = null;
		}
		tileManager.spawnBrowserWebview(tile);
		tileManager.saveCanvasImmediate();
		return {
			tileId: tile.id,
			url: tile.url,
		};
	}

	async function browserInfoMutation(params) {
		const { tile, dom } = getBrowserDom(params.tileId);
		return {
			tileId: tile.id,
			url: dom.webview.getURL?.() || tile.url || null,
			title: dom.webview.getTitle?.() || null,
			canGoBack: dom.webview.canGoBack?.() || false,
			canGoForward: dom.webview.canGoForward?.() || false,
			isLoading: dom.webview.isLoading?.() || false,
		};
	}

	async function browserSnapshotMutation(params) {
		const { tile, dom } = getBrowserDom(params.tileId);
		const image = await dom.webview.capturePage();
		return {
			tileId: tile.id,
			url: dom.webview.getURL?.() || tile.url || null,
			title: dom.webview.getTitle?.() || null,
			dataUrl: image.toDataURL(),
		};
	}

	async function handleCanvasRpc(request) {
		const { requestId, method, params } = request;

		try {
			let result;
			switch (method) {
				case "snapshot": {
					result = {
						revision: getCanvasRevision(),
						tiles: tiles.map((t) => ({
							id: t.id,
							type: t.type,
							label: tileLabel(t),
							filePath: t.filePath ?? null,
							folderPath: t.folderPath ?? null,
							url: t.url ?? null,
							cwd: t.cwd ?? null,
							ptySessionId: t.ptySessionId ?? null,
							role: t.role ?? null,
							position: { x: t.x, y: t.y },
							size: { width: t.width, height: t.height },
						})),
						connections: connections.map((c) => ({
						id: c.id,
						sourceId: c.sourceId,
						targetId: c.targetId,
						connectionSchemaVersion: c.connectionSchemaVersion ?? 1,
						transport: c.transport,
						endpointKind: c.endpointKind,
						active: c.active,
						verbs: c.verbs,
						ownerKind: c.ownerKind,
						ownerTileId: c.ownerTileId,
						sessionId: c.sessionId,
						createdBy: c.createdBy,
						createdAt: c.createdAt,
						updatedAt: c.updatedAt,
						clientRequestId: c.clientRequestId,
						lastError: c.lastError ?? null,
						lastErrorAt: c.lastErrorAt ?? null,
					})),
					};
					break;
				}
				case "tileList": {
					result = {
						tiles: tiles.map((t) => ({
							id: t.id,
							type: t.type,
							filePath: t.filePath,
							folderPath: t.folderPath,
							position: { x: t.x, y: t.y },
							size: { width: t.width, height: t.height },
						})),
					};
					break;
				}
				case "tileCreate": {
					const tileType = params.tileType || "note";
					const size = defaultSize(tileType);
					const pos = params.position
						? { x: params.position.x, y: params.position.y }
						: findAutoPlacement(tiles, size.width, size.height);

					let tile;
					if (tileType === "term") {
						const extra = {};
						if (typeof params.cwd === "string" && params.cwd.trim()) {
							extra.cwd = params.cwd;
						}
						if (typeof params.role === "string" && params.role.trim()) {
							extra.role = params.role.trim().toLowerCase();
						}
						if (typeof params.userTitle === "string" && params.userTitle.trim()) {
							extra.userTitle = params.userTitle.trim();
						}
						if (typeof params.startupCommand === "string" && params.startupCommand.trim()) {
							extra.startupCommand = params.startupCommand;
						}
						tile = tileManager.createCanvasTile(
							"term", pos.x, pos.y, extra,
						);
						tileManager.spawnTerminalWebview(tile);
					} else if (tileType === "graph") {
						const wsPath = "";
						tile = tileManager.createGraphTile(
							pos.x, pos.y, params.filePath, wsPath,
						);
					} else {
						tile = tileManager.createFileTile(
							tileType, pos.x, pos.y, params.filePath,
						);
					}
					tileManager.saveCanvasImmediate();
					result = { tileId: tile.id };
					break;
				}
				case "tileSetRole": {
					const tile = requireTile(requestId, params.tileId);
					if (!tile) return;
					const role = String(params.role || "").trim().toLowerCase();
					if (role) {
						tile.role = role;
					} else {
						delete tile.role;
					}
					tileManager.saveCanvasImmediate();
					result = { tileId: tile.id, role: tile.role ?? null };
					break;
				}
				case "cleanSlate": {
					const hermesTiles = tiles.filter(
						(t) => t.type === "term" && t.role === "hermes",
					);
					if (hermesTiles.length === 0 && !params.confirmNoHermes) {
						respondError(
							requestId,
							"PERMISSION_DENIED",
							"Clean Slate found no tile marked role=hermes; pass confirmNoHermes to close all terminals",
							{},
						);
						return;
					}
					const toClose = tiles
						.filter((t) => t.type === "term" && t.role !== "hermes")
						.map((t) => t.id);
					for (const id of toClose) {
						await tileManager.closeCanvasTile(id);
					}
					result = {
						closedTileIds: toClose,
						preservedHermesTileIds: hermesTiles.map((t) => t.id),
						revision: getCanvasRevision(),
					};
					break;
				}
				case "tileRemove": {
					if (!requireTile(requestId, params.tileId)) return;
					tileManager.closeCanvasTile(params.tileId);
					result = {};
					break;
				}
				case "tileMove": {
					const tile = requireTile(requestId, params.tileId);
					if (!tile) return;
					const mx = params.position?.x;
					const my = params.position?.y;
					if (!Number.isFinite(mx) || !Number.isFinite(my)) {
						respondError(requestId, 4, "Invalid position");
						return;
					}
					tile.x = mx;
					tile.y = my;
					snapToGrid(tile);
					tileManager.repositionAllTiles();
					tileManager.saveCanvasImmediate();
					result = {};
					break;
				}
				case "tileResize": {
					const tile = requireTile(requestId, params.tileId);
					if (!tile) return;
					const rw = params.size?.width;
					const rh = params.size?.height;
					if (!Number.isFinite(rw) || !Number.isFinite(rh)) {
						respondError(requestId, 4, "Invalid size");
						return;
					}
					tile.width = rw;
					tile.height = rh;
					snapToGrid(tile);
					tileManager.repositionAllTiles();
					tileManager.saveCanvasImmediate();
					result = {};
					break;
				}
				case "viewportGet": {
					result = {
						pan: {
							x: viewportState.panX,
							y: viewportState.panY,
						},
						zoom: viewportState.zoom,
					};
					break;
				}
				case "viewportSet": {
					if (params.pan) {
						viewportState.panX = params.pan.x;
						viewportState.panY = params.pan.y;
					}
					if (params.zoom !== undefined) {
						viewportState.zoom = params.zoom;
					}
					viewport.updateCanvas();
					tileManager.saveCanvasDebounced();
					result = { revision: getCanvasRevision() };
					break;
				}
				case "connectionCreate": {
					result = await connectionCreateMutation(params, requestId);
					if (result == null) return;
					break;
				}
				case "connectionRemove": {
					result = await connectionRemoveMutation(params, requestId);
					if (result == null) return;
					break;
				}
				case "connectionToggle": {
					result = await connectionToggleMutation(params, requestId);
					if (result == null) return;
					break;
				}
				case "connectionSetTransport": {
					result = await connectionSetTransportMutation(params, requestId);
					if (result == null) return;
					break;
				}
				case "browserNavigate": {
					result = await browserNavigateMutation(params);
					break;
				}
				case "browserInfo": {
					result = await browserInfoMutation(params);
					break;
				}
				case "browserSnapshot": {
					result = await browserSnapshotMutation(params);
					break;
				}
				case "terminalWrite": {
					const tile = requireTile(requestId, params.tileId);
					if (!tile) return;
					if (tile.type !== "term") {
						respondError(
							requestId,
							"INVALID_ENDPOINT_KIND",
							`Tile ${tile.id} is not a terminal`,
							{ tileId: tile.id, tileType: tile.type },
						);
						return;
					}
					if (!tile.ptySessionId) {
						respondError(
							requestId,
							"TARGET_OFFLINE",
							`Terminal ${tile.id} has no active session`,
							{ tileId: tile.id },
						);
						return;
					}
					window.shellApi.ptyWrite(
						tile.ptySessionId, params.input,
					);
					result = {};
					break;
				}
				case "terminalRead": {
					const tile = requireTile(requestId, params.tileId);
					if (!tile) return;
					if (tile.type !== "term") {
						respondError(
							requestId,
							"INVALID_ENDPOINT_KIND",
							`Tile ${tile.id} is not a terminal`,
							{ tileId: tile.id, tileType: tile.type },
						);
						return;
					}
					if (!tile.ptySessionId) {
						respondError(
							requestId,
							"TARGET_OFFLINE",
							`Terminal ${tile.id} has no active session`,
							{ tileId: tile.id },
						);
						return;
					}
					const lines = params.lines ?? 50;
					const output = await window.shellApi.ptyCapture(
						tile.ptySessionId, lines,
					);
					result = { output };
					break;
				}
			case "tileFocus": {
				const ids = params.tileIds;
				if (!Array.isArray(ids) || ids.length === 0) {
					respondError(
						requestId, 4,
						"tileIds must be a non-empty array",
					);
					return;
				}
				const focusTiles = [];
				for (const id of ids) {
					const t = getTile(id);
					if (!t) {
						respondError(
							requestId, 3, `Tile not found: ${id}`,
						);
						return;
					}
					focusTiles.push(t);
				}
				edgeIndicators.panToTiles(focusTiles);
				result = {};
				break;
			}

			// ── String link methods ──

			case "stringCreate": {
				const srcTile = requireTile(requestId, params.sourceTileId);
				if (!srcTile) return;
				const tgtTile = requireTile(requestId, params.targetTileId);
				if (!tgtTile) return;
				if (srcTile.type !== "term") {
					respondError(requestId, 4, "Source tile is not a terminal");
					return;
				}
				if (tgtTile.type !== "term") {
					respondError(requestId, 4, "Target tile is not a terminal");
					return;
				}
				if (!srcTile.ptySessionId || !tgtTile.ptySessionId) {
					respondError(requestId, 4, "Both tiles must have active PTY sessions");
					return;
				}
				if (srcTile.id === tgtTile.id) {
					respondError(requestId, 4, "Cannot string a tile to itself");
					return;
				}
				if (wouldCreateCycle(srcTile.id, tgtTile.id)) {
					respondError(requestId, 4, "String would create a cycle");
					return;
				}
				const stringId = generateStringId();
				const mode = params.mode === "baton" ? "baton" : "generic";
				const filter = mode === "baton"
					? "framed"
					: (params.filter || "framed");
				addString({
					id: stringId,
					sourceId: srcTile.id,
					targetId: tgtTile.id,
					filter,
					mode,
					active: true,
					triggerPattern: params.triggerPattern || undefined,
					triggered: !params.triggerPattern,
				});
				const connection = getConnection(stringId);
				await ptyStringLinkUpsertToMain({
					id: stringId,
					sourceSessionId: srcTile.ptySessionId,
					targetSessionId: tgtTile.ptySessionId,
					filter,
					mode,
					active: true,
					triggerPattern: params.triggerPattern || undefined,
					triggered: !params.triggerPattern,
				});
				await connectionUpsertToMain(connectionMainPayload(connection, true));
				tileManager.saveCanvasImmediate();
				window.dispatchEvent(new CustomEvent("strings-changed"));
				window.dispatchEvent(new CustomEvent("connections-changed"));
				result = {
					stringId,
					connectionId: stringId,
					revision: getCanvasRevision(),
					changedEntityIds: [stringId],
					sourceSessionId: srcTile.ptySessionId,
					targetSessionId: tgtTile.ptySessionId,
				};
				break;
			}
			case "stringRemove": {
				const link = getString(params.stringId);
				if (!link) {
					respondError(requestId, 3, "String not found");
					return;
				}
				removeString(params.stringId);
				await ptyStringLinkRemoveFromMain(params.stringId);
				await connectionRemoveFromMain(params.stringId);
				tileManager.saveCanvasImmediate();
				window.dispatchEvent(new CustomEvent("strings-changed"));
				window.dispatchEvent(new CustomEvent("connections-changed"));
				result = {
					stringId: params.stringId,
					revision: getCanvasRevision(),
					changedEntityIds: [params.stringId],
				};
				break;
			}
			case "stringList": {
				result = {
					strings: strings.map((s) => ({
						id: s.id,
						sourceId: s.sourceId,
						targetId: s.targetId,
						filter: s.filter,
						mode: s.mode,
						active: s.active,
						triggerPattern: s.triggerPattern,
						triggered: s.triggered,
					})),
				};
				break;
			}
			case "stringToggle": {
				const toggled = toggleString(params.stringId);
				if (!toggled) {
					respondError(requestId, 3, "String not found");
					return;
				}
				await ptyStringLinkSetActiveOnMain(
					params.stringId,
					toggled.active,
				);
				const connection = getConnection(params.stringId);
				if (connection) {
					await connectionUpsertToMain(connectionMainPayload(connection, true));
				}
				tileManager.saveCanvasImmediate();
				window.dispatchEvent(new CustomEvent("strings-changed"));
				window.dispatchEvent(new CustomEvent("connections-changed"));
				result = {
					stringId: params.stringId,
					active: toggled.active,
					revision: getCanvasRevision(),
					changedEntityIds: [params.stringId],
				};
				break;
			}

			default: {
				respondError(
					requestId, -32601,
					`Unknown method: ${method}`,
				);
				return;
			}
			}
			respond(requestId, result);
		} catch (err) {
			respondError(
				requestId,
				err.code || -32603,
				err.message || "Internal error",
				err.data,
			);
		}
	}

	async function invokeLocal(method, params = {}) {
		switch (method) {
			case "connectionCreate":
				return connectionCreateMutation(params);
			case "connectionRemove":
				return connectionRemoveMutation(params);
			case "connectionToggle":
				return connectionToggleMutation(params);
			case "connectionSetTransport":
				return connectionSetTransportMutation(params);
			default:
				throwRpcError(
					"INVALID_ARGUMENT",
					`Local mutation not supported for method: ${method}`,
					{ method },
				);
		}
	}

	return {
		handleRequest: handleCanvasRpc,
		invokeLocal,
	};
}
