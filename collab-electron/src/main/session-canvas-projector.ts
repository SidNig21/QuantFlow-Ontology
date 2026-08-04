/**
 * Tell the shell to re-read agent_session rows from the Kernel and project tiles.
 * Layout may store sessionId refs only — domain truth stays in the Kernel (Law A).
 */
import { BrowserWindow } from "electron";

export function notifySessionCanvasProjection(): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send("shell:forward", "canvas", "sessions-changed");
      win.webContents.send("qf:dock:invalidate");
    }
  }
}
