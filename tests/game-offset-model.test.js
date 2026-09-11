'use strict';

require('../physics.js');

const { evaluateOffsetMeasurement } = globalThis.PhysicsLength;
let cases = 0;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (let startMm = 12; startMm <= 73; startMm += 1) {
  const maxLength = Math.min(72, 145 - startMm);
  for (let lengthMm = 25; lengthMm <= maxLength; lengthMm += 1) {
    const endMm = startMm + lengthMm;

    const correctMm = evaluateOffsetMeasurement({
      startMm,
      endMm,
      markerStartMm: startMm,
      markerEndMm: endMm,
      answerValue: lengthMm,
      answerUnit: 'mm',
    });
    assert(correctMm.correct, `Správná mm odpověď selhala: ${startMm}-${endMm}`);

    const correctCm = evaluateOffsetMeasurement({
      startMm,
      endMm,
      markerStartMm: startMm,
      markerEndMm: endMm,
      answerValue: lengthMm / 10,
      answerUnit: 'cm',
    });
    assert(correctCm.correct, `Správná cm odpověď selhala: ${startMm}-${endMm}`);

    const endpointMistake = evaluateOffsetMeasurement({
      startMm,
      endMm,
      markerStartMm: startMm,
      markerEndMm: endMm,
      answerValue: endMm,
      answerUnit: 'mm',
    });
    assert(endpointMistake.code === 'reading.end_is_length', `Chybí END_IS_LENGTH: ${startMm}-${endMm}`);

    const wrongStart = evaluateOffsetMeasurement({
      startMm,
      endMm,
      markerStartMm: startMm - 1,
      markerEndMm: endMm,
      answerValue: lengthMm,
      answerUnit: 'mm',
    });
    assert(wrongStart.code === 'marker.start', `Chybí marker.start: ${startMm}-${endMm}`);

    const wrongEnd = evaluateOffsetMeasurement({
      startMm,
      endMm,
      markerStartMm: startMm,
      markerEndMm: endMm + 1,
      answerValue: lengthMm,
      answerUnit: 'mm',
    });
    assert(wrongEnd.code === 'marker.end', `Chybí marker.end: ${startMm}-${endMm}`);

    assert(endMm <= 145, `Konec mimo bezpečný rozsah: ${endMm}`);
    cases += 1;
  }
}

const boundary = evaluateOffsetMeasurement({
  startMm: 73,
  endMm: 145,
  markerStartMm: 73,
  markerEndMm: 145,
  answerValue: 72,
  answerUnit: 'mm',
});
assert(boundary.correct, 'Hraniční stav 73–145 mm musí být platný.');

console.log(`PASS game-offset-model: ${cases} kombinací + hraniční stav 145 mm`);
