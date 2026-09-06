import { describe, expect, test } from "bun:test";
import { closeKernel, contentHash, execute, openKernel } from "qf-kernel";
import { getResearchWorldProjection } from "./research-world-projection";

const trace = { trace_id: "market-world", span_id: "market-world-span" };

describe("market investigation research world", () => {
  test("projects exact market lineage with no fabricated Technique or Task", () => {
    const db = openKernel(":memory:");
    try {
      const now = new Date();
      const bytes = new TextEncoder().encode("market-world-source");
      const artifactId = contentHash(bytes);
      execute(db, "publish_artifact", { kind: "result_set", storage_ref: "memory://market-world", bytes }, trace);
      execute(db, "register_venue", { venue_id: "venue-bovada", kind: "sportsbook", name: "Bovada", source_artifact_id: artifactId, observed_at: now.toISOString() }, trace);
      execute(db, "schedule_market_event", { market_event_id: "event-ufc", sport: "ufc", starts_at: new Date(now.getTime() + 86_400_000).toISOString(), competition: "UFC", source_artifact_id: artifactId, observed_at: now.toISOString() }, trace);
      execute(db, "ingest_market_batch", {
        source_artifact_id: artifactId,
        observed_at: now.toISOString(),
        venue_id: "venue-bovada",
        instruments: [{ id: "instrument-ufc", market_event_id: "event-ufc", kind: "moneyline", params: { event_label: "Fiorot vs Grasso", market_label: "Fight Winner" }, sides: ["Manon Fiorot", "Alexa Grasso"], correlation_group: "event-ufc:moneyline" }],
        quotes: [{ id: "quote-ufc", instrument_id: "instrument-ufc", book: "bovada", data_ref: artifactId, coverage: { observed_at: now.toISOString(), provider_time: null, source_hash: artifactId } }],
      }, trace);
      const investigation = execute(db, "create_market_investigation", { quote_id: "quote-ufc", name: "Research Fiorot vs Grasso", objective: "Investigate the captured Fight Winner market." }, trace);
      if (investigation.kind !== "object") throw new Error("expected Mission result");
      const projection = getResearchWorldProjection(db, { root_type: "mission", root_id: investigation.object_id });
      expect(projection.ok).toBe(true);
      if (!projection.ok) return;
      expect(projection.world.objects.map((row) => row.type).sort()).toEqual(["artifact", "instrument", "market_event", "mission", "quote", "venue"]);
      expect(projection.world.links.map((row) => row.kind).sort()).toEqual(["investigates", "lists", "offered_on", "quotes"]);
      expect(projection.world.objects.find((row) => row.type === "mission")?.fields).toMatchObject({ quote_id: "quote-ufc", state: "ready to staff", method: null });
      expect(projection.world.missing_lineage[0]?.message).toContain("Ready to staff");
      expect(projection.world.objects.some((row) => row.type === "task" || row.type === "strategy")).toBe(false);
    } finally {
      closeKernel(db);
    }
  });
});
