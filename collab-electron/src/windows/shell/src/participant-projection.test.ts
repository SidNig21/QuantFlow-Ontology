import { expect, test } from "bun:test";
import { participantFieldRows, participantView } from "./participant-projection.js";

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
