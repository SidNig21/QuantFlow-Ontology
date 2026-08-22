/**
 * WO-K3 — attachKernel drift and incomplete-init enforcement (RULING 2+3).
 */
import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  getKernelDrift,
  type KernelDb,
} from "./db.ts";
import { closeKernel, openKernel } from "./db-bun.ts";
import { execute } from "./execute.ts";
import { ensureGovernedReviewSchema } from "./governed-review.ts";
import {
  KernelIncompleteInitializationError,
  KernelRegistryDriftError,
} from "./errors.ts";

const REPO_ROOT = join(import.meta.dir, "../../..");
const PRIOR_MIGRATION = join(
  REPO_ROOT,
  "qa/fixtures/kernel-drift/prior-schema/migration.sql",
);
const CANARY_SQL = join(REPO_ROOT, "qa/fixtures/kernel-drift/canary-only.sql");
const FIXTURE_ENV = "QF_KERNEL_SYNC_UNSAFE_FIXTURES_ONLY";

const dirs: string[] = [];

afterEach(() => {
  delete process.env[FIXTURE_ENV];
  for (const d of dirs.splice(0)) {
    rmSync(d, { recursive: true, force: true });
  }
});

function tempDir(): string {
  const d = mkdtempSync(join(tmpdir(), "qf-k3-attach-"));
  dirs.push(d);
  return d;
}

function seedPriorSnapshot(path: string): void {
  const db = new Database(path);
  const tx = db.transaction(() => {
    db.exec(readFileSync(PRIOR_MIGRATION, "utf8"));
  });
  tx();
  db.close();
}

function seedCanaryOnly(path: string): void {
  const db = new Database(path);
  const tx = db.transaction(() => {
    db.exec(readFileSync(CANARY_SQL, "utf8"));
  });
  tx();
  db.close();
}

function captureStderr(fn: () => void): string {
  const chunks: string[] = [];
  const orig = process.stderr.write.bind(process.stderr);
  process.stderr.write = ((chunk: string | Uint8Array) => {
    chunks.push(typeof chunk === "string" ? chunk : new TextDecoder().decode(chunk));
    return true;
  }) as typeof process.stderr.write;
  try {
    fn();
  } finally {
    process.stderr.write = orig;
  }
  return chunks.join("");
}

const ctx = { trace_id: "k3-trace", span_id: "k3-span" };
const GOVERNED_REVIEW_SUPPORT_TABLES = [
  "qf_review_source_work",
  "qf_review_task",
  "qf_review_invocation",
  "qf_review_attempt",
  "qf_review_receipt",
  "qf_review_publication",
] as const;

describe("attachKernel WO-K3 drift / incomplete init", () => {
  test("canary-only schema_meta writable → KernelIncompleteInitializationError", () => {
    const path = join(tempDir(), "canary.db");
    seedCanaryOnly(path);
    expect(() => openKernel(path)).toThrow(KernelIncompleteInitializationError);
  });

  test("canary-only schema_meta readonly → warn + getKernelDrift, no artifact table", () => {
    const path = join(tempDir(), "canary-ro.db");
    seedCanaryOnly(path);

    let db: KernelDb | undefined;
    const err = captureStderr(() => {
      db = openKernel(path, { readonly: true });
    });
    expect(db).toBeDefined();
    expect(err).toMatch(/incomplete initialization/i);

    const drift = getKernelDrift(db!);
    expect(drift).not.toBeNull();
    expect(drift!.ok).toBe(false);
    expect("incomplete" in drift!).toBe(true);

    const names = (db!
      .query(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`)
      .all() as Array<{ name: string }>).map((r) => r.name);
    expect(names).not.toContain("artifact");

    closeKernel(db!);
  });

  test("clean :memory: writable publish succeeds", () => {
    process.env[FIXTURE_ENV] = "1";
    const db = openKernel(":memory:");
    const bytes = new TextEncoder().encode("k3-clean-memory-publish");
    const result = execute(
      db,
      "publish_artifact",
      {
        // Not a report: R12 gates report publication behind a supporting
        // evaluation, and this test covers clean-init writability only.
        kind: "result_set",
        bytes,
        storage_ref: "mem://k3-clean",
      },
      ctx,
    );
    expect(result.object_type).toBe("artifact");
    closeKernel(db);
  });

  test("prior-schema fixture writable → KernelRegistryDriftError", () => {
    const path = join(tempDir(), "prior.db");
    seedPriorSnapshot(path);
    expect(() => openKernel(path)).toThrow(KernelRegistryDriftError);
  });

  test("prior-schema fixture readonly → warn + getKernelDrift", () => {
    const path = join(tempDir(), "prior-ro.db");
    seedPriorSnapshot(path);

    let db: KernelDb | undefined;
    const err = captureStderr(() => {
      db = openKernel(path, { readonly: true });
    });
    expect(db).toBeDefined();
    expect(err).toMatch(/object-type registry drift/i);

    const drift = getKernelDrift(db!);
    if (drift === null) {
      throw new Error("readonly drift fixture must expose getKernelDrift");
    }
    expect(drift.ok).toBe(false);
    if ("missing" in drift) {
      expect(drift.missing.length).toBeGreaterThan(0);
    }

    closeKernel(db!);
  });

  test("reopens governed-review schema with support rows intact", () => {
    const path = join(tempDir(), "governed-review-reopen.db");
    const createdAt = "2026-08-22T00:00:00.000Z";
    const sourceWork =
      '{"source_task_id":"source-task","hypothesis_id":"hypothesis","run_id":"run","result_artifact_id":"result-artifact","executor_session_id":"executor"}';

    const first = openKernel(path, { create: true });
    ensureGovernedReviewSchema(first);
    first.query(
      "INSERT INTO qf_review_source_work (source_task_id, source_work, created_at) VALUES (?, ?, ?)",
    ).run("source-task", sourceWork, createdAt);
    first.query(
      "INSERT INTO qf_review_task (task_id, kind, source_task_id, source_work, critic_session_id, assignee_session_id, attempt_id, triggering_evaluation_id, lifecycle, terminal_receipt_kind, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(
      "review-task",
      "review",
      "source-task",
      sourceWork,
      "critic",
      "critic",
      "attempt-1",
      null,
      "pending",
      null,
      createdAt,
    );
    first.query(
      "INSERT INTO qf_review_invocation (invocation_id, session_id, task_id, tool_name, arguments, result, success, broker_sequence, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(
      "invocation-1",
      "critic",
      "review-task",
      "qf_hypothesis_get",
      '{"id":"hypothesis"}',
      '{"ok":true}',
      1,
      1,
      createdAt,
    );
    first.query(
      "INSERT INTO qf_review_attempt (action_kind, source_task_id, source_work, triggering_evaluation_id, attempt_id, outcome, result, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(
      "request_review",
      "source-task",
      sourceWork,
      null,
      "attempt-1",
      "admitted",
      '{"kind":"admitted","attempt_id":"attempt-1"}',
      createdAt,
    );
    first.query(
      "INSERT INTO qf_review_receipt (id, kind, task_id, payload, created_at) VALUES (?, ?, ?, ?, ?)",
    ).run(
      "receipt-1",
      "delivery_receipt",
      "review-task",
      '{"outcome":"delivered","task_id":"review-task"}',
      createdAt,
    );
    first.query(
      "INSERT INTO qf_review_publication (source_work_key, report_artifact_id, publication_evaluation_id, created_at) VALUES (?, ?, ?, ?)",
    ).run(
      "source-task\0hypothesis\0run\0result-artifact\0executor",
      "report-artifact",
      "evaluation",
      createdAt,
    );

    const snapshot = (db: KernelDb) =>
      GOVERNED_REVIEW_SUPPORT_TABLES.map((table) =>
        db.query(`SELECT * FROM ${table} ORDER BY rowid`).all(),
      );
    const firstSnapshots = snapshot(first);
    expect(firstSnapshots).toEqual([
      [{ source_task_id: "source-task", source_work: sourceWork, created_at: createdAt }],
      [{
        task_id: "review-task",
        kind: "review",
        source_task_id: "source-task",
        source_work: sourceWork,
        critic_session_id: "critic",
        assignee_session_id: "critic",
        attempt_id: "attempt-1",
        triggering_evaluation_id: null,
        lifecycle: "pending",
        terminal_receipt_kind: null,
        created_at: createdAt,
      }],
      [{
        invocation_id: "invocation-1",
        session_id: "critic",
        task_id: "review-task",
        tool_name: "qf_hypothesis_get",
        arguments: '{"id":"hypothesis"}',
        result: '{"ok":true}',
        success: 1,
        broker_sequence: 1,
        created_at: createdAt,
      }],
      [{
        action_kind: "request_review",
        source_task_id: "source-task",
        source_work: sourceWork,
        triggering_evaluation_id: null,
        attempt_id: "attempt-1",
        outcome: "admitted",
        result: '{"kind":"admitted","attempt_id":"attempt-1"}',
        created_at: createdAt,
      }],
      [{
        id: "receipt-1",
        kind: "delivery_receipt",
        task_id: "review-task",
        payload: '{"outcome":"delivered","task_id":"review-task"}',
        created_at: createdAt,
      }],
      [{
        source_work_key: "source-task\0hypothesis\0run\0result-artifact\0executor",
        report_artifact_id: "report-artifact",
        publication_evaluation_id: "evaluation",
        created_at: createdAt,
      }],
    ]);
    const firstBytes = JSON.stringify(firstSnapshots);
    closeKernel(first);

    const reopened = openKernel(path);
    try {
      expect(getKernelDrift(reopened)).toBeNull();
      const reopenedSnapshots = snapshot(reopened);
      expect(JSON.stringify(reopenedSnapshots)).toBe(firstBytes);
    } finally {
      closeKernel(reopened);
    }
  });
});
