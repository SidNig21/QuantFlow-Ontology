import {
	connections,
	generateConnectionId,
	getCanvasRevision,
	getConnection,
	getTile,
} from "./canvas-state.js";
import { ptyStringLinkListFromMain } from "./string-link-main-sync.js";

const COLORS = {
	"agent-channel": "#0ea5e9",
	"pty-baton": "#d97706",
	"pty-generic": "#6d28d9",
	paused: "#6b7280",
	error: "#dc2626",
	previewValid: "#10b981",
	previewInvalid: "#dc2626",
	port: "#e2e8f0",
};

const CONNECTABLE_TYPES = new Set(["term", "note", "code", "browser"]);
const PORT_RADIUS = 7;
const PORT_HIT_RADIUS = 14;
const PORT_OFFSET = 16;
const MAX_UNDO = 20;

let svgEl = null;
let portsLayer = null;
let inspectorEl = null;
let viewportState = null;
let tileManager = null;
let pendingDrag = null;
let selectedConnectionId = null;
let invokeCanvasMutation = null;
let statusEl = null;
let overlayError = null;

const runtimeByConnectionId = new Map();
const undoStack = [];

export function createPendingDragState(sourceTileId, startX, startY) {
	return {
		sourceTileId,
		startX,
		startY,
		currentX: startX,
		currentY: startY,
		targetTileId: null,
		state: "dragging",
	};
}

export function movePendingDrag(state, currentX, currentY) {
	return {
		...state,
		currentX,
		currentY,
	};
}

export function hoverPendingDragTarget(state, targetTileId, isValid) {
	return {
		...state,
		targetTileId,
		state: isValid ? "snap-valid" : "snap-invalid",
	};
}

export function clearPendingDragTarget(state, targetTileId) {
	if (state.targetTileId !== targetTileId) return state;
	return {
		...state,
		targetTileId: null,
		state: "dragging",
	};
}

export function createConnectionOverlay({
	panelViewer,
	viewportState: vs,
	tileManager: tm,
	invokeCanvasMutation: invokeMutation,
}) {
	viewportState = vs;
	tileManager = tm;
	invokeCanvasMutation = invokeMutation;

	svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	svgEl.id = "connection-overlay";
	svgEl.style.cssText = [
		"position: absolute",
		"top: 0",
		"left: 0",
		"width: 100%",
		"height: 100%",
		"pointer-events: none",
		"z-index: 5",
		"overflow: visible",
	].join(";");

	const tileLayer = panelViewer.querySelector("#tile-layer");
	panelViewer.insertBefore(svgEl, tileLayer);

	portsLayer = document.createElement("div");
	portsLayer.id = "connection-ports-layer";
	portsLayer.style.cssText = [
		"position: absolute",
		"top: 0",
		"left: 0",
		"width: 100%",
		"height: 100%",
		"pointer-events: none",
		"z-index: 15",
	].join(";");
	panelViewer.appendChild(portsLayer);

	inspectorEl = document.createElement("div");
	inspectorEl.id = "connection-inspector";
	inspectorEl.style.cssText = [
		"position: absolute",
		"top: 18px",
		"right: 18px",
		"width: 340px",
		"max-width: calc(100% - 36px)",
		"padding: 14px",
		"border-radius: 12px",
		"background: rgba(15, 23, 42, 0.94)",
		"color: #e5e7eb",
		"border: 1px solid rgba(148, 163, 184, 0.28)",
		"box-shadow: 0 12px 30px rgba(0,0,0,0.35)",
		"backdrop-filter: blur(10px)",
		"font-size: 12px",
		"line-height: 1.45",
		"display: none",
		"pointer-events: auto",
		"z-index: 20",
	].join(";");
	panelViewer.appendChild(inspectorEl);

	statusEl = document.createElement("div");
	statusEl.id = "connection-overlay-status";
	statusEl.style.cssText = [
		"position: absolute",
		"left: 18px",
		"bottom: 18px",
		"max-width: 460px",
		"padding: 10px 12px",
		"border-radius: 10px",
		"background: rgba(127, 29, 29, 0.94)",
		"color: #fee2e2",
		"border: 1px solid rgba(248, 113, 113, 0.35)",
		"box-shadow: 0 12px 30px rgba(0,0,0,0.25)",
		"font-size: 12px",
		"line-height: 1.4",
		"display: none",
		"pointer-events: none",
		"z-index: 20",
	].join(";");
	panelViewer.appendChild(statusEl);

	document.addEventListener("keydown", onKeyDown);

	return {
		update,
		destroy,
		refreshRuntimeTelemetry,
	};
}

function normalizeError(error) {
	if (!error) {
		return { code: "INTERNAL_ERROR", message: "Unknown canvas error" };
	}
	return {
		code: error.code || "INTERNAL_ERROR",
		message: error.message || String(error),
	};
}

function setOverlayError(error) {
	overlayError = normalizeError(error);
	renderStatus();
}

function clearOverlayError() {
	if (!overlayError) return;
	overlayError = null;
	renderStatus();
}

function renderStatus() {
	if (!statusEl) return;
	if (!overlayError) {
		statusEl.style.display = "none";
		statusEl.textContent = "";
		return;
	}
	statusEl.style.display = "block";
	statusEl.textContent = `${overlayError.code}: ${overlayError.message}`;
}

async function runCanvasMutation(method, params) {
	clearOverlayError();
	try {
		return await invokeCanvasMutation(method, {
			...params,
			ifRevision: params.ifRevision ?? getCanvasRevision(),
		});
	} catch (error) {
		setOverlayError(error);
		renderInspector();
		update();
		throw error;
	}
}

function onKeyDown(event) {
	if (event.key === "Escape" && pendingDrag) {
		cancelDrag();
		event.preventDefault();
		return;
	}
	if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
		if (undoStack.length > 0) {
			void applyUndo();
			event.preventDefault();
		}
	}
}

function connectableTile(tile) {
	return tile && CONNECTABLE_TYPES.has(tile.type);
}

function getDefaultTransport(sourceTile, targetTile) {
	if (sourceTile.type === "term" && targetTile.type === "term") {
		return "agent-channel";
	}
	return "agent-channel";
}

function endpointKindForPair(sourceTile, targetTile) {
	if (sourceTile.type === "term" && targetTile.type === "term") return "agent";
	if (
		(sourceTile.type === "term" && targetTile.type === "browser")
		|| (sourceTile.type === "browser" && targetTile.type === "term")
	) return "browser";
	if (
		(sourceTile.type === "term" && (targetTile.type === "note" || targetTile.type === "code"))
		|| ((sourceTile.type === "note" || sourceTile.type === "code") && targetTile.type === "term")
	) return "note";
	return null;
}

function canConnect(sourceId, targetId) {
	if (!sourceId || !targetId || sourceId === targetId) return false;
	const sourceTile = getTile(sourceId);
	const targetTile = getTile(targetId);
	if (!connectableTile(sourceTile) || !connectableTile(targetTile)) return false;
	return Boolean(endpointKindForPair(sourceTile, targetTile));
}

function tileScreenRect(tile) {
	const z = viewportState.zoom;
	const px = viewportState.panX;
	const py = viewportState.panY;
	return {
		x: tile.x * z + px,
		y: tile.y * z + py,
		w: tile.width * z,
		h: tile.height * z,
	};
}

export function update() {
	if (!svgEl) return;
	svgEl.innerHTML = "";
	portsLayer.innerHTML = "";

	for (const connection of connections) {
		const srcTile = getTile(connection.sourceId);
		const tgtTile = getTile(connection.targetId);
		if (!srcTile || !tgtTile) continue;

		const src = tileScreenRect(srcTile);
		const tgt = tileScreenRect(tgtTile);
		const x1 = src.x + src.w + PORT_OFFSET;
		const y1 = src.y + src.h / 2;
		const x2 = tgt.x - PORT_OFFSET;
		const y2 = tgt.y + tgt.h / 2;
		const dx = Math.abs(x2 - x1) * 0.5;
		const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
		const color = colorForConnection(connection);
		const selected = selectedConnectionId === connection.id;

		const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
		path.setAttribute("d", d);
		path.setAttribute("fill", "none");
		path.setAttribute("stroke", color);
		path.setAttribute("stroke-width", selected ? "4" : "2.5");
		path.setAttribute("stroke-opacity", connection.active ? "0.95" : "0.6");
		path.setAttribute(
			"stroke-dasharray",
			connection.active ? "none" : "8 5",
		);
		svgEl.appendChild(path);

		const hitPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
		hitPath.setAttribute("d", d);
		hitPath.setAttribute("fill", "none");
		hitPath.setAttribute("stroke", "transparent");
		hitPath.setAttribute("stroke-width", "14");
		hitPath.style.pointerEvents = "stroke";
		hitPath.style.cursor = "pointer";
		hitPath.addEventListener("click", (event) => {
			event.preventDefault();
			event.stopPropagation();
			selectedConnectionId = selectedConnectionId === connection.id
				? null
				: connection.id;
			renderInspector();
			update();
		});
		hitPath.addEventListener("contextmenu", (event) => {
			event.preventDefault();
			event.stopPropagation();
			void showConnectionContextMenu(connection);
		});
		svgEl.appendChild(hitPath);

		renderTransportBadge(connection, (x1 + x2) / 2, (y1 + y2) / 2, selected);
	}

	renderPorts();

	if (pendingDrag) {
		renderPreview(pendingDrag);
	}
}

function colorForConnection(connection) {
	const runtime = runtimeByConnectionId.get(connection.id);
	if (runtime?.lastError || connection.lastError) return COLORS.error;
	if (!connection.active) return COLORS.paused;
	return COLORS[connection.transport] || COLORS["agent-channel"];
}

function renderTransportBadge(connection, x, y, selected) {
	const runtime = runtimeByConnectionId.get(connection.id);
	const label = `${connection.transport}`;
	const width = Math.max(112, 18 + label.length * 6.4);
	const height = 22;

	const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
	const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
	rect.setAttribute("x", `${x - width / 2}`);
	rect.setAttribute("y", `${y - height / 2}`);
	rect.setAttribute("width", `${width}`);
	rect.setAttribute("height", `${height}`);
	rect.setAttribute("rx", "11");
	rect.setAttribute("fill", selected ? "rgba(15,23,42,0.98)" : "rgba(15,23,42,0.88)");
	rect.setAttribute("stroke", colorForConnection(connection));
	rect.setAttribute("stroke-width", selected ? "1.8" : "1.2");
	group.appendChild(rect);

	const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
	text.setAttribute("x", `${x}`);
	text.setAttribute("y", `${y + 4}`);
	text.setAttribute("fill", "#f8fafc");
	text.setAttribute("font-size", "10");
	text.setAttribute("font-weight", "600");
	text.setAttribute("text-anchor", "middle");
	text.textContent = label;
	group.appendChild(text);

	if ((runtime?.pendingCount ?? 0) > 0) {
		const counter = document.createElementNS("http://www.w3.org/2000/svg", "text");
		counter.setAttribute("x", `${x + width / 2 - 16}`);
		counter.setAttribute("y", `${y + 4}`);
		counter.setAttribute("fill", "#fbbf24");
		counter.setAttribute("font-size", "10");
		counter.setAttribute("font-weight", "700");
		counter.textContent = `${runtime.pendingCount}`;
		group.appendChild(counter);
	}

	svgEl.appendChild(group);
}

function renderPorts() {
	for (const tile of tileManager.getTileDOMs().keys()) {
		const model = getTile(tile);
		if (!connectableTile(model)) continue;
		const rect = tileScreenRect(model);

		portsLayer.appendChild(
			createPort(
				rect.x + rect.w + PORT_OFFSET,
				rect.y + rect.h / 2,
				"out",
				model.id,
			),
		);
		portsLayer.appendChild(
			createPort(
				rect.x - PORT_OFFSET,
				rect.y + rect.h / 2,
				"in",
				model.id,
			),
		);
	}
}

function createPort(cx, cy, type, tileId) {
	const el = document.createElement("div");
	el.style.cssText = [
		"position: absolute",
		`left: ${cx - PORT_HIT_RADIUS}px`,
		`top: ${cy - PORT_HIT_RADIUS}px`,
		`width: ${PORT_HIT_RADIUS * 2}px`,
		`height: ${PORT_HIT_RADIUS * 2}px`,
		"pointer-events: auto",
		"cursor: crosshair",
		"display: flex",
		"align-items: center",
		"justify-content: center",
		"z-index: 16",
	].join(";");

	const dot = document.createElement("div");
	const validTarget = pendingDrag && type === "in"
		? canConnect(pendingDrag.sourceTileId, tileId)
		: null;
	dot.style.cssText = [
		`width: ${PORT_RADIUS * 2}px`,
		`height: ${PORT_RADIUS * 2}px`,
		"border-radius: 50%",
		`background: ${validTarget == null ? COLORS.port : validTarget ? COLORS.previewValid : COLORS.previewInvalid}`,
		"border: 2px solid white",
		`opacity: ${pendingDrag ? "0.95" : "0.35"}`,
		"transition: opacity 0.15s ease, transform 0.15s ease, background 0.15s ease",
		"box-shadow: 0 1px 4px rgba(0,0,0,0.35)",
	].join(";");
	el.appendChild(dot);

	el.addEventListener("mouseenter", () => {
		dot.style.opacity = "1";
		dot.style.transform = "scale(1.3)";
		if (pendingDrag && type === "in") {
			pendingDrag = hoverPendingDragTarget(
				pendingDrag,
				tileId,
				canConnect(pendingDrag.sourceTileId, tileId),
			);
			update();
		}
	});
	el.addEventListener("mouseleave", () => {
		if (!pendingDrag) {
			dot.style.opacity = "0.35";
			dot.style.transform = "scale(1)";
			return;
		}
		if (type === "in" && pendingDrag.targetTileId === tileId) {
			pendingDrag = clearPendingDragTarget(pendingDrag, tileId);
			update();
		}
	});

	if (type === "out") {
		el.addEventListener("mousedown", (event) => {
			event.preventDefault();
			event.stopPropagation();
			startDrag(tileId, cx, cy);
		});
	}

	if (type === "in") {
		el.addEventListener("mouseup", (event) => {
			event.preventDefault();
			event.stopPropagation();
			if (!pendingDrag) return;
			if (pendingDrag.sourceTileId === tileId) {
				cancelDrag();
				return;
			}
			void completeDrag(tileId);
		});
	}

	return el;
}

function startDrag(sourceTileId, startX, startY) {
	cancelDrag(false);
	clearOverlayError();
	pendingDrag = createPendingDragState(sourceTileId, startX, startY);

	const onMove = (event) => {
		if (!pendingDrag) return;
		const rect = svgEl.parentElement.getBoundingClientRect();
		pendingDrag = movePendingDrag(
			pendingDrag,
			event.clientX - rect.left,
			event.clientY - rect.top,
		);
		update();
	};

	const onUp = () => {
		document.removeEventListener("mousemove", onMove);
		document.removeEventListener("mouseup", onUp);
		if (pendingDrag && pendingDrag.state !== "snap-valid") {
			cancelDrag();
		}
	};

	document.addEventListener("mousemove", onMove);
	document.addEventListener("mouseup", onUp);
	update();
}

function cancelDrag(shouldUpdate = true) {
	pendingDrag = null;
	if (shouldUpdate) update();
}

async function completeDrag(targetTileId) {
	if (!pendingDrag) return;
	const sourceTileId = pendingDrag.sourceTileId;
	const sourceTile = getTile(sourceTileId);
	const targetTile = getTile(targetTileId);
	if (!sourceTile || !targetTile || !canConnect(sourceTileId, targetTileId)) {
		pendingDrag.state = "snap-invalid";
		update();
		setTimeout(() => cancelDrag(), 120);
		return;
	}
	const payload = {
		connectionId: generateConnectionId(),
		sourceTileId,
		targetTileId,
		transport: getDefaultTransport(sourceTile, targetTile),
		endpointKind: endpointKindForPair(sourceTile, targetTile),
	};
	cancelDrag();
	await runCanvasMutation("connectionCreate", payload);
	pushUndo({
		type: "create",
		connectionId: payload.connectionId,
	});
}

function renderPreview(drag) {
	const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
	line.setAttribute("x1", drag.startX);
	line.setAttribute("y1", drag.startY);
	line.setAttribute("x2", drag.currentX);
	line.setAttribute("y2", drag.currentY);
	line.setAttribute(
		"stroke",
		drag.state === "snap-invalid" ? COLORS.previewInvalid : COLORS.previewValid,
	);
	line.setAttribute("stroke-width", "2.5");
	line.setAttribute("stroke-dasharray", "8 5");
	line.setAttribute("stroke-opacity", "0.9");
	svgEl.appendChild(line);
}

function pushUndo(entry) {
	undoStack.push(entry);
	while (undoStack.length > MAX_UNDO) {
		undoStack.shift();
	}
}

async function applyUndo() {
	const entry = undoStack.pop();
	if (!entry) return;
	if (entry.type === "create") {
		await runCanvasMutation("connectionRemove", {
			connectionId: entry.connectionId,
		});
		return;
	}
	if (entry.type === "delete") {
		await runCanvasMutation("connectionCreate", entry.payload);
		return;
	}
	if (entry.type === "toggle") {
		await runCanvasMutation("connectionToggle", {
			connectionId: entry.connectionId,
		});
		return;
	}
	if (entry.type === "transport") {
		await runCanvasMutation("connectionSetTransport", {
			connectionId: entry.connectionId,
			transport: entry.previousTransport,
		});
	}
}

async function showConnectionContextMenu(connection) {
	const sourceTile = getTile(connection.sourceId);
	const targetTile = getTile(connection.targetId);
	const termToTerm = sourceTile?.type === "term" && targetTile?.type === "term";
	const items = [
		{
			id: "toggle",
			label: connection.active ? "Pause connection" : "Resume connection",
		},
		{ id: "separator", label: "" },
		{
			id: "transport-agent",
			label: `${connection.transport === "agent-channel" ? "\u2713 " : ""}Transport: Agent channel`,
			enabled: termToTerm,
		},
		{
			id: "transport-baton",
			label: `${connection.transport === "pty-baton" ? "\u2713 " : ""}Transport: PTY baton`,
			enabled: termToTerm,
		},
		{
			id: "transport-generic",
			label: `${connection.transport === "pty-generic" ? "\u2713 " : ""}Transport: PTY generic`,
			enabled: termToTerm,
		},
		{ id: "separator", label: "" },
		{ id: "delete", label: "Delete connection" },
	];
	const choice = await window.shellApi.showContextMenu(items);
	if (!choice) return;

	if (choice === "toggle") {
		await runCanvasMutation("connectionToggle", {
			connectionId: connection.id,
		});
		pushUndo({ type: "toggle", connectionId: connection.id });
		return;
	}
	if (choice === "delete") {
		await runCanvasMutation("connectionRemove", {
			connectionId: connection.id,
		});
		pushUndo({
			type: "delete",
			payload: {
				connectionId: connection.id,
				sourceTileId: connection.sourceId,
				targetTileId: connection.targetId,
				transport: connection.transport,
				endpointKind: connection.endpointKind,
			},
		});
		return;
	}
	if (choice.startsWith("transport-")) {
		const nextTransport = choice.replace("transport-", "");
		const transport =
			nextTransport === "agent"
				? "agent-channel"
				: nextTransport === "baton"
					? "pty-baton"
					: "pty-generic";
		await runCanvasMutation("connectionSetTransport", {
			connectionId: connection.id,
			transport,
		});
		pushUndo({
			type: "transport",
			connectionId: connection.id,
			previousTransport: connection.transport,
		});
	}
}

export async function refreshRuntimeTelemetry() {
	try {
		runtimeByConnectionId.clear();
		const [channelRuntime, ptyRuntime] = await Promise.all([
			window.shellApi.canvasConnectionRuntimeList?.() ?? [],
			ptyStringLinkListFromMain(),
		]);
		for (const entry of channelRuntime) {
			runtimeByConnectionId.set(entry.connectionId, entry);
		}
		for (const entry of ptyRuntime) {
			runtimeByConnectionId.set(entry.id, {
				...(runtimeByConnectionId.get(entry.id) || {}),
				connectionId: entry.id,
				lastThreadPreview: entry.lastPayload,
				lastError: entry.lastError,
				lastErrorAt: entry.lastForwardedAt,
			});
		}
		renderInspector();
		update();
	} catch {
		// Best effort only.
	}
}

function renderInspector() {
	if (!selectedConnectionId) {
		hideInspector();
		return;
	}
	const connection = getConnection(selectedConnectionId);
	if (!connection) {
		selectedConnectionId = null;
		hideInspector();
		return;
	}
	const runtime = runtimeByConnectionId.get(connection.id);
	const sourceTile = getTile(connection.sourceId);
	const targetTile = getTile(connection.targetId);

	inspectorEl.innerHTML = [
		`<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px;">`,
		`<div>`,
		`<div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;">connection</div>`,
		`<div style="font-size:16px;font-weight:700;color:#f8fafc;">${escapeHtml(connection.transport)}</div>`,
		`</div>`,
		`<button data-dismiss style="border:none;background:transparent;color:#94a3b8;cursor:pointer;font-size:16px;line-height:1;">x</button>`,
		`</div>`,
		`<div style="display:grid;grid-template-columns:96px 1fr;gap:6px 10px;margin-bottom:12px;">`,
		row("Source", sourceTile ? tileLabel(sourceTile) : connection.sourceId),
		row("Target", targetTile ? tileLabel(targetTile) : connection.targetId),
		row("Transport", connection.transport),
		row("Endpoint", connection.endpointKind),
		row("Pending", `${runtime?.pendingCount ?? 0}`),
		row("Last thread", runtime?.lastThreadPreview || "None"),
		row("Error", runtime?.lastError || connection.lastError || "None"),
		row("Canvas error", overlayError ? `${overlayError.code}: ${overlayError.message}` : "None"),
		`</div>`,
		`<div style="color:#94a3b8;">Connections are persisted graph state. Agent-channel is semantic request/reply. PTY transports remain legacy compatibility modes.</div>`,
	].join("");

	const dismiss = inspectorEl.querySelector("[data-dismiss]");
	dismiss?.addEventListener("click", () => {
		selectedConnectionId = null;
		hideInspector();
		update();
	}, { once: true });

	inspectorEl.style.display = "block";
}

function row(label, value) {
	return [
		`<div style="color:#94a3b8;">${escapeHtml(label)}</div>`,
		`<div style="color:#e5e7eb;word-break:break-word;">${escapeHtml(value)}</div>`,
	].join("");
}

function hideInspector() {
	inspectorEl.style.display = "none";
	inspectorEl.innerHTML = "";
}

function tileLabel(tile) {
	return tile.userTitle || tile.autoTitle || tile.id;
}

function escapeHtml(value) {
	return String(value)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll("\"", "&quot;");
}

function destroy() {
	document.removeEventListener("keydown", onKeyDown);
	svgEl?.remove();
	portsLayer?.remove();
	inspectorEl?.remove();
	statusEl?.remove();
}
