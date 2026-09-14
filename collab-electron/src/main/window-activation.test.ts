import { expect, test } from "bun:test";
import {
  activatePrimaryWindow,
  createPrimaryWindowActivationController,
  type ActivatableWindow,
} from "./window-activation";

function fakeWindow(options: { destroyed?: boolean; minimized?: boolean } = {}) {
  const calls: string[] = [];
  let minimized = options.minimized ?? false;
  const window: ActivatableWindow = {
    isDestroyed: () => options.destroyed ?? false,
    isMinimized: () => minimized,
    restore: () => { calls.push("restore"); minimized = false; },
    show: () => calls.push("show"),
    focus: () => calls.push("focus"),
  };
  return { window, calls };
}

test("repeated launch restores, shows, and focuses the primary window", () => {
  const primary = fakeWindow({ minimized: true });
  expect(activatePrimaryWindow(primary.window)).toBe(true);
  expect(primary.calls).toEqual(["restore", "show", "focus"]);
});

test("launch before window creation is applied when the primary window is ready", () => {
  let primary: ActivatableWindow | null = null;
  const controller = createPrimaryWindowActivationController(() => primary);
  expect(controller.request()).toBe(false);

  const ready = fakeWindow();
  primary = ready.window;
  expect(controller.windowReady()).toBe(true);
  expect(ready.calls).toEqual(["show", "focus"]);
  expect(controller.windowReady()).toBe(false);
});

test("destroyed windows retain the pending activation", () => {
  let primary: ActivatableWindow | null = fakeWindow({ destroyed: true }).window;
  const controller = createPrimaryWindowActivationController(() => primary);
  expect(controller.request()).toBe(false);

  const replacement = fakeWindow();
  primary = replacement.window;
  expect(controller.windowReady()).toBe(true);
  expect(replacement.calls).toEqual(["show", "focus"]);
});
