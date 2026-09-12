const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const context = { globalThis: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'games', 'merici-detektiv', 'model.js'), 'utf8'), context);
const model = context.globalThis.MeasurementDetectiveGame;
assert(model, 'Model MeasurementDetectiveGame se nenačetl.');
assert.strictEqual(model.CASES.length, 6, 'Boss musí mít 6 přenosových případů.');

const seenOrders = new Set();
for (let seed = 1; seed <= 5000; seed += 1) {
  const series = model.generateSeries(seed);
  assert.strictEqual(series.length, model.CASES.length, `Seed ${seed}: neúplná série.`);
  assert.strictEqual(new Set(series.map((item) => item.id)).size, model.CASES.length, `Seed ${seed}: duplicitní případ.`);
  seenOrders.add(series.map((item) => item.id).join('|'));
  for (const caseData of series) {
    const correct = model.evaluate(caseData, caseData.diagnosisCode, caseData.repairCode);
    assert.strictEqual(correct.correct, true, `Seed ${seed}, ${caseData.id}: správná diagnóza + oprava nebyla přijata.`);

    const wrongDiagnosis = caseData.diagnosisOptions.find((item) => item.code !== caseData.diagnosisCode).code;
    const diagnosisResult = model.evaluate(caseData, wrongDiagnosis, caseData.repairCode);
    assert.strictEqual(diagnosisResult.code, 'diagnosis.wrong', `Seed ${seed}, ${caseData.id}: chybná diagnóza není rozpoznána.`);

    const wrongRepair = caseData.repairOptions.find((item) => item.code !== caseData.repairCode).code;
    const repairResult = model.evaluate(caseData, caseData.diagnosisCode, wrongRepair);
    assert.strictEqual(repairResult.code, 'repair.wrong', `Seed ${seed}, ${caseData.id}: chybná oprava není rozpoznána.`);

    const missingDiagnosis = model.evaluate(caseData, '', '');
    assert.strictEqual(missingDiagnosis.code, 'diagnosis.missing');
    const missingRepair = model.evaluate(caseData, caseData.diagnosisCode, '');
    assert.strictEqual(missingRepair.code, 'repair.missing');
  }
}
assert(seenOrders.size > 50, `Generátor má příliš málo různých pořadí: ${seenOrders.size}.`);
console.log(`PASS 5000 seeds; cases=${model.CASES.length}; uniqueOrders=${seenOrders.size}`);
