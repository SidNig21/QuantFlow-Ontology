// flow-cube-watermark.js  (v2 — adaptive empty-state)
//
// QuantFlow brand watermark for the shell canvas field floor. A corner-on
// wireframe cube spun about its body diagonal, live nodes routing its edge
// loop ("Pulse Swarm"), QUANTFLOW wordmark beneath.
//
// WHAT'S NEW vs v1: the mark is now an ADAPTIVE EMPTY-STATE, not a flat
// watermark. It reads boldly when the canvas is empty and smoothly recedes to
// a quiet ~16% watermark once tiles exist — so it never competes with work.
// Contrast lives in the front edges + saturated nodes (form, not fog), and a
// soft radial scrim lifts it off the field gradient when bold.
//
// TARGET: src/windows/shell/src/flow-cube-watermark.js  (replace v1)
//
// Usage (in renderer.js) — ONE extra arg vs before:
//   import { createFlowCubeWatermark } from "./flow-cube-watermark.js";
//   const viewport = createViewport(canvasEl, gridCanvas, tiles);
//   createFlowCubeWatermark(document.getElementById("canvas-watermark"), {
//     getTileCount: () => tiles.length,   // ← drives the bold↔faded blend
//   });
//
// No other wiring needed: getTileCount is read each frame, so adding/removing
// tiles cross-fades the mark automatically. Returns a disposer.

const SVG_NS = "http://www.w3.org/2000/svg";

const CUBE_V = [
	[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
	[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
];
const CUBE_E = [
	[0, 1], [1, 2], [2, 3], [3, 0],
	[4, 5], [5, 6], [6, 7], [7, 4],
	[0, 4], [1, 5], [2, 6], [3, 7],
];
const FLOOP = [0, 1, 2, 3, 7, 6, 5, 4];
const SPECTRUM = ["#B7FF00", "#2fe6cf", "#c79bff"]; // green primary; nodes={1}→set all to #B7FF00

function rotX(a) { const c = Math.cos(a), s = Math.sin(a); return [[1, 0, 0], [0, c, -s], [0, s, c]]; }
function rotY(a) { const c = Math.cos(a), s = Math.sin(a); return [[c, 0, s], [0, 1, 0], [-s, 0, c]]; }
function rotZ(a) { const c = Math.cos(a), s = Math.sin(a); return [[c, -s, 0], [s, c, 0], [0, 0, 1]]; }
function mul(m, n) {
	const r = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
	for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { let s = 0; for (let k = 0; k < 3; k++) s += m[i][k] * n[k][j]; r[i][j] = s; }
	return r;
}
function apply(m, v) {
	return [
		m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
		m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
		m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
	];
}
function axisAngle(ax, ang) {
	const L = Math.hypot(ax[0], ax[1], ax[2]) || 1;
	const x = ax[0] / L, y = ax[1] / L, z = ax[2] / L;
	const c = Math.cos(ang), s = Math.sin(ang), t = 1 - c;
	return [
		[t * x * x + c, t * x * y - s * z, t * x * z + s * y],
		[t * x * y + s * z, t * y * y + c, t * y * z - s * x],
		[t * x * z - s * y, t * y * z + s * x, t * z * z + c],
	];
}
const VIEW = mul(rotY(-Math.PI / 2), mul(rotZ(-Math.atan(1 / Math.SQRT2)), rotY(Math.PI / 4)));
const DIAG = [1, 1, 1];
function transform(spin, tilt, tiltZ) {
	let view = mul(rotX(tilt), VIEW);
	if (tiltZ) view = mul(rotZ(tiltZ), view);
	return mul(view, axisAngle(DIAG, spin));
}
const depthOf = (z) => (z + 1.6) / 3.2;
const lerp = (a, b, t) => a + (b - a) * t;

export function createFlowCubeWatermark(container, opts = {}) {
	if (!container) return () => {};
	const W = 1600, H = 1000, cx = 800, cy = 432, scale = 184;
	const INK = opts.ink || "#f2f0ec";
	const getTileCount = opts.getTileCount || (() => 0);
	const reduce = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

	// drive the whole mark's presence ourselves — override any static opacity.
	container.style.opacity = "1";

	const stage = document.createElementNS(SVG_NS, "svg");
	stage.setAttribute("viewBox", `0 0 ${W} ${H}`);
	stage.setAttribute("preserveAspectRatio", "xMidYMid meet");
	stage.setAttribute("width", "100%");
	stage.setAttribute("height", "100%");
	stage.style.overflow = "visible";
	stage.style.display = "block";

	// scrim "pocket" — radial gradient ellipse behind the cube (bold only)
	const defs = stage.appendChild(document.createElementNS(SVG_NS, "defs"));
	const rg = defs.appendChild(document.createElementNS(SVG_NS, "radialGradient"));
	rg.id = "qf-wm-scrim";
	[["0%", "rgba(8,10,15,0.9)"], ["55%", "rgba(8,10,15,0.45)"], ["80%", "rgba(8,10,15,0)"]].forEach(([o, c]) => {
		const s = rg.appendChild(document.createElementNS(SVG_NS, "stop"));
		s.setAttribute("offset", o); s.setAttribute("stop-color", c);
	});
	const scrim = stage.appendChild(document.createElementNS(SVG_NS, "ellipse"));
	scrim.setAttribute("cx", cx); scrim.setAttribute("cy", cy);
	scrim.setAttribute("rx", 520); scrim.setAttribute("ry", 430);
	scrim.setAttribute("fill", "url(#qf-wm-scrim)");

	const mk = () => stage.appendChild(document.createElementNS(SVG_NS, "line"));
	const edges = CUBE_E.map(() => { const l = mk(); l.setAttribute("stroke-linecap", "round"); return l; });
	const halos = [0, 1, 2].map(() => { const c = stage.appendChild(document.createElementNS(SVG_NS, "circle")); c.setAttribute("opacity", "0"); return c; });
	const cores = [0, 1, 2].map(() => { const c = stage.appendChild(document.createElementNS(SVG_NS, "circle")); return c; });

	const fo = stage.appendChild(document.createElementNS(SVG_NS, "foreignObject"));
	fo.setAttribute("x", "0"); fo.setAttribute("y", "690");
	fo.setAttribute("width", String(W)); fo.setAttribute("height", "200");
	const wmWrap = document.createElement("div");
	wmWrap.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
	wmWrap.style.cssText = "display:flex;flex-direction:column;align-items:center;gap:13px;font-family:'Space Grotesk',system-ui,sans-serif;";
	const wmText = document.createElement("div");
	wmText.textContent = "QuantFlow";
	wmText.style.cssText = "font-weight:600;color:#fbfaf7;text-transform:uppercase;letter-spacing:.44em;padding-left:.44em;";
	const wmUnder = document.createElement("div");
	wmUnder.style.cssText = "height:3px;border-radius:2px;background:#B7FF00;";
	wmWrap.appendChild(wmText); wmWrap.appendChild(wmUnder);
	fo.appendChild(wmWrap);

	container.appendChild(stage);

	// presence: 1 = bold (empty canvas), 0 = faded (tiles present). Lerped for cross-fade.
	let present = getTileCount() > 0 ? 0 : 1;

	function draw(t) {
		// ease presence toward target
		const target = getTileCount() > 0 ? 0 : 1;
		present += (target - present) * 0.06;
		const p = present;

		// global alpha: bold→1, faded→0.16
		container.style.opacity = lerp(0.16, 1, p).toFixed(3);
		scrim.setAttribute("opacity", (p * 0.85).toFixed(3));

		// wordmark scales + brightens with presence
		wmText.style.fontSize = lerp(40, 58, p).toFixed(1) + "px";
		wmText.style.color = p > 0.5 ? "#fbfaf7" : INK;
		wmText.style.textShadow = `0 0 ${(p * 26).toFixed(0)}px rgba(0,0,0,.6)`;
		wmUnder.style.width = lerp(280, 380, p).toFixed(0) + "px";
		wmUnder.style.boxShadow = `0 0 ${(8 + p * 18).toFixed(0)}px rgba(183,255,0,${(0.3 + p * 0.35).toFixed(2)})`;

		const m = transform(t * 0.46, 0.17 + Math.sin(t * 0.3) * 0.04, Math.cos(t * 0.22) * 0.04);
		const pts = CUBE_V.map((v) => { const r = apply(m, v); return { x: cx + r[0] * scale, y: cy - r[1] * scale, z: r[2] }; });
		let bi = 0; for (let i = 1; i < 8; i++) if (pts[i].z < pts[bi].z) bi = i;

		// edges: form contrast — front bright, back dim (independent of presence;
		// presence is handled by container alpha so the *shape* stays legible).
		CUBE_E.forEach((ev, i) => {
			const A = pts[ev[0]], B = pts[ev[1]], mz = (A.z + B.z) / 2, d = depthOf(mz);
			const hidden = ev[0] === bi || ev[1] === bi;
			const l = edges[i];
			l.setAttribute("x1", A.x.toFixed(2)); l.setAttribute("y1", A.y.toFixed(2));
			l.setAttribute("x2", B.x.toFixed(2)); l.setAttribute("y2", B.y.toFixed(2));
			l.setAttribute("stroke", INK);
			l.setAttribute("stroke-dasharray", "7 9");
			l.setAttribute("stroke-dashoffset", (-t * 22).toFixed(1));
			l.setAttribute("stroke-width", (1.4 + d * 1.9).toFixed(2));
			l.setAttribute("opacity", (hidden ? 0.24 : (0.45 + d * 0.5)).toFixed(2));
		});

		// nodes: saturated, sized up slightly with presence
		const scl = lerp(0.95, 1.35, p);
		for (let n = 0; n < 3; n++) {
			const pn = t * 1.15 + n * (8 / 3);
			const f = ((pn / 8) % 1 + 1) % 1 * FLOOP.length;
			const ii = Math.floor(f), frac = f - ii;
			const A = pts[FLOOP[ii % FLOOP.length]], B = pts[FLOOP[(ii + 1) % FLOOP.length]];
			const x = A.x + (B.x - A.x) * frac, y = A.y + (B.y - A.y) * frac, z = A.z + (B.z - A.z) * frac;
			const d = depthOf(z), r = (4.5 + d * 5.5) * scl, col = SPECTRUM[n];
			const core = cores[n], halo = halos[n];
			core.setAttribute("cx", x.toFixed(2)); core.setAttribute("cy", y.toFixed(2));
			core.setAttribute("r", r.toFixed(2)); core.setAttribute("fill", col); core.setAttribute("opacity", "1");
			core.style.filter = `drop-shadow(0 0 ${(lerp(7, 11, p) + d * 10).toFixed(1)}px ${col}) drop-shadow(0 0 2px ${col})`;
			halo.setAttribute("cx", x.toFixed(2)); halo.setAttribute("cy", y.toFixed(2));
			halo.setAttribute("r", (r * 2.8).toFixed(2)); halo.setAttribute("fill", col);
			halo.setAttribute("opacity", (0.12 + d * 0.08).toFixed(3));
		}
	}

	let raf = 0, t0 = performance.now(), running = false, acc = 0;
	const loop = (now) => { draw((now - t0) / 1000); raf = requestAnimationFrame(loop); };
	function start() { if (running || reduce) return; running = true; t0 = performance.now() - acc; raf = requestAnimationFrame(loop); }
	function stop() { if (!running) return; running = false; cancelAnimationFrame(raf); acc = performance.now() - t0; }
	const onVis = () => (document.hidden ? stop() : start());
	document.addEventListener("visibilitychange", onVis);

	// snap presence to current state for the first (and reduced-motion) frame
	present = getTileCount() > 0 ? 0 : 1;
	draw(0.0001);
	if (!document.hidden) start();

	return function dispose() {
		stop();
		document.removeEventListener("visibilitychange", onVis);
		stage.remove();
	};
}
