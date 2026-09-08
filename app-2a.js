function renderZoom() {
  const factor = state.zoomPercent / 100;
  const viewWidth = scenario.worldWidthMm / factor;
  const viewHeight = scenario.worldHeightMm / factor;
  const halfW = viewWidth / 2;
  const halfH = viewHeight / 2;
  const centerX = clamp(state.zoomCenterX, halfW, scenario.worldWidthMm - halfW);
  const centerY = clamp(state.zoomCenterY, halfH, scenario.worldHeightMm - halfH);
  state.zoomCenterX = centerX;
  state.zoomCenterY = centerY;
  const x = roundTenth(centerX - halfW);
  const y = roundTenth(centerY - halfH);
  els.scene.setAttribute('viewBox', `${x} ${y} ${roundTenth(viewWidth)} ${roundTenth(viewHeight)}`);
  els.zoomLabel.textContent = `${state.zoomPercent} %`;
  els.zoomOut.disabled = state.zoomPercent <= MIN_ZOOM;
  els.zoomIn.disabled = state.zoomPercent >= MAX_ZOOM;
}

function setZoom(nextPercent, recenter = true) {
  const next = clamp(nextPercent, MIN_ZOOM, MAX_ZOOM);
  if (recenter) {
    const focus = targetCenter(state.activeTarget);
    state.zoomCenterX = focus.x;
    state.zoomCenterY = focus.y;
  }
  state.zoomPercent = next;
  renderZoom();
  updateAccessibleState();
}

function resetZoom() {
  state.zoomCenterX = scenario.worldWidthMm / 2;
  state.zoomCenterY = scenario.worldHeightMm / 2;
  setZoom(100, false);
}

function workspaceIsMaximized() {
  return els.taskCard.classList.contains('is-workspace-maximized') || document.fullscreenElement === els.taskCard;
}

function renderWorkspaceMode() {
  const active = workspaceIsMaximized();
  els.fullscreenToggle.setAttribute('aria-pressed', String(active));
  els.fullscreenLabel.textContent = active
    ? 'Ukon\u010dit celou obrazovku'
    : 'Cel\u00e1 pracovn\u00ed plocha';
  document.body.classList.toggle('workspace-maximized', active);
}

async function enterWorkspaceMode() {
  els.taskCard.classList.add('is-workspace-maximized');
  renderWorkspaceMode();
  if (els.taskCard.requestFullscreen && document.fullscreenEnabled && !document.fullscreenElement) {
    try {
      await els.taskCard.requestFullscreen();
    } catch {
      // CSS fullscreen fallback remains active, including in file:// and limited mobile browsers.
    }
  }
  renderWorkspaceMode();
}

async function exitWorkspaceMode() {
  els.taskCard.classList.remove('is-workspace-maximized');
  if (document.fullscreenElement === els.taskCard && document.exitFullscreen) {
    try {
      await document.exitFullscreen();
    } catch {
      // The CSS fallback is already disabled.
    }
  }
  renderWorkspaceMode();
}

async function toggleWorkspaceMode() {
  if (workspaceIsMaximized()) await exitWorkspaceMode();
  else await enterWorkspaceMode();
}

function currentPlacement() {
  return evaluatePlacement({
    objectStartMm: state.objectX,
    objectTopMm: state.objectY,
    objectHeightMm: scenario.objectHeightMm,
    rulerZeroMm: state.rulerX,
    rulerTopMm: state.rulerY,
    targetGapMm: scenario.targetGapMm,
  });
}

