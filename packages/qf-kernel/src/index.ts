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
  creationHandlers,
} from "./create.ts";
export {
  AgentDefinitionExistsError,
  ArtifactMetadataConflictError,
  ContentHashMismatchError,
  FabricatedStateError,
  IllegalLinkError,
  IllegalTransitionError,
  KernelError,
  KernelIncompleteInitializationError,
  KernelRegistryDriftError,
  KernelUpgradeShapeError,
  MissingTraceError,
  PackageRefUnresolvedError,
  UnknownAgentDefinitionError,
  UnknownSpeciesError,
  SpawnedFromLinkRejectedError,
} from "./errors.ts";
export { appendEvent } from "./events.ts";
export { eventCount, execute, type ExecuteResult } from "./execute.ts";
export { contentHash } from "./hash.ts";
export { insertRun } from "./insert.ts";
export { replayArtifactAndAssert, replayRunAndAssert } from "./replay.ts";
export {
  resolvePackageRef,
  resolveSpeciesPackage,
} from "./species.ts";
export {
  classifyKernelShape,
  PROFILE_IDENTITY_UPGRADE,
} from "./upgrade.ts";
export { seedExperimentalFixtureTable } from "./fixtures.ts";
