export interface ProofNativeImage {
  isEmpty(): boolean;
  getSize(): { width: number; height: number };
  toPNG(): Buffer;
}

export interface DecodedProofImage {
  isEmpty(): boolean;
  getSize(): { width: number; height: number };
}

export interface ProofPageCapturer {
  capturePage(
    rect?: Electron.Rectangle,
    options?: Electron.Opts,
  ): Promise<ProofNativeImage>;
}

export type ProofPageCapture = {
  png: Buffer;
  width: number;
  height: number;
};

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

export function validateProofPngHeader(
  png: Buffer,
  expectedWidth: number,
  expectedHeight: number,
): void {
  if (
    !Number.isInteger(expectedWidth) || expectedWidth <= 0 ||
    !Number.isInteger(expectedHeight) || expectedHeight <= 0
  ) {
    throw new Error("UI evidence dimensions are invalid");
  }
  if (
    png.length < 24 ||
    !png.subarray(0, 8).equals(PNG_SIGNATURE) ||
    png.toString("ascii", 12, 16) !== "IHDR"
  ) {
    throw new Error("UI evidence is not a nonempty PNG");
  }
  if (
    png.readUInt32BE(16) !== expectedWidth ||
    png.readUInt32BE(20) !== expectedHeight
  ) {
    throw new Error("UI evidence PNG dimensions disagree with the capture");
  }
}

export async function captureProofPage(
  capturer: ProofPageCapturer,
  decodePng: (png: Buffer) => DecodedProofImage,
): Promise<ProofPageCapture> {
  const image = await capturer.capturePage(undefined, {
    stayHidden: false,
    stayAwake: true,
  });
  if (image.isEmpty()) throw new Error("UI evidence capture is empty");
  const { width, height } = image.getSize();
  const png = image.toPNG();
  validateProofPngHeader(png, width, height);
  const decoded = decodePng(png);
  const decodedSize = decoded.getSize();
  if (
    decoded.isEmpty() ||
    decodedSize.width !== width ||
    decodedSize.height !== height
  ) {
    throw new Error("UI evidence PNG cannot be decoded at the captured size");
  }
  return { png, width, height };
}
