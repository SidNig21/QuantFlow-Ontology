#!/usr/bin/env bun
/** Reuse the one accepted P14-B live inference receipt without another provider call. */
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

export const P14B_ACCEPTED_COMMIT = "bb837464d889ea196c4c00aeb003bf949296d91f";
export const P14B_ACCEPTED_PRODUCT_BASE = "a44c0f1ad20a8878ba74db321bbd9088a8c42f6d";
export const P14B_PACKAGE_SHA256 = "1611d0725f53ffcc83c85073f28a4348869b0406fa36cd7213abeac35e0df8e3";
export const P14B_PROMPT_SHA256 = "f9f9a7a454880b623ad5d337c9126c5b4e41538a8d78bc3f0141907c4da310e1";
export const P14B_REQUIRED_HASHES = {
  "qa/gates/hermes-production-inference.ts": "33e8bef1555aaf2fe9a83a746b3675b37c32707f6dc320b0aaa505fb7fa44259",
  "qa/gates/hermes-production-inference.test.ts": "d0b6c51b8e048d7aef5de1139f11ff21a06824241ef78e3bd206612361842360",
  "docs/orders/evidence/golden-baseline/phase3/P14-B-PRODUCTION-INFERENCE-20260830.json": "206d43652004020263181c89c2817ded76693a7617fe9148b498ca2ccdc24583",
  "docs/orders/evidence/golden-baseline/phase3/P14-B-PROMPT-20260830.png": "9525a0eea113d7ee36a8f6ad4311b133fecec29085e8851894136726526e6d80",
  "docs/orders/evidence/golden-baseline/phase3/P14-B-RESPONSE-20260830.png": "eefdcc93fd6bd3452b399ea8d5c3770025c6e116161c74572bcf36d1f7fa0024",
} as const;

export const P14B_EVIDENCE_INVENTORY = [
  "P14-B-PRODUCTION-INFERENCE-20260830.json",
  "P14-B-PROMPT-20260830.png",
  "P14-B-RESPONSE-20260830.png",
] as const;

const TOP_KEYS = ["app_exit_code", "cleanup", "conjuncts", "error_code", "gate", "identity", "kernel", "provider_contact", "result", "route", "schema", "terminal_transport", "trusted_log", "visual_evidence"];
const CLEANUP_KEYS = ["leaked", "processes", "rootsRemaining"];
const CONJUNCT_KEYS = ["api_ordinal_one", "api_provider_model", "api_tokens_latency", "app_exit_zero", "app_readiness", "cleanup_zero", "dock_click", "exact_api_row", "exact_tile", "exact_turn_row", "exact_webview", "fresh_log_present", "input_and_enter", "kernel_binding", "no_runtime_error_codes", "post_response_ready_visible", "prompt_response_screenshots", "rendered_surface_present", "turn_bound_success"];
const IDENTITY_KEYS = ["build_sha256", "candidate", "prompt_sha256", "tree"];
const KERNEL_KEYS = ["definitionId", "runtimeProfile", "sessionId", "spawnedFrom", "status"];
const ROUTE_KEYS = ["dock_clicked", "enter_dispatched", "input_completed_at", "input_dispatched", "input_started_at", "kernel_session_id", "readiness", "runtime_session_id", "tile_count", "webview_count"];
const TRANSPORT_KEYS = ["authority", "bytes", "nonce_occurrences", "nonce_only_lines", "present", "sha256"];
const LOG_KEYS = ["api_rows", "bytes", "configured_model", "configured_provider", "present", "runtime_error_codes", "sha256", "turn_rows"];
const API_KEYS = ["input_tokens", "latency_seconds", "model", "ordinal", "output_tokens", "provider", "session", "timestamp", "total_tokens"];
const TURN_KEYS = ["api_calls", "model", "response_length", "session", "successful", "timestamp"];
const VISUAL_KEYS = ["authority", "post_response_ready_visible", "prompt_png_sha256", "rendered_text_bytes", "rendered_text_present", "rendered_text_sha256", "response_png_sha256"];
const EXPECTED_RUNTIME_SESSION = "20260830_170010_284a31";
const EXPECTED_KERNEL_SESSION = "9ef5d018-a200-48d3-8669-149ecb5e7568";

type Json = Record<string, unknown>;

export type P14BReceiptSnapshot = {
  currentCommit: string;
  clean: boolean;
  descendant: boolean;
  hashes: Record<string, string | null>;
  evidenceInventory: string[];
  receipt: Json;
  acceptedProductTreeSha256: string;
  currentProductTreeSha256: string;
  releaseStatus: Json | null;
  currentArtifacts: Record<string, { exists: boolean; bytes: number; sha256?: string }>;
};

const CURRENT_ASAR = "collab-electron/dist/win-unpacked/resources/app.asar";
const CURRENT_EXE = "collab-electron/dist/win-unpacked/QuantFlow.exe";
const CURRENT_INSTALLER = "collab-electron/dist/QuantFlow Setup 0.8.4.exe";
const PRODUCT_TREE_EXACT_EXCLUSION = "tools/qf-bovada-football/src/gate.ts";
const PRODUCT_TREE_PREFIX_EXCLUSIONS = [
  "qa/",
  "docs/orders/evidence/golden-baseline/phase3/",
  "qf-atlas/",
] as const;

function object(value: unknown, label: string): Json {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} is not an object`);
  return value as Json;
}

function exactKeys(value: unknown, expected: readonly string[], label: string): Json {
  const row = object(value, label);
  const actual = Object.keys(row).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) throw new Error(`${label} keyset drift`);
  return row;
}

function exactArray(value: unknown, length: number, label: string): unknown[] {
  if (!Array.isArray(value) || value.length !== length) throw new Error(`${label} cardinality drift`);
  return value;
}

function requireValue(condition: unknown, label: string): asserts condition {
  if (!condition) throw new Error(label);
}

function rejectLeakage(value: unknown, path = "receipt"): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => rejectLeakage(entry, `${path}[${index}]`));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value as Json)) {
      const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (/(?:credential|rawlog|rawpayload|header|authorization|apikey|secret)/.test(normalized)) {
        throw new Error(`forbidden evidence field ${path}.${key}`);
      }
      rejectLeakage(entry, `${path}.${key}`);
    }
    return;
  }
  if (typeof value === "string" && /(?:sk-[A-Za-z0-9_-]{16,}|api[_-]?key\s*[:=]|bearer\s+[A-Za-z0-9._-]{16,}|authorization\s*[:=])/i.test(value)) {
    throw new Error(`credential-shaped evidence value at ${path}`);
  }
}

export function productTreeRows(lsTree: string): string[] {
  return lsTree.replaceAll("\r\n", "\n").split("\n").filter(Boolean).filter((row) => {
    const separator = row.indexOf("\t");
    requireValue(separator > 0, "malformed git ls-tree row");
    const metadata = row.slice(0, separator).split(" ");
    requireValue(metadata.length === 3 && /^[0-7]{6}$/.test(metadata[0]!) && metadata[1] === "blob" && /^[0-9a-f]{40}$/.test(metadata[2]!), "git ls-tree row lacks exact mode/type/blob");
    const path = row.slice(separator + 1);
    if (path === PRODUCT_TREE_EXACT_EXCLUSION) return false;
    return !PRODUCT_TREE_PREFIX_EXCLUSIONS.some((prefix) => path.startsWith(prefix));
  }).sort();
}

export function productTreeSha256(lsTree: string): string {
  const rows = productTreeRows(lsTree);
  return createHash("sha256").update(rows.length ? `${rows.join("\n")}\n` : "", "utf8").digest("hex");
}

function normalizedArtifactPath(value: unknown): string {
  return typeof value === "string" ? value.replaceAll("\\", "/") : "";
}

export function validateP14BReceiptSnapshot(snapshot: P14BReceiptSnapshot): void {
  requireValue(snapshot.clean, "repository is dirty");
  requireValue(/^[0-9a-f]{40}$/.test(snapshot.currentCommit) && snapshot.descendant, "current commit is not a clean descendant of accepted P14-B authority");
  for (const [path, expected] of Object.entries(P14B_REQUIRED_HASHES)) {
    const actual = snapshot.hashes[path];
    requireValue(typeof actual === "string", `required P14-B file missing: ${path}`);
    requireValue(actual === expected, `P14-B hash drift: ${path}`);
  }
  requireValue(
    JSON.stringify([...snapshot.evidenceInventory].sort()) === JSON.stringify([...P14B_EVIDENCE_INVENTORY].sort()),
    "P14-B evidence inventory drift",
  );
  requireValue(/^[0-9a-f]{64}$/.test(snapshot.acceptedProductTreeSha256) && snapshot.acceptedProductTreeSha256 === snapshot.currentProductTreeSha256, "current product tree differs from accepted P14-B product base");

  const release = exactKeys(snapshot.releaseStatus, ["artifacts", "build", "contract", "installer", "package"], "release_status");
  const releasePackage = exactKeys(release.package, ["name", "productName", "version"], "release_status.package");
  const releaseBuild = exactKeys(release.build, ["commit_sha", "packaged_at"], "release_status.build");
  const releaseInstaller = exactKeys(release.installer, ["authenticode", "name", "path"], "release_status.installer");
  const releaseArtifacts = exactArray(release.artifacts, 2, "release_status.artifacts").map((row, index) => exactKeys(row, ["authenticode", "path"], `release_status.artifacts[${index}]`));
  requireValue(release.contract === "qf.windows.release-status.v1", "release status contract drift");
  requireValue(releasePackage.name === "@quantflow/electron" && releasePackage.productName === "QuantFlow" && releasePackage.version === "0.8.4", "release package identity drift");
  requireValue(releaseBuild.commit_sha === snapshot.currentCommit, "release status is not bound to current HEAD");
  const packagedAt = typeof releaseBuild.packaged_at === "string" ? releaseBuild.packaged_at : "";
  requireValue(packagedAt.length > 0 && Number.isFinite(Date.parse(packagedAt)) && new Date(packagedAt).toISOString() === packagedAt, "release packaged_at is not canonical");
  requireValue(releaseInstaller.name === "QuantFlow Setup 0.8.4.exe" && normalizedArtifactPath(releaseInstaller.path).endsWith(`/${CURRENT_INSTALLER}`), "release installer reference drift");
  const referencedArtifacts = releaseArtifacts.map((row) => normalizedArtifactPath(row.path)).sort();
  requireValue([CURRENT_INSTALLER, CURRENT_EXE].every((expected) => referencedArtifacts.some((path) => path.endsWith(`/${expected}`))), "release artifact references drift");
  requireValue(JSON.stringify(Object.keys(snapshot.currentArtifacts).sort()) === JSON.stringify([CURRENT_ASAR, CURRENT_EXE, CURRENT_INSTALLER].sort()), "current artifact inventory drift");
  for (const path of [CURRENT_ASAR, CURRENT_EXE, CURRENT_INSTALLER]) {
    const artifact = snapshot.currentArtifacts[path];
    requireValue(artifact?.exists === true && artifact.bytes > 0, `current release artifact missing or empty: ${path}`);
  }
  requireValue(/^[0-9a-f]{64}$/.test(snapshot.currentArtifacts[CURRENT_ASAR]!.sha256 ?? ""), "current app.asar hash fact missing");

  rejectLeakage(snapshot.receipt);
  const receipt = exactKeys(snapshot.receipt, TOP_KEYS, "receipt");
  const cleanup = exactKeys(receipt.cleanup, CLEANUP_KEYS, "cleanup");
  const conjuncts = exactKeys(receipt.conjuncts, CONJUNCT_KEYS, "conjuncts");
  const identity = exactKeys(receipt.identity, IDENTITY_KEYS, "identity");
  const kernel = exactKeys(receipt.kernel, KERNEL_KEYS, "kernel");
  const route = exactKeys(receipt.route, ROUTE_KEYS, "route");
  exactKeys(receipt.terminal_transport, TRANSPORT_KEYS, "terminal_transport");
  const trusted = exactKeys(receipt.trusted_log, LOG_KEYS, "trusted_log");
  const visual = exactKeys(receipt.visual_evidence, VISUAL_KEYS, "visual_evidence");
  const api = exactKeys(exactArray(trusted.api_rows, 1, "api_rows")[0], API_KEYS, "api_row");
  const turn = exactKeys(exactArray(trusted.turn_rows, 1, "turn_rows")[0], TURN_KEYS, "turn_row");

  requireValue(receipt.schema === "qf.p14b.production-inference-diagnostic.v2" && receipt.gate === "hermes-production-inference" && receipt.result === "PASS", "P14-B receipt identity/result drift");
  requireValue(Object.values(conjuncts).every((value) => value === true), "P14-B conjunct is not true");
  requireValue(identity.build_sha256 === P14B_PACKAGE_SHA256 && identity.prompt_sha256 === P14B_PROMPT_SHA256, "P14-B build/prompt identity drift");
  requireValue(identity.candidate === "a44c0f1ad20a8878ba74db321bbd9088a8c42f6d" && identity.tree === "f4b8a5363077f249961a9ecc606c82c3d9e25efe", "P14-B live candidate identity drift");
  requireValue(receipt.provider_contact === "proven" && receipt.error_code === "none", "P14-B provider/error receipt drift");
  requireValue(route.readiness === true && route.dock_clicked === true && route.tile_count === 1 && route.webview_count === 1 && route.input_dispatched === true && route.enter_dispatched === true, "P14-B founder route drift");
  requireValue(route.kernel_session_id === EXPECTED_KERNEL_SESSION && route.runtime_session_id === EXPECTED_RUNTIME_SESSION && route.input_started_at === 1788134411861 && route.input_completed_at === 1788134500733, "P14-B session/time binding drift");
  requireValue(trusted.present === true && trusted.configured_provider === "opencode-go" && trusted.configured_model === "kimi-k3" && Array.isArray(trusted.runtime_error_codes) && trusted.runtime_error_codes.length === 0, "P14-B trusted log identity drift");
  requireValue(api.provider === "opencode-go" && api.model === "kimi-k3" && api.session === EXPECTED_RUNTIME_SESSION && api.ordinal === 1 && api.input_tokens === 1411 && api.output_tokens === 56 && api.total_tokens === 1467 && api.latency_seconds === 3.6 && api.timestamp === 1788134499000, "P14-B API row drift");
  requireValue(turn.session === EXPECTED_RUNTIME_SESSION && turn.model === "kimi-k3" && turn.api_calls === 1 && turn.response_length === 31 && turn.successful === true && turn.timestamp === 1788134499000, "P14-B Turn row drift");
  requireValue(kernel.definitionId === "hermes-research-director" && kernel.runtimeProfile === "default" && kernel.sessionId === EXPECTED_KERNEL_SESSION && kernel.spawnedFrom === "hermes-research-director" && kernel.status === "running", "P14-B Kernel binding drift");
  requireValue(receipt.app_exit_code === 0 && cleanup.processes === 0 && cleanup.rootsRemaining === 0 && Array.isArray(cleanup.leaked) && cleanup.leaked.length === 0, "P14-B exit/cleanup drift");
  requireValue(visual.authority === "rendered-product-corroboration-with-Windows-OCR-fallback" && visual.post_response_ready_visible === true && visual.rendered_text_present === true, "P14-B rendered evidence drift");
  requireValue(visual.prompt_png_sha256 === P14B_REQUIRED_HASHES["docs/orders/evidence/golden-baseline/phase3/P14-B-PROMPT-20260830.png"] && visual.response_png_sha256 === P14B_REQUIRED_HASHES["docs/orders/evidence/golden-baseline/phase3/P14-B-RESPONSE-20260830.png"], "P14-B screenshot binding drift");
}

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function git(root: string, args: string[]): string {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 128 * 1024 * 1024 }).replaceAll("\r\n", "\n").trim();
}

export function collectP14BReceiptSnapshot(root = join(import.meta.dir, "../..")): P14BReceiptSnapshot {
  const evidenceRoot = join(root, "docs/orders/evidence/golden-baseline/phase3");
  const receiptPath = join(evidenceRoot, "P14-B-PRODUCTION-INFERENCE-20260830.json");
  const hashes: Record<string, string | null> = {};
  for (const path of Object.keys(P14B_REQUIRED_HASHES)) {
    const absolute = join(root, path);
    hashes[path] = existsSync(absolute) ? sha256(absolute) : null;
  }
  const currentCommit = git(root, ["rev-parse", "HEAD"]);
  const currentArtifacts: P14BReceiptSnapshot["currentArtifacts"] = {};
  for (const path of [CURRENT_ASAR, CURRENT_EXE, CURRENT_INSTALLER]) {
    const absolute = join(root, path);
    const exists = existsSync(absolute);
    currentArtifacts[path] = {
      exists,
      bytes: exists ? statSync(absolute).size : 0,
      ...(path === CURRENT_ASAR && exists ? { sha256: sha256(absolute) } : {}),
    };
  }
  const ancestry = spawnSync("git", ["merge-base", "--is-ancestor", P14B_ACCEPTED_COMMIT, "HEAD"], { cwd: root, windowsHide: true });
  return {
    currentCommit,
    clean: git(root, ["status", "--porcelain=v1", "--untracked-files=all"]) === "",
    descendant: ancestry.status === 0,
    hashes,
    evidenceInventory: readdirSync(evidenceRoot).filter((name) => name.startsWith("P14-B-")).sort(),
    receipt: JSON.parse(readFileSync(receiptPath, "utf8")) as Json,
    acceptedProductTreeSha256: productTreeSha256(git(root, ["ls-tree", "-r", "--full-tree", P14B_ACCEPTED_PRODUCT_BASE])),
    currentProductTreeSha256: productTreeSha256(git(root, ["ls-tree", "-r", "--full-tree", currentCommit])),
    releaseStatus: existsSync(join(root, "collab-electron/dist/RELEASE-STATUS.json"))
      ? JSON.parse(readFileSync(join(root, "collab-electron/dist/RELEASE-STATUS.json"), "utf8")) as Json
      : null,
    currentArtifacts,
  };
}

export function runP14BReceiptGate(): { ok: boolean } {
  try {
    const snapshot = collectP14BReceiptSnapshot();
    validateP14BReceiptSnapshot(snapshot);
    console.log(`p14-b-receipt: PASS accepted=${P14B_ACCEPTED_COMMIT.slice(0, 8)} current=${snapshot.currentCommit.slice(0, 8)} live_bundle=${P14B_PACKAGE_SHA256} current_asar=${snapshot.currentArtifacts[CURRENT_ASAR]!.sha256}`);
    return { ok: true };
  } catch (error) {
    console.error(`p14-b-receipt: RED ${error instanceof Error ? error.message : String(error)}`);
    return { ok: false };
  }
}

if (import.meta.main) process.exit(runP14BReceiptGate().ok ? 0 : 1);
