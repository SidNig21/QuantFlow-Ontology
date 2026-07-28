/**
 * Required env resolution for the vault projector.
 * Unset, empty, and whitespace-only values are absent — same refusal.
 */

export function readRequiredEnv(name: string): string {
  const raw = process.env[name];
  if (raw === undefined) {
    console.error(`qf-vault-projection: ${name} is required`);
    process.exit(1);
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    console.error(`qf-vault-projection: ${name} is required`);
    process.exit(1);
  }
  return trimmed;
}
