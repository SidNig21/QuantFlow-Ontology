import { describe, expect, test } from "bun:test";
import {
  orchestrateNativeTuiAdmission,
  type NativeTuiLive,
  type NativeTuiOrchestrationDependencies,
} from "./native-tui-orchestration";
import { PeerRoleRegistry } from "./peer-role-registry";

function harness(opts?: {
  failCommand?: string;
  failPeerStartOnce?: boolean;
}) {
  const live = new Map<string, NativeTuiLive>();
  const ptyMap = new Map<string, string>();
  const roles = new PeerRoleRegistry();
  const terminated: string[] = [];
  const commands: string[] = [];
  let ptyN = 0;
  let sessionN = 0;
  let peerStartFailures = opts?.failPeerStartOnce ? 1 : 0;
  let failedCommand = opts?.failCommand;

  const deps: NativeTuiOrchestrationDependencies = {
    createPty: async () => ({ sessionId: `pty-${++ptyN}` }),
    terminatePty: async (id) => {
      terminated.push(id);
    },
    execute: (command) => {
      commands.push(command);
      if (failedCommand === command) {
        failedCommand = undefined;
        throw new Error(`injected ${command}`);
      }
    },
    newTrace: () => ({ trace_id: "trace", span_id: crypto.randomUUID() }),
    newSessionId: () => `session-${++sessionN}`,
    liveSet: (id, entry) => {
      live.set(id, entry);
    },
    liveDelete: (id) => {
      live.delete(id);
    },
    ptyMapSet: (pty, id) => {
      ptyMap.set(pty, id);
    },
    ptyMapDelete: (pty) => {
      ptyMap.delete(pty);
    },
    peerAssertAvailable: (role) => roles.assertAvailable(role),
    peerRegister: (role, pty) => roles.register(role, pty),
    peerUnregister: (role, pty) => {
      roles.unregister(role, pty);
    },
    peerStart: () => {
      if (peerStartFailures > 0) {
        peerStartFailures -= 1;
        throw new Error("injected peer start");
      }
    },
  };
  return { deps, live, ptyMap, roles, terminated, commands };
}

const admission = {
  definitionId: "hermes-worker",
  label: "hermes-worker",
  peerDelivery: { role: "worker", dbPath: "/tmp/fake-peer.db" },
};

describe("orchestrateNativeTuiAdmission", () => {
  test("create failure leaves no process-local or Kernel compensation residue", async () => {
    const h = harness({ failCommand: "create_agent_session" });
    await expect(
      orchestrateNativeTuiAdmission(admission, h.deps),
    ).rejects.toThrow(/injected create_agent_session/);
    expect(h.terminated).toEqual(["pty-1"]);
    expect(h.live.size).toBe(0);
    expect(h.ptyMap.size).toBe(0);
    expect(h.roles.get("worker")).toBeUndefined();
    expect(h.commands).toEqual(["create_agent_session"]);

    await expect(orchestrateNativeTuiAdmission(admission, h.deps)).resolves.toMatchObject({
      definitionId: "hermes-worker",
      ptySessionId: "pty-2",
    });
  });

  test("start failure records fail and close, cleans maps, then permits same role", async () => {
    const h = harness({ failCommand: "start_agent_session" });
    await expect(
      orchestrateNativeTuiAdmission(admission, h.deps),
    ).rejects.toThrow(/injected start_agent_session/);
    expect(h.terminated).toEqual(["pty-1"]);
    expect(h.live.size).toBe(0);
    expect(h.ptyMap.size).toBe(0);
    expect(h.roles.get("worker")).toBeUndefined();
    expect(h.commands).toEqual([
      "create_agent_session",
      "start_agent_session",
      "fail_agent_session",
      "close_agent_session",
    ]);

    await expect(orchestrateNativeTuiAdmission(admission, h.deps)).resolves.toMatchObject({
      ptySessionId: "pty-2",
    });
  });

  test("late peer failure unregisters only its PTY and same-role relaunch succeeds", async () => {
    const h = harness({ failPeerStartOnce: true });
    await expect(
      orchestrateNativeTuiAdmission(admission, h.deps),
    ).rejects.toThrow(/injected peer start/);
    expect(h.terminated).toEqual(["pty-1"]);
    expect(h.live.size).toBe(0);
    expect(h.ptyMap.size).toBe(0);
    expect(h.roles.get("worker")).toBeUndefined();

    const relaunched = await orchestrateNativeTuiAdmission(admission, h.deps);
    expect(relaunched.ptySessionId).toBe("pty-2");
    expect(h.roles.get("worker")).toBe("pty-2");
  });

  test("duplicate role preflight rejects before process start", async () => {
    const h = harness();
    h.roles.register("worker", "existing-pty");
    await expect(
      orchestrateNativeTuiAdmission(admission, h.deps),
    ).rejects.toThrow(/already bound/);
    expect(h.live.size).toBe(0);
    expect(h.terminated).toEqual([]);
    expect(h.commands).toEqual([]);
    expect(h.roles.get("worker")).toBe("existing-pty");
  });
});
