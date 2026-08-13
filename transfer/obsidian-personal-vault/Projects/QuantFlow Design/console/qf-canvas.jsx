// ── Shared canvas plumbing for all directions ───────────────────────────────
// Fit-to-viewport scaler, dotted field, and the glowing bezier cable layer.

// Measure container, scale the abstract world to fit with padding.
function useFitScale(worldW, worldH, pad = 80) {
  const ref = useRef(null);
  const [t, setT] = useState({ scale: 0.6, ox: 0, oy: 0, ready: false });
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const s = Math.min((r.width - pad * 2) / worldW, (r.height - pad * 2) / worldH);
      const scale = Math.max(0.2, Math.min(s, 1));
      setT({ scale, ox: (r.width - worldW * scale) / 2, oy: (r.height - worldH * scale) / 2, ready: true });
    };
    measure();
    const ro = new ResizeObserver(measure); ro.observe(el);
    return () => ro.disconnect();
  }, [worldW, worldH, pad]);
  return [ref, t];
}

const DotField = ({ minor = 26, opacity = 1, color = '255,255,255' }) => (
  <div style={{ position: 'absolute', inset: '-200%', pointerEvents: 'none', opacity: `calc(var(--qf-dot, 1) * ${opacity})`,
    backgroundImage: `radial-gradient(circle, rgba(${color},0.10) 1px, transparent 1px),
                      radial-gradient(circle, rgba(${color},0.045) 1px, transparent 1px)`,
    backgroundSize: `${minor * 4}px ${minor * 4}px, ${minor}px ${minor}px` }} />
);

// Glowing routed cables. layout: {id -> {x,y,w,h}} override (else tile coords).
function CableLayer({ tiles, cables, tilesById, selected, tick, worldW, worldH, thin = false }) {
  return (
    <svg width={worldW} height={worldH} style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}>
      <defs>
        <filter id="cableGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3.2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {cables.map(c => {
        const a = tilesById[c.from], b = tilesById[c.to];
        if (!a || !b) return null;
        const { d, p1, p2, mid } = cablePath(a, b);
        const cs = CABLE[c.state];
        const hot = selected === c.from || selected === c.to;
        const baseW = thin ? 1.2 : 1.7;
        return (
          <g key={c.id} opacity={hot ? 1 : 0.92}>
            {/* under-glow for live cables */}
            {(c.state === 'active' || c.state === 'approved' || c.state === 'awaiting') && (
              <path d={d} stroke={cs.color} strokeWidth={baseW + 2.6} fill="none"
                    opacity={0.16} filter="url(#cableGlow)" />
            )}
            <path d={d} stroke={cs.color} strokeWidth={hot ? baseW + 0.6 : baseW} fill="none"
                  strokeDasharray={cs.dash || undefined} strokeLinecap="round" />
            {/* animated flow overlay */}
            {cs.flow && (
              <path d={d} stroke="#eafff4" strokeWidth={baseW} fill="none" className="qf-flowline"
                    strokeDasharray="2 16" strokeLinecap="round" opacity={0.85}
                    style={{ animationDelay: `${(tick % 3) * -0.2}s` }} />
            )}
            {/* end ports */}
            {[p1, p2].map((p, i) => (
              <g key={i}>
                {cs.flow && <circle cx={p.x} cy={p.y} r={5.5} fill={cs.color} opacity={0.18} />}
                <circle cx={p.x} cy={p.y} r={3} fill="#0b0f15" stroke={cs.color} strokeWidth={1.4} />
              </g>
            ))}
            {/* state badge on selected-adjacent / non-active cables */}
            {(c.state === 'error' || c.state === 'awaiting' || (hot && c.state !== 'stale')) && (
              <g transform={`translate(${mid.x}, ${mid.y})`}>
                <rect x={-26} y={-9} width={52} height={18} rx={9} fill="#0b0f15"
                      stroke={cs.color} strokeWidth={0.9} opacity={0.95} />
                <text x={0} y={3.5} textAnchor="middle" fontFamily="var(--mono)" fontSize={8.5}
                      letterSpacing="0.06em" fill={cs.color}
                      style={{ textTransform: 'uppercase' }}>{cs.label}</text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

Object.assign(window, { useFitScale, DotField, CableLayer });
