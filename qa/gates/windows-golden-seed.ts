/** Seed the isolated Golden Run market fixture through the Kernel writer. */
import {
  closeKernel,
  contentHash,
  execute,
  openKernel,
} from "qf-kernel";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [kernelDb, artifactRoot] = process.argv.slice(2);
if (!kernelDb || !artifactRoot) throw new Error("golden seed requires kernel and artifact paths");
mkdirSync(artifactRoot, { recursive: true });
const sourcePath = join(artifactRoot, "golden-fixture-source.json");
const sourceBytes = Buffer.from(JSON.stringify({ fixture: "act1-golden-run" }));
writeFileSync(sourcePath, sourceBytes);
const trace = () => ({ trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() });
const db = openKernel(kernelDb, { create: true });
try {
  const source = execute(db, "publish_artifact", {
    kind: "result_set",
    storage_ref: sourcePath,
    path: sourcePath,
    content_hash: contentHash(new Uint8Array(sourceBytes)),
  }, trace()) as { object_id: string };
  execute(db, "register_venue", {
    venue_id: "venue-golden-fixture",
    kind: "sportsbook",
    name: "Golden fixture venue",
    source_artifact_id: source.object_id,
    observed_at: "2026-08-10T12:00:00.000Z",
  }, trace());
  execute(db, "schedule_market_event", {
    market_event_id: "event-golden-fixture",
    sport: "football",
    starts_at: "2026-08-11T18:00:00.000Z",
    competition: "QA Fixture League",
    source_artifact_id: source.object_id,
    observed_at: "2026-08-10T12:00:00.000Z",
  }, trace());
} finally {
  closeKernel(db);
}
