import { expect, test } from "bun:test";
import { assertPrecreatedNativeTuiRoute } from "./precreated-native-tui";

test("precreated gateway admission accepts only the native_tui route", () => {
  expect(() => assertPrecreatedNativeTuiRoute("native_tui")).not.toThrow();
  expect(() => assertPrecreatedNativeTuiRoute("host_acp")).toThrow(/native_tui/);
  expect(() => assertPrecreatedNativeTuiRoute("agentos")).toThrow(/native_tui/);
});
