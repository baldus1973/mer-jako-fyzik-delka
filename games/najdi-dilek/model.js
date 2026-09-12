(() => {
  'use strict';

  const ALLOWED_MINOR_STEPS_MM = Object.freeze([1, 2, 5]);
  const RULER_MIN_MM = 0;
  const RULER_MAX_MM = 150;

  function mulberry32(seed) {
    let state = seed >>> 0;
    return function random() {
      state += 0x6D2B79F5;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pick(list, random) {
    return list[Math.floor(random() * list.length)];
  }

  function generateTask(seed) {
    const random = mulberry32(seed);
    const minorStepMm = pick(ALLOWED_MINOR_STEPS_MM, random);
    const validMarks = [];
    for (let mm = 10; mm <= 140; mm += minorStepMm) {
      if (mm % 10 !== 0) validMarks.push(mm);
    }
    const targetMm = pick(validMarks, random);
    return Object.freeze({
      seed,
      minorStepMm,
      majorStepMm: 10,
      targetMm,
      targetCm: targetMm / 10,
      rulerMinMm: RULER_MIN_MM,
      rulerMaxMm: RULER_MAX_MM,
    });
  }

  function parseDecimal(raw) {
    if (typeof raw !== 'string') return NaN;
    const normalized = raw.trim().replace(',', '.');
    if (!/^[-+]?\d+(?:\.\d+)?$/.test(normalized)) return NaN;
    return Number(normalized);
  }

  function answerToMm(value, unit) {
    if (!Number.isFinite(value)) return NaN;
    if (unit === 'mm') return value;
    if (unit === 'cm') return value * 10;
    return NaN;
  }

  function evaluateTask(task, answers) {
    const divisionMm = Number(answers.divisionMm);
    const readingValue = parseDecimal(String(answers.readingValue ?? ''));
    const readingMm = answerToMm(readingValue, answers.readingUnit);

    const divisionCorrect = divisionMm === task.minorStepMm;
    const readingValid = Number.isFinite(readingMm);
    const readingCorrect = readingValid && Math.abs(readingMm - task.targetMm) <= 0.01;

    let code = 'correct';
    if (!divisionCorrect) code = 'division.wrong';
    else if (!readingValid) code = 'reading.invalid';
    else if (!readingCorrect) {
      const targetAsCmWithoutConversion = Math.abs(readingMm - task.targetCm) <= 0.01;
      const tenfold = Math.abs(readingMm - task.targetMm * 10) <= 0.01;
      code = targetAsCmWithoutConversion || tenfold ? 'unit.scale_factor' : 'reading.wrong';
    }

    return Object.freeze({
      correct: divisionCorrect && readingCorrect,
      code,
      divisionCorrect,
      readingCorrect,
      expectedDivisionMm: task.minorStepMm,
      expectedReadingMm: task.targetMm,
      expectedReadingCm: task.targetCm,
      readingMm,
    });
  }

  globalThis.ScaleDivisionGame = Object.freeze({
    ALLOWED_MINOR_STEPS_MM,
    RULER_MIN_MM,
    RULER_MAX_MM,
    generateTask,
    evaluateTask,
    parseDecimal,
    answerToMm,
  });
})();
