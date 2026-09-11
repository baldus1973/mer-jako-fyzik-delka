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

  function evaluateOffsetMeasurement({
    startMm,
    endMm,
    markerStartMm,
    markerEndMm,
    answerValue,
    answerUnit,
    markerToleranceMm = 0.51,
    answerToleranceMm = 0.51,
  }) {
    const expectedMm = lengthFromEndpoints(startMm, endMm);
    const answerMm = toMillimetres(answerValue, answerUnit);
    const startCorrect = Number.isFinite(markerStartMm)
      && Math.abs(markerStartMm - startMm) <= markerToleranceMm;
    const endCorrect = Number.isFinite(markerEndMm)
      && Math.abs(markerEndMm - endMm) <= markerToleranceMm;
    const answerValid = Number.isFinite(answerMm);
    const answerCorrect = answerValid
      && Number.isFinite(expectedMm)
      && Math.abs(answerMm - expectedMm) <= answerToleranceMm;

    let code = 'correct';
    if (!Number.isFinite(expectedMm)) code = 'task.invalid';
    else if (!startCorrect && !endCorrect) code = 'marker.both';
    else if (!startCorrect) code = 'marker.start';
    else if (!endCorrect) code = 'marker.end';
    else if (!answerValid) code = 'answer.invalid';
    else if (!answerCorrect) {
      const endpointMistake = startMm > 0 && Math.abs(answerMm - endMm) <= answerToleranceMm;
      const tenfold = Math.abs(answerMm - expectedMm * 10) <= answerToleranceMm;
      const tenth = Math.abs(answerMm * 10 - expectedMm) <= answerToleranceMm;
      if (endpointMistake) code = 'reading.end_is_length';
      else code = tenfold || tenth ? 'unit.scale_factor' : 'reading.value';
    }

    return {
      correct: Number.isFinite(expectedMm) && startCorrect && endCorrect && answerCorrect,
      code,
      expectedMm,
      answerMm,
      startCorrect,
      endCorrect,
      markerStartMm,
      markerEndMm,
      startErrorMm: Number.isFinite(markerStartMm) ? markerStartMm - startMm : NaN,
      endErrorMm: Number.isFinite(markerEndMm) ? markerEndMm - endMm : NaN,
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
    evaluateOffsetMeasurement,
  });
})();
