import { describe, expect, test } from "bun:test";
import {
  clearPendingDragTarget,
  createPendingDragState,
  hoverPendingDragTarget,
  movePendingDrag,
} from "./connection-overlay.js";

describe("connection overlay drag state", () => {
  test("starts in dragging state", () => {
    const drag = createPendingDragState("tile-a", 10, 20);

    expect(drag.state).toBe("dragging");
    expect(drag.targetTileId).toBeNull();
  });

  test("moving the pointer updates drag coordinates without changing the state", () => {
    const moved = movePendingDrag(
      createPendingDragState("tile-a", 10, 20),
      80,
      120,
    );

    expect(moved.currentX).toBe(80);
    expect(moved.currentY).toBe(120);
    expect(moved.state).toBe("dragging");
  });

  test("hovering a valid target enters snap-valid", () => {
    const next = hoverPendingDragTarget(
      createPendingDragState("tile-a", 10, 20),
      "tile-b",
      true,
    );

    expect(next.state).toBe("snap-valid");
    expect(next.targetTileId).toBe("tile-b");
  });

  test("hovering an invalid target enters snap-invalid and leaving it returns to dragging", () => {
    const invalid = hoverPendingDragTarget(
      createPendingDragState("tile-a", 10, 20),
      "tile-b",
      false,
    );
    const cleared = clearPendingDragTarget(invalid, "tile-b");

    expect(invalid.state).toBe("snap-invalid");
    expect(cleared.state).toBe("dragging");
    expect(cleared.targetTileId).toBeNull();
  });
});
