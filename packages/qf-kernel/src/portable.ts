/**
 * Electron-safe entry: no top-level bun:sqlite import.
 * App code must import only from "qf-kernel/portable".
 */
export {
  attachKernel,
  migrationSqlPath,
  type KernelDb,
  type KernelStatement,
} from "./db.ts";
export {
  getLinks,
  getObject,
  queryObjects,
  type GetLinksOptions,
  type LinkRow,
} from "./read.ts";
export {
  assertCreationHandlersComplete,
  creationHandlers,
} from "./create.ts";
export {
  AgentDefinitionExistsError,
  ArtifactMetadataConflictError,
  ContentHashMismatchError,
  IllegalTransitionError,
  KernelError,
  MissingSessionIdError,
  MissingTraceError,
  PackageRefUnresolvedError,
  UnknownSpeciesError,
} from "./errors.ts";
export { appendEvent } from "./events.ts";
export { eventCount, execute, type ExecuteResult } from "./execute.ts";
export { contentHash } from "./hash.ts";
export { insertAgentSession, insertRun } from "./insert.ts";
export { replayArtifactAndAssert, replayRunAndAssert } from "./replay.ts";
export {
  resolvePackageRef,
  resolveSpeciesPackage,
} from "./species.ts";
export { requireTrace, type TraceContext } from "./trace.ts";
