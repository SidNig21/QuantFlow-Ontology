import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { handoffPortEndpoints, handoffPortSides } from "./handoff-layer.js";

function tile(id: string, x: number, y: number, width = 200, height = 120) {
  return { id, x, y, width, height };
}

function element(rects: Record<string, { left: number; top: number; width: number; height: number }>, options: { hidden?: boolean; display?: string; projection?: string } = {}) {
  return {
    hidden: options.hidden ?? false,
    style: { display: options.display ?? "" },
    dataset: { qfProjectionVisibility: options.projection ?? "normal" },
    querySelector(selector: string) {
      const rect = rects[selector];
      return rect ? { getBoundingClientRect: () => rect } : null;
    },
  };
}

describe("task handoff cable attachment", () => {
	test("shared tile reposition lifecycle redraws handoffs without polling", () => {
		const renderer = readFileSync(new URL("./renderer.js", import.meta.url), "utf8");
		const callback = renderer.match(/onReposition:\s*\(\)\s*=>\s*\{([\s\S]*?)\n\s*\},\n\s*onSaveDebounced/)?.[1] ?? "";
		expect(callback).toContain("handoffLayer.update()");
		expect(callback).not.toContain("setInterval");
	});

  test("uses actual facing port centers and follows drag and resize geometry", () => {
    const from = tile("director", 0, 0);
    const to = tile("worker", 500, 0);
    expect(handoffPortSides(from, to)).toEqual({ from: "e", to: "w" });
    const layer = { left: 20, top: 30 };
    const first = handoffPortEndpoints(from, to,
      element({ ".gl-node--e": { left: 215, top: 85, width: 10, height: 10 } }),
      element({ ".gl-node--w": { left: 515, top: 85, width: 10, height: 10 } }), layer);
    expect(first).toEqual({ from: { x: 200, y: 60 }, to: { x: 500, y: 60 } });

    from.x = 100; from.width = 260; to.y = 220;
    const moved = handoffPortEndpoints(from, to,
      element({ ".gl-node--e": { left: 375, top: 85, width: 10, height: 10 } }),
      element({ ".gl-node--w": { left: 515, top: 305, width: 10, height: 10 } }), layer);
    expect(moved).toEqual({ from: { x: 360, y: 60 }, to: { x: 500, y: 280 } });
    expect(moved).not.toEqual(first);
  });

  test("suppresses a cable when either exact endpoint is absent, hidden, or fullscreen-suppressed", () => {
    const from = tile("director", 0, 0);
    const to = tile("worker", 500, 0);
    const ports = { ".gl-node--e": { left: 195, top: 55, width: 10, height: 10 }, ".gl-node--w": { left: 495, top: 55, width: 10, height: 10 } };
    const layer = { left: 0, top: 0 };
    expect(handoffPortEndpoints(from, to, null, element(ports), layer)).toBeNull();
    expect(handoffPortEndpoints(from, to, element(ports, { hidden: true }), element(ports), layer)).toBeNull();
    expect(handoffPortEndpoints(from, to, element(ports), element(ports, { display: "none" }), layer)).toBeNull();
    expect(handoffPortEndpoints(from, to, element(ports), element(ports, { projection: "hidden" }), layer)).toBeNull();
    expect(handoffPortEndpoints(from, to, element(ports), element(ports), layer, "director")).toBeNull();
  });
});
