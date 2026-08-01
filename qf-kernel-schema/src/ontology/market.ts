import { z } from "zod";
import { defineAction, defineLink, defineObject } from "../define.ts";

const jsonObject = z.record(z.string(), z.unknown());

// ── Market plane ────────────────────────────────────────────────────────────

export const competitor = defineObject({
  name: "competitor",
  description:
    "A competitor is a participant that can appear in priced betting instruments. Keep one row per real participant and represent aliases as references rather than duplicate identities.",
  lifecycle: "experimental",
  properties: z.object({
    kind: z
      .enum(["ufc_fighter", "tennis_player", "team"])
      .describe(
        "This field classifies the participant species used for matching and grouping. Derive sport context from linked market events instead of hard-coding it on the competitor row.",
      ),
    name: z
      .string()
      .describe(
        "This field stores the canonical display name for the participant. Keep this stable so historical instruments and results stay joined to one identity.",
      ),
    external_refs: jsonObject.describe(
      "This field stores source-system identifiers used for entity resolution. Add new upstream identifiers here instead of creating duplicate competitor rows.",
    ),
  }),
});

export const market_event = defineObject({
  name: "market_event",
  description:
    "A market_event is the bounded real-world occurrence that instruments resolve against. Treat starts_at and status as the governing fence for legal pre-event decisions and lifecycle transitions.",
  lifecycle: "experimental",
  properties: z.object({
    sport: z
      .enum(["ufc", "tennis", "football"])
      .describe(
        "This field names the sport domain for the occurrence. Use it to interpret market vocabularies while keeping shared instrument structure in one type.",
      ),
    starts_at: z.iso
      .datetime()
      .describe(
        "This field records the scheduled start timestamp in ISO-8601 UTC. Do not use data timestamped after this moment for pre-event decisions.",
      ),
    status: z
      .enum(["scheduled", "live", "settled", "void"])
      .describe(
        "This field records the operational lifecycle state for the occurrence. Move it only through declared transition actions, never by ad-hoc writes.",
      ),
    competition: z
      .string()
      .describe(
        "This field stores the competition context such as league, card, or tournament round. Keep the value operator-legible so slips and reports can be reconciled without external decoding.",
      ),
  }),
});

export const instrument = defineObject({
  name: "instrument",
  description:
    "An instrument is one bettable selection under a market category. Encode category variation in kind and params so the type can exist with or without a bounded market_event.",
  lifecycle: "experimental",
  pipelineFed: true,
  properties: z.object({
    kind: z
      .enum(["moneyline", "spread", "total", "prop"])
      .describe(
        "This field identifies the instrument family needed to interpret pricing semantics. Extend the enum by order rather than cloning new object types per category.",
      ),
    params: jsonObject.describe(
      "This field stores kind-specific parameters such as lines, methods, rounds, or handicaps. Keep it machine-readable and deterministic so equivalent instruments compare cleanly.",
    ),
    sides: z
      .array(z.string())
      .describe(
        'This field lists the named outcomes offered for the instrument, such as ["Jones","Miocic"] or ["over","under"]. Preserve provider wording so grading and reconciliation can be traced exactly.',
      ),
    correlation_group: z
      .string()
      .describe(
        "This field groups instruments with known dependent outcomes. Leave it null only when no declared dependence key is available.",
      )
      .nullable(),
  }),
});

export const quote = defineObject({
  name: "quote",
  description:
    "A quote is a pointer object for timestamped price observations of one instrument from one source. Keep raw tick rows outside the Kernel and store only references and coverage metadata here.",
  lifecycle: "experimental",
  pipelineFed: true,
  properties: z.object({
    book: z
      .enum(["bovada", "pinnacle"])
      .describe(
        "This field identifies the source venue or book that published the prices. Use stable lowercase identifiers so cross-source joins remain deterministic.",
      ),
    data_ref: z
      .string()
      .describe(
        "This field points to the content-addressed segment containing timestamped quotes. Treat it as immutable evidence for replay and audit.",
      ),
    coverage: jsonObject.describe(
      "This field summarizes temporal and count coverage for the referenced quote data. Use it as a sufficiency hint, not as a replacement for inspecting underlying rows.",
    ),
  }),
});

export const venue = defineObject({
  name: "venue",
  description:
    "A venue is the listing and pricing source where instruments are offered. Represent sportsbooks and exchanges as rows here so tickets can reference a concrete origin.",
  lifecycle: "experimental",
  properties: z.object({
    kind: z
      .enum(["sportsbook", "exchange"])
      .describe(
        "This field identifies the venue class that governs listing and settlement behavior. Add new classes by order so downstream assumptions remain explicit.",
      ),
    name: z
      .string()
      .describe(
        "This field stores the operator-visible venue name, such as Bovada. Keep names stable so external references can be re-imported idempotently.",
      ),
  }),
});

export const register_venue = defineAction({
  name: "register_venue",
  description:
    "Register one trusted venue identity from an existing source Artifact. Operator-only provenance is required and retries must preserve the original venue rather than silently updating it.",
  lifecycle: "experimental",
  operatorOnly: true,
  input: z
    .object({
      venue_id: z
        .string()
        .describe(
          "This field is the stable Kernel identity for the venue. Reuse it only when all stored venue fields and provenance are an exact replay.",
        ),
      kind: venue.properties.shape.kind,
      name: venue.properties.shape.name,
      source_artifact_id: z
        .string()
        .describe(
          "This field identifies the existing Artifact that preserves the observed venue source. The Kernel rejects a reference that is not already present.",
        ),
      observed_at: z.iso
        .datetime()
        .describe(
          "This field records when the venue was observed in ISO-8601 UTC. Preserve it as provenance and never substitute ingest time.",
        ),
    })
    .strict(),
});

export const result = defineObject({
  name: "result",
  description:
    "A result is the settled truth payload for a market_event and its instruments. Treat settled_at as the governing timestamp that closes uncertainty and enables final grading.",
  lifecycle: "experimental",
  properties: z.object({
    outcome: jsonObject.describe(
      "This field stores structured settlement facts such as winner, method, and per-instrument grading. Keep the structure explicit so grading decisions are reproducible.",
    ),
    settled_at: z.iso
      .datetime()
      .describe(
        "This field records when settled truth became known in ISO-8601 UTC. Do not allow grading decisions to cite truth timestamps after this boundary.",
      ),
  }),
});

export const schedule_market_event = defineAction({
  name: "schedule_market_event",
  description:
    "Schedule one trusted market event from an existing source Artifact. Operator-only provenance is required and creation always writes scheduled state without accepting a caller-supplied status.",
  lifecycle: "experimental",
  operatorOnly: true,
  input: z
    .object({
      market_event_id: z
        .string()
        .describe(
          "This field is the stable Kernel identity for the market event. Reuse it only when all stored event fields and provenance are an exact replay.",
        ),
      sport: market_event.properties.shape.sport,
      starts_at: market_event.properties.shape.starts_at,
      competition: market_event.properties.shape.competition,
      source_artifact_id: z
        .string()
        .describe(
          "This field identifies the existing Artifact that preserves the observed event source. The Kernel rejects a reference that is not already present.",
        ),
      observed_at: z.iso
        .datetime()
        .describe(
          "This field records when the event was observed in ISO-8601 UTC. Preserve it as provenance and never substitute ingest time.",
        ),
    })
    .strict(),
});

export const participates_in = defineLink({
  name: "participates_in",
  description: "Roster edge from each competitor to the market_event it contests.",
  lifecycle: "experimental",
  from: competitor,
  to: market_event,
});

export const offered_on = defineLink({
  name: "offered_on",
  description: "Attachment edge from an instrument to the market_event it is offered on.",
  lifecycle: "experimental",
  from: instrument,
  to: market_event,
});

export const quotes = defineLink({
  name: "quotes",
  description: "Price-history edge from a quote record to the instrument it prices.",
  lifecycle: "experimental",
  from: quote,
  to: instrument,
});

export const lists = defineLink({
  name: "lists",
  description: "Listing edge from a venue to each instrument it offers.",
  lifecycle: "experimental",
  from: venue,
  to: instrument,
});

export const settles = defineLink({
  name: "settles",
  description: "Truth edge from a result row to the market_event it settles.",
  lifecycle: "experimental",
  from: result,
  to: market_event,
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

const ingestInstrumentRow = z
  .object({
    id: z
      .string()
      .describe(
        "This field is the stable Kernel identity for the instrument row. Retries must reuse it only for byte-equivalent market state and provenance.",
      ),
    market_event_id: z
      .string()
      .nullable()
      .describe(
        "This field names the existing market event for the instrument, or null when no bounded event dependency is declared. The Kernel derives offered_on only from this identity.",
      ),
    kind: instrument.properties.shape.kind,
    params: instrument.properties.shape.params,
    sides: instrument.properties.shape.sides,
    correlation_group: instrument.properties.shape.correlation_group,
  })
  .strict();

const ingestQuoteRow = z
  .object({
    id: z
      .string()
      .describe(
        "This field is the stable Kernel identity for the quote row. Retries must reuse it only for byte-equivalent quote state and provenance.",
      ),
    instrument_id: z
      .string()
      .describe(
        "This field identifies the instrument priced by the quote. The Kernel derives exactly one quotes link from this identity.",
      ),
    book: quote.properties.shape.book,
    data_ref: quote.properties.shape.data_ref,
    coverage: quote.properties.shape.coverage,
  })
  .strict();

export const ingest_market_batch = defineAction({
  name: "ingest_market_batch",
  description:
    "Ingest one provenance-bound batch of instrument and quote rows through the trusted market pipeline. The Kernel must validate the whole batch and commit its rows, derived quote links, and evidence events atomically.",
  lifecycle: "experimental",
  pipelineOnly: true,
  input: z
    .object({
      source_artifact_id: z
        .string()
        .describe(
          "This field identifies the existing Artifact that preserves the captured source. The Kernel rejects a batch whose source evidence does not exist.",
        ),
      observed_at: z.iso
        .datetime()
        .describe(
          "This field records the ISO-8601 observation timestamp shared by the batch. Preserve it as provenance rather than substituting ingest time.",
        ),
      venue_id: z
        .string()
        .describe(
          "This field identifies the existing venue for every instrument in the batch. The Kernel derives one lists edge from this identity and never infers venue from free-form market fields.",
        ),
      instruments: z
        .array(ingestInstrumentRow)
        .describe(
          "This field carries strict instrument rows for atomic ingestion. Supply an empty array only when the batch contains at least one quote row.",
        ),
      quotes: z
        .array(ingestQuoteRow)
        .describe(
          "This field carries strict quote rows and their instrument identities for derived links. Supply an empty array only when the batch contains at least one instrument row.",
        ),
    })
    .strict()
    .refine((batch) => batch.instruments.length + batch.quotes.length > 0, {
      message: "Market ingest batch must contain at least one instrument or quote row",
    }),
});
