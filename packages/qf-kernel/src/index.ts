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
  closeKernel,
  openKernel,
  KernelMissingFileError,
  OpenKernelOptionsError,
  type OpenKernelOptions,
} from "./db-bun.ts";
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
  FabricatedStateError,
  IllegalLinkError,
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
  UnknownAssigneeSessionError,
  UnknownSpeciesError,
  SpawnedFromLinkRejectedError,
  AssignedToLinkRejectedError,
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
export {
  classifyKernelShape,
  MARKET_INGEST_UPGRADE,
  MARKET_CONTEXT_UPGRADE,
  PROFILE_IDENTITY_UPGRADE,
  TASK_DELEGATION_UPGRADE,
} from "./upgrade.ts";
export { seedExperimentalFixtureTable } from "./fixtures.ts";
