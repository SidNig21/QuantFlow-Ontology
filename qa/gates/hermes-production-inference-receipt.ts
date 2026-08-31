#!/usr/bin/env bun
/** Reuse the one accepted P14-B live inference receipt without another provider call. */
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

export const P14B_ACCEPTED_COMMIT = "bb837464d889ea196c4c00aeb003bf949296d91f";
export const P14B_ACCEPTED_PRODUCT_BASE = "a44c0f1ad20a8878ba74db321bbd9088a8c42f6d";
export const FINAL_FOUNDER_PRODUCT_COMMIT = "a91b5deec9bb49538136c76a031648be2c08e05e";
export const FINAL_FOUNDER_PRODUCT_TREE = "e7213a4420f109a8f71bd38970f570a7b4b6295e";
export const FINAL_FOUNDER_RECEIPT = "docs/orders/evidence/golden-baseline/phase3/FINAL-FOUNDER-ONTOLOGY-WALKTHROUGH-20260830.json";
export const P14B_PACKAGE_SHA256 = "1611d0725f53ffcc83c85073f28a4348869b0406fa36cd7213abeac35e0df8e3";
export const P14B_PROMPT_SHA256 = "f9f9a7a454880b623ad5d337c9126c5b4e41538a8d78bc3f0141907c4da310e1";
export const P14B_REQUIRED_HASHES = {
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
  finalReceipt: Json;
  finalProductTreeSha256: string;
  currentFinalProductTreeSha256: string;
  releaseProductTreeSha256: string | null;
};

const CURRENT_ASAR = "collab-electron/dist/win-unpacked/resources/app.asar";
const CURRENT_EXE = "collab-electron/dist/win-unpacked/QuantFlow.exe";
const CURRENT_INSTALLER = "collab-electron/dist/QuantFlow Setup 0.8.4.exe";
const PRODUCT_TREE_EXACT_EXCLUSIONS = new Set([
  "tools/qf-bovada-football/src/gate.ts",
  "collab-electron/cli/qf-hermes-synthetic-responder.mjs",
  "collab-electron/cli/qf-hermes-synthetic-responder.test.ts",
]);
const PRODUCT_TREE_PREFIX_EXCLUSIONS = [
  "qa/",
  "docs/orders/evidence/golden-baseline/phase3/",
  "qf-atlas/",
] as const;

const FINAL_PRODUCT_TREE_PREFIX_EXCLUSIONS = ["qa/", "docs/orders/", "qf-atlas/"] as const;

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
  if (typeof value === "string" && /(?:(?:^|\W)sk-[A-Za-z0-9_-]{16,}|api[_-]?key\s*[:=]|bearer\s+[A-Za-z0-9._-]{16,}|authorization\s*[:=])/i.test(value)) {
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
    if (PRODUCT_TREE_EXACT_EXCLUSIONS.has(path)) return false;
    return !PRODUCT_TREE_PREFIX_EXCLUSIONS.some((prefix) => path.startsWith(prefix));
  }).sort();
}

export function productTreeSha256(lsTree: string): string {
  const rows = productTreeRows(lsTree);
  return createHash("sha256").update(rows.length ? `${rows.join("\n")}\n` : "", "utf8").digest("hex");
}

export function finalProductTreeRows(lsTree: string): string[] {
  return lsTree.replaceAll("\r\n", "\n").split("\n").filter(Boolean).filter((row) => {
    const separator = row.indexOf("\t");
    requireValue(separator > 0, "malformed final product git ls-tree row");
    const metadata = row.slice(0, separator).split(" ");
    requireValue(metadata.length === 3 && /^[0-7]{6}$/.test(metadata[0]!) && metadata[1] === "blob" && /^[0-9a-f]{40}$/.test(metadata[2]!), "final product git ls-tree row lacks exact mode/type/blob");
    const path = row.slice(separator + 1);
    return !FINAL_PRODUCT_TREE_PREFIX_EXCLUSIONS.some((prefix) => path.startsWith(prefix));
  }).sort();
}

export function finalProductTreeSha256(lsTree: string): string {
  const rows = finalProductTreeRows(lsTree);
  return createHash("sha256").update(rows.length ? `${rows.join("\n")}\n` : "", "utf8").digest("hex");
}

function normalizedArtifactPath(value: unknown): string {
  return typeof value === "string" ? value.replaceAll("\\", "/") : "";
}

const FINAL_TASK = "task-5d9e9b6a-26cc-4059-914c-d4f479a47731";
const FINAL_SESSION = "cafcad5c-fe94-4055-ac6c-2375c33b004a";
const FINAL_RUNTIME_SESSION = "20260830_204733_f93524";
const FINAL_ARTIFACTS = [
  "690b731ea749327193bd0fc67163306df0ffa644224bb79e57d29660966895d2",
  "5edaad9fb84d8a9b7cc96c7773080357ab1f3b7288c46e32f7b7d27084feb024",
  "00a1346575a67bb332b0255f1579c63d66a63c09a041f725a593cb8b624ac54d",
  "6ca4ec32ed6430d2c440d957556db6f0ff1fc7a839ecca1af8dd8a1dbb1747c7",
] as const;
const FINAL_TOOLS = [
  "mcp_quantflow_ontology_qf_task_query",
  "mcp_quantflow_ontology_qf_task_links",
  "mcp_quantflow_ontology_qf_agent_session_links",
  "mcp_quantflow_ontology_qf_agent_definition_query",
] as const;
const FINAL_ARTIFACT_TOOLS = ["qf_task_query", "qf_task_links", "qf_agent_session_links", "qf_agent_definition_query"] as const;

function textValue(value: unknown, label: string): string {
  requireValue(typeof value === "string", `${label} is not text`);
  return value;
}

function numberValue(value: unknown, label: string): number {
  requireValue(typeof value === "number" && Number.isFinite(value), `${label} is not finite`);
  return value;
}

export function validateFinalFounderReceipt(receiptValue: unknown): void {
  rejectLeakage(receiptValue, "final_receipt");
  const receipt = object(receiptValue, "final_receipt");
  requireValue(receipt.schema === "qf.phase3.final-founder-ontology-walkthrough.v1" && receipt.gate === "hermes-production-inference-receipt" && receipt.result === "PASS", "final receipt identity/result drift");

  const identity = object(receipt.identity, "final_receipt.identity");
  requireValue(identity.candidate === FINAL_FOUNDER_PRODUCT_COMMIT && identity.tree === FINAL_FOUNDER_PRODUCT_TREE, "final packaged candidate/tree drift");
  requireValue(identity.packaged_at === "2026-08-31T03:39:01.739Z", "final packaged time drift");
  const pkg = object(identity.package, "final_receipt.identity.package");
  requireValue(pkg.app_asar_bytes === 96_709_659 && pkg.app_asar_sha256 === "07590470516b065e759555ae23edcdf878032852576fa179100cc23f2ad6bce8", "final app.asar identity drift");
  requireValue(pkg.exe_bytes === 213_647_360 && pkg.exe_sha256 === "1101cc1b6084ee0e3cb91d94f32fd1020e8f1b517e67ad4174f4ec6b7f286edf", "final exe identity drift");
  requireValue(pkg.installer_bytes === 127_171_374 && pkg.installer_sha256 === "74cbfb8d8fca7cfe4d7cbe28986a451df8ee0a87f4365e5ca2b23d87abf2a1f", "final installer identity drift");

  const route = object(receipt.route, "final_receipt.route");
  requireValue(route.authority === "Router-owned Computer Use rendered-product transcript" && route.task_id === "019ffb57-4d45-70a1-8cb7-30e99f79d348", "final rendered route authority drift");
  requireValue(route.founder_state_untouched === true && route.prohibited_substitutions_absent === true, "final route isolation/substitution drift");
  requireValue(Array.isArray(route.user_actions) && route.user_actions.length === 10, "final rendered user action cardinality drift");
  requireValue(JSON.stringify(route.qa_flags_absent) === JSON.stringify(["QF_UI_PROOF", "QF_HERMES_SYNTHETIC_TEST", "QF_DOCK_QA_MODE"]), "final QA flag absence drift");

  const prompt = object(receipt.prompt, "final_receipt.prompt");
  const promptText = textValue(prompt.text, "final prompt");
  requireValue(prompt.bytes === 330 && createHash("sha256").update(promptText, "utf8").digest("hex") === prompt.sha256 && prompt.sha256 === "81ae3aa8a59a95237f5e8010802940efa1c3f50f752d31da14ca2edb0d8202bd", "final prompt bytes/hash drift");

  const execution = object(receipt.execution, "final_receipt.execution");
  requireValue(execution.runtime_session === FINAL_RUNTIME_SESSION && execution.kernel_session === FINAL_SESSION, "final runtime/kernel session drift");
  requireValue(execution.provider === "opencode-go" && execution.model === "kimi-k3" && execution.provider_request_id === "not_exposed", "final provider/model/request-id drift");
  requireValue(execution.user_turns === 1 && execution.api_calls === 5 && execution.tool_turns === 4 && execution.finish_reason === "stop" && execution.response_length === 657, "final turn cardinality/result drift");
  requireValue(execution.synthetic === false && execution.fallback === false && execution.unrelated_retry === false, "final synthetic/fallback/retry drift");
  requireValue(Array.isArray(execution.runtime_error_codes) && execution.runtime_error_codes.length === 0, "final runtime errors present");
  const apiRows = exactArray(execution.api_rows, 5, "final_receipt.execution.api_rows");
  apiRows.forEach((value, index) => {
    const row = object(value, `final_receipt.execution.api_rows[${index}]`);
    requireValue(row.ordinal === index + 1 && row.provider === "opencode-go" && row.model === "kimi-k3", `final API row ${index + 1} identity drift`);
    const input = numberValue(row.input_tokens, "input tokens");
    const output = numberValue(row.output_tokens, "output tokens");
    const total = numberValue(row.total_tokens, "total tokens");
    requireValue(input > 0 && output > 0 && total === input + output && numberValue(row.latency_seconds, "latency") > 0, `final API row ${index + 1} token/latency drift`);
  });
  for (const [key, bytes, hash] of [
    ["session_evidence", 22_637, "b5494a0417a60a01bd3131891b069126cc6fbbe460792e0c73c22d81ac94c4e6"],
    ["log_evidence", 9_673, "8d006adac7ea21abcdecd31c23e7552c66a50d06153db2f57d5c1e331280431"],
  ] as const) {
    const evidence = object(execution[key], `final_receipt.execution.${key}`);
    requireValue(evidence.bytes === bytes && evidence.sha256 === hash, `final ${key} drift`);
  }

  const tools = exactArray(receipt.tool_chain, 4, "final_receipt.tool_chain");
  tools.forEach((value, index) => {
    const row = object(value, `final_receipt.tool_chain[${index}]`);
    const artifact = object(row.artifact, `final_receipt.tool_chain[${index}].artifact`);
    requireValue(row.ordinal === index + 1 && row.tool === FINAL_TOOLS[index], `final tool order drift at ${index + 1}`);
    requireValue(artifact.id === FINAL_ARTIFACTS[index] && artifact.sha256 === FINAL_ARTIFACTS[index], `final Artifact identity/hash drift at ${index + 1}`);
    requireValue(artifact.contract === "qf.ontology.v1" && artifact.tool === FINAL_ARTIFACT_TOOLS[index] && artifact.role === "orchestrator" && artifact.session_id === FINAL_SESSION, `final Artifact contract/tool/role/session drift at ${index + 1}`);
    requireValue(numberValue(artifact.bytes, "artifact bytes") > 0 && /^[0-9a-f-]{36}$/.test(textValue(artifact.nonce, "artifact nonce")) && Number.isFinite(Date.parse(textValue(artifact.created_at, "artifact created_at"))), `final Artifact metadata drift at ${index + 1}`);
    requireValue(Array.isArray(artifact.result) && artifact.result.length > 0, `final Artifact result missing at ${index + 1}`);
  });
  requireValue(JSON.stringify((object(tools[0], "tool 1").arguments)) === JSON.stringify({ title: "Golden Founder Ontology Walkthrough" }), "final Task query arguments drift");
  requireValue((object(object(tools[1], "tool 2").arguments, "tool 2 args")).id === FINAL_TASK, "final Task-links id drift");
  requireValue((object(object(tools[2], "tool 3").arguments, "tool 3 args")).id === FINAL_SESSION, "final session-links id drift");
  requireValue((object(object(tools[3], "tool 4").arguments, "tool 4 args")).name === "hermes-research-director", "final definition query drift");
  const taskQueryResult = object((object(tools[0], "tool 1").artifact as Json).result instanceof Array ? ((object(tools[0], "tool 1").artifact as Json).result as unknown[])[0] : null, "task query result");
  requireValue(taskQueryResult.id === FINAL_TASK && taskQueryResult.title === "Golden Founder Ontology Walkthrough" && taskQueryResult.status === "open", "final Task query result drift");
  const taskLinkResult = ((object(tools[1], "tool 2").artifact as Json).result as unknown[]).map((value, index) => object(value, `task link result ${index}`));
  requireValue(taskLinkResult.length === 2 && taskLinkResult.some((row) => row.kind === "assigned_to" && row.from_id === FINAL_TASK && row.to_id === FINAL_SESSION) && taskLinkResult.some((row) => row.kind === "delegated_by" && row.from_id === FINAL_TASK && row.to_id === FINAL_SESSION), "final Task links result drift");
  const sessionLinkResult = ((object(tools[2], "tool 3").artifact as Json).result as unknown[]).map((value, index) => object(value, `session link result ${index}`));
  requireValue(sessionLinkResult.length === 5 && sessionLinkResult.some((row) => row.kind === "spawned_from" && row.from_id === FINAL_SESSION && row.to_id === "hermes-research-director"), "final session links result drift");
  const definitionResult = object((((object(tools[3], "tool 4").artifact as Json).result as unknown[])[0]), "definition query result");
  requireValue(definitionResult.id === "hermes-research-director" && definitionResult.role === "orchestrator" && definitionResult.display_name === "Research Director", "final definition result drift");

  const kernel = object(receipt.kernel, "final_receipt.kernel");
  requireValue(kernel.bytes === 270_336 && kernel.sha256 === "65d67b862c453950736125dcd7bad80e44ffe420eb39d3c3301f3bc9ff588b26", "final Kernel evidence drift");
  const task = object(kernel.task, "final_receipt.kernel.task");
  requireValue(task.id === FINAL_TASK && task.title === "Golden Founder Ontology Walkthrough" && task.status === "open", "final Kernel Task drift");
  const session = object(kernel.session, "final_receipt.kernel.session");
  requireValue(session.id === FINAL_SESSION && session.status_after_reopen === "failed" && session.label === "hermes-research-director", "final Kernel session drift");
  const links = exactArray(kernel.links, 7, "final_receipt.kernel.links").map((value, index) => object(value, `final link ${index}`));
  requireValue(links.filter((row) => row.kind === "assigned_to" && row.from_id === FINAL_TASK && row.to_id === FINAL_SESSION).length === 1, "final assigned_to cardinality drift");
  requireValue(links.filter((row) => row.kind === "delegated_by" && row.from_id === FINAL_TASK && row.to_id === FINAL_SESSION).length === 1, "final delegated_by cardinality drift");
  requireValue(links.filter((row) => row.kind === "spawned_from" && row.from_id === FINAL_SESSION && row.to_id === "hermes-research-director").length === 1, "final spawned_from cardinality drift");
  requireValue(JSON.stringify(links.filter((row) => row.kind === "produces").map((row) => row.to_id)) === JSON.stringify(FINAL_ARTIFACTS), "final produces links/order drift");

  const response = object(receipt.response, "final_receipt.response");
  const responseText = textValue(response.text, "final response");
  requireValue(response.bytes === Buffer.byteLength(responseText, "utf8") && response.bytes === 667, "final response byte count drift");
  requireValue(createHash("sha256").update(responseText, "utf8").digest("hex") === response.sha256 && response.sha256 === "bbbba3d8ad53491505abcb5662e050f6b11dc58950dd57592da5fad176e685da", "final response hash drift");
  requireValue(response.required_suffix === "QF_GOLDEN_ONTOLOGY_OK" && responseText.endsWith("QF_GOLDEN_ONTOLOGY_OK") && responseText.includes(FINAL_TASK.slice(0, 8)) === false && responseText.includes(FINAL_SESSION) && responseText.includes("Research Director") && responseText.includes("orchestrator") && responseText.includes("`open`"), "final response answer/suffix drift");

  const lifecycle = object(receipt.lifecycle, "final_receipt.lifecycle");
  for (const key of ["first_shutdown", "second_shutdown"] as const) {
    const shutdown = object(lifecycle[key], `final_receipt.lifecycle.${key}`);
    requireValue(shutdown.processes === 0 && shutdown.socket_absent === true && shutdown.pty_pid_absent === true, `final ${key} cleanup drift`);
  }
  const reopen = object(lifecycle.reopen, "final_receipt.lifecycle.reopen");
  requireValue(reopen.live === 0 && reopen.closed === 1 && reopen.session === "closed" && reopen.runtime === "stopped" && reopen.work === "blocked" && reopen.recovery === "restartable", "final reopen state drift");
  requireValue(reopen.task_visible === true && reopen.history_same_participant === true && reopen.inspect_same_task === true && reopen.kernel_status === "failed", "final reopen identity/truth drift");

  const visual = object(receipt.visual, "final_receipt.visual");
  requireValue(visual.authority === "Router-owned Computer Use rendered-product transcript" && visual.persisted_screenshot_files === false, "final visual authority drift");
  const checkpoints = object(visual.checkpoints, "final_receipt.visual.checkpoints");
  requireValue(Object.keys(checkpoints).length === 8 && Object.values(checkpoints).every((value) => value === true), "final visible checkpoint drift");
  const update = object(visual.update_observation, "final_receipt.visual.update_observation");
  requireValue(update.visible === "Update failed — retry" && update.http_status === 406 && update.endpoint === "/releases/latest" && update.classification === "honest unavailable release channel for unsigned internal package" && update.affected_product_path === false, "final updater observation hidden or drifted");
  const scope = object(receipt.scope, "final_receipt.scope");
  requireValue(scope.r18_claimed === false && textValue(scope.claim, "final scope claim").includes("standalone Kernel Task"), "final receipt expands into R18");
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
  requireValue(/^[0-9a-f]{64}$/.test(snapshot.acceptedProductTreeSha256) && snapshot.acceptedProductTreeSha256 === snapshot.currentProductTreeSha256, "production-inference tree reuse differs outside the packaged QA delta");
  requireValue(/^[0-9a-f]{64}$/.test(snapshot.finalProductTreeSha256) && snapshot.finalProductTreeSha256 === snapshot.currentFinalProductTreeSha256, "final founder product bytes differ outside proof-only surfaces");
  requireValue(snapshot.releaseProductTreeSha256 === snapshot.finalProductTreeSha256, "release package commit is not a proof-only descendant of the tested final founder product");
  validateFinalFounderReceipt(snapshot.finalReceipt);

  const release = exactKeys(snapshot.releaseStatus, ["artifacts", "build", "contract", "installer", "package"], "release_status");
  const releasePackage = exactKeys(release.package, ["name", "productName", "version"], "release_status.package");
  const releaseBuild = exactKeys(release.build, ["commit_sha", "packaged_at"], "release_status.build");
  const releaseInstaller = exactKeys(release.installer, ["authenticode", "name", "path"], "release_status.installer");
  const releaseArtifacts = exactArray(release.artifacts, 2, "release_status.artifacts").map((row, index) => exactKeys(row, ["authenticode", "path"], `release_status.artifacts[${index}]`));
  requireValue(release.contract === "qf.windows.release-status.v1", "release status contract drift");
  requireValue(releasePackage.name === "@quantflow/electron" && releasePackage.productName === "QuantFlow" && releasePackage.version === "0.8.4", "release package identity drift");
  requireValue(typeof releaseBuild.commit_sha === "string" && /^[0-9a-f]{40}$/.test(releaseBuild.commit_sha), "release status commit identity drift");
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
  const finalReceiptPath = join(root, FINAL_FOUNDER_RECEIPT);
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
  const releaseStatus = existsSync(join(root, "collab-electron/dist/RELEASE-STATUS.json"))
    ? JSON.parse(readFileSync(join(root, "collab-electron/dist/RELEASE-STATUS.json"), "utf8")) as Json
    : null;
  const releaseCommit = releaseStatus && object(releaseStatus.build, "release_status.build").commit_sha;
  const releaseCommitExists = typeof releaseCommit === "string" && /^[0-9a-f]{40}$/.test(releaseCommit)
    && spawnSync("git", ["cat-file", "-e", `${releaseCommit}^{commit}`], { cwd: root, windowsHide: true }).status === 0;
  return {
    currentCommit,
    clean: git(root, ["status", "--porcelain=v1", "--untracked-files=all"]) === "",
    descendant: ancestry.status === 0,
    hashes,
    evidenceInventory: readdirSync(evidenceRoot).filter((name) => name.startsWith("P14-B-")).sort(),
    receipt: JSON.parse(readFileSync(receiptPath, "utf8")) as Json,
    acceptedProductTreeSha256: productTreeSha256(git(root, ["ls-tree", "-r", "--full-tree", P14B_ACCEPTED_PRODUCT_BASE])),
    currentProductTreeSha256: productTreeSha256(git(root, ["ls-tree", "-r", "--full-tree", P14B_ACCEPTED_COMMIT])),
    releaseStatus,
    currentArtifacts,
    finalReceipt: JSON.parse(readFileSync(finalReceiptPath, "utf8")) as Json,
    finalProductTreeSha256: finalProductTreeSha256(git(root, ["ls-tree", "-r", "--full-tree", FINAL_FOUNDER_PRODUCT_COMMIT])),
    currentFinalProductTreeSha256: finalProductTreeSha256(git(root, ["ls-tree", "-r", "--full-tree", currentCommit])),
    releaseProductTreeSha256: releaseCommitExists ? finalProductTreeSha256(git(root, ["ls-tree", "-r", "--full-tree", String(releaseCommit)])) : null,
  };
}

export function runP14BReceiptGate(): { ok: boolean } {
  try {
    const snapshot = collectP14BReceiptSnapshot();
    validateP14BReceiptSnapshot(snapshot);
    console.log(`p14-b-receipt: PASS historical_nonce_immutable=true current_founder_ontology_read=true one_user_turn=true api_calls=5 tool_turns=4 provider=opencode-go model=kimi-k3 final_product=${FINAL_FOUNDER_PRODUCT_COMMIT.slice(0, 8)} current=${snapshot.currentCommit.slice(0, 8)} product_tree_equivalent=true cleanup_zero_twice=true`);
    return { ok: true };
  } catch (error) {
    console.error(`p14-b-receipt: RED ${error instanceof Error ? error.message : String(error)}`);
    return { ok: false };
  }
}

if (import.meta.main) process.exit(runP14BReceiptGate().ok ? 0 : 1);
