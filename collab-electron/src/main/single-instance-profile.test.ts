import { expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  acquireProfileInstance,
  type SingleInstanceApp,
} from "./single-instance-profile";

function fakeApp(lockResults: boolean[]) {
  const calls: string[] = [];
  const app: SingleInstanceApp = {
    setPath: (_name, path) => calls.push(`path:${path}`),
    requestSingleInstanceLock: () => {
      calls.push("lock");
      return lockResults.shift() ?? false;
    },
    releaseSingleInstanceLock: () => calls.push("release"),
  };
  return { app, calls };
}

test("existing profiles acquire their final lock before any migration", () => {
  const root = mkdtempSync(join(tmpdir(), "qf-profile-lock-existing-"));
  const userData = join(root, "electron");
  try {
    mkdirSync(userData, { recursive: true });
    writeFileSync(join(userData, "canary"), "existing");
    const fake = fakeApp([false]);
    let migrations = 0;
    expect(acquireProfileInstance(fake.app, {
      electronUserData: userData,
      migrateBeforeFirstBoot: true,
      migrate: () => { migrations += 1; },
    })).toBe(false);
    expect(fake.calls).toEqual([`path:${userData}`, "lock"]);
    expect(migrations).toBe(0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a bootstrap-lock loser never migrates or creates final profile state", () => {
  const root = mkdtempSync(join(tmpdir(), "qf-profile-lock-loser-"));
  const userData = join(root, "app", "electron");
  try {
    const fake = fakeApp([false]);
    let migrations = 0;
    expect(acquireProfileInstance(fake.app, {
      electronUserData: userData,
      migrateBeforeFirstBoot: true,
      migrate: () => { migrations += 1; },
    })).toBe(false);
    expect(fake.calls).toEqual(["lock"]);
    expect(migrations).toBe(0);
    expect(existsSync(userData)).toBe(false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("first ordinary boot migrates before creating and locking final userData", () => {
  const root = mkdtempSync(join(tmpdir(), "qf-profile-lock-migrate-"));
  const userData = join(root, "app", "electron");
  try {
    const fake = fakeApp([true, true]);
    let migrations = 0;
    expect(acquireProfileInstance(fake.app, {
      electronUserData: userData,
      migrateBeforeFirstBoot: true,
      migrate: () => {
        expect(existsSync(userData)).toBe(false);
        migrations += 1;
      },
    })).toBe(true);
    expect(migrations).toBe(1);
    expect(existsSync(userData)).toBe(true);
    expect(fake.calls).toEqual([
      "lock",
      `path:${userData}`,
      "release",
      "lock",
    ]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("final-lock race loses before services and explicit profiles use the same final lock", () => {
  const root = mkdtempSync(join(tmpdir(), "qf-profile-lock-final-"));
  const migratedUserData = join(root, "ordinary", "electron");
  const isolatedUserData = join(root, "isolated", "electron");
  try {
    const ordinary = fakeApp([true, false]);
    expect(acquireProfileInstance(ordinary.app, {
      electronUserData: migratedUserData,
      migrateBeforeFirstBoot: true,
      migrate: () => {},
    })).toBe(false);
    expect(ordinary.calls.at(-1)).toBe("lock");

    const isolated = fakeApp([true]);
    expect(acquireProfileInstance(isolated.app, {
      electronUserData: isolatedUserData,
      migrateBeforeFirstBoot: false,
      migrate: () => { throw new Error("explicit profile must not migrate"); },
    })).toBe(true);
    expect(isolated.calls).toEqual([`path:${isolatedUserData}`, "lock"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
