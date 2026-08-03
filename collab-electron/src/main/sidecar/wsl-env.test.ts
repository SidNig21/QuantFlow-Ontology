import { expect, test } from "bun:test";
import { WINDOWS_WSL_LAUNCH_ENV_KEYS } from "./server";

test("forwards the isolated Hermes profile root into WSL launches", () => {
  expect(WINDOWS_WSL_LAUNCH_ENV_KEYS).toContain(
    "QF_QUANTFLOW_HERMES_PROFILE_ROOT",
  );
});
