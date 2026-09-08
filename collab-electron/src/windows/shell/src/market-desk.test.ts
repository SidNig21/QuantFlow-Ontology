import { describe, expect, test } from "bun:test";
import { deriveResearchWorkflow } from "./research-workflow.js";
import { observationAge } from "./market-desk.js";

describe("market desk one-Canvas projection", () => {
	test("resolves the selected market context without creating a second Canvas world", () => {
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
		expect(workflow.mission?.id).toBe("mission-1");
		expect(workflow.marketQuote?.id).toBe("quote-1");
		expect(workflow.marketInstrument?.id).toBe("instrument-1");
		expect(workflow.marketEvent?.id).toBe("event-1");
		expect(workflow.marketVenue?.id).toBe("venue-1");
  });

  test("reports observation age without claiming provider freshness", () => {
    expect(observationAge("2026-09-06T05:00:00.000Z", Date.parse("2026-09-06T05:07:30.000Z"))).toBe("7m ago");
    expect(observationAge(null)).toBe("time unavailable");
  });

  test("continuous desk source contains no replacement removal or hide rule", async () => {
		const controller = await Bun.file(new URL("./one-canvas.js", import.meta.url)).text();
		const marketDesk = await Bun.file(new URL("./market-desk.js", import.meta.url)).text();
		const handoff = await Bun.file(new URL("./handoff-layer.js", import.meta.url)).text();
		const styles = await Bun.file(new URL("./shell.css", import.meta.url)).text();
		expect(controller).not.toMatch(/CURRENT_MISSION|FULL_LINEAGE|savedOverview|Back to world/);
    expect(styles).not.toContain('#panel-viewer[data-qf-research-projection-active="true"] #tile-layer > .canvas-tile:not([data-qf-world-type])');
		expect(marketDesk).toContain('rowsHost.addEventListener("wheel", (event) => event.stopPropagation())');
		expect(marketDesk).toContain('element("details", "market-research-details")');
		expect(marketDesk).toContain('open.removeAttribute("open")');
		expect(marketDesk).toMatch(/await onResearch.*\n\s*root\.hidden = true/s);
		expect(handoff).toContain('handoff?.status === "open"');
		expect(handoff).not.toContain('className = "handoff-card"');
		expect(styles).toMatch(/#handoff-layer[\s\S]*?z-index: 5/);
		expect(styles).toMatch(/\.handoff-card[\s\S]*?display: none/);
		expect(styles).toMatch(/\.market-desk-rows[^}]*overscroll-behavior: contain/);
		expect(styles).toMatch(/\.market-desk-surface[\s\S]*?background: var\(--qf-gl-panel\)/);
		expect(styles).toContain('.market-desk-surface[hidden] { display: none; }');
  });
});
