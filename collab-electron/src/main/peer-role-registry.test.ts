import { describe, expect, test } from "bun:test";
import { PeerRoleRegistry } from "./peer-role-registry";

describe("PeerRoleRegistry", () => {
  test("rejects duplicate live roles without rerouting", () => {
    const roles = new PeerRoleRegistry();
    roles.register("worker", "pty-a");
    expect(() => roles.assertAvailable("worker")).toThrow(/already bound/);
    expect(() => roles.register("worker", "pty-b")).toThrow(/already bound/);
    expect(roles.get("worker")).toBe("pty-a");
  });

  test("unregister is owner-specific", () => {
    const roles = new PeerRoleRegistry();
    roles.register("worker", "pty-a");
    expect(roles.unregister("worker", "pty-b")).toBe(false);
    expect(roles.get("worker")).toBe("pty-a");
    expect(roles.unregister("worker", "pty-a")).toBe(true);
    expect(roles.get("worker")).toBeUndefined();
    expect(() => roles.assertAvailable("worker")).not.toThrow();
  });
});
