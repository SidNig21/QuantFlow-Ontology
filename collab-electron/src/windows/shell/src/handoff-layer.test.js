import { describe, expect, test } from "bun:test";
import {
	refreshTaskDelegationCanvas,
	handoffEdgeEndpoints,
	sessionsForTaskDelegationCanvas,
	visibleTaskHandoffs,
} from "./handoff-layer.js";

const completedHandoff = {
	taskId: "task-1",
	title: "Read fixture market",
	status: "done",
	fromSessionId: "session-orchestrator",
	toSessionId: "session-worker",
	fromRole: "orchestrator",
	toRole: "worker",
};

const closedEndpointSessions = [
	{ id: "session-orchestrator", status: "closed" },
	{ id: "session-worker", status: "closed" },
	{ id: "session-unrelated", status: "closed" },
];

describe("task delegation canvas projection", () => {
	test("1280 and 2560 layouts terminate the active relationship at tile edges, never inside content", () => {
		for (const width of [1280, 2560]) {
			const from = { x: width * .08, y: 120, width: 420, height: 320 };
			const to = { x: width * .62, y: width === 1280 ? 430 : 690, width: 420, height: 320 };
			const points = handoffEdgeEndpoints(from, to);
			const strictlyInside = (point, rect) => point.x > rect.x && point.x < rect.x + rect.width && point.y > rect.y && point.y < rect.y + rect.height;
			expect(strictlyInside(points.from, from)).toBe(false);
			expect(strictlyInside(points.to, to)).toBe(false);
		}
	});
	test("shows only active cross-participant work", () => {
		const sameSeat = {
			...completedHandoff,
			fromSessionId: "session-orchestrator",
			toSessionId: "session-orchestrator",
		};
		const openHandoff = { ...completedHandoff, status: "open" };
		expect(visibleTaskHandoffs([sameSeat, completedHandoff, openHandoff])).toEqual([openHandoff]);
	});

	test("refresh projects a cross-session handoff exactly once and omits same-seat projection", async () => {
		const sameSeat = {
			...completedHandoff,
			taskId: "task-same-seat",
			fromSessionId: "session-orchestrator",
			toSessionId: "session-orchestrator",
		};
		let renderedHandoffs = [];
		await refreshTaskDelegationCanvas({
			listHandoffs: async () => ({ ok: true, handoffs: [sameSeat, { ...completedHandoff, status: "open" }] }),
			listSessions: async () => ({ ok: true, sessions: closedEndpointSessions }),
			ensureSessionTile() {},
			setHandoffs(handoffs) { renderedHandoffs = handoffs; },
		});
		expect(renderedHandoffs).toEqual([{ ...completedHandoff, status: "open" }]);
	});

	test("keeps both closed task endpoints without restoring unrelated history", () => {
		expect(sessionsForTaskDelegationCanvas(
			closedEndpointSessions,
			[completedHandoff],
		).map((session) => session.id)).toEqual([
			"session-orchestrator",
			"session-worker",
		]);
	});

	test("does not reopen completed delegation tiles or cables on launch", async () => {
		async function launch() {
			const events = [];
			const tiles = [];
			let renderedHandoffs = [];

			await refreshTaskDelegationCanvas({
				listHandoffs: async () => {
					events.push("read-handoffs");
					return { ok: true, handoffs: [{ ...completedHandoff }] };
				},
				listSessions: async () => {
					events.push("read-sessions");
					return {
						ok: true,
						sessions: closedEndpointSessions.map((session) => ({ ...session })),
					};
				},
				ensureSessionTile(sessionId) {
					tiles.push(sessionId);
					events.push(`tile:${sessionId}`);
				},
				setHandoffs(handoffs) {
					renderedHandoffs = handoffs;
					events.push("render-cable");
				},
			});

			return { events, tiles, renderedHandoffs };
		}

		const firstLaunch = await launch();
		const relaunched = await launch();
		for (const projection of [firstLaunch, relaunched]) {
			expect(projection.tiles).toEqual([]);
			expect(projection.renderedHandoffs).toEqual([]);
			expect(projection.events).toEqual([
				"read-handoffs",
				"read-sessions",
				"render-cable",
			]);
		}
	});
});
