import { afterEach, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { closeKernel, openKernel } from "./db-bun.ts";
import { classifyKernelShape } from "./upgrade.ts";

let root = "";

afterEach(() => {
  if (!root) return;
  const target = resolve(root);
  if (!target.startsWith(`${resolve(tmpdir())}\\`) || !target.includes("qf-w1-evidence-upgrade-")) {
    throw new Error(`unsafe cleanup ${target}`);
  }
  rmSync(target, { recursive: true, force: true });
  root = "";
});

test("openKernel upgrades the exact pre-W1 evidence shape before a Dataset write", () => {
  root = mkdtempSync(join(tmpdir(), "qf-w1-evidence-upgrade-"));
  const path = join(root, "kernel.db");
  const created = openKernel(path, { create: true });
  closeKernel(created);

  const predecessor = new Database(path);
  predecessor.exec(`
    CREATE TABLE dataset__pre_w1 (
      id TEXT PRIMARY KEY NOT NULL,
      created_at TEXT NOT NULL,
      kind TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      as_of TEXT NOT NULL,
      coverage TEXT NOT NULL,
      CHECK (kind IN ('odds_history', 'results', 'features', 'mixed'))
    );
    INSERT INTO dataset__pre_w1 (id, created_at, kind, content_hash, as_of, coverage)
      SELECT id, created_at, kind, content_hash, as_of, coverage FROM dataset;
    DROP TABLE dataset;
    ALTER TABLE dataset__pre_w1 RENAME TO dataset;
    DELETE FROM schema_meta WHERE type_name = 'reschedule_market_event';
    UPDATE schema_meta SET description = 'Full input manifest for a run: datasets, strategies, and tools consumed.' WHERE type_name = 'uses';
    UPDATE schema_meta SET description = 'Mission context: which standing Mission owns a delegated Task.' WHERE type_name = 'belongs_to';
    UPDATE schema_meta SET description = 'Execute one canonical strategy specification against one immutable Dataset. The Kernel owns the execution version, result bytes, content hash, and complete uses/executes_in/produces lineage; a claimed repeat is rejected unless its manifest and result hash match.' WHERE type_name = 'execute_deterministic_run';
  `);
  expect(classifyKernelShape(predecessor)).toBe("pre_wave1_evidence");
  predecessor.close();

  const upgraded = openKernel(path);
  expect(classifyKernelShape(upgraded)).toBe("current");
  expect(upgraded.query("PRAGMA table_info(dataset)").all()).toEqual(
    expect.arrayContaining([expect.objectContaining({ name: "purpose" })]),
  );
  closeKernel(upgraded);
});
