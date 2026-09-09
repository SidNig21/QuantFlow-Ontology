export type ParticipantDefinition = Record<string, unknown>;

function capabilityGroups(definition: ParticipantDefinition): string[] {
  let value: unknown = definition.capability_groups;
  try {
    if (typeof value === "string") value = JSON.parse(value);
  } catch {
    return [];
  }
  return Array.isArray(value) && value.every((entry) => typeof entry === "string") ? value : [];
}

/** Select one currently launchable participant definition, ignoring retired inventory. */
export function selectEligibleDefinition(
  definitions: ParticipantDefinition[],
  role: string,
  capability: string,
  isAvailable: (definition: ParticipantDefinition) => boolean,
): string {
  const matches = definitions.filter((definition) =>
    definition.role === role
    && capabilityGroups(definition).includes(capability)
    && isAvailable(definition),
  );
  if (matches.length !== 1 || typeof matches[0]!.id !== "string") {
    throw new Error(`Exactly one admitted ${role} participant with ${capability} is required.`);
  }
  return String(matches[0]!.id);
}
