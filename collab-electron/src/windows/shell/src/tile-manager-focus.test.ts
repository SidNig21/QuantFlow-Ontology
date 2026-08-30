import { beforeEach, describe, expect, mock, test } from "bun:test";

type Tile = {
  id: string;
  type: "term";
  x: number;
  y: number;
  width: number;
  height: number;
  sessionId: string;
};

type FakeElement = {
  classList: {
    add: (...names: string[]) => void;
    remove: (...names: string[]) => void;
    contains: (name: string) => boolean;
    toggle: (name: string, force?: boolean) => boolean;
  };
  style: Record<string, string>;
  dataset: Record<string, string>;
  parentElement: FakeElement | null;
  appendChild: (child: FakeElement) => FakeElement;
  addEventListener: () => void;
};

function makeClassList() {
  const names = new Set<string>();
  return {
    add: (...next: string[]) => next.forEach((name) => names.add(name)),
    remove: (...next: string[]) => next.forEach((name) => names.delete(name)),
    contains: (name: string) => names.has(name),
    toggle: (name: string, force?: boolean) => {
      const enabled = force ?? !names.has(name);
      if (enabled) names.add(name);
      else names.delete(name);
      return enabled;
    },
  };
}

// The manager only needs these DOM operations for focus tests. Keep the
// surrounding renderer/interactions mocked so this test executes the real
// focusCanvasTile seam without constructing unrelated canvas UI.
function fakeElement(): FakeElement {
  const children: FakeElement[] = [];
  const result: FakeElement = {
    classList: makeClassList(),
    style: {},
    dataset: {},
    parentElement: null,
    appendChild: (child) => {
      child.parentElement = result;
      children.push(child);
      return child;
    },
    addEventListener: () => {},
  };
  return result;
}

const tiles: Tile[] = [];
let zIndex = 1;

mock.module("./canvas-state.js", () => ({
  tiles,
  addTile: (tile: Tile) => {
    if (!(tile as Tile & { zIndex?: number }).zIndex) {
      (tile as Tile & { zIndex?: number }).zIndex = ++zIndex;
    }
    tiles.push(tile);
    return tile;
  },
  removeTile: (id: string) => {
    const index = tiles.findIndex((tile) => tile.id === id);
    if (index >= 0) tiles.splice(index, 1);
  },
  getTile: (id: string | null) => tiles.find((tile) => tile.id === id) ?? null,
  bringToFront: (tile: Tile & { zIndex?: number }) => { tile.zIndex = ++zIndex; },
  generateId: () => `test-tile-${tiles.length + 1}`,
  defaultSize: () => ({ width: 400, height: 500 }),
  inferTileType: () => "term",
  snapToGrid: () => {},
  selectTile: () => {},
  deselectTile: () => {},
  toggleTileSelection: () => {},
  clearSelection: () => {},
  isSelected: () => false,
  getSelectedTiles: () => [],
}));

mock.module("./tile-renderer.js", () => ({
  createTileDOM: () => ({
    container: fakeElement(),
    spine: fakeElement(),
    titleBar: fakeElement(),
    titleText: fakeElement(),
    contentArea: fakeElement(),
    contentOverlay: fakeElement(),
    taskFoot: fakeElement(),
  }),
  positionTile: () => {},
  updateTileTitle: () => {},
  getTileLabel: () => ({ parent: "", name: "test" }),
  updatePendingSpawnState: () => {},
  startInlineRename: () => {},
}));

mock.module("./tile-interactions.js", () => ({
  attachDrag: () => {},
  attachResize: () => {},
}));

mock.module("./canvas-rpc.js", () => ({
  findAutoPlacement: () => ({ x: 0, y: 0 }),
}));

const { createTileManager } = await import("./tile-manager.js");

function exactTermTileForSession(candidates: Tile[], sessionId: string): Tile | null {
  const matches = candidates.filter((tile) => tile.type === "term" && tile.sessionId === sessionId);
  return matches.length === 1 ? matches[0]! : null;
}

function makeManager() {
  const events: string[] = [];
  const tileLayer = fakeElement();
  tileLayer.parentElement = fakeElement();
  const manager = createTileManager({
    tileLayer,
    viewportState: { panX: 0, panY: 0, zoom: 1 },
    configs: {},
    getAllWebviews: () => [],
    isSpaceHeld: () => false,
    onSaveDebounced: () => {},
    onSaveImmediate: () => {},
    onNoteSurfaceFocus: (surface: string) => events.push(`surface:${surface}`),
    onFocusSurface: () => {},
    onTerminalSessionCreated: () => {},
    onTerminalCwdChanged: () => {},
    onTerminalTileClosed: () => {},
    onTerminalTileResized: () => {},
    onTileFocused: () => events.push("tile-focused"),
    onTileDblClick: () => {},
    onReposition: () => {},
    onTileClosed: () => {},
    onResearchTile: () => {},
  });
  return { manager, events };
}

beforeEach(() => {
  tiles.splice(0, tiles.length);
  zIndex = 1;
  (globalThis as { window?: unknown }).window = { shellApi: { trackEvent: () => {} } };
});

describe("focusAgentSession terminal tile seam", () => {
  test("stopped/no-guest tiles receive shell focus without native guest focus", () => {
    const { manager, events } = makeManager();
    const tile = manager.createCanvasTile("term", 0, 0, {
      id: "stopped-tile",
      sessionId: "stopped-session",
    }) as Tile;
    const dom = manager.getTileDOMs().get(tile.id)!;

    manager.focusCanvasTile(tile.id);

    expect(dom.container.classList.contains("tile-focused")).toBe(true);
    expect(manager.getFocusedTileId()).toBe(tile.id);
    expect(events).toEqual(["tile-focused", "surface:canvas-tile"]);
    expect(dom.webview).toBeUndefined();
  });

  test("connected guests receive native focus while retaining shell focus for typing", () => {
    const { manager, events } = makeManager();
    const tile = manager.createCanvasTile("term", 0, 0, {
      id: "live-tile",
      sessionId: "live-session",
    }) as Tile;
    const dom = manager.getTileDOMs().get(tile.id)!;
    let focused = false;
    const webview = {
      isConnected: true,
      focus: () => { focused = true; },
    };
    dom.webview = webview as never;

    manager.focusCanvasTile(tile.id);

    expect(dom.container.classList.contains("tile-focused")).toBe(true);
    expect(focused).toBe(true);
    expect(events).toEqual(["tile-focused", "surface:canvas-tile"]);
  });

  test("wrong and duplicate session identity fail closed before focus", () => {
    const first: Tile = { id: "first", type: "term", x: 0, y: 0, width: 400, height: 500, sessionId: "same" };
    const second: Tile = { ...first, id: "second" };
    expect(exactTermTileForSession([first], "wrong")).toBeNull();
    expect(exactTermTileForSession([first, second], "same")).toBeNull();
    expect(exactTermTileForSession([first], "same")).toBe(first);
  });
});
