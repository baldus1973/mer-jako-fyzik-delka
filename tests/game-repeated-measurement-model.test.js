const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const context = { globalThis: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'games', 'tri-mereni', 'model.js'), 'utf8'), context);
const model = context.globalThis.RepeatedMeasurementGame;
assert(model, 'Model se nenačetl.');

const seenObjects = new Set();
const seenPatterns = new Set();
for (let seed = 1; seed <= 5000; seed += 1) {
  const task = model.generateTask(seed);
  seenObjects.add(task.objectId);
  seenPatterns.add(task.patternId);
  assert.strictEqual(task.readingsMm.length, 3);
  const ref = task.readingsMm.reduce((a,b)=>a+b,0)/3;
  assert(Math.abs(ref-task.expectedAverageMm)<1e-9, `Seed ${seed}: chybný průměr.`);
  const ok = model.evaluate(task, String(task.expectedAverageMm).replace('.', ','), 'random_variation');
  assert.strictEqual(ok.correct, true, `Seed ${seed}: správná odpověď nebyla přijata.`);
  const sum = task.readingsMm.reduce((a,b)=>a+b,0);
  assert.strictEqual(model.evaluate(task, sum, 'random_variation').code, 'answer.sum_not_average');
  assert.strictEqual(model.evaluate(task, Math.max(...task.readingsMm), 'random_variation').code, 'answer.largest');
  assert.strictEqual(model.evaluate(task, task.expectedAverageMm, 'take_largest').code, 'reason.wrong');
}
assert.strictEqual(seenObjects.size, model.OBJECTS.length);
assert.strictEqual(seenPatterns.size, model.PATTERNS.length);
console.log(`PASS 5000 seeds; objects=${seenObjects.size}; patterns=${seenPatterns.size}`);
