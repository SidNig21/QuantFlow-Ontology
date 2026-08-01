/** WO-107c permanent market-context gate, kept on the installed market gate package. */
import { runMarketIngestGate } from "./market-ingest.ts";

export async function runMarketContextGate(): Promise<{ ok: boolean }> {
  return runMarketIngestGate();
}

if (import.meta.main) {
  const { ok } = await runMarketContextGate();
  process.exit(ok ? 0 : 1);
}
