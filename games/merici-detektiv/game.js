(() => {
  'use strict';
  const model = globalThis.MeasurementDetectiveGame;
  const root = document.querySelector('[data-testid="boss-root"]');
  if (!model || !root) return;

  const params = new URLSearchParams(location.search);
  const seed = Number(params.get('seed')) || 60107;
  let series = model.generateSeries(seed);
  let index = 0;
  let solved = 0;
  let selectedDiagnosis = '';
  let selectedRepair = '';
  let usedHint = false;

  const byId = (id) => document.getElementById(id);
  const caseLabel = byId('case-label');
  const masteryLabel = byId('mastery-label');
  const caseTitle = byId('case-title');
  const caseReport = byId('case-report');
  const hintButton = byId('hint-button');
  const hintBox = byId('hint-box');
  const diagnosisOptions = byId('diagnosis-options');
  const repairOptions = byId('repair-options');
  const checkButton = byId('check-button');
  const nextButton = byId('next-button');
  const restartButton = byId('restart-button');
  const feedback = byId('feedback');

  function makeOption(option, kind) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice-button';
    button.textContent = option.text;
    button.setAttribute('role', 'radio');
    button.setAttribute('aria-checked', 'false');
    button.dataset.code = option.code;
    button.addEventListener('click', () => {
      const box = kind === 'diagnosis' ? diagnosisOptions : repairOptions;
      [...box.querySelectorAll('.choice-button')].forEach((item) => item.setAttribute('aria-checked', 'false'));
      button.setAttribute('aria-checked', 'true');
      if (kind === 'diagnosis') selectedDiagnosis = option.code;
      else selectedRepair = option.code;
    });
    return button;
  }

  function render() {
    const current = series[index];
    selectedDiagnosis = '';
    selectedRepair = '';
    usedHint = false;
    caseLabel.textContent = `Případ ${index + 1}/${series.length}`;
    masteryLabel.textContent = `${solved}/6 vyřešeno`;
    caseTitle.textContent = current.title;
    caseReport.textContent = current.report;
    hintButton.setAttribute('aria-expanded', 'false');
    hintBox.hidden = true;
    hintBox.textContent = current.hint;
    nextButton.disabled = true;
    feedback.innerHTML = '<strong>Začni jako detektiv.</strong> Najdi nejdřív hlavní fyzikální chybu.';
    diagnosisOptions.innerHTML = '';
    repairOptions.innerHTML = '';
    current.diagnosisOptions.forEach((option) => diagnosisOptions.appendChild(makeOption(option, 'diagnosis')));
    current.repairOptions.forEach((option) => repairOptions.appendChild(makeOption(option, 'repair')));
  }

  hintButton.addEventListener('click', () => {
    usedHint = true;
    hintBox.hidden = !hintBox.hidden;
    hintButton.setAttribute('aria-expanded', String(!hintBox.hidden));
  });

  checkButton.addEventListener('click', () => {
    const current = series[index];
    const result = model.evaluate(current, selectedDiagnosis, selectedRepair);
    if (result.code === 'diagnosis.missing') {
      feedback.innerHTML = '<strong>Nejdřív označ hlavní chybu.</strong>';
      return;
    }
    if (result.code === 'diagnosis.wrong') {
      feedback.innerHTML = '<strong>To není hlavní problém.</strong> Zaměř se na chybu, která přímo mění správnost měření nebo výsledku.';
      return;
    }
    if (result.code === 'repair.missing') {
      feedback.innerHTML = '<strong>Diagnóza sedí.</strong> Teď vyber správnou opravu.';
      return;
    }
    if (result.code === 'repair.wrong') {
      feedback.innerHTML = '<strong>Chybu jsi našel, oprava ale nesedí.</strong> Zkus opravit postup tak, aby byl fyzikálně správný.';
      return;
    }
    solved += 1;
    masteryLabel.textContent = `${solved}/6 vyřešeno`;
    nextButton.disabled = false;
    feedback.innerHTML = `<strong>Případ vyřešen.</strong> ${result.explanation}${usedHint ? ' Tento případ byl vyřešen s nápovědou.' : ''}`;
  });

  nextButton.addEventListener('click', () => {
    if (index < series.length - 1) {
      index += 1;
      render();
      return;
    }
    feedback.innerHTML = '<strong>BOSS dokončen.</strong> Prošel jsi volbu měřidla, stupnici, nulu, měření mimo nulu, převody i opakované měření.';
    nextButton.disabled = true;
  });

  restartButton.addEventListener('click', () => {
    index = 0;
    solved = 0;
    series = model.generateSeries(seed + 1);
    render();
  });

  render();
})();
