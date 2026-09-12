(() => {
  'use strict';

  const OBJECTS = Object.freeze([
    Object.freeze({ id: 'screw', title: 'Šroubek', baseMm: 40, situation: 'Třikrát změříš délku stejného šroubku.' }),
    Object.freeze({ id: 'eraser', title: 'Guma', baseMm: 56, situation: 'Třikrát změříš délku stejné gumy.' }),
    Object.freeze({ id: 'key', title: 'Klíč', baseMm: 74, situation: 'Třikrát změříš délku stejného klíče.' }),
    Object.freeze({ id: 'strip', title: 'Proužek papíru', baseMm: 85, situation: 'Třikrát změříš délku stejného proužku papíru.' }),
    Object.freeze({ id: 'pencil', title: 'Pastelka', baseMm: 170, situation: 'Třikrát změříš délku stejné pastelky.' }),
    Object.freeze({ id: 'notebook', title: 'Sešit', baseMm: 210, situation: 'Třikrát změříš šířku stejného sešitu.' }),
  ]);

  const PATTERNS = Object.freeze([
    Object.freeze({ id: 'sym1', offsets: Object.freeze([-1, 0, 1]) }),
    Object.freeze({ id: 'sym2', offsets: Object.freeze([-2, 0, 2]) }),
    Object.freeze({ id: 'low_pair', offsets: Object.freeze([-1, -1, 2]) }),
    Object.freeze({ id: 'high_pair', offsets: Object.freeze([-2, 1, 1]) }),
    Object.freeze({ id: 'wide', offsets: Object.freeze([-3, 0, 3]) }),
    Object.freeze({ id: 'skew', offsets: Object.freeze([-2, -2, 4]) }),
  ]);

  const REASONS = Object.freeze([
    Object.freeze({ code: 'random_variation', text: 'Opakované měření pomáhá omezit vliv drobných náhodných odchylek měření.' }),
    Object.freeze({ code: 'object_changes', text: 'Předmět při každém měření mění svoji skutečnou délku.' }),
    Object.freeze({ code: 'take_largest', text: 'Vícekrát měříme proto, abychom vybrali největší naměřenou hodnotu.' }),
    Object.freeze({ code: 'remove_all_error', text: 'Tři měření zaručí, že ve výsledku už nemůže být žádná chyba.' }),
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

  function average(values) {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  function generateTask(seed) {
    const random = mulberry32(seed);
    const object = OBJECTS[Math.floor(random() * OBJECTS.length)];
    const pattern = PATTERNS[Math.floor(random() * PATTERNS.length)];
    const readingsMm = pattern.offsets.map((offset) => object.baseMm + offset);
    return Object.freeze({
      seed,
      id: `${object.id}:${pattern.id}`,
      objectId: object.id,
      patternId: pattern.id,
      title: object.title,
      situation: object.situation,
      readingsMm: Object.freeze(readingsMm),
      expectedAverageMm: average(readingsMm),
      reasonCode: 'random_variation',
    });
  }

  function parseNumber(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    const normalized = String(value ?? '').trim().replace(',', '.');
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function getReason(code) {
    return REASONS.find((reason) => reason.code === code) || null;
  }

  function closeEnough(a, b) {
    return Math.abs(a - b) < 1e-9;
  }

  function evaluate(task, answerValue, reasonCode) {
    const answer = parseNumber(answerValue);
    const expected = task.expectedAverageMm;
    const sum = task.readingsMm.reduce((acc, value) => acc + value, 0);
    const max = Math.max(...task.readingsMm);
    const min = Math.min(...task.readingsMm);
    const reasonCorrect = reasonCode === task.reasonCode;

    let code = 'correct';
    if (answer === null) code = 'answer.invalid';
    else if (!closeEnough(answer, expected)) {
      if (closeEnough(answer, sum)) code = 'answer.sum_not_average';
      else if (closeEnough(answer, max)) code = 'answer.largest';
      else if (closeEnough(answer, min)) code = 'answer.smallest';
      else if (task.readingsMm.some((value) => closeEnough(answer, value))) code = 'answer.single_reading';
      else code = 'answer.wrong_average';
    } else if (!reasonCode) code = 'reason.missing';
    else if (!reasonCorrect) code = 'reason.wrong';

    return Object.freeze({
      correct: closeEnough(answer ?? NaN, expected) && reasonCorrect,
      code,
      answer,
      expectedAverageMm: expected,
      expectedReason: getReason(task.reasonCode),
      chosenReason: getReason(reasonCode),
    });
  }

  globalThis.RepeatedMeasurementGame = Object.freeze({
    OBJECTS,
    PATTERNS,
    REASONS,
    average,
    generateTask,
    parseNumber,
    getReason,
    evaluate,
  });
})();
