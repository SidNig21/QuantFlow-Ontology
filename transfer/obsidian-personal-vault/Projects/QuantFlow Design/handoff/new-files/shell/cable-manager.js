// cable-manager.js
// In-renderer state for cables. Mirrors tile-manager.js patterns.
// State lives in canvas-state.json (schema bump v1 → v2; see HANDOFF.md §3).

const listeners = new Set();
let cables = [];

export function init(initial = []) {
  cables = initial.map(normalize);
}

function normalize(c) {
  return {
    id: c.id || `cable-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    from: { tileId: c.from.tileId, side: c.from.side },
    to:   { tileId: c.to.tileId,   side: c.to.side   },
    kind: c.kind || 'pipe',
    createdAt: c.createdAt || new Date().toISOString(),
  };
}

export function list() { return cables; }
export function byId(id) { return cables.find(c => c.id === id); }

export function add(c) {
  const created = normalize(c);
  cables = [...cables, created];
  notify();
  // IPC: persist + (if both endpoints are terminal tiles) wire stdout→stdin.
  if (window.api?.cableCreate) window.api.cableCreate(created);
  return created;
}

export function remove(id) {
  cables = cables.filter(c => c.id !== id);
  notify();
  if (window.api?.cableDelete) window.api.cableDelete(id);
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() { for (const fn of listeners) fn(); }
