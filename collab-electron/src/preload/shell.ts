import { contextBridge, ipcRenderer, webUtils } from "electron";

const UI_PROOF = process.env.QF_UI_PROOF === "1";

interface ViewConfig {
  src: string;
  preload: string;
}

interface AllViewConfigs {
  nav: ViewConfig;
  viewer: ViewConfig;
  terminal: ViewConfig;
  terminalTile: ViewConfig;
  graphTile: ViewConfig;
  artifactTile: ViewConfig;
  sessionTile: ViewConfig;
  settings: ViewConfig;
  tileList: ViewConfig;

}

const ALLOWED_PANELS = new Set([
  "nav", "viewer", "terminal", "terminalTile",
  "graphTile", "artifactTile", "artifact-tile",
  "sessionTile", "session-tile",
  "settings", "tile-list",
]);

// Buffer loading-done signal so it isn't lost if it arrives before
// React mounts and registers the onLoadingDone listener (race between
// did-finish-load firing and useEffect running).
let loadingDoneReceived = false;
ipcRenderer.on("shell:loading-done", () => {
  loadingDoneReceived = true;
});

// Buffer shell:forward messages that arrive before the renderer
// registers its onForwardToWebview callback (cold-launch race).
const pendingForwards: [string, string, ...unknown[]][] = [];
ipcRenderer.on("shell:forward", (_event, target, channel, ...args) => {
  pendingForwards.push([target, channel, ...args]);
});

contextBridge.exposeInMainWorld("shellApi", {
  getPlatform: (): NodeJS.Platform => process.platform,
  getBuildIdentity: (): Promise<{ commitSha: string; packagedAt: string }> =>
    ipcRenderer.invoke("app:build-identity"),

  getViewConfig: (): Promise<AllViewConfigs> =>
    ipcRenderer.invoke("shell:get-view-config"),

  /** WO-006b: Kernel IPC (shell hosts the publish demo lever). */
  openFileDialog: (): Promise<string | null> =>
    ipcRenderer.invoke("dialog:open-file"),
  qf: {
    execute: (
      command: string,
      input: Record<string, unknown>,
      trace: { trace_id: string; span_id: string },
    ) => ipcRenderer.invoke("qf:execute", { command, input, trace }),
    listArtifacts: () => ipcRenderer.invoke("qf:artifacts:list"),
    listResearchLedger: () => ipcRenderer.invoke("qf:research:ledger"),
    listStrategyVersions: () => ipcRenderer.invoke("qf:research:strategies"),
    getResearchWorldProjection: (args: { root_type: "mission" | "task"; root_id: string }) =>
      ipcRenderer.invoke("qf:research-world:projection", args),
    recordStrategyOutcome: (args: Record<string, unknown>) =>
      ipcRenderer.invoke("qf:research:recordStrategyOutcome", args),
    loadSampleResearchDataset: () => ipcRenderer.invoke("qf:research:loadSampleDataset"),
    listHandoffs: () => ipcRenderer.invoke("qf:handoffs:list"),
    listTaskSurface: () => ipcRenderer.invoke("qf:tasks:surface"),
    createTask: (args: {
      tileId: string;
      title: string;
      description: string;
      assigneeSessionId: string;
    }) => {
      if (UI_PROOF) console.info("qf-ui-proof preload=qf:tasks:create");
      return ipcRenderer.invoke("qf:tasks:create", args);
    },
    reassignTask: (args: { taskId: string; assigneeSessionId: string }) =>
      ipcRenderer.invoke("qf:tasks:reassign", args),
    cancelTask: (taskId: string) =>
      ipcRenderer.invoke("qf:tasks:cancel", { taskId }),
    steerTask: (args: { taskId: string; mode: "clarify" | "redirect"; instruction: string }) =>
      ipcRenderer.invoke("qf:tasks:steer", args),
    requestSecondOpinion: (taskId: string) =>
      ipcRenderer.invoke("qf:tasks:secondOpinion", { taskId }),
    getGovernedReviewProjection: (sourceTaskId: string) =>
      ipcRenderer.invoke("qf:review:projection", { sourceTaskId }),
    requestReview: (args: { sourceTaskId: string; attemptId: string }) =>
      ipcRenderer.invoke("qf:review:request", args),
    requestRevision: (args: { sourceTaskId: string; evaluationId: string; attemptId: string }) =>
      ipcRenderer.invoke("qf:review:revision", args),
    requestSecondCritic: (args: { sourceTaskId: string; evaluationId: string; attemptId: string }) =>
      ipcRenderer.invoke("qf:review:secondCritic", args),
    listDefinitions: () => ipcRenderer.invoke("qf:definitions:list"),
    listSessions: () => ipcRenderer.invoke("qf:sessions:list"),
    submitResearchQuestion: (question: string, datasetId?: string, definitionId?: string, strategyId?: string) => {
      if (UI_PROOF) console.info("qf-ui-proof preload_ipc=qf:research:submitQuestion");
      return ipcRenderer.invoke("qf:research:submitQuestion", {
        question,
        ...(datasetId ? { datasetId } : {}),
        ...(definitionId ? { definitionId } : {}),
        ...(strategyId ? { strategyId } : {}),
      });
    },
    spawnSession: (args: { definitionId: string }) =>
      ipcRenderer.invoke("qf:sessions:spawn", args),
    runTurn: (args: { sessionId: string; prompt?: string }) =>
      ipcRenderer.invoke("qf:sessions:runTurn", args),
    cancelSession: (sessionId: string) =>
      ipcRenderer.invoke("qf:sessions:cancel", { sessionId }),
    closeSession: (sessionId: string) =>
      ipcRenderer.invoke("qf:sessions:close", { sessionId }),
    listConnections: (args?: { tileIds?: string[] }) =>
      ipcRenderer.invoke("qf:connections:list", args ?? {}),
    createConnection: (args: {
      from: string;
      to: string;
      kind?: string;
      connectionId?: string;
      canvasTileIds: string[];
    }) => ipcRenderer.invoke("qf:connections:create", args),
    deleteConnection: (args: { id: string }) =>
      ipcRenderer.invoke("qf:connections:delete", args),
    deleteConnectionsForTile: (args: { tileId: string }) =>
      ipcRenderer.invoke("qf:connections:deleteForTile", args),
    listEvents: (args?: { limit?: number }) =>
      ipcRenderer.invoke("qf:events:list", args ?? {}),
    onEventsInvalidate: (cb: () => void) => {
      const handler = () => cb();
      ipcRenderer.on("qf:events:invalidate", handler);
      return () => ipcRenderer.removeListener("qf:events:invalidate", handler);
    },
    onDockInvalidate: (cb: () => void) => {
      const handler = () => cb();
      ipcRenderer.on("qf:dock:invalidate", handler);
      return () => ipcRenderer.removeListener("qf:dock:invalidate", handler);
    },
  },

  getPref: (key: string): Promise<unknown> =>
    ipcRenderer.invoke("pref:get", key),
  setPref: (key: string, value: unknown): Promise<void> =>
    ipcRenderer.invoke("pref:set", key, value),

  onForwardToWebview: (
    cb: (target: string, channel: string, ...args: unknown[]) => void,
  ) => {
    // Replay any messages that arrived before this callback registered
    for (const [target, channel, ...args] of pendingForwards) {
      cb(target, channel, ...args);
    }
    pendingForwards.length = 0;

    // Replace the buffer listener with the real handler
    ipcRenderer.removeAllListeners("shell:forward");
    const handler = (
      _event: unknown,
      target: string,
      channel: string,
      ...args: unknown[]
    ) => cb(target, channel, ...args);
    ipcRenderer.on("shell:forward", handler);
    return () => ipcRenderer.removeListener("shell:forward", handler);
  },

  onSettingsToggle: (cb: (action: "open" | "close") => void) => {
    const handler = (_event: unknown, action: "open" | "close") =>
      cb(action);
    ipcRenderer.on("shell:settings", handler);
    return () => ipcRenderer.removeListener("shell:settings", handler);
  },

  onLoadingStatus: (cb: (message: string) => void) => {
    const handler = (_event: unknown, message: string) => cb(message);
    ipcRenderer.on("shell:loading-status", handler);
    return () =>
      ipcRenderer.removeListener("shell:loading-status", handler);
  },

  onLoadingDone: (cb: () => void) => {
    if (loadingDoneReceived) {
      cb();
      return () => {};
    }
    const handler = () => {
      loadingDoneReceived = true;
      cb();
    };
    ipcRenderer.on("shell:loading-done", handler);
    return () =>
      ipcRenderer.removeListener("shell:loading-done", handler);
  },

  onShortcut: (cb: (action: string) => void) => {
    const handler = (_event: unknown, action: string) => cb(action);
    ipcRenderer.on("shell:shortcut", handler);
    return () =>
      ipcRenderer.removeListener("shell:shortcut", handler);
  },

  onBrowserTileFocusUrl: (cb: (webContentsId: number) => void) => {
    const handler = (_event: unknown, id: number) => cb(id);
    ipcRenderer.on("browser-tile:focus-url", handler);
    return () =>
      ipcRenderer.removeListener("browser-tile:focus-url", handler);
  },

  onPrefChanged: (cb: (key: string, value: unknown) => void) => {
    const handler = (_event: unknown, key: string, value: unknown) =>
      cb(key, value);
    ipcRenderer.on("pref:changed", handler);
    return () => ipcRenderer.removeListener("pref:changed", handler);
  },

  openSettings: () => ipcRenderer.send("settings:open"),
  closeSettings: () => ipcRenderer.send("settings:close"),
  toggleSettings: () => ipcRenderer.send("settings:toggle"),

  logFromWebview: (
    panel: string,
    level: number,
    message: string,
    source: string,
  ) => {
    if (!ALLOWED_PANELS.has(panel)) return;
    ipcRenderer.send(
      "webview:console",
      panel,
      level,
      message,
      source,
    );
  },

  selectFile: (path: string) => ipcRenderer.send("nav:select-file", path),

  updateGetStatus: () => ipcRenderer.invoke("update:getStatus"),
  updateCheck: () => ipcRenderer.invoke("update:check"),
  updateDownload: () => ipcRenderer.invoke("update:download"),
  updateInstall: () => ipcRenderer.send("update:install"),
  onUpdateStatus: (cb: (state: unknown) => void) => {
    const handler = (_event: unknown, state: unknown) => cb(state);
    ipcRenderer.on("update:status", handler);
    return () => ipcRenderer.removeListener("update:status", handler);
  },

  canvasLoadState: () => ipcRenderer.invoke("canvas:load-state"),
  canvasSaveState: (state: unknown) =>
    ipcRenderer.invoke("canvas:save-state", state),

  getDragPaths: () => ipcRenderer.invoke("drag:get-paths"),
  getPathForFile: (file: File): string => webUtils.getPathForFile(file),

  isDirectory: (filePath: string): Promise<boolean> =>
    ipcRenderer.invoke("fs:is-directory", filePath),

  workspaceAdd: () => ipcRenderer.invoke("workspace:add"),
  workspaceRemove: (index: number) =>
    ipcRenderer.invoke("workspace:remove", index),
  workspaceList: () => ipcRenderer.invoke("workspace:list"),

  onWorkspaceAdded: (cb: (path: string) => void) => {
    const handler = (_event: unknown, path: string) => cb(path);
    ipcRenderer.on("workspace-added", handler);
    return () =>
      ipcRenderer.removeListener("workspace-added", handler);
  },
  onWorkspaceRemoved: (cb: (path: string) => void) => {
    const handler = (_event: unknown, path: string) => cb(path);
    ipcRenderer.on("workspace-removed", handler);
    return () =>
      ipcRenderer.removeListener("workspace-removed", handler);
  },

  onCanvasPinch: (cb: (deltaY: number) => void) => {
    const handler = (_event: unknown, deltaY: number) => cb(deltaY);
    ipcRenderer.on("canvas:pinch", handler);
    return () => ipcRenderer.removeListener("canvas:pinch", handler);
  },

  onCanvasRpcRequest: (
    cb: (request: { requestId: string; method: string; params: Record<string, unknown> }) => void,
  ) => {
    const handler = (
      _event: unknown,
      request: { requestId: string; method: string; params: Record<string, unknown> },
    ) => cb(request);
    ipcRenderer.on("canvas:rpc-request", handler);
    return () => ipcRenderer.removeListener("canvas:rpc-request", handler);
  },

  canvasRpcResponse: (response: {
    requestId: string;
    result?: unknown;
    error?: { code: number; message: string };
  }) => ipcRenderer.send("canvas:rpc-response", response),

  showConfirmDialog: (opts: {
    message: string;
    detail?: string;
    buttons?: string[];
  }): Promise<number> => ipcRenderer.invoke("dialog:confirm", opts),

  showContextMenu: (
    items: Array<{ id: string; label: string; enabled?: boolean }>,
  ) => ipcRenderer.invoke("context-menu:show", items),

  openExternal: (url: string) => ipcRenderer.send("shell:open-external", url),

  trackEvent: (name: string, properties?: Record<string, unknown>) => {
    ipcRenderer.send("analytics:track-event", name, properties);
  },

  getHomePath: (): string => ipcRenderer.sendSync("get-home-path"),

  ptyKillSession: (sessionId: string): Promise<void> =>
    ipcRenderer.invoke("pty:kill", { sessionId }),

  ptyWrite: (sessionId: string, data: string): void => {
    ipcRenderer.send("pty:write", { sessionId, data });
  },

  ptyCapture: (
    sessionId: string, lines?: number,
  ): Promise<string> =>
    ipcRenderer.invoke("pty:capture", { sessionId, lines }),

  onPtyStatusChanged: (
    cb: (payload: { sessionId: string; foreground: string }) => void,
  ) => {
    const handler = (
      _event: unknown,
      payload: { sessionId: string; foreground: string },
    ) => cb(payload);
    ipcRenderer.on("pty:status-changed", handler);
    return () =>
      ipcRenderer.removeListener("pty:status-changed", handler);
  },

  onPtyExit: (
    cb: (payload: { sessionId: string; exitCode: number }) => void,
  ) => {
    const handler = (
      _event: unknown,
      payload: { sessionId: string; exitCode: number },
    ) => cb(payload);
    ipcRenderer.on("pty:exit", handler);
    return () =>
      ipcRenderer.removeListener("pty:exit", handler);
  },

  ptyDiscover: () => ipcRenderer.invoke("pty:discover"),

  browserNavigate: (
    webContentsId: number, url: string,
  ): Promise<{ url: string }> =>
    ipcRenderer.invoke("browser:navigate", { webContentsId, url }),

  browserScreenshot: (
    webContentsId: number,
  ): Promise<{ data: string }> =>
    ipcRenderer.invoke("browser:screenshot", { webContentsId }),

  browserSnapshot: (
    webContentsId: number,
  ): Promise<unknown> =>
    ipcRenderer.invoke("browser:snapshot", { webContentsId }),

  browserClick: (
    webContentsId: number, selector: string,
  ): Promise<void> =>
    ipcRenderer.invoke("browser:click", { webContentsId, selector }),

  browserType: (
    webContentsId: number, selector: string, text: string,
  ): Promise<void> =>
    ipcRenderer.invoke("browser:type", { webContentsId, selector, text }),


});

contextBridge.exposeInMainWorld("__QF_UI_PROOF__", UI_PROOF);
