import { expect, test } from "bun:test";
import {
  captureProofPage,
  validateProofPngHeader,
  type DecodedProofImage,
  type ProofNativeImage,
} from "./ui-proof-capture";

function png(width = 1, height = 1): Buffer {
  const bytes = Buffer.alloc(24);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(bytes);
  bytes.writeUInt32BE(13, 8);
  bytes.write("IHDR", 12, 4, "ascii");
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  return bytes;
}

const decoded = (width = 1, height = 1, empty = false): DecodedProofImage => ({
  isEmpty: () => empty,
  getSize: () => ({ width, height }),
});

test("capture activates Chromium's hidden-page capturer and verifies the native decode", async () => {
  const calls: unknown[] = [];
  const bytes = png(2, 1);
  const image: ProofNativeImage = {
    isEmpty: () => false,
    getSize: () => ({ width: 2, height: 1 }),
    toPNG: () => bytes,
  };
  const result = await captureProofPage({
    capturePage: async (...args) => { calls.push(args); return image; },
  }, () => decoded(2, 1));
  expect(calls).toEqual([[undefined, { stayHidden: false, stayAwake: true }]]);
  expect(result).toEqual({ png: bytes, width: 2, height: 1 });
});

test("capture waits through a transient empty native frame", async () => {
  const empty: ProofNativeImage = { isEmpty: () => true, getSize: () => ({ width: 0, height: 0 }), toPNG: () => Buffer.alloc(0) };
  const bytes = png();
  const ready: ProofNativeImage = { isEmpty: () => false, getSize: () => ({ width: 1, height: 1 }), toPNG: () => bytes };
  const frames = [empty, ready];
  let waits = 0;
  const result = await captureProofPage(
    { capturePage: async () => frames.shift() ?? ready },
    () => decoded(),
    { waitAfterEmpty: async () => { waits += 1; } },
  );
  expect(waits).toBe(1);
  expect(result).toEqual({ png: bytes, width: 1, height: 1 });

  let emptyCalls = 0;
  await expect(captureProofPage(
    { capturePage: async () => { emptyCalls += 1; return empty; } },
    () => decoded(),
    { emptyAttempts: 3, waitAfterEmpty: async () => {} },
  )).rejects.toThrow(/empty/);
  expect(emptyCalls).toBe(3);
});

test("empty, zero-size, malformed, mismatched, and undecodable captures fail closed", async () => {
  const image = (overrides: Partial<ProofNativeImage>): ProofNativeImage => ({
    isEmpty: () => false,
    getSize: () => ({ width: 1, height: 1 }),
    toPNG: () => png(),
    ...overrides,
  });
  const capture = (value: ProofNativeImage, decodedImage = decoded()) =>
    captureProofPage({ capturePage: async () => value }, () => decodedImage, { emptyAttempts: 1 });
  await expect(capture(image({ isEmpty: () => true }))).rejects.toThrow(/empty/);
  await expect(capture(image({ getSize: () => ({ width: 0, height: 1 }) }))).rejects.toThrow(/dimensions/);
  await expect(capture(image({ getSize: () => ({ width: 2, height: 1 }) }))).rejects.toThrow(/disagree/);
  await expect(capture(image({ toPNG: () => Buffer.from("not-png") }))).rejects.toThrow(/PNG/);
  await expect(capture(image({}), decoded(1, 1, true))).rejects.toThrow(/decoded/);
  await expect(capture(image({}), decoded(2, 1))).rejects.toThrow(/decoded/);
});

test("standalone header validation rejects invalid dimensions and signatures", () => {
  expect(() => validateProofPngHeader(png(), 0, 1)).toThrow(/dimensions/);
  expect(() => validateProofPngHeader(Buffer.from("invalid"), 1, 1)).toThrow(/PNG/);
});
