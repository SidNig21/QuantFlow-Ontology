export interface ActivatableWindow {
  isDestroyed(): boolean;
  isMinimized(): boolean;
  restore(): void;
  show(): void;
  focus(): void;
}

export function activatePrimaryWindow(window: ActivatableWindow | null): boolean {
  if (!window || window.isDestroyed()) return false;
  if (window.isMinimized()) window.restore();
  window.show();
  window.focus();
  return true;
}

export function createPrimaryWindowActivationController(
  getWindow: () => ActivatableWindow | null,
): {
  request(): boolean;
  windowReady(): boolean;
} {
  let pending = false;
  const request = (): boolean => {
    if (!activatePrimaryWindow(getWindow())) {
      pending = true;
      return false;
    }
    pending = false;
    return true;
  };
  return {
    request,
    windowReady: () => pending && request(),
  };
}
