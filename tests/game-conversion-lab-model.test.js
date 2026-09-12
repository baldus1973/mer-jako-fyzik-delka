const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const context = { globalThis: {} };
vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.join(__dirname, '..', 'games', 'prevodni-laborator', 'model.js'), 'utf8'),
  context,
);

const model = context.globalThis.ConversionLabGame;
assert(model, 'Model ConversionLabGame se nenačetl.');

const seenTasks = new Set();
const seenRules = new Set();

for (let seed = 1; seed <= 5000; seed += 1) {
  const task = model.generateTask(seed);
  seenTasks.add(task.id);
  seenRules.add(task.ruleCode);

  const expectedByCanonicalMm = task.lengthMm / model.UNITS[task.to].factorMm;
  assert(Math.abs(task.expectedValue - expectedByCanonicalMm) < 1e-9, `Seed ${seed}: rozpor s kanonickou délkou.`);

  const correct = model.evaluate(task, task.expectedText, task.ruleCode);
  assert.strictEqual(correct.correct, true, `Seed ${seed}: správný převod nebyl přijat.`);

  const dotAnswer = String(task.expectedValue);
  const correctDot = model.evaluate(task, dotAnswer, task.ruleCode);
  assert.strictEqual(correctDot.correct, true, `Seed ${seed}: desetinná tečka nebyla přijata.`);

  const unchanged = model.evaluate(task, task.sourceText, task.ruleCode);
  assert.strictEqual(unchanged.code, 'conversion.unchanged', `Seed ${seed}: nezměněná hodnota nemá správnou diagnostiku.`);

  const wrongRule = model.RULES.find((rule) => rule.code !== task.ruleCode).code;
  const wrongReason = model.evaluate(task, task.expectedText, wrongRule);
  assert.strictEqual(wrongReason.code, 'reason.wrong', `Seed ${seed}: chybný důvod nemá správnou diagnostiku.`);

  const invalid = model.evaluate(task, 'abc', task.ruleCode);
  assert.strictEqual(invalid.code, 'answer.invalid', `Seed ${seed}: nečíselná odpověď nemá správnou diagnostiku.`);
}

assert.strictEqual(seenTasks.size, model.TASKS.length, `Generátor nepokryl všechny úlohy: ${seenTasks.size}/${model.TASKS.length}.`);
assert.strictEqual(seenRules.size, model.RULES.length, `Generátor nepokryl všechny směry převodu: ${seenRules.size}/${model.RULES.length}.`);

for (const rule of model.RULES) {
  const synthetic = {
    lengthMm: 1200,
    from: rule.from,
    to: rule.to,
    sourceValue: model.valueInUnit(1200, rule.from),
    expectedValue: model.valueInUnit(1200, rule.to),
    expectedText: model.formatValue(model.valueInUnit(1200, rule.to)),
    ruleCode: rule.code,
  };
  const opposite = rule.operation === 'divide'
    ? synthetic.sourceValue * rule.factor
    : synthetic.sourceValue / rule.factor;
  const result = model.evaluate(synthetic, String(opposite), rule.code);
  assert.strictEqual(result.code, 'conversion.direction', `Směr ${rule.code}: opačná operace nebyla diagnostikována.`);
}

console.log(`PASS 5000 seeds; tasks=${seenTasks.size}; rules=${seenRules.size}`);
