import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type A2aArtifactStoreOptions = {
  artifactDir?: string;
  artifactRoot: () => string;
  publish: (input: {
    kind: "report";
    path: string;
    storage_ref: string;
  }) => { object_id: unknown };
  fileWriter?: (path: string, bytes: Uint8Array) => void;
};

export type A2aArtifactStore = {
  artifactDir: string;
  writeFile: (path: string, bytes: Uint8Array) => void;
  publishArtifact: (input: { storagePath: string }) => { artifactId: string };
};

/**
 * Create the production storage adapter for A2A report envelopes.
 * The default directory is governed by the canonical artifact-root resolver; only an explicit
 * caller override may select another directory for tests or embedding.
 */
export function createA2aArtifactStore(
  options: A2aArtifactStoreOptions,
): A2aArtifactStore {
  const artifactDir = options.artifactDir ?? join(options.artifactRoot(), "a2a");
  mkdirSync(artifactDir, { recursive: true });

  return {
    artifactDir,
    writeFile: options.fileWriter ?? ((path, bytes) => {
      writeFileSync(path, bytes);
    }),
    publishArtifact: ({ storagePath }) => {
      const publication = options.publish({
        kind: "report",
        path: storagePath,
        storage_ref: storagePath,
      });
      return { artifactId: String(publication.object_id) };
    },
  };
}
