export interface RpcErrorShape {
  code: string;
  message: string;
  details?: unknown;
}

export class RpcError extends Error {
  readonly code: string;
  readonly rpcCode: string;
  readonly details?: unknown;
  readonly data?: unknown;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = "RpcError";
    this.code = code;
    this.rpcCode = code;
    this.details = details;
    this.data = details;
  }
}

export function isRpcError(err: unknown): err is RpcError {
  return err instanceof RpcError;
}
