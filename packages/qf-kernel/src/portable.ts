/**
 * Electron-safe entry: no top-level bun:sqlite import.
 * App code must import only from "qf-kernel/portable".
 */
export {
  attachKernel,
  enforceObjectTypeRegistryDrift,
  getKernelDrift,
  logKernelBoot,
  migrationSqlPath,
  upgradeSqlPath,
  type AttachKernelOptions,
  type KernelDb,
  type KernelStatement,
} from "./db.ts";
export {
  resolveKernelPath,
  type KernelPathProvenance,
  type ResolvedKernelPath,
} from "./resolve-path.ts";
export {
  resolveArtifactRoot,
  type ArtifactRootProvenance,
  type ResolvedArtifactRoot,
} from "./resolve-artifact-root.ts";
export {
  detectObjectTypeRegistryDrift,
  type RegistryDriftReport,
} from "./registry-drift.ts";
export {
  getLinks,
  getObject,
  queryObjects,
  type GetLinksOptions,
  type LinkRow,
} from "./read.ts";
export {
  assertCreationHandlersComplete,
} from "./create.ts";
export { assertPipelineHandlersComplete } from "./pipeline.ts";
export {
  AgentSessionIdentityLinkRejectedError,
  AgentDefinitionExistsError,
  ArtifactMetadataConflictError,
  ContentHashMismatchError,
  DelegatesToLinkRejectedError,
  DelegatedByLinkRejectedError,
  TaskCreationEnvelopeRejectedError,
  IllegalTransitionError,
  KernelError,
  KernelIncompleteInitializationError,
  KernelRegistryDriftError,
  KernelUpgradeShapeError,
  MarketContextConflictError,
  MarketIngestConflictError,
  MarketIngestValidationError,
  MissingTraceError,
  PackageRefUnresolvedError,
  UnknownAgentDefinitionError,
  UnknownSpeciesError,
  SpawnedFromLinkRejectedError,
} from "./errors.ts";
export { eventCount, execute } from "./execute.ts";
export type {
  ExecuteResult,
  ExecuteResultFor,
  ContextExecuteResult,
  MarketIngestLinkResult,
  MarketIngestRowResult,
  ObjectExecuteResult,
  PipelineExecuteResult,
} from "./results.ts";
export { contentHash } from "./hash.ts";
export { assertDurableOntologyReadReceipt } from "./ontology-read-receipt.ts";
export { replayArtifactAndAssert, replayRunAndAssert } from "./replay.ts";
export {
  resolvePackageRef,
  resolveSpeciesPackage,
} from "./species.ts";
export { requireTrace, type TraceContext, type TrustedExecutionContext } from "./trace.ts";
export {
  classifyKernelShape,
  MARKET_INGEST_UPGRADE,
  MARKET_CONTEXT_UPGRADE,
  PROFILE_IDENTITY_UPGRADE,
  TASK_DELEGATION_UPGRADE,
} from "./upgrade.ts";
