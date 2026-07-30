/**
 * Ephemeral package verification receipt — build evidence, not application truth.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

export type PackageReceipt = {
  runId: string;
  packageRoot: string;
  logPath: string;
  logSha256: string;
};

export const RECEIPT_FILENAME = "package-verify.receipt.json";

export function canonicalPackageVerifyLogPath(collabRoot: string): string {
  return resolve(join(collabRoot, ".package-verify/electron-builder.log"));
}

function sha256File(path: string): string {
  const data = readFileSync(path);
  return createHash("sha256").update(data).digest("hex");
}

export function writePackageReceipt(
  packageRoot: string,
  receipt: PackageReceipt,
): string {
  const receiptPath = join(packageRoot, RECEIPT_FILENAME);
  writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  return receiptPath;
}

export type ReceiptValidation =
  | { ok: true; receipt: PackageReceipt; resourcesRoot: string }
  | { ok: false; reason: string };

export function validatePackageReceipt(
  expectedRunId: string,
  collabRoot: string,
  allowedPackageRoot?: string,
): ReceiptValidation {
  const packageRoot = allowedPackageRoot
    ? resolve(allowedPackageRoot)
    : resolve(join(collabRoot, "dist/linux-unpacked"));
  const receiptPath = join(packageRoot, RECEIPT_FILENAME);
  if (!existsSync(receiptPath)) {
    return { ok: false, reason: "missing package receipt" };
  }

  let parsed: PackageReceipt;
  try {
    parsed = JSON.parse(readFileSync(receiptPath, "utf8")) as PackageReceipt;
  } catch {
    return { ok: false, reason: "malformed package receipt" };
  }

  if (parsed.runId !== expectedRunId) {
    return { ok: false, reason: "stale package receipt run id" };
  }

  const resolvedPackageRoot = resolve(parsed.packageRoot);
  if (resolvedPackageRoot !== packageRoot) {
    return { ok: false, reason: "package receipt packageRoot mismatch" };
  }

  const resolvedLog = resolve(parsed.logPath);
  if (resolvedLog !== canonicalPackageVerifyLogPath(collabRoot)) {
    return { ok: false, reason: "package receipt logPath mismatch" };
  }
  if (!existsSync(resolvedLog) || statSync(resolvedLog).size === 0) {
    return { ok: false, reason: "package receipt log missing or empty" };
  }

  const hash = sha256File(resolvedLog);
  if (hash !== parsed.logSha256) {
    return { ok: false, reason: "package receipt log hash mismatch" };
  }

  const logText = readFileSync(resolvedLog, "utf8");
  if (logText.includes("file source doesn't exist")) {
    return {
      ok: false,
      reason: "package receipt log contains missing file source warning",
    };
  }

  const resourcesRoot = join(packageRoot, "resources");
  if (!existsSync(resourcesRoot)) {
    return { ok: false, reason: "packaged resources directory missing" };
  }

  return { ok: true, receipt: parsed, resourcesRoot };
}

export function createReceiptFromLog(
  runId: string,
  packageRoot: string,
  logPath: string,
): PackageReceipt {
  return {
    runId,
    packageRoot: resolve(packageRoot),
    logPath: resolve(logPath),
    logSha256: sha256File(logPath),
  };
}
