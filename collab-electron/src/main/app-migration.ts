import { randomUUID } from "node:crypto";
import {
  chmodSync,
  copyFileSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  renameSync,
  rmSync,
  type Stats,
} from "node:fs";
import { homedir } from "node:os";
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from "node:path";
import { QF_APP_DIR, QF_APP_ROOT } from "./paths";

export interface MigrationFileSystem {
  lstat(path: string): Stats;
  readdir(path: string): string[];
  mkdir(path: string): void;
  copyFile(source: string, destination: string): void;
  chmod(path: string, mode: number): void;
  rename(source: string, destination: string): void;
  remove(path: string): void;
}

export const nodeMigrationFileSystem: MigrationFileSystem = {
  lstat: lstatSync,
  readdir: (path) => readdirSync(path),
  mkdir: (path) => mkdirSync(path, { recursive: true }),
  copyFile: copyFileSync,
  chmod: chmodSync,
  rename: renameSync,
  remove: (path) => rmSync(path, { recursive: true, force: true }),
};

export type MigrationResult =
  | { status: "migrated"; source: string; destination: string }
  | { status: "destination-exists"; source: string; destination: string }
  | { status: "source-absent"; source: string; destination: string };

const GENERATED_BREADCRUMBS = new Set([
  "socket-path",
  "node-path",
]);

function isExcludedGlobalEntry(relativePath: string, stats: Stats): boolean {
  const segments = relativePath.split(/[\\/]/);
  const name = segments.at(-1) ?? "";
  const top = segments[0] ?? "";
  return (
    top === "artifacts" ||
    segments.includes("agent-artifacts") ||
    /^kernel\.db/i.test(name) ||
    /(?:^|[.-])pid(?:$|[.-])/i.test(name) ||
    name.endsWith(".sock") ||
    name.endsWith(".socket") ||
    GENERATED_BREADCRUMBS.has(name) ||
    stats.isSocket() ||
    stats.isFIFO() ||
    stats.isCharacterDevice() ||
    stats.isBlockDevice()
  );
}

function safeLstat(
  fs: MigrationFileSystem,
  path: string,
): Stats | null {
  try {
    return fs.lstat(path);
  } catch {
    return null;
  }
}

function sourceDirectoryExists(
  fs: MigrationFileSystem,
  path: string,
): boolean {
  const stats = safeLstat(fs, path);
  return stats !== null && !stats.isSymbolicLink() && stats.isDirectory();
}

function assertRelativeDestination(path: string): void {
  if (
    path === "" ||
    path === "." ||
    isAbsolute(path) ||
    path.split(/[\\/]/).includes("..")
  ) {
    throw new Error(`unsafe migration destination: ${path}`);
  }
}

function copyTreeWithoutLinks(
  fs: MigrationFileSystem,
  source: string,
  destination: string,
  root: string,
  exclude: ((relativePath: string, stats: Stats) => boolean) | null,
): void {
  const stats = fs.lstat(source);
  const relativePath = relative(root, source);

  // Legacy state may contain links to arbitrary operator files. They are
  // compatibility inputs, never migration inputs.
  if (stats.isSymbolicLink() || exclude?.(relativePath, stats)) return;

  if (stats.isDirectory()) {
    fs.mkdir(destination);
    for (const name of fs.readdir(source)) {
      copyTreeWithoutLinks(
        fs,
        join(source, name),
        join(destination, name),
        root,
        exclude,
      );
    }
    fs.chmod(destination, stats.mode);
    return;
  }

  if (!stats.isFile()) return;
  fs.mkdir(dirname(destination));
  fs.copyFile(source, destination);
  fs.chmod(destination, stats.mode);
}

function copyDirectoryContents(
  fs: MigrationFileSystem,
  source: string,
  destination: string,
  exclude: ((relativePath: string, stats: Stats) => boolean) | null,
): void {
  for (const name of fs.readdir(source)) {
    copyTreeWithoutLinks(
      fs,
      join(source, name),
      join(destination, name),
      source,
      exclude,
    );
  }
}

export interface LegacyAppMigrationOptions {
  legacyRoot: string;
  destinationRoot: string;
  electronUserData?: {
    source: string;
    destinationRelative: string;
  };
  fs?: MigrationFileSystem;
  stageId?: string;
  log?: (message: string) => void;
}

/**
 * Copy legacy app state into a sibling stage and publish it with one rename.
 * The source is read-only, links are skipped, and a failed stage is retryable.
 */
export function migrateLegacyAppState(
  options: LegacyAppMigrationOptions,
): MigrationResult {
  const fs = options.fs ?? nodeMigrationFileSystem;
  const source = resolve(options.legacyRoot);
  const destination = resolve(options.destinationRoot);

  if (safeLstat(fs, destination) !== null) {
    options.log?.(
      `QuantFlow migration conflict: preserving existing ${destination}; legacy ${source} remains untouched`,
    );
    return { status: "destination-exists", source, destination };
  }

  const hasLegacyRoot = sourceDirectoryExists(fs, source);
  const electron = options.electronUserData;
  const hasLegacyElectron =
    electron !== undefined && sourceDirectoryExists(fs, electron.source);

  if (!hasLegacyRoot && !hasLegacyElectron) {
    return { status: "source-absent", source, destination };
  }

  if (electron) assertRelativeDestination(electron.destinationRelative);

  const stage = join(
    dirname(destination),
    `.${basename(destination)}.migration-${options.stageId ?? randomUUID()}`,
  );
  fs.mkdir(dirname(destination));
  fs.remove(stage);

  try {
    fs.mkdir(stage);
    if (hasLegacyRoot) {
      copyDirectoryContents(
        fs,
        source,
        stage,
        isExcludedGlobalEntry,
      );
    }
    if (hasLegacyElectron && electron) {
      const electronDestination = resolve(
        stage,
        electron.destinationRelative,
      );
      if (
        electronDestination !== stage &&
        !electronDestination.startsWith(stage + sep)
      ) {
        throw new Error("Electron migration destination escaped staging root");
      }
      copyTreeWithoutLinks(
        fs,
        electron.source,
        electronDestination,
        electron.source,
        null,
      );
    }
    fs.rename(stage, destination);
  } catch (error) {
    fs.remove(stage);
    throw error;
  }

  return { status: "migrated", source, destination };
}

export interface BootMigrationOptions {
  legacyElectronUserData: string;
  home?: string;
  appRoot?: string;
  appDir?: string;
  fs?: MigrationFileSystem;
  stageId?: string;
  log?: (message: string) => void;
}

export function legacyElectronUserDataPath(options: {
  appData: string;
  devWorktreeId: string | null;
}): string {
  const legacyRoot = join(
    options.appData,
    "@collaborator",
    "electron",
  );
  return options.devWorktreeId
    ? join(legacyRoot, "dev", options.devWorktreeId)
    : legacyRoot;
}

/** Production delegation seam. Call before logger, config, or sidecar startup. */
export function runAppMigrationBeforeBoot(
  options: BootMigrationOptions,
): MigrationResult {
  const home = options.home ?? homedir();
  const appRoot = options.appRoot ?? QF_APP_ROOT;
  const appDir = options.appDir ?? QF_APP_DIR;
  const appDirRelative = relative(appRoot, appDir);
  const electronDestination =
    appDirRelative === ""
      ? "electron"
      : join(appDirRelative, "electron");

  return migrateLegacyAppState({
    legacyRoot: join(home, ".collaborator"),
    destinationRoot: appRoot,
    electronUserData: {
      source: options.legacyElectronUserData,
      destinationRelative: electronDestination,
    },
    fs: options.fs,
    stageId: options.stageId,
    log: options.log,
  });
}

export interface WorkspaceMigrationOptions {
  workspacePath: string;
  fs?: MigrationFileSystem;
  stageId?: string;
  log?: (message: string) => void;
}

/** Copy workspace-local compatibility state on first sight, before consumers. */
export function migrateWorkspaceMetadata(
  options: WorkspaceMigrationOptions,
): MigrationResult {
  const fs = options.fs ?? nodeMigrationFileSystem;
  const source = join(resolve(options.workspacePath), ".collaborator");
  const destination = join(resolve(options.workspacePath), ".quantflow");

  if (safeLstat(fs, destination) !== null) {
    if (sourceDirectoryExists(fs, source)) {
      options.log?.(
        `QuantFlow workspace migration conflict: preserving existing ${destination}; legacy ${source} remains untouched`,
      );
    }
    return { status: "destination-exists", source, destination };
  }
  if (!sourceDirectoryExists(fs, source)) {
    return { status: "source-absent", source, destination };
  }

  const stage = join(
    dirname(destination),
    `.${basename(destination)}.migration-${options.stageId ?? randomUUID()}`,
  );
  fs.remove(stage);
  try {
    fs.mkdir(stage);
    copyDirectoryContents(fs, source, stage, null);
    fs.rename(stage, destination);
  } catch (error) {
    fs.remove(stage);
    throw error;
  }
  return { status: "migrated", source, destination };
}
