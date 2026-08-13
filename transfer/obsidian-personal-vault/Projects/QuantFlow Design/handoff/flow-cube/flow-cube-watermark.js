// flow-cube-watermark.js
//
// QuantFlow brand watermark for the shell canvas field floor (vanilla ES module
// — the shell renderer is plain JS, not React). A corner-on wireframe cube spun
// about its body diagonal, with live nodes routing its edge loop ("Pulse Swarm"),
// plus the QUANTFLOW wordmark beneath. Pauses when the document is hidden and
// honors prefers-reduced-motion.
//
// TARGET: src/windows/shell/src/flow-cube-watermark.js
//
// Usage (in renderer.js):
//   import { createFlowCubeWatermark } from "./flow-cube-watermark.js";
//   createFlowCubeWatermark(document.getElementById("canvas-watermark"));

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
const SPECTRUM = ["#B7FF00", "#2fe6cf", "#c79bff"];

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

export function createFlowCubeWatermark(container, opts = {}) {
	if (!container) return () => {};
	const W = 1600, H = 1000, cx = 800, cy = 432, scale = 184;
	const INK = opts.ink || "#f2f0ec";
	const reduce = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

	const stage = document.createElementNS(SVG_NS, "svg");
	stage.setAttribute("viewBox", `0 0 ${W} ${H}`);
	stage.setAttribute("preserveAspectRatio", "xMidYMid meet");
	stage.setAttribute("width", "100%");
	stage.setAttribute("height", "100%");
	stage.style.overflow = "visible";
	stage.style.display = "block";

	const mk = (tag) => stage.appendChild(document.createElementNS(SVG_NS, tag));
	const edges = CUBE_E.map(() => { const l = mk("line"); l.setAttribute("stroke-linecap", "round"); return l; });
	const halos = [0, 1, 2].map(() => { const c = mk("circle"); c.setAttribute("opacity", "0"); return c; });
	const cores = [0, 1, 2].map(() => { const c = mk("circle"); c.setAttribute("opacity", "0"); return c; });

	const fo = mk("foreignObject");
	fo.setAttribute("x", "0"); fo.setAttribute("y", "700");
	fo.setAttribute("width", String(W)); fo.setAttribute("height", "180");
	const wm = document.createElement("div");
	wm.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
	wm.style.cssText = "display:flex;flex-direction:column;align-items:center;gap:12px;font-family:'Space Grotesk',system-ui,sans-serif;";
	wm.innerHTML =
		`<div style="font-weight:600;color:${INK};font-size:38px;letter-spacing:.44em;text-transform:uppercase;padding-left:.44em;">QuantFlow</div>` +
		`<div style="width:260px;height:2.5px;background:#B7FF00;border-radius:2px;box-shadow:0 0 20px rgba(183,255,0,.45),0 0 7px rgba(183,255,0,.5);"></div>`;
	fo.appendChild(wm);

	container.appendChild(stage);

	const setNode = (core, halo, x, y, d, col, scl) => {
		const r = (4.5 + d * 5.5) * scl;
		core.setAttribute("cx", x.toFixed(2)); core.setAttribute("cy", y.toFixed(2));
		core.setAttribute("r", r.toFixed(2)); core.setAttribute("fill", col); core.setAttribute("opacity", "1");
		core.style.filter = `drop-shadow(0 0 ${(7 + d * 10).toFixed(1)}px ${col}) drop-shadow(0 0 2px ${col})`;
		halo.setAttribute("cx", x.toFixed(2)); halo.setAttribute("cy", y.toFixed(2));
		halo.setAttribute("r", (r * 2.8).toFixed(2)); halo.setAttribute("fill", col);
		halo.setAttribute("opacity", (0.12 + d * 0.08).toFixed(3));
	};

	function draw(t) {
		const m = transform(t * 0.46, 0.17 + Math.sin(t * 0.3) * 0.04, Math.cos(t * 0.22) * 0.04);
		const pts = CUBE_V.map((v) => { const r = apply(m, v); return { x: cx + r[0] * scale, y: cy - r[1] * scale, z: r[2] }; });
		let bi = 0; for (let i = 1; i < 8; i++) if (pts[i].z < pts[bi].z) bi = i;
		const p = t * 1.15;

		CUBE_E.forEach((ev, i) => {
			const A = pts[ev[0]], B = pts[ev[1]], mz = (A.z + B.z) / 2, d = depthOf(mz);
			const hidden = ev[0] === bi || ev[1] === bi;
			const l = edges[i];
			l.setAttribute("x1", A.x.toFixed(2)); l.setAttribute("y1", A.y.toFixed(2));
			l.setAttribute("x2", B.x.toFixed(2)); l.setAttribute("y2", B.y.toFixed(2));
			l.setAttribute("stroke", INK);
			l.setAttribute("stroke-dasharray", "7 9");
			l.setAttribute("stroke-dashoffset", (-t * 22).toFixed(1));
			l.setAttribute("stroke-width", (1.2 + d * 1.3).toFixed(2));
			l.setAttribute("opacity", (0.5 * (hidden ? 0.55 : 1) * (0.5 + d * 0.5)).toFixed(2));
		});

		for (let n = 0; n < 3; n++) {
			const pn = p + n * (8 / 3);
			const f = ((pn / 8) % 1 + 1) % 1 * FLOOP.length;
			const ii = Math.floor(f), frac = f - ii;
			const A = pts[FLOOP[ii % FLOOP.length]], B = pts[FLOOP[(ii + 1) % FLOOP.length]];
			const x = A.x + (B.x - A.x) * frac, y = A.y + (B.y - A.y) * frac, z = A.z + (B.z - A.z) * frac;
			setNode(cores[n], halos[n], x, y, depthOf(z), SPECTRUM[n], 0.95);
		}
	}

	let raf = 0, t0 = performance.now(), running = false, acc = 0;
	const loop = (now) => { draw((now - t0) / 1000); raf = requestAnimationFrame(loop); };
	function start() { if (running || reduce) return; running = true; t0 = performance.now() - acc; raf = requestAnimationFrame(loop); }
	function stop() { if (!running) return; running = false; cancelAnimationFrame(raf); acc = performance.now() - t0; }
	const onVis = () => (document.hidden ? stop() : start());
	document.addEventListener("visibilitychange", onVis);

	draw(0.0001);
	if (!document.hidden) start();

	return function dispose() {
		stop();
		document.removeEventListener("visibilitychange", onVis);
		stage.remove();
	};
}
