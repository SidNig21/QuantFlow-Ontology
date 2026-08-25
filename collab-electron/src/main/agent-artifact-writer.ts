import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type ArtifactPublicationInput = {
  path: string;
  kind: "trajectory";
  storage_ref: string;
  bytes: Uint8Array;
  links: [{ kind: "produces"; from_id: string }];
};

type ArtifactPublicationResult = {
  object_id: string;
};

export type AgentTrajectoryArtifact = {
  artifactId: string;
  path: string;
  bytes: Uint8Array;
};

type AgentArtifactFileWriter = (
  path: string,
  body: string,
) => void;

/**
 * Write one AgentOS trajectory beneath the resolved artifact root, then publish its identity to the
 * Kernel. The filesystem write must complete before publication; callers supply only the root
 * resolver and the sanctioned Kernel publication callback so this helper remains adapter-agnostic.
 */
export function writeAgentTrajectoryArtifact(options: {
  sessionId: string;
  text: string;
  artifactRoot: () => string;
  publish: (input: ArtifactPublicationInput) => ArtifactPublicationResult;
  fileWriter?: AgentArtifactFileWriter;
}): AgentTrajectoryArtifact {
  const root = options.artifactRoot();
  mkdirSync(root, { recursive: true });

  const path = join(root, `${options.sessionId}.md`);
  const body = options.text.length > 0 ? options.text : "(empty agent output)";
  const fileWriter = options.fileWriter ?? ((target, content) => {
    writeFileSync(target, content, "utf8");
  });

  fileWriter(path, body);
  const bytes = new Uint8Array(readFileSync(path));
  const publication = options.publish({
    path,
    kind: "trajectory",
    storage_ref: path,
    bytes,
    links: [{ kind: "produces", from_id: options.sessionId }],
  });

  return {
    artifactId: publication.object_id,
    path,
    bytes,
  };
}
