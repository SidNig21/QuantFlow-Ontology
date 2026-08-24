import { expect, test } from "bun:test";
import { participantFieldRows, participantView, participantViewForSession } from "./participant-projection.js";

test("participant projection keeps planning copy on the exact Director only", () => {
  const planning = participantView({
    session: { id: "director-1", status: "running" },
    definition: { role: "orchestrator", display_name: "Research Director", runtime_profile: "hermes" },
    planningDirector: { sessionId: "director-1", missionId: "mission-1" },
    missionBinding: { missionId: "mission-1", hasTask: false },
  });
  const ordinary = participantView({
    session: { id: "worker-1", status: "running" },
    definition: { role: "worker", display_name: "Market Researcher", runtime_profile: "hermes" },
    planningDirector: { sessionId: "director-1", missionId: "mission-1" },
    missionBinding: { missionId: "mission-1", hasTask: false },
  });
  expect(planning.task).toBe("Planning mission");
  expect(planning.work).toBe("unassigned");
  expect(ordinary.task).toBe("Not recorded");
  expect(ordinary.work).toBe("unassigned");
});

test("participant projection keeps session, runtime, work, and recovery independent", () => {
  const view = participantView({
    session: { id: "worker-1", status: "closed" },
    definition: { role: "worker", display_name: "Market Researcher", runtime_profile: "hermes", availability: { available: true }, capability_groups: ["desk.orchestrate"] },
    task: { taskId: "task-1", title: "Finished task", status: "done", assignmentState: "assigned", assignedToSessionId: "worker-1" },
    runtimeObservation: { live: false },
    producedArtifact: { id: "artifact-1", fields: { kind: "result_set" } },
  });
  expect(view.session).toBe("closed");
  expect(view.runtimeState).toBe("stopped");
  expect(view.work).toBe("completed");
  expect(view.recovery).toBe("restartable");
  expect(participantFieldRows(view).map((row) => row.field)).toEqual([
    "role", "runtime", "session", "runtime state", "work", "recovery", "recruiter / reason", "Task", "output",
  ]);
});

test("participant projection keeps current and historical sessions distinct by id", () => {
  const world = {
    root: { type: "mission", id: "mission-review" },
    objects: [
      { type: "task", id: "review-task", fields: {} },
      { type: "artifact", id: "critic-output", fields: { kind: "evaluation_findings" } },
    ],
    links: [{ kind: "produces", from_id: "critic-old", to_id: "critic-output" }],
  };
  const sessions = [
    { id: "critic-old", status: "closed", definition_id: "critic-definition" },
    { id: "critic-current", status: "running", definition_id: "critic-definition" },
  ];
  const definitions = [{ id: "critic-definition", role: "critic", display_name: "Critic", runtime_profile: "hermes", availability: { available: true } }];
  const assignments = [
    { taskId: "review-task", title: "Independent research review", status: "done", assignmentState: "assigned", assignedToSessionId: "critic-old" },
  ];
  const historical = participantViewForSession({ sessionId: "critic-old", sessions, definitions, assignments, world });
  const current = participantViewForSession({ sessionId: "critic-current", sessions, definitions, assignments, world });

  expect(historical.id).toBe("critic-old");
  expect(historical.runtimeState).toBe("stopped");
  expect(historical.session).toBe("closed");
  expect(historical.work).toBe("completed");
  expect(historical.historical).toBe(true);
  expect(current.id).toBe("critic-current");
  expect(current.runtimeState).toBe("running");
  expect(current.session).toBe("active");
  expect(current.work).toBe("unassigned");
  expect(current.historical).toBe(false);
});

test("Dock and Canvas consume the same participant projection seam", async () => {
  const dock = await Bun.file(new URL("./dock.js", import.meta.url)).text();
  const renderer = await Bun.file(new URL("./renderer.js", import.meta.url)).text();
  expect(dock).toContain("participantViewForSession");
  expect(renderer).toContain("participantViewForSession");
  expect(dock).not.toContain("runtimeObservation: { live: session?.status === \"running\" }");
  expect(renderer).not.toContain("runtimeObservation: { live: Boolean(term?.ptySessionId)");
});
