import { describe, expect, test } from "bun:test";
import { z } from "zod";
import {
  buildActiveSchemaBaseline,
  defineAction,
  defineLink,
  defineObject,
  lintCommands,
  lintSchema,
  type Schema,
} from "./define.ts";
import { instrument, market_event, quote, venue } from "./ontology/market.ts";
import { ticket } from "./ontology/research.ts";
import { schema } from "./schema.ts";

describe("schema lint", () => {
  test("object missing description fails naming the offender", () => {
    expect(() =>
      defineObject({
        name: "orphan_claim",
        description: "   ",
        lifecycle: "experimental",
        properties: z.object({
          claim: z.string().describe("A claim."),
        }),
      }),
    ).toThrow('Object "orphan_claim" is missing a required non-empty description');
  });

  test("object missing lifecycle fails naming the offender", () => {
    expect(() =>
      defineObject({
        name: "orphan_claim",
        description: "A claim object.",
        // @ts-expect-error intentional invalid lifecycle for lint coverage
        lifecycle: undefined,
        properties: z.object({
          claim: z.string().describe("A claim."),
        }),
      }),
    ).toThrow('Object "orphan_claim" is missing a required lifecycle');
  });

  test("property missing description fails naming the offender", () => {
    expect(() =>
      defineObject({
        name: "orphan_claim",
        description: "A claim object.",
        lifecycle: "experimental",
        properties: z.object({
          claim: z.string(),
        }),
      }),
    ).toThrow('Object "orphan_claim".claim is missing a required non-empty description');
  });

  test("link missing description fails naming the offender", () => {
    const a = defineObject({
      name: "alpha",
      description: "Alpha object for link lint.",
      lifecycle: "experimental",
      properties: z.object({
        label: z.string().describe("Label."),
      }),
    });
    const b = defineObject({
      name: "beta",
      description: "Beta object for link lint.",
      lifecycle: "experimental",
      properties: z.object({
        label: z.string().describe("Label."),
      }),
    });
    expect(() =>
      defineLink({
        name: "points_to",
        description: "",
        lifecycle: "experimental",
        from: a,
        to: b,
      }),
    ).toThrow('Link "points_to" is missing a required non-empty description');
  });

  test("action missing description fails naming the offender", () => {
    expect(() =>
      defineAction({
        name: "do_thing",
        description: "",
        lifecycle: "experimental",
        input: z.object({
          value: z.string().describe("A value."),
        }),
      }),
    ).toThrow('Action "do_thing" is missing a required non-empty description');
  });

  test("multi-endpoint link preserves declaration order", () => {
    const a = defineObject({
      name: "alpha",
      description: "Alpha object.",
      lifecycle: "experimental",
      properties: z.object({ label: z.string().describe("Label.") }),
    });
    const b = defineObject({
      name: "beta",
      description: "Beta object.",
      lifecycle: "experimental",
      properties: z.object({ label: z.string().describe("Label.") }),
    });
    const c = defineObject({
      name: "gamma",
      description: "Gamma object.",
      lifecycle: "experimental",
      properties: z.object({ label: z.string().describe("Label.") }),
    });
    const link = defineLink({
      name: "joins",
      description: "Multi endpoint link.",
      lifecycle: "experimental",
      from: [a, b],
      to: c,
    });
    expect(link.from).toEqual(["alpha", "beta"]);
    expect(link.to).toEqual(["gamma"]);
  });

  test("lintSchema rejects duplicate names", () => {
    const obj = defineObject({
      name: "dup_name",
      description: "An object.",
      lifecycle: "experimental",
      properties: z.object({ label: z.string().describe("Label.") }),
    });
    const action = defineAction({
      name: "dup_name",
      description: "An action.",
      lifecycle: "experimental",
      input: z.object({ value: z.string().describe("Value.") }),
    });
    const schema: Schema = { objects: [obj], links: [], actions: [action] };
    expect(() => lintSchema(schema, {})).toThrow('Duplicate action name "dup_name"');
  });

  test("lintSchema rejects unknown link endpoints", () => {
    const a = defineObject({
      name: "alpha",
      description: "Alpha object.",
      lifecycle: "experimental",
      properties: z.object({ label: z.string().describe("Label.") }),
    });
    const b = defineObject({
      name: "beta",
      description: "Beta object.",
      lifecycle: "experimental",
      properties: z.object({ label: z.string().describe("Label.") }),
    });
    const link = defineLink({
      name: "points_to",
      description: "A link.",
      lifecycle: "experimental",
      from: a,
      to: b,
    });
    const schema: Schema = { objects: [a], links: [link], actions: [] };
    expect(() => lintSchema(schema, {})).toThrow(
      'Link "points_to" to endpoint "beta" does not reference an object in the schema',
    );
  });

  test("lintSchema rejects status enum missing from transition table", () => {
    const widget = defineObject({
      name: "widget",
      description: "A stateful widget.",
      lifecycle: "experimental",
      properties: z.object({
        status: z.enum(["a", "b"]).describe("Status."),
      }),
    });
    const schema: Schema = { objects: [widget], links: [], actions: [] };
    expect(() =>
      lintSchema(schema, {
        widget: { a: ["b"] },
      }),
    ).toThrow('Object "widget" state "b" is missing from the transition table');
  });

  test("lintCommands rejects a command that is not a schema action", () => {
    const widget = defineObject({
      name: "widget",
      description: "A stateful widget.",
      lifecycle: "experimental",
      properties: z.object({
        status: z.enum(["a", "b"]).describe("Status."),
      }),
    });
    const go = defineAction({
      name: "go",
      description: "Advance.",
      lifecycle: "experimental",
      input: z.object({ id: z.string().describe("Id.") }),
    });
    const schema: Schema = { objects: [widget], links: [], actions: [go] };
    const tables = { widget: { a: ["b"], b: [] } };
    expect(() =>
      lintCommands(schema, tables, [
        { action: "invented", type: "widget", from: "a", to: "b" },
      ]),
    ).toThrow('Command action "invented" is not a schema action');
  });

  test("lintCommands rejects a legal transition with no command", () => {
    const widget = defineObject({
      name: "widget",
      description: "A stateful widget.",
      lifecycle: "experimental",
      properties: z.object({
        status: z.enum(["a", "b"]).describe("Status."),
      }),
    });
    const go = defineAction({
      name: "go",
      description: "Advance.",
      lifecycle: "experimental",
      input: z.object({ id: z.string().describe("Id.") }),
    });
    const schema: Schema = { objects: [widget], links: [], actions: [go] };
    const tables = { widget: { a: ["b"], b: [] } };
    expect(() => lintCommands(schema, tables, [])).toThrow(
      "Legal transition has no command: widget:a->b",
    );
  });

  test("lintCommands rejects a creation command that is not a schema action", () => {
    const blob = defineObject({
      name: "blob",
      description: "A blob.",
      lifecycle: "experimental",
      properties: z.object({ label: z.string().describe("Label.") }),
    });
    const schema: Schema = { objects: [blob], links: [], actions: [] };
    expect(() =>
      lintCommands(schema, {}, [], [
        { action: "publish_blob", object_type: "blob", event: "blob.published" },
      ]),
    ).toThrow('Creation command action "publish_blob" is not a schema action');
  });

  test("lintCommands rejects transition command edges for pipeline-fed types", () => {
    const feedEvent = defineObject({
      name: "feed_event",
      description: "Feed event object.",
      lifecycle: "experimental",
      pipelineFed: true,
      properties: z.object({
        status: z.enum(["ingested", "archived"]).describe("Feed lifecycle state."),
      }),
    });
    const archiveFeedEvent = defineAction({
      name: "archive_feed_event",
      description: "Archive a feed event.",
      lifecycle: "experimental",
      input: z.object({ id: z.string().describe("Feed event id.") }),
    });
    const schema: Schema = { objects: [feedEvent], links: [], actions: [archiveFeedEvent] };
    const tables = { feed_event: { ingested: ["archived"], archived: [] } };
    expect(() =>
      lintCommands(schema, tables, [
        { action: "archive_feed_event", type: "feed_event", from: "ingested", to: "archived" },
      ]),
    ).toThrow('Pipeline-fed type "feed_event" must not have transition command edges');
  });

  test("lintCommands rejects creation command coverage for pipeline-fed types", () => {
    const feedSnapshot = defineObject({
      name: "feed_snapshot",
      description: "Feed snapshot object.",
      lifecycle: "experimental",
      pipelineFed: true,
      properties: z.object({
        ref: z.string().describe("External reference."),
      }),
    });
    const publishFeedSnapshot = defineAction({
      name: "publish_feed_snapshot",
      description: "Publish feed snapshot.",
      lifecycle: "experimental",
      input: z.object({ ref: z.string().describe("External reference.") }),
    });
    const schema: Schema = {
      objects: [feedSnapshot],
      links: [],
      actions: [publishFeedSnapshot],
    };
    expect(() =>
      lintCommands(schema, {}, [], [
        {
          action: "publish_feed_snapshot",
          object_type: "feed_snapshot",
          event: "feed_snapshot.published",
        },
      ]),
    ).toThrow('Pipeline-fed type "feed_snapshot" must not have creation commands');
  });

  test("lintSchema rejects silo clone object names that embed another kind enum value", () => {
    const run = defineObject({
      name: "run",
      description: "A canonical execution object.",
      lifecycle: "experimental",
      properties: z.object({
        kind: z.enum(["backtest", "analysis"]).describe("Run kind."),
      }),
    });
    const backtestRun = defineObject({
      name: "backtest_run",
      description: "A silo clone object.",
      lifecycle: "experimental",
      properties: z.object({
        note: z.string().describe("Notes."),
      }),
    });
    const schema: Schema = { objects: [run, backtestRun], links: [], actions: [] };
    expect(() => lintSchema(schema, {})).toThrow(
      'Object "backtest_run" embeds kind value "backtest" from "run.kind"',
    );
  });

  test("lintSchema active-freeze rejects removed baseline property", () => {
    const stableV1 = defineObject({
      name: "stable_fixture",
      description: "A fixture object for active-freeze coverage.",
      lifecycle: "active",
      properties: z.object({
        title: z.string().describe("Stable title."),
        weight: z.number().describe("Stable weight."),
      }),
    });
    const baseline = buildActiveSchemaBaseline({
      objects: [stableV1],
      links: [],
      actions: [],
    });

    const stableV2MissingWeight = defineObject({
      name: "stable_fixture",
      description: "A fixture object for active-freeze coverage.",
      lifecycle: "active",
      properties: z.object({
        title: z.string().describe("Stable title."),
      }),
    });

    expect(() =>
      lintSchema(
        { objects: [stableV2MissingWeight], links: [], actions: [] },
        {},
        baseline,
      ),
    ).toThrow('Active object "stable_fixture" removed baseline property "weight"');
  });

  test("lintSchema active-freeze rejects retyped baseline property", () => {
    const stableV1 = defineObject({
      name: "stable_fixture",
      description: "A fixture object for active-freeze coverage.",
      lifecycle: "active",
      properties: z.object({
        title: z.string().describe("Stable title."),
      }),
    });
    const baseline = buildActiveSchemaBaseline({
      objects: [stableV1],
      links: [],
      actions: [],
    });

    const stableV2Retyped = defineObject({
      name: "stable_fixture",
      description: "A fixture object for active-freeze coverage.",
      lifecycle: "active",
      properties: z.object({
        title: z.number().describe("Stable title."),
      }),
    });

    expect(() =>
      lintSchema(
        { objects: [stableV2Retyped], links: [], actions: [] },
        {},
        baseline,
      ),
    ).toThrow('Active object "stable_fixture" retyped baseline property "title"');
  });

  test("real-slip representability fixture builds a single and a five-leg parlay with a void leg", () => {
    const fixtureObjectTypeNames = [
      venue.name,
      market_event.name,
      instrument.name,
      quote.name,
      ticket.name,
    ];
    const schemaObjectTypeNames = schema.objects.map((objectType) => objectType.name);

    const venueRow = venue.properties.parse({
      kind: "sportsbook",
      name: "Bovada",
    });

    const marketEventRows = [
      {
        id: "evt-single",
        payload: {
          sport: "ufc",
          starts_at: "2026-07-25T19:00:00Z",
          status: "settled",
          competition: "UFC 400 Main Card",
        },
      },
      {
        id: "evt-parlay-1",
        payload: {
          sport: "ufc",
          starts_at: "2026-07-26T00:00:00Z",
          status: "settled",
          competition: "UFC 401 Card",
        },
      },
      {
        id: "evt-parlay-2",
        payload: {
          sport: "ufc",
          starts_at: "2026-07-26T00:30:00Z",
          status: "settled",
          competition: "UFC 401 Card",
        },
      },
      {
        id: "evt-parlay-3",
        payload: {
          sport: "ufc",
          starts_at: "2026-07-26T01:00:00Z",
          status: "settled",
          competition: "UFC 401 Card",
        },
      },
      {
        id: "evt-parlay-4",
        payload: {
          sport: "ufc",
          starts_at: "2026-07-26T01:30:00Z",
          status: "settled",
          competition: "UFC 401 Card",
        },
      },
      {
        id: "evt-parlay-5",
        payload: {
          sport: "ufc",
          starts_at: "2026-07-26T02:00:00Z",
          status: "void",
          competition: "UFC 401 Card",
        },
      },
    ].map((entry) => ({ id: entry.id, payload: market_event.properties.parse(entry.payload) }));

    const instrumentRows = [
      {
        id: "inst-single",
        payload: {
          kind: "prop",
          params: {
            market_type: "(Bout) Method of Victory",
            selection: "Fighter A Wins by KO, TKO or DQ",
          },
          sides: ["Fighter A", "Fighter B"],
          correlation_group: null,
        },
      },
      {
        id: "inst-parlay-1",
        payload: {
          kind: "prop",
          params: {
            market_type: "(Bout) Method of Victory",
            selection: "Fighter E Wins by Decision",
          },
          sides: ["Fighter E", "Fighter F"],
          correlation_group: null,
        },
      },
      {
        id: "inst-parlay-2",
        payload: {
          kind: "prop",
          params: {
            market_type: "(Bout) Alternate Method of Victory",
            selection: "Fighter H Wins Inside Distance",
          },
          sides: ["Fighter G", "Fighter H"],
          correlation_group: null,
        },
      },
      {
        id: "inst-parlay-3",
        payload: {
          kind: "moneyline",
          params: { market_type: "(Bout) Straight Winner", selection: "Fighter I" },
          sides: ["Fighter I", "Fighter J"],
          correlation_group: null,
        },
      },
      {
        id: "inst-parlay-4",
        payload: {
          kind: "moneyline",
          params: { market_type: "(Bout) Straight Winner", selection: "Fighter L" },
          sides: ["Fighter K", "Fighter L"],
          correlation_group: null,
        },
      },
      {
        id: "inst-parlay-5",
        payload: {
          kind: "prop",
          params: {
            market_type: "(Bout) Method of Victory",
            selection: "Fighter M Wins by Submission",
          },
          sides: ["Fighter M", "Fighter N"],
          correlation_group: null,
        },
      },
    ].map((entry) => ({ id: entry.id, payload: instrument.properties.parse(entry.payload) }));

    const quoteRows = [
      { id: "quote-single", instrument_id: "inst-single", american: -145 },
      { id: "quote-parlay-1", instrument_id: "inst-parlay-1", american: +135 },
      { id: "quote-parlay-2", instrument_id: "inst-parlay-2", american: -105 },
      { id: "quote-parlay-3", instrument_id: "inst-parlay-3", american: +180 },
      { id: "quote-parlay-4", instrument_id: "inst-parlay-4", american: -115 },
      { id: "quote-parlay-5", instrument_id: "inst-parlay-5", american: +210 },
    ].map((entry) => ({
      id: entry.id,
      instrument_id: entry.instrument_id,
      payload: quote.properties.parse({
        book: "bovada",
        data_ref: `quotes/${entry.id}.json`,
        coverage: {
          observation_count: 1,
          selection_price_american: entry.american,
        },
      }),
    }));

    const singleTicket = ticket.properties.parse({
      origin: "operator_supplied",
      kind: "single",
      external_ref: "BV-SYNTH-0001",
      placed_at: "2026-07-25T18:40:00Z",
      legs: [
        {
          market_event_id: "evt-single",
          instrument_id: "inst-single",
          quote_id: "quote-single",
          market_type: "(Bout) Method of Victory",
          selection: "Fighter A Wins by KO, TKO or DQ",
          price_american_at_selection: -145,
          outcome: "won",
        },
      ],
      combined_price: -145,
      stake: 100,
      payout: 168.97,
      correlation_note: "Single-leg ticket.",
      grade: "win",
    });

    const parlayTicket = ticket.properties.parse({
      origin: "operator_supplied",
      kind: "parlay",
      external_ref: "BV-SYNTH-0002",
      placed_at: "2026-07-25T18:41:00Z",
      legs: [
        {
          market_event_id: "evt-parlay-1",
          instrument_id: "inst-parlay-1",
          quote_id: "quote-parlay-1",
          market_type: "(Bout) Method of Victory",
          selection: "Fighter E Wins by Decision",
          price_american_at_selection: 135,
          outcome: "won",
        },
        {
          market_event_id: "evt-parlay-2",
          instrument_id: "inst-parlay-2",
          quote_id: "quote-parlay-2",
          market_type: "(Bout) Alternate Method of Victory",
          selection: "Fighter H Wins Inside Distance",
          price_american_at_selection: -105,
          outcome: "lost",
        },
        {
          market_event_id: "evt-parlay-3",
          instrument_id: "inst-parlay-3",
          quote_id: "quote-parlay-3",
          market_type: "(Bout) Straight Winner",
          selection: "Fighter I",
          price_american_at_selection: 180,
          outcome: "won",
        },
        {
          market_event_id: "evt-parlay-4",
          instrument_id: "inst-parlay-4",
          quote_id: "quote-parlay-4",
          market_type: "(Bout) Straight Winner",
          selection: "Fighter L",
          price_american_at_selection: -115,
          outcome: "won",
        },
        {
          market_event_id: "evt-parlay-5",
          instrument_id: "inst-parlay-5",
          quote_id: "quote-parlay-5",
          market_type: "(Bout) Method of Victory",
          selection: "Fighter M Wins by Submission",
          price_american_at_selection: 210,
          outcome: "void",
        },
      ],
      combined_price: 1420,
      stake: 50,
      payout: 0,
      correlation_note: "No shared-event legs in this synthetic fixture.",
      grade: "loss",
    });

    expect(venueRow.name).toBe("Bovada");
    expect(marketEventRows).toHaveLength(6);
    expect(instrumentRows).toHaveLength(6);
    expect(quoteRows).toHaveLength(6);
    expect(singleTicket.kind).toBe("single");
    expect(parlayTicket.kind).toBe("parlay");
    expect(parlayTicket.grade).toBe("loss");
    expect(
      parlayTicket.legs.map((leg) => (leg as Record<string, unknown>).outcome),
    ).toEqual(["won", "lost", "won", "won", "void"]);
    expect(schemaObjectTypeNames).toHaveLength(23);
    expect(schemaObjectTypeNames).toEqual(expect.arrayContaining(fixtureObjectTypeNames));
  });

  test("market-plane pipeline-fed flags are set only on instrument and quote", () => {
    expect(instrument.pipelineFed).toBe(true);
    expect(quote.pipelineFed).toBe(true);
    expect(venue.pipelineFed).toBeUndefined();
    expect(market_event.pipelineFed).toBeUndefined();
  });
});
