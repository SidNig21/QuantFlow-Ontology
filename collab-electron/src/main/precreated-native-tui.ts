/** Refuse a precreated gateway start before any non-native runtime can launch. */
export function assertPrecreatedNativeTuiRoute(route: unknown): void {
  if (route !== "native_tui") {
    throw new Error("precreated gateway admission requires a native_tui definition");
  }
}
