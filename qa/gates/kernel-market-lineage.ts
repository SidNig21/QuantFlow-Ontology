/**
 * R6 — market answer lineage validity (assert cited ids exist; empty/fabricated fail).
 * Lineage uses derived_from to prior artifacts (schema); market object ids are cited in payload
 * and must match seeded Kernel rows that were notionally read.
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  closeKernel,
  contentHash,
  execute,
  getLinks,
  getObject,
  openKernel,
} from "qf-kernel";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function trace() {
  return { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() };
}

function assertValidAnswer(
  db: ReturnType<typeof openKernel>,
  artifactId: string,
  seededMarketIds: Set<string>,
  readArtifactIds: Set<string>,
): void {
  const lineage = getLinks(db, artifactId, { kind: "derived_from" });
  if (lineage.length === 0) throw new Error("empty lineage");
  for (const link of lineage) {
    const id = link.to_id;
    if (typeof id !== "string" || !readArtifactIds.has(id)) {
      throw new Error(`fabricated or unread lineage target: ${id}`);
    }
    if (!getObject(db, "artifact", id)) {
      throw new Error(`lineage target missing: ${id}`);
    }
  }
  const artifact = getObject(db, "artifact", artifactId);
  assert(artifact, "answer artifact missing");
  const storage = String(artifact.storage_ref ?? "");
  const body = JSON.parse(readFileSync(storage, "utf8")) as { cites?: string[] };
  const cites = Array.isArray(body.cites) ? body.cites : [];
  if (cites.length === 0) throw new Error("empty cites");
  for (const cite of cites) {
    if (!seededMarketIds.has(cite)) throw new Error(`fabricated cite: ${cite}`);
    if (!getObject(db, "venue", cite)) throw new Error(`cited market id missing: ${cite}`);
  }
}

export async function runKernelMarketLineageGateBody(): Promise<{ ok: boolean }> {
  const temp = mkdtempSync(join(tmpdir(), "qf-market-lineage-"));
  const dbPath = join(temp, "kernel.db");
  const artifactRoot = join(temp, "artifacts");
  try {
    mkdirSync(artifactRoot, { recursive: true });
    const db = openKernel(dbPath, { create: true });

    const sourcePath = join(artifactRoot, "seed-source.json");
    const sourceBytes = Buffer.from(JSON.stringify({ seed: true }));
    writeFileSync(sourcePath, sourceBytes);
    const source = execute(
      db,
      "publish_artifact",
      {
        kind: "result_set",
        storage_ref: sourcePath,
        path: sourcePath,
        content_hash: contentHash(new Uint8Array(sourceBytes)),
      },
      trace(),
    ) as { object_id: string };

    execute(
      db,
      "register_venue",
      {
        venue_id: "venue-r6",
        kind: "sportsbook",
        name: "R6 Venue",
        source_artifact_id: source.object_id,
        observed_at: "2026-08-03T12:00:00.000Z",
      },
      trace(),
    );

    // Trajectory of a market read (stand-in for gateway trajectory artifact).
    const readPath = join(artifactRoot, "read-trajectory.json");
    const readBytes = Buffer.from(JSON.stringify({ tool: "qf_venue_get", id: "venue-r6" }));
    writeFileSync(readPath, readBytes);
    const readArt = execute(
      db,
      "publish_artifact",
      {
        kind: "trajectory",
        storage_ref: readPath,
        path: readPath,
        content_hash: contentHash(new Uint8Array(readBytes)),
      },
      trace(),
    ) as { object_id: string };

    const seeded = new Set(["venue-r6"]);
    const readArts = new Set([readArt.object_id]);

    // Empty lineage → red
    const emptyPath = join(artifactRoot, "empty.json");
    const emptyBytes = Buffer.from(JSON.stringify({ cites: ["venue-r6"] }));
    writeFileSync(emptyPath, emptyBytes);
    const empty = execute(
      db,
      "publish_artifact",
      {
        kind: "report",
        storage_ref: emptyPath,
        path: emptyPath,
        content_hash: contentHash(new Uint8Array(emptyBytes)),
      },
      trace(),
    ) as { object_id: string };
    let emptyBait = "";
    try {
      assertValidAnswer(db, empty.object_id, seeded, readArts);
    } catch (error) {
      emptyBait = error instanceof Error ? error.message : String(error);
    }
    assert(emptyBait.includes("empty lineage"), `empty bait: ${emptyBait}`);
    console.log("kernel-market-lineage: FALSIFY RED empty lineage");

    // Fabricated cite → red
    const fakePath = join(artifactRoot, "fake.json");
    const fakeBytes = Buffer.from(JSON.stringify({ cites: ["fabricated-venue"] }));
    writeFileSync(fakePath, fakeBytes);
    const fake = execute(
      db,
      "publish_artifact",
      {
        kind: "report",
        storage_ref: fakePath,
        path: fakePath,
        content_hash: contentHash(new Uint8Array(fakeBytes)),
        links: [{ kind: "derived_from", to_id: readArt.object_id }],
      },
      trace(),
    ) as { object_id: string };
    let fakeBait = "";
    try {
      assertValidAnswer(db, fake.object_id, seeded, readArts);
    } catch (error) {
      fakeBait = error instanceof Error ? error.message : String(error);
    }
    assert(fakeBait.includes("fabricated"), `fake bait: ${fakeBait}`);
    console.log("kernel-market-lineage: FALSIFY RED fabricated cite");

    // Green — distinct payload bytes from baits
    const answerPath = join(artifactRoot, "answer.json");
    const answerBytes = Buffer.from(
      JSON.stringify({ cites: ["venue-r6"], note: "lineage-green" }),
    );
    writeFileSync(answerPath, answerBytes);
    const answer = execute(
      db,
      "publish_artifact",
      {
        kind: "report",
        storage_ref: answerPath,
        path: answerPath,
        content_hash: contentHash(new Uint8Array(answerBytes)),
        links: [{ kind: "derived_from", to_id: readArt.object_id }],
      },
      trace(),
    ) as { object_id: string };
    assertValidAnswer(db, answer.object_id, seeded, readArts);

    closeKernel(db);
    console.log("kernel-market-lineage: PASS");
    return { ok: true };
  } catch (error) {
    console.error(
      `kernel-market-lineage: FAIL ${error instanceof Error ? error.message : String(error)}`,
    );
    return { ok: false };
  } finally {
    try {
      rmSync(temp, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}

if (import.meta.main) {
  const { ok } = await runKernelMarketLineageGateBody();
  process.exit(ok ? 0 : 1);
}
