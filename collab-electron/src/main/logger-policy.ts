export type LoggerTransport = {
  level: string | false;
};

export type LoggerStream = {
  on: (event: "error", listener: (error: unknown) => void) => unknown;
};

export function configureLoggerTransports(
  transports: { console: LoggerTransport; file: LoggerTransport },
  options: { platform: string; packaged: boolean },
  streams?: { stdout: LoggerStream; stderr: LoggerStream },
): void {
  if (options.platform === "win32" && options.packaged) {
    // A packaged Windows GUI has no stable stdout/stderr sink. Keeping this
    // transport active can recurse through electron-log's EPIPE handler.
    transports.console.level = false;
    if (streams) {
      const absorbEpipe = (error: unknown): void => {
        if (
          typeof error === "object" && error !== null &&
          (error as { code?: unknown }).code === "EPIPE"
        ) {
          return;
        }
        throw error;
      };
      // Some Kernel boot diagnostics write directly to stderr. A packaged
      // GUI may inherit a broken pipe, but unrelated stream failures remain
      // observable by rethrowing them.
      streams.stdout.on("error", absorbEpipe);
      streams.stderr.on("error", absorbEpipe);
    }
  }
}
