import { describe, expect, test } from "bun:test";
import {
	refreshTaskDelegationCanvas,
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
	test("suppresses only zero-length same-session overlays", () => {
		const sameSeat = {
			...completedHandoff,
			fromSessionId: "session-orchestrator",
			toSessionId: "session-orchestrator",
		};
		expect(visibleTaskHandoffs([sameSeat, completedHandoff])).toEqual([completedHandoff]);
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
			listHandoffs: async () => ({ ok: true, handoffs: [sameSeat, completedHandoff] }),
			listSessions: async () => ({ ok: true, sessions: closedEndpointSessions }),
			ensureSessionTile() {},
			setHandoffs(handoffs) { renderedHandoffs = handoffs; },
		});
		expect(renderedHandoffs).toEqual([completedHandoff]);
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

	test("reopens completed delegation tiles before its cable on every launch", async () => {
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
			expect(projection.tiles).toEqual([
				"session-orchestrator",
				"session-worker",
			]);
			expect(projection.renderedHandoffs).toEqual([completedHandoff]);
			expect(projection.events).toEqual([
				"read-handoffs",
				"read-sessions",
				"tile:session-orchestrator",
				"tile:session-worker",
				"render-cable",
			]);
		}
	});
});
