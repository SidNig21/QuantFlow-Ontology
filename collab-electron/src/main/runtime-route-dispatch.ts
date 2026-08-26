/**
 * The production runtime boundary. A package may select only one of the two
 * retained app-owned runtime callbacks; every other route fails closed before
 * session, process, PTY, ACP, or package lifecycle work begins.
 */
export type SupportedRuntimeRoute = "native_tui" | "host_acp";

export class UnsupportedRuntimeRouteError extends Error {
  override readonly name = "UnsupportedRuntimeRouteError";
  readonly code = "QF_UNSUPPORTED_RUNTIME_ROUTE" as const;

  constructor(
    readonly route: string,
    readonly packageRef: string,
  ) {
    super(`unsupported runtime route "${route}" for package_ref "${packageRef}"`);
  }
}

export type RuntimeRouteCallbacks<T> = {
  native_tui: () => T;
  host_acp: () => T;
};

export function dispatchRuntimeRoute<T>(
  route: string,
  packageRef: string,
  callbacks: RuntimeRouteCallbacks<T>,
): T {
  if (route === "native_tui") return callbacks.native_tui();
  if (route === "host_acp") return callbacks.host_acp();
  throw new UnsupportedRuntimeRouteError(route, packageRef);
}
