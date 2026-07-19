/* cube3d.js — tiny orthographic 3D engine for the QuantFlow cube logos.
   No deps. Exposes window.Cube3D with vertex math, rotation, projection,
   hidden-edge detection, and edge-path interpolation for the traveling node. */
(function () {
  // ---- vec / matrix helpers ----
  function rotX(a){const c=Math.cos(a),s=Math.sin(a);return [[1,0,0],[0,c,-s],[0,s,c]];}
  function rotY(a){const c=Math.cos(a),s=Math.sin(a);return [[c,0,s],[0,1,0],[-s,0,c]];}
  function rotZ(a){const c=Math.cos(a),s=Math.sin(a);return [[c,-s,0],[s,c,0],[0,0,1]];}
  function mul(m,n){const r=[[0,0,0],[0,0,0],[0,0,0]];for(let i=0;i<3;i++)for(let j=0;j<3;j++){let s=0;for(let k=0;k<3;k++)s+=m[i][k]*n[k][j];r[i][j]=s;}return r;}
  function apply(m,v){return [m[0][0]*v[0]+m[0][1]*v[1]+m[0][2]*v[2], m[1][0]*v[0]+m[1][1]*v[1]+m[1][2]*v[2], m[2][0]*v[0]+m[2][1]*v[1]+m[2][2]*v[2]];}

  // Cube centered at origin, half-size 1. 8 corners.
  const CUBE_V = [
    [-1,-1,-1],[ 1,-1,-1],[ 1, 1,-1],[-1, 1,-1],
    [-1,-1, 1],[ 1,-1, 1],[ 1, 1, 1],[-1, 1, 1],
  ];
  // 12 edges as vertex-index pairs.
  const CUBE_E = [
    [0,1],[1,2],[2,3],[3,0],   // back face (z=-1)
    [4,5],[5,6],[6,7],[7,4],   // front face (z=1)
    [0,4],[1,5],[2,6],[3,7],   // connectors
  ];

  // Axis-angle rotation (Rodrigues) about a normalized axis.
  function axisAngle(ax, ang) {
    const L = Math.hypot(ax[0], ax[1], ax[2]) || 1;
    const x = ax[0]/L, y = ax[1]/L, z = ax[2]/L;
    const c = Math.cos(ang), s = Math.sin(ang), t = 1 - c;
    return [
      [t*x*x + c,   t*x*y - s*z, t*x*z + s*y],
      [t*x*y + s*z, t*y*y + c,   t*y*z - s*x],
      [t*x*z - s*y, t*y*z + s*x, t*z*z + c  ],
    ];
  }

  // Body-diagonal "corner-on" base orientation: tilt so a vertex faces camera,
  // giving the hexagon silhouette like the reference gif.
  const ISO = mul(rotX(Math.atan(1/Math.SQRT2)), rotY(Math.PI/4));

  // CORNER-ON VIEW: look straight down the cube's (1,1,1) body diagonal so the
  // silhouette is a regular hexagon and the near/far corners sit at the center.
  const DIAG = [1, 1, 1];
  const VIEW = mul(rotY(-Math.PI/2), mul(rotZ(-Math.atan(1/Math.SQRT2)), rotY(Math.PI/4)));

  // Transform = small view tilt · corner-on view · spin ABOUT the body diagonal.
  // Spinning about the diagonal keeps the hexagon fixed while the inner Y-star
  // pinwheels (and the dotted far-star counter-spins) — the reference's logic.
  function transform({spin=0, tilt=0.14, tiltZ=0}={}) {
    let view = mul(rotX(tilt), VIEW);
    if (tiltZ) view = mul(rotZ(tiltZ), view);
    return mul(view, axisAngle(DIAG, spin));
  }

  // Project all 8 vertices. scale=px per unit, cx/cy = center.
  // Returns {pts:[{x,y,z}], edges:[{a,b,x1,y1,x2,y2,mz}], frontVertexIndex}
  function project(m, scale, cx, cy) {
    const pts = CUBE_V.map(v => {
      const r = apply(m, v);
      return { x: cx + r[0]*scale, y: cy - r[1]*scale, z: r[2] };
    });
    const edges = CUBE_E.map(([a,b]) => ({
      a, b, x1: pts[a].x, y1: pts[a].y, x2: pts[b].x, y2: pts[b].y,
      mz: (pts[a].z + pts[b].z) / 2,
    }));
    // nearest vertex to camera (max z)
    let fi=0; for(let i=1;i<8;i++) if(pts[i].z>pts[fi].z) fi=i;
    // farthest vertex (the hidden back corner where dotted edges meet)
    let bi=0; for(let i=1;i<8;i++) if(pts[i].z<pts[bi].z) bi=i;
    return { pts, edges, frontVertexIndex: fi, backVertexIndex: bi, m };
  }

  // The three edges meeting at a given vertex (for the pinwheel/star figure).
  function edgesAtVertex(vi) {
    return CUBE_E.map((e,i)=>({e,i})).filter(({e})=>e[0]===vi||e[1]===vi);
  }

  // Point at parameter t in [0,1] along the silhouette hexagon: we instead
  // interpolate the node along a chosen edge loop. Given an ordered list of
  // vertex indices forming a closed path and projected pts, return {x,y}.
  function alongPath(pathIdx, pts, t) {
    const n = pathIdx.length;
    const f = (t % 1 + 1) % 1 * n;
    const i = Math.floor(f);
    const frac = f - i;
    const A = pts[pathIdx[i % n]];
    const B = pts[pathIdx[(i+1) % n]];
    return { x: A.x + (B.x-A.x)*frac, y: A.y + (B.y-A.y)*frac, z: A.z + (B.z-A.z)*frac };
  }

  // Silhouette of corner-on cube = the 6 outer vertices (all but front+back).
  // Returns them ordered around the hexagon for the current projection.
  function silhouette(pts, frontIndex, backIndex) {
    const outer = [0,1,2,3,4,5,6,7].filter(i=>i!==frontIndex && i!==backIndex);
    const cx = outer.reduce((s,i)=>s+pts[i].x,0)/outer.length;
    const cy = outer.reduce((s,i)=>s+pts[i].y,0)/outer.length;
    outer.sort((a,b)=>Math.atan2(pts[a].y-cy,pts[a].x-cx)-Math.atan2(pts[b].y-cy,pts[b].x-cx));
    return outer;
  }

  window.Cube3D = {
    CUBE_V, CUBE_E, ISO, VIEW, DIAG, transform, project, apply, axisAngle,
    rotX, rotY, rotZ, mul, edgesAtVertex, alongPath, silhouette,
  };
})();
