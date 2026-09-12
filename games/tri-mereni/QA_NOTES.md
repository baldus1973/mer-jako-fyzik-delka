# QA – FY-06-HRA-01-M6 Tři měření

Stav: `TEACHING_READY_STANDALONE`

## Model a fyzika

- Regresní sweep: `PASS 5000 seedů` přes 6 objektů a 6 vzorů měření.
- Aritmetický průměr je konzistentní pro všechny generované stavy.
- Diagnostika rozlišuje součet místo průměru, největší/nejmenší hodnotu, opsání jednoho měření a obecně chybný průměr.
- Správné vysvětlení: opakované měření pomáhá omezit vliv drobných náhodných odchylek; hra netvrdí, že průměrování odstraní systematickou chybu nebo zaručí přesnou skutečnou hodnotu.

## Browser QA

Dne 2026-09-12 byl po accessibility opravě proveden plný mobilní browser průchod nad aktuálním UI se seedem `60106`:

- Guma: `54 mm`, `57 mm`, `57 mm`,
- průměr `56 mm`,
- vysvětlení `Opakované měření pomáhá omezit vliv drobných náhodných odchylek měření.`,
- výsledek: `Správně`, `Další úloha` povolena, mastery `1/3 bez nápovědy`,
- viewport 390×844: `innerWidth=390`, `document.scrollWidth=390`.

## Přístupnost

Výběr vysvětlení používá běžné HTML buttony s `aria-pressed` uvnitř `role=group`.

Ověřeno skutečným keyboard browser testem:
- žádný prvek `role=radio`,
- mezerník aktivuje fokusované tlačítko,
- zvolená možnost má `aria-pressed=true`,
- po překreslení zůstává fokus na zvolené možnosti,
- `:focus-visible` má viditelný 3px obrys,
- vstup lze potvrdit Enterem,
- žádný drag ani časový limit,
- význam není nesen pouze barvou.

## QA stav

- `PHYSICS_QA=PASS_MODEL_5000_SEEDS`
- `CURRICULUM_QA=PASS`
- `LEARNING_QA=PASS`
- `MECHANIC_QA=PASS`
- `FEEDBACK_QA=PASS_BROWSER`
- `ACCESSIBILITY_QA=PASS_BROWSER`
- `SAFETY_PRIVACY_QA=PASS`
- `RIGHTS_QA=PASS`
- `VISUAL_QA=NOT_REQUIRED_FOR_EXACT_GEOMETRY`
- `TECHNICAL_QA=PASS_BROWSER_AND_MODEL`
- `HUB_COMPAT_QA=UNVERIFIED`

Nic nebylo mergováno ani publikováno.
