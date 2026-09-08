renderRulerScale();
renderPositions();
clearActiveTarget();
renderZoom();
updatePlacementStatus();
showProgress();
renderWorkspaceMode();

bindMovable(els.ruler, 'ruler');
bindMovable(els.object, 'object');

document.addEventListener('pointerdown', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;
  if (target.closest('.movable, #select-ruler, #select-object, .nudge-grid, .scene-tools')) return;
  clearActiveTarget();
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (els.taskCard.classList.contains('is-workspace-maximized') && !document.fullscreenElement) {
    els.taskCard.classList.remove('is-workspace-maximized');
    renderWorkspaceMode();
    return;
  }
  if (state.activeTarget) clearActiveTarget();
});

els.selectRuler.addEventListener('click', () => setActiveTarget('ruler', true));
els.selectObject.addEventListener('click', () => setActiveTarget('object', true));
els.nudgeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const dx = Number(button.dataset.nudgeX || 0);
    const dy = Number(button.dataset.nudgeY || 0);
    moveTarget(state.activeTarget, dx, dy);
  });
});

els.zoomOut.addEventListener('click', () => setZoom(state.zoomPercent - ZOOM_STEP));
els.zoomIn.addEventListener('click', () => setZoom(state.zoomPercent + ZOOM_STEP));
els.zoomReset.addEventListener('click', resetZoom);
els.guideToggle.addEventListener('change', () => {
  state.guidesEnabled = els.guideToggle.checked;
  renderGuides();
  updateAccessibleState();
});
els.guideColor.addEventListener('change', () => {
  state.guideColor = Object.hasOwn(GUIDE_COLORS, els.guideColor.value) ? els.guideColor.value : 'red';
  renderGuides();
  updateAccessibleState();
});
els.fullscreenToggle.addEventListener('click', () => {
  toggleWorkspaceMode();
});
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement) els.taskCard.classList.remove('is-workspace-maximized');
  renderWorkspaceMode();
});

els.resetScene.addEventListener('click', resetScene);
els.check.addEventListener('click', checkAnswer);
els.answer.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') checkAnswer();
});
els.resetProgress.addEventListener('click', resetProgress);

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {
      // The app stays usable if service worker registration fails.
    });
  });
}
