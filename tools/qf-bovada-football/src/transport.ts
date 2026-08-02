import {
  BOVADA_ACCEPT,
  BOVADA_FOOTBALL_URL,
  BOVADA_ORIGIN,
  BOVADA_REQUEST_HEADERS,
  BOVADA_USER_AGENT,
  MAX_RESPONSE_BYTES,
  REQUEST_TIMEOUT_MS,
} from "./constants.ts";
import {
  BovadaBodyError,
  BovadaBodyTooLargeError,
  BovadaCancelledError,
  BovadaRedirectError,
  BovadaResponseError,
  BovadaTimeoutError,
  BovadaTransportError,
} from "./errors.ts";

/** The small response surface the runner needs; headers are never persisted. */
export type BovadaTransportResponse = {
  status: number;
  url: string;
  headers: Pick<Headers, "get">;
  body: ReadableStream<Uint8Array> | null;
};

/** A transport receives only the runner-owned signal, never a caller URL or headers. */
export type BovadaTransport = (
  signal: AbortSignal,
) => Promise<BovadaTransportResponse>;

/** Injectable fetch seam used by tests; the package still supplies URL, method, and headers. */
export type FixedFetch = (
  input: string,
  init: RequestInit,
) => Promise<Response>;

function combinedSignal(signal: AbortSignal | undefined): AbortSignal {
  // The runner creates one request-lifetime timeout signal that spans fetch and
  // body streaming. A direct transport caller without a signal still gets the
  // fixed bound; the normal package path never creates a second timeout.
  return signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS);
}

/**
 * Build the only production transport. The caller can replace fetch for a fixture, but cannot
 * replace the URL, request method, redirect policy, credentials policy, or request headers.
 */
export function createFixedBovadaTransport(
  fetchImplementation: FixedFetch = (input, init) => fetch(input, init),
): BovadaTransport {
  return async (signal: AbortSignal): Promise<BovadaTransportResponse> => {
    let response: Response;
    try {
      response = await fetchImplementation(BOVADA_FOOTBALL_URL, {
        method: "GET",
        headers: { ...BOVADA_REQUEST_HEADERS },
        redirect: "follow",
        credentials: "omit",
        signal: combinedSignal(signal),
      });
    } catch (error) {
      if (signal.aborted) {
        throw new BovadaCancelledError();
      }
      if (error instanceof DOMException && error.name === "TimeoutError") {
        throw new BovadaTimeoutError();
      }
      throw new BovadaTransportError();
    }

    return {
      status: response.status,
      url: response.url,
      headers: response.headers,
      body: response.body,
    };
  };
}

/** Validate the final URL without ever accepting a caller-controlled origin. */
export function assertBovadaOrigin(url: string): void {
  let origin: string;
  try {
    origin = new URL(url).origin;
  } catch {
    throw new BovadaRedirectError("invalid");
  }
  if (origin !== BOVADA_ORIGIN) {
    throw new BovadaRedirectError(origin);
  }
}

/** Validate only the response metadata needed to decode the public JSON body. */
export function assertBovadaResponse(response: BovadaTransportResponse): void {
  assertBovadaOrigin(response.url);
  if (response.status !== 200) {
    throw new BovadaResponseError(response.status);
  }
  const contentType = response.headers.get("content-type");
  const mediaType = contentType?.split(";", 1)[0]?.trim().toLowerCase();
  if (mediaType !== BOVADA_ACCEPT) {
    throw new BovadaBodyError("Bovada public response was not application/json");
  }
  if (response.body === null) {
    throw new BovadaBodyError("Bovada public response had no body");
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function copyChunk(value: Uint8Array): Uint8Array {
  return value.slice();
}

/** Read the response stream once and cancel it immediately when the bound is crossed. */
export async function readBoundedResponseBody(
  response: BovadaTransportResponse,
  abortRequest: () => void,
): Promise<Uint8Array> {
  const body = response.body;
  if (body === null) {
    throw new BovadaBodyError("Bovada public response had no body");
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      if (!(next.value instanceof Uint8Array)) {
        throw new BovadaBodyError("Bovada public response yielded a non-byte chunk");
      }
      total += next.value.byteLength;
      if (total > MAX_RESPONSE_BYTES) {
        abortRequest();
        try {
          await reader.cancel("response exceeds fixed bound");
        } catch {
          // The abort is the primary bound; a stream that rejects cancellation is still closed
          // by the transport.
        }
        throw new BovadaBodyTooLargeError(MAX_RESPONSE_BYTES);
      }
      chunks.push(copyChunk(next.value));
    }
  } catch (error) {
    try {
      await reader.cancel();
    } catch {
      // Preserve the original body/abort error and never leak response details.
    }
    if (isAbortError(error)) {
      throw new BovadaCancelledError();
    }
    throw error;
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // A released reader is a cleanup detail; no external state is retained here.
    }
  }

  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

export {
  BOVADA_ACCEPT,
  BOVADA_FOOTBALL_URL,
  BOVADA_ORIGIN,
  BOVADA_USER_AGENT,
  MAX_RESPONSE_BYTES,
  REQUEST_TIMEOUT_MS,
};
