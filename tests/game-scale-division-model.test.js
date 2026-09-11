const fs = require('fs');
const vm = require('vm');

const source = fs.readFileSync('games/najdi-dilek/model.js', 'utf8');
vm.runInThisContext(source, { filename: 'model.js' });

const game = globalThis.ScaleDivisionGame;
let count = 0;
let seenSteps = new Set();

for (let seed = 1; seed <= 5000; seed += 1) {
  const task = game.generateTask(seed);
  count += 1;
  seenSteps.add(task.minorStepMm);

  if (![1, 2, 5].includes(task.minorStepMm)) throw new Error(`invalid step ${task.minorStepMm}`);
  if (task.targetMm <= 0 || task.targetMm >= 150) throw new Error(`invalid target ${task.targetMm}`);
  if (task.targetMm % task.minorStepMm !== 0) throw new Error(`target not on tick ${task.targetMm}/${task.minorStepMm}`);
  if (task.targetMm % 10 === 0) throw new Error(`target unexpectedly on major tick ${task.targetMm}`);

  const correctMm = game.evaluateTask(task, {
    divisionMm: String(task.minorStepMm),
    readingValue: String(task.targetMm),
    readingUnit: 'mm',
  });
  if (!correctMm.correct) throw new Error(`correct mm rejected seed ${seed}`);

  const correctCm = game.evaluateTask(task, {
    divisionMm: String(task.minorStepMm),
    readingValue: String(task.targetCm).replace('.', ','),
    readingUnit: 'cm',
  });
  if (!correctCm.correct) throw new Error(`correct cm rejected seed ${seed}`);

  const wrongDivision = game.evaluateTask(task, {
    divisionMm: String(task.minorStepMm === 1 ? 2 : 1),
    readingValue: String(task.targetMm),
    readingUnit: 'mm',
  });
  if (wrongDivision.code !== 'division.wrong') throw new Error(`wrong division not diagnosed seed ${seed}`);

  const wrongReading = game.evaluateTask(task, {
    divisionMm: String(task.minorStepMm),
    readingValue: String(task.targetMm + task.minorStepMm),
    readingUnit: 'mm',
  });
  if (wrongReading.correct || wrongReading.code !== 'reading.wrong') throw new Error(`wrong reading not diagnosed seed ${seed}`);
}

if (seenSteps.size !== 3) throw new Error(`not all steps generated: ${[...seenSteps].join(',')}`);
console.log(`PASS ${count} seeds; steps ${[...seenSteps].sort((a,b)=>a-b).join(', ')} mm`);
