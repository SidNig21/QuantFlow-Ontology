import { MissingTraceError } from "./errors.ts";

export type TraceContext = {
  /** Root id for the operation. */
  trace_id: string;
  /** Span id for this command. */
  span_id: string;
};

/**
 * App-supplied execution provenance. actor_session_id never belongs in an
 * action input: the application binds it from its authenticated live seat.
 */
export type TrustedExecutionContext = TraceContext & {
  actor_session_id?: string;
  /** App-internal marker set only after a token-bound generated ontology read. */
  ontology_read_tool?: string;
};

export function requireTrace(
  ctx: Partial<TrustedExecutionContext> | undefined,
): TrustedExecutionContext {
  if (!ctx?.trace_id) throw new MissingTraceError("trace_id");
  if (!ctx.span_id) throw new MissingTraceError("span_id");
  if (ctx.actor_session_id !== undefined && ctx.actor_session_id.length === 0) {
    throw new MissingTraceError("actor_session_id");
  }
  if (ctx.ontology_read_tool !== undefined && ctx.ontology_read_tool.length === 0) {
    throw new MissingTraceError("ontology_read_tool");
  }
  return {
    trace_id: ctx.trace_id,
    span_id: ctx.span_id,
    ...(ctx.actor_session_id ? { actor_session_id: ctx.actor_session_id } : {}),
    ...(ctx.ontology_read_tool ? { ontology_read_tool: ctx.ontology_read_tool } : {}),
  };
}
