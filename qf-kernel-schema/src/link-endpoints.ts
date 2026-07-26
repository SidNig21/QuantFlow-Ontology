import { schema } from "./schema.ts";

export type LinkEndpoints = {
  name: string;
  from: readonly string[];
  to: readonly string[];
};

/** Declared endpoint types for every link kind — drives the Kernel endpoint validator. */
export const linkEndpoints: readonly LinkEndpoints[] = schema.links.map((link) => ({
  name: link.name,
  from: link.from,
  to: link.to,
}));

const byName = new Map(linkEndpoints.map((link) => [link.name, link]));

export function linkDefinition(kind: string): LinkEndpoints | undefined {
  return byName.get(kind);
}

export const linkKindNames: readonly string[] = linkEndpoints.map((link) => link.name);
