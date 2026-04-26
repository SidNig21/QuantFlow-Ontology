import { strings, getTile, removeString, toggleString } from "./canvas-state.js";
import {
	ptyStringLinkListFromMain,
	ptyStringLinkRemoveFromMain,
	ptyStringLinkSetActiveOnMain,
	ptyStringLinkSetFilterOnMain,
	ptyStringLinkSetModeOnMain,
} from "./string-link-main-sync.js";

const GENERIC_ACTIVE_COLOR = "#6d28d9";
const BATON_ACTIVE_COLOR = "#d97706";
const PAUSED_COLOR = "#6b7280";
const ERROR_COLOR = "#dc2626";
const INFO_COLOR = "#0f766e";
const WARNING_COLOR = "#b45309";
const PORT_RADIUS = 7;
const PORT_HIT_RADIUS = 14;
const PORT_OFFSET = 16;
const PULSE_DURATION_MS = 600;
const BATON_STALE_MS = 5 * 60 * 1000;

let svgEl = null;
let portsLayer = null;
let inspectorEl = null;
let viewportState = null;
let tileManager = null;
let pendingDrag = null;
let onStringCreated = null;
let selectedStringId = null;

const pulsingStrings = new Map();
const runtimeByStringId = new Map();

export function createStringOverlay({
	panelViewer,
	viewportState: vs,
	tileManager: tm,
	onStringCreated: cb,
}) {
	viewportState = vs;
	tileManager = tm;
	onStringCreated = cb;

	svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	svgEl.id = "string-overlay";
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
	portsLayer.id = "string-ports-layer";
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
	inspectorEl.id = "string-inspector";
	inspectorEl.style.cssText = [
		"position: absolute",
		"top: 18px",
		"right: 18px",
		"width: 320px",
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
		"z-index: 20",
		"display: none",
		"pointer-events: auto",
	].join(";");
	panelViewer.appendChild(inspectorEl);

	return {
		update,
		flashString,
		destroy,
		recordRuntimeTelemetry,
		refreshRuntimeTelemetry,
	};
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

	const tileDOMs = tileManager.getTileDOMs();

	for (const s of strings) {
		const srcTile = getTile(s.sourceId);
		const tgtTile = getTile(s.targetId);
		if (!srcTile || !tgtTile) continue;

		const runtime = getStringRuntime(s);
		const state = deriveStringState(s, runtime, srcTile, tgtTile);
		const src = tileScreenRect(srcTile);
		const tgt = tileScreenRect(tgtTile);

		const x1 = src.x + src.w + PORT_OFFSET;
		const y1 = src.y + src.h / 2;
		const x2 = tgt.x - PORT_OFFSET;
		const y2 = tgt.y + tgt.h / 2;

		const dx = Math.abs(x2 - x1) * 0.5;
		const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

		const color = getStringColor(s, state);
		const isPulsing = pulsingStrings.has(s.id);
		const isSelected = s.id === selectedStringId;

		const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
		path.setAttribute("d", d);
		path.setAttribute("fill", "none");
		path.setAttribute("stroke", color);
		path.setAttribute("stroke-width", isSelected ? "4" : (isPulsing ? "3" : "2"));
		path.setAttribute("stroke-dasharray", s.active ? "none" : "6 4");
		path.setAttribute("stroke-opacity", isSelected ? "1" : (isPulsing ? "1" : "0.82"));
		svgEl.appendChild(path);

		const hitPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
		hitPath.setAttribute("d", d);
		hitPath.setAttribute("fill", "none");
		hitPath.setAttribute("stroke", "transparent");
		hitPath.setAttribute("stroke-width", "14");
		hitPath.style.pointerEvents = "stroke";
		hitPath.style.cursor = "pointer";
		hitPath.addEventListener("contextmenu", (e) => {
			e.preventDefault();
			e.stopPropagation();
			showStringContextMenu(s);
		});
		hitPath.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopPropagation();
			selectedStringId = selectedStringId === s.id ? null : s.id;
			renderInspector();
			update();
		});
		svgEl.appendChild(hitPath);

		if (s.mode === "baton") {
			renderBatonBadge({
				x: (x1 + x2) / 2,
				y: (y1 + y2) / 2,
				state,
				runtime,
				selected: isSelected,
			});
		}

		if (isPulsing) {
			const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
			circle.setAttribute("r", "4");
			circle.setAttribute("fill", color);

			const anim = document.createElementNS("http://www.w3.org/2000/svg", "animateMotion");
			anim.setAttribute("dur", "0.8s");
			anim.setAttribute("repeatCount", "1");
			anim.setAttribute("path", d);
			anim.addEventListener("endEvent", () => {
				circle.remove();
			});
			circle.appendChild(anim);
			svgEl.appendChild(circle);
		}
	}

	renderPorts(tileDOMs);

	if (pendingDrag) {
		renderDragLine(pendingDrag);
	}
}

function renderBatonBadge({ x, y, state, runtime, selected }) {
	const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
	const label = `BATON ${formatStateLabel(state)}`;
	const width = Math.max(108, 18 + label.length * 6.2);
	const height = 22;

	const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
	rect.setAttribute("x", `${x - width / 2}`);
	rect.setAttribute("y", `${y - height / 2}`);
	rect.setAttribute("width", `${width}`);
	rect.setAttribute("height", `${height}`);
	rect.setAttribute("rx", "11");
	rect.setAttribute("fill", selected ? "rgba(15, 23, 42, 0.98)" : "rgba(15, 23, 42, 0.88)");
	rect.setAttribute("stroke", getBadgeColor(state));
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

	if (runtime.duplicateSuppressions > 0) {
		const counter = document.createElementNS("http://www.w3.org/2000/svg", "text");
		counter.setAttribute("x", `${x + width / 2 - 18}`);
		counter.setAttribute("y", `${y + 4}`);
		counter.setAttribute("fill", "#fbbf24");
		counter.setAttribute("font-size", "10");
		counter.setAttribute("font-weight", "700");
		counter.textContent = `x${runtime.duplicateSuppressions}`;
		group.appendChild(counter);
	}

	svgEl.appendChild(group);
}

function renderPorts(tileDOMs) {
	for (const tile of [...tileDOMs.keys()].map(getTile).filter(Boolean)) {
		if (tile.type !== "term") continue;

		const rect = tileScreenRect(tile);

		const outPort = createPortCircle(
			rect.x + rect.w + PORT_OFFSET,
			rect.y + rect.h / 2,
			"out",
			tile.id,
		);
		portsLayer.appendChild(outPort);

		const inPort = createPortCircle(
			rect.x - PORT_OFFSET,
			rect.y + rect.h / 2,
			"in",
			tile.id,
		);
		portsLayer.appendChild(inPort);
	}
}

function createPortCircle(cx, cy, type, tileId) {
	const el = document.createElement("div");
	el.className = `string-port string-port-${type}`;
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
	dot.style.cssText = [
		`width: ${PORT_RADIUS * 2}px`,
		`height: ${PORT_RADIUS * 2}px`,
		"border-radius: 50%",
		`background: ${type === "out" ? BATON_ACTIVE_COLOR : "#3b82f6"}`,
		"border: 2px solid white",
		"opacity: 0.35",
		"transition: opacity 0.15s ease, transform 0.15s ease",
		"box-shadow: 0 1px 4px rgba(0,0,0,0.35)",
	].join(";");
	el.appendChild(dot);

	el.addEventListener("mouseenter", () => {
		dot.style.opacity = "1";
		dot.style.transform = "scale(1.3)";
	});
	el.addEventListener("mouseleave", () => {
		if (!pendingDrag) {
			dot.style.opacity = "0.35";
			dot.style.transform = "scale(1)";
		}
	});

	if (type === "out") {
		el.addEventListener("mousedown", (e) => {
			e.preventDefault();
			e.stopPropagation();
			startDrag(tileId, cx, cy);
		});
	}

	if (type === "in") {
		el.addEventListener("mouseup", (e) => {
			e.preventDefault();
			e.stopPropagation();
			if (pendingDrag && pendingDrag.sourceTileId !== tileId) {
				completeDrag(tileId);
			}
		});
	}

	return el;
}

function startDrag(sourceTileId, startX, startY) {
	pendingDrag = {
		sourceTileId,
		startX,
		startY,
		currentX: startX,
		currentY: startY,
	};

	const onMove = (e) => {
		if (!pendingDrag) return;
		const rect = svgEl.parentElement.getBoundingClientRect();
		pendingDrag.currentX = e.clientX - rect.left;
		pendingDrag.currentY = e.clientY - rect.top;
		update();
	};

	const onUp = () => {
		document.removeEventListener("mousemove", onMove);
		document.removeEventListener("mouseup", onUp);
		pendingDrag = null;
		update();
	};

	document.addEventListener("mousemove", onMove);
	document.addEventListener("mouseup", onUp);
	update();
}

function completeDrag(targetTileId) {
	if (!pendingDrag) return;
	const sourceTileId = pendingDrag.sourceTileId;
	pendingDrag = null;

	if (onStringCreated) {
		onStringCreated(sourceTileId, targetTileId);
	}
}

function renderDragLine(drag) {
	const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
	line.setAttribute("x1", drag.startX);
	line.setAttribute("y1", drag.startY);
	line.setAttribute("x2", drag.currentX);
	line.setAttribute("y2", drag.currentY);
	line.setAttribute("stroke", BATON_ACTIVE_COLOR);
	line.setAttribute("stroke-width", "2");
	line.setAttribute("stroke-dasharray", "6 3");
	line.setAttribute("stroke-opacity", "0.8");
	svgEl.appendChild(line);
}

export function flashString(stringId) {
	if (pulsingStrings.has(stringId)) {
		clearTimeout(pulsingStrings.get(stringId));
	}
	pulsingStrings.set(
		stringId,
		setTimeout(() => {
			pulsingStrings.delete(stringId);
			update();
		}, PULSE_DURATION_MS),
	);
	update();
}

export function recordRuntimeTelemetry(payload) {
	const current = runtimeByStringId.get(payload.stringId) || {};
	runtimeByStringId.set(payload.stringId, {
		...current,
		...payload,
	});
	renderInspector();
	update();
}

export async function refreshRuntimeTelemetry() {
	try {
		const links = await ptyStringLinkListFromMain();
		runtimeByStringId.clear();
		for (const link of links) {
			runtimeByStringId.set(link.id, link);
		}
		renderInspector();
		update();
	} catch {
		// Best effort only. Shell state still renders links even if runtime telemetry is unavailable.
	}
}

function renderInspector() {
	if (!inspectorEl) return;
	if (!selectedStringId) {
		hideInspector();
		return;
	}

	const stringLink = strings.find((s) => s.id === selectedStringId);
	if (!stringLink) {
		selectedStringId = null;
		hideInspector();
		return;
	}

	const srcTile = getTile(stringLink.sourceId);
	const tgtTile = getTile(stringLink.targetId);
	const runtime = getStringRuntime(stringLink);
	const state = deriveStringState(stringLink, runtime, srcTile, tgtTile);
	const warnings = buildWarningLines(stringLink, runtime, srcTile, tgtTile);

	inspectorEl.innerHTML = [
		`<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px;">`,
		`<div>`,
		`<div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;">${escapeHtml(stringLink.mode || "generic")} string</div>`,
		`<div style="font-size:16px;font-weight:700;color:#f8fafc;">${escapeHtml(formatStateLabel(state))}</div>`,
		`</div>`,
		`<button data-dismiss style="border:none;background:transparent;color:#94a3b8;cursor:pointer;font-size:16px;line-height:1;">x</button>`,
		`</div>`,
		`<div style="display:grid;grid-template-columns:88px 1fr;gap:6px 10px;margin-bottom:12px;">`,
		renderInspectorRow("Source", tileLabel(srcTile, stringLink.sourceId)),
		renderInspectorRow("Target", tileLabel(tgtTile, stringLink.targetId)),
		renderInspectorRow("Mode", stringLink.mode || "generic"),
		renderInspectorRow("Filter", stringLink.filter),
		renderInspectorRow("Last payload", runtime.lastPayload || "No baton delivered yet"),
		renderInspectorRow("Last delivery", formatTimestamp(runtime.lastForwardedAt)),
		renderInspectorRow("Duplicates", `${runtime.duplicateSuppressions || 0}`),
		renderInspectorRow("Error", runtime.lastError || "None"),
		`</div>`,
		warnings.length > 0
			? `<div style="margin-bottom:10px;padding:10px;border-radius:10px;background:rgba(217,119,6,0.12);border:1px solid rgba(245,158,11,0.28);">${warnings.map((warning) => `<div style=\"margin-bottom:4px;color:#fde68a;\">${escapeHtml(warning)}</div>`).join("")}</div>`
			: "",
		`<div style="color:#94a3b8;">Baton edges forward one completed framed payload as one target submit and keep duplicate suppression telemetry per link.</div>`,
	].join("");

	const dismiss = inspectorEl.querySelector("[data-dismiss]");
	dismiss?.addEventListener("click", () => {
		selectedStringId = null;
		hideInspector();
		update();
	}, { once: true });

	inspectorEl.style.display = "block";
}

function renderInspectorRow(label, value) {
	return [
		`<div style="color:#94a3b8;">${escapeHtml(label)}</div>`,
		`<div style="color:#e5e7eb;word-break:break-word;">${escapeHtml(value)}</div>`,
	].join("");
}

function hideInspector() {
	if (!inspectorEl) return;
	inspectorEl.style.display = "none";
	inspectorEl.innerHTML = "";
}

function getStringRuntime(stringLink) {
	return {
		mode: stringLink.mode || "generic",
		deliveryState: "idle",
		lastPayload: null,
		lastForwardedAt: null,
		duplicateSuppressions: 0,
		lastError: null,
		...runtimeByStringId.get(stringLink.id),
	};
}

function deriveStringState(stringLink, runtime, srcTile, tgtTile) {
	if (!stringLink.active) return "paused";
	if (!srcTile?.ptySessionId || !tgtTile?.ptySessionId) return "missing-pty";
	if (runtime.lastError) return "error";
	if (
		stringLink.mode === "baton"
		&& runtime.lastForwardedAt
		&& Date.now() - runtime.lastForwardedAt > BATON_STALE_MS
	) {
		return "stale";
	}
	return runtime.deliveryState || "idle";
}

function buildWarningLines(stringLink, runtime, srcTile, tgtTile) {
	const warnings = [];
	if (!stringLink.active) warnings.push("This string is paused.");
	if (!srcTile?.ptySessionId || !tgtTile?.ptySessionId) {
		warnings.push("One side of the string does not currently have an active PTY session.");
	}
	if (runtime.duplicateSuppressions > 0) {
		warnings.push("Recent identical payloads were suppressed on this link.");
	}
	if (runtime.lastError) warnings.push(runtime.lastError);
	if (
		stringLink.mode === "baton"
		&& runtime.lastForwardedAt
		&& Date.now() - runtime.lastForwardedAt > BATON_STALE_MS
	) {
		warnings.push("This baton link has gone stale since the last delivery.");
	}
	return warnings;
}

function getStringColor(stringLink, state) {
	if (state === "error") return ERROR_COLOR;
	if (state === "stale" || state === "duplicate-suppressed") return WARNING_COLOR;
	if (!stringLink.active) return PAUSED_COLOR;
	return stringLink.mode === "baton" ? BATON_ACTIVE_COLOR : GENERIC_ACTIVE_COLOR;
}

function getBadgeColor(state) {
	switch (state) {
		case "delivered":
			return INFO_COLOR;
		case "duplicate-suppressed":
		case "stale":
			return WARNING_COLOR;
		case "error":
			return ERROR_COLOR;
		case "paused":
		case "missing-pty":
			return PAUSED_COLOR;
		default:
			return "#64748b";
	}
}

function formatStateLabel(state) {
	switch (state) {
		case "duplicate-suppressed":
			return "duplicate-suppressed";
		case "missing-pty":
			return "missing PTY";
		default:
			return state;
	}
}

function formatTimestamp(ts) {
	if (!ts) return "Never";
	return new Date(ts).toLocaleTimeString([], {
		hour: "numeric",
		minute: "2-digit",
		second: "2-digit",
	});
}

function tileLabel(tile, fallbackId) {
	if (!tile) return fallbackId;
	return tile.userTitle || tile.autoTitle || tile.id;
}

function escapeHtml(value) {
	return String(value)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll("\"", "&quot;");
}

async function showStringContextMenu(stringLink) {
	const items = [
		{
			id: "toggle",
			label: stringLink.active ? "Pause string" : "Resume string",
		},
		{ id: "separator", label: "" },
		{
			id: "mode-generic",
			label: `${stringLink.mode !== "baton" ? "\u2713 " : ""}Mode: Generic`,
		},
		{
			id: "mode-baton",
			label: `${stringLink.mode === "baton" ? "\u2713 " : ""}Mode: Baton`,
		},
		{ id: "separator", label: "" },
	];

	if (stringLink.mode === "baton") {
		items.push({
			id: "filter-framed-locked",
			label: "\u2713 Filter: Framed (required)",
			enabled: false,
		});
	} else {
		items.push(
			{
				id: "filter-none",
				label: `${stringLink.filter === "none" ? "\u2713 " : ""}Filter: None (raw)`,
			},
			{
				id: "filter-ansi-strip",
				label: `${stringLink.filter === "ansi-strip" ? "\u2713 " : ""}Filter: ANSI strip`,
			},
			{
				id: "filter-framed",
				label: `${stringLink.filter === "framed" ? "\u2713 " : ""}Filter: Framed`,
			},
		);
	}

	items.push(
		{ id: "separator", label: "" },
		{ id: "delete", label: "Delete string" },
	);

	const chosen = await window.shellApi.showContextMenu(items);
	if (!chosen) return;

	switch (chosen) {
		case "toggle": {
			const t = toggleString(stringLink.id);
			if (t) {
				await ptyStringLinkSetActiveOnMain(stringLink.id, t.active);
			}
			tileManager.saveCanvasImmediate();
			break;
		}
		case "mode-generic":
			stringLink.mode = "generic";
			await ptyStringLinkSetModeOnMain(stringLink.id, "generic");
			tileManager.saveCanvasImmediate();
			break;
		case "mode-baton":
			stringLink.mode = "baton";
			stringLink.filter = "framed";
			await ptyStringLinkSetModeOnMain(stringLink.id, "baton");
			tileManager.saveCanvasImmediate();
			break;
		case "delete":
			removeString(stringLink.id);
			if (selectedStringId === stringLink.id) {
				selectedStringId = null;
			}
			await ptyStringLinkRemoveFromMain(stringLink.id);
			tileManager.saveCanvasImmediate();
			break;
		case "filter-none":
			stringLink.filter = "none";
			await ptyStringLinkSetFilterOnMain(stringLink.id, "none");
			tileManager.saveCanvasImmediate();
			break;
		case "filter-ansi-strip":
			stringLink.filter = "ansi-strip";
			await ptyStringLinkSetFilterOnMain(stringLink.id, "ansi-strip");
			tileManager.saveCanvasImmediate();
			break;
		case "filter-framed":
			stringLink.filter = "framed";
			await ptyStringLinkSetFilterOnMain(stringLink.id, "framed");
			tileManager.saveCanvasImmediate();
			break;
	}

	window.dispatchEvent(new CustomEvent("strings-changed"));
	void refreshRuntimeTelemetry();
	update();
}

function destroy() {
	svgEl?.remove();
	portsLayer?.remove();
	inspectorEl?.remove();
	for (const timer of pulsingStrings.values()) {
		clearTimeout(timer);
	}
	pulsingStrings.clear();
	runtimeByStringId.clear();
}
