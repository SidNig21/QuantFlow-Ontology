import { describe, expect, test } from "bun:test";
import { isTrustedSender } from "./trusted-sender";

describe("isTrustedSender", () => {
  test("allows known webContents id", () => {
    expect(isTrustedSender(10, new Set([10, 20]))).toBe(true);
  });

  test("rejects unknown webContents id", () => {
    expect(isTrustedSender(99, new Set([10, 20]))).toBe(false);
  });
});
