import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("canvas persistence", () => {
  const stateDir = join(tmpdir(), `collab-canvas-persistence-${Date.now()}`);

  beforeAll(() => {
    mkdirSync(stateDir, { recursive: true });
    process.env.COLLAB_DIR_OVERRIDE = stateDir;
  });

  afterAll(() => {
    delete process.env.COLLAB_DIR_OVERRIDE;
    rmSync(stateDir, { recursive: true, force: true });
  });

  test("saveState/loadState round-trips revision and connections", async () => {
    const { loadState, saveState } = await import("./canvas-persistence");

    await saveState({
      version: 1,
      revision: 7,
      tiles: [
        {
          id: "tile-a",
          type: "term",
          x: 0,
          y: 0,
          width: 400,
          height: 500,
          zIndex: 1,
        },
        {
          id: "tile-b",
          type: "term",
          x: 420,
          y: 0,
          width: 400,
          height: 500,
          zIndex: 2,
        },
      ],
      connections: [
        {
          id: "connection-1",
          sourceId: "tile-a",
          targetId: "tile-b",
          transport: "agent-channel",
          endpointKind: "agent",
          active: true,
        },
      ],
      viewport: {
        centerX: 0,
        centerY: 0,
        zoom: 1,
      },
    });

    const loaded = await loadState();

    expect(loaded?.revision).toBe(7);
    expect(loaded?.connections).toHaveLength(1);
    expect(loaded?.connections?.[0]?.transport).toBe("agent-channel");
  });
});
