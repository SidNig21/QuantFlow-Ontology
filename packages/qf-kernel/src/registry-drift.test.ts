import { describe, expect, test } from "bun:test";
import { detectObjectTypeRegistryDrift } from "./registry-drift.ts";

const DECLARED = ["artifact", "agent_session", "run"] as const;
const GOVERNED_REVIEW_SUPPORT_TABLES = [
  "qf_review_source_work",
  "qf_review_task",
  "qf_review_invocation",
  "qf_review_attempt",
  "qf_review_receipt",
  "qf_review_publication",
] as const;

describe("detectObjectTypeRegistryDrift", () => {
  test("clean: declared, meta, and tables agree → ok", () => {
    const r = detectObjectTypeRegistryDrift({
      declared: DECLARED,
      metaObjects: [...DECLARED],
      tables: [...DECLARED, "events", "links", "schema_meta"],
    });
    expect(r).toEqual({ ok: true });
  });

  test("missing: declared absent from meta", () => {
    const r = detectObjectTypeRegistryDrift({
      declared: DECLARED,
      metaObjects: ["artifact", "agent_session"],
      tables: ["artifact", "agent_session", "events", "links", "schema_meta"],
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.missing).toEqual(["run"]);
    expect(r.retired).toEqual([]);
  });

  test("retired: meta object no longer declared", () => {
    const r = detectObjectTypeRegistryDrift({
      declared: DECLARED,
      metaObjects: [...DECLARED, "odds_series"],
      tables: [...DECLARED, "odds_series", "events", "links", "schema_meta"],
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.retired).toEqual(["odds_series"]);
  });

  test("inconsistent: meta claims type with no table", () => {
    const r = detectObjectTypeRegistryDrift({
      declared: DECLARED,
      metaObjects: [...DECLARED],
      tables: ["artifact", "agent_session", "events", "links", "schema_meta"],
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.inconsistent).toContain("run");
  });

  test("inconsistent: orphan non-infra table with no meta claim", () => {
    const r = detectObjectTypeRegistryDrift({
      declared: DECLARED,
      metaObjects: [...DECLARED],
      tables: [...DECLARED, "orphan_probe", "events", "links", "schema_meta"],
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.inconsistent).toContain("orphan_probe");
  });

  test("infra tables alone never mark inconsistent", () => {
    const r = detectObjectTypeRegistryDrift({
      declared: DECLARED,
      metaObjects: [...DECLARED],
      tables: [...DECLARED, "events", "links", "schema_meta", "sqlite_sequence"],
    });
    expect(r).toEqual({ ok: true });
  });

  test("ignores exactly six governed-review support tables but rejects a seventh orphan", () => {
    const r = detectObjectTypeRegistryDrift({
      declared: DECLARED,
      metaObjects: [...DECLARED],
      tables: [
        ...DECLARED,
        ...GOVERNED_REVIEW_SUPPORT_TABLES,
        "qf_review_orphan",
        "events",
        "links",
        "schema_meta",
        "sqlite_sequence",
      ],
    });
    expect(r).toEqual({
      ok: false,
      missing: [],
      retired: [],
      inconsistent: ["qf_review_orphan"],
    });
  });
});
