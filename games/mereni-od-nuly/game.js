(() => {
  'use strict';

  const physics = globalThis.PhysicsLength;
  const model = globalThis.ZeroMeasurementGame;
  const svg = document.getElementById('sceneSvg');
  const sceneWrap = document.getElementById('sceneWrap');
  const readingInput = document.getElementById('readingInput');
  const unitSelect = document.getElementById('unitSelect');
  const checkButton = document.getElementById('checkButton');
  const nextButton = document.getElementById('nextButton');
  const resetButton = document.getElementById('resetButton');
  const newSeriesButton = document.getElementById('newSeriesButton');
  const helpButton = document.getElementById('helpButton');
  const helpBox = document.getElementById('helpBox');
  const feedback = document.getElementById('feedback');
  const progressText = document.getElementById('progressText');

  const VIEW_W = 824;
  const VIEW_H = 382;
  const X0 = 58;
  const Y0 = 48;
  const PX_PER_MM = 3.2;
  const RULER_HEIGHT_MM = 24;

  const querySeed = Number.parseInt(new URLSearchParams(location.search).get('seed') || '', 10);
  let seriesSeed = Number.isInteger(querySeed) ? querySeed : Math.floor(Date.now() % 1000000);
  let taskIndex = 0;
  let firstTryCorrect = 0;
  let currentTask = null;
  let rulerZeroMm = 0;
  let rulerTopMm = 0;
  let attempted = false;
  let usedHelp = false;
  let helpVisible = false;
  let drag = null;

  function svgEl(name, attrs = {}, text = '') {
    const node = document.createElementNS('http://www.w3.org/2000/svg', name);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
    if (text) node.textContent = text;
    return node;
  }

  function sx(mm) { return X0 + mm * PX_PER_MM; }
  function sy(mm) { return Y0 + mm * PX_PER_MM; }

  function clampRuler() {
    rulerZeroMm = model.clamp(rulerZeroMm, 0, currentTask.sceneWidthMm - currentTask.rulerLengthMm);
    rulerTopMm = model.clamp(rulerTopMm, 10, currentTask.sceneHeightMm - RULER_HEIGHT_MM - 2);
  }

  function keepTaskVisible() {
    requestAnimationFrame(() => {
      if (sceneWrap.scrollWidth <= sceneWrap.clientWidth) return;
      const centerMm = (currentTask.objectStartMm + currentTask.objectEndMm) / 2;
      const centerPx = (sx(centerMm) / VIEW_W) * sceneWrap.scrollWidth;
      const desired = centerPx - sceneWrap.clientWidth / 2;
      const maxScroll = sceneWrap.scrollWidth - sceneWrap.clientWidth;
      sceneWrap.scrollLeft = Math.max(0, Math.min(maxScroll, desired));
    });
  }

  function renderScene(refocus = false) {
    svg.replaceChildren();
    svg.appendChild(svgEl('title', {}, 'Papírový proužek a posuvné pravítko pro měření délky od nuly'));
    svg.appendChild(svgEl('desc', {}, 'Přesuň celé pravítko tak, aby jeho nula byla u začátku proužku a horní hrana pravítka těsně pod proužkem.'));

    if (helpVisible) {
      svg.appendChild(svgEl('line', {
        x1: sx(currentTask.objectStartMm), y1: sy(4),
        x2: sx(currentTask.objectStartMm), y2: sy(64), class: 'guide',
      }));
      svg.appendChild(svgEl('line', {
        x1: sx(currentTask.objectStartMm - 8), y1: sy(currentTask.correctRulerTopMm),
        x2: sx(currentTask.objectEndMm + 12), y2: sy(currentTask.correctRulerTopMm), class: 'guide',
      }));
    }

    const objectX = sx(currentTask.objectStartMm);
    const objectY = sy(currentTask.objectTopMm);
    const objectW = currentTask.lengthMm * PX_PER_MM;
    const objectH = currentTask.objectHeightMm * PX_PER_MM;
    svg.appendChild(svgEl('rect', {
      x: objectX, y: objectY, width: objectW, height: objectH, rx: 8, class: 'object-shape',
    }));
    svg.appendChild(svgEl('line', {
      x1: objectX, y1: objectY - 6, x2: objectX, y2: objectY + objectH + 6, class: 'object-edge',
    }));
    svg.appendChild(svgEl('line', {
      x1: objectX + objectW, y1: objectY - 6, x2: objectX + objectW, y2: objectY + objectH + 6, class: 'object-edge',
    }));

    const rulerX = sx(rulerZeroMm);
    const rulerY = sy(rulerTopMm);
    const rulerW = currentTask.rulerLengthMm * PX_PER_MM;
    const rulerH = RULER_HEIGHT_MM * PX_PER_MM;
    const group = svgEl('g', {
      class: 'ruler-group', tabindex: '0', role: 'group',
      'aria-label': 'Posuvné pravítko. Použij šipky pro posun po jednom milimetru.',
    });
    group.appendChild(svgEl('rect', {
      x: rulerX, y: rulerY, width: rulerW, height: rulerH, rx: 7, class: 'ruler-body',
    }));

    for (let mm = 0; mm <= currentTask.rulerLengthMm; mm += 1) {
      const x = rulerX + mm * PX_PER_MM;
      const major = mm % 10 === 0;
      const five = mm % 5 === 0;
      const tickMm = major ? 9 : five ? 6.5 : 4.5;
      group.appendChild(svgEl('line', {
        x1: x, y1: rulerY, x2: x, y2: rulerY + tickMm * PX_PER_MM,
        class: mm === 0 ? 'ruler-zero' : 'ruler-tick',
      }));
      if (major) {
        group.appendChild(svgEl('text', {
          x, y: rulerY + 16 * PX_PER_MM, 'text-anchor': 'middle', class: 'scale-number',
        }, String(mm / 10)));
      }
    }

    group.appendChild(svgEl('rect', {
      x: rulerX, y: rulerY, width: rulerW, height: rulerH, class: 'ruler-hit',
    }));
    svg.appendChild(group);

    if (refocus) requestAnimationFrame(() => svg.querySelector('.ruler-group')?.focus());
  }

  function clientToSceneMm(clientX, clientY) {
    const rect = svg.getBoundingClientRect();
    const viewX = (clientX - rect.left) * VIEW_W / rect.width;
    const viewY = (clientY - rect.top) * VIEW_H / rect.height;
    return { x: (viewX - X0) / PX_PER_MM, y: (viewY - Y0) / PX_PER_MM };
  }

  function moveRuler(dx, dy, refocus = false) {
    rulerZeroMm += dx;
    rulerTopMm += dy;
    clampRuler();
    renderScene(refocus);
  }

  function feedbackFor(result) {
    if (result.code === 'placement.edge_contact') {
      const gap = result.placement.actualGapMm;
      if (gap < -1) return ['Pravítko překrývá předmět.', 'Posuň ho níž. Horní hrana pravítka má být těsně pod předmětem.'];
      return ['Pravítko není u předmětu.', 'Posuň ho svisle tak, aby jeho horní hrana byla těsně pod předmětem.'];
    }
    if (result.code === 'placement.zero_alignment') {
      const direction = rulerZeroMm < currentTask.objectStartMm ? 'doprava' : 'doleva';
      return ['Nula není u začátku.', `Posuň celé pravítko ${direction}. Měření délky od nuly začíná značkou 0.`];
    }
    if (result.code === 'answer.invalid') return ['Chybí hodnota délky.', 'Zapiš číslo a zvol jednotku mm nebo cm.'];
    if (result.code === 'unit.scale_factor') return ['Pozor na jednotku.', `Délka je ${result.expectedMm} mm = ${String(result.expectedMm / 10).replace('.', ',')} cm.`];
    if (result.code === 'reading.value') return ['Přiložení je správné, ale odečet ne.', 'Čti značku pravítka přesně u pravého konce předmětu.'];
    return ['Správně.', `Nula je u začátku a pravý konec ukazuje ${result.expectedMm} mm = ${String(result.expectedMm / 10).replace('.', ',')} cm.`];
  }

  function setFeedback(kind, title, text) {
    feedback.className = `feedback ${kind}`;
    feedback.innerHTML = `<strong>${title}</strong> ${text}`;
  }

  function loadTask() {
    currentTask = model.generateTask(seriesSeed + taskIndex * 7919);
    rulerZeroMm = currentTask.initialRulerZeroMm;
    rulerTopMm = currentTask.initialRulerTopMm;
    attempted = false;
    usedHelp = false;
    helpVisible = false;
    readingInput.value = '';
    unitSelect.value = 'mm';
    nextButton.disabled = true;
    helpBox.hidden = true;
    helpButton.setAttribute('aria-expanded', 'false');
    progressText.textContent = `${firstTryCorrect}/3 bez nápovědy`;
    renderScene();
    keepTaskVisible();
    setFeedback('', 'Začni přiložením pravítka.', 'Nula patří k začátku předmětu.');
  }

  checkButton.addEventListener('click', () => {
    const answerValue = physics.parseDecimal(readingInput.value);
    const result = physics.evaluateMeasurement({
      objectStartMm: currentTask.objectStartMm,
      objectEndMm: currentTask.objectEndMm,
      objectTopMm: currentTask.objectTopMm,
      objectHeightMm: currentTask.objectHeightMm,
      rulerZeroMm,
      rulerTopMm,
      answerValue,
      answerUnit: unitSelect.value,
      targetGapMm: currentTask.targetGapMm,
    });
    const [title, text] = feedbackFor(result);
    if (result.correct) {
      if (!attempted && !usedHelp) firstTryCorrect += 1;
      attempted = true;
      nextButton.disabled = false;
      progressText.textContent = `${firstTryCorrect}/3 bez nápovědy`;
      setFeedback('ok', title, text);
    } else {
      attempted = true;
      setFeedback('error', title, text);
    }
  });

  nextButton.addEventListener('click', () => {
    taskIndex += 1;
    if (taskIndex >= 3) {
      const mastery = firstTryCorrect >= 2;
      setFeedback(
        mastery ? 'ok' : '',
        mastery ? 'Průběžně zvládnuto.' : 'Ještě potrénuj přiložení pravítka.',
        mastery
          ? 'Aspoň 2 ze 3 měření jsi zvládl napoprvé bez nápovědy.'
          : 'Dej si novou sérii. Kontroluj vždy nejdřív kontakt s předmětem, potom nulu a až nakonec odečet.',
      );
      nextButton.disabled = true;
      return;
    }
    loadTask();
  });

  resetButton.addEventListener('click', () => {
    rulerZeroMm = currentTask.initialRulerZeroMm;
    rulerTopMm = currentTask.initialRulerTopMm;
    renderScene();
    keepTaskVisible();
  });

  newSeriesButton.addEventListener('click', () => {
    seriesSeed += 100003;
    taskIndex = 0;
    firstTryCorrect = 0;
    loadTask();
  });

  helpButton.addEventListener('click', () => {
    usedHelp = true;
    helpVisible = !helpVisible;
    helpBox.hidden = !helpVisible;
    helpButton.setAttribute('aria-expanded', String(helpVisible));
    renderScene();
  });

  document.querySelectorAll('[data-move-x],[data-move-y]').forEach((button) => {
    button.addEventListener('click', () => {
      moveRuler(Number(button.dataset.moveX || 0), Number(button.dataset.moveY || 0));
    });
  });

  svg.addEventListener('keydown', (event) => {
    if (!event.target.classList?.contains('ruler-group')) return;
    const moves = {
      ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    moveRuler(move[0], move[1], true);
  });

  svg.addEventListener('pointerdown', (event) => {
    if (!event.target.classList?.contains('ruler-hit')) return;
    const point = clientToSceneMm(event.clientX, event.clientY);
    drag = { pointerId: event.pointerId, dx: point.x - rulerZeroMm, dy: point.y - rulerTopMm };
    svg.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  });

  svg.addEventListener('pointermove', (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const point = clientToSceneMm(event.clientX, event.clientY);
    rulerZeroMm = point.x - drag.dx;
    rulerTopMm = point.y - drag.dy;
    clampRuler();
    renderScene();
  });

  function endDrag(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    svg.releasePointerCapture?.(event.pointerId);
    drag = null;
  }
  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel', endDrag);

  loadTask();
})();
