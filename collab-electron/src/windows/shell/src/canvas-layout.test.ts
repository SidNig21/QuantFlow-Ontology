import { describe, expect, test } from "bun:test";
import { formatTidyToast, repackTilesToGrid } from "./canvas-layout.js";

function overlap(a: { x: number; y: number; width: number; height: number }, b: typeof a) {
  return a.x < b.x + b.width && a.x + a.width > b.x &&
    a.y < b.y + b.height && a.y + a.height > b.y;
}

function assertNoOverlap(tiles: Array<{ x: number; y: number; width: number; height: number }>) {
  for (let index = 0; index < tiles.length; index++) {
    for (const other of tiles.slice(index + 1)) {
      expect(overlap(tiles[index], other)).toBe(false);
    }
  }
}

describe("canvas Tidy layout", () => {
  test("packs eligible tiles without changing identity or session bindings", () => {
    const tiles = [
      { id: "worker", type: "term", x: 780, y: 620, width: 420, height: 500, sessionId: "session-worker", ptySessionId: "pty-worker", zIndex: 2 },
      { id: "note", type: "note", x: 20, y: 20, width: 420, height: 260, zIndex: 1 },
      { id: "locked", type: "term", x: 40, y: 40, width: 220, height: 160, locked: true, sessionId: "session-locked", zIndex: 3 },
    ];
    const identities = tiles.map(({ id, sessionId, ptySessionId }) => ({ id, sessionId, ptySessionId }));

    const result = repackTilesToGrid(tiles, { viewportWidth: 980 });

    expect(result.tidied).toBeGreaterThan(0);
    expect(result.skipped).toBe(1);
    expect(tiles.map(({ id, sessionId, ptySessionId }) => ({ id, sessionId, ptySessionId }))).toEqual(identities);
    expect(tiles.filter((tile) => !tile.locked).every((tile) => tile.x % 20 === 0 && tile.y % 20 === 0)).toBe(true);
    assertNoOverlap(tiles);
    expect(tiles.find((tile) => tile.id === "locked")).toMatchObject({ x: 40, y: 40 });
  });

  test("places wide tiles around locked obstacles without overlap", () => {
    const tiles = [
      { id: "locked-obstacle", type: "term", x: 40, y: 40, width: 280, height: 520, locked: true, sessionId: "locked-session" },
      { id: "wide-agent", type: "term", x: 900, y: 900, width: 720, height: 320, definitionId: "hermes-worker", sessionId: "wide-session", ptySessionId: "wide-pty" },
      { id: "small-note", type: "note", x: 1100, y: 700, width: 260, height: 180 },
    ];
    const bindings = tiles.map(({ id, sessionId, ptySessionId }) => ({ id, sessionId, ptySessionId }));

    repackTilesToGrid(tiles, { viewportWidth: 1100 });

    expect(tiles.map(({ id, sessionId, ptySessionId }) => ({ id, sessionId, ptySessionId }))).toEqual(bindings);
    expect(tiles.find((tile) => tile.id === "locked-obstacle")).toMatchObject({ x: 40, y: 40 });
    expect(tiles.find((tile) => tile.id === "wide-agent")?.x).toBe(340);
    assertNoOverlap(tiles);
  });

  test("starts from the visible world origin after the canvas is panned", () => {
    const tiles = [
      { id: "panned-a", type: "term", x: 20, y: 20, width: 420, height: 280 },
      { id: "panned-b", type: "note", x: 900, y: 900, width: 420, height: 280 },
    ];

    repackTilesToGrid(tiles, {
      viewportWidth: 1000,
      zoom: 1,
      screenSpace: true,
      originX: 260,
      originY: 180,
    });

    expect(tiles[0]).toMatchObject({ x: 260, y: 180 });
    expect(tiles.every((tile) => tile.x >= 260 && tile.y >= 180)).toBe(true);
    assertNoOverlap(tiles);
  });

  test("reports a readable operator result", () => {
    expect(formatTidyToast({ tidied: 2, skipped: 1 })).toBe("Tidied 2 tiles; 1 locked skipped");
    expect(formatTidyToast({ tidied: 0, skipped: 0 })).toBe("No tiles to tidy");
  });
});
