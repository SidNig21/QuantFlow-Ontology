import { describe, expect, test } from "bun:test";
import { deriveResearchWorkflow } from "./research-world.js";
import { observationAge } from "./market-desk.js";

describe("market desk renderer projection", () => {
  test("frames quote lineage while keeping it in the current Mission group", () => {
    const mission = { type: "mission", id: "mission-1", fields: { quote_id: "quote-1", state: "ready to staff", method: null } };
    const quote = { type: "quote", id: "quote-1", fields: { current: true } };
    const instrument = { type: "instrument", id: "instrument-1", fields: { params: { market_label: "Fight Winner" } } };
    const event = { type: "market_event", id: "event-1", fields: { competition: "UFC" } };
    const venue = { type: "venue", id: "venue-1", fields: { name: "Bovada" } };
    const world = {
      root: { type: "mission", id: "mission-1" },
      objects: [mission, quote, instrument, event, venue],
      links: [
        { kind: "investigates", from_id: "mission-1", to_id: "quote-1" },
        { kind: "quotes", from_id: "quote-1", to_id: "instrument-1" },
        { kind: "offered_on", from_id: "instrument-1", to_id: "event-1" },
        { kind: "lists", from_id: "venue-1", to_id: "instrument-1" },
      ],
      missing_lineage: [],
    };
    const workflow = deriveResearchWorkflow(world);
    expect([...workflow.primaryIds].sort()).toEqual(["event-1", "instrument-1", "mission-1", "quote-1", "venue-1"]);
    expect(workflow.primaryLinkKeys.size).toBe(4);
    expect([...workflow.currentMissionIds]).toHaveLength(5);
  });

  test("reports observation age without claiming provider freshness", () => {
    expect(observationAge("2026-09-06T05:00:00.000Z", Date.parse("2026-09-06T05:07:30.000Z"))).toBe("7m ago");
    expect(observationAge(null)).toBe("time unavailable");
  });

  test("continuous desk source contains no replacement removal or hide rule", async () => {
    const controller = await Bun.file(new URL("./research-world.js", import.meta.url)).text();
    const styles = await Bun.file(new URL("./shell.css", import.meta.url)).text();
    expect(controller).not.toContain("removeProjectionTiles?.(staleProjectionIds)");
    expect(styles).not.toContain('#panel-viewer[data-qf-research-projection-active="true"] #tile-layer > .canvas-tile:not([data-qf-world-type])');
  });
});
