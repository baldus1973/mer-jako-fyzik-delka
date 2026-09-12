# QA – Mise 1: Vyber správné měřidlo

## Stav
`TEACHING_READY_STANDALONE`

HUB kompatibilita není tímto potvrzena; `HUB_COMPAT_QA = UNVERIFIED`.

## Model
- deterministický sweep 5 000 seedů: PASS,
- generuje se všech 11 situačních typů,
- 4 měřidla,
- správná kombinace měřidlo + důvod je vždy přijata,
- chybový důvod je diagnostikován.

## Browser QA
Testováno na přesné kopii souborů větve `feature/hra-vyber-meridlo` v izolovaném browser sandboxu.

### Funkční flow
Seed `60101` -> úloha `Délka lavice`:
- 30cm pravítko -> správně diagnostikováno `Měřidlo je příliš krátké`,
- svinovací metr 5 m + správný důvod -> `Správně`,
- první správný pokus bez nápovědy -> progress `1/3 bez nápovědy`.

### Diagnostické větve modelu
Ověřeny kódy:
- `instrument.range_short`,
- `instrument.too_coarse`,
- `instrument.not_flexible`,
- `instrument.wrong_use`,
- `reason.wrong`.

### Přístupnost
- všechny hlavní akce jsou standardní HTML buttony,
- žádný drag,
- žádný časový limit,
- nápověda přepíná `aria-expanded`,
- důvody používají `role=radio` a `aria-checked`,
- význam není pouze barevný.

### Responzivita
Mobil 390×844:
- `document.documentElement.scrollWidth = 390`,
- `window.innerWidth = 390`,
- herní shell 374 px,
- žádný horizontální overflow celé stránky.

Tabule 1920×1080:
- tool grid šířka 1380 px,
- rozložení používá 4 sloupce.

Desktop 1440×900:
- nápověda otevřena a čitelná,
- screenshot browseru vytvořen.

## Výsledek gate
- PHYSICS_QA = PASS_MODEL_5000_SEEDS
- CURRICULUM_QA = PASS
- LEARNING_QA = PASS
- MECHANIC_QA = PASS
- FEEDBACK_QA = PASS_BROWSER
- ACCESSIBILITY_QA = PASS_BROWSER
- SAFETY_PRIVACY_QA = PASS
- RIGHTS_QA = PASS
- TECHNICAL_QA = PASS_BROWSER
- VISUAL_QA = NOT_REQUIRED_FOR_EXACT_GEOMETRY
- HUB_COMPAT_QA = UNVERIFIED

Nic nebylo mergováno ani publikováno.
