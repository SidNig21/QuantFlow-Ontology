import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  P14B_ACCEPTED_COMMIT,
  P14B_EVIDENCE_INVENTORY,
  P14B_REQUIRED_HASHES,
  FINAL_FOUNDER_RECEIPT,
  finalProductTreeRows,
  finalProductTreeSha256,
  productTreeRows,
  productTreeSha256,
  validateP14BReceiptSnapshot,
  validateHistoricalReceiptSnapshot,
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
    finalReceipt: JSON.parse(readFileSync(join(ROOT, FINAL_FOUNDER_RECEIPT), "utf8")),
    finalProductTreeSha256: "b".repeat(64),
    currentFinalProductTreeSha256: "b".repeat(64),
    releaseProductTreeSha256: "b".repeat(64),
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
  red((value) => { value.hashes["docs/orders/evidence/golden-baseline/phase3/P14-B-PRODUCTION-INFERENCE-20260830.json"] = "0".repeat(64); });
  red((value) => { value.hashes["docs/orders/evidence/golden-baseline/phase3/P14-B-PROMPT-20260830.png"] = null; });
  red((value) => { value.evidenceInventory.push("P14-B-EXTRA.log"); });
  red((value) => { value.evidenceInventory.pop(); });
  expect(() => validateP14BReceiptSnapshot(green())).not.toThrow();
});

test("current release status, proof-only product equivalence, and artifacts fail closed", () => {
  red((value) => { value.releaseStatus = null; });
  red((value) => { (value.releaseStatus as Record<string, unknown>).contract = "wrong"; });
  red((value) => { ((value.releaseStatus as Record<string, unknown>).build as Record<string, unknown>).commit_sha = "short"; });
  red((value) => { ((value.releaseStatus as Record<string, unknown>).build as Record<string, unknown>).packaged_at = "yesterday"; });
  red((value) => { ((value.releaseStatus as Record<string, unknown>).package as Record<string, unknown>).version = "0.8.3"; });
  red((value) => { ((value.releaseStatus as Record<string, unknown>).artifacts as Array<Record<string, unknown>>)[0]!.path = "C:/repo/wrong.exe"; });
  red((value) => { value.currentArtifacts["collab-electron/dist/win-unpacked/resources/app.asar"]!.exists = false; });
  red((value) => { value.currentArtifacts["collab-electron/dist/win-unpacked/resources/app.asar"]!.bytes = 0; });
  red((value) => { value.currentArtifacts["collab-electron/dist/win-unpacked/resources/app.asar"]!.sha256 = "not-a-hash"; });
  red((value) => { delete value.currentArtifacts["collab-electron/dist/win-unpacked/QuantFlow.exe"]; });
  red((value) => { value.currentFinalProductTreeSha256 = "0".repeat(64); });
  red((value) => { value.releaseProductTreeSha256 = null; });
  expect(() => validateP14BReceiptSnapshot(green())).not.toThrow();
});

test("final founder product fingerprint excludes proof surfaces and preserves product bytes", () => {
  const base = [
    "100644 blob 1111111111111111111111111111111111111111\tqa/gate.ts",
    "100644 blob 2222222222222222222222222222222222222222\tdocs/orders/NEXT.md",
    "100644 blob 3333333333333333333333333333333333333333\tqf-atlas/atlas.json",
    "100644 blob aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\tREADME.md",
    "100644 blob 4444444444444444444444444444444444444444\tcollab-electron/src/main/kernel.ts",
  ].join("\n");
  expect(finalProductTreeRows(base)).toHaveLength(1);
  const fingerprint = finalProductTreeSha256(base);
  expect(finalProductTreeSha256(base.replace("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"))).toBe(fingerprint);
  expect(finalProductTreeSha256(base.replace("4444444444444444444444444444444444444444", "5555555555555555555555555555555555555555"))).not.toBe(fingerprint);
  expect(finalProductTreeSha256(`${base}\n100644 blob 6666666666666666666666666666666666666666\tqa/new-proof.ts`)).toBe(fingerprint);
  expect(finalProductTreeSha256(`${base}\n100644 blob 7777777777777777777777777777777777777777\tREADME.md.backup`)).not.toBe(fingerprint);
});

test("product tree fingerprint preserves mode/type/blob/path and excludes only exact proof surfaces", () => {
  const base = [
    "100644 blob 1111111111111111111111111111111111111111\tqa/gate.ts",
    "100644 blob 2222222222222222222222222222222222222222\tdocs/orders/evidence/golden-baseline/phase3/proof.json",
    "100644 blob 3333333333333333333333333333333333333333\tqf-atlas/atlas.json",
    "100644 blob 4444444444444444444444444444444444444444\ttools/qf-bovada-football/src/gate.ts",
    "100644 blob 5555555555555555555555555555555555555555\tcollab-electron/cli/qf-hermes-synthetic-responder.mjs",
    "100644 blob 6666666666666666666666666666666666666666\tcollab-electron/cli/qf-hermes-synthetic-responder.test.ts",
    "100644 blob 7777777777777777777777777777777777777777\tcollab-electron/package.json",
    "100644 blob 8888888888888888888888888888888888888888\tcollab-electron/cli/qf-hermes-launch.sh",
    "100644 blob 9999999999999999999999999999999999999999\tcollab-electron/src/main/host-native-tui.ts",
    "100644 blob aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\tqa-shadow/product.ts",
    "100644 blob bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\tdocs/orders/evidence/golden-baseline/phase30/product.ts",
    "100644 blob cccccccccccccccccccccccccccccccccccccccc\tqf-atlas-shadow/product.ts",
    "100644 blob dddddddddddddddddddddddddddddddddddddddd\ttools/qf-bovada-football/src/gate.ts.extra",
    "100644 blob eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee\tcollab-electron/cli/qf-hermes-synthetic-responder.mjs.extra",
    "100644 blob ffffffffffffffffffffffffffffffffffffffff\tcollab-electron/cli/qf-hermes-synthetic-responder.test.ts.extra",
  ].join("\n");
  const rows = productTreeRows(base);
  expect(rows).toHaveLength(9);
  for (const path of [
    "collab-electron/package.json",
    "collab-electron/cli/qf-hermes-launch.sh",
    "collab-electron/src/main/host-native-tui.ts",
    "qa-shadow/product.ts",
    "docs/orders/evidence/golden-baseline/phase30/product.ts",
    "qf-atlas-shadow/product.ts",
    "tools/qf-bovada-football/src/gate.ts.extra",
    "collab-electron/cli/qf-hermes-synthetic-responder.mjs.extra",
    "collab-electron/cli/qf-hermes-synthetic-responder.test.ts.extra",
  ]) {
    expect(rows.some((row) => row.endsWith(`\t${path}`))).toBe(true);
  }
  for (const path of [
    "collab-electron/cli/qf-hermes-synthetic-responder.mjs",
    "collab-electron/cli/qf-hermes-synthetic-responder.test.ts",
  ]) expect(rows.some((row) => row.endsWith(`\t${path}`))).toBe(false);
  const fingerprint = productTreeSha256(base);
  for (const mutant of [
    `${base}\n100644 blob 1010101010101010101010101010101010101010\tproduct-added.ts`,
    base.replace(/\n100644 blob 7777[^\n]+/, ""),
    base.replace("100644 blob 8888", "100755 blob 8888"),
    base.replace("collab-electron/src/main/host-native-tui.ts", "collab-electron/src/main/host-native-tui-renamed.ts"),
    base.replace("9999999999999999999999999999999999999999", "0101010101010101010101010101010101010101"),
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

test("final founder route, identity, prompt, provider, and one-turn cardinality mutations go red", () => {
  red((value) => { (value.finalReceipt.identity as Record<string, unknown>).candidate = "0".repeat(40); });
  red((value) => { (value.finalReceipt.route as Record<string, unknown>).authority = "internal RPC"; });
  red((value) => { (value.finalReceipt.route as Record<string, unknown>).prohibited_substitutions_absent = false; });
  red((value) => { (value.finalReceipt.prompt as Record<string, unknown>).sha256 = "0".repeat(64); });
  red((value) => { (value.finalReceipt.execution as Record<string, unknown>).provider = "fallback"; });
  red((value) => { (value.finalReceipt.execution as Record<string, unknown>).model = "wrong-model"; });
  red((value) => { (value.finalReceipt.execution as Record<string, unknown>).user_turns = 2; });
  red((value) => { (value.finalReceipt.execution as Record<string, unknown>).api_calls = 4; });
  red((value) => { (value.finalReceipt.execution as Record<string, unknown>).tool_turns = 3; });
  red((value) => { (value.finalReceipt.execution as Record<string, unknown>).fallback = true; });
  red((value) => { (value.finalReceipt.execution as Record<string, unknown>).unrelated_retry = true; });
  expect(() => validateP14BReceiptSnapshot(green())).not.toThrow();
});

test("final five API rows and four ordered governed tool calls are independently fail-capable", () => {
  red((value) => { (((value.finalReceipt.execution as Record<string, unknown>).api_rows as Array<Record<string, unknown>>)[0]!).input_tokens = 0; });
  red((value) => { (((value.finalReceipt.execution as Record<string, unknown>).api_rows as Array<Record<string, unknown>>)[1]!).latency_seconds = 0; });
  red((value) => { (((value.finalReceipt.execution as Record<string, unknown>).api_rows as Array<Record<string, unknown>>)[2]!).provider = "other"; });
  red((value) => { ((value.finalReceipt.execution as Record<string, unknown>).api_rows as unknown[]).pop(); });
  red((value) => {
    const chain = value.finalReceipt.tool_chain as Array<Record<string, unknown>>;
    [chain[0], chain[1]] = [chain[1]!, chain[0]!];
  });
  red((value) => { (((value.finalReceipt.tool_chain as Array<Record<string, unknown>>)[1]!).arguments as Record<string, unknown>).id = "wrong-task"; });
  red((value) => { (((value.finalReceipt.tool_chain as Array<Record<string, unknown>>)[2]!).arguments as Record<string, unknown>).id = "wrong-session"; });
  red((value) => { (((value.finalReceipt.tool_chain as Array<Record<string, unknown>>)[3]!).artifact as Record<string, unknown>).sha256 = "0".repeat(64); });
  red((value) => { (((value.finalReceipt.tool_chain as Array<Record<string, unknown>>)[0]!).artifact as Record<string, unknown>).role = "critic"; });
  red((value) => {
    const artifact = (value.finalReceipt.tool_chain as Array<Record<string, unknown>>)[0]!.artifact as Record<string, unknown>;
    (artifact.result as Array<Record<string, unknown>>)[0]!.status = "closed";
  });
  expect(() => validateP14BReceiptSnapshot(green())).not.toThrow();
});

test("final Kernel lineage, answer, close-reopen truth, visual checkpoints, and updater honesty go red", () => {
  red((value) => { ((value.finalReceipt.kernel as Record<string, unknown>).task as Record<string, unknown>).id = "wrong-task"; });
  red((value) => { ((value.finalReceipt.kernel as Record<string, unknown>).session as Record<string, unknown>).id = "wrong-session"; });
  red((value) => { ((value.finalReceipt.kernel as Record<string, unknown>).links as unknown[]).pop(); });
  red((value) => { (value.finalReceipt.response as Record<string, unknown>).text = "QF_GOLDEN_ONTOLOGY_OK"; });
  red((value) => { (value.finalReceipt.response as Record<string, unknown>).required_suffix = "wrong"; });
  red((value) => { ((value.finalReceipt.lifecycle as Record<string, unknown>).first_shutdown as Record<string, unknown>).processes = 1; });
  red((value) => { ((value.finalReceipt.lifecycle as Record<string, unknown>).reopen as Record<string, unknown>).task_visible = false; });
  red((value) => { ((value.finalReceipt.lifecycle as Record<string, unknown>).second_shutdown as Record<string, unknown>).socket_absent = false; });
  red((value) => { ((value.finalReceipt.visual as Record<string, unknown>).checkpoints as Record<string, unknown>).response_visible = false; });
  red((value) => { delete ((value.finalReceipt.visual as Record<string, unknown>).update_observation as Record<string, unknown>).http_status; });
  red((value) => { ((value.finalReceipt.visual as Record<string, unknown>).update_observation as Record<string, unknown>).classification = "hidden"; });
  expect(() => validateP14BReceiptSnapshot(green())).not.toThrow();
});

test("direct live observer remains explicitly Computer-Use-only and rejects no-flag execution", () => {
  const source = readFileSync(join(ROOT, "qa/gates/hermes-production-inference.ts"), "utf8");
  expect(source).toContain('process.argv.includes("--computer-use")');
  expect(source).toContain('assert(computerUseInput, "P14-B production inference requires Router-owned Computer Use")');
});

test("historical evidence remains valid when current product or package differs", () => {
  const changed = green();
  changed.currentFinalProductTreeSha256 = "0".repeat(64);
  changed.releaseProductTreeSha256 = null;
  changed.releaseStatus = null;
  changed.currentArtifacts = {};
  expect(() => validateHistoricalReceiptSnapshot(changed)).not.toThrow();
  expect(() => validateP14BReceiptSnapshot(changed)).toThrow();
});

test("historical mode still rejects altered receipts, hashes, and accepted-tree mismatch", () => {
  for (const mutate of [
    (value: P14BReceiptSnapshot) => { value.hashes[FINAL_FOUNDER_RECEIPT] = "0".repeat(64); },
    (value: P14BReceiptSnapshot) => { value.currentProductTreeSha256 = "0".repeat(64); },
    (value: P14BReceiptSnapshot) => { value.receipt.result = "FAIL"; },
    (value: P14BReceiptSnapshot) => { value.finalReceipt.result = "FAIL"; },
  ]) {
    const value = green();
    mutate(value);
    expect(() => validateHistoricalReceiptSnapshot(value)).toThrow();
    expect(() => validateP14BReceiptSnapshot(value)).toThrow();
  }
});
