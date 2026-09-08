'use strict';

const { evaluateMeasurement, evaluatePlacement, parseDecimal, toMillimetres } = globalThis.PhysicsLength;

const VERSION = '0.6.0';
const STORAGE_KEY = 'mer-jako-fyzik-delka-progress-v1';
const WORLD_WIDTH_MM = 200;
const WORLD_HEIGHT_MM = 125;
const RULER_LENGTH_MM = 150;
const RULER_HEIGHT_MM = 28;
const TARGET_GAP_MM = 1.5;
const MIN_ZOOM = 100;
const MAX_ZOOM = 200;
const ZOOM_STEP = 25;
const GUIDE_OBJECT_OVERLAP_MM = 3;
const GUIDE_RULER_OVERLAP_MM = 13;
const GUIDE_COLORS = Object.freeze({ red: '#c62828', blue: '#2457d6', green: '#18794e', black: '#20242c' });
const GUIDE_COLOR_NAMES = Object.freeze({ red: 'červená', blue: 'modrá', green: 'zelená', black: 'černá' });

const OBJECT_CATALOG = Object.freeze([
  Object.freeze({ id: 'pencil', name: 'Pastelka', nameLower: 'pastelka', genitive: 'pastelky', minMm: 70, maxMm: 120, heightMm: 14 }),
  Object.freeze({ id: 'eraser', name: 'Guma', nameLower: 'guma', genitive: 'gumy', minMm: 40, maxMm: 70, heightMm: 18 }),
  Object.freeze({ id: 'paper', name: 'Proužek papíru', nameLower: 'proužek papíru', genitive: 'proužku papíru', minMm: 60, maxMm: 130, heightMm: 16 }),
  Object.freeze({ id: 'key', name: 'Klíč', nameLower: 'klíč', genitive: 'klíče', minMm: 45, maxMm: 80, heightMm: 16 }),
  Object.freeze({ id: 'screw', name: 'Šroubek', nameLower: 'šroubek', genitive: 'šroubku', minMm: 30, maxMm: 60, heightMm: 14 }),
]);

function randomIntInclusive(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function createTask(previousId = null) {
  const choices = OBJECT_CATALOG.filter((item) => item.id !== previousId);
  const item = choices[randomIntInclusive(0, choices.length - 1)];
  return { ...item, lengthMm: randomIntInclusive(item.minMm, item.maxMm), initialObjectX: randomIntInclusive(24, 42), initialObjectY: randomIntInclusive(18, 28), initialRulerX: randomIntInclusive(8, 18), initialRulerY: randomIntInclusive(77, 84) };
}

const state = {
  task: createTask(), taskNumber: 1, phase: 'estimate', estimateMm: null, estimateDisplay: '',
  objectX: 0, objectY: 0, rulerX: 0, rulerY: 0, activeTarget: null, draggingTarget: null,
  pointerId: null, dragStartPoint: null, dragStartPosition: null, zoomPercent: 100,
  zoomCenterX: WORLD_WIDTH_MM / 2, zoomCenterY: WORLD_HEIGHT_MM / 2, guidesEnabled: false, guideColor: 'red',
};

const els = {
  scene: document.querySelector('#measurement-scene'), sceneTitle: document.querySelector('#scene-title'), sceneDesc: document.querySelector('#scene-desc'),
  ruler: document.querySelector('#ruler-group'), object: document.querySelector('#object-group'), rulerTicks: document.querySelector('#ruler-ticks'), rulerLabels: document.querySelector('#ruler-labels'),
  guideGroup: document.querySelector('#guide-lines'), guideStartLine: document.querySelector('#guide-start-line'), guideEndLine: document.querySelector('#guide-end-line'), guideToggle: document.querySelector('#guide-toggle'), guideColor: document.querySelector('#guide-color'),
  zoomOut: document.querySelector('#zoom-out'), zoomIn: document.querySelector('#zoom-in'), zoomReset: document.querySelector('#zoom-reset'), zoomLabel: document.querySelector('#zoom-label'),
  taskCard: document.querySelector('#task-card'), taskStep: document.querySelector('#task-step'), taskTitle: document.querySelector('#task-title'), fullscreenToggle: document.querySelector('#fullscreen-toggle'), fullscreenLabel: document.querySelector('#fullscreen-label'),
  estimatePanel: document.querySelector('#estimate-panel'), estimateValue: document.querySelector('#estimate-value'), estimateUnit: document.querySelector('#estimate-unit'), saveEstimate: document.querySelector('#save-estimate'), estimateMessage: document.querySelector('#estimate-message'), estimateSummary: document.querySelector('#estimate-summary'),
  measurementPanel: document.querySelector('#measurement-panel'), answerTitle: document.querySelector('#answer-title'), answer: document.querySelector('#answer-value'), unit: document.querySelector('#answer-unit'), check: document.querySelector('#check-answer'), nextTask: document.querySelector('#next-task'),
  feedback: document.querySelector('#feedback'), feedbackTitle: document.querySelector('#feedback-title'), feedbackText: document.querySelector('#feedback-text'), placementStatus: document.querySelector('#placement-status'), attemptsStatus: document.querySelector('#attempts-status'), resetProgress: document.querySelector('#reset-progress'), resetScene: document.querySelector('#reset-scene'),
  version: document.querySelector('#version'), accessibleState: document.querySelector('#accessible-state'), selectRuler: document.querySelector('#select-ruler'), selectObject: document.querySelector('#select-object'), activeTargetLabel: document.querySelector('#active-target-label'), nudgeButtons: Array.from(document.querySelectorAll('[data-nudge-x], [data-nudge-y]')),
};
els.version.textContent = `v${VERSION}`;

function svgEl(name, attrs = {}) { const el = document.createElementNS('http://www.w3.org/2000/svg', name); Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, String(value))); return el; }
function renderRulerScale() {
  els.rulerTicks.textContent = ''; els.rulerLabels.textContent = '';
  for (let mm = 0; mm <= RULER_LENGTH_MM; mm += 1) {
    const major = mm % 10 === 0; const mid = mm % 5 === 0;
    els.rulerTicks.append(svgEl('line', { x1: mm, x2: mm, y1: 0, y2: major ? 12 : mid ? 8 : 5, class: major ? 'tick tick-major' : 'tick' }));
    if (major && mm < RULER_LENGTH_MM) { const text = svgEl('text', { x: mm + 0.8, y: 23, class: 'ruler-label' }); text.textContent = String(mm / 10); els.rulerLabels.append(text); }
  }
}
function renderObject() {
  const task = state.task; const L = task.lengthMm; const H = task.heightMm; els.object.textContent = ''; els.object.setAttribute('aria-label', `Pohyblivý předmět: ${task.nameLower}`);
  els.object.append(svgEl('rect', { class: 'hitbox', x: -4, y: -5, width: L + 8, height: H + 10, rx: 5 }));
  if (task.id === 'pencil') {
    const tip = Math.min(10, Math.max(7, L * 0.14)); const body = L - tip;
    els.object.append(svgEl('rect', { class: 'object-shape', x: 0, y: 0, width: body, height: H, rx: 3, fill: '#ff9e45', stroke: '#30343b', 'stroke-width': 0.8 }), svgEl('rect', { class: 'object-shape', x: 0, y: 0, width: Math.min(7, body * 0.15), height: H, rx: 2.5, fill: '#f48fb1', stroke: '#30343b', 'stroke-width': 0.8 }), svgEl('polygon', { class: 'object-shape', points: `${body},0 ${L},${H / 2} ${body},${H}`, fill: '#e8c39e', stroke: '#30343b', 'stroke-width': 0.8 }), svgEl('polygon', { class: 'object-shape', points: `${L - 2.8},${H / 2 - 1.4} ${L},${H / 2} ${L - 2.8},${H / 2 + 1.4}`, fill: '#30343b' }));
  } else if (task.id === 'eraser') {
    els.object.append(svgEl('rect', { class: 'object-shape', x: 0, y: 0, width: L, height: H, rx: 4, fill: '#ef8aa5', stroke: '#30343b', 'stroke-width': 0.8 }), svgEl('line', { class: 'object-detail', x1: L * 0.38, x2: L * 0.38, y1: 1.5, y2: H - 1.5, stroke: '#ffffff', 'stroke-width': 1.2 }));
  } else if (task.id === 'paper') {
    els.object.append(svgEl('rect', { class: 'object-shape', x: 0, y: 0, width: L, height: H, rx: 1.5, fill: '#fffdf5', stroke: '#30343b', 'stroke-width': 0.8 }), svgEl('line', { class: 'object-detail', x1: 5, x2: L - 5, y1: H * 0.45, y2: H * 0.45, stroke: '#97a4b5', 'stroke-width': 0.55 }), svgEl('line', { class: 'object-detail', x1: 5, x2: L * 0.7, y1: H * 0.68, y2: H * 0.68, stroke: '#97a4b5', 'stroke-width': 0.55 }));
  } else if (task.id === 'key') {
    const cy = H / 2;
    els.object.append(svgEl('circle', { class: 'object-shape', cx: H / 2, cy, r: H / 2 - 0.6, fill: '#d9dee6', stroke: '#30343b', 'stroke-width': 0.8 }), svgEl('circle', { class: 'object-shape', cx: H / 2, cy, r: 3, fill: '#fbfcfe', stroke: '#30343b', 'stroke-width': 0.7 }), svgEl('rect', { class: 'object-shape', x: H - 2, y: cy - 2.6, width: Math.max(4, L - H + 2), height: 5.2, rx: 1.2, fill: '#d9dee6', stroke: '#30343b', 'stroke-width': 0.8 }), svgEl('path', { class: 'object-detail', d: `M${L - 14} ${cy + 2.6}v4h5v-4h4v3h5`, fill: 'none', stroke: '#30343b', 'stroke-width': 1.1 }));
  } else {
    const cy = H / 2;
    els.object.append(svgEl('rect', { class: 'object-shape', x: 0, y: 1, width: 12, height: H - 2, rx: 2, fill: '#cfd5df', stroke: '#30343b', 'stroke-width': 0.8 }), svgEl('line', { class: 'object-detail', x1: 2, x2: 10, y1: cy, y2: cy, stroke: '#30343b', 'stroke-width': 1 }), svgEl('rect', { class: 'object-shape', x: 12, y: cy - 2.2, width: Math.max(2, L - 12), height: 4.4, rx: 1, fill: '#d9dee6', stroke: '#30343b', 'stroke-width': 0.7 }));
    for (let x = 16; x < L - 1; x += 4) els.object.append(svgEl('line', { class: 'object-detail', x1: x, x2: Math.min(x + 2.5, L), y1: cy - 2.5, y2: cy + 2.5, stroke: '#6d7581', 'stroke-width': 0.65 }));
  }
}
function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function roundTenth(value) { return Math.round(value * 10) / 10; }
function objectXMax() { return Math.max(5, Math.min(WORLD_WIDTH_MM - state.task.lengthMm - 5, WORLD_WIDTH_MM - RULER_LENGTH_MM)); }
function clampPosition(target, x, y) {
  if (target === 'object') return { x: roundTenth(clamp(x, 5, objectXMax())), y: roundTenth(clamp(y, 5, WORLD_HEIGHT_MM - state.task.heightMm - RULER_HEIGHT_MM - 8)) };
  return { x: roundTenth(clamp(x, 5, WORLD_WIDTH_MM - RULER_LENGTH_MM)), y: roundTenth(clamp(y, 5, WORLD_HEIGHT_MM - RULER_HEIGHT_MM - 5)) };
}
function setPosition(target, x, y) { if (!target || state.phase === 'estimate') return; const next = clampPosition(target, x, y); if (target === 'object') { state.objectX = next.x; state.objectY = next.y; } else { state.rulerX = next.x; state.rulerY = next.y; } renderPositions(); updatePlacementStatus(); }
function renderPositions() { els.object.setAttribute('transform', `translate(${state.objectX} ${state.objectY})`); els.ruler.setAttribute('transform', `translate(${state.rulerX} ${state.rulerY})`); renderGuides(); }
function renderGuides() {
  const startX = state.objectX; const endX = state.objectX + state.task.lengthMm; const guideTopY = state.objectY - GUIDE_OBJECT_OVERLAP_MM; const rulerScaleY = state.rulerY + GUIDE_RULER_OVERLAP_MM; const guideColor = GUIDE_COLORS[state.guideColor] || GUIDE_COLORS.red; const visible = state.guidesEnabled && state.phase !== 'estimate';
  els.guideGroup.classList.toggle('is-visible', visible); els.guideGroup.style.setProperty('--guide-color', guideColor);
  for (const [line, x] of [[els.guideStartLine, startX], [els.guideEndLine, endX]]) { line.setAttribute('x1', String(x)); line.setAttribute('x2', String(x)); line.setAttribute('y1', String(guideTopY)); line.setAttribute('y2', String(rulerScaleY)); }
}
function setNudgeEnabled(enabled) { els.nudgeButtons.forEach((button) => { button.disabled = !enabled; }); }
function clearActiveTarget() { state.activeTarget = null; els.selectRuler.setAttribute('aria-pressed', 'false'); els.selectObject.setAttribute('aria-pressed', 'false'); els.activeTargetLabel.textContent = 'Není vybrán žádný prvek'; els.activeTargetLabel.dataset.active = 'none'; setNudgeEnabled(false); updateAccessibleState(); }
function setActiveTarget(target, focus = false) { if (state.phase === 'estimate') return; if (target !== 'ruler' && target !== 'object') { clearActiveTarget(); return; } state.activeTarget = target; const rulerActive = target === 'ruler'; els.selectRuler.setAttribute('aria-pressed', String(rulerActive)); els.selectObject.setAttribute('aria-pressed', String(!rulerActive)); els.activeTargetLabel.textContent = rulerActive ? 'Aktivní: pravítko' : `Aktivní: ${state.task.nameLower}`; els.activeTargetLabel.dataset.active = target; setNudgeEnabled(true); updateAccessibleState(); if (focus) (rulerActive ? els.ruler : els.object).focus({ preventScroll: true }); }
function targetCenter(target) { if (target === 'object') return { x: state.objectX + state.task.lengthMm / 2, y: state.objectY + state.task.heightMm / 2 }; if (target === 'ruler') return { x: state.rulerX + RULER_LENGTH_MM / 2, y: state.rulerY + RULER_HEIGHT_MM / 2 }; return { x: WORLD_WIDTH_MM / 2, y: WORLD_HEIGHT_MM / 2 }; }
function renderZoom() { const factor = state.zoomPercent / 100; const viewWidth = WORLD_WIDTH_MM / factor; const viewHeight = WORLD_HEIGHT_MM / factor; const halfW = viewWidth / 2; const halfH = viewHeight / 2; const centerX = clamp(state.zoomCenterX, halfW, WORLD_WIDTH_MM - halfW); const centerY = clamp(state.zoomCenterY, halfH, WORLD_HEIGHT_MM - halfH); state.zoomCenterX = centerX; state.zoomCenterY = centerY; els.scene.setAttribute('viewBox', `${roundTenth(centerX - halfW)} ${roundTenth(centerY - halfH)} ${roundTenth(viewWidth)} ${roundTenth(viewHeight)}`); els.zoomLabel.textContent = `${state.zoomPercent} %`; els.zoomOut.disabled = state.zoomPercent <= MIN_ZOOM; els.zoomIn.disabled = state.zoomPercent >= MAX_ZOOM; }
function setZoom(nextPercent, recenter = true) { state.zoomPercent = clamp(nextPercent, MIN_ZOOM, MAX_ZOOM); if (recenter) { const focus = targetCenter(state.activeTarget); state.zoomCenterX = focus.x; state.zoomCenterY = focus.y; } renderZoom(); updateAccessibleState(); }
function resetZoom() { state.zoomCenterX = WORLD_WIDTH_MM / 2; state.zoomCenterY = WORLD_HEIGHT_MM / 2; setZoom(100, false); }
function workspaceIsMaximized() { return els.taskCard.classList.contains('is-workspace-maximized') || document.fullscreenElement === els.taskCard; }
function renderWorkspaceMode() { const active = workspaceIsMaximized(); els.fullscreenToggle.setAttribute('aria-pressed', String(active)); els.fullscreenLabel.textContent = active ? 'Ukončit celou obrazovku' : 'Celá pracovní plocha'; document.body.classList.toggle('workspace-maximized', active); }
async function enterWorkspaceMode() { els.taskCard.classList.add('is-workspace-maximized'); renderWorkspaceMode(); if (els.taskCard.requestFullscreen && document.fullscreenEnabled && !document.fullscreenElement) { try { await els.taskCard.requestFullscreen(); } catch {} } renderWorkspaceMode(); }
async function exitWorkspaceMode() { els.taskCard.classList.remove('is-workspace-maximized'); if (document.fullscreenElement === els.taskCard && document.exitFullscreen) { try { await document.exitFullscreen(); } catch {} } renderWorkspaceMode(); }
async function toggleWorkspaceMode() { if (workspaceIsMaximized()) await exitWorkspaceMode(); else await enterWorkspaceMode(); }
function currentPlacement() { return evaluatePlacement({ objectStartMm: state.objectX, objectTopMm: state.objectY, objectHeightMm: state.task.heightMm, rulerZeroMm: state.rulerX, rulerTopMm: state.rulerY, targetGapMm: TARGET_GAP_MM }); }
function placementText() { if (state.phase === 'estimate') return 'Nejdřív odhadni délku. Pravítko se zobrazí potom.'; const placement = currentPlacement(); if (!placement.edgeContact) return placement.actualGapMm > TARGET_GAP_MM ? 'Přisuň pravítko blíž k předmětu: posuň ho nahoru.' : 'Pravítko je příliš vysoko. Posuň ho trochu dolů k hraně předmětu.'; if (!placement.zeroAligned) return state.rulerX < state.objectX ? 'Pravítko je u předmětu. Posuň jeho nulu doprava k levému konci.' : 'Pravítko je u předmětu. Posuň jeho nulu doleva k levému konci.'; return 'Pravítko je správně přiložené a nula je u levého konce předmětu.'; }
function updateAccessibleState() { const activeText = state.activeTarget === 'ruler' ? 'Aktivní prvek je pravítko.' : state.activeTarget === 'object' ? `Aktivní prvek je ${state.task.nameLower}.` : 'Není vybrán žádný prvek.'; const guideColorName = GUIDE_COLOR_NAMES[state.guideColor] || GUIDE_COLOR_NAMES.red; const guidesText = state.guidesEnabled && state.phase !== 'estimate' ? `Pomocné čáry jsou zapnuté, barva ${guideColorName}.` : 'Pomocné čáry nejsou zobrazené.'; const phaseText = state.phase === 'estimate' ? 'Fáze odhadu.' : 'Fáze měření.'; els.accessibleState.textContent = `${phaseText} ${activeText} ${placementText()} Zoom ${state.zoomPercent} procent. ${guidesText}`; }
function updatePlacementStatus() { els.placementStatus.textContent = placementText(); updateAccessibleState(); }
function clientToSvg(event) { const point = els.scene.createSVGPoint(); point.x = event.clientX; point.y = event.clientY; const ctm = els.scene.getScreenCTM(); if (!ctm) return { x: 0, y: 0 }; const transformed = point.matrixTransform(ctm.inverse()); return { x: transformed.x, y: transformed.y }; }
function getPosition(target) { return target === 'object' ? { x: state.objectX, y: state.objectY } : { x: state.rulerX, y: state.rulerY }; }
function pointerDown(target, event) { if (state.phase === 'estimate') return; if (event.button !== undefined && event.button !== 0) return; setActiveTarget(target); state.draggingTarget = target; state.pointerId = event.pointerId; state.dragStartPoint = clientToSvg(event); state.dragStartPosition = getPosition(target); event.currentTarget.setPointerCapture?.(event.pointerId); event.preventDefault(); }
function pointerMove(event) { if (!state.draggingTarget || event.pointerId !== state.pointerId) return; const point = clientToSvg(event); setPosition(state.draggingTarget, state.dragStartPosition.x + point.x - state.dragStartPoint.x, state.dragStartPosition.y + point.y - state.dragStartPoint.y); }
function pointerUp(event) { if (event.pointerId !== state.pointerId) return; state.draggingTarget = null; state.pointerId = null; state.dragStartPoint = null; state.dragStartPosition = null; }
function moveTarget(target, dx, dy) { if (!target || state.phase === 'estimate') return; const pos = getPosition(target); setPosition(target, pos.x + dx, pos.y + dy); }
function onMovableKeydown(target, event) { if (event.key === 'Escape') { clearActiveTarget(); event.preventDefault(); return; } if (state.phase === 'estimate') return; const step = event.shiftKey ? 0.5 : 1; let dx = 0; let dy = 0; if (event.key === 'ArrowLeft') dx = -step; else if (event.key === 'ArrowRight') dx = step; else if (event.key === 'ArrowUp') dy = -step; else if (event.key === 'ArrowDown') dy = step; else return; setActiveTarget(target); moveTarget(target, dx, dy); event.preventDefault(); }
function loadProgress() { try { const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); return { attempts: Number.isInteger(data.attempts) ? data.attempts : 0, successes: Number.isInteger(data.successes) ? data.successes : 0, errors: data.errors && typeof data.errors === 'object' ? data.errors : {} }; } catch { return { attempts: 0, successes: 0, errors: {} }; } }
function saveProgress(progress) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch {} }
function showProgress() { const p = loadProgress(); els.attemptsStatus.textContent = `Pokusy: ${p.attempts} · správně: ${p.successes}`; }
function recordResult(result) { const p = loadProgress(); p.attempts += 1; if (result.correct) p.successes += 1; else p.errors[result.code] = (p.errors[result.code] || 0) + 1; saveProgress(p); showProgress(); }
function formatCm(mm) { const value = Math.round(mm * 10) / 100; return String(value).replace('.', ','); }
function estimateComparisonText() { if (!Number.isFinite(state.estimateMm)) return ''; const difference = Math.abs(state.estimateMm - state.task.lengthMm); if (difference <= 5) return `Velmi dobrý odhad – lišil se jen o ${difference} mm.`; if (difference <= 10) return `Dobrý odhad – rozdíl je ${difference} mm.`; return `Odhad se od měření lišil o ${difference} mm. Příště zkus velikost porovnat s 1 cm na pravítku.`; }
function feedbackFor(result, rawValue, unit) { const name = state.task.name; if (result.correct) return { kind: 'success', title: 'Správně změřeno.', text: `${name} má délku ${state.task.lengthMm} mm, tedy ${formatCm(state.task.lengthMm)} cm. ${estimateComparisonText()}` }; if (result.code === 'placement.edge_contact') return { kind: 'hint', title: 'Nejdřív pravítko opravdu přilož.', text: 'Posuň pravítko nahoru nebo dolů tak, aby jeho horní hrana těsně sousedila se spodní hranou předmětu. Potom srovnej nulu.' }; if (result.code === 'placement.zero_alignment') return { kind: 'hint', title: 'Teď srovnej nulu pravítka.', text: 'Posuň pravítko doleva nebo doprava tak, aby značka 0 byla u levého konce předmětu.' }; if (result.code === 'answer.invalid') return { kind: 'error', title: 'Chybí číselná hodnota.', text: 'Zapiš číslo a potom zvol jednotku.' }; if (result.code === 'unit.scale_factor') return { kind: 'error', title: 'Pozor na jednotku a desetinnou čárku.', text: 'Jeden centimetr je 10 milimetrů. Zkontroluj, zda jsi správně spojil číselnou hodnotu s jednotkou.' }; const value = Number.isFinite(rawValue) ? String(rawValue).replace('.', ',') : 'zadaná hodnota'; return { kind: 'error', title: 'Zkus znovu odečíst stupnici.', text: `${value} ${unit} neodpovídá délce předmětu. Nejmenší dílek pravítka je 1 mm.` }; }
function showFeedback(payload) { els.feedback.dataset.kind = payload.kind; els.feedback.hidden = false; els.feedbackTitle.textContent = payload.title; els.feedbackText.textContent = payload.text; els.feedback.focus({ preventScroll: false }); }
function saveEstimate() { const raw = parseDecimal(els.estimateValue.value); const unit = els.estimateUnit.value; const estimateMm = toMillimetres(raw, unit); if (!Number.isFinite(estimateMm) || estimateMm <= 0) { els.estimateMessage.textContent = 'Zapiš kladný odhad a vyber jednotku.'; els.estimateValue.focus(); return; } state.estimateMm = estimateMm; state.estimateDisplay = `${String(raw).replace('.', ',')} ${unit}`; state.phase = 'measure'; els.estimateMessage.textContent = ''; renderPhase(); els.taskTitle.focus({ preventScroll: true }); }
function checkAnswer() { if (state.phase === 'estimate') return; const answerValue = parseDecimal(els.answer.value); const answerUnit = els.unit.value; const result = evaluateMeasurement({ objectStartMm: state.objectX, objectEndMm: state.objectX + state.task.lengthMm, objectTopMm: state.objectY, objectHeightMm: state.task.heightMm, rulerZeroMm: state.rulerX, rulerTopMm: state.rulerY, answerValue, answerUnit, targetGapMm: TARGET_GAP_MM }); recordResult(result); showFeedback(feedbackFor(result, answerValue, answerUnit)); if (result.correct) { state.phase = 'complete'; els.check.disabled = true; els.nextTask.hidden = false; updateAccessibleState(); } }
function resetScene() { state.objectX = state.task.initialObjectX; state.objectY = state.task.initialObjectY; state.rulerX = state.task.initialRulerX; state.rulerY = state.task.initialRulerY; clearActiveTarget(); renderPositions(); updatePlacementStatus(); els.answer.value = ''; els.check.disabled = false; els.feedback.hidden = true; els.nextTask.hidden = true; if (state.phase === 'complete') state.phase = 'measure'; }
function resetProgress() { try { localStorage.removeItem(STORAGE_KEY); } catch {} showProgress(); showFeedback({ kind: 'hint', title: 'Místní pokrok byl smazán.', text: 'Aplikace neukládá jméno ani účet. Nové pokusy začínají od nuly.' }); }
function renderTaskText() { const task = state.task; els.taskStep.textContent = `Mise ${state.taskNumber} · Odhadni a změř`; els.taskTitle.textContent = state.phase === 'estimate' ? `Odhadni délku ${task.genitive}.` : `Změř délku ${task.genitive}.`; els.answerTitle.textContent = `Zapiš naměřenou délku ${task.genitive}`; els.selectObject.textContent = task.name; els.sceneTitle.textContent = `Virtuální měření: ${task.nameLower}`; els.sceneDesc.textContent = state.phase === 'estimate' ? `Nejdřív odhadni délku předmětu ${task.nameLower}. Pravítko je zatím skryté.` : `${task.name} i pravítko lze přesouvat vodorovně i svisle. Zarovnej nulu pravítka s levým koncem předmětu.`; }
function renderPhase() { const estimating = state.phase === 'estimate'; els.taskCard.classList.toggle('is-estimating', estimating); els.scene.classList.toggle('is-estimating', estimating); els.estimatePanel.hidden = !estimating; els.measurementPanel.hidden = estimating; els.estimateSummary.hidden = !Number.isFinite(state.estimateMm) || estimating; if (!els.estimateSummary.hidden) els.estimateSummary.textContent = `Tvůj odhad: ${state.estimateDisplay}. Teď ho ověř měřením.`; els.ruler.setAttribute('tabindex', estimating ? '-1' : '0'); els.object.setAttribute('tabindex', estimating ? '-1' : '0'); if (estimating) clearActiveTarget(); renderTaskText(); renderGuides(); updatePlacementStatus(); }
function startNewTask() { const previousId = state.task?.id || null; state.task = createTask(previousId); state.taskNumber += 1; state.phase = 'estimate'; state.estimateMm = null; state.estimateDisplay = ''; state.objectX = state.task.initialObjectX; state.objectY = state.task.initialObjectY; state.rulerX = state.task.initialRulerX; state.rulerY = state.task.initialRulerY; state.zoomPercent = 100; state.zoomCenterX = WORLD_WIDTH_MM / 2; state.zoomCenterY = WORLD_HEIGHT_MM / 2; els.estimateValue.value = ''; els.answer.value = ''; els.check.disabled = false; els.feedback.hidden = true; els.nextTask.hidden = true; renderObject(); renderPositions(); renderZoom(); renderPhase(); els.estimateValue.focus({ preventScroll: true }); }
function bindMovable(element, target) { element.addEventListener('pointerdown', (event) => pointerDown(target, event)); element.addEventListener('pointermove', pointerMove); element.addEventListener('pointerup', pointerUp); element.addEventListener('pointercancel', pointerUp); element.addEventListener('keydown', (event) => onMovableKeydown(target, event)); element.addEventListener('focus', () => setActiveTarget(target)); }
function initialize() { state.objectX = state.task.initialObjectX; state.objectY = state.task.initialObjectY; state.rulerX = state.task.initialRulerX; state.rulerY = state.task.initialRulerY; renderRulerScale(); renderObject(); renderPositions(); renderZoom(); renderPhase(); showProgress(); renderWorkspaceMode(); bindMovable(els.ruler, 'ruler'); bindMovable(els.object, 'object'); }
initialize();
document.addEventListener('pointerdown', (event) => { const target = event.target instanceof Element ? event.target : null; if (!target) return; if (target.closest('.movable, #select-ruler, #select-object, .nudge-grid, .scene-tools, .answer-card')) return; clearActiveTarget(); });
document.addEventListener('keydown', (event) => { if (event.key !== 'Escape') return; if (els.taskCard.classList.contains('is-workspace-maximized') && !document.fullscreenElement) { els.taskCard.classList.remove('is-workspace-maximized'); renderWorkspaceMode(); return; } if (state.activeTarget) clearActiveTarget(); });
els.selectRuler.addEventListener('click', () => setActiveTarget('ruler', true)); els.selectObject.addEventListener('click', () => setActiveTarget('object', true));
els.nudgeButtons.forEach((button) => { button.addEventListener('click', () => moveTarget(state.activeTarget, Number(button.dataset.nudgeX || 0), Number(button.dataset.nudgeY || 0))); });
els.zoomOut.addEventListener('click', () => setZoom(state.zoomPercent - ZOOM_STEP)); els.zoomIn.addEventListener('click', () => setZoom(state.zoomPercent + ZOOM_STEP)); els.zoomReset.addEventListener('click', resetZoom);
els.guideToggle.addEventListener('change', () => { state.guidesEnabled = els.guideToggle.checked; renderGuides(); updateAccessibleState(); });
els.guideColor.addEventListener('change', () => { state.guideColor = Object.hasOwn(GUIDE_COLORS, els.guideColor.value) ? els.guideColor.value : 'red'; renderGuides(); updateAccessibleState(); });
els.fullscreenToggle.addEventListener('click', toggleWorkspaceMode); document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) els.taskCard.classList.remove('is-workspace-maximized'); renderWorkspaceMode(); });
els.saveEstimate.addEventListener('click', saveEstimate); els.estimateValue.addEventListener('keydown', (event) => { if (event.key === 'Enter') saveEstimate(); }); els.resetScene.addEventListener('click', resetScene); els.check.addEventListener('click', checkAnswer); els.answer.addEventListener('keydown', (event) => { if (event.key === 'Enter') checkAnswer(); }); els.nextTask.addEventListener('click', startNewTask); els.resetProgress.addEventListener('click', resetProgress);
if ('serviceWorker' in navigator && location.protocol !== 'file:') window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {}); });
