(() => {
  'use strict';

  const UNITS = Object.freeze({
    mm: Object.freeze({ symbol: 'mm', factorMm: 1 }),
    cm: Object.freeze({ symbol: 'cm', factorMm: 10 }),
    m: Object.freeze({ symbol: 'm', factorMm: 1000 }),
  });

  const RULES = Object.freeze([
    Object.freeze({ code: 'mm_to_cm', from: 'mm', to: 'cm', factor: 10, operation: 'divide', text: '1 cm = 10 mm, proto při převodu mm → cm dělím 10.' }),
    Object.freeze({ code: 'cm_to_mm', from: 'cm', to: 'mm', factor: 10, operation: 'multiply', text: '1 cm = 10 mm, proto při převodu cm → mm násobím 10.' }),
    Object.freeze({ code: 'mm_to_m', from: 'mm', to: 'm', factor: 1000, operation: 'divide', text: '1 m = 1000 mm, proto při převodu mm → m dělím 1000.' }),
    Object.freeze({ code: 'm_to_mm', from: 'm', to: 'mm', factor: 1000, operation: 'multiply', text: '1 m = 1000 mm, proto při převodu m → mm násobím 1000.' }),
    Object.freeze({ code: 'cm_to_m', from: 'cm', to: 'm', factor: 100, operation: 'divide', text: '1 m = 100 cm, proto při převodu cm → m dělím 100.' }),
    Object.freeze({ code: 'm_to_cm', from: 'm', to: 'cm', factor: 100, operation: 'multiply', text: '1 m = 100 cm, proto při převodu m → cm násobím 100.' }),
  ]);

  const TASKS = Object.freeze([
    Object.freeze({ id: 'pencil', title: 'Pastelka', context: 'Po změření pastelky jsi zapsal délku', lengthMm: 84, from: 'mm', to: 'cm' }),
    Object.freeze({ id: 'paper-strip', title: 'Proužek papíru', context: 'Proužek papíru má naměřenou délku', lengthMm: 125, from: 'mm', to: 'cm' }),
    Object.freeze({ id: 'screw', title: 'Šroubek', context: 'Šroubek má naměřenou délku', lengthMm: 42, from: 'mm', to: 'cm' }),
    Object.freeze({ id: 'key', title: 'Klíč', context: 'Délka klíče byla naměřena jako', lengthMm: 73, from: 'mm', to: 'cm' }),
    Object.freeze({ id: 'eraser', title: 'Guma', context: 'Délku gumy jsi naměřil jako', lengthMm: 56, from: 'mm', to: 'cm' }),
    Object.freeze({ id: 'notebook', title: 'Sešit', context: 'Šířka sešitu byla naměřena jako', lengthMm: 210, from: 'mm', to: 'cm' }),
    Object.freeze({ id: 'bottle', title: 'Obvod lahve', context: 'Obvod lahve vyšel při měření', lengthMm: 256, from: 'cm', to: 'mm' }),
    Object.freeze({ id: 'waist', title: 'Obvod pasu', context: 'Krejčovský metr ukázal obvod', lengthMm: 800, from: 'cm', to: 'm' }),
    Object.freeze({ id: 'desk', title: 'Lavice', context: 'Délka lavice byla naměřena jako', lengthMm: 1200, from: 'mm', to: 'm' }),
    Object.freeze({ id: 'door', title: 'Dveře', context: 'Výška dveří byla naměřena jako', lengthMm: 2000, from: 'm', to: 'cm' }),
    Object.freeze({ id: 'board', title: 'Tabule', context: 'Šířka tabule byla naměřena jako', lengthMm: 2400, from: 'm', to: 'mm' }),
    Object.freeze({ id: 'corridor', title: 'Chodba', context: 'Délka chodby byla naměřena jako', lengthMm: 12500, from: 'm', to: 'cm' }),
    Object.freeze({ id: 'cable', title: 'Kabel', context: 'Délku kabelu jsi zapsal jako', lengthMm: 750, from: 'cm', to: 'm' }),
    Object.freeze({ id: 'rope', title: 'Lano', context: 'Délka lana byla naměřena jako', lengthMm: 3500, from: 'cm', to: 'm' }),
    Object.freeze({ id: 'playground-line', title: 'Čára na hřišti', context: 'Délka vyznačené čáry byla', lengthMm: 8600, from: 'm', to: 'mm' }),
  ]);

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

  function parseDecimal(value) {
    const normalized = String(value ?? '').trim().replace(',', '.');
    if (!normalized || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return NaN;
    return Number(normalized);
  }

  function valueInUnit(lengthMm, unit) {
    return lengthMm / UNITS[unit].factorMm;
  }

  function formatValue(value) {
    return String(Number(value.toFixed(6))).replace('.', ',');
  }

  function ruleFor(from, to) {
    return RULES.find((rule) => rule.from === from && rule.to === to) || null;
  }

  function generateTask(seed) {
    const random = mulberry32(seed);
    const task = TASKS[Math.floor(random() * TASKS.length)];
    const sourceValue = valueInUnit(task.lengthMm, task.from);
    const expectedValue = valueInUnit(task.lengthMm, task.to);
    const rule = ruleFor(task.from, task.to);
    return Object.freeze({
      ...task,
      seed,
      sourceValue,
      expectedValue,
      sourceText: formatValue(sourceValue),
      expectedText: formatValue(expectedValue),
      ruleCode: rule.code,
    });
  }

  function classifyWrongValue(task, answerValue) {
    if (!Number.isFinite(answerValue)) return 'answer.invalid';
    if (Math.abs(answerValue - task.sourceValue) < 1e-9) return 'conversion.unchanged';

    const rule = ruleFor(task.from, task.to);
    const opposite = rule.operation === 'divide'
      ? task.sourceValue * rule.factor
      : task.sourceValue / rule.factor;
    if (Math.abs(answerValue - opposite) < 1e-9) return 'conversion.direction';

    const scaleFactors = [10, 100, 1000];
    for (const scale of scaleFactors) {
      if (Math.abs(answerValue - task.expectedValue * scale) < 1e-9 || Math.abs(answerValue - task.expectedValue / scale) < 1e-9) {
        return 'conversion.scale_factor';
      }
    }
    return 'conversion.value';
  }

  function evaluate(task, answerText, ruleCode) {
    const answerValue = parseDecimal(answerText);
    const numericCorrect = Number.isFinite(answerValue) && Math.abs(answerValue - task.expectedValue) < 1e-9;
    const ruleCorrect = ruleCode === task.ruleCode;

    let code = 'correct';
    if (!numericCorrect) code = classifyWrongValue(task, answerValue);
    else if (!ruleCode) code = 'reason.missing';
    else if (!ruleCorrect) code = 'reason.wrong';

    return Object.freeze({
      correct: numericCorrect && ruleCorrect,
      code,
      numericCorrect,
      ruleCorrect,
      answerValue,
      expectedValue: task.expectedValue,
      expectedText: task.expectedText,
      expectedRule: ruleFor(task.from, task.to),
    });
  }

  globalThis.ConversionLabGame = Object.freeze({
    UNITS,
    RULES,
    TASKS,
    parseDecimal,
    valueInUnit,
    formatValue,
    ruleFor,
    generateTask,
    evaluate,
  });
})();
