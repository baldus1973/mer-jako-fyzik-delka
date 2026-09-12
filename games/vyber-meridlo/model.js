(() => {
  'use strict';

  const INSTRUMENTS = Object.freeze([
    Object.freeze({
      id: 'ruler_30cm',
      name: 'Školní pravítko 30 cm',
      rangeMm: 300,
      resolutionMm: 1,
      modes: Object.freeze(['small_straight']),
      spec: 'rozsah 30 cm · nejmenší dílek 1 mm',
    }),
    Object.freeze({
      id: 'tape_5m',
      name: 'Svinovací metr 5 m',
      rangeMm: 5000,
      resolutionMm: 1,
      modes: Object.freeze(['medium_straight']),
      spec: 'rozsah 5 m · nejmenší dílek 1 mm',
    }),
    Object.freeze({
      id: 'tailor_150cm',
      name: 'Krejčovský metr 150 cm',
      rangeMm: 1500,
      resolutionMm: 1,
      modes: Object.freeze(['flexible']),
      spec: 'rozsah 150 cm · ohebný · nejmenší dílek 1 mm',
    }),
    Object.freeze({
      id: 'survey_20m',
      name: 'Měřicí pásmo 20 m',
      rangeMm: 20000,
      resolutionMm: 10,
      modes: Object.freeze(['long_distance']),
      spec: 'rozsah 20 m · nejmenší dílek 1 cm',
    }),
  ]);

  const TASKS = Object.freeze([
    Object.freeze({ id: 'pencil', title: 'Délka pastelky', situation: 'Potřebuješ změřit délku pastelky přibližně 17 cm s přesností na milimetry.', spanMm: 170, maxResolutionMm: 1, mode: 'small_straight', correctInstrumentId: 'ruler_30cm', reasonCode: 'small_precision' }),
    Object.freeze({ id: 'screw', title: 'Délka šroubku', situation: 'Potřebuješ změřit šroubek dlouhý asi 4 cm a odečíst výsledek po milimetrech.', spanMm: 40, maxResolutionMm: 1, mode: 'small_straight', correctInstrumentId: 'ruler_30cm', reasonCode: 'small_precision' }),
    Object.freeze({ id: 'notebook', title: 'Šířka sešitu', situation: 'Změř šířku školního sešitu asi 21 cm po milimetrech.', spanMm: 210, maxResolutionMm: 1, mode: 'small_straight', correctInstrumentId: 'ruler_30cm', reasonCode: 'small_precision' }),
    Object.freeze({ id: 'desk', title: 'Délka lavice', situation: 'Potřebuješ změřit lavici dlouhou asi 120 cm po milimetrech.', spanMm: 1200, maxResolutionMm: 1, mode: 'medium_straight', correctInstrumentId: 'tape_5m', reasonCode: 'medium_range' }),
    Object.freeze({ id: 'door', title: 'Výška dveří', situation: 'Změř výšku dveří přibližně 2 m. Výsledek chceš odečíst po milimetrech.', spanMm: 2000, maxResolutionMm: 1, mode: 'medium_straight', correctInstrumentId: 'tape_5m', reasonCode: 'medium_range' }),
    Object.freeze({ id: 'board', title: 'Šířka tabule', situation: 'Potřebuješ změřit tabuli širokou asi 2,4 m po milimetrech.', spanMm: 2400, maxResolutionMm: 1, mode: 'medium_straight', correctInstrumentId: 'tape_5m', reasonCode: 'medium_range' }),
    Object.freeze({ id: 'waist', title: 'Obvod pasu', situation: 'Potřebuješ změřit obvod pasu asi 80 cm. Měřidlo musí tělo obepnout.', spanMm: 800, maxResolutionMm: 1, mode: 'flexible', correctInstrumentId: 'tailor_150cm', reasonCode: 'flexible_shape' }),
    Object.freeze({ id: 'bottle', title: 'Obvod lahve', situation: 'Změř obvod lahve přibližně 25 cm. Měřidlo musí kopírovat její zakřivený povrch.', spanMm: 250, maxResolutionMm: 1, mode: 'flexible', correctInstrumentId: 'tailor_150cm', reasonCode: 'flexible_shape' }),
    Object.freeze({ id: 'tree', title: 'Obvod kmene', situation: 'Potřebuješ změřit obvod menšího kmene asi 1,1 m po milimetrech.', spanMm: 1100, maxResolutionMm: 1, mode: 'flexible', correctInstrumentId: 'tailor_150cm', reasonCode: 'flexible_shape' }),
    Object.freeze({ id: 'playground', title: 'Délka hřiště', situation: 'Potřebuješ změřit stranu hřiště dlouhou asi 12 m. Přesnost na centimetry stačí.', spanMm: 12000, maxResolutionMm: 10, mode: 'long_distance', correctInstrumentId: 'survey_20m', reasonCode: 'long_range' }),
    Object.freeze({ id: 'corridor', title: 'Délka chodby', situation: 'Změř chodbu dlouhou asi 16 m. Stačí odečítat po centimetrech.', spanMm: 16000, maxResolutionMm: 10, mode: 'long_distance', correctInstrumentId: 'survey_20m', reasonCode: 'long_range' }),
  ]);

  const REASONS = Object.freeze([
    Object.freeze({ code: 'small_precision', text: 'Malý rovný předmět se vejde do 30 cm a potřebuji odečet po 1 mm.' }),
    Object.freeze({ code: 'medium_range', text: 'Předmět je delší než 30 cm, ale vejde se do 5 m; potřebuji odečet po 1 mm.' }),
    Object.freeze({ code: 'flexible_shape', text: 'Měřidlo musí být ohebné, aby obepnulo zakřivený předmět nebo tělo.' }),
    Object.freeze({ code: 'long_range', text: 'Vzdálenost je delší než 5 m; potřebuji dlouhé pásmo a centimetry stačí.' }),
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

  function generateTask(seed) {
    const random = mulberry32(seed);
    const task = TASKS[Math.floor(random() * TASKS.length)];
    return Object.freeze({ ...task, seed });
  }

  function getInstrument(id) {
    return INSTRUMENTS.find((instrument) => instrument.id === id) || null;
  }

  function getReason(code) {
    return REASONS.find((reason) => reason.code === code) || null;
  }

  function suitability(task, instrument) {
    if (!instrument) return Object.freeze({ suitable: false, code: 'instrument.missing' });
    if (instrument.rangeMm < task.spanMm) return Object.freeze({ suitable: false, code: 'instrument.range_short' });
    if (instrument.resolutionMm > task.maxResolutionMm) return Object.freeze({ suitable: false, code: 'instrument.too_coarse' });
    if (!instrument.modes.includes(task.mode)) return Object.freeze({ suitable: false, code: task.mode === 'flexible' ? 'instrument.not_flexible' : 'instrument.wrong_use' });
    return Object.freeze({ suitable: true, code: 'instrument.suitable' });
  }

  function evaluate(task, answers) {
    const instrument = getInstrument(answers.instrumentId);
    const fit = suitability(task, instrument);
    const instrumentCorrect = answers.instrumentId === task.correctInstrumentId;
    const reasonCorrect = answers.reasonCode === task.reasonCode;

    let code = 'correct';
    if (!instrument) code = 'instrument.missing';
    else if (!fit.suitable) code = fit.code;
    else if (!instrumentCorrect) code = 'instrument.not_best';
    else if (!answers.reasonCode) code = 'reason.missing';
    else if (!reasonCorrect) code = 'reason.wrong';

    return Object.freeze({
      correct: instrumentCorrect && reasonCorrect,
      code,
      instrumentCorrect,
      reasonCorrect,
      expectedInstrument: getInstrument(task.correctInstrumentId),
      expectedReason: getReason(task.reasonCode),
      chosenInstrument: instrument,
    });
  }

  globalThis.ToolChoiceGame = Object.freeze({
    INSTRUMENTS,
    TASKS,
    REASONS,
    generateTask,
    getInstrument,
    getReason,
    suitability,
    evaluate,
  });
})();
