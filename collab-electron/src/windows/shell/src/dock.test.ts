import { describe, expect, test } from "bun:test";
import {
	dockDefinitionDisplayName,
	formatDockTeamSummary,
	formatDockSessionState,
	launchableDockDefinitions,
	researchDirectorRunningStatus,
  visibleDockDefinitions,
  visibleDockSessions,
} from "./dock.js";

describe("Research Dock launchable inventory projection", () => {
	const definitions = [
		{ id: "z", display_name: "Worker", availability: { available: true } },
		{ id: "b", role: "Critic", availability: { available: true } },
		{ id: "a", role: "Critic", availability: { available: true } },
		{ id: "missing", availability: { available: true } },
		{ id: "offline", display_name: "Director", availability: { available: false } },
	];

	test("filters once, applies fallback, sorts by rendered name/id, and preserves duplicate roles", () => {
		const before = structuredClone(definitions);
		const rows = launchableDockDefinitions(definitions, { qaMode: true });
		expect(rows.map((row) => row.id)).toEqual(["a", "b", "missing", "z"]);
		expect(rows.map(dockDefinitionDisplayName)).toEqual(["Critic", "Critic", "Not recorded", "Worker"]);
		expect(definitions).toEqual(before);
		expect(formatDockTeamSummary(definitions, { qaMode: true })).toBe(
			"Available team: 4 — Critic, Critic, Not recorded, Worker",
		);
	});

	test("uses the literal zero-inventory summary", () => {
		expect(formatDockTeamSummary([], { qaMode: true })).toBe("Available team: 0 — None recorded");
	});
});

test("Research Director status binds the returned Mission id", () => {
  expect(researchDirectorRunningStatus("mission-123")).toBe(
    "Research Director running · Mission mission-123",
  );
});

describe("production Dock inventory", () => {
  const definitions = [
    { id: "hermes-worker", name: "Hermes worker", package_ref: "species/hermes/packed/hermes.aospkg" },
    { id: "qf-toolloop", name: "QF ToolLoop", package_ref: "tools/runtime-proof/packed/qf-toolloop.aospkg" },
    { id: "qf-proof-orchestrator", name: "Proof orchestrator", package_ref: "tools/qf-proof-agent/packed/qf-proof-agent.aospkg" },
    { id: "qf-proof-worker", name: "Proof worker", package_ref: "tools/qf-proof-agent/packed/qf-proof-agent.aospkg" },
  ];

  test("hides deterministic proof fixtures by default", () => {
    expect(visibleDockDefinitions(definitions).map((row) => row.id)).toEqual([
      "hermes-worker",
    ]);
  });

  test("requires explicit QA mode to show proof fixtures", () => {
    expect(visibleDockDefinitions(definitions, { qaMode: true }).map((row) => row.id)).toEqual([
      "hermes-worker",
      "qf-toolloop",
      "qf-proof-orchestrator",
      "qf-proof-worker",
    ]);
  });
});

describe("Dock sessions Clear view filter", () => {
  const sessions = [
    { id: "old-closed", status: "closed", created_at: "2026-08-01T00:00:00.000Z" },
    { id: "live", status: "running", created_at: "2026-08-01T00:00:00.000Z" },
    { id: "new-closed", status: "closed", created_at: "2026-08-04T12:00:00.000Z" },
  ];

  test("without cursor shows every Kernel row", () => {
    expect(visibleDockSessions(sessions, null).map((row) => row.id)).toEqual([
      "old-closed",
      "live",
      "new-closed",
    ]);
  });

  test("cursor hides terminal rows at-or-before without deleting them", () => {
    const visible = visibleDockSessions(sessions, "2026-08-03T00:00:00.000Z");
    expect(visible.map((row) => row.id)).toEqual(["live", "new-closed"]);
    expect(sessions).toHaveLength(3);
  });

  test("live sessions stay visible even when older than the cursor", () => {
    expect(
      visibleDockSessions(sessions, "2099-01-01T00:00:00.000Z").map((row) => row.id),
    ).toEqual(["live"]);
  });
});

describe("Dock session state labels (WO-g3)", () => {
  test("live and blocked use Kernel status text", () => {
    expect(formatDockSessionState({ status: "running" })).toEqual({
      text: "running",
      kind: "live",
    });
    expect(formatDockSessionState({ status: "blocked" })).toEqual({
      text: "blocked",
      kind: "blocked",
    });
  });

  test("terminal sessions never invent exit 0 when code is missing", () => {
    expect(formatDockSessionState({ status: "closed" })).toEqual({
      text: "closed · exit n/a",
      kind: "terminal",
    });
    expect(formatDockSessionState({ status: "failed", exit_code: 130 })).toEqual({
      text: "exit 130",
      kind: "terminal",
    });
  });
});
