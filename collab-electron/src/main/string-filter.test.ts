import { beforeEach, describe, expect, test } from "bun:test";
import {
  applyFilter,
  extractBatonPayloads,
  extractFramedInnerPayloads,
  resetFrameBuffer,
} from "./string-filter";

describe("applyFilter framed", () => {
  const linkId = "test-string-link";

  beforeEach(() => {
    resetFrameBuffer(linkId);
  });

  test("extracts inner payload and appends carriage return for Pi submit", () => {
    const chunk =
      "[PIPE_START]HANDOFF_READY expertise/foo/[PIPE_END]\n";
    const out = applyFilter("framed", chunk, linkId);
    expect(out).toBe("HANDOFF_READY expertise/foo/\r");
  });

  test("trims inner whitespace around handoff token", () => {
    const out = applyFilter(
      "framed",
      "[PIPE_START]  HANDOFF_READY expertise/foo/  [PIPE_END]",
      linkId,
    );
    expect(out).toBe("HANDOFF_READY expertise/foo/\r");
  });

  test("handles frame split across chunks", () => {
    expect(
      applyFilter(
        "framed",
        "noise [PIPE_START]RUN",
        linkId,
      ),
    ).toBe(null);
    expect(
      applyFilter(
        "framed",
        " CMD[PIPE_END]\n",
        linkId,
      ),
    ).toBe("RUN CMD\r");
  });

  test("extracts multiple completed framed payloads for baton mode", () => {
    const payloads = extractFramedInnerPayloads(
      "[PIPE_START]HANDOFF_READY expertise/foo/[PIPE_END][PIPE_START]REVIEW_READY run-1 expertise/foo/[PIPE_END]",
      linkId,
    );
    expect(payloads).toEqual([
      "HANDOFF_READY expertise/foo/",
      "REVIEW_READY run-1 expertise/foo/",
    ]);
  });

  test("baton parser ignores framed text embedded inside a typed command line", () => {
    expect(
      extractBatonPayloads(
        "printf '%s\\n' '[PIPE_START]HANDOFF_READY expertise/foo/[PIPE_END]'\n",
        linkId,
      ),
    ).toEqual([]);

    expect(
      extractBatonPayloads(
        "[PIPE_START]HANDOFF_READY expertise/foo/[PIPE_END]\n",
        linkId,
      ),
    ).toEqual(["HANDOFF_READY expertise/foo/"]);
  });

  test("baton parser waits for a complete output line before delivering", () => {
    expect(
      extractBatonPayloads(
        "[PIPE_START]HANDOFF_READY expertise/foo/[PIPE_END]",
        linkId,
      ),
    ).toEqual([]);

    expect(extractBatonPayloads("\n", linkId)).toEqual([
      "HANDOFF_READY expertise/foo/",
    ]);
  });

  test("ansi-strip unchanged", () => {
    expect(applyFilter("ansi-strip", "\x1b[31mhello\x1b[0m")).toBe("hello");
  });

  test("none passes through unchanged", () => {
    expect(applyFilter("none", "abc")).toBe("abc");
  });
});
