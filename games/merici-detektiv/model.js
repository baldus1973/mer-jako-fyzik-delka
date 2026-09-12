(() => {
  'use strict';

  const CASES = Object.freeze([
    Object.freeze({
      id: 'tool-range',
      skillTag: 'instrument_choice',
      misconceptionTag: 'TOOL_SELECTION',
      title: 'Případ 1 · Lavice',
      report: 'Lavice je dlouhá asi 120 cm. Žák zvolil školní pravítko 30 cm a tvrdí, že je to nejvhodnější měřidlo.',
      diagnosisCode: 'range_short',
      diagnosisOptions: Object.freeze([
        Object.freeze({ code: 'range_short', text: 'Měřidlo má pro tento úkol příliš malý rozsah.' }),
        Object.freeze({ code: 'zero_alignment', text: 'Hlavní problém je, že není srovnaná nulová značka.' }),
        Object.freeze({ code: 'unit_missing', text: 'Hlavní problém je chybějící značka jednotky.' }),
      ]),
      repairCode: 'tape_5m',
      repairOptions: Object.freeze([
        Object.freeze({ code: 'tape_5m', text: 'Použít například svinovací metr 5 m s dostatečným rozsahem.' }),
        Object.freeze({ code: 'ruler_repeat', text: 'Nechat pravítko 30 cm a pouze měřit co nejrychleji po částech.' }),
        Object.freeze({ code: 'estimate_only', text: 'Měření vynechat a délku jen odhadnout.' }),
      ]),
      hint: 'Porovnej očekávanou délku lavice s rozsahem měřidla.',
      explanation: 'Rozsah školního pravítka 30 cm je výrazně menší než délka lavice. Pro přímé měření je vhodnější delší měřidlo, například svinovací metr.',
    }),
    Object.freeze({
      id: 'smallest-division',
      skillTag: 'scale_division',
      misconceptionTag: 'SMALLEST_DIVISION_ERROR',
      title: 'Případ 2 · Stupnice',
      report: 'Mezi 0 mm a 10 mm jsou značky po 2 mm: 0, 2, 4, 6, 8, 10. Žák tvrdí, že nejmenší dílek je 5 mm, protože mezi 0 a 10 napočítal pět mezer.',
      diagnosisCode: 'division_value',
      diagnosisOptions: Object.freeze([
        Object.freeze({ code: 'division_value', text: 'Chybně určil hodnotu nejmenšího dílku.' }),
        Object.freeze({ code: 'tool_range', text: 'Použité měřidlo má příliš malý rozsah.' }),
        Object.freeze({ code: 'conversion', text: 'Jde hlavně o chybný převod jednotek.' }),
      ]),
      repairCode: '2mm',
      repairOptions: Object.freeze([
        Object.freeze({ code: '2mm', text: 'Nejmenší dílek je 2 mm, protože 10 mm ÷ 5 mezer = 2 mm.' }),
        Object.freeze({ code: '5mm', text: 'Nejmenší dílek je 5 mm, protože je pět mezer.' }),
        Object.freeze({ code: '10mm', text: 'Nejmenší dílek je 10 mm, protože stupnice končí na 10.' }),
      ]),
      hint: 'Hodnotu intervalu vyděl počtem stejných mezer, ne počtem značek.',
      explanation: 'Od 0 do 10 mm je pět stejných mezer. Hodnota jedné mezery je 10 mm ÷ 5 = 2 mm.',
    }),
    Object.freeze({
      id: 'zero-alignment',
      skillTag: 'zero_alignment',
      misconceptionTag: 'ZERO_ALIGNMENT',
      title: 'Případ 3 · Nula',
      report: 'Začátek proužku papíru leží na značce 4 mm místo na nulové značce. Žák tvrdí, že pravítko přiložil správně k nule.',
      diagnosisCode: 'zero_alignment',
      diagnosisOptions: Object.freeze([
        Object.freeze({ code: 'zero_alignment', text: 'Začátek předmětu není srovnaný s nulovou značkou.' }),
        Object.freeze({ code: 'wrong_tick', text: 'Hlavní problém je hodnota nejmenšího dílku.' }),
        Object.freeze({ code: 'average', text: 'Měl provést tři měření a spočítat průměr.' }),
      ]),
      repairCode: 'move_zero',
      repairOptions: Object.freeze([
        Object.freeze({ code: 'move_zero', text: 'Posunout pravítko tak, aby nulová značka ležela u začátku předmětu.' }),
        Object.freeze({ code: 'use_end', text: 'Nechat pravítko a považovat odečet na konci přímo za délku.' }),
        Object.freeze({ code: 'change_unit', text: 'Pouze změnit mm na cm; poloha pravítka nevadí.' }),
      ]),
      hint: 'Při klasickém měření od nuly musí nulová značka odpovídat začátku předmětu.',
      explanation: 'Při měření od nuly se nulová značka stupnice musí krýt se začátkem měřeného předmětu.',
    }),
    Object.freeze({
      id: 'offset-length',
      skillTag: 'offset_reading',
      misconceptionTag: 'END_IS_LENGTH',
      title: 'Případ 4 · Poškozený začátek pravítka',
      report: 'Předmět začíná na 23 mm a končí na 91 mm. Žák zapíše délku 91 mm.',
      diagnosisCode: 'end_is_length',
      diagnosisOptions: Object.freeze([
        Object.freeze({ code: 'end_is_length', text: 'Zaměnil odečet na konci za délku předmětu.' }),
        Object.freeze({ code: 'unit_missing', text: 'Jediná chyba je, že chybí jednotka.' }),
        Object.freeze({ code: 'range_short', text: 'Měřidlo má nedostatečný rozsah.' }),
      ]),
      repairCode: '68mm',
      repairOptions: Object.freeze([
        Object.freeze({ code: '68mm', text: 'Délka je 91 mm − 23 mm = 68 mm.' }),
        Object.freeze({ code: '91mm', text: 'Délka je 91 mm, protože tam předmět končí.' }),
        Object.freeze({ code: '114mm', text: 'Délka je 91 mm + 23 mm = 114 mm.' }),
      ]),
      hint: 'Když předmět nezačíná na nule, délku získáš z rozdílu dvou odečtů.',
      explanation: 'Délka je rozdíl koncového a počátečního odečtu: 91 mm − 23 mm = 68 mm.',
    }),
    Object.freeze({
      id: 'conversion',
      skillTag: 'unit_conversion',
      misconceptionTag: 'CONVERSION_DIRECTION',
      title: 'Případ 5 · Převod',
      report: 'Naměřená délka je 560 mm. Žák ji zapíše jako 560 cm.',
      diagnosisCode: 'conversion_direction',
      diagnosisOptions: Object.freeze([
        Object.freeze({ code: 'conversion_direction', text: 'Při převodu na větší jednotku nezměnil číselnou hodnotu.' }),
        Object.freeze({ code: 'average', text: 'Měl nejdřív spočítat průměr tří měření.' }),
        Object.freeze({ code: 'zero_alignment', text: 'Jde především o špatné srovnání nuly.' }),
      ]),
      repairCode: '56cm',
      repairOptions: Object.freeze([
        Object.freeze({ code: '56cm', text: '560 mm = 56 cm, protože 1 cm = 10 mm.' }),
        Object.freeze({ code: '560cm', text: '560 mm = 560 cm, číslo se při převodu nemění.' }),
        Object.freeze({ code: '5600cm', text: '560 mm = 5600 cm, protože násobím deseti.' }),
      ]),
      hint: 'Centimetr je větší jednotka než milimetr. Při stejné délce proto musí být číselná hodnota v cm menší.',
      explanation: 'Protože 1 cm = 10 mm, při převodu z mm na cm dělíme deseti: 560 mm = 56 cm.',
    }),
    Object.freeze({
      id: 'repeated-average',
      skillTag: 'repeated_measurement',
      misconceptionTag: 'AVERAGE_ERROR',
      title: 'Případ 6 · Tři měření',
      report: 'Tři výsledky jsou 84 mm, 85 mm a 86 mm. Žák jako výsledek zvolí 86 mm, protože je to největší naměřená hodnota.',
      diagnosisCode: 'largest_not_average',
      diagnosisOptions: Object.freeze([
        Object.freeze({ code: 'largest_not_average', text: 'Použil největší hodnotu místo aritmetického průměru.' }),
        Object.freeze({ code: 'conversion', text: 'Jde hlavně o chybný převod jednotek.' }),
        Object.freeze({ code: 'zero_alignment', text: 'Všechna tři měření jsou neplatná, protože nezačínají na nule.' }),
      ]),
      repairCode: '85mm',
      repairOptions: Object.freeze([
        Object.freeze({ code: '85mm', text: 'Průměr je (84 + 85 + 86) ÷ 3 = 85 mm.' }),
        Object.freeze({ code: '86mm', text: 'Správný výsledek je největší hodnota 86 mm.' }),
        Object.freeze({ code: '255mm', text: 'Správný výsledek je součet 255 mm.' }),
      ]),
      hint: 'Pro průměr použij všechna tři měření: součet vyděl počtem měření.',
      explanation: 'Aritmetický průměr je (84 + 85 + 86) ÷ 3 = 85 mm. Opakování pomáhá omezit vliv drobných náhodných odchylek.',
    }),
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

  function generateSeries(seed) {
    const random = mulberry32(seed);
    const series = CASES.slice();
    for (let i = series.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [series[i], series[j]] = [series[j], series[i]];
    }
    return Object.freeze(series);
  }

  function evaluate(caseData, diagnosisCode, repairCode) {
    const diagnosisCorrect = diagnosisCode === caseData.diagnosisCode;
    const repairCorrect = repairCode === caseData.repairCode;
    let code = 'correct';
    if (!diagnosisCode) code = 'diagnosis.missing';
    else if (!diagnosisCorrect) code = 'diagnosis.wrong';
    else if (!repairCode) code = 'repair.missing';
    else if (!repairCorrect) code = 'repair.wrong';
    return Object.freeze({
      correct: diagnosisCorrect && repairCorrect,
      code,
      diagnosisCorrect,
      repairCorrect,
      explanation: caseData.explanation,
      skillTag: caseData.skillTag,
      misconceptionTag: caseData.misconceptionTag,
    });
  }

  globalThis.MeasurementDetectiveGame = Object.freeze({ CASES, generateSeries, evaluate });
})();
