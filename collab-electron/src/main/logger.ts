import { app } from "electron";
import log from "electron-log/main.js";
import { join } from "node:path";
import { QF_APP_DIR } from "./paths";
import { configureLoggerTransports } from "./logger-policy";

const sessionTimestamp = new Date()
  .toISOString()
  .replaceAll(":", "-")
  .replace(/\.\d+Z$/, "");

let initialized = false;

/** Initialize only after legacy state has crossed the boot migration boundary. */
export function initializeLogger(): void {
  if (initialized) return;
  initialized = true;
  log.transports.file.resolvePathFn = () =>
    join(QF_APP_DIR, "logs", `main-${sessionTimestamp}.log`);
  configureLoggerTransports(log.transports, {
    platform: process.platform,
    packaged: app.isPackaged,
  }, {
    stdout: process.stdout as unknown as { on: (event: "error", listener: (error: unknown) => void) => unknown },
    stderr: process.stderr as unknown as { on: (event: "error", listener: (error: unknown) => void) => unknown },
  });
  log.initialize();

  // Route console.* to electron-log so main-process output
  // goes to both stdout and the log file.
  Object.assign(console, {
    log: log.info,
    info: log.info,
    warn: log.warn,
    error: log.error,
    debug: log.debug,
  });
}

export default log;
