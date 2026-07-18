import { z } from "zod";
import { defineAction, defineLink, defineObject, type Schema } from "./define.ts";

export const hypothesis = defineObject({
  name: "hypothesis",
  description:
    "A falsifiable research claim that roots a betting-research lineage. Agents open one before building datasets, tickets, or evaluations so every subsequent artifact answers a named question.",
  lifecycle: "experimental",
  properties: z.object({
    claim: z
      .string()
      .describe("The statement under test in betting-research terms, e.g. a priced inefficiency or independence assumption."),
    success_criteria: z
      .string()
      .describe(
        "What evaluation outcome would support the claim (metrics, sample size, risk bounds) so Critic/Evaluation can grade it.",
      ),
    sources: z
      .array(z.string())
      .describe("Citations grounding the claim (papers, articles, prior reports) that agents must carry into lineage."),
    status: z
      .enum(["open", "supported", "rejected", "inconclusive"])
      .describe("Lifecycle of the claim; only evaluation-backed resolution should leave open."),
  }),
});

export const event = defineObject({
  name: "event",
  description:
    "A scheduled real-world contest (UFC bout, tennis match, football game) that markets and results attach to. Starts_at is the point-in-time fence for pre-event decisions.",
  lifecycle: "experimental",
  properties: z.object({
    sport: z
      .enum(["ufc", "tennis", "football"])
      .describe("Which sport domain this contest belongs to; drives prop vocabularies and dataset coverage."),
    starts_at: z.iso
      .datetime()
      .describe("Scheduled start as ISO-8601 UTC; no post-start data may inform a pre-event ticket."),
    status: z
      .enum(["scheduled", "live", "settled", "void"])
      .describe("Contest state from schedule through settlement or void."),
    competition: z
      .string()
      .describe("Tournament or league context (UFC 320, Wimbledon R16, NFL Week 3) for agent filtering."),
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
    params: z
      .record(z.string(), z.unknown())
      .describe("Kind-specific parameters (lines, prop category/method/round, handicaps) as a JSON object."),
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

export const ticket = defineObject({
  name: "ticket",
  description:
    "The atomic proposed wager — a single or a parlay — emitted by strategies and graded in backtests. A one-leg ticket is still a ticket, never a separate type.",
  lifecycle: "experimental",
  properties: z.object({
    kind: z.enum(["single", "parlay"]).describe("Whether this wager is one leg or a multi-leg parlay."),
    legs: z
      .array(z.record(z.string(), z.unknown()))
      .describe(
        "Structured legs: each entry is market ref + side + price-at-selection (+ captured_at) as JSON objects.",
      ),
    combined_price: z
      .number()
      .describe("Total odds for the ticket as offered or computed across legs."),
    stake: z.number().describe("Simulated stake under the strategy stake model."),
    grade: z
      .enum(["pending", "win", "loss", "push", "void"])
      .describe("Settlement grade once results land; pending until then."),
  }),
});

export const offered_on = defineLink({
  name: "offered_on",
  description:
    "Attaches a market to the event it is offered on so agents can discover every proposition for a contest.",
  lifecycle: "experimental",
  from: market,
  to: event,
});

export const has_leg = defineLink({
  name: "has_leg",
  description:
    "Connects a ticket to each market it bets so correlation traversal and per-market ticket queries stay typed.",
  lifecycle: "experimental",
  from: ticket,
  to: market,
});

export const tests = defineLink({
  name: "tests",
  description:
    "Declares that a ticket exists to test a hypothesis, keeping wager proposals inside a falsifiable research chain.",
  lifecycle: "experimental",
  from: ticket,
  to: hypothesis,
});

export const create_hypothesis = defineAction({
  name: "create_hypothesis",
  description:
    "Open a new research hypothesis with claim, success criteria, and optional sources before any downstream ticket or evaluation work.",
  lifecycle: "experimental",
  input: z.object({
    claim: z.string().describe("The falsifiable claim to register."),
    success_criteria: z.string().describe("How an evaluation would support this claim."),
    sources: z
      .array(z.string())
      .describe("Optional citations grounding the claim.")
      .optional(),
  }),
});

export const submit_ticket = defineAction({
  name: "submit_ticket",
  description:
    "Propose a single or parlay ticket with legs, combined price, and stake for simulated grading — never live order placement.",
  lifecycle: "experimental",
  input: z.object({
    kind: z.enum(["single", "parlay"]).describe("Ticket shape: single leg or parlay."),
    legs: z
      .array(z.record(z.string(), z.unknown()))
      .describe("Leg payloads (market, side, price, captured_at) as JSON objects."),
    combined_price: z.number().describe("Combined odds for the proposed ticket."),
    stake: z.number().describe("Simulated stake amount."),
  }),
});

/** Schema slice in declaration order — generators must preserve this order. */
export const schema: Schema = {
  objects: [hypothesis, event, market, ticket],
  links: [offered_on, has_leg, tests],
  actions: [create_hypothesis, submit_ticket],
};
