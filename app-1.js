const { evaluateMeasurement, evaluatePlacement, parseDecimal } = globalThis.PhysicsLength;

const VERSION = '0.5.2';
const STORAGE_KEY = 'mer-jako-fyzik-delka-progress-v1';
const MIN_ZOOM = 100;
const MAX_ZOOM = 200;
const ZOOM_STEP = 25;
const GUIDE_RULER_OVERLAP_MM = 13;
const GUIDE_COLORS = Object.freeze({
  red: '#c62828',
  blue: '#2457d6',
  green: '#18794e',
  black: '#20242c',
});
const GUIDE_COLOR_NAMES = Object.freeze({
  red: '\u010derven\u00e1',
  blue: 'modr\u00e1',
  green: 'zelen\u00e1',
  black: '\u010dern\u00e1',
});

const scenario = Object.freeze({
  worldWidthMm: 200,
  worldHeightMm: 125,
  objectLengthMm: 84,
  objectHeightMm: 14,
  rulerLengthMm: 150,
  rulerHeightMm: 28,
  targetGapMm: 1.5,
  initialObjectX: 52,
  initialObjectY: 22,
  initialRulerX: 18,
  initialRulerY: 79,
});

const bounds = Object.freeze({
  objectXMin: 5,
  objectXMax: scenario.worldWidthMm - scenario.objectLengthMm - 5,
  objectYMin: 5,
  objectYMax: scenario.worldHeightMm - scenario.objectHeightMm - scenario.rulerHeightMm - 6,
  rulerXMin: 5,
  rulerXMax: scenario.worldWidthMm - scenario.objectLengthMm - 5,
  rulerYMin: 5,
  rulerYMax: scenario.worldHeightMm - scenario.rulerHeightMm - 5,
});

const state = {
  objectX: scenario.initialObjectX,
  objectY: scenario.initialObjectY,
  rulerX: scenario.initialRulerX,
  rulerY: scenario.initialRulerY,
  activeTarget: null,
  draggingTarget: null,
  pointerId: null,
  dragStartPoint: null,
  dragStartPosition: null,
  zoomPercent: 100,
  zoomCenterX: scenario.worldWidthMm / 2,
  zoomCenterY: scenario.worldHeightMm / 2,
  guidesEnabled: false,
  guideColor: 'red',
};

const els = {
  scene: document.querySelector('#measurement-scene'),
  ruler: document.querySelector('#ruler-group'),
  object: document.querySelector('#object-group'),
  rulerTicks: document.querySelector('#ruler-ticks'),
  rulerLabels: document.querySelector('#ruler-labels'),
  guideGroup: document.querySelector('#guide-lines'),
  guideStartLine: document.querySelector('#guide-start-line'),
  guideEndLine: document.querySelector('#guide-end-line'),
  guideToggle: document.querySelector('#guide-toggle'),
  guideColor: document.querySelector('#guide-color'),
  zoomOut: document.querySelector('#zoom-out'),
  zoomIn: document.querySelector('#zoom-in'),
  zoomReset: document.querySelector('#zoom-reset'),
  zoomLabel: document.querySelector('#zoom-label'),
  taskCard: document.querySelector('#task-card'),
  fullscreenToggle: document.querySelector('#fullscreen-toggle'),
  fullscreenLabel: document.querySelector('#fullscreen-label'),
  answer: document.querySelector('#answer-value'),
  unit: document.querySelector('#answer-unit'),
  check: document.querySelector('#check-answer'),
  feedback: document.querySelector('#feedback'),
  feedbackTitle: document.querySelector('#feedback-title'),
  feedbackText: document.querySelector('#feedback-text'),
  placementStatus: document.querySelector('#placement-status'),
  attemptsStatus: document.querySelector('#attempts-status'),
  resetProgress: document.querySelector('#reset-progress'),
  resetScene: document.querySelector('#reset-scene'),
  version: document.querySelector('#version'),
  accessibleState: document.querySelector('#accessible-state'),
  selectRuler: document.querySelector('#select-ruler'),
  selectObject: document.querySelector('#select-object'),
  activeTargetLabel: document.querySelector('#active-target-label'),
  nudgeButtons: Array.from(document.querySelectorAll('[data-nudge-x], [data-nudge-y]')),
};

els.version.textContent = `v${VERSION}`;

function renderRulerScale() {
  const ns = 'http://www.w3.org/2000/svg';
  els.rulerTicks.textContent = '';
  els.rulerLabels.textContent = '';
  for (let mm = 0; mm <= scenario.rulerLengthMm; mm += 1) {
    const line = document.createElementNS(ns, 'line');
    const major = mm % 10 === 0;
    const mid = mm % 5 === 0;
    line.setAttribute('x1', String(mm));
    line.setAttribute('x2', String(mm));
    line.setAttribute('y1', '0');
    line.setAttribute('y2', major ? '12' : mid ? '8' : '5');
    line.setAttribute('class', major ? 'tick tick-major' : 'tick');
    els.rulerTicks.append(line);

    if (major && mm < scenario.rulerLengthMm) {
      const text = document.createElementNS(ns, 'text');
      text.setAttribute('x', String(mm + 0.8));
      text.setAttribute('y', '23');
      text.setAttribute('class', 'ruler-label');
      text.textContent = String(mm / 10);
      els.rulerLabels.append(text);
    }
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roundTenth(value) {
  return Math.round(value * 10) / 10;
}

function clampPosition(target, x, y) {
  if (target === 'object') {
    return {
      x: roundTenth(clamp(x, bounds.objectXMin, bounds.objectXMax)),
      y: roundTenth(clamp(y, bounds.objectYMin, bounds.objectYMax)),
    };
  }
  return {
    x: roundTenth(clamp(x, bounds.rulerXMin, bounds.rulerXMax)),
    y: roundTenth(clamp(y, bounds.rulerYMin, bounds.rulerYMax)),
  };
}

function setPosition(target, x, y) {
  if (!target) return;
  const next = clampPosition(target, x, y);
  if (target === 'object') {
    state.objectX = next.x;
    state.objectY = next.y;
  } else {
    state.rulerX = next.x;
    state.rulerY = next.y;
  }
  renderPositions();
  updatePlacementStatus();
}

function renderPositions() {
  els.object.setAttribute('transform', `translate(${state.objectX} ${state.objectY})`);
  els.ruler.setAttribute('transform', `translate(${state.rulerX} ${state.rulerY})`);
  renderGuides();
}

function renderGuides() {
  const startX = state.objectX;
  const endX = state.objectX + scenario.objectLengthMm;
  const objectBottomY = state.objectY + scenario.objectHeightMm;
  const rulerScaleY = state.rulerY + GUIDE_RULER_OVERLAP_MM;
  const guideColor = GUIDE_COLORS[state.guideColor] || GUIDE_COLORS.red;

  els.guideGroup.classList.toggle('is-visible', state.guidesEnabled);
  els.guideGroup.style.setProperty('--guide-color', guideColor);
  els.guideStartLine.setAttribute('x1', String(startX));
  els.guideStartLine.setAttribute('x2', String(startX));
  els.guideStartLine.setAttribute('y1', String(objectBottomY));
  els.guideStartLine.setAttribute('y2', String(rulerScaleY));
  els.guideEndLine.setAttribute('x1', String(endX));
  els.guideEndLine.setAttribute('x2', String(endX));
  els.guideEndLine.setAttribute('y1', String(objectBottomY));
  els.guideEndLine.setAttribute('y2', String(rulerScaleY));
}

function setNudgeEnabled(enabled) {
  els.nudgeButtons.forEach((button) => {
    button.disabled = !enabled;
  });
}

function clearActiveTarget() {
  state.activeTarget = null;
  els.selectRuler.setAttribute('aria-pressed', 'false');
  els.selectObject.setAttribute('aria-pressed', 'false');
  els.activeTargetLabel.textContent = 'Nen\u00ed vybr\u00e1n \u017e\u00e1dn\u00fd prvek';
  els.activeTargetLabel.dataset.active = 'none';
  setNudgeEnabled(false);
  updateAccessibleState();
}

function setActiveTarget(target, focus = false) {
  if (target !== 'ruler' && target !== 'object') {
    clearActiveTarget();
    return;
  }
  state.activeTarget = target;
  const rulerActive = target === 'ruler';
  els.selectRuler.setAttribute('aria-pressed', String(rulerActive));
  els.selectObject.setAttribute('aria-pressed', String(!rulerActive));
  els.activeTargetLabel.textContent = rulerActive
    ? 'Aktivn\u00ed: prav\u00edtko'
    : 'Aktivn\u00ed: pastelka';
  els.activeTargetLabel.dataset.active = target;
  setNudgeEnabled(true);
  updateAccessibleState();
  if (focus) (rulerActive ? els.ruler : els.object).focus({ preventScroll: true });
}

function targetCenter(target) {
  if (target === 'object') {
    return {
      x: state.objectX + scenario.objectLengthMm / 2,
      y: state.objectY + scenario.objectHeightMm / 2,
    };
  }
  if (target === 'ruler') {
    return {
      x: state.rulerX + scenario.rulerLengthMm / 2,
      y: state.rulerY + scenario.rulerHeightMm / 2,
    };
  }
  return { x: scenario.worldWidthMm / 2, y: scenario.worldHeightMm / 2 };
}

