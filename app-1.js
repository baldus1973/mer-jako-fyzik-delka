const { evaluateMeasurement, evaluatePlacement, parseDecimal } = globalThis.PhysicsLength;

const VERSION = '0.6.1';
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

const scenario = {
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
};

const OBJECT_CATALOG = Object.freeze([
  Object.freeze({ id: 'pencil', name: 'Pastelka', nameLower: 'pastelka', genitive: 'pastelky', minMm: 70, maxMm: 120, heightMm: 14 }),
  Object.freeze({ id: 'eraser', name: 'Guma', nameLower: 'guma', genitive: 'gumy', minMm: 40, maxMm: 70, heightMm: 18 }),
  Object.freeze({ id: 'paper', name: 'Prou\u017eek pap\u00edru', nameLower: 'prou\u017eek pap\u00edru', genitive: 'prou\u017eku pap\u00edru', minMm: 60, maxMm: 130, heightMm: 16 }),
  Object.freeze({ id: 'key', name: 'Kl\u00ed\u010d', nameLower: 'kl\u00ed\u010d', genitive: 'kl\u00ed\u010de', minMm: 45, maxMm: 80, heightMm: 16 }),
  Object.freeze({ id: 'screw', name: '\u0160roubek', nameLower: '\u0161roubek', genitive: '\u0161roubku', minMm: 30, maxMm: 60, heightMm: 14 }),
]);

function randomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createTask(previousId = null) {
  const choices = OBJECT_CATALOG.filter((item) => item.id !== previousId);
  const item = choices[randomIntInclusive(0, choices.length - 1)];
  return {
    ...item,
    lengthMm: randomIntInclusive(item.minMm, item.maxMm),
    initialObjectX: randomIntInclusive(24, 42),
    initialObjectY: randomIntInclusive(18, 28),
    initialRulerX: randomIntInclusive(8, 18),
    initialRulerY: randomIntInclusive(77, 84),
  };
}

function applyTaskToScenario(task) {
  scenario.objectLengthMm = task.lengthMm;
  scenario.objectHeightMm = task.heightMm;
  scenario.initialObjectX = task.initialObjectX;
  scenario.initialObjectY = task.initialObjectY;
  scenario.initialRulerX = task.initialRulerX;
  scenario.initialRulerY = task.initialRulerY;
}

const firstTask = createTask();
applyTaskToScenario(firstTask);

const bounds = Object.freeze({
  get objectXMin() { return 5; },
  get objectXMax() {
    return Math.max(5, Math.min(
      scenario.worldWidthMm - scenario.objectLengthMm - 5,
      scenario.worldWidthMm - scenario.rulerLengthMm,
    ));
  },
  get objectYMin() { return 5; },
  get objectYMax() {
    return scenario.worldHeightMm - scenario.objectHeightMm - scenario.rulerHeightMm - 6;
  },
  get rulerXMin() { return 5; },
  get rulerXMax() { return scenario.worldWidthMm - scenario.rulerLengthMm; },
  get rulerYMin() { return 5; },
  get rulerYMax() { return scenario.worldHeightMm - scenario.rulerHeightMm - 5; },
});

const state = {
  task: firstTask,
  taskNumber: 1,
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
  sceneTitle: document.querySelector('#scene-title'),
  sceneDesc: document.querySelector('#scene-desc'),
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
  taskStep: document.querySelector('#task-step'),
  taskTitle: document.querySelector('#task-title'),
  fullscreenToggle: document.querySelector('#fullscreen-toggle'),
  fullscreenLabel: document.querySelector('#fullscreen-label'),
  answerTitle: document.querySelector('#answer-title'),
  answer: document.querySelector('#answer-value'),
  unit: document.querySelector('#answer-unit'),
  check: document.querySelector('#check-answer'),
  nextTask: document.querySelector('#next-task'),
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

function svgEl(name, attrs = {}) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', name);
  Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, String(value)));
  return element;
}

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

function renderObject() {
  const task = state.task;
  const length = scenario.objectLengthMm;
  const height = scenario.objectHeightMm;
  els.object.textContent = '';
  els.object.setAttribute('aria-label', `Pohybliv\u00fd p\u0159edm\u011bt: ${task.nameLower}`);
  els.object.append(svgEl('rect', {
    class: 'hitbox', x: -4, y: -5, width: length + 8, height: height + 10, rx: 5,
  }));

  if (task.id === 'pencil') {
    const tip = Math.min(10, Math.max(7, length * 0.14));
    const body = length - tip;
    els.object.append(
      svgEl('rect', { x: 0, y: 0, width: body, height, rx: 3, fill: '#ff9e45', stroke: 'currentColor', 'stroke-width': 0.8 }),
      svgEl('rect', { x: 0, y: 0, width: Math.min(7, body * 0.15), height, rx: 2.5, fill: '#f48fb1', stroke: 'currentColor', 'stroke-width': 0.8 }),
      svgEl('polygon', { points: `${body},0 ${length},${height / 2} ${body},${height}`, fill: '#e8c39e', stroke: 'currentColor', 'stroke-width': 0.8 }),
      svgEl('polygon', { points: `${length - 2.8},${height / 2 - 1.4} ${length},${height / 2} ${length - 2.8},${height / 2 + 1.4}`, fill: '#30343b' }),
    );
  } else if (task.id === 'eraser') {
    els.object.append(
      svgEl('rect', { x: 0, y: 0, width: length, height, rx: 4, fill: '#ef8aa5', stroke: 'currentColor', 'stroke-width': 0.8 }),
      svgEl('line', { x1: length * 0.38, x2: length * 0.38, y1: 1.5, y2: height - 1.5, stroke: '#ffffff', 'stroke-width': 1.2 }),
    );
  } else if (task.id === 'paper') {
    els.object.append(
      svgEl('rect', { x: 0, y: 0, width: length, height, rx: 1.5, fill: '#fffdf5', stroke: 'currentColor', 'stroke-width': 0.8 }),
      svgEl('line', { x1: 5, x2: length - 5, y1: height * 0.45, y2: height * 0.45, stroke: '#97a4b5', 'stroke-width': 0.55 }),
      svgEl('line', { x1: 5, x2: length * 0.7, y1: height * 0.68, y2: height * 0.68, stroke: '#97a4b5', 'stroke-width': 0.55 }),
    );
  } else if (task.id === 'key') {
    const cy = height / 2;
    els.object.append(
      svgEl('circle', { cx: height / 2, cy, r: height / 2 - 0.6, fill: '#d9dee6', stroke: 'currentColor', 'stroke-width': 0.8 }),
      svgEl('circle', { cx: height / 2, cy, r: 3, fill: '#fbfcfe', stroke: 'currentColor', 'stroke-width': 0.7 }),
      svgEl('rect', { x: height - 2, y: cy - 2.6, width: Math.max(4, length - height + 2), height: 5.2, rx: 1.2, fill: '#d9dee6', stroke: 'currentColor', 'stroke-width': 0.8 }),
      svgEl('path', { d: `M${length - 14} ${cy + 2.6}v4h5v-4h4v3h5`, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.1 }),
    );
  } else {
    const cy = height / 2;
    els.object.append(
      svgEl('rect', { x: 0, y: 1, width: 12, height: height - 2, rx: 2, fill: '#cfd5df', stroke: 'currentColor', 'stroke-width': 0.8 }),
      svgEl('line', { x1: 2, x2: 10, y1: cy, y2: cy, stroke: 'currentColor', 'stroke-width': 1 }),
      svgEl('rect', { x: 12, y: cy - 2.2, width: Math.max(2, length - 12), height: 4.4, rx: 1, fill: '#d9dee6', stroke: 'currentColor', 'stroke-width': 0.7 }),
    );
    for (let x = 16; x < length - 1; x += 4) {
      els.object.append(svgEl('line', {
        x1: x, x2: Math.min(x + 2.5, length), y1: cy - 2.5, y2: cy + 2.5, stroke: '#6d7581', 'stroke-width': 0.65,
      }));
    }
  }
}

function renderTaskText() {
  const task = state.task;
  els.taskStep.textContent = `Mise ${state.taskNumber} \u00b7 P\u0159ilo\u017e a zm\u011b\u0159`;
  els.taskTitle.textContent = `Zm\u011b\u0159 d\u00e9lku ${task.genitive}.`;
  els.answerTitle.textContent = `Zapi\u0161 nam\u011b\u0159enou d\u00e9lku ${task.genitive}`;
  els.selectObject.textContent = task.name;
  els.sceneTitle.textContent = `Virtu\u00e1ln\u00ed m\u011b\u0159en\u00ed: ${task.nameLower}`;
  els.sceneDesc.textContent = `${task.name} i prav\u00edtko lze p\u0159esouvat vodorovn\u011b i svisle.`;
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
    : `Aktivn\u00ed: ${state.task.nameLower}`;
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
