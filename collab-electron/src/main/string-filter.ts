export type StringFilterMode = "none" | "ansi-strip" | "framed";

// eslint-disable-next-line no-control-regex
const ANSI_RE = /[\x1b\x9b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nq-uy=><~]/g;

const PIPE_START = "[PIPE_START]";
const PIPE_END = "[PIPE_END]";
const BATON_LINE_MAX = 8192;

/**
 * Per-string accumulation buffer for framed mode.
 * Key = string link ID.
 */
const frameBuffers = new Map<string, { inside: boolean; buf: string }>();
const batonLineBuffers = new Map<string, string>();

export function resetFrameBuffer(linkId: string): void {
  frameBuffers.delete(linkId);
  batonLineBuffers.delete(linkId);
}

export function applyFilter(
  mode: StringFilterMode,
  data: Buffer | string,
  linkId?: string,
): string | null {
  const text = typeof data === "string" ? data : data.toString("utf-8");
  if (!text) return null;

  switch (mode) {
    case "none":
      return text;

    case "ansi-strip":
      return text.replace(ANSI_RE, "");

    case "framed":
      return applyFramedFilter(text, linkId ?? "");

    default:
      return text;
  }
}

function applyFramedFilter(text: string, linkId: string): string | null {
  const payloads = extractFramedInnerPayloads(text, linkId);
  if (payloads.length === 0) return null;
  return `${payloads.join("")}\r`;
}

export function extractFramedInnerPayloads(
  data: Buffer | string,
  linkId: string,
): string[] {
  const text = typeof data === "string" ? data : data.toString("utf-8");
  if (!text) return [];

  let state = frameBuffers.get(linkId);
  if (!state) {
    state = { inside: false, buf: "" };
    frameBuffers.set(linkId, state);
  }

  const payloads: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (!state.inside) {
      const startIdx = remaining.indexOf(PIPE_START);
      if (startIdx === -1) break;
      remaining = remaining.slice(startIdx + PIPE_START.length);
      state.inside = true;
    }

    if (state.inside) {
      const endIdx = remaining.indexOf(PIPE_END);
      if (endIdx === -1) {
        state.buf += remaining;
        remaining = "";
      } else {
        const inner = `${state.buf}${remaining.slice(0, endIdx)}`.trim();
        if (inner.length > 0) payloads.push(inner);
        state.buf = "";
        state.inside = false;
        remaining = remaining.slice(endIdx + PIPE_END.length);
      }
    }
  }

  return payloads;
}

function findNextLineBreak(text: string): number {
  const crIdx = text.indexOf("\r");
  const lfIdx = text.indexOf("\n");
  if (crIdx === -1) return lfIdx;
  if (lfIdx === -1) return crIdx;
  return Math.min(crIdx, lfIdx);
}

function consumeLineBreak(text: string, breakIdx: number): number {
  if (text[breakIdx] === "\r" && text[breakIdx + 1] === "\n") {
    return 2;
  }
  return 1;
}

/**
 * Baton mode is intentionally stricter than generic framed filtering:
 * only a standalone framed output line is considered a handoff. This
 * prevents command-line echoes like:
 * `printf '%s\n' '[PIPE_START]... [PIPE_END]'`
 * from triggering an early duplicate forward before the command output
 * line is actually printed by the PTY.
 */
export function extractBatonPayloads(
  data: Buffer | string,
  linkId: string,
): string[] {
  const text = typeof data === "string" ? data : data.toString("utf-8");
  if (!text) return [];

  let buffered = `${batonLineBuffers.get(linkId) ?? ""}${text}`;
  const payloads: string[] = [];

  while (true) {
    const breakIdx = findNextLineBreak(buffered);
    if (breakIdx === -1) break;

    const line = buffered.slice(0, breakIdx);
    buffered = buffered.slice(
      breakIdx + consumeLineBreak(buffered, breakIdx),
    );

    const match = line.match(/^\s*\[PIPE_START\](.*?)\[PIPE_END\]\s*$/);
    if (!match) continue;

    const inner = match[1]?.trim();
    if (inner) payloads.push(inner);
  }

  if (buffered.length > BATON_LINE_MAX) {
    buffered = buffered.slice(-BATON_LINE_MAX);
  }
  batonLineBuffers.set(linkId, buffered);

  return payloads;
}
