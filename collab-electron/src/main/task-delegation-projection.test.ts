import { describe, expect, test } from "bun:test";
import {
  projectTaskDelegations,
  projectTaskAssignments,
  type DelegationLink,
  type TaskDelegationProjectionReader,
} from "./task-delegation-projection";

type Fixture = {
  tasks: Array<Record<string, unknown>>;
  links: Record<string, DelegationLink[]>;
};

function readerFor(fixture: Fixture): TaskDelegationProjectionReader {
  const definitions: Record<string, Record<string, unknown>> = {
    "definition-orchestrator": {
      id: "definition-orchestrator",
      role: "orchestrator",
      display_name: "Research Director",
    },
    "definition-worker": { id: "definition-worker", role: "worker" },
  };
  return {
    listTasks: () => fixture.tasks.map((task) => ({ ...task })),
    linksFrom: (id, kind) => (fixture.links[`${id}:${kind}`] ?? []).map((link) => ({ ...link })),
    getObject: (_type, id) => definitions[id] ?? null,
  };
}

function completeFixture(status: "open" | "done" = "open"): Fixture {
  return {
    tasks: [{
      id: "task-1",
      title: "Read fixture market",
      description: "Read the exact fixture market.",
      status,
    }],
    links: {
      "task-1:delegated_by": [{ from_id: "task-1", to_id: "session-orchestrator" }],
      "task-1:assigned_to": [{ from_id: "task-1", to_id: "session-worker" }],
      "session-orchestrator:spawned_from": [
        { from_id: "session-orchestrator", to_id: "definition-orchestrator" },
      ],
      "session-worker:spawned_from": [
        { from_id: "session-worker", to_id: "definition-worker" },
      ],
    },
  };
}

describe("projectTaskDelegations", () => {
  test("projects the complete durable task relationship without a peer bus", () => {
    expect(projectTaskDelegations(readerFor(completeFixture()))).toEqual([
      {
        taskId: "task-1",
        title: "Read fixture market",
        status: "open",
        fromSessionId: "session-orchestrator",
        toSessionId: "session-worker",
        fromRole: "orchestrator",
        toRole: "worker",
      },
    ]);
  });

  test("projects a fresh read of completed durable task rows", () => {
    const reopened = completeFixture("done");
    expect(projectTaskDelegations(readerFor(reopened))).toMatchObject([
      { taskId: "task-1", title: "Read fixture market", status: "done" },
    ]);
  });

  test("fails closed when either assignment link is missing or duplicated", () => {
    const missing = completeFixture();
    delete missing.links["task-1:delegated_by"];
    expect(projectTaskDelegations(readerFor(missing))).toEqual([]);

    const duplicated = completeFixture();
    duplicated.links["task-1:assigned_to"]!.push({
      from_id: "task-1",
      to_id: "session-worker-2",
    });
    expect(projectTaskDelegations(readerFor(duplicated))).toEqual([]);
  });
});

describe("projectTaskAssignments", () => {
  test("projects the exact Task presentation fields from Kernel lineage", () => {
    expect(projectTaskAssignments(readerFor(completeFixture()))).toEqual([{
      taskId: "task-1",
      title: "Read fixture market",
      status: "open",
      delegatorDisplayName: "Research Director",
      description: "Read the exact fixture market.",
      delegatedBySessionId: "session-orchestrator",
      assignedToSessionId: "session-worker",
      assignmentState: "assigned",
      unavailableSessionIds: [],
    }]);
  });

  test("fails closed for missing or malformed delegator lineage", () => {
    for (const variant of ["missing", "duplicate", "definition", "empty"] as const) {
      const fixture = completeFixture();
      const key = "session-orchestrator:spawned_from";
      if (variant === "missing") delete fixture.links[key];
      if (variant === "duplicate") fixture.links[key]!.push({
        from_id: "session-orchestrator",
        to_id: "definition-orchestrator",
      });
      if (variant === "definition") fixture.links[key] = [{
        from_id: "session-orchestrator",
        to_id: "definition-missing",
      }];
      if (variant === "empty") fixture.links[key] = [{
        from_id: "session-orchestrator",
        to_id: "definition-empty",
      }];
      const baseReader = readerFor(fixture);
      const projection = projectTaskAssignments({
        ...baseReader,
        getObject: (_type, id) => id === "definition-empty"
          ? { id, display_name: "   " }
          : baseReader.getObject(_type, id),
      });
      expect(projection[0]).toMatchObject({
        assignmentState: "unavailable",
        delegatorDisplayName: null,
        delegatedBySessionId: null,
        assignedToSessionId: null,
      });
    }
  });

  test("fails closed for missing or duplicated assignment links", () => {
    const missing = completeFixture();
    delete missing.links["task-1:assigned_to"];
    expect(projectTaskAssignments(readerFor(missing))[0]).toMatchObject({
      assignmentState: "unavailable",
      delegatorDisplayName: null,
    });

    const duplicate = completeFixture();
    duplicate.links["task-1:assigned_to"]!.push({
      from_id: "task-1",
      to_id: "session-worker-2",
    });
    expect(projectTaskAssignments(readerFor(duplicate))[0]).toMatchObject({
      assignmentState: "unavailable",
      delegatorDisplayName: null,
    });
  });
});
