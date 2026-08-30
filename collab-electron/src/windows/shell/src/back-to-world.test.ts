import { describe, expect, test } from "bun:test";
import { bindBackToWorldControls } from "./research-world.js";

class FakeControl {
  constructor(private readonly selectors: string) {}

  closest(selector: string): FakeControl | null {
    return selector.includes(this.selectors) ? this : null;
  }
}

class FakeDocument {
  private readonly listeners = new Map<string, (event: { target: FakeControl }) => void>();

  addEventListener(type: string, listener: (event: { target: FakeControl }) => void): void {
    this.listeners.set(type, listener);
  }

  removeEventListener(type: string, listener: (event: { target: FakeControl }) => void): void {
    if (this.listeners.get(type) === listener) this.listeners.delete(type);
  }

  contains(): boolean {
    return true;
  }

  activate(control: FakeControl): void {
    this.listeners.get("click")?.({ target: control });
  }
}

describe("Back to world restoration seam", () => {
  test("Canvas and Dock controls share one ephemeral action, including a replaced painted target", () => {
    const document = new FakeDocument();
    let projection = "FULL_LINEAGE";
    let domainIpcCalls = 0;
    let restorationCount = 0;
    const dispose = bindBackToWorldControls(document, () => {
      restorationCount += 1;
      projection = "ORDINARY_CANVAS";
    });
    const canvasControl = new FakeControl("[data-qf-world-back]");
    const replacedCanvasControl = new FakeControl("[data-qf-world-back]");
    const dockControl = new FakeControl("[data-qf-back-to-world]");

    document.activate(canvasControl);
    expect(projection).toBe("ORDINARY_CANVAS");
    projection = "FULL_LINEAGE";
    document.activate(replacedCanvasControl);
    expect(projection).toBe("ORDINARY_CANVAS");
    projection = "FULL_LINEAGE";
    document.activate(dockControl);
    expect(projection).toBe("ORDINARY_CANVAS");
    expect(restorationCount).toBe(3);
    expect(domainIpcCalls).toBe(0);

    dispose();
    projection = "FULL_LINEAGE";
    document.activate(canvasControl);
    expect(projection).toBe("FULL_LINEAGE");
  });
});
