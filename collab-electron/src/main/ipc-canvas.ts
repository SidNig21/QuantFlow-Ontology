import { ipcMain, type BrowserWindow } from "electron";

interface IpcContext {
  mainWindow: () => BrowserWindow | null;
  forwardToWebview: (
    target: string,
    channel: string,
    ...args: unknown[]
  ) => void;
}

export function registerCanvasHandlers(
  ctx: IpcContext,
): void {
  let pendingDragPaths: string[] = [];

  // Canvas pinch forwarding
  ipcMain.on(
    "canvas:forward-pinch",
    (_event, deltaY: number) => {
      ctx
        .mainWindow()
        ?.webContents.send("canvas:pinch", deltaY);
    },
  );

  // Cross-webview drag-and-drop
  ipcMain.on(
    "drag:set-paths",
    (_event, paths: string[]) => {
      pendingDragPaths = paths;
      ctx.forwardToWebview(
        "viewer",
        "nav-drag-active",
        true,
      );
    },
  );

  ipcMain.on("drag:clear-paths", () => {
    pendingDragPaths = [];
    ctx.forwardToWebview(
      "viewer",
      "nav-drag-active",
      false,
    );
  });

  ipcMain.handle("drag:get-paths", () => {
    const paths = pendingDragPaths;
    pendingDragPaths = [];
    return paths;
  });
}
