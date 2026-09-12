const fs = require('fs');
const vm = require('vm');

vm.runInThisContext(fs.readFileSync('physics.js', 'utf8'), { filename: 'physics.js' });
vm.runInThisContext(fs.readFileSync('games/mereni-od-nuly/model.js', 'utf8'), { filename: 'model.js' });

const physics = globalThis.PhysicsLength;
const game = globalThis.ZeroMeasurementGame;
let count = 0;
let minLength = Infinity;
let maxLength = -Infinity;

for (let seed = 1; seed <= 5000; seed += 1) {
  const task = game.generateTask(seed);
  count += 1;
  minLength = Math.min(minLength, task.lengthMm);
  maxLength = Math.max(maxLength, task.lengthMm);

  if (task.objectEndMm - task.objectStartMm !== task.lengthMm) throw new Error(`length invariant failed seed ${seed}`);
  if (task.lengthMm < 35 || task.lengthMm > 120) throw new Error(`invalid length ${task.lengthMm}`);
  if (task.correctRulerZeroMm !== task.objectStartMm) throw new Error(`zero invariant failed seed ${seed}`);
  const expectedTop = task.objectTopMm + task.objectHeightMm + task.targetGapMm;
  if (Math.abs(task.correctRulerTopMm - expectedTop) > 1e-9) throw new Error(`top invariant failed seed ${seed}`);

  const correct = physics.evaluateMeasurement({
    objectStartMm: task.objectStartMm,
    objectEndMm: task.objectEndMm,
    objectTopMm: task.objectTopMm,
    objectHeightMm: task.objectHeightMm,
    rulerZeroMm: task.correctRulerZeroMm,
    rulerTopMm: task.correctRulerTopMm,
    answerValue: task.lengthMm,
    answerUnit: 'mm',
    targetGapMm: task.targetGapMm,
  });
  if (!correct.correct) throw new Error(`correct state rejected seed ${seed}`);

  const correctCm = physics.evaluateMeasurement({
    objectStartMm: task.objectStartMm,
    objectEndMm: task.objectEndMm,
    objectTopMm: task.objectTopMm,
    objectHeightMm: task.objectHeightMm,
    rulerZeroMm: task.correctRulerZeroMm,
    rulerTopMm: task.correctRulerTopMm,
    answerValue: task.lengthMm / 10,
    answerUnit: 'cm',
    targetGapMm: task.targetGapMm,
  });
  if (!correctCm.correct) throw new Error(`correct cm rejected seed ${seed}`);

  const badZero = physics.evaluateMeasurement({
    objectStartMm: task.objectStartMm,
    objectEndMm: task.objectEndMm,
    objectTopMm: task.objectTopMm,
    objectHeightMm: task.objectHeightMm,
    rulerZeroMm: task.correctRulerZeroMm + 4,
    rulerTopMm: task.correctRulerTopMm,
    answerValue: task.lengthMm,
    answerUnit: 'mm',
    targetGapMm: task.targetGapMm,
  });
  if (badZero.code !== 'placement.zero_alignment') throw new Error(`bad zero not diagnosed seed ${seed}`);

  const badGap = physics.evaluateMeasurement({
    objectStartMm: task.objectStartMm,
    objectEndMm: task.objectEndMm,
    objectTopMm: task.objectTopMm,
    objectHeightMm: task.objectHeightMm,
    rulerZeroMm: task.correctRulerZeroMm,
    rulerTopMm: task.correctRulerTopMm + 8,
    answerValue: task.lengthMm,
    answerUnit: 'mm',
    targetGapMm: task.targetGapMm,
  });
  if (badGap.code !== 'placement.edge_contact') throw new Error(`bad gap not diagnosed seed ${seed}`);
}

console.log(`PASS ${count} seeds; length range ${minLength}-${maxLength} mm`);
