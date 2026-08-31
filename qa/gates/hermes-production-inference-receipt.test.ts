import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  P14B_ACCEPTED_COMMIT,
  P14B_EVIDENCE_INVENTORY,
  P14B_REQUIRED_HASHES,
  productTreeRows,
  productTreeSha256,
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
    acceptedProductTreeSha256: "a".repeat(64),
    currentProductTreeSha256: "a".repeat(64),
    releaseStatus: {
      contract: "qf.windows.release-status.v1",
      package: { name: "@quantflow/electron", productName: "QuantFlow", version: "0.8.4" },
      build: { commit_sha: P14B_ACCEPTED_COMMIT, packaged_at: "2026-08-31T01:05:57.020Z" },
      installer: { name: "QuantFlow Setup 0.8.4.exe", path: "C:/repo/collab-electron/dist/QuantFlow Setup 0.8.4.exe", authenticode: "NotSigned" },
      artifacts: [
        { path: "C:/repo/collab-electron/dist/win-unpacked/QuantFlow.exe", authenticode: "NotSigned" },
        { path: "C:/repo/collab-electron/dist/QuantFlow Setup 0.8.4.exe", authenticode: "NotSigned" },
      ],
    },
    currentArtifacts: {
      "collab-electron/dist/win-unpacked/resources/app.asar": { exists: true, bytes: 96_709_444, sha256: "99d8bfb57ca1eac3a52be36668d0faa6304a88acaadcb2ab05209077710a52fb" },
      "collab-electron/dist/win-unpacked/QuantFlow.exe": { exists: true, bytes: 213_647_360 },
      "collab-electron/dist/QuantFlow Setup 0.8.4.exe": { exists: true, bytes: 127_171_912 },
    },
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

test("identity, ancestry, product tree, file, missing, and evidence-inventory drift go red", () => {
  red((value) => { value.clean = false; });
  red((value) => { value.descendant = false; });
  red((value) => { value.currentCommit = "short"; });
  red((value) => { value.currentProductTreeSha256 = "0".repeat(64); });
  red((value) => { value.hashes["qa/gates/hermes-production-inference.ts"] = "0".repeat(64); });
  red((value) => { value.hashes["docs/orders/evidence/golden-baseline/phase3/P14-B-PROMPT-20260830.png"] = null; });
  red((value) => { value.evidenceInventory.push("P14-B-EXTRA.log"); });
  red((value) => { value.evidenceInventory.pop(); });
  expect(() => validateP14BReceiptSnapshot(green())).not.toThrow();
});

test("current release status and current artifacts fail closed without reusing the historical ASAR hash", () => {
  red((value) => { value.releaseStatus = null; });
  red((value) => { (value.releaseStatus as Record<string, unknown>).contract = "wrong"; });
  red((value) => { ((value.releaseStatus as Record<string, unknown>).build as Record<string, unknown>).commit_sha = "0".repeat(40); });
  red((value) => { ((value.releaseStatus as Record<string, unknown>).build as Record<string, unknown>).packaged_at = "yesterday"; });
  red((value) => { ((value.releaseStatus as Record<string, unknown>).package as Record<string, unknown>).version = "0.8.3"; });
  red((value) => { ((value.releaseStatus as Record<string, unknown>).artifacts as Array<Record<string, unknown>>)[0]!.path = "C:/repo/wrong.exe"; });
  red((value) => { value.currentArtifacts["collab-electron/dist/win-unpacked/resources/app.asar"]!.exists = false; });
  red((value) => { value.currentArtifacts["collab-electron/dist/win-unpacked/resources/app.asar"]!.bytes = 0; });
  red((value) => { value.currentArtifacts["collab-electron/dist/win-unpacked/resources/app.asar"]!.sha256 = "not-a-hash"; });
  red((value) => { delete value.currentArtifacts["collab-electron/dist/win-unpacked/QuantFlow.exe"]; });
  expect(() => validateP14BReceiptSnapshot(green())).not.toThrow();
});

test("product tree fingerprint preserves mode/type/blob/path and excludes only exact proof surfaces", () => {
  const base = [
    "100644 blob 1111111111111111111111111111111111111111\tqa/gate.ts",
    "100644 blob 2222222222222222222222222222222222222222\tdocs/orders/evidence/golden-baseline/phase3/proof.json",
    "100644 blob 3333333333333333333333333333333333333333\tqf-atlas/atlas.json",
    "100644 blob 4444444444444444444444444444444444444444\ttools/qf-bovada-football/src/gate.ts",
    "100644 blob 5555555555555555555555555555555555555555\tcollab-electron/src/main/index.ts",
    "100644 blob 6666666666666666666666666666666666666666\tqa-shadow/product.ts",
    "100644 blob 7777777777777777777777777777777777777777\tdocs/orders/evidence/golden-baseline/phase30/product.ts",
    "100644 blob 8888888888888888888888888888888888888888\tqf-atlas-shadow/product.ts",
    "100644 blob 9999999999999999999999999999999999999999\ttools/qf-bovada-football/src/gate.ts.extra",
  ].join("\n");
  const rows = productTreeRows(base);
  expect(rows).toHaveLength(5);
  for (const path of ["collab-electron/src/main/index.ts", "qa-shadow/product.ts", "docs/orders/evidence/golden-baseline/phase30/product.ts", "qf-atlas-shadow/product.ts", "tools/qf-bovada-football/src/gate.ts.extra"]) {
    expect(rows.some((row) => row.endsWith(`\t${path}`))).toBe(true);
  }
  const fingerprint = productTreeSha256(base);
  for (const mutant of [
    `${base}\n100644 blob aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\tproduct-added.ts`,
    base.replace(/\n100644 blob 5555[^\n]+/, ""),
    base.replace("100644 blob 5555", "100755 blob 5555"),
    base.replace("collab-electron/src/main/index.ts", "collab-electron/src/main/renamed.ts"),
    base.replace("5555555555555555555555555555555555555555", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),
  ]) expect(productTreeSha256(mutant)).not.toBe(fingerprint);
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
