// QuantFlow's original corner-on rotating cube and pulse-swarm wordmark.
const SVG_NS = "http://www.w3.org/2000/svg";
const VERTICES = [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
const EDGES = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
const LOOP = [0,1,2,3,7,6,5,4];
const COLORS = ["#B7FF00", "#2fe6cf", "#c79bff"];
const lerp = (a, b, t) => a + (b - a) * t;

function rotate([x, y, z], spin) {
	const axis = 1 / Math.sqrt(3), c = Math.cos(spin), s = Math.sin(spin), t = 1 - c;
	const m = [
		[t*axis*axis+c,t*axis*axis-s*axis,t*axis*axis+s*axis],
		[t*axis*axis+s*axis,t*axis*axis+c,t*axis*axis-s*axis],
		[t*axis*axis-s*axis,t*axis*axis+s*axis,t*axis*axis+c],
	];
	const rx=m[0][0]*x+m[0][1]*y+m[0][2]*z, ry=m[1][0]*x+m[1][1]*y+m[1][2]*z, rz=m[2][0]*x+m[2][1]*y+m[2][2]*z;
	const cy=Math.cos(-Math.PI/4), sy=Math.sin(-Math.PI/4), vx=cy*rx+sy*rz, vz=-sy*rx+cy*rz;
	const cx=Math.cos(.62), sx=Math.sin(.62);
	return [vx, cx*ry-sx*vz, sx*ry+cx*vz];
}

export function createFlowCubeWatermark(container, { getTileCount = () => 0 } = {}) {
	if (!container) return () => {};
	const stage = document.createElementNS(SVG_NS, "svg");
	stage.setAttribute("focusable", "false");
	stage.setAttribute("aria-hidden", "true");
	stage.setAttribute("viewBox", "0 0 1600 1000");
	stage.setAttribute("width", "100%"); stage.setAttribute("height", "100%");
	const scrim = document.createElementNS(SVG_NS, "ellipse");
	scrim.setAttribute("cx", "800"); scrim.setAttribute("cy", "430"); scrim.setAttribute("rx", "500"); scrim.setAttribute("ry", "390");
	scrim.setAttribute("fill", "rgba(8,10,15,.55)"); stage.appendChild(scrim);
	const edges = EDGES.map(() => { const line=document.createElementNS(SVG_NS,"line"); line.setAttribute("stroke","#f2f0ec"); line.setAttribute("stroke-linecap","round"); line.setAttribute("stroke-dasharray","7 9"); stage.appendChild(line); return line; });
	const nodes = COLORS.map((color) => { const node=document.createElementNS(SVG_NS,"circle"); node.setAttribute("fill",color); stage.appendChild(node); return node; });
	const wordmark = document.createElementNS(SVG_NS, "text");
	wordmark.textContent="QUANTFLOW"; wordmark.setAttribute("x","800"); wordmark.setAttribute("y","790"); wordmark.setAttribute("text-anchor","middle"); wordmark.setAttribute("fill","#fbfaf7"); wordmark.setAttribute("font-family","Space Grotesk, system-ui, sans-serif"); wordmark.setAttribute("font-weight","600"); wordmark.setAttribute("font-size","54"); wordmark.setAttribute("letter-spacing","22"); stage.appendChild(wordmark);
	const underline=document.createElementNS(SVG_NS,"line"); underline.setAttribute("x1","610"); underline.setAttribute("x2","990"); underline.setAttribute("y1","825"); underline.setAttribute("y2","825"); underline.setAttribute("stroke",COLORS[0]); underline.setAttribute("stroke-width","3"); stage.appendChild(underline);
	container.replaceChildren(stage);
	let presence=getTileCount() ? 0 : 1, raf=0, started=0, elapsed=0, running=false;
	const reduce=globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
	function draw(seconds) {
		presence += ((getTileCount() ? 0 : 1) - presence) * .06;
		container.style.opacity=lerp(.16,1,presence).toFixed(3); scrim.setAttribute("opacity",(.8*presence).toFixed(3));
		const points=VERTICES.map((v)=>{const [x,y,z]=rotate(v,seconds*.46);return{x:800+x*184,y:430-y*184,z};});
		EDGES.forEach(([a,b],i)=>{const A=points[a],B=points[b],depth=(A.z+B.z+3.2)/6.4,line=edges[i]; line.setAttribute("x1",A.x.toFixed(2));line.setAttribute("y1",A.y.toFixed(2));line.setAttribute("x2",B.x.toFixed(2));line.setAttribute("y2",B.y.toFixed(2));line.setAttribute("stroke-width",(1.4+depth*1.9).toFixed(2));line.setAttribute("opacity",(.35+depth*.55).toFixed(2));line.setAttribute("stroke-dashoffset",(-seconds*22).toFixed(1));});
		nodes.forEach((node,n)=>{const f=((seconds*1.15+n*8/3)%8+8)%8,A=points[LOOP[Math.floor(f)]],B=points[LOOP[(Math.floor(f)+1)%8]],p=f-Math.floor(f),x=lerp(A.x,B.x,p),y=lerp(A.y,B.y,p),r=lerp(5,10,(lerp(A.z,B.z,p)+1.6)/3.2);node.setAttribute("cx",x.toFixed(2));node.setAttribute("cy",y.toFixed(2));node.setAttribute("r",r.toFixed(2));node.style.filter=`drop-shadow(0 0 10px ${COLORS[n]})`;});
	}
	function frame(now){elapsed=now-started;draw(elapsed/1000);raf=requestAnimationFrame(frame);}
	function start(){if(running||reduce||document.hidden)return;running=true;started=performance.now()-elapsed;raf=requestAnimationFrame(frame);}
	function stop(){if(!running)return;running=false;cancelAnimationFrame(raf);}
	const visibility=()=>document.hidden?stop():start(); document.addEventListener("visibilitychange",visibility);
	draw(0); start();
	return()=>{stop();document.removeEventListener("visibilitychange",visibility);stage.remove();};
}
