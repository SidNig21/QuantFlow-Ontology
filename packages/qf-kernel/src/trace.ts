import { MissingTraceError } from "./errors.ts";

export type TraceContext = {
  /** Root id for the operation. */
  trace_id: string;
  /** Span id for this command. */
  span_id: string;
};

export function requireTrace(ctx: Partial<TraceContext> | undefined): TraceContext {
  if (!ctx?.trace_id) throw new MissingTraceError("trace_id");
  if (!ctx.span_id) throw new MissingTraceError("span_id");
  return { trace_id: ctx.trace_id, span_id: ctx.span_id };
}
