const fs = require('fs');
const vm = require('vm');

vm.runInThisContext(fs.readFileSync('games/vyber-meridlo/model.js', 'utf8'), { filename: 'model.js' });
const game = globalThis.ToolChoiceGame;

let count = 0;
const seen = new Set();
for (let seed = 1; seed <= 5000; seed += 1) {
  const task = game.generateTask(seed);
  count += 1;
  seen.add(task.id);

  const correct = game.evaluate(task, {
    instrumentId: task.correctInstrumentId,
    reasonCode: task.reasonCode,
  });
  if (!correct.correct) throw new Error(`correct answer rejected seed ${seed}`);

  for (const instrument of game.INSTRUMENTS) {
    const fit = game.suitability(task, instrument);
    if (instrument.id === task.correctInstrumentId && !fit.suitable) {
      throw new Error(`correct instrument unsuitable seed ${seed}`);
    }
  }

  const wrongReason = game.REASONS.find((reason) => reason.code !== task.reasonCode);
  const reasonResult = game.evaluate(task, {
    instrumentId: task.correctInstrumentId,
    reasonCode: wrongReason.code,
  });
  if (reasonResult.code !== 'reason.wrong') throw new Error(`wrong reason not diagnosed seed ${seed}`);
}

if (seen.size !== game.TASKS.length) throw new Error(`not all tasks generated: ${seen.size}/${game.TASKS.length}`);

for (const task of game.TASKS) {
  const correctInstrument = game.getInstrument(task.correctInstrumentId);
  if (!game.suitability(task, correctInstrument).suitable) throw new Error(`task ${task.id} has invalid canonical instrument`);

  const winners = game.INSTRUMENTS.filter((instrument) =>
    game.suitability(task, instrument).suitable && instrument.id === task.correctInstrumentId
  );
  if (winners.length !== 1) throw new Error(`task ${task.id} has ambiguous canonical winner`);
}

console.log(`PASS ${count} seeds; ${seen.size} task types; ${game.INSTRUMENTS.length} instruments`);
