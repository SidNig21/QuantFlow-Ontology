import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, test } from "bun:test";
import {
  canonicalPackageVerifyLogPath,
  createReceiptFromLog,
  validatePackageReceipt,
  writePackageReceipt,
} from "./package-receipt.ts";

const RUN_ID = "test-run-id";
const testRoots: string[] = [];

afterEach(() => {
  for (const root of testRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "qf-package-receipt-"));
  testRoots.push(root);
  const collabRoot = join(root, "collab-electron");
  const packageRoot = join(collabRoot, "dist/linux-unpacked");
  mkdirSync(join(packageRoot, "resources"), { recursive: true });
  return { root, collabRoot, packageRoot };
}

function writeReceiptForLog(packageRoot: string, logPath: string): void {
  mkdirSync(dirname(logPath), { recursive: true });
  writeFileSync(logPath, "electron-builder complete\n");
  writePackageReceipt(
    packageRoot,
    createReceiptFromLog(RUN_ID, packageRoot, logPath),
  );
}

describe("package receipt log path binding", () => {
  test("accepts the canonical package verification log", () => {
    const { collabRoot, packageRoot } = fixture();
    writeReceiptForLog(packageRoot, canonicalPackageVerifyLogPath(collabRoot));

    expect(validatePackageReceipt(RUN_ID, collabRoot)).toMatchObject({ ok: true });
  });

  test("rejects a prefix-sibling root", () => {
    const { root, collabRoot, packageRoot } = fixture();
    const siblingLog = join(
      root,
      "collab-electron-escape/.package-verify/electron-builder.log",
    );
    writeReceiptForLog(packageRoot, siblingLog);

    expect(validatePackageReceipt(RUN_ID, collabRoot)).toEqual({
      ok: false,
      reason: "package receipt logPath mismatch",
    });
  });

  test("rejects an alternative log inside the collab root", () => {
    const { collabRoot, packageRoot } = fixture();
    const alternativeLog = join(collabRoot, ".package-verify/alternative.log");
    writeReceiptForLog(packageRoot, alternativeLog);

    expect(validatePackageReceipt(RUN_ID, collabRoot)).toEqual({
      ok: false,
      reason: "package receipt logPath mismatch",
    });
  });
});
