import { ipcMain } from "electron";
import { kernelExecute, kernelListArtifacts } from "./kernel";

function serializeError(err: unknown): { name: string; message: string } {
  if (err instanceof Error) {
    return { name: err.name, message: err.message };
  }
  return { name: "Error", message: String(err) };
}

export function registerKernelHandlers(): void {
  ipcMain.handle(
    "qf:execute",
    (_event, args: {
      command: string;
      input: Record<string, unknown>;
      trace: { trace_id: string; span_id: string };
    }) => {
      try {
        return {
          ok: true as const,
          result: kernelExecute(args.command, args.input, args.trace),
        };
      } catch (err) {
        return { ok: false as const, error: serializeError(err) };
      }
    },
  );

  ipcMain.handle("qf:artifacts:list", () => {
    try {
      return { ok: true as const, artifacts: kernelListArtifacts() };
    } catch (err) {
      return { ok: false as const, error: serializeError(err) };
    }
  });
}
