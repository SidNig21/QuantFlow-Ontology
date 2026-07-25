import { z } from "zod";
import { defineAction, defineLink, defineObject } from "../define.ts";

const jsonObject = z.record(z.string(), z.unknown());

// ── Market plane ────────────────────────────────────────────────────────────

export const competitor = defineObject({
  name: "competitor",
  description:
    "A participant that can be bet on — fighter, player, or team. One identity per real competitor; aliases stay as links, not duplicate rows.",
  lifecycle: "experimental",
  properties: z.object({
    kind: z
      .enum(["ufc_fighter", "tennis_player", "team"])
      .describe("Competitor species; a team's sport comes from the events it plays."),
    name: z.string().describe("Canonical display name used in markets and reports."),
    external_refs: jsonObject.describe(
      "Source-system IDs (Bovada participant id, dataset keys) for entity resolution.",
    ),
  }),
});

export const event = defineObject({
  name: "event",
  description:
    "A scheduled real-world contest (UFC bout, tennis match, football game). starts_at is the point-in-time fence for pre-event decisions.",
  lifecycle: "experimental",
  properties: z.object({
    sport: z
      .enum(["ufc", "tennis", "football"])
      .describe("Sport domain for this contest; drives prop vocabularies and coverage."),
    starts_at: z.iso
      .datetime()
      .describe("Scheduled start as ISO-8601 UTC; no post-start data may inform a pre-event ticket."),
    status: z
      .enum(["scheduled", "live", "settled", "void"])
      .describe("Contest state from schedule through settlement or void."),
    competition: z
      .string()
      .describe("Tournament or league context (UFC 320, Wimbledon R16, NFL Week 3)."),
  }),
});

export const market = defineObject({
  name: "market",
  description:
    "One bettable proposition on an event. Moneyline, spread, total, and prop are kinds of this single type — never separate object types.",
  lifecycle: "experimental",
  properties: z.object({
    kind: z
      .enum(["moneyline", "spread", "total", "prop"])
      .describe("Market family; props carry sport-specific structure in params."),
    params: jsonObject.describe(
      "Kind-specific parameters (lines, prop category/method/round, handicaps) as JSON.",
    ),
    sides: z
      .array(z.string())
      .describe('Named outcomes offered, e.g. ["Jones","Miocic"] or ["over","under"].'),
    correlation_group: z
      .string()
      .describe(
        "Shared key for same-event markets with dependent outcomes; null when independence is assumed.",
      )
      .nullable(),
  }),
});

export const odds_series = defineObject({
  name: "odds_series",
  description:
    "Recorded price history of one market at one book. Pointer object: data_ref points at hashed Parquet quote segments; the Kernel never stores tick rows.",
  lifecycle: "experimental",
  properties: z.object({
    book: z
      .enum(["bovada", "pinnacle"])
      .describe("Sportsbook source; Pinnacle series are the sharp CLV benchmark."),
    data_ref: z
      .string()
      .describe("Content hash plus path of the Parquet segment(s) holding timestamped quotes."),
    coverage: jsonObject.describe(
      "Sufficiency summary: first/last captured timestamps and quote count for agent judgment.",
    ),
  }),
});

export const result = defineObject({
  name: "result",
  description:
    "Settled truth of an event and the grading of its markets. Point-in-time fenced by settled_at.",
  lifecycle: "experimental",
  properties: z.object({
    outcome: jsonObject.describe(
      "Structured result (winner, score/method, per-market grading win|loss|push|void).",
    ),
    settled_at: z.iso
      .datetime()
      .describe("When truth became known (ISO-8601 UTC); also a point-in-time fence."),
  }),
});

export const participates_in = defineLink({
  name: "participates_in",
  description: "Roster/matchup edge: which competitors take part in an event.",
  lifecycle: "experimental",
  from: competitor,
  to: event,
});

export const offered_on = defineLink({
  name: "offered_on",
  description: "Attaches a market to the event it is offered on for per-contest discovery.",
  lifecycle: "experimental",
  from: market,
  to: event,
});

export const quotes = defineLink({
  name: "quotes",
  description: "Price-history lookup: which market an odds_series records.",
  lifecycle: "experimental",
  from: odds_series,
  to: market,
});

export const settles = defineLink({
  name: "settles",
  description: "Truth attachment: which event a result settles.",
  lifecycle: "experimental",
  from: result,
  to: event,
});

export const start_event = defineAction({
  name: "start_event",
  description: "Move a scheduled event to live (scheduled → live).",
  lifecycle: "experimental",
  input: z.object({
    event_id: z.string().describe("Event to start."),
  }),
});

export const settle_event = defineAction({
  name: "settle_event",
  description: "Settle a live event (live → settled).",
  lifecycle: "experimental",
  input: z.object({
    event_id: z.string().describe("Event to settle."),
  }),
});

export const void_event = defineAction({
  name: "void_event",
  description: "Void a scheduled event that will not be contested (scheduled → void).",
  lifecycle: "experimental",
  input: z.object({
    event_id: z.string().describe("Event to void."),
  }),
});
