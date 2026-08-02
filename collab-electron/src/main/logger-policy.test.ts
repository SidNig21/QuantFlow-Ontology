import { describe, expect, test } from "bun:test";
import { EventEmitter } from "node:events";
import { configureLoggerTransports, type LoggerTransport } from "./logger-policy";

function transports(): { console: LoggerTransport; file: LoggerTransport } {
  return {
    console: { level: "silly" },
    file: { level: "info" },
  };
}

describe("packaged logger transport policy", () => {
  test("disables only console logging for packaged Windows", () => {
    const value = transports();
    const streams = {
      stdout: new EventEmitter(),
      stderr: new EventEmitter(),
    };

    configureLoggerTransports(value, { platform: "win32", packaged: true }, streams as never);

    expect(value.console.level).toBe(false);
    expect(value.file.level).toBe("info");
    expect(() => streams.stdout.emit("error", Object.assign(new Error("broken pipe"), { code: "EPIPE" }))).not.toThrow();
    expect(() => streams.stderr.emit("error", Object.assign(new Error("broken pipe"), { code: "EPIPE" }))).not.toThrow();
  });

  test("does not swallow non-EPIPE stream failures", () => {
    const value = transports();
    const streams = {
      stdout: new EventEmitter(),
      stderr: new EventEmitter(),
    };

    configureLoggerTransports(value, { platform: "win32", packaged: true }, streams as never);

    expect(() => streams.stdout.emit("error", Object.assign(new Error("bad descriptor"), { code: "EBADF" }))).toThrow("bad descriptor");
    expect(() => streams.stderr.emit("error", new Error("other stream failure"))).toThrow("other stream failure");
  });

  test("keeps console logging for development and non-Windows", () => {
    for (const options of [
      { platform: "win32", packaged: false },
      { platform: "linux", packaged: true },
    ]) {
      const value = transports();

      configureLoggerTransports(value, options);

      expect(value.console.level).toBe("silly");
      expect(value.file.level).toBe("info");
    }
  });
});
