// qf-atlas / render.mjs — emits atlas.html from the model. No hand-editing.
export function renderHtml(model) {
  const data = JSON.stringify(model);
  return `<!doctype html>
<meta charset="utf-8">
<title>QuantFlow Atlas — ${model.meta.branch} @ ${model.meta.commit}</title>
<style>
:root{
  --void:#060a12;--panel:#0f1727;--panel2:#152034;--panel3:#1d2b45;
  --rule:#22314b;--rule-hi:#33466a;
  --text:#eaf1fb;--muted:#8fa3c0;--dim:#7288ab;--faint:#3b4b68;
  --ice:#5cc8ff;--ok:#6fe3a8;--warn:#f2c260;--alert:#ff8a75;--accent:#B7FF00;
  --mono:ui-monospace,"Cascadia Code","JetBrains Mono",Consolas,monospace;
  --sans:-apple-system,"Segoe UI Variable Text","Segoe UI",system-ui,sans-serif;
  --t-micro:9px;--t-meta:10px;--t-body:11px;--t-strong:13px;--t-display:20px;
  --s1:2px;--s2:4px;--s3:6px;--s4:8px;--s5:12px;--s6:16px;--s7:24px;
}
*{box-sizing:border-box}
html,body{height:100%;margin:0}
body{background:var(--void);color:var(--text);font-family:var(--sans);font-size:var(--t-body);
     display:grid;grid-template-columns:236px 1fr 350px;overflow:hidden}
button{font-family:inherit}
:focus-visible{outline:2px solid var(--ice);outline-offset:1px}
aside{background:var(--panel2);border-right:1px solid var(--rule);overflow-y:auto;min-width:0}
aside.right{border-right:none;border-left:1px solid var(--rule);padding:var(--s6)}
.eyebrow{font-size:var(--t-micro);letter-spacing:.09em;text-transform:uppercase;color:var(--dim);
  padding:var(--s6) var(--s6) var(--s3);display:block}
.tabs{display:flex;border-bottom:1px solid var(--rule);position:sticky;top:0;background:var(--panel2);z-index:2}
.tab{flex:1;padding:var(--s4) 0;background:none;border:none;border-bottom:2px solid transparent;
  color:var(--dim);font-size:var(--t-meta);cursor:pointer;letter-spacing:.06em;text-transform:uppercase}
.tab.on{color:var(--text);border-bottom-color:var(--ice)}
.grp{font-size:var(--t-micro);letter-spacing:.09em;text-transform:uppercase;color:var(--dim);
  padding:var(--s5) var(--s6) var(--s2);display:flex}
.grp-floor{width:100%;background:none;border:none;border-left:2px solid transparent;
  cursor:pointer;text-align:left;font:inherit}
.grp-floor:hover,.grp-floor.on{background:var(--panel3);color:var(--text);border-left-color:var(--ice)}
.grp-floor b{margin-left:auto;font-family:var(--mono);color:var(--faint)}
.item{display:flex;gap:var(--s3);align-items:baseline;width:100%;background:none;border:none;
  color:var(--muted);font-size:var(--t-meta);text-align:left;padding:3px var(--s6);cursor:pointer;
  border-left:2px solid transparent}
.item:hover{background:var(--panel3);color:var(--text)}
.item.on{border-left-color:var(--ice);color:var(--ice);background:var(--panel3)}
.item .k{font-family:var(--mono);font-size:var(--t-micro);margin-left:auto;color:var(--faint);flex:none}
.item.alert{color:var(--alert)} .item.warn{color:var(--warn)}
main{position:relative;overflow:hidden;min-width:0}
canvas{display:block;width:100%;height:100%;cursor:grab}
canvas.drag{cursor:grabbing}
.hud{position:absolute;left:var(--s6);top:var(--s6);display:flex;gap:var(--s3);flex-wrap:wrap;max-width:70%}
.btn{height:23px;padding:0 var(--s5);background:var(--panel2);border:1px solid var(--rule);
  border-radius:2px;color:var(--text);font-size:var(--t-body);cursor:pointer}
.btn:hover{background:var(--panel3)}
.btn.on{background:var(--ice);border-color:var(--ice);color:#08111c;font-weight:600}
.stat{position:absolute;right:var(--s6);top:var(--s6);text-align:right;font-family:var(--mono);
  font-variant-numeric:tabular-nums;font-size:var(--t-micro);color:var(--dim);line-height:1.65}
.legend{position:absolute;left:var(--s6);bottom:var(--s6);display:flex;gap:var(--s5);flex-wrap:wrap;
  font-size:var(--t-micro);letter-spacing:.07em;text-transform:uppercase;color:var(--dim)}
.legend i{display:inline-block;width:14px;height:2px;margin-right:var(--s2);vertical-align:middle}
.legend i.d{height:8px;width:8px;border-radius:50%}
h1{font-size:var(--t-display);line-height:1.2;font-weight:600;margin:var(--s4) 0 var(--s2)}
h2{font-size:var(--t-strong);font-weight:600;margin:var(--s7) 0 var(--s3);padding-bottom:var(--s3);
  border-bottom:1px solid var(--rule)}
.sub{color:var(--muted);font-size:var(--t-meta);margin:0 0 var(--s5)}
.row{display:flex;gap:var(--s4);align-items:baseline;padding:3px 0;border-bottom:1px solid var(--rule);
  font-size:var(--t-meta)}
.row:last-child{border-bottom:none}
.row b{flex:0 0 44%;color:var(--muted);font-weight:400;word-break:break-all}
.row span{flex:1;min-width:0;font-family:var(--mono);font-variant-numeric:tabular-nums}
.tag{display:inline-block;padding:1px 6px;border:1px solid var(--rule);border-radius:2px;
  font-size:var(--t-micro);letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.tag.alert{color:var(--alert);border-color:var(--alert)}
.tag.warn{color:var(--warn);border-color:var(--warn)}
.tag.ok{color:var(--ok);border-color:var(--ok)}
.tag.ice{color:var(--ice);border-color:var(--ice)}
.card{border:1px solid var(--rule);border-radius:2px;padding:var(--s4);margin-top:var(--s4);
  background:var(--panel);font-size:var(--t-meta)}
.card.alert{border-color:var(--alert)} .card.warn{border-color:var(--warn)}
.card b{display:block;font-size:var(--t-body);margin-bottom:var(--s2);color:var(--text)}
.card.alert b{color:var(--alert)} .card.warn b{color:var(--warn)}
.card p{margin:var(--s2) 0 0;color:var(--muted);line-height:1.55}
pre{background:#050a12;box-shadow:inset 0 0 0 1px #0d1626;border-radius:2px;padding:var(--s4);
  font-family:var(--mono);font-size:var(--t-micro);color:var(--muted);overflow-x:auto;
  margin:var(--s3) 0 0;white-space:pre-wrap;word-break:break-all}
.path{display:flex;flex-direction:column;gap:0;margin-top:var(--s4)}
.hop{display:flex;gap:var(--s4);align-items:flex-start;font-size:var(--t-meta);padding:var(--s3) 0}
.hop .dot{flex:none;width:9px;height:9px;border-radius:50%;margin-top:3px;background:var(--ok);
  box-shadow:0 0 0 3px rgba(111,227,168,.13)}
.hop.off .dot{background:var(--alert);box-shadow:0 0 0 3px rgba(255,138,117,.15)}
.hop .lbl{flex:0 0 68px;color:var(--dim);text-transform:uppercase;font-size:var(--t-micro);
  letter-spacing:.08em;padding-top:1px}
.hop .val{flex:1;font-family:var(--mono);color:var(--text);word-break:break-all}
.hop.off .val{color:var(--alert)}
.conn{width:1px;height:12px;background:var(--rule);margin-left:4px}
.conn.off{background:var(--alert)}
.prose{color:var(--muted);font-size:var(--t-meta);line-height:1.6}
mark{background:#2b3410;color:var(--text);padding:0 2px}
</style>

<aside>
  <span class="eyebrow">QuantFlow · Atlas</span>
  <div class="tabs">
    <button class="tab on" data-tab="loops">Loops</button>
    <button class="tab" data-tab="map">Map</button>
    <button class="tab" data-tab="strip">Strip</button>
    <button class="tab" data-tab="wires">Wires</button>
  </div>
  <div id="rail"></div>
</aside>

<main>
  <canvas id="c"></canvas>
  <div class="hud">
    <button class="btn on" id="play">Pause</button>
    <button class="btn" id="reset">Reset view</button>
    <button class="btn" id="broken">Broken only</button>
    <button class="btn" id="back" style="display:none">← Leave floor</button>
  </div>
  <div class="stat" id="stat"></div>
  <div class="legend">
    <span><i style="background:#5cc8ff"></i>live</span>
    <span><i style="background:#f2c260"></i>unused by renderer</span>
    <span><i style="background:#ff8a75"></i>unreached / dead</span>
    <span><i class="d" style="background:#ff8a75"></i>packet stops here</span>
  </div>
</main>

<aside class="right" id="panel"></aside>

<script>
const M = ${data};
const TONE={ok:"#6fe3a8",ice:"#5cc8ff",warn:"#f2c260",alert:"#ff8a75"};
const WIRE={live:"#5cc8ff",unused:"#f2c260",unreached:"#ff8a75",dead:"#ff8a75",cheats:"#ff8a75"};
const byId=Object.fromEntries(M.nodes.map(n=>[n.id,n]));
const nodeOfFile=new Map();
for(const n of M.nodes) for(const f of n.files) nodeOfFile.set(f.path,n.id);

// Wires become drawable edges: preload end → main end. Aggregate per pair so
// 130 channels do not become 130 overlapping lines.
const edgeMap=new Map();
for(const w of M.wires){
  const from=w.calledAt?nodeOfFile.get(w.calledAt.file):null;
  const to=w.registeredAt?nodeOfFile.get(w.registeredAt.file):null;
  if(!from&&!to) continue;
  const key=(from||"∅")+"→"+(to||"∅");
  if(!edgeMap.has(key)) edgeMap.set(key,{from,to,channels:[],status:"live"});
  const e=edgeMap.get(key);
  e.channels.push(w);
  const rank={live:0,unused:1,cheats:2,unreached:3,dead:4};
  if(rank[w.status]>rank[e.status]) e.status=w.status;
}
const EDGES=[...edgeMap.values()].filter(e=>e.from&&e.to&&e.from!==e.to);

const cv=document.getElementById("c"),cx=cv.getContext("2d");
let W=0,H=0,DPR=Math.min(devicePixelRatio||1,2);
let cam={x:0,y:0,z:1},drag=null,sel=null,hover=null,focus=null,layerFocus=null,playing=true,brokenOnly=false;
const layerHits=[];
const t0=performance.now();
const TILE=64,LIFT=200;

function iso(x,z,layer){const L=M.layers.find(l=>l.id===layer);
  return {x:(x-z)*TILE*.92,y:(x+z)*TILE*.46+L.y*LIFT};}
function proj(p){return {x:W/2+(p.x+cam.x)*cam.z,y:H/2+(p.y+cam.y)*cam.z};}
function resize(){const r=cv.getBoundingClientRect();W=r.width;H=r.height;
  cv.width=W*DPR;cv.height=H*DPR;cx.setTransform(DPR,0,0,DPR,0,0);}
function fitView(){const bot=(M.layers.length-1)*LIFT,
    spread=Math.max(...M.layers.map(l=>l.extent||4.4))*2*TILE*.46;
  cam.x=0;cam.y=-bot/2;cam.z=Math.max(.3,Math.min(1,(H-96)/(bot+spread*2)));}
function nodeSize(n){return Math.max(15,Math.min(46,13+Math.sqrt(n.kb)*3.1));}
function fitLayer(id){const L=M.layers.find(l=>l.id===id);
  const spread=(L.extent||4.4)*2*TILE*.46;
  cam.x=0;cam.y=-L.y*LIFT;cam.z=Math.max(.55,Math.min(2.2,(H-96)/(spread*2+120)));}
function onFloor(){return layerFocus!==null||focus!==null;}
function visible(n){if(layerFocus!==null&&n.layer!==layerFocus) return false;
  return !focus||n.id===focus||EDGES.some(e=>(e.from===focus&&e.to===n.id)||(e.to===focus&&e.from===n.id));}
function edgeVisible(e){const A=byId[e.from],B=byId[e.to];
  if(layerFocus!==null&&(A.layer!==layerFocus||B.layer!==layerFocus)) return false;
  if(focus&&e.from!==focus&&e.to!==focus) return false;
  return true;}
function pointInPoly(x,y,pts){let inside=false;
  for(let i=0,j=pts.length-1;i<pts.length;j=i++){
    const xi=pts[i].x,yi=pts[i].y,xj=pts[j].x,yj=pts[j].y;
    if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi)) inside=!inside;
  }
  return inside;}
function pickLayer(mx,my){for(const L of layerHits){if(pointInPoly(mx,my,L.pts)) return L.id;} return null;}

function draw(){
  const T=(performance.now()-t0)/1000;
  cx.clearRect(0,0,W,H);
  const FF=getComputedStyle(document.body).fontFamily;
  const order=[...M.layers].sort((a,b)=>b.y-a.y);

  layerHits.length=0;
  for(const L of order){
    const s=L.extent||4.4,pts=[[-s,-s],[s,-s],[s,s],[-s,s]].map(([a,b])=>proj(iso(a,b,L.id)));
    layerHits.push({id:L.id,pts});
    const isolated=layerFocus!==null,isHere=L.id===layerFocus,dim=isolated&&!isHere;
    cx.beginPath();cx.moveTo(pts[0].x,pts[0].y);pts.slice(1).forEach(q=>cx.lineTo(q.x,q.y));cx.closePath();
    cx.fillStyle=dim?"rgba(6,10,18,.72)":\`rgba(21,32,52,\${(focus?.18:.30)+L.y*.05})\`;cx.fill();
    cx.strokeStyle=isHere?"#5cc8ff":(L.id===0?"#33466a":"#22314b");
    cx.lineWidth=isHere?2:(L.id===0?1.4:1);cx.stroke();
    if(dim){cx.save();cx.fillStyle="rgba(6,10,18,.35)";cx.fill();cx.restore();continue;}
    cx.save();cx.globalAlpha=focus?.22:.5;cx.strokeStyle="#1a2740";cx.lineWidth=.5;
    for(let g=-s+0.6;g<=s-0.6;g+=s/4){
      let a=proj(iso(g,-s,L.id)),b=proj(iso(g,s,L.id));
      cx.beginPath();cx.moveTo(a.x,a.y);cx.lineTo(b.x,b.y);cx.stroke();
      a=proj(iso(-s,g,L.id));b=proj(iso(s,g,L.id));
      cx.beginPath();cx.moveTo(a.x,a.y);cx.lineTo(b.x,b.y);cx.stroke();
    }
    cx.restore();
    const lp=proj(iso(-s,s,L.id));
    cx.save();cx.translate(lp.x+10,lp.y-6);
    cx.fillStyle=isHere?"#5cc8ff":(focus?"#3b4b68":"#7288ab");cx.font="600 12px "+FF;
    cx.fillText(\`LVL \${L.id}  \${L.name}\`,0,0);cx.restore();
  }

  // ── wires. a packet stops where the flow actually dies ──
  for(const e of EDGES){
    if(brokenOnly&&e.status==="live") continue;
    if(!edgeVisible(e)) continue;
    const A=byId[e.from],B=byId[e.to];
    const pa=proj(iso(A.x,A.z,A.layer)),pb=proj(iso(B.x,B.z,B.layer));
    const on=(sel&&(e.from===sel||e.to===sel));
    cx.beginPath();cx.moveTo(pa.x,pa.y);cx.lineTo(pb.x,pb.y);
    cx.strokeStyle=e.status==="live"?(on?"rgba(92,200,255,.75)":"rgba(92,200,255,.26)")
      :e.status==="unused"?"rgba(242,194,96,.5)":"rgba(255,138,117,.62)";
    cx.setLineDash(e.status==="live"?[]:[4,4]);
    cx.lineWidth=on?2:1;cx.stroke();cx.setLineDash([]);

    // where the packet stops: 1.0 live, .55 unused (reaches main, nobody asked),
    // .28 unreached/dead (never really leaves)
    // cheats reaches main and mutates outside the Kernel: the packet arrives,
    // so the break belongs at the far end, not partway down the wire.
    const stopAt=e.status==="live"?1:e.status==="cheats"?.92:e.status==="unused"?.55:.28;
    if(playing){
      const k=((T*.26)+(e.channels.length*.07))%1;
      const kk=Math.min(k,stopAt);
      const px=pa.x+(pb.x-pa.x)*kk,py=pa.y+(pb.y-pa.y)*kk;
      cx.beginPath();cx.arc(px,py,3.3,0,7);cx.fillStyle=WIRE[e.status];cx.fill();
      cx.beginPath();cx.arc(px,py,7.5,0,7);
      cx.fillStyle=e.status==="live"?"rgba(92,200,255,.14)":"rgba(255,138,117,.16)";cx.fill();
    }
    if(stopAt<1){ // the break marker — this is where work dies
      const bx=pa.x+(pb.x-pa.x)*stopAt,by=pa.y+(pb.y-pa.y)*stopAt;
      cx.strokeStyle=WIRE[e.status];cx.lineWidth=1.6;
      cx.beginPath();cx.moveTo(bx-4,by-4);cx.lineTo(bx+4,by+4);
      cx.moveTo(bx+4,by-4);cx.lineTo(bx-4,by+4);cx.stroke();
    }
  }

  // ── blocks ──
  const labels=[];
  for(const L of order) for(const n of M.nodes.filter(n=>n.layer===L.id)){
    if(layerFocus!==null&&n.layer!==layerFocus) continue;
    if(brokenOnly&&n.status!=="alert"&&n.status!=="warn") continue;
    const dim=focus&&!visible(n);
    const p=proj(iso(n.x,n.z,n.layer)),s=nodeSize(n)*cam.z,h=s*.62;
    const top=[[0,-h],[s*.86,-h+s*.5],[0,-h+s],[-s*.86,-h+s*.5]].map(([a,b])=>({x:p.x+a,y:p.y+b}));
    cx.save();if(dim)cx.globalAlpha=.16;
    cx.beginPath();cx.moveTo(top[3].x,top[3].y);cx.lineTo(top[2].x,top[2].y);
    cx.lineTo(top[2].x,top[2].y+h);cx.lineTo(top[3].x,top[3].y+h);cx.closePath();
    cx.fillStyle="#0f1727";cx.fill();cx.strokeStyle=TONE[n.status]||"#22314b";cx.lineWidth=1;cx.stroke();
    cx.beginPath();cx.moveTo(top[1].x,top[1].y);cx.lineTo(top[2].x,top[2].y);
    cx.lineTo(top[2].x,top[2].y+h);cx.lineTo(top[1].x,top[1].y+h);cx.closePath();
    cx.fillStyle="#152034";cx.fill();cx.stroke();
    cx.beginPath();cx.moveTo(top[0].x,top[0].y);top.slice(1).forEach(q=>cx.lineTo(q.x,q.y));cx.closePath();
    cx.fillStyle=n.id===sel?"#1d2b45":"#152034";cx.fill();
    cx.strokeStyle=(n.id===sel||n.id===hover)?"#5cc8ff":(TONE[n.status]||"#33466a");
    cx.lineWidth=n.id===sel?2:1;cx.stroke();cx.restore();
    const named=(n.id===sel||n.id===hover||focus||cam.z>1.25||n.kb>=28||n.status==="alert");
    if(!dim&&named) labels.push({n,x:p.x,y:p.y+h*.9+13});
    n._p=p;n._s=s;
  }
  cx.textAlign="center";
  for(const {n,x,y} of labels){
    const on=(n.id===sel||n.id===hover);
    cx.font=(on?"600 ":"")+"10px "+FF;
    const w=cx.measureText(n.name).width;
    cx.fillStyle=on?"rgba(6,10,18,.95)":"rgba(6,10,18,.8)";
    cx.fillRect(x-w/2-4,y-9,w+8,13);
    cx.fillStyle=on?"#eaf1fb":(n.status!=="ok"&&n.status!=="ice"?TONE[n.status]:"#8fa3c0");
    cx.fillText(n.name,x,y);
  }
  cx.textAlign="left";

  const s=M.stats;
  const floorLine=layerFocus!==null?"<br><span style=\\"color:#5cc8ff\\">LVL "+layerFocus+" only</span>":"";
  document.getElementById("stat").innerHTML=
    \`\${M.meta.filesScanned} files · \${M.nodes.length} subsystems<br>\`+
    \`\${s.channels} IPC channels · \${EDGES.length} wires\${floorLine}<br>\`+
    \`<span style="color:#ff8a75">\${s.unreached+s.dead} unreached/dead</span> · \`+
    \`<span style="color:#f2c260">\${s.unused} unused</span><br>\`+
    \`\${M.meta.branch} @ \${M.meta.commit} · \${M.meta.generatedAt}\`;
  requestAnimationFrame(draw);
}

function pick(mx,my){
  for(const n of [...M.nodes].reverse()){
    if(!n._p||(focus&&!visible(n))) continue;
    if(Math.hypot(mx-n._p.x,my-n._p.y+nodeSize(n)*cam.z*.3)<nodeSize(n)*cam.z*.9) return n;
  }
  return null;
}
cv.addEventListener("mousedown",e=>{drag={x:e.clientX,y:e.clientY};cv.classList.add("drag")});
addEventListener("mouseup",()=>{drag=null;cv.classList.remove("drag")});
addEventListener("mousemove",e=>{
  const r=cv.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top;
  if(drag){cam.x+=(e.clientX-drag.x)/cam.z;cam.y+=(e.clientY-drag.y)/cam.z;drag={x:e.clientX,y:e.clientY};return}
  if(mx<0||my<0||mx>r.width||my>r.height){hover=null;cv.style.cursor="grab";return}
  const n=pick(mx,my);
  if(n){hover=n.id;cv.style.cursor="pointer";return}
  hover=null;cv.style.cursor=pickLayer(mx,my)!==null?"pointer":"grab";
});
cv.addEventListener("click",e=>{const r=cv.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top;
  const n=pick(mx,my);
  if(n){select(n.id);return}
  const lid=pickLayer(mx,my);
  if(lid!==null) isolateLayer(lid);});
cv.addEventListener("dblclick",e=>{const r=cv.getBoundingClientRect();
  const n=pick(e.clientX-r.left,e.clientY-r.top);if(n)enter(n.id);});
cv.addEventListener("wheel",e=>{e.preventDefault();
  cam.z=Math.max(.28,Math.min(2.6,cam.z*(e.deltaY<0?1.1:.91)))},{passive:false});

const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;");

// ── zoom into a process or isolate a floor ──
function backLabel(){return focus?"← Leave process":"← Leave floor";}
function syncBack(){const b=document.getElementById("back");
  if(onFloor()){b.style.display="";b.textContent=backLabel();}else b.style.display="none";}
function showFloorPanel(id){
  const L=M.layers.find(l=>l.id===id);
  const ns=M.nodes.filter(n=>n.layer===id).sort((a,b)=>b.kb-a.kb);
  const wires=EDGES.filter(edgeVisible);
  document.getElementById("panel").innerHTML=\`
    <span class="tag ice">LVL \${id} · \${esc(L.name)}</span>
    <h1>Floor \${id}</h1>
    <p class="sub">\${ns.length} subsystems on this level · \${wires.length} internal wires shown</p>
    <p class="prose">Click a block to inspect it. Double-click to zoom into one process.
    Other floors are hidden until you leave this view.</p>
    <h2>Subsystems</h2>
    \${ns.map(n=>\`<div class="row" style="cursor:pointer" onclick="select('\${n.id}')"><b>\${esc(n.name)}</b>
       <span style="color:\${TONE[n.status]||"#8fa3c0"}">\${n.kb} KB · \${n.status}</span></div>\`).join("")}\`;
}
function showHomePanel(){
  document.getElementById("panel").innerHTML=\`
    <span class="tag ice">generated projection</span>
    <h1>QuantFlow Atlas</h1>
    <p class="sub">How the program is wired right now, read straight from the code on
     <span style="font-family:var(--mono)">\${M.meta.branch} @ \${M.meta.commit}</span>.
     Not Kernel truth. Not the running app.</p>
    <h2>What the wires mean</h2>
    <p class="prose">Every wire is one real IPC channel traced across three hops:
    <mark>renderer → preload → main</mark>. A packet travels the wire only as far as the code
    actually carries it. Where it stops, an × marks the break — that is where work dies.</p>
    <div class="row"><b>Click a floor</b><span>isolate one level on the map</span></div>
    <div class="row"><b>Click a block</b><span>files, wires, what to strip</span></div>
    <div class="row"><b>Double-click a block</b><span>zoom inside the process</span></div>
    <div class="row"><b>Strip tab</b><span>everything that should be removed</span></div>
    <div class="row"><b>Wires tab</b><span>every channel by health</span></div>
    <h2>Right now</h2>
    <div class="row"><b>Live end to end</b><span style="color:#5cc8ff">\${M.stats.live}</span></div>
    <div class="row"><b>Unused by renderer</b><span style="color:#f2c260">\${M.stats.unused}</span></div>
    <div class="row"><b>Unreached in main</b><span style="color:#ff8a75">\${M.stats.unreached}</span></div>
    <div class="row"><b>Dead (fails at runtime)</b><span style="color:#ff8a75">\${M.stats.dead}</span></div>
    <div class="row"><b>Strip candidates</b><span style="color:#ff8a75">\${M.stats.stripCandidates}</span></div>
    <h2>Staying true</h2>
    <p class="prose">Nobody edits this file. <span style="font-family:var(--mono)">bun qf-atlas/generate.mjs</span>
    rewrites it from source; <span style="font-family:var(--mono)">--check</span> fails the build when the
    map and the code disagree.</p>\`;
}
function isolateLayer(id){
  if(layerFocus===id&&!focus){layerFocus=null;syncBack();fitView();renderRail(document.querySelector(".tab.on")?.dataset.tab||"map");showHomePanel();return;}
  layerFocus=id;focus=null;syncBack();fitLayer(id);renderRail("map");showFloorPanel(id);
  document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("on",t.dataset.tab==="map"));
}
function enter(id){
  if(layerFocus!==null&&byId[id].layer!==layerFocus) return;
  focus=id;const n=byId[id];
  cam.x=-iso(n.x,n.z,n.layer).x;cam.y=-iso(n.x,n.z,n.layer).y;cam.z=1.5;
  syncBack();select(id);
}
function leave(){
  if(focus){focus=null;
    if(layerFocus!==null){syncBack();fitLayer(layerFocus);showFloorPanel(layerFocus);return;}
    syncBack();fitView();return;}
  if(layerFocus!==null){layerFocus=null;syncBack();fitView();renderRail(document.querySelector(".tab.on")?.dataset.tab||"map");showHomePanel();}
}
document.getElementById("back").onclick=leave;

function wirePath(w){
  return \`<div class="path">\`+w.hops.map((h,i)=>
    \`<div class="hop \${h.present?"":"off"}"><span class="dot"></span>
       <span class="lbl">\${h.layer}</span><span class="val">\${esc(h.detail)}</span></div>\`+
    (i<2?\`<div class="conn \${w.hops[i+1].present?"":"off"}"></div>\`:"")).join("")+\`</div>\`;
}

function select(id){
  sel=id;const n=byId[id];
  document.querySelectorAll(".item").forEach(b=>b.classList.toggle("on",b.dataset.id===id));
  const myWires=M.wires.filter(w=>n.wires.includes(w.channel));
  const broken=myWires.filter(w=>w.status!=="live");
  document.getElementById("panel").innerHTML=\`
    <span class="tag \${n.status==="alert"?"alert":n.status==="warn"?"warn":"ice"}">LVL \${n.layer} · \${M.layers.find(l=>l.id===n.layer).name}</span>
    <h1>\${esc(n.name)}</h1>
    <p class="sub">\${n.files.length} file\${n.files.length>1?"s":""} · \${n.kb} KB\${focus===id?" · inside this process":""}</p>
    \${focus!==id?\`<button class="btn" style="width:100%;margin-bottom:var(--s4)" onclick="enter('\${id}')">Zoom into this process →</button>\`:""}
    \${n.strip.length?\`<h2>Should be removed (\${n.strip.length})</h2>\`+n.strip.map(s=>
      \`<div class="card alert"><b>\${esc(s.what)}</b><span class="prose">\${esc(s.kind)}</span>
        <p>\${esc(s.why)}</p><pre>\${esc(s.where)}</pre></div>\`).join(""):""}
    \${broken.length?\`<h2>Flows that die here (\${broken.length})</h2>\`+broken.map(w=>
      \`<div class="card \${w.status==="unused"?"warn":"alert"}"><b>\${esc(w.channel)}</b>
        <span class="prose">stops at \${esc(w.breakAt)}</span>\${wirePath(w)}</div>\`).join(""):""}
    <h2>Files</h2>
    \${n.files.map(f=>\`<div class="row"><b>\${esc(f.path.split("/").pop())}</b>
       <span>\${f.kb} KB\${f.dml?\` · \${f.dml} DML\`:""}\${f.spawns?\` · \${f.spawns} spawn\`:""}\${f.writes?\` · \${f.writes} write\`:""}</span></div>\`).join("")}
    \${myWires.length?\`<h2>Channels (\${myWires.length})</h2>\`+myWires.slice(0,40).map(w=>
      \`<div class="row"><b>\${esc(w.channel)}</b><span style="color:\${WIRE[w.status]}">\${w.status}</span></div>\`).join(""):""}\`;
}

function selectWire(ch){
  const w=M.wires.find(x=>x.channel===ch);
  document.getElementById("panel").innerHTML=\`
    <span class="tag \${w.status==="live"?"ice":w.status==="unused"?"warn":"alert"}">\${w.status}</span>
    <h1>\${esc(w.channel)}</h1>
    <p class="sub">\${w.status==="live"?"This flow completes end to end."
      :w.status==="unused"?"Reaches main, but no renderer file ever calls it."
      :w.status==="unreached"?"Registered in main. Nothing calls it — the renderer cannot reach it."
      :w.status==="cheats"?"Reaches main and completes, but mutates state without going through execute(). The work happens; it is not governed."
      :"Called from preload with no handler in main. This fails at runtime."}</p>
    <h2>The path a packet takes</h2>\${wirePath(w)}
    \${w.breakAt?\`<div class="card alert" style="margin-top:var(--s6)"><b>Stops at: \${esc(w.breakAt)}</b>
      <p>\${w.status==="unreached"?"No preload caller forwards to this channel, so a packet never enters the wire."
        :w.status==="unused"?"The bridge method exists and works, but no renderer code calls it."
        :"The packet leaves preload and finds no handler."}</p></div>\`:""}\`;
}

function selectLife(mod){
  const l=M.lifetime.find(x=>x.module.endsWith(mod)); if(!l) return;
  document.getElementById("panel").innerHTML=\`
    <span class="tag \${l.status==="reaped"?"ok":l.status==="partial"?"warn":"alert"}">lifetime · \${esc(l.status)}</span>
    <div class="ttl">\${esc(l.module.split("/").pop())}</div>
    <p class="sub">\${esc(l.why)}</p>
    <h2>spawn &rarr; reap</h2>
    <div class="path">\${l.hops.map((h,i)=>
      \`<div class="hop \${h.present?"":"off"}"><span class="dot"></span><span class="lbl">\${h.layer}</span><span class="val">\${esc(h.detail)}</span></div>\`+
      (i<l.hops.length-1?\`<div class="conn \${l.hops[i+1].present?"":"off"}"></div>\`:"")).join("")}</div>\`;
}

// ── rails ──
const rail=document.getElementById("rail");
function renderRail(tab){
  document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("on",t.dataset.tab===tab));
  if(tab==="loops"){
    rail.innerHTML=M.loops.map(L=>{
      const dot=L.health==="ok"?"#6fe3a8":L.health==="broken"?"#ff8a75":"#f2c260";
      return \`<div class="grp">\${esc(L.name)}<b style="color:\${dot}">\${L.health==="ok"?"ok":L.brokenCount+"/"+L.total}</b></div>\`+
        L.members.map(x=>\`<button class="item \${x.status==="live"||x.status==="reaped"?"":x.status==="unused"?"warn":"alert"}" data-id="\${esc(x.channel)}" data-act="\${L.lifetime?"life":"wire"}">\${esc(x.channel)}<span class="k">\${esc(x.status)}</span></button>\`).join("");
    }).join("");
  } else if(tab==="map"){
    rail.innerHTML=M.layers.map(L=>{
      const ns=M.nodes.filter(n=>n.layer===L.id).sort((a,b)=>b.kb-a.kb);
      return \`<button type="button" class="grp grp-floor \${layerFocus===L.id?"on":""}" data-layer="\${L.id}">
        LVL \${L.id} · \${esc(L.name)}<b>\${ns.length}</b></button>\`+
        (layerFocus===null||layerFocus===L.id?ns.map(n=>\`<button class="item \${n.status==="alert"?"alert":n.status==="warn"?"warn":""}"
          data-id="\${n.id}" data-act="node">\${esc(n.name)}<span class="k">\${n.kb}</span></button>\`).join(""):"");
    }).join("");
  } else if(tab==="strip"){
    const kinds={};for(const s of M.strip)(kinds[s.kind]||=[]).push(s);
    rail.innerHTML=Object.entries(kinds).map(([k,items])=>
      \`<div class="grp">\${esc(k)}<b>\${items.length}</b></div>\`+
      items.map(s=>\`<button class="item alert" data-id="\${esc(s.where.split(":")[0])}" data-act="file"
        title="\${esc(s.why)}">\${esc(s.what)}</button>\`).join("")).join("");
  } else {
    const g={dead:[],unreached:[],unused:[],live:[]};
    for(const w of M.wires) g[w.status].push(w);
    rail.innerHTML=["dead","unreached","unused","live"].filter(k=>g[k].length).map(k=>
      \`<div class="grp">\${k}<b>\${g[k].length}</b></div>\`+
      g[k].map(w=>\`<button class="item \${k==="live"?"":k==="unused"?"warn":"alert"}"
        data-id="\${esc(w.channel)}" data-act="wire">\${esc(w.channel)}</button>\`).join("")).join("");
  }
}
rail.addEventListener("click",e=>{
  const floor=e.target.closest(".grp-floor");
  if(floor){isolateLayer(Number(floor.dataset.layer));return}
  const b=e.target.closest(".item");if(!b)return;
  if(b.dataset.act==="node") select(b.dataset.id);
  else if(b.dataset.act==="wire") selectWire(b.dataset.id);
  else if(b.dataset.act==="life") selectLife(b.dataset.id);
  else{const nid=nodeOfFile.get(b.dataset.id);if(nid)select(nid);}
});
document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>renderRail(t.dataset.tab));

document.getElementById("play").onclick=e=>{playing=!playing;
  e.target.textContent=playing?"Pause":"Resume";e.target.classList.toggle("on",playing)};
document.getElementById("reset").onclick=()=>{focus=null;layerFocus=null;syncBack();fitView();showHomePanel();};
document.getElementById("broken").onclick=e=>{brokenOnly=!brokenOnly;e.target.classList.toggle("on",brokenOnly)};
addEventListener("resize",()=>{resize();if(!focus)fitView()});
window.enter=enter;window.isolateLayer=isolateLayer;

resize();fitView();renderRail("loops");showHomePanel();
draw();
</script>
`;
}
