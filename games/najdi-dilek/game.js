(() => {
  'use strict';

  const game = globalThis.ScaleDivisionGame;
  const svg = document.getElementById('scaleSvg');
  const scaleWrap = document.querySelector('.scale-wrap');
  const divisionSelect = document.getElementById('divisionSelect');
  const readingInput = document.getElementById('readingInput');
  const unitSelect = document.getElementById('unitSelect');
  const checkButton = document.getElementById('checkButton');
  const nextButton = document.getElementById('nextButton');
  const newSeriesButton = document.getElementById('newSeriesButton');
  const helpButton = document.getElementById('helpButton');
  const helpBox = document.getElementById('helpBox');
  const feedback = document.getElementById('feedback');
  const progressText = document.getElementById('progressText');

  let seriesSeed = Math.floor(Date.now() % 1000000);
  let taskIndex = 0;
  let firstTryCorrect = 0;
  let currentTask = null;
  let checked = false;
  let usedHelp = false;

  function svgEl(name, attrs = {}, text = '') {
    const node = document.createElementNS('http://www.w3.org/2000/svg', name);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
    if (text) node.textContent = text;
    return node;
  }

  function keepTargetVisible(targetX) {
    requestAnimationFrame(() => {
      if (!scaleWrap || scaleWrap.scrollWidth <= scaleWrap.clientWidth) return;
      const targetPx = (targetX / 760) * scaleWrap.scrollWidth;
      const desired = targetPx - scaleWrap.clientWidth / 2;
      const maxScroll = scaleWrap.scrollWidth - scaleWrap.clientWidth;
      scaleWrap.scrollLeft = Math.max(0, Math.min(maxScroll, desired));
    });
  }

  function renderScale(task) {
    svg.replaceChildren();
    svg.appendChild(svgEl('title', {}, 'Pravítko s různě jemnou stupnicí a červenou šipkou na jednu značku'));
    svg.appendChild(svgEl('desc', {}, `Nejmenší dílek stupnice je ${task.minorStepMm} mm. Označená poloha je ${task.targetMm} mm.`));

    const x0 = 50;
    const x1 = 710;
    const yBase = 150;
    const width = x1 - x0;
    const pxPerMm = width / 150;

    svg.appendChild(svgEl('line', { x1: x0, y1: yBase, x2: x1, y2: yBase, class: 'tick' }));

    for (let mm = 0; mm <= 150; mm += task.minorStepMm) {
      const x = x0 + mm * pxPerMm;
      const major = mm % 10 === 0;
      const five = mm % 5 === 0;
      const length = major ? 50 : five ? 34 : 24;
      svg.appendChild(svgEl('line', { x1: x, y1: yBase, x2: x, y2: yBase - length, class: 'tick' }));
      if (major) svg.appendChild(svgEl('text', { x, y: yBase + 28, 'text-anchor': 'middle', class: 'scale-number' }, String(mm / 10)));
    }

    const targetX = x0 + task.targetMm * pxPerMm;
    svg.appendChild(svgEl('line', { x1: targetX, y1: 30, x2: targetX, y2: 92, class: 'target' }));
    svg.appendChild(svgEl('polygon', { points: `${targetX - 10},82 ${targetX + 10},82 ${targetX},100`, class: 'target-head' }));
    keepTargetVisible(targetX);
  }

  function feedbackFor(result) {
    if (result.code === 'division.wrong') {
      return ['Nejdřív oprav hodnotu dílku.', `Mezi dvěma centimetrovými značkami je 10 mm. Počítej stejné mezery, ne počet čárek; všechny mezery dohromady musí dát 10 mm.`];
    }
    if (result.code === 'reading.invalid') return ['Chybí číselná hodnota.', 'Zapiš číslo a vyber jednotku mm nebo cm.'];
    if (result.code === 'unit.scale_factor') return ['Pozor na jednotku.', `Označená poloha je ${result.expectedReadingMm} mm = ${String(result.expectedReadingCm).replace('.', ',')} cm.`];
    if (result.code === 'reading.wrong') return ['Dílek už máš správně, ale odečet ne.', `Počítej od nejbližší očíslované značky po krocích ${result.expectedDivisionMm} mm.`];
    return ['Správně.', `Nejmenší dílek je ${result.expectedDivisionMm} mm a šipka ukazuje ${result.expectedReadingMm} mm = ${String(result.expectedReadingCm).replace('.', ',')} cm.`];
  }

  function setFeedback(kind, title, text) {
    feedback.className = `feedback ${kind}`;
    feedback.innerHTML = `<strong>${title}</strong> ${text}`;
  }

  function loadTask() {
    currentTask = game.generateTask(seriesSeed + taskIndex * 9973);
    checked = false;
    usedHelp = false;
    divisionSelect.value = '';
    readingInput.value = '';
    unitSelect.value = 'mm';
    nextButton.disabled = true;
    helpBox.hidden = true;
    helpButton.setAttribute('aria-expanded', 'false');
    renderScale(currentTask);
    progressText.textContent = `${firstTryCorrect}/3 bez nápovědy`;
    setFeedback('', 'Začni hodnotou dílku.', 'Pak odečti polohu označené značky.');
  }

  checkButton.addEventListener('click', () => {
    const result = game.evaluateTask(currentTask, {
      divisionMm: divisionSelect.value,
      readingValue: readingInput.value,
      readingUnit: unitSelect.value,
    });
    const [title, text] = feedbackFor(result);
    if (result.correct) {
      if (!checked && !usedHelp) firstTryCorrect += 1;
      checked = true;
      nextButton.disabled = false;
      setFeedback('ok', title, text);
      progressText.textContent = `${firstTryCorrect}/3 bez nápovědy`;
    } else {
      checked = true;
      setFeedback('error', title, text);
    }
  });

  nextButton.addEventListener('click', () => {
    taskIndex += 1;
    if (taskIndex >= 3) {
      const mastery = firstTryCorrect >= 2;
      setFeedback(mastery ? 'ok' : '', mastery ? 'Průběžně zvládnuto.' : 'Ještě potrénuj stupnici.', mastery ? 'Aspoň 2 ze 3 úloh jsi zvládl bez nápovědy. V další misi už budeš měřit celý předmět.' : 'Dej si novou sérii a soustřeď se nejdřív na velikost jednoho dílku.');
      nextButton.disabled = true;
      return;
    }
    loadTask();
  });

  newSeriesButton.addEventListener('click', () => {
    seriesSeed += 100003;
    taskIndex = 0;
    firstTryCorrect = 0;
    loadTask();
  });

  helpButton.addEventListener('click', () => {
    usedHelp = true;
    helpBox.hidden = !helpBox.hidden;
    helpButton.setAttribute('aria-expanded', String(!helpBox.hidden));
  });

  loadTask();
})();
