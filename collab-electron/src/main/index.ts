import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  nativeTheme,
  net,
  protocol,
  screen,
  session,
  shell,
  webContents as webContentsModule,
  type WebContents,
} from "electron";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { fromCollabFileUrl } from "@collab/shared/collab-file-url";
import {
  loadConfig,
  saveConfig,
  getPref,
  setPref,
  type WindowState,
  type TerminalTarget,
} from "./config";
import { registerIpcHandlers, setMainWindow } from "./ipc";
import { registerCanvasRpc } from "./canvas-rpc";
import {
  runBovadaFootballCapture,
  type BovadaKernelAccess,
} from "qf-bovada-football";
import {
  registerBovadaCaptureRpc,
  type BovadaCaptureRpcBinding,
} from "./bovada-capture-rpc";
import {
  getArtifactRoot,
  closeAppKernel,
  getKernelDb,
  kernelExecute,
  kernelCapabilityGroupsForSession,
  kernelGetLinks,
  kernelGetObject,
  kernelListAgentDefinitions,
  kernelListAgentSessions,
  kernelListTaskDelegations,
  kernelEnsureSampleResearchDataset,
  kernelEnsureR17TechniqueFixture,
  kernelListStrategyVersions,
  kernelEnsureSyntheticMarketFixture,
  kernelSeedVisibleResearchWorld,
  kernelOpenHypothesisForQuestion,
  kernelRunGuidedResearch,
  kernelRunR17DirectorResearch,
  kernelBindSourceWork,
  kernelFreezeSourceWork,
  kernelContinueGovernedResearchResult,
  kernelRecordGovernedToolReceipt,
  kernelRecordGovernedEvaluation,
  kernelFailGovernedCriticCompletion,
  kernelFinalizeResearchEvaluation,
  kernelGovernedCriticProgress,
  kernelMarketObjectExists,
  kernelReadMarketTrajectoryResult,
  peerBusReadInbox,
  peerBusNotify,
  commitCollaborationResult,
} from "./kernel";
import { registerOntologyGatewayRpc } from "./ontology-gateway";
import {
  createCollaborationService,
  registerCollaborationGatewayRpc,
} from "./collaboration-gateway";
import { resolveLivePeerRecipient } from "./live-peer-recipient";
import { livePtyIdsForRole } from "./peer-delivery";
import { kernelSessionIdForNativePty } from "./host-native-tui";
import { requireLiveSeatCapability } from "./live-seat-capability";
import * as agentActivity from "./agent-activity";
import { buildMissionActivationInstruction } from "./mission-activation";
import { registerIntegrationsIpc } from "./integrations";
import {
  registerMethod,
  startJsonRpcServer,
  stopJsonRpcServer,
} from "./json-rpc-server";
import * as watcher from "./watcher";
import * as gitReplay from "./git-replay";
import { DISABLE_GIT_REPLAY } from "@collab/shared/replay-types";
import * as pty from "./pty";
import { updateManager, setupUpdateIPC } from "./updater";
import {
  DEV_WORKTREE_ID,
  QF_APP_DIR,
  QF_APP_PATHS_EXPLICIT,
} from "./paths";
import {
  legacyElectronUserDataPath,
  runAppMigrationBeforeBoot,
} from "./app-migration";
import { initializeLogger } from "./logger";
import {
  initMainAnalytics,
  trackEvent,
  shutdownAnalytics,
  getDeviceId,
} from "./analytics";
import { stopImageWorker } from "./image-service";
import { installCli } from "./cli-installer";
import { listTerminalTargets } from "./terminal-target";
import { readSessionMeta } from "./tmux";
import { registerBrowserIpc } from "./ipc-browser";

import {
  bootstrapPackagedDockProfiles,
  closeAgentSessionRow,
  captureAgentSessionOutput,
  disposeAgentHost,
  submitAgentSessionInstruction,
  admitAndStartSession,
  startPrecreatedNativeTuiSession,

  reconcileStaleSessions,

} from "./agent-host";
import {
  buildGovernedCriticCompletionInstruction,
  ensureGovernedCriticCompletion,
} from "./governed-critic-completion";
import { createKernelAgentSession } from "./runtime-kernel-admission";
import { bindMissionToDirectorSession, clearMissionForDirectorSession, missionForDirectorSession } from "./mission-context";
import {
  bindResearchHypothesis,
  clearResearchHypothesis,
  researchHypothesisForSession,
  researchStrategyForSession,
} from "./research-context";

function closeAdmittedSession(sessionId: string): void {
  closeAgentSessionRow(sessionId);
  clearMissionForDirectorSession(sessionId);
  clearResearchHypothesis(sessionId);
}

function getKernelAgentDefinitionIds(): string[] {
  return kernelListAgentDefinitions()
    .map((row) => row.id)
    .filter((id): id is string => typeof id === "string");
}

function requirePeerSessionRole(
  sessionId: unknown,
  claimedRole: unknown,
): { sessionId: string; role: string } {
  if (typeof sessionId !== "string" || sessionId.length === 0) {
    throw new Error("peer-bus requires session_id");
  }
  if (typeof claimedRole !== "string" || claimedRole.length === 0) {
    throw new Error("peer-bus requires role");
  }
  const links = kernelGetLinks(sessionId, { kind: "spawned_from" })
    .filter((link) => link.from_id === sessionId);
  if (links.length !== 1 || !links[0]!.to_id) {
    throw new Error(`peer-bus requires exactly one outgoing spawned_from for ${sessionId}`);
  }
  const definitionId = links[0]!.to_id;
  const definition = definitionId
    ? kernelGetObject("agent_definition", definitionId)
    : null;
  if (!definition || String(definition.role ?? "") !== claimedRole) {
    throw new Error(`peer-bus role/session mismatch for ${sessionId}`);
  }
  return { sessionId, role: claimedRole };
}

function requireAuthenticatedPeerSessionRole(
  capability: unknown,
  sessionId: unknown,
  claimedRole: unknown,
): { sessionId: string; role: string } {
  const authenticated = requireLiveSeatCapability(capability, sessionId, claimedRole);
  return requirePeerSessionRole(authenticated.sessionId, authenticated.role);
}

function requireLivePeerSession(role: unknown): { sessionId: string; role: string } {
  if (typeof role !== "string" || role.length === 0) {
    throw new Error("peer-bus requires to_role");
  }
  return resolveLivePeerRecipient(role, {
    ptyIdsForRole: livePtyIdsForRole,
    kernelSessionForPty: kernelSessionIdForNativePty,
    getSession: (sessionId) => kernelGetObject("agent_session", sessionId),
    identityForSession: peerIdentityForSession,
  });
}

function peerIdentityForSession(sessionId: string): { sessionId: string; role: string } {
  const links = kernelGetLinks(sessionId, { kind: "spawned_from" })
    .filter((link) => link.from_id === sessionId);
  if (links.length !== 1 || !links[0]!.to_id) {
    throw new Error(`collaboration session must have exactly one spawned_from: ${sessionId}`);
  }
  const definition = links[0]!.to_id
    ? kernelGetObject("agent_definition", links[0]!.to_id)
    : null;
  const role = definition?.role;
  if (typeof role !== "string" || role.length === 0) {
    throw new Error(`collaboration session identity is missing for ${sessionId}`);
  }
  return requirePeerSessionRole(sessionId, role);
}

// Capture Electron's legacy default before replacing it. The migration must
// publish app state before logger/config/sidecar consumers create destinations.
if (!QF_APP_PATHS_EXPLICIT) {
  runAppMigrationBeforeBoot({
    legacyElectronUserData: legacyElectronUserDataPath({
      appData: app.getPath("appData"),
      devWorktreeId: DEV_WORKTREE_ID,
    }),
    log: (message) => console.warn(message),
  });
}
const electronUserData = join(QF_APP_DIR, "electron");
mkdirSync(electronUserData, { recursive: true });
app.setPath("userData", electronUserData);
initializeLogger();

// macOS apps launched from Finder don't inherit the user's shell
// LANG, so child processes (tmux, shells) default to ASCII.
if (!process.env.LANG || !process.env.LANG.includes("UTF-8")) {
  process.env.LANG = "en_US.UTF-8";
}

process.on("uncaughtException", (error) => {
  trackEvent("app_crash", {
    type: "uncaughtException",
    message: error.message,
    stack: error.stack,
  });
  console.error("[crash] Uncaught exception:", error);
});

process.on("unhandledRejection", (reason) => {
  const error =
    reason instanceof Error ? reason : new Error(String(reason));
  trackEvent("app_crash", {
    type: "unhandledRejection",
    message: error.message,
    stack: error.stack,
  });
  console.error("[crash] Unhandled rejection:", error);
});

let mainWindow: BrowserWindow | null = null;
let pendingFilePath: string | null = null;
let config = loadConfig();
let shuttingDown = false;
let bovadaCaptureBinding: BovadaCaptureRpcBinding | null = null;

// Apply saved theme preference (light/dark/system)
const savedTheme = config.ui.theme;
if (savedTheme === "light" || savedTheme === "dark") {
  nativeTheme.themeSource = savedTheme;
} else {
  nativeTheme.themeSource = "system";
}
let globalZoomLevel = 0;

if (!app.isPackaged) {
  // Vite dev uses a relaxed renderer policy for HMR; suppress Electron's
  // repeated dev-only security banner so actionable logs stay visible.
  process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";
}

// macOS GUI apps launched from Finder get a minimal PATH from launchd.
// Resolve the user's full shell PATH so child processes (terminal, git) work.
if (app.isPackaged && process.platform === "darwin") {
  try {
    const shell = process.env["SHELL"] || "/bin/zsh";
    const output = execFileSync(
      shell,
      ["-l", "-c", 'printf "%s" "$PATH"'],
      { encoding: "utf8", timeout: 5000 },
    );
    const resolved = output.split("\n").pop()!;
    if (resolved.includes("/")) {
      process.env["PATH"] = resolved;
    }
  } catch {
    // Fall through with the default PATH if shell resolution fails.
  }
}

const DEFAULT_STATE: WindowState = {
  x: 0,
  y: 0,
  width: 1200,
  height: 800,
};

function boundsVisibleOnAnyDisplay(bounds: WindowState): boolean {
  const displays = screen.getAllDisplays();
  return displays.some((display) => {
    const { x, y, width, height } = display.workArea;
    return (
      bounds.x < x + width &&
      bounds.x + bounds.width > x &&
      bounds.y < y + height &&
      bounds.y + bounds.height > y
    );
  });
}

function saveWindowState(state: WindowState): void {
  try {
    config.window_state = state;
    saveConfig(config);
  } catch (err) {
    console.error("Failed to save window state:", err);
  }
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

function debouncedSaveWindowState(): void {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (mainWindow.isMinimized() || mainWindow.isMaximized()) return;
    const { x, y, width, height } = mainWindow.getNormalBounds();
    saveWindowState({ x, y, width, height });
  }, 500);
}

function sendShortcut(action: string): void {
  mainWindow?.webContents.send("shell:shortcut", action);
}

const cmdOrCtrl = (input: Electron.Input): boolean =>
  input.meta || input.control;
const shiftCmdOrCtrl = (input: Electron.Input): boolean =>
  input.shift && (input.meta || input.control);
const altCmdOrCtrl = (input: Electron.Input): boolean =>
  input.alt && (input.meta || input.control);
const ctrlOnly = (input: Electron.Input): boolean =>
  input.control && !input.meta;

interface ShortcutEntry {
  modifier: (input: Electron.Input) => boolean;
  action: string;
}

const TOGGLE_SHORTCUTS: Record<string, ShortcutEntry[]> = {
  KeyB: [
    { modifier: cmdOrCtrl, action: "sidebar-files" },
  ],
  Backslash: [{ modifier: cmdOrCtrl, action: "sidebar-files" }],
  Comma: [{ modifier: cmdOrCtrl, action: "toggle-settings" }],
  KeyO: [{ modifier: shiftCmdOrCtrl, action: "add-workspace" }],
  KeyK: [{ modifier: cmdOrCtrl, action: "focus-file-search" }],
  KeyN: [{ modifier: cmdOrCtrl, action: "new-tile" }],
  KeyW: [{ modifier: cmdOrCtrl, action: "close-tile" }],
  ArrowRight: [{ modifier: altCmdOrCtrl, action: "focus-tile-right" }],
  ArrowLeft: [{ modifier: altCmdOrCtrl, action: "focus-tile-left" }],
  ArrowUp: [{ modifier: altCmdOrCtrl, action: "focus-tile-up" }],
  ArrowDown: [{ modifier: altCmdOrCtrl, action: "focus-tile-down" }],
  KeyF: [{ modifier: altCmdOrCtrl, action: "toggle-fullscreen-tile" }],
};

const TOGGLE_SHORTCUT_KEYS: Record<string, ShortcutEntry[]> = {
  ",": TOGGLE_SHORTCUTS.Comma!,
  o: TOGGLE_SHORTCUTS.KeyO!,
  k: TOGGLE_SHORTCUTS.KeyK!,
  b: TOGGLE_SHORTCUTS.KeyB!,
  n: TOGGLE_SHORTCUTS.KeyN!,
  w: TOGGLE_SHORTCUTS.KeyW!,
  f: TOGGLE_SHORTCUTS.KeyF!,
};

function normalizeShortcutKey(key: string | undefined): string | null {
  if (!key) return null;
  return key.length === 1 ? key.toLowerCase() : key;
}

function resolveToggleShortcut(
  input: Electron.Input,
): ShortcutEntry | undefined {
  const candidates = TOGGLE_SHORTCUTS[input.code]
    ?? (normalizeShortcutKey(input.key)
      ? TOGGLE_SHORTCUT_KEYS[normalizeShortcutKey(input.key)!]
      : undefined);
  return candidates?.find((s) => s.modifier(input));
}

function attachShortcutListener(target: WebContents): void {
  target.on("before-input-event", (event, input) => {
    if (input.type !== "keyDown") return;

    const toggle = resolveToggleShortcut(input);
    if (toggle) {
      event.preventDefault();
      if (!input.isAutoRepeat) sendShortcut(toggle.action);
    }
  });
}

function isBrowserTileWebview(wc: WebContents): boolean {
  try {
    return wc.session === session.fromPartition("persist:browser");
  } catch {
    return false;
  }
}

function attachBrowserShortcuts(
  wc: WebContents,
  hostWindow: BrowserWindow,
): void {
  wc.on("before-input-event", (event, input) => {
    if (input.type !== "keyDown") return;
    const cmd = input.meta || input.control;
    if (!cmd) {
      if (input.key === "Escape" && wc.isLoading()) {
        event.preventDefault();
        wc.stop();
      }
      return;
    }

    if (input.code === "KeyL" || input.key === "l") {
      event.preventDefault();
      hostWindow.webContents.send(
        "browser-tile:focus-url", wc.id,
      );
    } else if (input.code === "BracketLeft" || input.key === "[") {
      event.preventDefault();
      if (wc.canGoBack()) wc.goBack();
    } else if (input.code === "BracketRight" || input.key === "]") {
      event.preventDefault();
      if (wc.canGoForward()) wc.goForward();
    } else if (input.code === "KeyR" || input.key === "r") {
      event.preventDefault();
      wc.reload();
    }
  });
}

function registerToggleShortcuts(win: BrowserWindow): void {
  attachShortcutListener(win.webContents);

  win.webContents.on("did-attach-webview", (_event, wc) => {
    wc.once("did-finish-load", () => {
      // Transparent compositor surface so terminal tiles can
      // show through to the canvas/vibrancy background.
      wc.insertCSS("html, body { background: transparent !important; }");

      attachShortcutListener(wc);
      if (isBrowserTileWebview(wc)) {
        attachBrowserShortcuts(wc, win);
      }
      if (globalZoomLevel !== 0) {
        wc.setZoomLevel(globalZoomLevel);
      }
    });
  });
}

function applyZoomToAll(level: number): void {
  globalZoomLevel = level;
  for (const wc of webContentsModule.getAllWebContents()) {
    if (!wc.isDestroyed()) wc.setZoomLevel(level);
  }
}

function buildAppMenu(): void {
  const isMac = process.platform === "darwin";
  const fullScreenAccelerator = isMac ? "Ctrl+Cmd+F" : "F11";

  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" as const },
              { type: "separator" as const },
              {
                label: "Settings\u2026",
                accelerator: "CommandOrControl+,",
                registerAccelerator: false,
                click: () => sendShortcut("toggle-settings"),
              } as Electron.MenuItemConstructorOptions,
              { type: "separator" as const },
              { role: "services" as const },
              { type: "separator" as const },
              { role: "hide" as const },
              { role: "hideOthers" as const },
              { role: "unhide" as const },
              { type: "separator" as const },
              { role: "quit" as const },
            ],
          },
        ]
      : []),
    {
      label: "File",
      submenu: [
        {
          label: "New Tile",
          accelerator: "CommandOrControl+N",
          registerAccelerator: false,
          click: () => sendShortcut("new-tile"),
        },
        {
          label: "Close Tile",
          accelerator: "CommandOrControl+W",
          registerAccelerator: false,
          click: () => sendShortcut("close-tile"),
        },
        { type: "separator" },
        {
          label: "Open Workspace\u2026",
          accelerator: "CommandOrControl+Shift+O",
          registerAccelerator: false,
          click: () => sendShortcut("add-workspace"),
        },
        { type: "separator" },
        {
          label: "Publish Artifact\u2026",
          click: () => sendShortcut("publish-artifact"),
        },
        {
          label: "Spawn Agent Session",
          click: () => sendShortcut("spawn-agent-session"),
        },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
        { type: "separator" },
        {
          label: "Find",
          accelerator: "CommandOrControl+K",
          registerAccelerator: false,
          click: () => sendShortcut("focus-file-search"),
        },
      ],
    },
    {
      label: "View",
      submenu: [
        {
          label: "Toggle Files",
          accelerator: "CommandOrControl+B",
          registerAccelerator: false,
          click: () => sendShortcut("sidebar-files"),
        },
        {
          label: "Toggle Agent",
          accelerator: "CommandOrControl+Alt+B",
          registerAccelerator: false,
          click: () => sendShortcut("toggle-agent"),
        },
        { type: "separator" },
        {
          label: "Zoom In",
          accelerator: "CommandOrControl+=",
          click: () => applyZoomToAll(globalZoomLevel + 0.25),
        },
        {
          label: "Zoom Out",
          accelerator: "CommandOrControl+-",
          click: () => applyZoomToAll(globalZoomLevel - 0.25),
        },
        {
          label: "Actual Size",
          accelerator: "CommandOrControl+0",
          click: () => applyZoomToAll(0),
        },
        { type: "separator" },
        { role: "toggleDevTools" },
        {
          label: "Toggle Full Screen",
          accelerator: fullScreenAccelerator,
          click: (_, win) => win?.setFullScreen(!win.isFullScreen()),
        },
      ],
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        ...(isMac
          ? [
              { type: "separator" as const },
              { role: "front" as const },
            ]
          : [{ role: "close" as const }]),
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function getPreloadPath(name: string): string {
  return join(__dirname, `../preload/${name}.js`);
}

function getRendererURL(name: string): string {
  if (!app.isPackaged && process.env["ELECTRON_RENDERER_URL"]) {
    return `${process.env["ELECTRON_RENDERER_URL"]}/${name}/index.html`;
  }
  return pathToFileURL(
    join(__dirname, `../renderer/${name}/index.html`),
  ).href;
}

function createWindow(): void {
  const saved = config.window_state;
  const useSaved =
    saved !== null &&
    (saved.isMaximized || boundsVisibleOnAnyDisplay(saved));
  const state = useSaved ? saved : DEFAULT_STATE;

  const windowOptions: Electron.BrowserWindowConstructorOptions = {
    width: state.width,
    height: state.height,
    minWidth: 400,
    minHeight: 400,
    webPreferences: {
      preload: getPreloadPath("shell"),
      contextIsolation: true,
      sandbox: true,
      webviewTag: true,
    },
  };

  if (process.platform === "darwin") {
    Object.assign(windowOptions, {
      titleBarStyle: "hidden",
      vibrancy: "under-window",
      visualEffectState: "active",
      trafficLightPosition: { x: 14, y: 12 },
    } satisfies Partial<Electron.BrowserWindowConstructorOptions>);
  }

  if (process.platform === "win32") {
    Object.assign(windowOptions, {
      backgroundColor: "#00000000",
      backgroundMaterial: "mica",
      // WO-g4: Glacier chrome strip + custom caption (native frame would double the bar).
      titleBarStyle: "hidden",
      titleBarOverlay: {
        color: "#152034", // --qf-gl-panel-2
        symbolColor: "#7288ab", // --qf-gl-dim
        height: 38,
      },
    } satisfies Partial<Electron.BrowserWindowConstructorOptions>);
  }

  if (useSaved) {
    windowOptions.x = state.x;
    windowOptions.y = state.y;
  }

  mainWindow = new BrowserWindow(windowOptions);

  if (state.isMaximized) {
    mainWindow.maximize();
  }

  mainWindow.on("move", debouncedSaveWindowState);
  mainWindow.on("resize", debouncedSaveWindowState);
  mainWindow.on("close", () => {
    if (saveTimeout) clearTimeout(saveTimeout);
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const { x, y, width, height } = mainWindow.getNormalBounds();
    saveWindowState({
      x,
      y,
      width,
      height,
      isMaximized: mainWindow.isMaximized(),
    });
  });
  mainWindow.loadURL(getRendererURL("shell"));

  setMainWindow(mainWindow);
  registerCanvasRpc(mainWindow);
}

ipcMain.handle(
  "analytics:get-device-id",
  () => getDeviceId(),
);

ipcMain.on("analytics:track-event", (_event, name, properties) => {
  trackEvent(name, properties);
});

ipcMain.on("canvas:focus-agent-session", (_event, sessionId: unknown) => {
  if (typeof sessionId !== "string" || sessionId.length === 0) return;
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send("canvas:focus-agent-session", sessionId);
});

ipcMain.handle("shell:get-view-config", () => {
  const preload = pathToFileURL(
    getPreloadPath("universal"),
  ).href;

  return {
    nav: { src: getRendererURL("nav"), preload },
    viewer: { src: getRendererURL("viewer"), preload },

    terminalTile: { src: getRendererURL("terminal-tile"), preload },
    graphTile: { src: getRendererURL("graph-tile"), preload },
    artifactTile: { src: getRendererURL("artifact-tile"), preload },
    sessionTile: { src: getRendererURL("session-tile"), preload },
    settings: { src: getRendererURL("settings"), preload },
    tileList: { src: getRendererURL("tile-list"), preload },

  };
});

ipcMain.handle(
  "pref:get",
  (_event, key: string) => getPref(config, key),
);

ipcMain.handle(
  "pref:set",
  (_event, key: string, value: unknown) => {
    setPref(config, key, value);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("pref:changed", key, value);
    }
  },
);

ipcMain.handle(
  "terminal:list-targets",
  () => listTerminalTargets(),
);

ipcMain.handle(
  "theme:set",
  (_event, mode: string) => {
    const valid = mode === "light" || mode === "dark" ? mode : "system";
    nativeTheme.themeSource = valid;
    setPref(config, "theme", valid);
  },
);

ipcMain.handle(
  "pty:create",
  (
    event,
    params?: {
      cwd?: string;
      cols?: number;
      rows?: number;
      tileId?: string;
      target?: TerminalTarget;
    },
  ) =>
    pty.createSession(
      params?.cwd,
      event.sender.id,
      params?.cols,
      params?.rows,
      params?.target,
      params?.tileId,
    ),
);

function handlePtyWrite(
  sessionId: string,
  data: string,
): void {
  pty.writeToSession(sessionId, data);
}

ipcMain.on(
  "pty:write",
  (_event, { sessionId, data }: { sessionId: string; data: string }) => {
    handlePtyWrite(sessionId, data);
  },
);

function handlePtySendRawKeys(
  sessionId: string,
  data: string,
): void {
  pty.sendRawKeys(sessionId, data);
}

ipcMain.on(
  "pty:send-raw-keys",
  (_event, { sessionId, data }: { sessionId: string; data: string }) => {
    handlePtySendRawKeys(sessionId, data);
  },
);

ipcMain.handle(
  "pty:resize",
  (
    _event,
    {
      sessionId,
      cols,
      rows,
    }: { sessionId: string; cols: number; rows: number },
  ) => pty.resizeSession(sessionId, cols, rows),
);

ipcMain.handle(
  "pty:kill",
  (_event, { sessionId }: { sessionId: string }) =>
    pty.killSession(sessionId),
);

ipcMain.handle(
  "pty:reconnect",
  (
    event,
    {
      sessionId,
      cols,
      rows,
    }: { sessionId: string; cols: number; rows: number },
  ) =>
    pty.reconnectSession(
      sessionId, cols, rows, event.sender.id,
    ),
);

ipcMain.handle(
  "pty:discover",
  () => pty.discoverSessions(),
);

ipcMain.handle(
  "pty:read-meta",
  (_event, sessionId: string) => readSessionMeta(sessionId),
);

ipcMain.handle(
  "pty:capture",
  (
    _event,
    { sessionId, lines }: { sessionId: string; lines?: number },
  ) => pty.captureSession(sessionId, lines),
);

let settingsOpen = false;

function setSettingsOpen(open: boolean): void {
  if (!mainWindow || settingsOpen === open) return;
  settingsOpen = open;
  mainWindow.webContents.send("shell:settings", open ? "open" : "close");
}

const LOG_FN_BY_LEVEL: Record<number, (...args: unknown[]) => void> = {
  0: console.debug,
  1: console.log,
  2: console.warn,
  3: console.error,
};

ipcMain.on(
  "webview:console",
  (_event, panel: string, level: number, message: string, source: string) => {
    const tag = `[webview:${panel}]`;
    const logFn = LOG_FN_BY_LEVEL[level] ?? console.log;
    logFn(`${tag} ${message}`, source ? `(${source})` : "");
  },
);

ipcMain.on("settings:close", () => setSettingsOpen(false));
ipcMain.on("settings:toggle", () => setSettingsOpen(!settingsOpen));

function sendLoadingDone(): void {
  mainWindow?.webContents.send("shell:loading-done");
}

async function shutdownBackgroundServices(): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  bovadaCaptureBinding?.cancelOnAppShutdown();
  bovadaCaptureBinding = null;
  pty.setShuttingDown(true);
  await pty.killAllAndWait();
  await pty.shutdownSidecarIfIdle();
  await disposeAgentHost();
  watcher.stopWorker();
  if (!DISABLE_GIT_REPLAY) gitReplay.stopWorker();
  stopJsonRpcServer();
  stopImageWorker();
  closeAppKernel();
}

app.on("open-file", (event, path) => {
  event.preventDefault();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(
      "shell:forward", "viewer", "file-selected", path,
    );
  } else {
    pendingFilePath = path;
  }
});

protocol.registerSchemesAsPrivileged([
  {
    scheme: "collab-file",
    privileges: {
      supportFetchAPI: true,
      bypassCSP: true,
      stream: true,
    },
  },
]);

app.on("web-contents-created", (_event, contents) => {
  const isExternal = (url: string): boolean => {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return false;
    }
    const devOrigin = process.env["ELECTRON_RENDERER_URL"];
    if (devOrigin && url.startsWith(devOrigin)) return false;
    return true;
  };

  contents.setWindowOpenHandler(({ url, disposition }) => {
    if (isBrowserTileWebview(contents)) {
      if (disposition === "foreground-tab" || disposition === "background-tab") {
        mainWindow?.webContents.send(
          "shell:forward", "canvas", "open-browser-tile", url,
          contents.id,
        );
        return { action: "deny" };
      }
      return {
        action: "allow",
        overrideBrowserWindowOptions: {
          width: 500,
          height: 600,
          webPreferences: {
            partition: "persist:browser",
          },
        },
      };
    }
    if (isExternal(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  contents.on("will-navigate", (event, url) => {
    if (isExternal(url) && !isBrowserTileWebview(contents)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
});

app.whenReady().then(async () => {
  // Set a standard Chrome user-agent on the browser tile session so sites
  // (especially Google OAuth) treat it as a real browser, not an embedded webview.
  const browserSession = session.fromPartition("persist:browser");
  const electronUA = browserSession.getUserAgent();
  browserSession.setUserAgent(
    electronUA.replace(/\s*Electron\/\S+/, ""),
  );

  protocol.handle("collab-file", (request) => {
    const filePath = fromCollabFileUrl(request.url);
    return net.fetch(pathToFileURL(filePath).toString());
  });

  shuttingDown = false;

  config = loadConfig();
  installCli();
  watcher.startWorker();
  registerIpcHandlers(config);
  registerBrowserIpc();
  registerIntegrationsIpc();
  setupUpdateIPC();
  updateManager.init({
    onBeforeQuit: () => shutdownBackgroundServices(),
  });

  // Package defaults enter through execute; runtime truth remains in the Kernel.
  try {
    bootstrapPackagedDockProfiles();
    bootstrapPackagedDockProfiles(); // explicit startup idempotence control
    reconcileStaleSessions();
  } catch (err) {
    console.error("agent-host: startup FAILED", err);
    throw err;
  }

  try {
    await pty.ensureSidecar();
  } catch (err) {
    console.error("Sidecar failed to start:", err);
  }

  buildAppMenu();
  createWindow();

  registerToggleShortcuts(mainWindow!);

  initMainAnalytics();
  trackEvent("app_launched");

  const projectStartedSession = (
    sessionId: string,
    definitionId: string,
    info?: {
      surface: "acp_session" | "native_tui";
      ptySessionId?: string;
      role?: string;
    },
  ) => {
    mainWindow?.webContents.send("qf:dock:invalidate");
    mainWindow?.webContents.send("shell:forward", "canvas", "sessions-changed");
    if (info?.surface !== "native_tui" || !info.ptySessionId) return;
    mainWindow?.webContents.send(
      "shell:forward",
      "canvas",
      "create-term-tile",
      info.ptySessionId,
      sessionId,
      definitionId,
      info.role,
      definitionId.startsWith("qf-proof-")
        ? "DETERMINISTIC PROOF AGENT"
        : String(
            kernelGetObject("agent_definition", definitionId)?.display_name ??
              definitionId,
          ),
    );
  };
  const startPrecreatedSessionWithTile = (
    caller: { sessionId: string; role: string },
    sessionId: string,
    missionActivation?: string,
  ) => startPrecreatedNativeTuiSession(caller, sessionId, {
    missionActivation,
    onStarted: projectStartedSession,
  });

  mainWindow!.webContents.on("did-finish-load", () => {
    sendLoadingDone();
    if (pendingFilePath) {
      mainWindow!.webContents.send(
        "shell:forward", "viewer", "file-selected", pendingFilePath,
      );
      pendingFilePath = null;
    }
  });

  registerMethod("ping", () => ({ pong: true }), {
    description: "Health check — returns {pong: true}",
  });
  registerMethod("app.shutdown", () => {
    setImmediate(() => app.quit());
    return { shuttingDown: true };
  }, {
    description: "Request a clean application shutdown",
  });
  registerMethod("app.readiness", () => ({
    canvas: Boolean(
      mainWindow &&
        !mainWindow.isDestroyed() &&
        mainWindow.webContents.getURL().includes("/shell") &&
        !mainWindow.webContents.isLoading(),
    ),
    windowUrl: mainWindow?.webContents.getURL() ?? "",
    dockProfileIds: getKernelAgentDefinitionIds(),
    buildIdentity: {
      commitSha: __GIT_COMMIT_SHA__,
      packagedAt: __QF_BUILD_TIMESTAMP__,
    },
  }), {
    description: "Return founder-visible shell and Kernel-backed Dock readiness",
  });
  registerMethod("app.ui.evaluate", async (params) => {
    if (process.env.QF_UI_PROOF !== "1") {
      throw new Error("app.ui.evaluate is disabled outside the bounded UI proof");
    }
    const expression = (params as Record<string, unknown> | null)?.expression;
    if (typeof expression !== "string" || expression.trim().length === 0) {
      throw new Error("app.ui.evaluate requires expression:string");
    }
    if (!mainWindow || mainWindow.isDestroyed()) {
      throw new Error("production shell window is not available");
    }
    return mainWindow.webContents.executeJavaScript(expression, true);
  }, {
    description: "Bounded production UI proof bridge for the live shell renderer",
    params: { expression: "JavaScript evaluated in the production shell renderer" },
  });
  registerMethod("app.ui.capturePage", async (params) => {
    if (process.env.QF_UI_PROOF !== "1") {
      throw new Error("app.ui.capturePage is disabled outside the bounded UI proof");
    }
    const outputPath = (params as Record<string, unknown> | null)?.outputPath;
    if (typeof outputPath !== "string" || outputPath.trim().length === 0) {
      throw new Error("app.ui.capturePage requires outputPath:string");
    }
    if (!mainWindow || mainWindow.isDestroyed()) {
      throw new Error("production shell window is not available");
    }
    const image = await mainWindow.webContents.capturePage();
    writeFileSync(outputPath, image.toPNG());
    const size = image.getSize();
    return { outputPath, width: size.width, height: size.height };
  }, {
    description: "Bounded production UI proof capture of the live shell BrowserWindow",
    params: { outputPath: "Absolute PNG path for the bounded proof capture" },
  });
  registerMethod("app.ui.pressKey", async (params) => {
    if (process.env.QF_UI_PROOF !== "1") {
      throw new Error("app.ui.pressKey is disabled outside the bounded UI proof");
    }
    const key = (params as Record<string, unknown> | null)?.key;
    if (typeof key !== "string" || !["Tab", "Enter", "Escape"].includes(key)) {
      throw new Error("app.ui.pressKey accepts only Tab, Enter, or Escape");
    }
    if (
      !mainWindow ||
      mainWindow.isDestroyed() ||
      !mainWindow.webContents.getURL().includes("/shell")
    ) {
      throw new Error("production shell window is not available");
    }
    mainWindow.webContents.sendInputEvent({ type: "keyDown", keyCode: key });
    mainWindow.webContents.sendInputEvent({ type: "keyUp", keyCode: key });
    return { key, sent: true };
  }, {
    description: "Bounded native keyboard input for the production UI proof",
    params: { key: "One of Tab, Enter, or Escape" },
  });
  registerMethod("app.build-identity", () => ({
    commitSha: __GIT_COMMIT_SHA__,
    packagedAt: __QF_BUILD_TIMESTAMP__,
  }), {
    description: "Return the build identity displayed in the shell masthead",
  });
  registerMethod(
    "qf.dock.spawn",
    async (params) => {
      if (!params || typeof params !== "object") throw new Error("dock spawn requires params");
      const definitionId = (params as Record<string, unknown>).definitionId;
      if (typeof definitionId !== "string" || definitionId.length === 0) {
        throw new Error("dock spawn requires definitionId");
      }
      const missionActivation = (params as Record<string, unknown>).missionActivation;
      if (missionActivation !== undefined) {
        if (
          process.env.QF_DOCK_QA_MODE !== "1" ||
          !definitionId.startsWith("qf-proof-") ||
          typeof missionActivation !== "string"
        ) {
          throw new Error("dock spawn mission activation is QA proof-only");
        }
      }
      return await admitAndStartSession(definitionId, {
        ...(typeof missionActivation === "string" ? { missionActivation } : {}),
        onStarted: projectStartedSession,
      });
    },
    { description: "Drive the same definition-backed Dock spawn admission used by the shell." },
  );
  registerMethod(
    "qf.r17.admission",
    () => {
      if (process.env.QF_R17_GATE !== "1") throw new Error("R17 admission proof is unavailable");
      return (globalThis as Record<string, unknown>).__QF_R17_LAST_ADMISSION ?? null;
    },
    { description: "QA-only authenticated R17 gateway admission receipt." },
  );
  registerMethod(
    "qf.pty.capture",
    async (params) => {
      if (!params || typeof params !== "object") throw new Error("pty capture requires params");
      const sessionId = (params as Record<string, unknown>).sessionId;
      if (typeof sessionId !== "string" || sessionId.length === 0) throw new Error("pty capture requires sessionId");
      return { output: await pty.captureSession(sessionId, 200) };
    },
    { description: "Capture a spawned proof tile's terminal output for the Windows gate." },
  );
  registerMethod(
    "qf.session.capture",
    async (params) => {
      if (process.env.QF_UI_PROOF !== "1") throw new Error("Session runtime unavailable.");
      if (!params || typeof params !== "object") throw new Error("Session runtime unavailable.");
      const sessionId = (params as Record<string, unknown>).sessionId;
      if (typeof sessionId !== "string" || sessionId.length === 0) throw new Error("Session runtime unavailable.");
      const ptySessionId = agentActivity.getPtySessionId(sessionId);
      if (!ptySessionId) throw new Error("Session runtime unavailable.");
      return { output: await pty.captureSession(ptySessionId, 200) };
    },
    { description: "Proof-only capture of the owned PTY for one Kernel agent session." },
  );
  registerMethod(
    "qf.task_delegations.list",
    () => kernelListTaskDelegations(),
    { description: "Read Kernel-backed task delegation projection." },
  );
  registerMethod("workspace.getConfig", () => config, {
    description: "Return the current app configuration",
  });
  const collaborationDeps = {
      authenticate: requireAuthenticatedPeerSessionRole,
      capabilityGroups: kernelCapabilityGroupsForSession,
      liveRecipientForRole: requireLivePeerSession,
      identityForSession: peerIdentityForSession,
      getObject: kernelGetObject,
      getLinks: kernelGetLinks,
      execute: kernelExecute,
      missionForSession: missionForDirectorSession,
      marketObjectExists: kernelMarketObjectExists,
      readMarketTrajectoryResult: kernelReadMarketTrajectoryResult,
      commitResult: (input) => commitCollaborationResult(input, (artifactId) => {
        const hypothesisId = researchHypothesisForSession(input.delegatorSessionId);
        if (!hypothesisId) throw new Error(`research result has no exact Hypothesis binding for ${input.delegatorSessionId}`);
        const strategyId = researchStrategyForSession(input.delegatorSessionId);
        if (!strategyId) throw new Error("TECHNIQUE COVERAGE REFUSED");
        const run = kernelRunR17DirectorResearch(input.workerSessionId, hypothesisId, artifactId, strategyId);
        if (!run) throw new Error("research result could not create exact deterministic Run");
        kernelBindSourceWork({
          source_task_id: input.taskId,
          hypothesis_id: run.hypothesisId,
          run_id: run.runId,
          result_artifact_id: artifactId,
          executor_session_id: input.workerSessionId,
        });
      }),
      ...(process.env.QF_R17_GATE === "1" ? { mintTaskId: () => "task-r17-gate" } : {}),
      notify: (input) => {
        const busDb = process.env.QF_PEER_BUS_DB;
        if (!busDb) throw new Error("app-owned peer bus is unavailable");
        return peerBusNotify(busDb, input);
      },
    };
  const collaborationService = createCollaborationService(collaborationDeps);
  registerCollaborationGatewayRpc(
    registerMethod,
    collaborationDeps,
    (change) => {
      mainWindow?.webContents.send("shell:forward", "canvas", "handoffs-changed");
      mainWindow?.webContents.send("qf:dock:invalidate");
      if (change.kind === "result") {
        mainWindow?.webContents.send(
          "shell:forward",
          "canvas",
          "create-artifact-tile",
          change.artifactId,
        );
        // Only evidence workers advance the research pipeline. A critic owns
        // Evaluation truth, not another worker-result cycle.
        if (peerIdentityForSession(change.workerSessionId).role !== "worker") {
          closeAdmittedSession(change.workerSessionId);
          closeAdmittedSession(change.delegatorSessionId);
          return;
        }
        // When a settled Dataset is available, continue through deterministic
        // metrics and an independent critic. Otherwise the evidence answer is
        // the honest terminal product for this question.
        setTimeout(() => {
          void (async () => {
            try {
              const sourceWork = kernelFreezeSourceWork(change.taskId);
              if (sourceWork.result_artifact_id !== change.artifactId) {
                throw new Error("research result Artifact does not match the frozen source work");
              }
              const runRow = kernelGetObject("run", sourceWork.run_id);
              if (!runRow) throw new Error("research result has no exact deterministic Run");
              const runParams = JSON.parse(String(runRow.params)) as { result_artifact_id?: unknown };
              const runResultArtifactId = typeof runParams.result_artifact_id === "string" ? runParams.result_artifact_id : "";
              const runResultArtifact = runResultArtifactId ? kernelGetObject("artifact", runResultArtifactId) : null;
              if (!runResultArtifact) throw new Error("research result Run has no durable result Artifact");
              const runMetrics = JSON.parse(readFileSync(String(runResultArtifact.storage_ref), "utf8")) as { metrics?: Record<string, unknown> };
              const run = {
                hypothesisId: sourceWork.hypothesis_id,
                runId: sourceWork.run_id,
                artifactId: sourceWork.result_artifact_id,
                metrics: runMetrics.metrics ?? {},
              };
              closeAdmittedSession(change.workerSessionId);
              const criticSessionId = `critic-${crypto.randomUUID()}`;
              createKernelAgentSession(
                {
                  sessionId: criticSessionId,
                  definitionId: "hermes-critic",
                  label: "Independent research critic",
                  actorSessionId: change.delegatorSessionId,
                },
                {
                  execute: kernelExecute,
                  newTrace: () => ({
                    trace_id: crypto.randomUUID(),
                    span_id: crypto.randomUUID(),
                  }),
                },
              );
              await startPrecreatedSessionWithTile(
                { sessionId: change.delegatorSessionId, role: "orchestrator" },
                criticSessionId,
              );
              const continuation = await kernelContinueGovernedResearchResult({
                source_task_id: change.taskId,
                hypothesis_id: run.hypothesisId,
                run_id: run.runId,
                result_artifact_id: sourceWork.result_artifact_id,
                executor_session_id: change.workerSessionId,
                critic_session_id: criticSessionId,
                attempt_id: `review-${run.runId}`,
                deliver: async (reviewTaskId, sourceWork) => {
                  const criticInstruction = buildMissionActivationInstruction(
                    reviewTaskId,
                    [
                      "Independently review this completed deterministic QuantFlow research run.",
                      `review_task_id=${reviewTaskId}`,
                      `source_work=${JSON.stringify(sourceWork)}`,
                      `metrics=${JSON.stringify(run.metrics)}`,
                      "Read exactly those Hypothesis, Run, and Artifact objects with generated QuantFlow ontology tools; do not query unrelated objects.",
                      "Then call qf_record_evaluation exactly once with those exact ids, a verdict of supports|rejects|inconclusive, numeric confidence from 0 through 1, a non-empty rationale, and a non-empty ordered findings array. Every finding must contain exactly code, severity, message, and evidence_refs; severity must be info|warning|error; every evidence_refs value must be drawn only from the exact Hypothesis, Run, result Artifact, source Task, or executor ids in frozen source_work.",
                    ].join("\n"),
                    "critic",
                  );
                  await submitAgentSessionInstruction(criticSessionId, criticInstruction);
                },
              });
              const completionInstruction = buildGovernedCriticCompletionInstruction(
                continuation.review_task_id,
                continuation.source_work,
              );
              void ensureGovernedCriticCompletion(completionInstruction, {
                progress: () => kernelGovernedCriticProgress(
                  criticSessionId,
                  continuation.review_task_id,
                ),
                capture: () => captureAgentSessionOutput(criticSessionId),
                submit: (instruction) => submitAgentSessionInstruction(
                  criticSessionId,
                  instruction,
                ),
                fail: (reasonCode, message) => {
                  kernelFailGovernedCriticCompletion(
                    continuation.review_task_id,
                    reasonCode,
                    message,
                  );
                },
              }).then((result) => {
                if (result !== "failed") return;
                closeAdmittedSession(criticSessionId);
                closeAdmittedSession(change.delegatorSessionId);
                mainWindow?.webContents.send("qf:dock:invalidate");
                mainWindow?.webContents.send("qf:events:invalidate");
              }).catch((error) => {
                console.error("governed critic completion monitor failed", error);
              });
              mainWindow?.webContents.send("qf:dock:invalidate");
              mainWindow?.webContents.send("shell:forward", "canvas", "handoffs-changed");
            } catch (error) {
              console.error("research continuation failed", error);
              closeAdmittedSession(change.delegatorSessionId);
            }
          })();
        }, 250);
      }
    },
  );
  registerMethod(
    "qf.peer-bus.read_inbox",
    (params) => {
      if (!params || typeof params !== "object") throw new Error("peer-bus read requires params");
      const input = params as Record<string, unknown>;
      const identity = requireAuthenticatedPeerSessionRole(
        input.seat_capability,
        input.session_id,
        input.role,
      );
      const extras = Object.keys(input).filter(
        (key) => !["seat_capability", "session_id", "role"].includes(key),
      );
      if (extras.length > 0) throw new Error(`peer-bus read rejects extra field: ${extras[0]}`);
      const busDb = process.env.QF_PEER_BUS_DB;
      if (!busDb) throw new Error("app-owned peer bus is unavailable");
      return peerBusReadInbox(busDb, identity.sessionId);
    },
    { description: "Product-owned peer-bus inbox pull for one admitted session role." },
  );
  registerOntologyGatewayRpc(
    registerMethod,
    requireAuthenticatedPeerSessionRole,
    startPrecreatedSessionWithTile,
    (change) => {
      if (change.action !== "record_evaluation") return;
      try {
        const evaluationId = String((change.result as { object_id?: unknown }).object_id ?? "");
        const final = kernelFinalizeResearchEvaluation(evaluationId);
        mainWindow?.webContents.send("qf:dock:invalidate");
        mainWindow?.webContents.send("qf:events:invalidate");
        const persistedReportArtifactId = final.reportArtifactId;
        if (persistedReportArtifactId) {
          mainWindow?.webContents.send(
            "shell:forward", "canvas", "create-artifact-tile", persistedReportArtifactId,
          );
        }
      } finally {
        const criticId = change.identity.sessionId;
        const delegatorId = kernelGetLinks(criticId, { kind: "delegates_to" })
          .find((link) => link.to_id === criticId)?.from_id;
        setTimeout(() => {
          closeAdmittedSession(criticId);
          if (delegatorId) closeAdmittedSession(delegatorId);
        }, 2_000);
      }
    },
  );
  registerMethod(
    "qf.research.seed_fixture_dataset",
    (params) => {
      if (process.env.QF_HERMES_SYNTHETIC_TEST !== "1") {
        throw new Error("fixture dataset seeding is synthetic-test-only");
      }
      const input = params && typeof params === "object"
        ? params as Record<string, unknown>
        : {};
      const unexpected = Object.keys(input).filter((key) => key !== "include_future_row");
      const visibleWorld = input.visible_world;
      if (visibleWorld !== undefined && (!visibleWorld || typeof visibleWorld !== "object" || Array.isArray(visibleWorld))) {
        throw new Error("fixture dataset visible_world must be an object");
      }
      const allowed = new Set(["include_future_row", "visible_world", "dataset_id", "r17_technique"]);
      const extra = unexpected.filter((key) => !allowed.has(key));
      if (extra.length > 0) throw new Error(`fixture dataset rejects extra field: ${extra[0]}`);
      if (input.include_future_row !== undefined && typeof input.include_future_row !== "boolean") {
        throw new Error("fixture dataset include_future_row must be boolean");
      }
      if (input.r17_technique === true && visibleWorld === undefined) {
        const fixture = kernelEnsureR17TechniqueFixture();
        mainWindow?.webContents.send("qf:dock:invalidate");
        return fixture;
      }
      const requestedDataset = typeof input.dataset_id === "string" ? kernelGetObject("dataset", input.dataset_id) : null;
      const dataset = requestedDataset ?? kernelEnsureSampleResearchDataset({
        includeFutureRow: input.include_future_row === true,
      });
      const datasetId = String(dataset.object_id ?? dataset.id ?? "");
      if (!datasetId) throw new Error("fixture dataset did not resolve a Dataset id");
      if (visibleWorld) {
        const world = visibleWorld as Record<string, unknown>;
        const required = ["nonce", "mission_id", "director_session_id", "hypothesis_id", "executor_session_id", "critic_session_id"];
        for (const key of required) if (typeof world[key] !== "string" || String(world[key]).length === 0) throw new Error(`fixture dataset visible_world requires ${key}`);
        const seeded = kernelSeedVisibleResearchWorld({
          nonce: String(world.nonce),
          datasetId,
          taskId: typeof world.task_id === "string" ? world.task_id : undefined,
          missionId: String(world.mission_id),
          directorSessionId: String(world.director_session_id),
          taskTitle: typeof world.task_title === "string" ? world.task_title : "Visible research Task",
          taskDescription: typeof world.task_description === "string" ? world.task_description : "Inspect the visible research world.",
          hypothesisId: String(world.hypothesis_id),
          executorSessionId: String(world.executor_session_id),
          criticSessionId: String(world.critic_session_id),
          strategyId: typeof world.strategy_id === "string" ? world.strategy_id : undefined,
          runId: typeof world.run_id === "string" ? world.run_id : undefined,
        });
        mainWindow?.webContents.send("qf:events:invalidate");
        return { dataset, visible_world: seeded };
      }
      kernelEnsureSyntheticMarketFixture();
      return dataset;
    },
    {
      description:
        "Synthetic-test-only fixture Dataset setup through the existing app-owned Kernel actions.",
    },
  );
  registerMethod(
    "qf.research.submit_question",
    async (params) => {
      if (!params || typeof params !== "object") {
        throw new Error("submit_question requires params");
      }
      const input = params as Record<string, unknown>;
      const question = input.question;
      if (typeof question !== "string" || question.trim().length === 0) {
        throw new Error("submit_question requires non-empty question");
      }
      const text = question.trim();
      const strategyId = input.strategy_id;
      if (typeof strategyId !== "string" || strategyId.trim() !== strategyId || !kernelListStrategyVersions().some((row) => row.strategy_id === strategyId)) {
        throw new Error("TECHNIQUE COVERAGE REFUSED");
      }
      const missionId =
        typeof input.mission_id === "string" && input.mission_id.length > 0
          ? input.mission_id
          : `mission-${crypto.randomUUID()}`;
      const definitionId =
        typeof input.definition_id === "string" && input.definition_id.length > 0
          ? input.definition_id
          : process.env.QF_DOCK_QA_MODE === "1"
            ? "qf-proof-orchestrator"
            : "hermes-research-director";
      const activationInstruction = buildMissionActivationInstruction(
        missionId,
        text,
        definitionId === "hermes-research-director" ? "research-director" : "orchestrator",
      );
      kernelExecute(
        "create_mission",
        {
          mission_id: missionId,
          name: "Founder question",
          objective: text,
        },
        { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() },
      );
      const hypothesisId = kernelOpenHypothesisForQuestion(
        text,
        typeof input.dataset_id === "string" ? input.dataset_id : undefined,
      );
      const result = await admitAndStartSession(definitionId, {
        missionActivation: activationInstruction,
        beforeActivation: (sessionId) => {
          bindMissionToDirectorSession(missionId, sessionId);
        },
        onStarted: projectStartedSession,
      });
        bindResearchHypothesis(result.sessionId, hypothesisId, strategyId);
      return {
        missionId,
        hypothesisId,
        sessionId: result.sessionId,
        ptySessionId: result.ptySessionId,
        objective: text,
      };
    },
    {
      description:
        "Create a Kernel mission from the founder question and start the Research Director seat.",
    },
  );
  registerMethod(
    "qf.research.run_kernel_falsifiers",
    async (params) => {
      if (process.env.QF_HERMES_SYNTHETIC_TEST !== "1") {
        throw new Error("Kernel falsifiers are synthetic-test-only");
      }
      const requestedDefinitionId = params && typeof params === "object"
        ? (params as Record<string, unknown>).agent_definition_id
        : undefined;
      const executorDefinitionId = typeof requestedDefinitionId === "string" && requestedDefinitionId.length > 0
        ? requestedDefinitionId
        : "hermes-research-director";
      const executorSessionId = `kernel-falsifier-executor-${crypto.randomUUID()}`;
      const executorTrace = createKernelAgentSession(
        { sessionId: executorSessionId, definitionId: executorDefinitionId, label: "Kernel falsifier executor" },
        { execute: kernelExecute, newTrace: () => ({ trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() }) },
      );
      kernelExecute("start_agent_session", { session_id: executorSessionId }, {
        ...executorTrace, span_id: crypto.randomUUID(),
      });
      const dataset = kernelEnsureSampleResearchDataset({ includeFutureRow: false });
      const datasetLinks = kernelGetLinks(String(dataset.object_id), { kind: "derived_from" });
      const datasetArtifact = kernelGetObject("artifact", String(datasetLinks.find((link) => link.from_id === String(dataset.object_id))?.to_id));
      if (!datasetArtifact) throw new Error("Kernel falsifier fixture Artifact is missing");
      let missingReportReason = "";
      try {
        kernelExecute("publish_artifact", {
          kind: "report",
          path: String(datasetArtifact.storage_ref),
          storage_ref: String(datasetArtifact.storage_ref),
          content_hash: String(datasetArtifact.content_hash),
          evaluation_id: "evaluation:missing-boundary-falsifier",
        }, { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() });
        throw new Error("missing Evaluation report was accepted");
      } catch (error) {
        missingReportReason = String(error);
        if (!missingReportReason.includes("Evaluation with verdict supports")) throw error;
      }
      const hypothesisId = kernelOpenHypothesisForQuestion(
        "Kernel falsifier rejects unsupported evaluation",
        String(dataset.object_id),
      );
      const run = kernelRunGuidedResearch(executorSessionId, hypothesisId, "trajectory:kernel-falsifier-worker");
      if (!run) throw new Error("Kernel falsifier could not create exact deterministic Run");
      const mission = kernelExecute("create_mission", {
        mission_id: `kernel-falsifier-mission-${crypto.randomUUID()}`,
        name: "Kernel falsifier mission",
        objective: "Exercise the actual Electron research falsifier boundary.",
      }, { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() }) as { object_id: string };
      const sourceTask = kernelExecute("create_task", {
        task_id: `kernel-falsifier-task-${crypto.randomUUID()}`,
        title: "Kernel falsifier source work",
        description: "Complete the exact source work used by the synthetic rejection control.",
        assignee_session_id: executorSessionId,
      }, {
        trace_id: crypto.randomUUID(), span_id: crypto.randomUUID(),
        actor_session_id: executorSessionId, mission_id: mission.object_id,
      }) as { object_id: string };
      const falsifierArtifactRoot = join(getArtifactRoot(), "kernel-falsifier");
      mkdirSync(falsifierArtifactRoot, { recursive: true });
      const readBytes = new TextEncoder().encode(JSON.stringify({
        contract: "qf.ontology.v1",
        tool: "qf_venue_get",
        arguments: { id: "venue-kernel-falsifier" },
        result: { id: "venue-kernel-falsifier" },
        session_id: executorSessionId,
        role: "worker",
        created_at: new Date().toISOString(),
        nonce: crypto.randomUUID(),
      }));
      const readPath = join(falsifierArtifactRoot, `${crypto.randomUUID()}-read.json`);
      writeFileSync(readPath, readBytes);
      const read = kernelExecute("publish_artifact", {
        kind: "trajectory", bytes: readBytes, storage_ref: readPath,
        links: [{ kind: "produces", from_id: executorSessionId }],
      }, {
        trace_id: crypto.randomUUID(), span_id: crypto.randomUUID(),
        actor_session_id: executorSessionId, ontology_read_tool: "qf_venue_get",
      }) as { object_id: string };
      const workerBytes = new TextEncoder().encode(JSON.stringify({
        contract: "qf.collaboration.v1", kind: "result", task_id: sourceTask.object_id,
        from_session_id: executorSessionId, result: "kernel falsifier source result",
      }));
      const workerPath = join(falsifierArtifactRoot, `${crypto.randomUUID()}-result.json`);
      writeFileSync(workerPath, workerBytes);
      const workerResult = kernelExecute("publish_artifact", {
        kind: "trajectory", bytes: workerBytes, storage_ref: workerPath,
        links: [{ kind: "produces", from_id: executorSessionId }, { kind: "derived_from", to_id: read.object_id }],
      }, { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID(), actor_session_id: executorSessionId }) as { object_id: string };
      const sourceWork = {
        source_task_id: sourceTask.object_id,
        hypothesis_id: hypothesisId,
        run_id: run.runId,
        result_artifact_id: workerResult.object_id,
        executor_session_id: executorSessionId,
      };
      kernelBindSourceWork(sourceWork);
      kernelExecute("complete_task", {
        task_id: sourceTask.object_id, result_artifact_id: workerResult.object_id,
      }, { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID(), actor_session_id: executorSessionId });
      const criticSessionId = `kernel-falsifier-critic-${crypto.randomUUID()}`;
      createKernelAgentSession(
        { sessionId: criticSessionId, definitionId: "hermes-critic", label: "Kernel falsifier critic" },
        { execute: kernelExecute, newTrace: () => ({ trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() }) },
      );
      kernelExecute("start_agent_session", { session_id: criticSessionId }, { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() });
      const continuation = await kernelContinueGovernedResearchResult({
        source_task_id: sourceTask.object_id,
        hypothesis_id: hypothesisId,
        run_id: run.runId,
        result_artifact_id: workerResult.object_id,
        executor_session_id: executorSessionId,
        critic_session_id: criticSessionId,
        attempt_id: `kernel-falsifier-review-${crypto.randomUUID()}`,
        deliver: async () => {},
      });
      const readReceipts = [
        ["qf_hypothesis_get", { id: hypothesisId }],
        ["qf_run_get", { id: run.runId }],
        ["qf_artifact_get", { id: workerResult.object_id }],
        ["qf_record_evaluation", { verdict: "rejects" }],
      ] as const;
      const evaluationInvocationId = `kernel-falsifier-record-${crypto.randomUUID()}`;
      for (let index = 0; index < readReceipts.length; index += 1) {
        kernelRecordGovernedToolReceipt({
          invocation_id: index === 3 ? evaluationInvocationId : `kernel-falsifier-receipt-${crypto.randomUUID()}`,
          session_id: criticSessionId,
          task_id: continuation.review_task_id,
          tool_name: readReceipts[index]![0],
          arguments: readReceipts[index]![1],
          result: { ok: true },
          broker_sequence: index + 1,
        });
      }
      let rejectsReason = "";
      const evaluation = kernelRecordGovernedEvaluation({
        hypothesis_id: hypothesisId,
        run_id: run.runId,
        artifact_id: workerResult.object_id,
        review_task_id: continuation.review_task_id,
        source_work: sourceWork,
        broker_invocation_id: evaluationInvocationId,
        verdict: "rejects",
        confidence: 0.9,
        rationale: "Kernel rejection falsifier control.",
        rubric: { faithfulness: 0.2, answer_relevancy: 0.2, context_precision: 0.2, context_recall: 0.2 },
        findings: [{
          code: "KERNEL_FALSIFIER",
          severity: "warning",
          message: "The control intentionally rejects the exact Run.",
          evidence_refs: [hypothesisId, run.runId, workerResult.object_id, executorSessionId],
        }],
      }, criticSessionId);
      const final = kernelFinalizeResearchEvaluation(String(evaluation.id));
      if (final.reportArtifactId !== null || final.status !== "rejected") {
        throw new Error("rejects Evaluation unexpectedly produced a Report");
      }
      rejectsReason = `status=${final.status}`;
      let repeatReason = "";
      try {
        kernelExecute("execute_deterministic_run", {
          run_id: `run-kernel-falsifier-repeat-${crypto.randomUUID()}`,
          dataset_id: String(dataset.object_id),
          strategy_spec: { contract: "qf.strategy.v1", version: 1, stake_model: "flat", score_field: "edge" },
          params: { limit: 2 },
          repeat_of_run_id: run.runId,
        }, { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID(), actor_session_id: executorSessionId });
        throw new Error("changed deterministic input was accepted as an identical replay");
      } catch (error) {
        repeatReason = String(error);
        if (!repeatReason.includes("repeat") && !repeatReason.includes("mismatch")) throw error;
      }
      return {
        missing_report: { outcome: "rejected", reason: missingReportReason },
        rejects_evaluation: { outcome: "rejected", reason: rejectsReason, run_id: run.runId, evaluation_id: String(evaluation.id) },
        changed_repeat: { outcome: "rejected", reason: repeatReason, run_id: run.runId },
      };
    },
    { description: "Synthetic-test-only actual Kernel rejection paths for the research gate." },
  );
  const bovadaKernel: BovadaKernelAccess = {
    execute: (_db, command, input, trace) =>
      kernelExecute(command, input, trace),
    getObject: (_db, type, id) => kernelGetObject(type, id),
    getLinks: (_db, id, options) => kernelGetLinks(id, options),
  };
  bovadaCaptureBinding = registerBovadaCaptureRpc(registerMethod, {
    service: {
      capture: async ({ signal }) => {
        const receipt = await runBovadaFootballCapture({
          db: getKernelDb(),
          artifactRoot: getArtifactRoot(),
          signal,
          kernel: bovadaKernel,
        });
        const deduped = Object.values(receipt.outcomes).every(
          (outcome) => outcome === "reused",
        );
        return {
          status: deduped ? "deduped" : "captured",
          artifactId: receipt.artifact.id,
          contentHash: receipt.artifact.content_hash,
          bytes: receipt.bytes,
          eventId: receipt.selected.event_id,
          marketId: receipt.selected.market_id,
        };
      },
    },
  });

  try {
    await startJsonRpcServer();
  } catch (err) {
    console.error("Failed to start JSON-RPC server:", err);
  }
});

app.on("before-quit", (event) => {
  if (!shuttingDown) {
    event.preventDefault();
    shutdownBackgroundServices().then(() => app.quit());
  }
});

app.on("window-all-closed", async () => {
  await shutdownBackgroundServices();
  await shutdownAnalytics();
  app.quit();
});
