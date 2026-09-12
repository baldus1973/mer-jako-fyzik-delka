# QA – FY-06-HRA-01-M5 Převodní laboratoř

Stav: `TEACHING_READY_STANDALONE`

## Model a fyzika

- Regresní sweep: `PASS 5000 seeds; tasks=15; rules=6`.
- Pokryto všech 15 kontextů a všech 6 směrů převodu mm↔cm↔m.
- Kanonická fyzikální délka je držena v mm; mění se pouze číselné vyjádření v cílové jednotce.
- Ověřena diagnostika nezměněné hodnoty, opačného směru, chybného faktoru, obecně chybné hodnoty a chybného zdůvodnění.
- Přijímá desetinnou čárku i tečku.

## Browser QA

Původní funkční smoke test ověřil správný převod a mastery. Po accessibility opravě byl 2026-09-12 proveden nový plný mobilní browser průchod nad aktuálním UI se seedem `60106`:

- úloha: Šroubek, `42 mm → cm`,
- odpověď `4,2` + pravidlo `1 cm = 10 mm, proto při převodu mm → cm dělím 10`,
- výsledek: `Správně`, `Další úloha` povolena, mastery `1/3 bez nápovědy`,
- viewport 390×844: `innerWidth=390`, `document.scrollWidth=390`.

## Přístupnost

Původní custom radio semantics byly odstraněny. Výběr pravidla používá běžné HTML buttony s `aria-pressed` uvnitř `role=group`.

Ověřeno skutečným keyboard browser testem:
- žádný prvek `role=radio`,
- mezerník aktivuje fokusované tlačítko,
- právě zvolená volba má `aria-pressed=true`,
- po překreslení seznamu fokus zůstává na zvolené možnosti,
- `:focus-visible` má viditelný 3px obrys,
- žádný drag ani časový limit,
- význam není nesen jen barvou.

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
