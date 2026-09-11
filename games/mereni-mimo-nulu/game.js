(() => {
  'use strict';

  const { evaluateOffsetMeasurement, parseDecimal } = globalThis.PhysicsLength;
  const RULER_X = 15;
  const RULER_LENGTH_MM = 150;
  const STORAGE_KEY = 'fy-06-hra-01-offset-progress-v1';

  const els = {
    scene: document.querySelector('#offset-scene'),
    object: document.querySelector('#game-object'),
    ticks: document.querySelector('#ruler-ticks'),
    labels: document.querySelector('#ruler-labels'),
    startMarker: document.querySelector('#start-marker'),
    endMarker: document.querySelector('#end-marker'),
    startOutput: document.querySelector('#start-output'),
    endOutput: document.querySelector('#end-output'),
    answer: document.querySelector('#answer-value'),
    unit: document.querySelector('#answer-unit'),
    check: document.querySelector('#check-answer'),
    feedback: document.querySelector('#feedback'),
    feedbackTitle: document.querySelector('#feedback-title'),
    feedbackText: document.querySelector('#feedback-text'),
    nextTask: document.querySelector('#next-task'),
    mastery: document.querySelector('#mastery-status'),
    missionStep: document.querySelector('#mission-step'),
  };

  const state = {
    taskNumber: 1,
    task: null,
    startMarkerMm: 0,
    endMarkerMm: 100,
    dragging: null,
    pointerId: null,
    attemptInTask: 0,
  };

  function randomIntInclusive(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function createTask() {
    const startMm = randomIntInclusive(12, 73);
    const maxLength = Math.min(72, 145 - startMm);
    const lengthMm = randomIntInclusive(25, maxLength);
    return Object.freeze({
      startMm,
      endMm: startMm + lengthMm,
      lengthMm,
    });
  }

  function clampMm(value) {
    return Math.max(0, Math.min(RULER_LENGTH_MM, Math.round(value)));
  }

  function renderRuler() {
    const ns = 'http://www.w3.org/2000/svg';
    els.ticks.textContent = '';
    els.labels.textContent = '';
    for (let mm = 0; mm <= RULER_LENGTH_MM; mm += 1) {
      const line = document.createElementNS(ns, 'line');
      const major = mm % 10 === 0;
      const mid = mm % 5 === 0;
      line.setAttribute('x1', String(mm));
      line.setAttribute('x2', String(mm));
      line.setAttribute('y1', '0');
      line.setAttribute('y2', major ? '12' : mid ? '8' : '5');
      line.setAttribute('class', major ? 'tick tick-major' : 'tick');
      els.ticks.append(line);

      if (major) {
        const text = document.createElementNS(ns, 'text');
        text.setAttribute('x', String(mm));
        text.setAttribute('y', '23');
        text.setAttribute('text-anchor', mm === 0 ? 'start' : mm === RULER_LENGTH_MM ? 'end' : 'middle');
        text.setAttribute('class', 'ruler-label');
        text.textContent = String(mm / 10);
        els.labels.append(text);
      }
    }
  }

  function renderTask() {
    const { startMm, lengthMm } = state.task;
    els.object.setAttribute('x', String(RULER_X + startMm));
    els.object.setAttribute('width', String(lengthMm));
    els.missionStep.textContent = `Mise ${state.taskNumber} · Měření mimo nulu`;
  }

  function renderMarkers() {
    const startX = RULER_X + state.startMarkerMm;
    const endX = RULER_X + state.endMarkerMm;
    els.startMarker.setAttribute('transform', `translate(${startX} 0)`);
    els.endMarker.setAttribute('transform', `translate(${endX} 0)`);
    els.startMarker.setAttribute('aria-valuenow', String(state.startMarkerMm));
    els.endMarker.setAttribute('aria-valuenow', String(state.endMarkerMm));
    els.startOutput.textContent = `${state.startMarkerMm} mm`;
    els.endOutput.textContent = `${state.endMarkerMm} mm`;
  }

  function setMarker(target, mm) {
    const next = clampMm(mm);
    if (target === 'start') state.startMarkerMm = next;
    else state.endMarkerMm = next;
    renderMarkers();
  }

  function clientToRulerMm(event) {
    const point = els.scene.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const ctm = els.scene.getScreenCTM();
    if (!ctm) return 0;
    const transformed = point.matrixTransform(ctm.inverse());
    return transformed.x - RULER_X;
  }

  function pointerDown(target, event) {
    if (event.button !== undefined && event.button !== 0) return;
    state.dragging = target;
    state.pointerId = event.pointerId;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setMarker(target, clientToRulerMm(event));
    event.preventDefault();
  }

  function pointerMove(event) {
    if (!state.dragging || event.pointerId !== state.pointerId) return;
    setMarker(state.dragging, clientToRulerMm(event));
  }

  function pointerUp(event) {
    if (event.pointerId !== state.pointerId) return;
    state.dragging = null;
    state.pointerId = null;
  }

  function markerKeydown(target, event) {
    let delta = 0;
    if (event.key === 'ArrowLeft') delta = -1;
    else if (event.key === 'ArrowRight') delta = 1;
    else return;
    setMarker(target, (target === 'start' ? state.startMarkerMm : state.endMarkerMm) + delta);
    event.preventDefault();
  }

  function feedbackFor(result) {
    if (result.correct) {
      const cm = String(result.expectedMm / 10).replace('.', ',');
      return {
        kind: 'success',
        title: 'Správně.',
        text: `Začátek je ${state.task.startMm} mm, konec ${state.task.endMm} mm. Délka je ${state.task.endMm} − ${state.task.startMm} = ${result.expectedMm} mm, tedy ${cm} cm.`,
      };
    }
    if (result.code === 'marker.both') {
      return { kind: 'hint', title: 'Nejdřív označ oba konce.', text: 'Svislé značky musí procházet přes přesný začátek a přesný konec předmětu.' };
    }
    if (result.code === 'marker.start') {
      return { kind: 'hint', title: 'Zkontroluj začátek.', text: 'Levá značka ještě neprochází začátkem předmětu. Odečti hodnotu na stupnici pod levou hranou.' };
    }
    if (result.code === 'marker.end') {
      return { kind: 'hint', title: 'Zkontroluj konec.', text: 'Pravá značka ještě neprochází koncem předmětu. Odečti hodnotu na stupnici pod pravou hranou.' };
    }
    if (result.code === 'answer.invalid') {
      return { kind: 'error', title: 'Chybí číselná hodnota.', text: 'Zapiš délku jako číslo a zvol jednotku.' };
    }
    if (result.code === 'reading.end_is_length') {
      return { kind: 'error', title: 'Konec není totéž co délka.', text: `Předmět nezačíná na nule. Od hodnoty konce odečti hodnotu začátku: konec − začátek.` };
    }
    if (result.code === 'unit.scale_factor') {
      return { kind: 'error', title: 'Pozor na jednotku.', text: 'Jeden centimetr je 10 milimetrů. Zkontroluj číselnou hodnotu i zvolenou jednotku.' };
    }
    return { kind: 'error', title: 'Zkus výpočet znovu.', text: 'Délka předmětu je rozdíl mezi odečtem na konci a odečtem na začátku.' };
  }

  function loadProgress() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return {
        recent: Array.isArray(raw.recent) ? raw.recent.slice(-3).map(Boolean) : [],
        errors: raw.errors && typeof raw.errors === 'object' ? raw.errors : {},
      };
    } catch {
      return { recent: [], errors: {} };
    }
  }

  function saveProgress(progress) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Hra funguje i bez dostupného localStorage.
    }
  }

  function updateMastery() {
    const progress = loadProgress();
    const successes = progress.recent.filter(Boolean).length;
    if (progress.recent.length < 3) els.mastery.textContent = `Měření mimo nulu: ${progress.recent.length}/3 kontrolních úloh`;
    else if (successes >= 2) els.mastery.textContent = 'Měření mimo nulu: průběžně zvládnuto ✓';
    else els.mastery.textContent = 'Měření mimo nulu: ještě procvičit ↻';
  }

  function recordTaskResult(firstTryCorrect, code) {
    const progress = loadProgress();
    progress.recent.push(Boolean(firstTryCorrect));
    progress.recent = progress.recent.slice(-3);
    if (!firstTryCorrect && code) progress.errors[code] = (progress.errors[code] || 0) + 1;
    saveProgress(progress);
    updateMastery();
  }

  function checkAnswer() {
    state.attemptInTask += 1;
    const result = evaluateOffsetMeasurement({
      startMm: state.task.startMm,
      endMm: state.task.endMm,
      markerStartMm: state.startMarkerMm,
      markerEndMm: state.endMarkerMm,
      answerValue: parseDecimal(els.answer.value),
      answerUnit: els.unit.value,
    });
    const fb = feedbackFor(result);
    els.feedback.dataset.kind = fb.kind;
    els.feedback.hidden = false;
    els.feedbackTitle.textContent = fb.title;
    els.feedbackText.textContent = fb.text;
    els.feedback.focus({ preventScroll: false });

    if (result.correct) {
      recordTaskResult(state.attemptInTask === 1, null);
      els.check.disabled = true;
      els.nextTask.hidden = false;
    } else if (state.attemptInTask === 1) {
      const progress = loadProgress();
      progress.errors[result.code] = (progress.errors[result.code] || 0) + 1;
      saveProgress(progress);
    }
  }

  function startTask() {
    state.task = createTask();
    state.attemptInTask = 0;
    state.startMarkerMm = clampMm(state.task.startMm - randomIntInclusive(4, 12));
    state.endMarkerMm = clampMm(state.task.endMm + randomIntInclusive(4, 12));
    els.answer.value = '';
    els.check.disabled = false;
    els.nextTask.hidden = true;
    els.feedback.hidden = true;
    renderTask();
    renderMarkers();
  }

  function nextTask() {
    state.taskNumber += 1;
    startTask();
  }

  renderRuler();
  startTask();
  updateMastery();

  [['start', els.startMarker], ['end', els.endMarker]].forEach(([target, element]) => {
    element.addEventListener('pointerdown', (event) => pointerDown(target, event));
    element.addEventListener('pointermove', pointerMove);
    element.addEventListener('pointerup', pointerUp);
    element.addEventListener('pointercancel', pointerUp);
    element.addEventListener('keydown', (event) => markerKeydown(target, event));
  });

  document.querySelectorAll('.marker-nudge').forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.target;
      const delta = Number(button.dataset.delta || 0);
      const current = target === 'start' ? state.startMarkerMm : state.endMarkerMm;
      setMarker(target, current + delta);
    });
  });

  els.check.addEventListener('click', checkAnswer);
  els.answer.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') checkAnswer();
  });
  els.nextTask.addEventListener('click', nextTask);
})();
