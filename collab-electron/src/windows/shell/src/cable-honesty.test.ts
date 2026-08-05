import { describe, expect, test } from "bun:test";
import {
	cableStrokeStyle,
	runtimeHonoursViewConnections,
} from "./cable-overlay.js";
import { createCableController } from "./cable-controller.js";

describe("WO-g5 cable honesty", () => {
	test("runtime does not honour view edges yet", () => {
		expect(runtimeHonoursViewConnections()).toBe(false);
	});

	test("declared view cables are dashed with hollow nodes", () => {
		const style = cableStrokeStyle({ kind: "view" }, false);
		expect(style.strokeDasharray).toBe("7 5");
		expect(style.hollowNodes).toBe(true);
		expect(style.className).toContain("declared");
	});

	test("honoured view cables would be solid (not used until runtime ready)", () => {
		const style = cableStrokeStyle({ kind: "view" }, true);
		expect(style.strokeDasharray).toBe("none");
		expect(style.hollowNodes).toBe(false);
	});
});

describe("WO-g5 keyboard create seam", () => {
	test("keyboardCreate commits view edge without pointer", async () => {
		const created = [];
		const fakeEl = {
			addEventListener() {},
			removeEventListener() {},
			setPointerCapture() {},
			releasePointerCapture() {},
		};
		const styleNode = { remove() {} };
		const prevDoc = globalThis.document;
		const prevWin = globalThis.window;
		globalThis.document = {
			createElement: () => styleNode,
			head: { appendChild() {} },
			elementFromPoint: () => null,
		};
		globalThis.window = {
			addEventListener() {},
			removeEventListener() {},
		};
		try {
			const controller = createCableController({
				canvasEl: fakeEl,
				overlay: {
					redraw() {},
					clearPreview() {},
					setPreview() {},
					screenToWorld: (x, y) => ({ x, y }),
					getSelectedId: () => null,
				},
				getTiles: () => [
					{ id: "a", x: 0, y: 0, width: 100, height: 100 },
					{ id: "b", x: 200, y: 0, width: 100, height: 100 },
				],
				getTileDOMs: () => new Map(),
				loadConnections: async () => [],
				createConnection: async (args) => {
					created.push(args);
					return { id: "c-kbd", ...args };
				},
				deleteConnection: async () => {},
				onConnectionsChanged: () => {},
			});

			await controller.keyboardCreate(
				{ tileId: "a", side: "e" },
				{ tileId: "b", side: "w" },
			);
			expect(created).toHaveLength(1);
			expect(created[0].kind).toBe("view");
			expect(created[0].from).toBe("a:e");
			expect(created[0].to).toBe("b:w");
			controller.dispose();
		} finally {
			globalThis.document = prevDoc;
			globalThis.window = prevWin;
		}
	});
});
