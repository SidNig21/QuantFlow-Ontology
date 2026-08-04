import { splitDisplayPath } from "@collab/shared/path-utils";

/**
 * Turns arbitrary input into a navigable URL.
 * If the input looks like a URL (has a scheme or a recognized TLD),
 * return it (prepending https:// when needed). Otherwise treat it as
 * a Google search query.
 */
function resolveInput(raw) {
  const s = raw.trim();
  if (!s) return "";

  // Already has a scheme
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) return s;

  // Looks like a domain (with TLD), optionally followed by path/query
  if (/^[^\s/]+\.[a-z]{2,}(\/\S*)?$/i.test(s)) return `https://${s}`;

  // Anything else → Google search
  return `https://www.google.com/search?q=${encodeURIComponent(s)}`;
}

/**
 * Creates the DOM structure for a tile.
 * @param {import('./canvas-state.js').Tile} tile
 * @param {object} callbacks
 * @param {(id: string) => void} callbacks.onClose
 * @param {(id: string, e?: MouseEvent) => void} callbacks.onFocus
 * @param {((id: string, url: string) => void)|null} [callbacks.onNavigate]
 * @param {((id: string) => void)|null} [callbacks.onRename]
 * @param {((id: string) => void)|null} [callbacks.onDuplicate]
 * @param {((id: string) => void)|null} [callbacks.onToggleFullscreen]
 */
export function getAgentTileModel(tile) {
  if (tile?.type !== "term" || (!tile.definitionId && !tile.sessionId)) {
    return null;
  }
  return {
    identity: tile.definitionId || tile.userTitle || "Agent CLI",
    runtime: "Native TUI",
    status: tile.ptySessionId
      ? "TUI attached"
      : (tile.sessionId ? "stopped" : "starting"),
    sessionId: tile.sessionId || null,
    dominantSurface: "tui",
    actions: ["fullscreen", "close"],
  };
}

/**
 * Arm/confirm close on the spine head. First click arms; second within armMs closes.
 * Clears armed on mouseleave, blur, and timer expiry.
 * @returns {{ disarm: () => void }}
 */
export function armCloseHead(headEl, { onConfirm, armMs = 2000 } = {}) {
  let armed = false;
  let timer = null;

  function disarm() {
    armed = false;
    headEl.dataset.armed = "false";
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function arm() {
    armed = true;
    headEl.dataset.armed = "true";
    if (timer) clearTimeout(timer);
    timer = setTimeout(disarm, armMs);
  }

  headEl.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!armed) {
      arm();
      return;
    }
    disarm();
    onConfirm?.();
  });
  headEl.addEventListener("mousedown", (e) => e.stopPropagation());
  headEl.addEventListener("mouseleave", () => disarm());
  headEl.addEventListener("blur", () => disarm());

  return { disarm };
}

export function createTileDOM(tile, callbacks) {
  const container = document.createElement("div");
  container.className = "canvas-tile";
  container.dataset.tileId = tile.id;
  container.dataset.tileType = tile.type;
  container.dataset.state = tileState(tile);
  const agentModel = getAgentTileModel(tile);
  if (agentModel) {
    container.classList.add("agent-cli-tile");
    container.dataset.agentRuntime = "native-tui";
    container.dataset.agentStatus = agentModel.status;
  }

  const spine = document.createElement("div");
  spine.className = "gl-tile__spine";

  const head = document.createElement("button");
  head.type = "button";
  head.className = "gl-tile__head";
  head.dataset.armed = "false";
  head.title = "Close tile";
  const light = document.createElement("i");
  light.className = "gl-tile__light";
  const plate = document.createElement("span");
  plate.className = "gl-tile__plate";
  const plateLabel = document.createElement("span");
  plateLabel.textContent = "CLOSE";
  plate.appendChild(plateLabel);
  head.appendChild(light);
  head.appendChild(plate);
  armCloseHead(head, {
    onConfirm: () => callbacks.onClose?.(tile.id),
  });

  const idZone = document.createElement("div");
  idZone.className = "gl-tile__id";
  const idSpan = document.createElement("span");
  idSpan.textContent = spineIdLabel(tile, agentModel);
  idZone.appendChild(idSpan);

  const grip = document.createElement("div");
  grip.className = "gl-tile__grip";
  for (let i = 0; i < 3; i++) {
    grip.appendChild(document.createElement("i"));
  }

  spine.appendChild(head);
  spine.appendChild(idZone);
  spine.appendChild(grip);

  if (callbacks.onToggleFullscreen) {
    spine.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      e.preventDefault();
      callbacks.onToggleFullscreen(tile.id);
    });
  }

  if (tile.type === "term") {
    spine.addEventListener("contextmenu", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const selected = await window.shellApi.showContextMenu([
        { id: "rename", label: "Rename" },
        { id: "duplicate", label: "Duplicate" },
      ]);
      if (selected === "rename" && callbacks.onRename) {
        callbacks.onRename(tile.id);
      } else if (selected === "duplicate" && callbacks.onDuplicate) {
        callbacks.onDuplicate(tile.id);
      }
    });
  }

  const body = document.createElement("div");
  body.className = "gl-tile__body";

  const titleRow = document.createElement("div");
  titleRow.className = "gl-tile__title";

  const titleText = document.createElement("span");
  titleText.className = "tile-title-text gl-tile__name";
  const label = getTileLabel(tile);
  const parentSpan = document.createElement("span");
  parentSpan.className = "tile-title-parent";
  parentSpan.textContent = label.parent;
  const nameSpan = document.createElement("span");
  nameSpan.className = "tile-title-name";
  nameSpan.textContent = label.name;
  titleText.appendChild(parentSpan);
  titleText.appendChild(nameSpan);
  if (tile.filePath) titleText.title = tile.filePath;
  if (tile.folderPath) titleText.title = tile.folderPath;

  const titleGroup = document.createElement("div");
  titleGroup.className = "tile-title-group";
  titleGroup.appendChild(titleText);

  if (tile.type === "term" && (tile.role || tile.sessionId || tile.definitionId)) {
    const badges = document.createElement("div");
    badges.className = "tile-agent-badges";
    if (tile.agentLabel) badges.appendChild(badge("tile-agent-label", tile.agentLabel));
    if (tile.role) badges.appendChild(badge("tile-agent-role", tile.role));
    if (agentModel) {
      badges.appendChild(badge("tile-agent-runtime", "TUI"));
      badges.appendChild(badge("tile-agent-status", agentModel.status));
    }
    if (tile.sessionId) badges.appendChild(badge("tile-agent-session", shortId(tile.sessionId)));
    titleGroup.appendChild(badges);
  }

  const copyablePath = tile.filePath || tile.folderPath;
  if (copyablePath) {
    const copySvg = `<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="5" width="9" height="9" rx="1.5"/><path d="M5 11H3.5A1.5 1.5 0 0 1 2 9.5V3.5A1.5 1.5 0 0 1 3.5 2h6A1.5 1.5 0 0 1 11 3.5V5"/></svg>`;
    const okStroke = getComputedStyle(document.documentElement)
      .getPropertyValue("--qf-ok")
      .trim() || "currentColor";
    const checkSvg = `<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="${okStroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5 6.5 12 13 4"/></svg>`;
    const copyBtn = document.createElement("button");
    copyBtn.className = "tile-copy-path-btn";
    copyBtn.innerHTML = copySvg;
    copyBtn.title = "Copy path";
    copyBtn.addEventListener("mousedown", (e) => e.stopPropagation());
    copyBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(copyablePath);
      copyBtn.innerHTML = checkSvg;
      setTimeout(() => { copyBtn.innerHTML = copySvg; }, 1000);
    });
    titleGroup.appendChild(copyBtn);
  }

  titleRow.appendChild(titleGroup);

  let urlInput;
  let navBack;
  let navForward;
  let navReload;
  if (tile.type === "browser") {
    const navGroup = document.createElement("div");
    navGroup.className = "tile-nav-group";

    navBack = document.createElement("button");
    navBack.className = "tile-nav-btn";
    navBack.title = "Back";
    navBack.innerHTML = `<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3L5 8l5 5"/></svg>`;
    navBack.disabled = true;
    navBack.addEventListener("mousedown", (e) => e.stopPropagation());

    navForward = document.createElement("button");
    navForward.className = "tile-nav-btn";
    navForward.title = "Forward";
    navForward.innerHTML = `<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3l5 5-5 5"/></svg>`;
    navForward.disabled = true;
    navForward.addEventListener("mousedown", (e) => e.stopPropagation());

    navReload = document.createElement("button");
    navReload.className = "tile-nav-btn";
    navReload.title = "Reload";
    navReload.innerHTML = `<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3v4h-4"/><path d="M12.36 10a5 5 0 1 1-.96-5.36L13 7"/></svg>`;
    navReload.addEventListener("mousedown", (e) => e.stopPropagation());

    navGroup.appendChild(navBack);
    navGroup.appendChild(navForward);
    navGroup.appendChild(navReload);
    titleRow.appendChild(navGroup);

    urlInput = document.createElement("input");
    urlInput.type = "text";
    urlInput.className = "tile-url-input";
    urlInput.placeholder = "Search or enter URL...";
    urlInput.value = tile.url || "";
    if (tile.url) urlInput.readOnly = true;
    let dragOccurred = false;
    urlInput.addEventListener("mousedown", (e) => {
      dragOccurred = false;
      if (urlInput.readOnly) return;
      e.stopPropagation();
    });
    urlInput.addEventListener("mousemove", () => {
      dragOccurred = true;
    });
    urlInput.addEventListener("click", () => {
      if (urlInput.readOnly && !dragOccurred) {
        urlInput.readOnly = false;
        urlInput.select();
      }
    });
    urlInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const url = resolveInput(urlInput.value);
        if (url && callbacks.onNavigate) callbacks.onNavigate(tile.id, url);
        urlInput.readOnly = true;
        urlInput.blur();
      }
      if (e.key === "Escape") {
        urlInput.value = tile.url || "";
        urlInput.readOnly = true;
        urlInput.blur();
      }
    });
    urlInput.addEventListener("blur", () => {
      if (!urlInput.readOnly) {
        urlInput.value = tile.url || "";
        urlInput.readOnly = true;
      }
      window.getSelection()?.removeAllRanges();
    });
    titleRow.appendChild(urlInput);
    titleText.style.display = "none";
  }

  const contentArea = document.createElement("div");
  contentArea.className = "tile-content gl-tile__screen";

  const contentOverlay = document.createElement("div");
  contentOverlay.className = "tile-content-overlay";

  body.appendChild(titleRow);
  body.appendChild(contentArea);
  contentArea.appendChild(contentOverlay);

  for (const side of ["n", "e", "s", "w"]) {
    const node = document.createElement("div");
    node.className = `gl-node gl-node--${side}`;
    node.dataset.side = side;
    container.appendChild(node);
  }

  container.appendChild(spine);
  container.appendChild(body);

  // titleBar alias = spine so drag/dblclick callers keep working until rebound.
  return {
    container,
    spine,
    titleBar: spine,
    titleText,
    contentArea,
    contentOverlay,
    head,
    urlInput,
    navBack,
    navForward,
    navReload,
  };
}

function tileState(tile) {
  if (tile.type !== "term") return "idle";
  if (tile.ptySessionId) return "running";
  if (tile.sessionId) return "idle";
  return "idle";
}

function spineIdLabel(tile, agentModel) {
  if (tile.sessionId) return shortId(tile.sessionId);
  if (tile.definitionId) return tile.definitionId;
  if (agentModel?.identity) return agentModel.identity;
  return tile.id;
}

function badge(className, text) {
	const node = document.createElement("span");
	node.className = className;
	node.textContent = text;
	node.title = text;
	return node;
}

function shortId(id) {
	return id.length <= 12 ? id : `${id.slice(0, 8)}…${id.slice(-4)}`;
}

export function getTileLabel(tile) {
  if (tile.type === "term") {
    if (tile.userTitle) return { parent: "", name: tile.userTitle };
    if (tile.definitionId) {
      return { parent: tile.role ? `${tile.role} / ` : "", name: tile.definitionId };
    }
    if (tile.autoTitle) return splitFilepath(tile.autoTitle);
    if (tile.cwd) return splitFilepath(tile.cwd);
    return { parent: "", name: "Terminal" };
  }
  if (tile.type === "browser") {
    if (tile.url) {
      try { return { parent: "", name: new URL(tile.url).hostname }; }
      catch { return { parent: "", name: tile.url }; }
    }
    return { parent: "", name: "Browser" };
  }
  if (tile.type === "graph") {
    if (tile.folderPath) return splitFilepath(tile.folderPath);
    return { parent: "", name: "Graph" };
  }
  if (tile.type === "artifact") {
    const id = tile.artifactId ?? "";
    const short = id.length <= 12 ? id : `${id.slice(0, 8)}…`;
    return { parent: "Artifact", name: short || "Artifact" };
  }
  if (tile.filePath) return splitFilepath(tile.filePath);
  return { parent: "", name: tile.type };
}

export function splitFilepath(path) {
  return splitDisplayPath(path);
}

export function updateTileTitle(dom, tile) {
  const label = getTileLabel(tile);
  const titleText = dom.titleText;
  titleText.textContent = "";
  const parentSpan = document.createElement("span");
  parentSpan.className = "tile-title-parent";
  parentSpan.textContent = label.parent;
  const nameSpan = document.createElement("span");
  nameSpan.className = "tile-title-name";
  nameSpan.textContent = label.name;
  titleText.appendChild(parentSpan);
  titleText.appendChild(nameSpan);
  titleText.title = tile.filePath || tile.folderPath || tile.cwd || "";
}

export function startInlineRename(dom, tile, onCommit) {
  const existing = dom.titleText.parentNode.querySelector(".tile-rename-input");
  if (existing) return;
  const titleText = dom.titleText;
  const currentLabel = getTileLabel(tile);
  const currentName = currentLabel.parent
    ? currentLabel.parent + currentLabel.name
    : currentLabel.name;

  const input = document.createElement("input");
  input.type = "text";
  input.className = "tile-rename-input";
  input.value = tile.userTitle ?? currentName;
  titleText.style.display = "none";
  titleText.parentNode.insertBefore(input, titleText);
  input.select();
  input.focus();

  let committed = false;

  function commit() {
    if (committed) return;
    committed = true;
    const value = input.value.trim();
    input.remove();
    titleText.style.display = "";
    onCommit(value);
  }

  function cancel() {
    if (committed) return;
    committed = true;
    input.remove();
    titleText.style.display = "";
  }

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
    e.stopPropagation();
  });
  input.addEventListener("blur", () => commit());
  input.addEventListener("mousedown", (e) => e.stopPropagation());
}

/**
 * Positions a tile container in screen coordinates.
 * @param {HTMLElement} container
 * @param {import('./canvas-state.js').Tile} tile
 * @param {number} panX
 * @param {number} panY
 * @param {number} zoom
 */
export function positionTile(container, tile, panX, panY, zoom) {
  if (container.classList?.contains?.("tile-fullscreen")) return;

  const sx = tile.x * zoom + panX;
  const sy = tile.y * zoom + panY;

  container.style.left = `${sx}px`;
  container.style.top = `${sy}px`;
  container.style.width = `${tile.width}px`;
  container.style.height = `${tile.height}px`;
  container.style.transform = `scale(${zoom})`;
  container.style.transformOrigin = "top left";
  container.style.zIndex = String(tile.zIndex);
}

/**
 * Positions all tile containers.
 * @param {Map<string, {container: HTMLElement}>} tileDOMs
 * @param {import('./canvas-state.js').Tile[]} tiles
 * @param {number} panX
 * @param {number} panY
 * @param {number} zoom
 */
export function positionAllTiles(tileDOMs, tiles, panX, panY, zoom) {
  for (const tile of tiles) {
    const dom = tileDOMs.get(tile.id);
    if (dom) positionTile(dom.container, tile, panX, panY, zoom);
  }
}
