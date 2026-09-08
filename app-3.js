function loadProgress() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      attempts: Number.isInteger(data.attempts) ? data.attempts : 0,
      successes: Number.isInteger(data.successes) ? data.successes : 0,
      errors: data.errors && typeof data.errors === 'object' ? data.errors : {},
    };
  } catch {
    return { attempts: 0, successes: 0, errors: {} };
  }
}

function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // The exercise must work even when file:// storage is unavailable.
  }
}

function showProgress() {
  const p = loadProgress();
  els.attemptsStatus.textContent = `Pokusy: ${p.attempts} \u00b7 spr\u00e1vn\u011b: ${p.successes}`;
}

function recordResult(result) {
  const p = loadProgress();
  p.attempts += 1;
  if (result.correct) p.successes += 1;
  else p.errors[result.code] = (p.errors[result.code] || 0) + 1;
  saveProgress(p);
  showProgress();
}

function feedbackFor(result, rawValue, unit) {
  if (result.correct) {
    return {
      kind: 'success',
      title: 'Spr\u00e1vn\u011b zm\u011b\u0159eno.',
      text: 'Pastelka m\u00e1 d\u00e9lku 84 mm, tedy 8,4 cm. Prav\u00edtko je p\u0159ilo\u017een\u00e9 k pastelce, nula je u jej\u00edho za\u010d\u00e1tku a v\u00fdsledek obsahuje jednotku.',
    };
  }
  if (result.code === 'placement.edge_contact') {
    return {
      kind: 'hint',
      title: 'Nejd\u0159\u00edv prav\u00edtko opravdu p\u0159ilo\u017e k pastelce.',
      text: 'Posu\u0148 prav\u00edtko nahoru nebo dol\u016f tak, aby jeho horn\u00ed hrana t\u011bsn\u011b sousedila se spodn\u00ed hranou pastelky. Potom srovnej nulu.',
    };
  }
  if (result.code === 'placement.zero_alignment') {
    return {
      kind: 'hint',
      title: 'Te\u010f srovnej nulu prav\u00edtka.',
      text: 'Prav\u00edtko u\u017e je u pastelky. Posu\u0148 ho doleva nebo doprava tak, aby zna\u010dka 0 byla u lev\u00e9ho konce pastelky.',
    };
  }
  if (result.code === 'answer.invalid') {
    return {
      kind: 'error',
      title: 'Chyb\u00ed \u010d\u00edseln\u00e1 hodnota.',
      text: 'Zapi\u0161 \u010d\u00edslo, nap\u0159\u00edklad 8,4, a potom zvol jednotku.',
    };
  }
  if (result.code === 'unit.scale_factor') {
    const suggestion = unit === 'mm'
      ? 'Zkontroluj, zda nem\u00e1 b\u00fdt hodnota v centimetrech.'
      : 'Zkontroluj p\u0159evod mezi centimetry a milimetry.';
    return {
      kind: 'error',
      title: 'Pozor na jednotku a desetinnou \u010d\u00e1rku.',
      text: `${suggestion} Jeden centimetr je 10 milimetr\u016f.`,
    };
  }
  const value = Number.isFinite(rawValue) ? String(rawValue).replace('.', ',') : 'zadan\u00e1 hodnota';
  return {
    kind: 'error',
    title: 'Zkus znovu ode\u010d\u00edst stupnici.',
    text: `${value} ${unit} neodpov\u00edd\u00e1 d\u00e9lce pastelky. Nejmen\u0161\u00ed d\u00edlek prav\u00edtka je 1 mm.`,
  };
}

function checkAnswer() {
  const answerValue = parseDecimal(els.answer.value);
  const answerUnit = els.unit.value;
  const result = evaluateMeasurement({
    objectStartMm: state.objectX,
    objectEndMm: state.objectX + scenario.objectLengthMm,
    objectTopMm: state.objectY,
    objectHeightMm: scenario.objectHeightMm,
    rulerZeroMm: state.rulerX,
    rulerTopMm: state.rulerY,
    answerValue,
    answerUnit,
    targetGapMm: scenario.targetGapMm,
  });
  recordResult(result);
  const fb = feedbackFor(result, answerValue, answerUnit);
  els.feedback.dataset.kind = fb.kind;
  els.feedback.hidden = false;
  els.feedbackTitle.textContent = fb.title;
  els.feedbackText.textContent = fb.text;
  els.feedback.focus({ preventScroll: false });
}

function resetScene() {
  state.objectX = scenario.initialObjectX;
  state.objectY = scenario.initialObjectY;
  state.rulerX = scenario.initialRulerX;
  state.rulerY = scenario.initialRulerY;
  clearActiveTarget();
  renderPositions();
  updatePlacementStatus();
  els.answer.value = '';
  els.feedback.hidden = true;
}

function resetProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Safe fallback for file:// mode without available localStorage.
  }
  showProgress();
  els.feedback.hidden = false;
  els.feedback.dataset.kind = 'hint';
  els.feedbackTitle.textContent = 'M\u00edstn\u00ed pokrok byl smaz\u00e1n.';
  els.feedbackText.textContent = 'Aplikace neukl\u00e1d\u00e1 jm\u00e9no ani \u00fa\u010det. Nov\u00e9 pokusy za\u010d\u00ednaj\u00ed od nuly.';
}

function bindMovable(element, target) {
  element.addEventListener('pointerdown', (event) => pointerDown(target, event));
  element.addEventListener('pointermove', pointerMove);
  element.addEventListener('pointerup', pointerUp);
  element.addEventListener('pointercancel', pointerUp);
  element.addEventListener('keydown', (event) => onMovableKeydown(target, event));
  element.addEventListener('focus', () => setActiveTarget(target));
}

