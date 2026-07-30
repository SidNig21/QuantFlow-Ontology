import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type ArtifactPublicationInput = {
  path: string;
  kind: "report";
  storage_ref: string;
};

export type ArtifactPublicationResult = {
  object_id: string;
};

export type AgentReportArtifact = {
  artifactId: string;
  path: string;
  bytes: Uint8Array;
};

export type AgentArtifactFileWriter = (
  path: string,
  body: string,
) => void;

/**
 * Write one agent report beneath the resolved artifact root, then publish its identity to the Kernel.
 * The filesystem write must complete before publication; callers supply only the root resolver and
 * the sanctioned Kernel publication callback so this helper remains adapter-agnostic.
 */
export function writeAgentReportArtifact(options: {
  sessionId: string;
  text: string;
  artifactRoot: () => string;
  publish: (input: ArtifactPublicationInput) => ArtifactPublicationResult;
  fileWriter?: AgentArtifactFileWriter;
}): AgentReportArtifact {
  const root = options.artifactRoot();
  mkdirSync(root, { recursive: true });

  const path = join(root, `${options.sessionId}.md`);
  const body = options.text.length > 0 ? options.text : "(empty agent output)";
  const fileWriter = options.fileWriter ?? ((target, content) => {
    writeFileSync(target, content, "utf8");
  });

  fileWriter(path, body);
  const publication = options.publish({
    path,
    kind: "report",
    storage_ref: path,
  });

  return {
    artifactId: publication.object_id,
    path,
    bytes: new TextEncoder().encode(body),
  };
}
