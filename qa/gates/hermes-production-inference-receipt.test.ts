import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  P14B_ACCEPTED_COMMIT,
  P14B_EVIDENCE_INVENTORY,
  P14B_REQUIRED_HASHES,
  validateP14BReceiptSnapshot,
  type P14BReceiptSnapshot,
} from "./hermes-production-inference-receipt.ts";

const ROOT = join(import.meta.dir, "../..");

function green(): P14BReceiptSnapshot {
  return {
    currentCommit: P14B_ACCEPTED_COMMIT,
    clean: true,
    descendant: true,
    hashes: { ...P14B_REQUIRED_HASHES },
    evidenceInventory: [...P14B_EVIDENCE_INVENTORY],
    receipt: JSON.parse(readFileSync(join(ROOT, "docs/orders/evidence/golden-baseline/phase3/P14-B-PRODUCTION-INFERENCE-20260830.json"), "utf8")),
  };
}

function red(mutate: (snapshot: P14BReceiptSnapshot) => void): void {
  const snapshot = green();
  mutate(snapshot);
  expect(() => validateP14BReceiptSnapshot(snapshot)).toThrow();
}

test("accepted P14-B receipt snapshot restores green without a provider call", () => {
  expect(() => validateP14BReceiptSnapshot(green())).not.toThrow();
});

test("identity, ancestry, package, file, missing, and evidence-inventory drift go red", () => {
  red((value) => { value.clean = false; });
  red((value) => { value.descendant = false; });
  red((value) => { value.currentCommit = "short"; });
  red((value) => { value.hashes["collab-electron/dist/win-unpacked/resources/app.asar"] = "0".repeat(64); });
  red((value) => { value.hashes["qa/gates/hermes-production-inference.ts"] = "0".repeat(64); });
  red((value) => { value.hashes["docs/orders/evidence/golden-baseline/phase3/P14-B-PROMPT-20260830.png"] = null; });
  red((value) => { value.evidenceInventory.push("P14-B-EXTRA.log"); });
  red((value) => { value.evidenceInventory.pop(); });
  expect(() => validateP14BReceiptSnapshot(green())).not.toThrow();
});

test("false conjuncts, keyset drift, leakage, and extra raw evidence go red", () => {
  red((value) => { (value.receipt.conjuncts as Record<string, unknown>).cleanup_zero = false; });
  red((value) => { (value.receipt as Record<string, unknown>).extra = true; });
  red((value) => { delete (value.receipt.route as Record<string, unknown>).enter_dispatched; });
  red((value) => { (value.receipt.trusted_log as Record<string, unknown>).authorization = "Bearer secret-secret-secret"; });
  red((value) => { (value.receipt.visual_evidence as Record<string, unknown>).raw_payload = "terminal bytes"; });
  red((value) => { (value.receipt.kernel as Record<string, unknown>).note = "api_key=secret-value-123456789"; });
  expect(() => validateP14BReceiptSnapshot(green())).not.toThrow();
});

test("prompt, provider, API, Turn, runtime, Kernel, screenshot, exit, and cleanup drift go red", () => {
  red((value) => { (value.receipt.identity as Record<string, unknown>).prompt_sha256 = "0".repeat(64); });
  red((value) => { (value.receipt.trusted_log as Record<string, unknown>).configured_provider = "fallback"; });
  red((value) => { ((value.receipt.trusted_log as Record<string, unknown>).api_rows as Array<Record<string, unknown>>)[0]!.ordinal = 2; });
  red((value) => { ((value.receipt.trusted_log as Record<string, unknown>).turn_rows as Array<Record<string, unknown>>)[0]!.api_calls = 2; });
  red((value) => { (value.receipt.route as Record<string, unknown>).runtime_session_id = "wrong-session"; });
  red((value) => { (value.receipt.kernel as Record<string, unknown>).spawnedFrom = "hermes-worker"; });
  red((value) => { (value.receipt.visual_evidence as Record<string, unknown>).response_png_sha256 = "0".repeat(64); });
  red((value) => { value.receipt.app_exit_code = 1; });
  red((value) => { (value.receipt.cleanup as Record<string, unknown>).processes = 1; });
  expect(() => validateP14BReceiptSnapshot(green())).not.toThrow();
});

test("direct live observer remains explicitly Computer-Use-only and rejects no-flag execution", () => {
  const source = readFileSync(join(ROOT, "qa/gates/hermes-production-inference.ts"), "utf8");
  expect(source).toContain('process.argv.includes("--computer-use")');
  expect(source).toContain('assert(computerUseInput, "P14-B production inference requires Router-owned Computer Use")');
});
