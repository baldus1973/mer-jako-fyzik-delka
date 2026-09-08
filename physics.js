(() => {
  'use strict';

  const MM_PER_CM = 10;
  const MM_PER_M = 1000;

  function toMillimetres(value, unit) {
    if (!Number.isFinite(value)) return NaN;
    switch (unit) {
      case 'mm': return value;
      case 'cm': return value * MM_PER_CM;
      case 'm': return value * MM_PER_M;
      default: return NaN;
    }
  }

  function parseDecimal(raw) {
    if (typeof raw !== 'string') return NaN;
    const normalized = raw.trim().replace(',', '.');
    if (!/^[-+]?\d+(?:\.\d+)?$/.test(normalized)) return NaN;
    return Number(normalized);
  }

  function lengthFromEndpoints(startMm, endMm) {
    if (!Number.isFinite(startMm) || !Number.isFinite(endMm) || endMm < startMm) {
      return NaN;
    }
    return endMm - startMm;
  }

  function evaluatePlacement({
    objectStartMm,
    objectTopMm,
    objectHeightMm,
    rulerZeroMm,
    rulerTopMm,
    targetGapMm = 1.5,
    horizontalToleranceMm = 0.9,
    verticalToleranceMm = 2.5,
  }) {
    const objectBottomMm = objectTopMm + objectHeightMm;
    const horizontalErrorMm = Math.abs(rulerZeroMm - objectStartMm);
    const actualGapMm = rulerTopMm - objectBottomMm;
    const verticalErrorMm = Math.abs(actualGapMm - targetGapMm);
    const edgeContact = verticalErrorMm <= verticalToleranceMm;
    const zeroAligned = horizontalErrorMm <= horizontalToleranceMm;

    let code = 'placement.correct';
    if (!edgeContact) code = 'placement.edge_contact';
    else if (!zeroAligned) code = 'placement.zero_alignment';

    return {
      correct: edgeContact && zeroAligned,
      code,
      edgeContact,
      zeroAligned,
      objectBottomMm,
      actualGapMm,
      horizontalErrorMm,
      verticalErrorMm,
    };
  }

  function evaluateMeasurement({
    objectStartMm,
    objectEndMm,
    objectTopMm,
    objectHeightMm,
    rulerZeroMm,
    rulerTopMm,
    answerValue,
    answerUnit,
    targetGapMm = 1.5,
    horizontalToleranceMm = 0.9,
    verticalToleranceMm = 2.5,
    answerToleranceMm = 0.51,
  }) {
    const expectedMm = lengthFromEndpoints(objectStartMm, objectEndMm);
    const answerMm = toMillimetres(answerValue, answerUnit);
    const placement = evaluatePlacement({
      objectStartMm,
      objectTopMm,
      objectHeightMm,
      rulerZeroMm,
      rulerTopMm,
      targetGapMm,
      horizontalToleranceMm,
      verticalToleranceMm,
    });

    const answerValid = Number.isFinite(answerMm);
    const answerCorrect = answerValid && Math.abs(answerMm - expectedMm) <= answerToleranceMm;

    let code = 'correct';
    if (!placement.edgeContact) code = 'placement.edge_contact';
    else if (!placement.zeroAligned) code = 'placement.zero_alignment';
    else if (!answerValid) code = 'answer.invalid';
    else if (!answerCorrect) {
      const tenfold = Math.abs(answerMm - expectedMm * 10) <= answerToleranceMm;
      const tenth = Math.abs(answerMm * 10 - expectedMm) <= answerToleranceMm;
      code = tenfold || tenth ? 'unit.scale_factor' : 'reading.value';
    }

    return {
      correct: placement.correct && answerCorrect,
      code,
      expectedMm,
      answerMm,
      placement,
      aligned: placement.zeroAligned,
      alignmentErrorMm: placement.horizontalErrorMm,
    };
  }

  globalThis.PhysicsLength = Object.freeze({
    MM_PER_CM,
    MM_PER_M,
    toMillimetres,
    parseDecimal,
    lengthFromEndpoints,
    evaluatePlacement,
    evaluateMeasurement,
  });
})();
