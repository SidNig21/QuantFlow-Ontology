export type ObjectExecuteResult = {
  kind: "object";
  object_type: string;
  object_id: string;
  from: string;
  to: string;
  event: string;
  state: Record<string, unknown>;
};

export type ContextExecuteResult = {
  kind: "context";
  command: "register_venue" | "schedule_market_event";
  object_type: "venue" | "market_event";
  object_id: string;
  source_artifact_id: string;
  trace_id: string;
  row_digest: string;
  outcome: "created" | "replayed";
  state: Record<string, unknown>;
};

export type MarketIngestRowResult = {
  object_type: "instrument" | "quote";
  object_id: string;
  event: string;
  row_digest: string;
  outcome: "created" | "replayed";
};

export type MarketIngestLinkResult = {
  kind: "quotes" | "lists" | "offered_on";
  from_id: string;
  to_id: string;
  outcome: "created" | "replayed";
};

export type PipelineExecuteResult = {
  kind: "pipeline_batch";
  command: "ingest_market_batch";
  source_artifact_id: string;
  trace_id: string;
  rows: MarketIngestRowResult[];
  links: MarketIngestLinkResult[];
  created: number;
  replayed: number;
};

export type ExecuteResult = ObjectExecuteResult | ContextExecuteResult | PipelineExecuteResult;

/** Literal legacy commands stay object-typed; dynamic strings expose the honest union. */
export type ExecuteResultFor<C extends string> = string extends C
  ? ExecuteResult
  : C extends "ingest_market_batch"
    ? PipelineExecuteResult
    : C extends "register_venue" | "schedule_market_event"
      ? ContextExecuteResult
    : ObjectExecuteResult;
