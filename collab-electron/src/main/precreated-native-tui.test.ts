import { expect, mock, test } from "bun:test";
import { Database } from "bun:sqlite";
import { assertPrecreatedNativeTuiRoute } from "./precreated-native-tui";
import type { NativeTuiLive } from "./native-tui-orchestration";

class BunDatabaseSync {
  private readonly database: Database;

  constructor(path: string) {
    this.database = new Database(path);
  }

  prepare(sql: string) {
    return this.database.prepare(sql);
  }

  exec(sql: string) {
    return this.database.exec(sql);
  }
}

mock.module("node:sqlite", () => ({ DatabaseSync: BunDatabaseSync }));
mock.module("electron", () => ({
  app: { getPath: () => "", isPackaged: false },
  BrowserWindow: { getAllWindows: () => [] },
  webContents: { fromId: () => null },
  ipcMain: { handle: () => {}, on: () => {}, removeHandler: () => {} },
  utilityProcess: {},
  powerMonitor: {},
  shell: {},
  dialog: {},
  Menu: {},
  nativeTheme: {},
  net: {},
  protocol: {},
  screen: {},
  session: {},
}));

test("precreated gateway admission accepts only the native_tui route", () => {
  expect(() => assertPrecreatedNativeTuiRoute("native_tui")).not.toThrow();
  expect(() => assertPrecreatedNativeTuiRoute("host_acp")).toThrow(/native_tui/);
  expect(() => assertPrecreatedNativeTuiRoute("agentos")).toThrow(/native_tui/);
});

test("repeated native-TUI close starts teardown at most once", async () => {
  const { createNativeTuiTeardownRegistry } = await import("./agent-host");
  let calls = 0;
  const teardown = async (): Promise<void> => {
    calls += 1;
  };
  const registry = createNativeTuiTeardownRegistry(teardown);
  const entry = { kind: "native_tui", ptySessionId: "pty-once" } as NativeTuiLive;

  const first = registry.begin("session-once", entry);
  const second = registry.begin("session-once", entry);
  expect(second).toBe(first);
  await registry.awaitAll();
  expect(calls).toBe(1);
});
