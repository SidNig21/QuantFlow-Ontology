import { existsSync, mkdirSync } from "node:fs";

export interface SingleInstanceApp {
  setPath(name: "userData", path: string): void;
  requestSingleInstanceLock(): boolean;
  releaseSingleInstanceLock(): void;
}

export function acquireProfileInstance(
  app: SingleInstanceApp,
  options: {
    electronUserData: string;
    migrateBeforeFirstBoot: boolean;
    migrate(): void;
  },
): boolean {
  if (existsSync(options.electronUserData)) {
    app.setPath("userData", options.electronUserData);
    return app.requestSingleInstanceLock();
  }

  if (options.migrateBeforeFirstBoot) {
    // The final app root must remain absent until the atomic migration publishes
    // it. Electron's current pre-override profile is only a bootstrap guard;
    // every surviving process reacquires the final QF profile lock below.
    if (!app.requestSingleInstanceLock()) return false;
    options.migrate();
    mkdirSync(options.electronUserData, { recursive: true });
    app.setPath("userData", options.electronUserData);
    app.releaseSingleInstanceLock();
    return app.requestSingleInstanceLock();
  }

  mkdirSync(options.electronUserData, { recursive: true });
  app.setPath("userData", options.electronUserData);
  return app.requestSingleInstanceLock();
}
