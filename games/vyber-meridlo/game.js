(() => {
  'use strict';

  const model = globalThis.ToolChoiceGame;
  const taskTitle = document.getElementById('taskTitle');
  const taskText = document.getElementById('taskText');
  const toolGrid = document.getElementById('toolGrid');
  const reasonList = document.getElementById('reasonList');
  const helpButton = document.getElementById('helpButton');
  const helpBox = document.getElementById('helpBox');
  const checkButton = document.getElementById('checkButton');
  const nextButton = document.getElementById('nextButton');
  const newSeriesButton = document.getElementById('newSeriesButton');
  const feedback = document.getElementById('feedback');
  const progressText = document.getElementById('progressText');

  const querySeed = Number.parseInt(new URLSearchParams(location.search).get('seed') || '', 10);
  let seriesSeed = Number.isInteger(querySeed) ? querySeed : Math.floor(Date.now() % 1000000);
  let taskIndex = 0;
  let currentTask = null;
  let selectedInstrumentId = '';
  let selectedReasonCode = '';
  let firstTryCorrect = 0;
  let attempted = false;
  let usedHelp = false;

  function iconSvg(id) {
    const common = 'fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"';
    if (id === 'ruler_30cm') return `<svg viewBox="0 0 100 70" aria-hidden="true"><rect x="8" y="23" width="84" height="24" rx="4" ${common}/>${Array.from({length:15},(_,i)=>`<line x1="${14+i*5}" y1="23" x2="${14+i*5}" y2="${i%5===0?36:31}" ${common}/>`).join('')}</svg>`;
    if (id === 'tape_5m') return `<svg viewBox="0 0 100 70" aria-hidden="true"><rect x="18" y="14" width="48" height="42" rx="12" ${common}/><circle cx="42" cy="35" r="8" ${common}/><path d="M66 35h24M84 35v10" ${common}/></svg>`;
    if (id === 'tailor_150cm') return `<svg viewBox="0 0 100 70" aria-hidden="true"><path d="M10 22c22-18 28 40 48 22s17-25 32-12" ${common}/><path d="M16 18l4 7M28 19l4 7M47 42l5 5M68 35l6 3" ${common}/></svg>`;
    return `<svg viewBox="0 0 100 70" aria-hidden="true"><circle cx="28" cy="35" r="18" ${common}/><circle cx="28" cy="35" r="7" ${common}/><path d="M46 35h42" ${common}/><path d="M55 31v8M66 31v8M77 31v8" ${common}/></svg>`;
  }

  function renderTools() {
    toolGrid.replaceChildren();
    model.INSTRUMENTS.forEach((instrument) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tool-card';
      button.dataset.instrumentId = instrument.id;
      button.setAttribute('aria-pressed', String(instrument.id === selectedInstrumentId));
      button.innerHTML = `<span class="tool-icon">${iconSvg(instrument.id)}</span><span><strong>${instrument.name}</strong><span>${instrument.spec}</span></span>`;
      button.addEventListener('click', () => {
        selectedInstrumentId = instrument.id;
        renderTools();
      });
      toolGrid.appendChild(button);
    });
  }

  function renderReasons() {
    reasonList.replaceChildren();
    model.REASONS.forEach((reason) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'reason-option';
      button.setAttribute('role', 'radio');
      button.setAttribute('aria-checked', String(reason.code === selectedReasonCode));
      button.textContent = reason.text;
      button.addEventListener('click', () => {
        selectedReasonCode = reason.code;
        renderReasons();
      });
      reasonList.appendChild(button);
    });
  }

  function setFeedback(kind, title, text) {
    feedback.className = `feedback ${kind}`;
    feedback.innerHTML = `<strong>${title}</strong> ${text}`;
  }

  function feedbackFor(result) {
    switch (result.code) {
      case 'instrument.missing': return ['Nejdřív vyber měřidlo.', 'Porovnej potřebný rozsah, nejmenší dílek a tvar měřeného úkolu.'];
      case 'instrument.range_short': return ['Měřidlo je příliš krátké.', `Potřebuješ změřit asi ${currentTask.spanMm >= 1000 ? String(currentTask.spanMm / 1000).replace('.', ',') + ' m' : currentTask.spanMm + ' mm'} v jednom vhodném měření.`];
      case 'instrument.too_coarse': return ['Stupnice je příliš hrubá.', 'Úloha požaduje jemnější odečet, než toto měřidlo umožňuje.'];
      case 'instrument.not_flexible': return ['Měřidlo se nepřizpůsobí tvaru.', 'Pro obvod potřebuješ ohebné měřidlo, které povrch skutečně obepne.'];
      case 'instrument.wrong_use': return ['Rozsah sice může stačit, ale měřidlo není pro tento úkol nejvhodnější.', 'Zvaž velikost měřeného úseku a způsob, jakým se měřidlo přikládá.'];
      case 'instrument.not_best': return ['Existuje vhodnější měřidlo.', 'Správná volba nemá jen „nějak stačit“ – má odpovídat rozsahu, přesnosti i tvaru úkolu.'];
      case 'reason.missing': return ['Měřidlo je správně.', 'Teď vyber důvod, který vysvětluje právě jeho vhodnost.'];
      case 'reason.wrong': return ['Měřidlo je správně, důvod ale ne.', `Správná úvaha: ${result.expectedReason.text}`];
      default: return ['Správně.', `${result.expectedInstrument.name}: ${result.expectedReason.text}`];
    }
  }

  function loadTask() {
    currentTask = model.generateTask(seriesSeed + taskIndex * 7919);
    selectedInstrumentId = '';
    selectedReasonCode = '';
    attempted = false;
    usedHelp = false;
    helpBox.hidden = true;
    helpButton.setAttribute('aria-expanded', 'false');
    taskTitle.textContent = currentTask.title;
    taskText.textContent = currentTask.situation;
    nextButton.disabled = true;
    progressText.textContent = `${firstTryCorrect}/3 bez nápovědy`;
    renderTools();
    renderReasons();
    setFeedback('', 'Začni situací.', 'Nejdřív zjisti, co a jak přesně potřebuješ změřit.');
  }

  checkButton.addEventListener('click', () => {
    const result = model.evaluate(currentTask, {
      instrumentId: selectedInstrumentId,
      reasonCode: selectedReasonCode,
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

  helpButton.addEventListener('click', () => {
    usedHelp = true;
    helpBox.hidden = !helpBox.hidden;
    helpButton.setAttribute('aria-expanded', String(!helpBox.hidden));
  });

  nextButton.addEventListener('click', () => {
    taskIndex += 1;
    if (taskIndex >= 3) {
      const mastery = firstTryCorrect >= 2;
      setFeedback(
        mastery ? 'ok' : '',
        mastery ? 'Průběžně zvládnuto.' : 'Ještě potrénuj volbu měřidla.',
        mastery ? 'Aspoň 2 ze 3 voleb jsi zvládl napoprvé bez nápovědy.' : 'V nové sérii vždy porovnej rozsah, jemnost stupnice a tvar úkolu.',
      );
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

  loadTask();
})();
