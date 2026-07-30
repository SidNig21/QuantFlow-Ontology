import { pipelineCommands, type PipelineCommand } from "qf-kernel-schema/commands";
import type { KernelDb } from "./db.ts";
import { KernelError } from "./errors.ts";
import { ingestMarketBatch } from "./market-ingest.ts";
import type { PipelineExecuteResult } from "./results.ts";
import type { TraceContext } from "./trace.ts";

type PipelineHandler = (
  db: KernelDb,
  cmd: PipelineCommand,
  input: Record<string, unknown>,
  trace: TraceContext,
) => PipelineExecuteResult;

const pipelineHandlers: Readonly<Record<string, PipelineHandler>> = {
  ingest_market_batch: ingestMarketBatch,
};

export function assertPipelineHandlersComplete(
  commands: readonly PipelineCommand[] = pipelineCommands,
  handlers: Readonly<Record<string, PipelineHandler>> = pipelineHandlers,
): void {
  const declared = commands.map((command) => command.action).sort();
  const implemented = Object.keys(handlers).sort();
  if (declared.join("\n") !== implemented.join("\n")) {
    throw new KernelError(
      `Pipeline handler/catalog mismatch: declared=[${declared.join(",")}] implemented=[${implemented.join(",")}]`,
    );
  }
}

export function executePipeline(
  db: KernelDb,
  cmd: PipelineCommand,
  input: Record<string, unknown>,
  trace: TraceContext,
): PipelineExecuteResult {
  const handler = pipelineHandlers[cmd.action];
  if (!handler) {
    throw new KernelError(`No pipeline handler for command "${cmd.action}"`);
  }
  return handler(db, cmd, input, trace);
}
