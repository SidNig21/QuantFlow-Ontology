import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import {
  createCollaborationService,
  registerCollaborationGatewayRpc,
  type CollaborationDependencies,
} from "./collaboration-gateway";

type Fixture = ReturnType<typeof fixture>;

function fixture() {
  const effects: Array<{ command: string; input: Record<string, unknown>; context: unknown }> = [];
  const published: Array<Record<string, unknown>> = [];
  const notices: Array<Record<string, unknown>> = [];
  const objects = new Map<string, Record<string, unknown>>([
    ["task:task-1", { id: "task-1", status: "open" }],
  ]);
  const links = new Map<string, Array<{ from_id: string; to_id: string }>>([
    ["task-1:assigned_to", [{ from_id: "task-1", to_id: "worker-1" }]],
    ["task-1:delegated_by", [{ from_id: "task-1", to_id: "orch-1" }]],
  ]);
  const revoked = new Set<string>();
  let notifyError: Error | null = null;
  const deps: CollaborationDependencies = {
    authenticate(capability, sessionId, role) {
      if (
        typeof sessionId !== "string" ||
        typeof role !== "string" ||
        capability !== `cap:${sessionId}:${role}` ||
        revoked.has(String(capability))
      ) {
        throw new Error("invalid live seat capability");
      }
      return { sessionId, role };
    },
    capabilityGroups(sessionId) {
      if (sessionId.startsWith("orch")) return ["desk.orchestrate"];
      if (sessionId.startsWith("worker")) return ["market.read"];
      return [];
    },
    liveRecipientForRole(role) {
      if (role !== "worker") throw new Error("live recipient unavailable");
      return { sessionId: "worker-1", role: "worker" };
    },
    identityForSession(sessionId) {
      if (sessionId !== "orch-1") throw new Error("unknown delegator");
      return { sessionId, role: "orchestrator" };
    },
    getObject(type, id) {
      return objects.get(`${type}:${id}`) ?? null;
    },
    getLinks(id, options) {
      return links.get(`${id}:${options.kind}`) ?? [];
    },
    execute(command, input, context) {
      effects.push({ command, input, context });
      if (command === "create_task") {
        objects.set(`task:${String(input.task_id)}`, {
          id: input.task_id,
          status: "open",
        });
        links.set(`${String(input.task_id)}:delegated_by`, [
          { from_id: String(input.task_id), to_id: context.actor_session_id },
        ]);
        links.set(`${String(input.task_id)}:assigned_to`, [
          { from_id: String(input.task_id), to_id: String(input.assignee_session_id) },
        ]);
      }
      if (command === "complete_task") {
        objects.set(`task:${String(input.task_id)}`, {
          id: input.task_id,
          status: "done",
        });
      }
      return { command };
    },
    marketObjectExists(id) {
      return id === "venue-1" || id === "venue-2";
    },
    readMarketTrajectoryResult(artifactId, workerSessionId) {
      if (workerSessionId !== "worker-1" || artifactId !== "read-1") {
        throw new Error("foreign read trajectory");
      }
      return { id: "venue-1", nested: [{ venue_id: "venue-1" }] };
    },
    commitResult(input) {
      published.push(input);
      effects.push({
        command: "commit_result",
        input: { task_id: input.taskId, result_artifact_id: "result-artifact-1" },
        context: { actor_session_id: input.workerSessionId },
      });
      objects.set(`task:${input.taskId}`, { id: input.taskId, status: "done" });
      return { artifactId: "result-artifact-1", completion: { command: "complete_task" } };
    },
    notify(input) {
      notices.push(input);
      if (notifyError) throw notifyError;
      return { messageId: `notice-${notices.length}`, delivered: true };
    },
    mintTaskId: () => "task-minted",
  };
  return {
    deps,
    effects,
    published,
    notices,
    objects,
    links,
    revoked,
    setNotifyError(error: Error | null) {
      notifyError = error;
    },
  };
}

function registerHandlers(f: Fixture) {
  const handlers = new Map<string, (params: unknown) => unknown>();
  registerCollaborationGatewayRpc(
    ((name: string, handler: (params: unknown) => unknown) => {
      handlers.set(name, handler);
    }) as never,
    f.deps,
    () => {},
  );
  return handlers;
}

const taskParams = {
  seat_capability: "cap:orch-1:orchestrator",
  session_id: "orch-1",
  from_role: "orchestrator",
  to_role: "worker",
  task: "Read venue-1",
};

describe("collaboration gateway", () => {
  test("peer transport has no persisted task-id mapping column", () => {
    const source = readFileSync(new URL("./kernel.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/task_id\s+TEXT/);
    expect(source).not.toContain("ADD COLUMN task_id");
    expect(source).toContain("qf.peer-notification.v1");
  });

  test("publishes only dedicated task/result routes and rejects malformed extras", () => {
    const f = fixture();
    const handlers = registerHandlers(f);
    expect([...handlers.keys()].sort()).toEqual([
      "qf.collaboration.send_result",
      "qf.collaboration.send_task",
    ]);
    expect(handlers.has("qf.peer-bus.send_to_peer")).toBe(false);
    expect(() => handlers.get("qf.collaboration.send_task")!({
      ...taskParams,
      storage_ref: "C:\\forged\\artifact.json",
    })).toThrow(/extra field: storage_ref/);
    expect(f.effects).toHaveLength(0);
    expect(f.published).toHaveLength(0);
    expect(f.notices).toHaveLength(0);
    expect(() => handlers.get("qf.collaboration.send_result")!({
      seat_capability: "cap:worker-1:worker",
      session_id: "worker-1",
      from_role: "worker",
      task_id: "task-1",
      result: "answer",
      cited_market_ids: ["venue-1"],
      read_trajectory_artifact_ids: ["read-1"],
      links: [{ kind: "derived_from", to_id: "forged" }],
    })).toThrow(/extra field: links/);
    expect(f.effects).toHaveLength(0);
    expect(f.published).toHaveLength(0);
  });

  test("missing task/result grants fail before effects", () => {
    const f = fixture();
    const service = createCollaborationService(f.deps);
    expect(() => service.sendTask(
      { sessionId: "worker-1", role: "worker" },
      { toRole: "worker", task: "forged task" },
    )).toThrow(/desk\.orchestrate/);
    expect(() => service.sendResult(
      { sessionId: "orch-1", role: "orchestrator" },
      {
        taskId: "task-1",
        result: "forged result",
        citedMarketIds: ["venue-1"],
        readTrajectoryArtifactIds: ["read-1"],
      },
    )).toThrow(/market\.read/);
    expect(f.effects).toHaveLength(0);
    expect(f.published).toHaveLength(0);
    expect(f.notices).toHaveLength(0);
  });

  test("missing, wrong, cross-seat, and revoked capabilities fail before effects", () => {
    const f = fixture();
    const sendTask = registerHandlers(f).get("qf.collaboration.send_task")!;
    for (const capability of [undefined, "wrong", "cap:worker-1:worker"]) {
      expect(() => sendTask({ ...taskParams, seat_capability: capability })).toThrow(/invalid/);
    }
    f.revoked.add(taskParams.seat_capability);
    expect(() => sendTask(taskParams)).toThrow(/invalid/);
    expect(f.effects).toHaveLength(0);
    expect(f.published).toHaveLength(0);
    expect(f.notices).toHaveLength(0);
  });

  test("send_task creates Kernel truth before best-effort notification", () => {
    const f = fixture();
    f.setNotifyError(new Error("peer bus unavailable"));
    const result = createCollaborationService(f.deps).sendTask(
      { sessionId: "orch-1", role: "orchestrator" },
      { toRole: "worker", task: "Read venue-1" },
    );
    expect(f.effects[0]).toMatchObject({
      command: "create_task",
      input: {
        task_id: "task-minted",
        assignee_session_id: "worker-1",
      },
      context: { actor_session_id: "orch-1" },
    });
    expect(f.links.get("task-minted:delegated_by")).toEqual([
      { from_id: "task-minted", to_id: "orch-1" },
    ]);
    expect(f.links.get("task-minted:assigned_to")).toEqual([
      { from_id: "task-minted", to_id: "worker-1" },
    ]);
    expect(f.published).toHaveLength(0);
    expect(f.notices[0]).toMatchObject({
      kind: "task",
      taskId: "task-minted",
    });
    expect("artifactId" in f.notices[0]!).toBe(false);
    expect(result).toMatchObject({
      taskId: "task-minted",
      notification: { delivered: false, error: "peer bus unavailable" },
    });
  });

  test("oversize task and result payloads fail before Kernel or artifact effects", () => {
    const f = fixture();
    const service = createCollaborationService(f.deps);
    expect(() => service.sendTask(
      { sessionId: "orch-1", role: "orchestrator" },
      { toRole: "worker", task: "x".repeat(8 * 1024 + 1) },
    )).toThrow(/UTF-8 bytes/);
    expect(() => service.sendResult(
      { sessionId: "worker-1", role: "worker" },
      {
        taskId: "task-1",
        result: "x".repeat(64 * 1024 + 1),
        citedMarketIds: ["venue-1"],
        readTrajectoryArtifactIds: ["read-1"],
      },
    )).toThrow(/UTF-8 bytes/);
    expect(f.effects).toHaveLength(0);
    expect(f.published).toHaveLength(0);
    expect(f.notices).toHaveLength(0);
  });

  test("fabricated, absent, and foreign cite lineage fails before result publication", () => {
    const cases: Array<{
      cited: string[];
      reads: string[];
      expected: RegExp;
    }> = [
      { cited: ["fabricated"], reads: ["read-1"], expected: /does not exist/ },
      { cited: ["venue-2"], reads: ["read-1"], expected: /absent from named read/ },
      { cited: ["venue-1"], reads: ["foreign-read"], expected: /foreign read/ },
    ];
    for (const bait of cases) {
      const f = fixture();
      expect(() => createCollaborationService(f.deps).sendResult(
        { sessionId: "worker-1", role: "worker" },
        {
          taskId: "task-1",
          result: "Answer",
          citedMarketIds: bait.cited,
          readTrajectoryArtifactIds: bait.reads,
        },
      )).toThrow(bait.expected);
      expect(f.published).toHaveLength(0);
      expect(f.effects).toHaveLength(0);
      expect(f.notices).toHaveLength(0);
    }
  });

  test("send_result publishes exact lineage, completes Kernel task, and survives bus failure", () => {
    const f = fixture();
    f.setNotifyError(new Error("peer bus unavailable"));
    const result = createCollaborationService(f.deps).sendResult(
      { sessionId: "worker-1", role: "worker" },
      {
        taskId: "task-1",
        result: "Venue one is available",
        citedMarketIds: ["venue-1"],
        readTrajectoryArtifactIds: ["read-1"],
      },
    );
    expect(f.published).toEqual([{
      taskId: "task-1",
      workerSessionId: "worker-1",
      workerRole: "worker",
      delegatorSessionId: "orch-1",
      delegatorRole: "orchestrator",
      result: "Venue one is available",
      citedMarketIds: ["venue-1"],
      readTrajectoryArtifactIds: ["read-1"],
    }]);
    expect(f.effects).toHaveLength(1);
    expect(f.effects[0]).toMatchObject({
      command: "commit_result",
      input: { task_id: "task-1", result_artifact_id: "result-artifact-1" },
      context: { actor_session_id: "worker-1" },
    });
    expect(f.objects.get("task:task-1")?.status).toBe("done");
    expect(result).toMatchObject({
      taskId: "task-1",
      artifactId: "result-artifact-1",
      notification: { delivered: false, error: "peer bus unavailable" },
    });
  });
});
