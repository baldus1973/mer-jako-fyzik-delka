(() => {
  'use strict';

  const model = globalThis.RepeatedMeasurementGame;
  const taskTitle = document.getElementById('taskTitle');
  const taskText = document.getElementById('taskText');
  const reading1 = document.getElementById('reading1');
  const reading2 = document.getElementById('reading2');
  const reading3 = document.getElementById('reading3');
  const answerInput = document.getElementById('answerInput');
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
  let selectedReasonCode = '';
  let firstTryCorrect = 0;
  let attempted = false;
  let usedHelp = false;

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
      case 'answer.invalid': return ['Zadej číselný výsledek.', 'Sečti tři hodnoty a součet vyděl třemi.'];
      case 'answer.sum_not_average': return ['To je součet, ne průměr.', 'Po sečtení tří měření musíš součet ještě vydělit třemi.'];
      case 'answer.largest': return ['Vybral jsi největší měření.', 'Průměr využívá všechny tři naměřené hodnoty, ne jen největší.'];
      case 'answer.smallest': return ['Vybral jsi nejmenší měření.', 'Průměr využívá všechny tři naměřené hodnoty.'];
      case 'answer.single_reading': return ['Opsal jsi jedno měření.', 'Aritmetický průměr vznikne ze všech tří výsledků.'];
      case 'answer.wrong_average': return ['Průměr ještě nesedí.', `Správně počítej (${currentTask.readingsMm.join(' + ')}) ÷ 3.`];
      case 'reason.missing': return ['Průměr je správně.', 'Teď vyber, proč má opakované měření smysl.'];
      case 'reason.wrong': return ['Průměr je správně, vysvětlení ne.', result.expectedReason.text];
      default: return ['Správně.', `Průměr je ${result.expectedAverageMm} mm. ${result.expectedReason.text}`];
    }
  }

  function loadTask() {
    currentTask = model.generateTask(seriesSeed + taskIndex * 7919);
    selectedReasonCode = '';
    attempted = false;
    usedHelp = false;
    helpBox.hidden = true;
    helpButton.setAttribute('aria-expanded', 'false');
    taskTitle.textContent = currentTask.title;
    taskText.textContent = currentTask.situation;
    [reading1, reading2, reading3].forEach((el, index) => { el.textContent = `${currentTask.readingsMm[index]} mm`; });
    answerInput.value = '';
    nextButton.disabled = true;
    progressText.textContent = `${firstTryCorrect}/3 bez nápovědy`;
    renderReasons();
    setFeedback('', 'Začni třemi výsledky.', 'Vypočítej jejich aritmetický průměr.');
    answerInput.focus();
  }

  checkButton.addEventListener('click', () => {
    const result = model.evaluate(currentTask, answerInput.value, selectedReasonCode);
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
        mastery ? 'Průběžně zvládnuto.' : 'Ještě potrénuj opakovaná měření.',
        mastery ? 'Aspoň 2 ze 3 úloh jsi zvládl napoprvé bez nápovědy.' : 'V nové sérii vždy použij všechna tři měření a vysvětli smysl průměru.',
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

  answerInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') checkButton.click();
  });

  loadTask();
})();
