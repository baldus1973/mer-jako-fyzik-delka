(() => {
  'use strict';

  const model = globalThis.ConversionLabGame;
  const taskTitle = document.getElementById('taskTitle');
  const taskContext = document.getElementById('taskContext');
  const sourceNumber = document.getElementById('sourceNumber');
  const sourceUnit = document.getElementById('sourceUnit');
  const targetUnit = document.getElementById('targetUnit');
  const answerInput = document.getElementById('answerInput');
  const ruleList = document.getElementById('ruleList');
  const helpButton = document.getElementById('helpButton');
  const helpBox = document.getElementById('helpBox');
  const helpText = document.getElementById('helpText');
  const checkButton = document.getElementById('checkButton');
  const nextButton = document.getElementById('nextButton');
  const newSeriesButton = document.getElementById('newSeriesButton');
  const feedback = document.getElementById('feedback');
  const progressText = document.getElementById('progressText');

  const querySeed = Number.parseInt(new URLSearchParams(location.search).get('seed') || '', 10);
  let seriesSeed = Number.isInteger(querySeed) ? querySeed : Math.floor(Date.now() % 1000000);
  let taskIndex = 0;
  let currentTask = null;
  let selectedRuleCode = '';
  let firstTryCorrect = 0;
  let attempted = false;
  let usedHelp = false;

  function renderRules() {
    ruleList.replaceChildren();
    model.RULES.forEach((rule) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'rule-option';
      button.setAttribute('aria-pressed', String(rule.code === selectedRuleCode));
      button.textContent = rule.text;
      button.addEventListener('click', () => {
        selectedRuleCode = rule.code;
        renderRules();
      });
      ruleList.appendChild(button);
    });
  }

  function setFeedback(kind, title, text) {
    feedback.className = `feedback ${kind}`;
    feedback.innerHTML = `<strong>${title}</strong> ${text}`;
  }

  function feedbackFor(result) {
    switch (result.code) {
      case 'answer.invalid': return ['Chybí platná hodnota.', 'Zapiš číslo. Můžeš použít desetinnou čárku i tečku.'];
      case 'conversion.unchanged': return ['Číslo se nezměnilo.', `Převádíš z ${currentTask.from} na ${currentTask.to}; stejná délka musí mít v jiné jednotce jinou číselnou hodnotu.`];
      case 'conversion.direction': return ['Operace je obráceně.', 'Při převodu na větší jednotku se číselná hodnota zmenšuje, při převodu na menší jednotku zvětšuje.'];
      case 'conversion.scale_factor': return ['Nesedí převodní faktor.', 'Zkontroluj, zda mezi jednotkami platí faktor 10, 100 nebo 1000.'];
      case 'conversion.value': return ['Číselná hodnota nesedí.', `Zachovej stejnou fyzikální délku a použij vztah mezi ${currentTask.from} a ${currentTask.to}.`];
      case 'reason.missing': return ['Číslo je správně.', 'Teď vyber pravidlo, které vysvětluje, proč převod vyšel právě takto.'];
      case 'reason.wrong': return ['Číslo je správně, pravidlo ale ne.', `Správně: ${result.expectedRule.text}`];
      default: return ['Správně.', `${currentTask.sourceText} ${currentTask.from} = ${currentTask.expectedText} ${currentTask.to}. ${result.expectedRule.text}`];
    }
  }

  function loadTask() {
    currentTask = model.generateTask(seriesSeed + taskIndex * 7919);
    selectedRuleCode = '';
    attempted = false;
    usedHelp = false;
    answerInput.value = '';
    helpBox.hidden = true;
    helpButton.setAttribute('aria-expanded', 'false');
    taskTitle.textContent = currentTask.title;
    taskContext.textContent = `${currentTask.context} ${currentTask.sourceText} ${currentTask.from}.`;
    sourceNumber.textContent = currentTask.sourceText;
    sourceUnit.textContent = currentTask.from;
    targetUnit.textContent = currentTask.to;
    helpText.textContent = currentTask.ruleCode.includes('mm_to_cm') || currentTask.ruleCode.includes('cm_to_mm')
      ? '1 cm = 10 mm.'
      : currentTask.ruleCode.includes('cm_to_m') || currentTask.ruleCode.includes('m_to_cm')
        ? '1 m = 100 cm.'
        : '1 m = 1000 mm.';
    nextButton.disabled = true;
    progressText.textContent = `${firstTryCorrect}/3 bez nápovědy`;
    renderRules();
    setFeedback('', 'Začni vztahem jednotek.', 'Rozmysli si, zda převádíš na větší, nebo menší jednotku.');
  }

  checkButton.addEventListener('click', () => {
    const result = model.evaluate(currentTask, answerInput.value, selectedRuleCode);
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
      setFeedback(mastery ? 'ok' : '', mastery ? 'Průběžně zvládnuto.' : 'Ještě potrénuj převody.', mastery ? 'Aspoň 2 ze 3 převodů jsi zvládl napoprvé bez nápovědy.' : 'V nové sérii vždy nejdřív napiš vztah jednotek a zkontroluj, zda se při větší jednotce číslo zmenšilo.');
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
